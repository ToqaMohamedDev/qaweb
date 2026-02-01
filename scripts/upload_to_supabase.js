
const fs = require('fs');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');

// Load environment variables from .env.local
dotenv.config({ path: path.resolve(__dirname, '../.env.local') });

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY; // Use service role for admin rights

if (!SUPABASE_URL || !SUPABASE_KEY) {
    console.error("Error: Missing Supabase credentials in .env.local");
    process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);
const TABLE_NAME = 'dictionary';
const FILE_PATH = path.resolve(__dirname, 'enriched_final.jsonl');
const BATCH_SIZE = 100;

async function uploadData() {
    if (!fs.existsSync(FILE_PATH)) {
        console.error(`Error: File not found at ${FILE_PATH}`);
        process.exit(1);
    }

    console.log(`Reading data from ${FILE_PATH}...`);
    const fileStream = fs.readFileSync(FILE_PATH, 'utf-8');
    const lines = fileStream.split('\n').filter(line => line.trim() !== '');

    console.log(`Found ${lines.length} entries. Starting upload to table '${TABLE_NAME}'...`);

    let batch = [];
    let processedCount = 0;
    let successCount = 0;
    let errorCount = 0;

    for (let i = 0; i < lines.length; i++) {
        try {
            const entry = JSON.parse(lines[i]);
            // Ensure complex objects are stringified if necessary, or passed as objects depending on library version
            // supabase-js handles objects for jsonb columns automatically.
            batch.push(entry);
        } catch (e) {
            console.warn(`Warning: Skipping invalid JSON at line ${i + 1}`);
            continue;
        }

        if (batch.length >= BATCH_SIZE || i === lines.length - 1) {
            const { error } = await supabase.from(TABLE_NAME).upsert(batch, { onConflict: 'concept_id' }); // Assuming concept_id is unique/PK

            if (error) {
                console.error(`Error uploading batch ${Math.floor(i / BATCH_SIZE) + 1}:`, error.message);
                errorCount += batch.length;
                // Optionally stop or continue. For now, we continue.
                if (error.code === '42P01') { // undefined_table
                    console.error("CRITICAL: Table 'dictionary' does not exist. Please create it first.");
                    process.exit(1);
                }
            } else {
                successCount += batch.length;
                process.stdout.write(`\rProcessed: ${processedCount + batch.length}/${lines.length}`);
            }

            processedCount += batch.length;
            batch = [];
        }
    }

    console.log('\nUpload complete.');
    console.log(`Successfully uploaded: ${successCount}`);
    console.log(`Errors: ${errorCount}`);
}

uploadData().catch(err => {
    console.error("Unexpected error:", err);
    process.exit(1);
});
