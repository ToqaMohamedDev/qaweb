#!/usr/bin/env python3
"""
📊 Database Schema Documentation Generator
==========================================
Generates comprehensive Markdown documentation from database X-Ray JSON output.

Features:
- Parses new JSON-formatted output (v2.0)
- Creates organized, categorized documentation
- Includes all tables, views, functions, and security policies
"""

import json
import os
from collections import defaultdict
import datetime

# Configuration
INPUT_FILE = 'docs/database_xray_output.json'
OUTPUT_FILE = 'docs/database_schema_details.md'

def load_data():
    """Load JSON data from the X-Ray output file."""
    if not os.path.exists(INPUT_FILE):
        print(f"❌ Error: File {INPUT_FILE} not found.")
        return None
    try:
        with open(INPUT_FILE, 'r', encoding='utf-8') as f:
            return json.load(f)
    except Exception as e:
        print(f"❌ Error reading JSON: {e}")
        return None

def parse_json_details(details_str):
    """Parse JSON string from details field."""
    if not details_str:
        return {}
    try:
        return json.loads(details_str)
    except:
        # Fallback to old pipe-separated format
        return parse_pipe_details(details_str)

def parse_pipe_details(details_str):
    """Fallback parser for old pipe-separated format."""
    d = {}
    if not details_str:
        return d
    parts = details_str.split(' | ')
    for part in parts:
        if ': ' in part:
            k, v = part.split(': ', 1)
            d[k.strip()] = v.strip()
    return d

def generate_toc(all_tables, sections, views):
    """Generate table of contents."""
    toc = []
    toc.append("## 📑 Table of Contents\n")
    toc.append("### 🔧 Schema Components")
    toc.append("- [📊 Summary](#-summary)")
    toc.append("- [🧩 Extensions (الإضافات)](#-extensions-الإضافات)")
    toc.append("- [📋 ENUMs (التعدادات)](#-enums-التعدادات)")
    toc.append("- [⚙️ Functions (الدوال)](#️-functions-الدوال)")
    toc.append("- [🔢 Sequences (التسلسلات)](#-sequences-التسلسلات)")
    
    if views:
        toc.append("\n### 👁️ Views")
        for v in sorted(views):
            anchor = v.replace('_', '-')
            toc.append(f"- [{v}](#️-view-{anchor})")
    
    # Categorize tables
    categories = {
        'User & Profile Management': ['profiles', 'user_devices', 'visitor_devices'],
        'Educational Content': ['educational_stages', 'subjects', 'lessons', 'lesson_questions', 'user_lesson_progress'],
        'Exams & Attempts': ['comprehensive_exams', 'comprehensive_exam_attempts', 'teacher_exams', 'teacher_exam_attempts'],
        'Teacher Features': ['teacher_subscriptions', 'teacher_ratings'],
        'Communication & Support': ['messages', 'chat_messages', 'support_chats'],
        'Notifications': ['notifications', 'notification_preferences'],
        'System Configuration': ['site_settings']
    }
    
    toc.append("\n### 📊 Tables (الجداول)\n")
    
    for cat_name, cat_tables in categories.items():
        matching = [t for t in cat_tables if t in all_tables]
        if matching:
            emoji = "👤" if "User" in cat_name else "📖" if "Educational" in cat_name else "📝" if "Exam" in cat_name else "👨‍🏫" if "Teacher" in cat_name else "💬" if "Communication" in cat_name else "🔔" if "Notification" in cat_name else "⚙️"
            toc.append(f"#### {emoji} {cat_name}")
            for t in matching:
                anchor = t.replace('_', '-')
                toc.append(f"- [{t}](#-table-{anchor})")
    
    # Uncategorized tables
    all_categorized = set()
    for tables in categories.values():
        all_categorized.update(tables)
    uncategorized = [t for t in all_tables if t not in all_categorized]
    if uncategorized:
        toc.append("\n#### 📁 Other Tables")
        for t in sorted(uncategorized):
            anchor = t.replace('_', '-')
            toc.append(f"- [{t}](#-table-{anchor})")
    
    return toc

