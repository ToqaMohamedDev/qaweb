import json
import os
import time
import argparse
import urllib.request
import urllib.error
from typing import Dict, Any, Set

# --- Configuration ---
INPUT_FILE = 'scripts/translations-data.backup.json'
OUTPUT_FILE = 'scripts/enriched_final.jsonl'
MODEL = "gpt-4o"
DEFAULT_BATCH_SIZE = 50

# --- The "Gold Standard" Prompt (Preserved from enrich_data.py) ---
SYSTEM_PROMPT = """You are an expert lexicographer and linguist.
Your task is to convert a simple translation entry into a detailed, high-precision Concept Object for a polysemy-aware lexicon.

Target Languages: English (en), Arabic (ar), French (fr), German (de).

Output Schema (strict JSON):
{
  "concept_id": "Generate a unique ID (e.g., CNT-WORD-001)", 
  "word_family_root": "The English root word",
  "definition": "A precise, single-sense definition in English",
  "part_of_speech": "noun/verb/adjective/etc",
  "domains": ["General", "Specific Domain..."],
  "lexical_entries": {
    "en": {
      "lemma": "...",
      "pronunciations": [{"ipa": "...", "region": "General American"}],
      "inflections": [{"form": "...", "features": ["..."]}],
      "examples": ["High quality example sentence 1.", "Example sentence 2."]
    },
    "ar": {
      "lemma": "...", 
      "pronunciations": [{"ipa": "...", "region": "MSA"}],
      "inflections": [{"form": "...", "features": ["..."]}], 
      "examples": ["..."],
      "gender": "masculine/feminine/unknown"
    },
    "fr": { "lemma": "...", "pronunciations": [...], "inflections": [...], "examples": [...], "gender": "..." },
    "de": { "lemma": "...", "pronunciations": [...], "inflections": [...], "examples": [...], "gender": "..." }
  },
  "relations": {
    "synonyms": ["..."],
    "antonyms": ["..."]
  }
}

Requirements:
1.  **Polysemy:** If the input word clearly has multiple distinct meanings (e.g., 'Bank'), choose the PRIMARY/MOST COMMON meaning matching the provided simple translation if available.
2.  **Arabic:** Ensure IPA is accurate for MSA. Inflections should include plural for nouns and past/present for verbs.
3.  **Accuracy:** Do not hallucinate. If you are unsure, use standard dictionary data.
"""

def enrich_word(api_key: str, word: str, pos: str, raw_data: Dict[str, Any]) -> Dict[str, Any]:
    """Sends the word to the LLM via urllib to get the enriched JSON object."""
    
    user_prompt = f"""
    Enrich this entry:
    Word: {word}
    Part of Speech Hint: {pos}
    Current Simple Translations: {json.dumps(raw_data, ensure_ascii=False)}
    
    Return ONLY the JSON object.
    """

    data = {
        "model": MODEL,
        "messages": [
            {"role": "system", "content": SYSTEM_PROMPT},
            {"role": "user", "content": user_prompt}
        ],
        "response_format": {"type": "json_object"},
        "temperature": 0.3
    }

    req = urllib.request.Request(
        "https://api.openai.com/v1/chat/completions",
        data=json.dumps(data).encode('utf-8'),
        headers={
            "Content-Type": "application/json",
            "Authorization": f"Bearer {api_key}"
        },
        method="POST"
    )

    try:
        with urllib.request.urlopen(req) as response:
            limit_msg = response.getheader("x-ratelimit-remaining-requests")
            # Minimal rate limit logging if needed
            # if limit_msg: print(f"Rate limit remaining: {limit_msg}")
            
            response_body = response.read().decode('utf-8')
            result_json = json.loads(response_body)
            content = result_json['choices'][0]['message']['content']
            return json.loads(content)
            
    except urllib.error.HTTPError as e:
        print(f"HTTP Error enriching '{word}': {e.code} {e.reason}")
        print(e.read().decode('utf-8'))
        return None
    except Exception as e:
        print(f"Error enriching '{word}': {e}")
        return None

