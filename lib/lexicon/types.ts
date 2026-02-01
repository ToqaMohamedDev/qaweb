/**
 * Lexicon Subsystem Types
 * v2.0 - التصميم المصحح
 */

// ============================================================================
// Database Types
// ============================================================================

export interface LexiconLanguage {
  langvar_uid: string;
  langvar: number;
  lang_code: string;
  name_en: string | null;
  name_native: string | null;
  text_direction: 'ltr' | 'rtl';
  is_active: boolean;
  lexeme_count: number;
  created_at: string;
}

export interface LexiconMeaning {
  id: number;
  lexeme_count: number;
  lang_count: number;
  has_arabic: boolean;
  has_english: boolean;
  created_at: string;
}

export interface LexiconLexeme {
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
}

export interface ImportJob {
  id: string;
  file_path: string;
  langvar_uid: string | null;
  status: 'pending' | 'running' | 'completed' | 'failed' | 'paused';
  total_rows: number | null;
  processed_rows: number;
  inserted_rows: number;
  skipped_rows: number;
  error_message: string | null;
  last_processed_id: number | null;
  started_at: string | null;
  completed_at: string | null;
  created_at: string;
}

// ============================================================================
// API Request Types
// ============================================================================

export type MatchType = 'exact' | 'prefix';

export interface SearchRequest {
  query: string;
  source_lang: string;
  target_langs?: string[];
  match_type?: MatchType;
  include_synonyms?: boolean;
  only_translatable?: boolean;
  single_words_only?: boolean;
  limit?: number;
  offset?: number;
}

export interface TranslateRequest {
  word: string;
  from_lang: string;
  to_langs: string[];
  include_synonyms?: boolean;
}

export interface RandomRequest {
  source_lang: string;
  target_lang: string;
  count?: number;
  single_words_only?: boolean;
  max_word_length?: number;
}

// ============================================================================
// API Response Types
// ============================================================================

export interface LexemeMatch {
  lexeme_id: number;
  txt: string;
  txt_norm: string;
  langvar_uid: string;
}

export interface MeaningResult {
  meaning_id: number;
  source_matches: LexemeMatch[];
  synonyms?: LexemeMatch[];
  translations: Record<string, LexemeMatch[]>;
}

export interface SearchResponse {
  success: boolean;
  query: string;
  normalized_query: string;
  source_lang: string;
  total_meanings: number;
  results: MeaningResult[];
  meta: {
    execution_time_ms: number;
    cache_hit: boolean;
    total_source_matches: number;
    total_translations: number;
  };
}

export interface TranslateResponse {
  success: boolean;
  word: string;
  from_lang: string;
  meanings: MeaningResult[];
}

export interface RandomPair {
  meaning_id: number;
  source: LexemeMatch;
  target: LexemeMatch;
}

export interface RandomResponse {
  success: boolean;
  pairs: RandomPair[];
}

export interface LanguagesResponse {
  success: boolean;
  languages: LexiconLanguage[];
  total: number;
}

export interface StatsResponse {
  success: boolean;
  stats: {
    total_lexemes: number;
    total_meanings: number;
    total_languages: number;
    translatable_meanings: number;
    arabic_lexemes: number;
    english_lexemes: number;
  };
}

// ============================================================================
// Import Types
// ============================================================================

export interface ParquetRow {
  id: number;
  langvar: number;
  txt: string;
  txt_degr: string;
  meaning: number;
  langvar_uid: string;
}

export interface ImportProgress {
  job_id: string;
  file: string;
  batch_number: number;
  processed: number;
  total: number;
  progress_percent: number;
  inserted: number;
  skipped: number;
  duration_ms: number;
}

export interface ImportResult {
  success: boolean;
  job_id: string;
  total_rows: number;
  inserted_rows: number;
  skipped_rows: number;
  duration_seconds: number;
  error?: string;
}