def main():
    data = load_data()
    if not data:
        return

    # Group by Section
    sections = defaultdict(list)
    for item in data:
        sections[item['section']].append(item)

    lines = []
    lines.append("# 📚 Database Schema Details\n")
    lines.append(f"> **🤖 Auto-generated Report**  ")
    lines.append(f"> **📅 Date**: {datetime.datetime.now().strftime('%Y-%m-%d %H:%M')}\n")
    lines.append("---\n")
    
    # Section mapping for new format (with 2-digit prefixes)
    sec_map = {
        'meta': ['02_TABLE_META', '2_TABLE_META'],
        'views': ['03_VIEW', '2B_VIEW', '2B_VIEWS'],
        'realtime': ['04_REALTIME', '2C_REALTIME'],
        'columns': ['05_COLUMN', '3_COLUMN'],
        'constraints': ['06_CONSTRAINT_KEY', '5_CONSTRAINT'],
        'checks': ['07_CONSTRAINT_CHECK', '6_CHECK'],
        'fks': ['08_FK_OUTGOING', '7_FK_OUTGOING'],
        'fks_in': ['09_FK_INCOMING', '7B_FK_INCOMING'],
        'relationships': ['10_RELATIONSHIP_SUMMARY', '7C_RELATIONSHIP_MAP'],
        'indexes': ['11_INDEX', '8_INDEX'],
        'rls': ['12_RLS_POLICY', '9_RLS'],
        'triggers': ['13_TRIGGER', '10_TRIGGER'],
        'privileges': ['16_TABLE_PRIVILEGE', '12_PRIVILEGE'],
        'storage': ['19_STORAGE_ANALYSIS'],
        'security': ['20_SECURITY_AUDIT']
    }

    # Gather tables and views
    all_tables = set()
    all_views = set()
    table_data = defaultdict(lambda: defaultdict(list))
    
    for group, sec_list in sec_map.items():
        for sec in sec_list:
            if sec in sections:
                for item in sections[sec]:
                    tname = item['table_name']
                    if group == 'views':
                        all_views.add(tname)
                    else:
                        all_tables.add(tname)
                    table_data[tname][group].append(item)
    
    # Remove views from tables
    all_tables -= all_views

    # Generate TOC
    lines.extend(generate_toc(all_tables, sections, all_views))
    lines.append("\n---\n")
    
    # ══════════════════════════════════════════════════════════════════
    # Summary Section
    # ══════════════════════════════════════════════════════════════════
    lines.append("## 📊 Summary\n")
    lines.append("| Metric | Count |")
    lines.append("|--------|-------|")
    lines.append(f"| **Total Tables** | {len(all_tables)} |")
    
    func_section = sections.get('14_FUNCTION', sections.get('11_FUNCTION', []))
    lines.append(f"| **Total Functions** | {len(func_section)} |")
    
    enum_section = sections.get('01_ENUM', sections.get('1_ENUM', []))
    lines.append(f"| **Total ENUMs** | {len(enum_section)} |")
    
    ext_section = sections.get('00_EXTENSION', sections.get('0_EXTENSION', []))
    lines.append(f"| **Total Extensions** | {len(ext_section)} |")
    
    seq_section = sections.get('15_SEQUENCE', [])
    if seq_section:
        lines.append(f"| **Total Sequences** | {len(seq_section)} |")
    
    lines.append(f"| **Total Views** | {len(all_views)} |")
    
    # Key Relationships
    lines.append("\n### 🔗 Key Relationships Overview\n")
    lines.append("| Central Table | Incoming FKs | Outgoing FKs | Description |")
    lines.append("|---------------|--------------|--------------|-------------|")
    
    relationship_data = []
    for sec in ['10_RELATIONSHIP_SUMMARY', '7C_RELATIONSHIP_MAP']:
        if sec in sections:
            for item in sections[sec]:
                d = parse_json_details(item['details'])
                incoming = d.get('incoming_fk_count', 0)
                outgoing = d.get('outgoing_fk_count', 0)
                if incoming > 0 or outgoing > 0:
                    relationship_data.append({
                        'table': item['table_name'],
                        'incoming': incoming,
                        'outgoing': outgoing,
                        'total': incoming + outgoing
                    })
    
    # Sort by total connections descending
    relationship_data.sort(key=lambda x: x['total'], reverse=True)
    for rel in relationship_data[:10]:  # Top 10
        desc = "جدول رئيسي" if rel['incoming'] > 5 else ""
        lines.append(f"| `{rel['table']}` | {rel['incoming']} | {rel['outgoing']} | {desc} |")
    
    lines.append("\n---\n")

    # ══════════════════════════════════════════════════════════════════
    # Extensions Section
    # ══════════════════════════════════════════════════════════════════
    ext_sec = sections.get('00_EXTENSION', sections.get('0_EXTENSION', []))
    if ext_sec:
        lines.append("## 🧩 Extensions (الإضافات)\n")
        lines.append("| Extension | Version | Schema | Description | Relocatable |")
        lines.append("|-----------|---------|--------|-------------|-------------|")
        for item in sorted(ext_sec, key=lambda x: x['table_name']):
            d = parse_json_details(item['details'])
            name = item['table_name']
            version = d.get('version', '-')
            schema = d.get('schema', '-')
            desc = d.get('description', '-')[:50]
            reloc = "✅" if d.get('relocatable', False) else "❌"
            lines.append(f"| `{name}` | {version} | {schema} | {desc} | {reloc} |")
        lines.append("\n[⬆️ Back to Top](#-table-of-contents)\n")
        lines.append("---\n")

    # ══════════════════════════════════════════════════════════════════
    # ENUMs Section
    # ══════════════════════════════════════════════════════════════════
    enum_sec = sections.get('01_ENUM', sections.get('1_ENUM', []))
    if enum_sec:
        lines.append("## 📋 ENUMs (التعدادات)\n")
        lines.append("| Enum Name | Value Count | Values | Schema |")
        lines.append("|-----------|-------------|--------|--------|")
        for item in sorted(enum_sec, key=lambda x: x['table_name']):
            d = parse_json_details(item['details'])
            name = item['table_name']
            count = d.get('value_count', '-')
            values = d.get('values', [])
            if isinstance(values, list):
                values_str = ', '.join(str(v) for v in values)
            else:
                values_str = str(values)
            schema = d.get('schema', 'public')
            lines.append(f"| `{name}` | {count} | [{values_str}] | {schema} |")
        lines.append("\n[⬆️ Back to Top](#-table-of-contents)\n")
        lines.append("---\n")

    # ══════════════════════════════════════════════════════════════════
    # Functions Section
    # ══════════════════════════════════════════════════════════════════
    func_sec = sections.get('14_FUNCTION', sections.get('11_FUNCTION', []))
    if func_sec:
        lines.append("## ⚙️ Functions (الدوال)\n")
        lines.append("<details><summary>Click to expand Function List</summary>\n")
        lines.append("| Function Name | Returns | Arguments | Language | Security | Volatility |")
        lines.append("|---------------|---------|-----------|----------|----------|------------|")
        for item in sorted(func_sec, key=lambda x: x['table_name']):
            d = parse_json_details(item['details'])
            name = item['table_name']
            returns = d.get('return_type', '-')
            args = d.get('arguments', '-')
            if len(args) > 40:
                args = args[:40] + "..."
            lang = d.get('language', '-')
            security = d.get('security', '-')
            volatility = d.get('volatility', '-')
            lines.append(f"| `{name}` | {returns} | {args} | {lang} | {security} | {volatility} |")
        lines.append("\n</details>\n")
        lines.append("[⬆️ Back to Top](#-table-of-contents)\n")
        lines.append("---\n")

    # ══════════════════════════════════════════════════════════════════
    # Sequences Section
    # ══════════════════════════════════════════════════════════════════
    seq_sec = sections.get('15_SEQUENCE', [])
    if seq_sec:
        lines.append("## 🔢 Sequences (التسلسلات)\n")
        lines.append("<details><summary>Click to expand Sequence List</summary>\n")
        lines.append("| Sequence Name | Data Type | Start | Min | Max | Increment | Owned By |")
        lines.append("|---------------|-----------|-------|-----|-----|-----------|----------|")
        for item in sorted(seq_sec, key=lambda x: x['table_name']):
            d = parse_json_details(item['details'])
            name = item['table_name']
            dtype = d.get('data_type', '-')
            start = d.get('start_value', '-')
            min_v = d.get('min_value', '-')
            max_v = d.get('max_value', '-')
            inc = d.get('increment', '-')
            owned = d.get('owned_by', '-')
            lines.append(f"| `{name}` | {dtype} | {start} | {min_v} | {max_v} | {inc} | {owned} |")
        lines.append("\n</details>\n")
        lines.append("[⬆️ Back to Top](#-table-of-contents)\n")
        lines.append("---\n")

    # ══════════════════════════════════════════════════════════════════
    # Views Section
    # ══════════════════════════════════════════════════════════════════
    if all_views:
        lines.append("## 👁️ Views\n")
        for view_name in sorted(all_views):
            lines.append(f"### 👁️ View: `{view_name}`\n")
            view_items = table_data[view_name].get('views', [])
            if view_items:
                d = parse_json_details(view_items[0]['details'])
                lines.append(f"- **Updatable**: {'✅' if d.get('is_updatable') == 'YES' else '❌'}")
                lines.append(f"- **Insertable**: {'✅' if d.get('is_insertable_into') == 'YES' else '❌'}")
                deps = d.get('depends_on', [])
                if deps and deps != []:
                    lines.append(f"- **Dependencies**: {', '.join(deps) if isinstance(deps, list) else deps}")
                preview = d.get('definition_preview', '')
                if preview:
                    lines.append(f"\n```sql\n{preview}\n```")
            lines.append("\n---\n")

    # ══════════════════════════════════════════════════════════════════
    # Tables Section
    # ══════════════════════════════════════════════════════════════════
    lines.append("## 📊 Tables (الجداول)\n")
    lines.append("> يحتوي هذا القسم على تفاصيل جميع الجداول في قاعدة البيانات.\n")

    for table in sorted(list(all_tables)):
        lines.append(f"\n### 📋 Table: `{table}`\n")
        
        # Realtime Status
        realtime = table_data[table].get('realtime', [])
        if realtime:
            lines.append("> ⚡ **Realtime**: ENABLED\n")
        
        # Connection Summary
        conn_map = table_data[table].get('relationships', [])
        if conn_map:
            d = parse_json_details(conn_map[0]['details'])
            incoming = d.get('incoming_fk_count', 0)
            outgoing = d.get('outgoing_fk_count', 0)
            total = d.get('total_connections', incoming + outgoing)
            isolated = d.get('is_isolated', False)
            status = "🔗 Connected" if not isolated else "📦 Isolated"
            lines.append(f"> {status} | Outgoing FKs: {outgoing} | Incoming FKs: {incoming} | Total: {total}\n")

        # ─────────────────────────────────────────────────────────────
        # Metadata
        # ─────────────────────────────────────────────────────────────
        t_meta = table_data[table].get('meta', [])
        if t_meta:
            lines.append("#### 📊 Metadata\n")
            d = parse_json_details(t_meta[0]['details'])
            
            # Storage info
            storage = d.get('storage', {})
            rows = d.get('rows', {})
            ops = d.get('operations', {})
            maint = d.get('maintenance', {})
            
            lines.append("| Property | Value |")
            lines.append("|----------|-------|")
            lines.append(f"| **Owner** | {d.get('owner', '-')} |")
            lines.append(f"| **Total Size** | {storage.get('total_size', '-')} |")
            lines.append(f"| **Table Size** | {storage.get('table_size', '-')} |")
            lines.append(f"| **Index Size** | {storage.get('index_size', '-')} |")
            lines.append(f"| **Live Rows** | {rows.get('live', 0):,} |")
            lines.append(f"| **Dead Rows** | {rows.get('dead', 0):,} |")
            lines.append(f"| **RLS Enabled** | {'✅' if d.get('rls_enabled') else '❌'} |")
            lines.append(f"| **Bloat %** | {d.get('bloat_percentage', 0)}% |")
            
            if ops:
                lines.append(f"| **Total Inserts** | {ops.get('inserts', 0):,} |")
                lines.append(f"| **Total Updates** | {ops.get('updates', 0):,} |")
                lines.append(f"| **Total Deletes** | {ops.get('deletes', 0):,} |")
            
            lines.append("")

        # ─────────────────────────────────────────────────────────────
        # Columns
        # ─────────────────────────────────────────────────────────────
        cols = table_data[table].get('columns', [])
        if cols:
            lines.append("#### 📝 Columns\n")
            lines.append("| # | Column | Type | Nullable | Default |")
            lines.append("|---|--------|------|----------|---------|")
            
            # Sort by position
            def get_position(col):
                d = parse_json_details(col['details'])
                return d.get('position', 999)
            
            seen_cols = set()
            for col in sorted(cols, key=get_position):
                if col['name'] in seen_cols:
                    continue
                seen_cols.add(col['name'])
                
                d = parse_json_details(col['details'])
                pos = d.get('position', '-')
                c_name = col['name']
                type_info = d.get('type', {})
                c_type = type_info.get('data_type', 'unknown')
                udt = type_info.get('udt_name', '')
                if c_type == 'USER-DEFINED' and udt:
                    c_type = udt
                c_null = "✅" if d.get('nullable') else "❌"
                c_def = d.get('default', '-') or '-'
                if c_def and len(str(c_def)) > 30:
                    c_def = str(c_def)[:30] + "..."
                lines.append(f"| {pos} | `{c_name}` | {c_type} | {c_null} | {c_def} |")
            lines.append("")

        # ─────────────────────────────────────────────────────────────
        # Constraints
        # ─────────────────────────────────────────────────────────────
        cons = table_data[table].get('constraints', [])
        if cons:
            lines.append("#### 🔑 Constraints (PK & Unique)\n")
            lines.append("| Name | Type | Columns |")
            lines.append("|------|------|---------|")
            for c in cons:
                d = parse_json_details(c['details'])
                ctype = d.get('type', '-')
                cols_list = d.get('columns', [])
                cols_str = ', '.join(cols_list) if isinstance(cols_list, list) else str(cols_list)
                lines.append(f"| `{c['name']}` | {ctype} | [{cols_str}] |")
            lines.append("")

        # ─────────────────────────────────────────────────────────────
        # Check Constraints
        # ─────────────────────────────────────────────────────────────
        checks = table_data[table].get('checks', [])
        if checks:
            # Filter out NOT NULL constraints
            real_checks = [c for c in checks if 'not_null' not in c['name'].lower() and 'IS NOT NULL' not in str(parse_json_details(c['details']).get('expression', ''))]
            if real_checks:
                lines.append("<details><summary><strong>✓ Check Constraints</strong></summary>\n")
                lines.append("| Name | Expression |")
                lines.append("|------|------------|")
                for c in real_checks:
                    d = parse_json_details(c['details'])
                    expr = d.get('expression', '-')
                    lines.append(f"| `{c['name']}` | `{expr}` |")
                lines.append("\n</details>\n")

        # ─────────────────────────────────────────────────────────────
        # Foreign Keys (Outgoing)
        # ─────────────────────────────────────────────────────────────
        fks = table_data[table].get('fks', [])
        if fks:
            lines.append("#### 🔗 Foreign Keys (Outgoing)\n")
            lines.append("| FK Name | Source Columns | Target Table | Target Columns | On Delete |")
            lines.append("|---------|----------------|--------------|----------------|-----------|")
            for fk in fks:
                d = parse_json_details(fk['details'])
                source = d.get('source', {})
                target = d.get('target', {})
                rules = d.get('rules', {})
                
                src_cols = source.get('columns', [])
                src_cols_str = ', '.join(src_cols) if isinstance(src_cols, list) else str(src_cols)
                
                tgt_table = target.get('table', '-')
                tgt_cols = target.get('columns', [])
                tgt_cols_str = ', '.join(tgt_cols) if isinstance(tgt_cols, list) else str(tgt_cols)
                
                on_delete = rules.get('on_delete', '-')
                lines.append(f"| `{fk['name']}` | {src_cols_str} | `{tgt_table}` | {tgt_cols_str} | {on_delete} |")
            lines.append("")

        # ─────────────────────────────────────────────────────────────
        # Incoming References
        # ─────────────────────────────────────────────────────────────
        fks_in = table_data[table].get('fks_in', [])
        if fks_in:
            lines.append("<details><summary><strong>⬅️ Referenced By (Incoming FKs)</strong></summary>\n")
            lines.append("| Source Table | Source Columns | On Delete | Impact |")
            lines.append("|--------------|----------------|-----------|--------|")
            for ref in fks_in:
                d = parse_json_details(ref['details'])
                ref_by = d.get('referenced_by', {})
                impact = d.get('impact_analysis', {})
                
                src_table = ref_by.get('table', '-')
                src_cols = ref_by.get('columns', [])
                src_cols_str = ', '.join(src_cols) if isinstance(src_cols, list) else str(src_cols)
                
                rules = d.get('rules', {})
                on_delete = rules.get('on_delete', '-')
                
                risk = impact.get('cascade_risk', '-')
                warning = impact.get('warning', '')
                lines.append(f"| `{src_table}` | {src_cols_str} | {on_delete} | {risk} |")
            lines.append("\n</details>\n")

        # ─────────────────────────────────────────────────────────────
        # Indexes
        # ─────────────────────────────────────────────────────────────
        idxs = table_data[table].get('indexes', [])
        if idxs:
            lines.append("<details><summary><strong>🔎 Indexes</strong></summary>\n")
            lines.append("| Index Name | Method | Unique | Columns | Size | Scans |")
            lines.append("|------------|--------|--------|---------|------|-------|")
            for idx in idxs:
                d = parse_json_details(idx['details'])
                method = d.get('method', '-')
                unique = "✅" if d.get('unique') else "❌"
                cols = d.get('columns', [])
                cols_str = ', '.join(cols) if isinstance(cols, list) else str(cols)
                size = d.get('size', '-')
                usage = d.get('usage_stats', {})
                scans = usage.get('scans', 0) if isinstance(usage, dict) else 0
                lines.append(f"| `{idx['name']}` | {method} | {unique} | {cols_str} | {size} | {scans:,} |")
            lines.append("\n</details>\n")

        # ─────────────────────────────────────────────────────────────
        # RLS Policies
        # ─────────────────────────────────────────────────────────────
        rls = table_data[table].get('rls', [])
        if rls:
            lines.append("#### 🛡️ RLS Policies\n")
            lines.append("| Policy Name | Command | Roles | Permissive |")
            lines.append("|-------------|---------|-------|------------|")
            for p in rls:
                d = parse_json_details(p['details'])
                cmd = d.get('command', '-')
                roles = d.get('roles', [])
                roles_str = ', '.join(roles) if isinstance(roles, list) else str(roles)
                perm = "✅" if d.get('permissive') else "❌"
                lines.append(f"| `{p['name']}` | {cmd} | {roles_str} | {perm} |")
            lines.append("")

        # ─────────────────────────────────────────────────────────────
        # Triggers
        # ─────────────────────────────────────────────────────────────
        trigs = table_data[table].get('triggers', [])
        if trigs:
            lines.append("<details><summary><strong>⚡ Triggers</strong></summary>\n")
            lines.append("| Trigger Name | Timing | Events | Function | Enabled |")
            lines.append("|--------------|--------|--------|----------|---------|")
            for t in trigs:
                d = parse_json_details(t['details'])
                timing = d.get('timing', '-')
                events = d.get('events', [])
                events_str = ', '.join(events) if isinstance(events, list) else str(events)
                func = d.get('function', '-')
                enabled = "✅" if d.get('enabled') else "❌"
                lines.append(f"| `{t['name']}` | {timing} | {events_str} | {func} | {enabled} |")
            lines.append("\n</details>\n")

        # ─────────────────────────────────────────────────────────────
        # Security Audit
        # ─────────────────────────────────────────────────────────────
        security = table_data[table].get('security', [])
        if security:
            d = parse_json_details(security[0]['details'])
            rec = d.get('recommendations', '')
            if rec:
                lines.append(f"> **Security Status**: {rec}\n")

        lines.append("[⬆️ Back to Top](#-table-of-contents)\n")
        lines.append("---\n")

    # ══════════════════════════════════════════════════════════════════
    # Footer
    # ══════════════════════════════════════════════════════════════════
    lines.append("\n## 📝 End of Report\n")
    lines.append(f"> Generated on {datetime.datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    
    # Write output
    with open(OUTPUT_FILE, 'w', encoding='utf-8') as f:
        f.write('\n'.join(lines))
    
    print(f"✅ Successfully generated {OUTPUT_FILE}")
    print(f"   📊 Tables: {len(all_tables)}")
    print(f"   👁️ Views: {len(all_views)}")
    print(f"   ⚙️ Functions: {len(func_sec)}")
    print(f"   📋 ENUMs: {len(enum_sec)}")

if __name__ == '__main__':
    main()
