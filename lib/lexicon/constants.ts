/**
 * Lexicon Constants & Configuration
 */

// API Configuration
export const LEXICON_CONFIG = {
  // Default limits
  DEFAULT_LIMIT: 50,
  MAX_LIMIT: 200,
  MAX_QUERY_LENGTH: 500,
  
  // Import settings
  IMPORT_BATCH_SIZE: 5000,
  IMPORT_LOG_INTERVAL: 50000,
  
  // Cache settings
  CACHE_TTL_HOURS: 24,
  
  // Primary languages (99%+ of data)
  PRIMARY_LANGUAGES: ['arb-000', 'eng-000'],
  
  // Version
  VERSION: '2.0',
} as const;

// Language names (for reference)
export const LANGUAGE_NAMES: Record<string, { en: string; native: string }> = {
  'arb-000': { en: 'Arabic (Standard)', native: 'العربية الفصحى' },
  'arb-001': { en: 'Arabic (Variant 1)', native: 'العربية' },
  'arb-002': { en: 'Arabic (Variant 2)', native: 'العربية' },
  'eng-000': { en: 'English (Standard)', native: 'English' },
  'eng-001': { en: 'English (Variant 1)', native: 'English' },
};

// Internal API Token header name
export const INTERNAL_TOKEN_HEADER = 'X-Lexicon-Token';

// Error messages
export const ERRORS = {
  INVALID_QUERY: 'Query is required and must be non-empty',
  INVALID_SOURCE_LANG: 'source_lang is required',
  QUERY_TOO_LONG: `Query exceeds maximum length of ${LEXICON_CONFIG.MAX_QUERY_LENGTH}`,
  UNAUTHORIZED: 'Unauthorized access',
  NOT_FOUND: 'Resource not found',
  INTERNAL_ERROR: 'Internal server error',
} as const;
