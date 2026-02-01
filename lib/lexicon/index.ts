/**
 * Lexicon Subsystem
 * نظام ذكي للترجمة الدلالية
 * v2.0
 */

// Service
export { lexiconService } from './service';

// Client
export { getLexiconClient, getLexiconServiceClient, lexiconQuery } from './client';

// Normalizer
export {
  normalizeText,
  normalizeArabic,
  normalizeEnglish,
  isSingleWord,
  getWordLength,
  extractLangCode,
  getTextDirection,
} from './normalizer';

// Constants
export { LEXICON_CONFIG, LANGUAGE_NAMES, INTERNAL_TOKEN_HEADER, ERRORS } from './constants';

// Types
export type {
  // Database types
  LexiconLanguage,
  LexiconMeaning,
  LexiconLexeme,
  ImportJob,
  
  // Request types
  SearchRequest,
  TranslateRequest,
  RandomRequest,
  MatchType,
  
  // Response types
  SearchResponse,
  TranslateResponse,
  RandomResponse,
  LanguagesResponse,
  StatsResponse,
  MeaningResult,
  LexemeMatch,
  RandomPair,
  
  // Import types
  ParquetRow,
  ImportProgress,
  ImportResult,
} from './types';
