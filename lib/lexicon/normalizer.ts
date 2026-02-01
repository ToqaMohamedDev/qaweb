/**
 * Text Normalization Utilities
 * للعربية والإنجليزية
 */

// Arabic diacritics (tashkeel) range
const ARABIC_DIACRITICS = /[\u064B-\u065F\u0670]/g;

// Arabic letter variations
const ALEF_VARIATIONS = /[إأآا]/g;
const HAMZA_VARIATIONS = /[ؤئء]/g;
const TAA_MARBUTA = /ة/g;
const ALEF_MAKSURA = /ى/g;

// Whitespace pattern (any whitespace character)
const WHITESPACE = /\s+/g;

/**
 * Normalize Arabic text
 * - إزالة التشكيل
 * - توحيد الألف
 * - توحيد الهمزة
 * - توحيد التاء المربوطة
 * - توحيد الياء
 */
export function normalizeArabic(text: string): string {
  return text
    .replace(ARABIC_DIACRITICS, '')
    .replace(ALEF_VARIATIONS, 'ا')
    .replace(HAMZA_VARIATIONS, 'ء')
    .replace(TAA_MARBUTA, 'ه')
    .replace(ALEF_MAKSURA, 'ي')
    .replace(WHITESPACE, ' ')
    .trim();
}

/**
 * Normalize English text
 * - تحويل لـ lowercase
 * - إزالة diacritics
 */
export function normalizeEnglish(text: string): string {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(WHITESPACE, ' ')
    .trim();
}

/**
 * Detect language and normalize accordingly
 */
export function normalizeText(text: string, langCode: string): string {
  if (!text) return '';
  
  // Arabic languages
  if (langCode.startsWith('arb')) {
    return normalizeArabic(text);
  }
  
  // English and others
  return normalizeEnglish(text);
}

/**
 * Check if text is a single word (no whitespace after normalization)
 */
export function isSingleWord(txtNorm: string): boolean {
  return !WHITESPACE.test(txtNorm.trim());
}

/**
 * Calculate word length (character count)
 */
export function getWordLength(txtNorm: string): number {
  return txtNorm.length;
}

/**
 * Extract lang_code from langvar_uid
 * e.g., "eng-000" → "eng"
 */
export function extractLangCode(langvarUid: string): string {
  return langvarUid.split('-')[0] || langvarUid;
}

/**
 * Determine text direction from lang_code
 */
export function getTextDirection(langCode: string): 'ltr' | 'rtl' {
  const rtlLanguages = ['arb', 'ara', 'heb', 'fas', 'urd'];
  return rtlLanguages.includes(langCode) ? 'rtl' : 'ltr';
}
