# Data Upload & Schema Documentation

This document explains the structure (schema) of the `dictionary` table created in Supabase and how the enriched JSONL data was mapped and uploaded to it.

## 1. Database Schema (`dictionary` table)

We created a table named `dictionary` in PostgreSQL (Supabase) to store the enriched linguistic data. The table has the following columns:

| Column Name | Data Type | Description |
| :--- | :--- | :--- |
| `concept_id` | `TEXT` | **Primary Key**. A unique identifier for the concept (e.g., `CNT-ADOPTING-001`). |
| `word_family_root` | `TEXT` | The root word or main entry (e.g., `adopting`). |
| `definition` | `TEXT` | The general English definition of the concept. |
| `part_of_speech` | `TEXT` | Grammatical category (e.g., `noun`, `verb`, `adjective`). |
| `domains` | `JSONB` | An array of domains/fields related to the word (e.g., `["General", "Business"]`). |
| `lexical_entries` | `JSONB` | A rich JSON object containing translations and linguistic details for multiple languages (`en`, `ar`, `fr`, `de`). |
| `relations` | `JSONB` | A JSON object containing synonyms and antonyms. |
| `created_at` | `TIMESTAMP` | Timestamp of when the record was created (default: `NOW()`). |
| `updated_at` | `TIMESTAMP` | Timestamp of when the record was last updated (default: `NOW()`). |

### Why `JSONB`?
We used `JSONB` for `lexical_entries`, `domains`, and `relations` because these fields contain nested and structured data that varies in complexity. `JSONB` allows us to store this data flexibly while still being able to query it efficiently in PostgreSQL (e.g., finding all words where `lexical_entries->'ar'->>'gender'` is 'feminine').

---

## 2. Data Mapping (JSONL to SQL)

The source data is in **JSON Lines** format (`enriched_final.jsonl`), where each line is a self-contained JSON object.

### Example Input (One Line of JSONL):
```json
{
  "concept_id": "CNT-ADVOCATE-001",
  "word_family_root": "advocate",
  "definition": "A person who publicly supports or recommends a particular cause or policy.",
  "part_of_speech": "noun",
  "domains": ["Politics", "Law"],
  "lexical_entries": {
    "en": { "lemma": "advocate", "pronunciations": [...], "inflections": [...], "examples": [...] },
    "ar": { "lemma": "مناصر", "pronunciations": [...], "inflections": [...], "examples": [...] },
    "fr": { ... },
    "de": { ... }
  },
  "relations": { "synonyms": ["supporter", "champion"], "antonyms": ["opponent"] }
}
```

### Mapping Logic:
The upload script (`upload_to_supabase.js`) reads this object and maps it directly to the table columns because the keys in the JSON object **match exactly** with the column names in the table.

- `json.concept_id` -> `table.concept_id`
- `json.word_family_root` -> `table.word_family_root`
- `json.definition` -> `table.definition`
- `json.part_of_speech` -> `table.part_of_speech`
- `json.domains` (Array) -> `table.domains` (JSONB)
- `json.lexical_entries` (Object) -> `table.lexical_entries` (JSONB)
- `json.relations` (Object) -> `table.relations` (JSONB)

## 3. The Scripts

### `setup_db.js`
This script connects to the database using the connection string and executes the SQL command to create the table and grant permissions.

```javascript
// Creates the table
const createTableQuery = `
  CREATE TABLE IF NOT EXISTS dictionary (
    concept_id TEXT PRIMARY KEY,
    // ... other columns
    lexical_entries JSONB, 
    // ...
  );
`;

// Grants permissions so the API/Service Role can write to it
await client.query(`GRANT ALL ON TABLE dictionary TO service_role; ...`);
```

### `upload_to_supabase.js`
This script handles the file reading and data insertion.

1.  **Reads** `enriched_final.jsonl` line by line.
2.  **Parses** each line into a JavaScript Object.
3.  **Batches** objects (e.g., 100 at a time) for efficiency.
4.  **Upserts** (Update or Insert) data into Supabase using the `supabase-js` client.

```javascript
const { error } = await supabase
  .from('dictionary')
  .upsert(batch, { onConflict: 'concept_id' });
```

The `.upsert` method is smart; it looks at the `concept_id`. If it already exists, it updates the row; if not, it inserts a new one.
