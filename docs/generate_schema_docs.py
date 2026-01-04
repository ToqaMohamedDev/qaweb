#!/usr/bin/env python3
"""
Generate comprehensive database documentation from JSON X-Ray output.
"""

import json
from datetime import datetime
from collections import defaultdict

def load_json(filepath):
    with open(filepath, 'r') as f:
        return json.load(f)

def parse_details(details_str):
    """Parse JSON string from details field."""
    try:
        return json.loads(details_str)
    except:
        return {}

def generate_table_section(table_name, data):
    """Generate markdown section for a single table."""
    
    # Get metadata
    meta = data.get('02_TABLE_META', {}).get('storage_info', {})
    meta_details = parse_details(meta) if isinstance(meta, str) else meta
    
    # Get relationship summary
    rel = data.get('10_RELATIONSHIP_SUMMARY', {}).get('connections', {})
    rel_details = parse_details(rel) if isinstance(rel, str) else rel
    
    outgoing = rel_details.get('outgoing_fk_count', 0)
    incoming = rel_details.get('incoming_fk_count', 0)
    total = rel_details.get('total_connections', 0)
    is_isolated = rel_details.get('is_isolated', False)
    
    # Determine status
    if is_isolated:
        status = "📦 Isolated"
    elif incoming > 5:
        status = "🔵 Central Hub"
    elif incoming > 0 and outgoing > 0:
        status = "🟢 Connected"
    elif incoming > 0:
        status = "🟢 Referenced"
    else:
        status = "🟡 Leaf"
    
    md = f"\n#### 📋 Table: `{table_name}`\n\n"
    md += f"> {status} | Outgoing FKs: {outgoing} | Incoming FKs: {incoming} | Total: {total}\n\n"
    
    # Metadata section
    storage = meta_details.get('storage', {})
    rows = meta_details.get('rows', {})
    ops = meta_details.get('operations', {})
    
    md += "##### 📊 Metadata\n\n"
    md += "| Property | Value |\n|----------|-------|\n"
    md += f"| **Owner** | {meta_details.get('owner', 'postgres')} |\n"
    md += f"| **Total Size** | {storage.get('total_size', '-')} |\n"
    md += f"| **Table Size** | {storage.get('table_size', '-')} |\n"
    md += f"| **Index Size** | {storage.get('index_size', '-')} |\n"
    md += f"| **Live Rows** | {rows.get('live', 0)} |\n"
    md += f"| **Dead Rows** | {rows.get('dead', 0)} |\n"
    md += f"| **RLS Enabled** | {'✅' if meta_details.get('rls_enabled') else '❌'} |\n"
    bloat = meta_details.get('bloat_percentage')
    md += f"| **Bloat %** | {bloat if bloat else 'N/A'}% |\n"
    md += f"| **Inserts** | {ops.get('inserts', 0)} |\n"
    md += f"| **Updates** | {ops.get('updates', 0)} |\n"
    md += f"| **Deletes** | {ops.get('deletes', 0)} |\n\n"
    
    # Columns
    columns = data.get('05_COLUMN', {})
    if columns:
        md += "##### 📝 Columns\n\n"
        md += "| # | Column | Type | Nullable | Default | Description |\n"
        md += "|---|--------|------|----------|---------|-------------|\n"
        
        sorted_cols = sorted(columns.items(), key=lambda x: parse_details(x[1]).get('position', 0))
        for col_name, col_details_str in sorted_cols:
            col = parse_details(col_details_str)
            pos = col.get('position', 0)
            col_type = col.get('type', {}).get('data_type', '-')
            nullable = '✅' if col.get('nullable') else '❌'
            default = col.get('default', '-') or '-'
            if len(str(default)) > 20:
                default = str(default)[:17] + '...'
            desc = col.get('description', '') or ''
            md += f"| {pos} | `{col_name}` | {col_type} | {nullable} | {default} | {desc} |\n"
        md += "\n"
    
    # Constraints
    constraints = data.get('06_CONSTRAINT_KEY', {})
    if constraints:
        md += "##### 🔑 Constraints\n\n"
        md += "| Name | Type | Columns |\n|------|------|---------|\n"
        for const_name, const_details_str in constraints.items():
            const = parse_details(const_details_str)
            md += f"| `{const_name}` | {const.get('type', '-')} | {const.get('columns', [])} |\n"
        md += "\n"
    
    # Foreign Keys Outgoing
    fk_out = data.get('08_FK_OUTGOING', {})
    if fk_out:
        md += "##### 🔗 Foreign Keys (Outgoing)\n\n"
        md += "| FK Name | Source Column | → Target Table | On Delete |\n"
        md += "|---------|---------------|----------------|------------|\n"
        for fk_name, fk_details_str in fk_out.items():
            fk = parse_details(fk_details_str)
            src_cols = fk.get('source', {}).get('columns', [])
            tgt_table = fk.get('target', {}).get('table', '-')
            tgt_cols = fk.get('target', {}).get('columns', [])
            rules = fk.get('rules', {})
            on_delete = rules.get('on_delete', '-')
            warning = ' ⚠️' if on_delete == 'CASCADE' else ''
            md += f"| `{fk_name}` | {src_cols} | `{tgt_table}({tgt_cols})` | {on_delete}{warning} |\n"
        md += "\n"
    
    # Foreign Keys Incoming
    fk_in = data.get('09_FK_INCOMING', {})
    if fk_in:
        md += "##### 📥 Referenced By (Incoming FKs)\n\n"
        md += "| From Table | FK Name | On Delete |\n"
        md += "|------------|---------|------------|\n"
        for fk_name, fk_details_str in fk_in.items():
            fk = parse_details(fk_details_str)
            ref_table = fk.get('referenced_by', {}).get('table', '-')
            rules = fk.get('rules', {})
            on_delete = rules.get('on_delete', '-')
            warning = ' ⚠️' if on_delete == 'CASCADE' else ''
            md += f"| `{ref_table}` | `{fk_name}` | {on_delete}{warning} |\n"
        md += "\n"
    
    # Indexes
    indexes = data.get('11_INDEX', {})
    if indexes:
        md += "<details><summary><strong>🔎 Indexes</strong></summary>\n\n"
        md += "| Index Name | Method | Unique | Size | Scans |\n"
        md += "|------------|--------|--------|------|-------|\n"
        for idx_name, idx_details_str in indexes.items():
            idx = parse_details(idx_details_str)
            method = idx.get('method', '-')
            unique = '✅' if idx.get('unique') else '❌'
            size = idx.get('size', '-')
            scans = idx.get('usage_stats', {}).get('scans', 0)
            md += f"| `{idx_name}` | {method} | {unique} | {size} | {scans} |\n"
        md += "\n</details>\n\n"
    
    # RLS Policies
    policies = data.get('12_RLS_POLICY', {})
    if policies:
        md += "##### 🛡️ RLS Policies\n\n"
        md += "| Policy Name | Command | Roles | Permissive |\n"
        md += "|-------------|---------|-------|------------|\n"
        for pol_name, pol_details_str in policies.items():
            pol = parse_details(pol_details_str)
            cmd = pol.get('command', '-')
            roles = ', '.join(pol.get('roles', []))
            perm = '✅' if pol.get('permissive') else '❌'
            md += f"| `{pol_name}` | {cmd} | {roles} | {perm} |\n"
        md += "\n"
    
    # Security Status
    security = data.get('20_SECURITY_AUDIT', {}).get('security_status', {})
    if security:
        sec = parse_details(security) if isinstance(security, str) else security
        rec = sec.get('recommendations', '✅ Security configured')
        md += f"> **Security Status**: {rec}\n\n"
    
    md += "[⬆️ Back to Top](#-table-of-contents)\n\n---\n"
    
    return md

