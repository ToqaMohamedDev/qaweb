/**
 * Supabase Client for Lexicon Schema
 * Uses service role for imports, anon for reads
 */

import { createClient, SupabaseClient } from '@supabase/supabase-js';

// Type for lexicon schema
export interface LexiconDatabase {
  lexicon: {
    Tables: {
      languages: {
        Row: {
          langvar_uid: string;
          langvar: number;
          lang_code: string;
          name_en: string | null;
          name_native: string | null;
          text_direction: string;
          is_active: boolean;
          lexeme_count: number;
          created_at: string;
        };
        Insert: Omit<LexiconDatabase['lexicon']['Tables']['languages']['Row'], 'created_at'> & { created_at?: string };
        Update: Partial<LexiconDatabase['lexicon']['Tables']['languages']['Insert']>;
      };
      meanings: {
        Row: {
          id: number;
          lexeme_count: number;
          lang_count: number;
          has_arabic: boolean;
          has_english: boolean;
          created_at: string;
        };
        Insert: Omit<LexiconDatabase['lexicon']['Tables']['meanings']['Row'], 'created_at' | 'lexeme_count' | 'lang_count'> & {
          created_at?: string;
          lexeme_count?: number;
          lang_count?: number;
        };
        Update: Partial<LexiconDatabase['lexicon']['Tables']['meanings']['Insert']>;
      };
      lexemes: {
        Row: {
          lexeme_id: number;
          source_id: number | null;
          meaning_id: number;
          langvar_uid: string;
          txt: string;
          txt_norm: string;
          txt_degr: string | null;
          word_length: number | null;
          is_single_word: boolean | null;
          created_at: string;
        };
        Insert: Omit<LexiconDatabase['lexicon']['Tables']['lexemes']['Row'], 'lexeme_id' | 'created_at'> & {
          lexeme_id?: number;
          created_at?: string;
        };
        Update: Partial<LexiconDatabase['lexicon']['Tables']['lexemes']['Insert']>;
      };
      import_jobs: {
        Row: {
          id: string;
          file_path: string;
          langvar_uid: string | null;
          status: string;
          total_rows: number | null;
          processed_rows: number;
          inserted_rows: number;
          skipped_rows: number;
          error_message: string | null;
          last_processed_id: number | null;
          started_at: string | null;
          completed_at: string | null;
          created_at: string;
        };
        Insert: Omit<LexiconDatabase['lexicon']['Tables']['import_jobs']['Row'], 'id' | 'created_at'> & {
          id?: string;
          created_at?: string;
        };
        Update: Partial<LexiconDatabase['lexicon']['Tables']['import_jobs']['Insert']>;
      };
    };
  };
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
let anonClient: SupabaseClient<any, 'lexicon'> | null = null;
// eslint-disable-next-line @typescript-eslint/no-explicit-any
let serviceClient: SupabaseClient<any, 'lexicon'> | null = null;

/**
 * Get Supabase client for reading (anon key)
 */
export function getLexiconClient() {
  if (!anonClient) {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    
    if (!url || !key) {
      throw new Error('Missing Supabase environment variables');
    }
    
    anonClient = createClient(url, key, {
      db: { schema: 'lexicon' }
    });
  }
  
  return anonClient;
}

/**
 * Get Supabase client with service role (for imports)
 */
export function getLexiconServiceClient() {
  if (!serviceClient) {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
    
    if (!url || !key) {
      throw new Error('Missing Supabase service role key');
    }
    
    serviceClient = createClient(url, key, {
      db: { schema: 'lexicon' },
      auth: { persistSession: false }
    });
  }
  
  return serviceClient;
}

/**
 * Helper to query lexicon schema tables
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function lexiconQuery(client: SupabaseClient<any, 'lexicon'>) {
  return {
    languages: () => client.from('languages'),
    meanings: () => client.from('meanings'),
    lexemes: () => client.from('lexemes'),
    import_jobs: () => client.from('import_jobs'),
  };
}
