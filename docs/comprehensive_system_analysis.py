
import json
import os
import re
from collections import defaultdict

def load_json_data(filepath):
    with open(filepath, 'r') as f:
        return json.load(f)

def analyze_structure(data):
    tables = {} 
    
    for item in data:
        section = item.get('section')
        table = item.get('table_name')
        name = item.get('name')
        details_str = item.get('details')
        
        try:
            details = json.loads(details_str) if details_str else {}
        except:
            details = {"raw": details_str}

        if section == '02_TABLE_META':
            if table not in tables:
                tables[table] = {'description': '', 'columns': {}, 'details': details}
            # Merge details if already exists (rare case)
            elif not tables[table]['details']:
                 tables[table]['details'] = details
        
        elif section == '05_COLUMN':
            if table not in tables:
                # Should have been created by TABLE_META but just in case
                tables[table] = {'description': '', 'columns': {}, 'details': {}}
            tables[table]['columns'][name] = details

    return tables

def scan_codebase_smart(root_dirs, tables_info):
    """
    Scans codebase using a 'Co-occurrence' heuristic.
    A column is considered 'used' if it appears in a file that ALSO contains its table name.
    Unique column names (not in common_ignore) are also searched globally as a fallback.
    """
    
    table_usage = defaultdict(int)
    column_usage = defaultdict(int)
    
    common_cols = {'id', 'created_at', 'updated_at', 'user_id', 'uuid', 'metadata'}
    
    file_contents = []
    
    print("Loading file contents...")
    for root_dir in root_dirs:
        abs_root_dir = os.path.join(os.getcwd(), root_dir)
        if not os.path.exists(abs_root_dir):
            continue
            
        for root, dirs, files in os.walk(abs_root_dir):
            if 'node_modules' in dirs: dirs.remove('node_modules')
            if '.git' in dirs: dirs.remove('.git')
            
            for file in files:
                if not (file.endswith('.tsx') or file.endswith('.ts') or file.endswith('.js') or file.endswith('.jsx')):
                    continue
                    
                path = os.path.join(root, file)
                try:
                    with open(path, 'r', encoding='utf-8') as f:
                        content = f.read()
                        file_contents.append(content)
                except:
                    pass
    
    print(f"Scanned {len(file_contents)} files. analyzing usage...")

    for table, info in tables_info.items():
        relevant_files = [] 
        
        for content in file_contents:
            if table in content:
                table_usage[table] += 1
                relevant_files.append(content)
        
        for col in info['columns']:
            found_in_context = False
            for content in relevant_files:
                if col in content:
                    column_usage[f"{table}.{col}"] += 1
                    found_in_context = True
            
            if not found_in_context and col not in common_cols:
                count_global = 0
                for content in file_contents:
                    if col in content:
                        count_global += 1
                
                if count_global > 0:
                     column_usage[f"{table}.{col}"] = count_global 

    return table_usage, column_usage

def generate_reports(tables, table_usage, column_usage):
    ui_report = []
    db_report = []

    # UI Report Header
    ui_report.append("# تقرير تحليل واجهة المستخدم (UI Analysis Report)\n")
    ui_report.append("يوضح هذا التقرير الفجوات بين قاعدة البيانات وكود الواجهة (Frontend/Backend).\n")
    ui_report.append("**طريقة التحليل**: يتم البحث عن اسم الجدول، ثم البحث عن أعمدته داخل الملفات التي ذكرت الجدول (سياق مرتبط)، أو البحث عنها عالميًا إذا كانت مميزة.\n")

    # DB Report Header
    db_report.append("# تقرير تحليل قاعدة البيانات (Database Analysis Report)\n")
    db_report.append("شرح تفصيلي ممل لهيكلية قاعدة البيانات.\n")

    missing_high_priority = []

    for table, info in sorted(tables.items()):
        # -- DB Section --
        db_report.append(f"## الجدول: `{table}`")
        if info['details']:
             comment = info['details'].get('description', '')
             if comment and comment != "No description":
                 db_report.append(f"**الوصف**: {comment}\n")
        
        db_report.append("| اسم العمود | النوع | Nullable | Default |")
        db_report.append("| :--- | :--- | :--- | :--- |")
        
        # -- UI Section --
        t_usage = table_usage.get(table, 0)
        is_table_used = t_usage > 0
        status_icon = "✅" if is_table_used else "⚠️"
        
        ui_report.append(f"## {status_icon} الجدول: `{table}`")
        if not is_table_used:
            ui_report.append(f"> **تنبيه**: الجدول غير مستخدم صراحة في الكود.\n")
        
        ui_report.append("| اسم العمود | الحالة | التكرار التقريبي |")
        ui_report.append("| :--- | :--- | :--- |")

        for col, col_details in sorted(info['columns'].items()):
            # DB Details
            dtype = col_details.get('type', {}).get('data_type', 'N/A')
            nullable = col_details.get('nullable', 'N/A')
            default_val = col_details.get('default', '')
            db_report.append(f"| `{col}` | {dtype} | {nullable} | {default_val} |")

            # UI Details
            usage_key = f"{table}.{col}"
            count = column_usage.get(usage_key, 0)
            
            if count > 0:
                col_status = "✅ مستخدم"
            else:
                if col in ['id', 'created_at', 'updated_at', 'metadata']:
                    col_status = "⚠️ غير موجود (نظام)"
                else:
                    col_status = "🔴 **مفقود**"
                    missing_high_priority.append(f"`{table}.{col}`")

            ui_report.append(f"| `{col}` | {col_status} | {count} |")
        
        db_report.append("\n")
        ui_report.append("\n")

    if missing_high_priority:
        ui_report.insert(3, "\n## 🚨 ملخص العناصر المفقودة (High Priority Gaps)\nهذه الأعمدة موجودة في قاعدة البيانات ولكن لم يتم العثور على استخدام صريح لها في الكود:\n" + "\n- ".join(missing_high_priority) + "\n\n---\n")

    # Save Reports
    with open('docs/REPORT_UI_GAPS.md', 'w', encoding='utf-8') as f:
        f.write('\n'.join(ui_report))
    
    with open('docs/REPORT_DB_STRUCTURE.md', 'w', encoding='utf-8') as f:
        f.write('\n'.join(db_report))
        
    print(f"Analysis Complete. Found {len(missing_high_priority)} potential gaps.")

def main():
    json_path = '/Volumes/alaaMac/Archive/qazzzzzzz/docs/database_xray_output.json'
    if not os.path.exists(json_path):
        print(f"JSON file not found at {json_path}")
        return

    data = load_json_data(json_path)
    tables = analyze_structure(data)
    
    table_usage, column_usage = scan_codebase_smart(['app', 'components', 'lib', 'utils', 'hooks'], tables)
    
    generate_reports(tables, table_usage, column_usage)

if __name__ == "__main__":
    main()