def main():
    # Load JSON
    data = load_json('database_xray_output.json')
    
    # Organize by table
    tables = defaultdict(lambda: defaultdict(dict))
    
    for item in data:
        section = item['section']
        table = item['table_name']
        name = item['name']
        details = item['details']
        tables[table][section][name] = details
    
    # Define table categories
    categories = {
        'user_profile': ['profiles', 'teacher_subscriptions', 'teacher_ratings'],
        'educational': ['educational_stages', 'subjects', 'lessons', 'lesson_questions', 'user_lesson_progress'],
        'exams': ['comprehensive_exams', 'comprehensive_exam_attempts', 'teacher_exams', 'teacher_exam_attempts'],
        'communication': ['support_chats', 'chat_messages', 'messages'],
        'notifications': ['notifications', 'notification_preferences'],
        'devices': ['user_devices', 'visitor_devices'],
        'settings': ['site_settings']
    }
    
    category_headers = {
        'user_profile': '\n### 👤 User & Profile Management\n',
        'educational': '\n### 📚 Educational Content\n',
        'exams': '\n### 📝 Exams & Assessments\n',
        'communication': '\n### 💬 Communication & Support\n',
        'notifications': '\n### 🔔 Notifications\n',
        'devices': '\n### 📱 Device Tracking\n',
        'settings': '\n### ⚙️ System Settings\n'
    }
    
    # Read existing header
    with open('database_schema_details.md', 'r') as f:
        existing = f.read()
    
    # Find where to append (after "## 📂 Tables")
    split_point = existing.find('\n### 👤 User & Profile Management')
    if split_point == -1:
        split_point = existing.find('## 📂 Tables')
        if split_point != -1:
            split_point = existing.find('\n', split_point) + 1
    
    if split_point == -1:
        # Append at end
        header = existing
    else:
        header = existing[:split_point]
    
    # Generate all table sections
    full_md = header
    
    for cat_key, cat_tables in categories.items():
        full_md += category_headers[cat_key]
        full_md += "\n---\n"
        
        for table_name in cat_tables:
            if table_name in tables:
                full_md += generate_table_section(table_name, tables[table_name])
    
    # Add footer
    full_md += f"\n\n## 📝 End of Report\n\n"
    full_md += f"> Generated on {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}\n"
    
    # Write output
    with open('database_schema_details.md', 'w') as f:
        f.write(full_md)
    
    print(f"✅ Generated documentation for {len(tables)} tables")

if __name__ == '__main__':
    main()
