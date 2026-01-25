
import json
import os

file_path = '/Volumes/alaaMac/Archive/qazzzzzzz/docs/database_xray_output.json'
output_path = '/Volumes/alaaMac/Archive/qazzzzzzz/docs/database_schema_simple.json'

try:
    with open(file_path, 'r') as f:
        data = json.load(f)

    tables = {}

    for item in data:
        if item.get('section') == '05_COLUMN':
            table_name = item.get('table_name')
            column_name = item.get('name')
            details_str = item.get('details')
            
            # extract type if possible
            col_type = "unknown"
            if details_str:
                try:
                    details = json.loads(details_str)
                    col_type = details.get('type', {}).get('udt_name', 'unknown')
                except:
                    pass

            if table_name and column_name:
                if table_name not in tables:
                    tables[table_name] = []
                
                # Check if column already exists to prevent duplicates (though rare in this specific dump format if parsed correctly)
                if not any(col['name'] == column_name for col in tables[table_name]):
                    tables[table_name].append({
                        "name": column_name,
                        "type": col_type
                    })

    # Sort tables for better readability in the JSON file
    sorted_tables = {}
    for table in sorted(tables.keys()):
        sorted_tables[table] = tables[table]

    with open(output_path, 'w', encoding='utf-8') as f:
        json.dump(sorted_tables, f, indent=2, ensure_ascii=False)

    print(f"Successfully saved database schema to {output_path}")

except Exception as e:
    print(f"Error processing file: {e}")
