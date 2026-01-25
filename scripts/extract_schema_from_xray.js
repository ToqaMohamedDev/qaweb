const fs = require('fs');
const path = require('path');

const xrayPath = '/Volumes/alaaMac/Archive/qazzzzzzz/docs/database_xray_output.json';
const outputPath = '/Volumes/alaaMac/Archive/qazzzzzzz/docs/tables_schema.json';

try {
    const rawData = fs.readFileSync(xrayPath, 'utf8');
    const xrayData = JSON.parse(rawData);

    const tables = {};

    xrayData.forEach(item => {
        if (item.section === '05_COLUMN') {
            const tableName = item.table_name;
            const columnName = item.name;
            let details = {};
            try {
                details = JSON.parse(item.details);
            } catch (e) {
                console.error(`Error parsing details for ${tableName}.${columnName}`, e);
            }

            if (!tables[tableName]) {
                tables[tableName] = [];
            }

            const exists = tables[tableName].some(c => c.name === columnName);
            if (!exists) {
                tables[tableName].push({
                    name: columnName,
                    type: details.type ? details.type.udt_name : 'unknown',
                    nullable: details.nullable,
                    default: details.default,
                    is_primary_key: details.is_identity || (details.default && details.default.includes('gen_random_uuid()') && columnName === 'id') // Heuristic
                });
            }
        }
    });

    // Sort columns: id first, then others
    Object.keys(tables).forEach(table => {
        tables[table].sort((a, b) => {
            if (a.name === 'id') return -1;
            if (b.name === 'id') return 1;
            return 0;
        });
    });

    fs.writeFileSync(outputPath, JSON.stringify(tables, null, 2));
    console.log(`Schema extracted to ${outputPath}`);
} catch (error) {
    console.error('Error processing xray file:', error);
}