def load_processed_keys(filepath: str) -> Set[str]:
    """Reads existing JSONL file and returns a set of 'word:pos' keys found."""
    processed = set()
    if not os.path.exists(filepath):
        return processed
    
    print(f"Checking existing progress in {filepath}...")
    try:
        with open(filepath, 'r', encoding='utf-8') as f:
            for line_num, line in enumerate(f, 1):
                line = line.strip()
                if not line:
                    continue
                try:
                    obj = json.loads(line)
                    # Try to reconstruct key from word_family_root and part_of_speech
                    word = obj.get("word_family_root")
                    pos = obj.get("part_of_speech")
                    
                    # Also check for explicit reference if available (future proofing)
                    if "input_key_reference" in obj:
                        processed.add(obj["input_key_reference"])
                    elif word and pos:
                        processed.add(f"{word}:{pos}")
                except json.JSONDecodeError:
                    print(f"Warning: Could not parse line {line_num} in {filepath}")
    except Exception as e:
        print(f"Error reading {filepath}: {e}")
        
    print(f"Found {len(processed)} already processed entries.")
    return processed

def main():
    parser = argparse.ArgumentParser(description="Enrich lexicon data sequentially with resume capability.")
    parser.add_argument("--api_key", help="Your OpenAI API Key", required=True)
    parser.add_argument("--limit", type=int, default=DEFAULT_BATCH_SIZE, help="Number of items to process in this run")
    args = parser.parse_args()

    # 1. Load Progress
    processed_keys = load_processed_keys(OUTPUT_FILE)

    # 2. Read Source File
    print(f"Reading input file: {INPUT_FILE}...")
    try:
        with open(INPUT_FILE, 'r', encoding='utf-8') as f:
            source_data = json.load(f)
    except FileNotFoundError:
        print(f"Error: File {INPUT_FILE} not found.")
        return

    # 3. Determine work queue
    # Filter out _meta and already processed keys
    keys_to_process = []
    for k in source_data.keys():
        if k == "_meta":
            continue
        if k in processed_keys:
            continue
        keys_to_process.append(k)

    total_remaining = len(keys_to_process)
    print(f"Total valid entries in source: {len(source_data) - 1}") # -1 for _meta
    print(f"Already processed: {len(processed_keys)}")
    print(f"Remaining to process: {total_remaining}")
    
    if total_remaining == 0:
        print("All items have been processed! Nothing to do.")
        return

    # Apply batch limit
    batch_keys = keys_to_process[:args.limit]
    print(f"Processing batch of {len(batch_keys)} items...")

    # 4. Processing Loop
    success_count = 0
    
    # Open in append mode
    with open(OUTPUT_FILE, 'a', encoding='utf-8') as f_out: 
        for i, key in enumerate(batch_keys):
            # Parse key (e.g., "book:noun")
            parts = key.split(':')
            word = parts[0]
            pos = parts[1] if len(parts) > 1 else "unknown"
            raw_entry = source_data[key]

            print(f"[{i + 1}/{len(batch_keys)}] Enriching: {word} ({pos})...")
            
            result = enrich_word(args.api_key, word, pos, raw_entry)
            
            if result:
                # We do NOT add input_key_reference to the saved JSON to maintain strict style match with previous entries
                # But we rely on the file content for resumption next time.
                
                # Double check ID uniqueness (optional, but good practice)
                # For now, we trust the LLM or pre-generation logic.
                
                # Write to file
                f_out.write(json.dumps(result, ensure_ascii=False) + '\n')
                f_out.flush()
                success_count += 1
            else:
                print(f"Failed to enrich {key}. Skipping.")
            
            # Rate limiting / niceness
            time.sleep(0.5)

    print("------------------------------------------------")
    print(f"Batch Complete.")
    print(f"Successfully enriched: {success_count} words.")
    print(f"Progress saved to: {OUTPUT_FILE}")
    print(f"Run this script again to process the next batch.")

if __name__ == "__main__":
    main()
