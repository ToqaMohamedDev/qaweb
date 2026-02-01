import json
import os
import time
import argparse
import urllib.request
import urllib.error
from typing import Dict, Any

# --- Configuration ---
INPUT_FILE = 'scripts/translations-data.backup.json'
OUTPUT_FILE = 'scripts/enriched_final.jsonl'
MODEL = "gpt-4o"
MAX_ITEMS = 200

# --- The "Gold Standard" Prompt ---
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
            if limit_msg:
                 # Minimal rate limit handling
                 pass
            
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

def main():
    parser = argparse.ArgumentParser(description="Enrich lexicon data using OpenAI API (urllib).")
    parser.add_argument("--api_key", help="Your OpenAI API Key", required=True)
    parser.add_argument("--limit", type=int, default=MAX_ITEMS, help="Limit number of items to process")
    args = parser.parse_args()

    # 1. Read Source File
    print(f"Reading input file: {INPUT_FILE}...")
    try:
        with open(INPUT_FILE, 'r', encoding='utf-8') as f:
            source_data = json.load(f)
    except FileNotFoundError:
        print(f"Error: File {INPUT_FILE} not found.")
        return

    # 2. Extract keys to process (skip _meta)
    keys_to_process = [k for k in source_data.keys() if k != "_meta"]
    
    if args.limit > 0:
        keys_to_process = keys_to_process[:args.limit]
    
    print(f"Starting enrichment for {len(keys_to_process)} items using pure Python (urllib)...")
    print(f"Output will be saved incrementally to: {OUTPUT_FILE}")

    # 3. Processing Loop
    processed_count = 0
    with open(OUTPUT_FILE, 'a', encoding='utf-8') as f_out: # Append mode
        for key in keys_to_process:
            # Parse key (e.g., "book:noun")
            parts = key.split(':')
            word = parts[0]
            pos = parts[1] if len(parts) > 1 else "unknown"
            raw_entry = source_data[key]

            print(f"[{processed_count + 1}/{len(keys_to_process)}] Enriching: {word} ({pos})...")
            
            result = enrich_word(args.api_key, word, pos, raw_entry)
            
            if result:
                # Ensure the word root is preserved exactly as input if needed
                result['input_key_reference'] = key 
                
                # Write to file (JSONL format: one JSON object per line)
                f_out.write(json.dumps(result, ensure_ascii=False) + '\n')
                f_out.flush() # Ensure it's written to disk immediately
                processed_count += 1
            
            # Simple rate limiting check (optional)
            time.sleep(0.5) 

    print("------------------------------------------------")
    print(f"Processing Complete.")
    print(f"Successfully enriched: {processed_count} words.")
    print(f"Data saved to: {OUTPUT_FILE}")

if __name__ == "__main__":
    main()
