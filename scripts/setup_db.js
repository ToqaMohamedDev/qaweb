
const { Client } = require('pg');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.resolve(__dirname, '../.env.local') });

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
    console.error("Error: DATABASE_URL not found in .env.local");
    process.exit(1);
}

const client = new Client({
    connectionString: connectionString,
});

async function setup() {
    try {
        await client.connect();
        console.log("Connected to database.");

        const createTableQuery = `
      CREATE TABLE IF NOT EXISTS dictionary (
        concept_id TEXT PRIMARY KEY,
        word_family_root TEXT,
        definition TEXT,
        part_of_speech TEXT,
        domains JSONB,
        lexical_entries JSONB,
        relations JSONB,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );
    `;

        console.log("Creating 'dictionary' table if it doesn't exist...");
        await client.query(createTableQuery);

        console.log("Granting permissions to roles...");
        // Granting permissions explicitly
        await client.query(`
      GRANT ALL ON TABLE dictionary TO anon;
      GRANT ALL ON TABLE dictionary TO authenticated;
      GRANT ALL ON TABLE dictionary TO service_role;
    `);

        console.log("Table 'dictionary' is ready and permissions granted.");

    } catch (err) {
        console.error("Error setting up database:", err);
    } finally {
        await client.end();
    }
}

setup();
