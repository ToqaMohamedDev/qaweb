/**
 * Words Utilities - مكتبة موحدة للكلمات والقاموس
 * تجمع كل Types و Functions المشتركة لتجنب التكرار
 */

// ============================================
// Types - الأنواع المشتركة
// ============================================

export interface LexicalEntry {
    lemma: string;
    pronunciations?: { ipa: string; region: string }[];
    inflections?: { form: string; features: string[] }[];
    examples?: string[];
    gender?: string;
}

export interface DictionaryWord {
    concept_id: string;
    word_family_root: string;
    definition: string | null;
    part_of_speech: string | null;
    domains: string[] | null;
    lexical_entries: Record<string, LexicalEntry> | null;
    relations: { synonyms?: string[]; antonyms?: string[] } | null;
    lemma?: string;
    pronunciations?: { ipa: string; region: string }[];
}

export interface MyWord {
    id: string;
    user_id: string;
    concept_id: string;
    notes: string | null;
    is_favorite: boolean;
    created_at: string;
    dictionary: DictionaryWord;
}

export interface Pagination {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
}

export interface LanguageConfig {
    code: string;
    name: string;
    nameAr: string;
    flag: string;
    dir: "ltr" | "rtl";
}

// ============================================
// Language Configuration - إعدادات اللغات
// ============================================

export const LANGUAGES: Record<string, LanguageConfig> = {
    ar: { code: "ar", name: "Arabic", nameAr: "العربية", flag: "🇸🇦", dir: "rtl" },
    en: { code: "en", name: "English", nameAr: "الإنجليزية", flag: "🇬🇧", dir: "ltr" },
    fr: { code: "fr", name: "French", nameAr: "الفرنسية", flag: "🇫🇷", dir: "ltr" },
    de: { code: "de", name: "German", nameAr: "الألمانية", flag: "🇩🇪", dir: "ltr" },
};

// اللغات المعروضة في الفلتر (بدون العربية)
export const DISPLAY_LANGUAGES = Object.values(LANGUAGES).filter(l => l.code !== "ar");

// كل اللغات
export const ALL_LANGUAGES = Object.values(LANGUAGES);

// ============================================
// Locale Map - خريطة اللغات للنطق
// ============================================

export const LOCALE_MAP: Record<string, string> = {
    ar: "ar-SA",
    en: "en-US",
    fr: "fr-FR",
    de: "de-DE",
};

// ============================================
// Text-to-Speech - النطق الصوتي
// ============================================

/**
 * نطق النص بصوت مسموع
 * @param text النص المراد نطقه
 * @param langCode كود اللغة
 */
export function speakText(text: string, langCode: string): void {
    if (typeof window === "undefined" || !("speechSynthesis" in window)) return;
    
    speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = LOCALE_MAP[langCode] || langCode;
    utterance.rate = 0.9;
    utterance.pitch = 1.0;

    const voices = speechSynthesis.getVoices();
    const targetLang = LOCALE_MAP[langCode] || langCode;
    
    // البحث عن صوت مناسب بالترتيب: مطابقة كاملة > يبدأ بنفس الكود
    let voice = voices.find(v => v.lang === targetLang);
    if (!voice) {
        voice = voices.find(v => v.lang.startsWith(langCode));
    }
    if (voice) {
        utterance.voice = voice;
    }

    speechSynthesis.speak(utterance);
}

// ============================================
// Word Helpers - دوال مساعدة للكلمات
// ============================================

/**
 * الحصول على lemma للغة معينة
 */
export function getLemma(word: DictionaryWord, lang: string): string {
    const entries = word.lexical_entries || {};
    const langEntry = entries[lang] as LexicalEntry | undefined;
    return langEntry?.lemma || word.word_family_root;
}

/**
 * الحصول على النطق الصوتي (IPA)
 */
export function getIpa(word: DictionaryWord, lang: string): string {
    const entries = word.lexical_entries || {};
    const langEntry = entries[lang] as LexicalEntry | undefined;
    return langEntry?.pronunciations?.[0]?.ipa || "";
}

/**
 * الحصول على إعدادات اللغة
 */
export function getLanguageConfig(code: string): LanguageConfig | undefined {
    return LANGUAGES[code];
}

/**
 * تنسيق التاريخ بالعربية
 */
export function formatDateAr(date: string | Date): string {
    return new Date(date).toLocaleDateString("ar-EG", {
        year: "numeric",
        month: "short",
        day: "numeric",
    });
}

/**
 * ترجمة الجنس
 */
export function translateGender(gender: string): string {
    const genderMap: Record<string, string> = {
        masculine: "مذكر",
        feminine: "مؤنث",
        neuter: "محايد",
    };
    return genderMap[gender] || gender;
}

// ============================================
// Part of Speech Labels - تسميات أقسام الكلام
// ============================================

export const PART_OF_SPEECH_LABELS: Record<string, string> = {
    noun: "اسم",
    verb: "فعل",
    adjective: "صفة",
    adverb: "ظرف",
    pronoun: "ضمير",
    preposition: "حرف جر",
    conjunction: "حرف عطف",
    interjection: "تعجب",
    article: "أداة تعريف",
    determiner: "محدد",
};

/**
 * الحصول على تسمية قسم الكلام بالعربية
 */
export function getPartOfSpeechLabel(pos: string | null): string {
    if (!pos) return "";
    return PART_OF_SPEECH_LABELS[pos.toLowerCase()] || pos;
}
