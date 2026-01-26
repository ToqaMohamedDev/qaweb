/**
 * Word Systems Types
 * نظامان منفصلان تماماً
 */

// ============================================================================
// اللغات المدعومة
// ============================================================================

export interface SupportedLanguage {
    code: string;
    name_en: string;
    name_native: string;
    name_ar?: string;
    text_direction: 'ltr' | 'rtl';
    is_active: boolean;
    tts_voice_id?: string;
    tts_locale?: string;
    flag_emoji?: string;
    sort_order: number;
}

// ============================================================================
// النظام الأول: كلمات الصفحات + تعليم المستخدم
// ============================================================================

export interface PageWord {
    id: string;
    word_id: string; // معرّف قصير للكلمة (w1, w2...)
    page_id: string; // معرّف الصفحة (p101, lesson-5...)
    language_code: string;
    word_text: string;
    word_position: number;
    word_context?: string;
    is_active: boolean;
    created_at: string;
    updated_at: string;
}

export interface PageWordWithHighlight extends PageWord {
    is_highlighted: boolean;
    highlighted_at?: string; // تاريخ التعليم
}

// سجل تعليم المستخدم (سجل واحد لكل مستخدم)
// البنية الجديدة: { lang: { pageId: { wordId: { at: timestamp } } } }
export interface WordHighlightDetails {
    at: string; // تاريخ التعليم ISO
    // يمكن إضافة حقول مستقبلية هنا
}

export type PageHighlights = Record<string, WordHighlightDetails>; // wordId → details
export type LanguageHighlights = Record<string, PageHighlights>; // pageId → words
export type AllHighlights = Record<string, LanguageHighlights>; // langCode → pages

export interface UserWordHighlights {
    id: string;
    user_id: string;
    // { "en": { "p101": { "w1": { "at": "..." } } } }
    highlighted_words: AllHighlights;
    updated_at: string;
}

// ============================================================================
// النظام الثاني: Word Bank للأدمن (منفصل 100%)
// ============================================================================

export interface WordBankEntry {
    id: string;
    language_code: string;
    word_text: string;
    word_definition?: string;
    category_slug?: string;
    difficulty_level: number; // 1-5
    example_sentence?: string;
    phonetic_text?: string;
    notes?: string;
    is_active: boolean;
    created_at: string;
    updated_at: string;
    // Relations
    translations?: WordBankTranslation[];
}

export interface WordBankTranslation {
    id: string;
    word_bank_id: string;
    target_language: string;
    translated_text: string;
    pronunciation_url?: string;
    example_sentence?: string;
    created_at: string;
    updated_at: string;
}

export interface WordCategory {
    id: string;
    name_en: string;
    name_ar: string;
    slug: string;
    icon_name?: string;
    color_hex?: string;
    sort_order: number;
    is_active: boolean;
}

// ============================================================================
// API Request/Response Types
// ============================================================================

// النظام الأول
export interface ToggleHighlightRequest {
    language_code: string;
    page_id: string;
    word_id: string;
}

export interface ToggleHighlightResponse {
    success: boolean;
    highlighted_words: AllHighlights;
    is_now_highlighted: boolean;
}

export interface GetPageWordsRequest {
    page_id: string;
    language_code: string;
}

export interface GetPageWordsResponse {
    success: boolean;
    words: PageWordWithHighlight[];
}

// النظام الثاني
export interface CreateWordBankEntryRequest {
    language_code: string;
    word_text: string;
    word_definition?: string;
    category_slug?: string;
    difficulty_level?: number;
    example_sentence?: string;
    phonetic_text?: string;
    notes?: string;
}

export interface AddTranslationRequest {
    word_bank_id: string;
    target_language: string;
    translated_text: string;
    pronunciation_url?: string;
    example_sentence?: string;
}

// ============================================================================
// خدمة الترجمة والنطق
// ============================================================================

export interface TranslateRequest {
    text: string;
    from: string;
    to: string;
}

export interface TranslateResponse {
    success: boolean;
    translation: string;
    pronunciation_url?: string;
    from_language: string;
    to_language: string;
}

export interface TTSRequest {
    text: string;
    language: string;
}

// ============================================================================
// Admin Panel Types
// ============================================================================

export interface PageWordsFilter {
    language_code?: string;
    page_id?: string;
    search?: string;
}

export interface WordBankFilter {
    language_code?: string;
    category?: string;
    difficulty_level?: number;
    search?: string;
}

export interface BulkPageWordsRequest {
    page_id: string;
    language_code: string;
    words: Array<{
        word_id: string;
        word_text: string;
        word_context?: string;
        word_position: number;
    }>;
}

// ============================================================================
// إحصائيات التعليم
// ============================================================================

export interface HighlightStats {
    language_code: string;
    total_pages: number;
    total_words: number;
}

// ============================================================================
// كاش الترجمة
// ============================================================================

export interface TranslationCacheEntry {
    id: string;
    source_text: string;
    source_lang: string;
    target_lang: string;
    translated_text: string;
    provider: string;
    created_at: string;
}
