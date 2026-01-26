'use client';

/**
 * Global Word Provider
 * نظام عالمي للترجمة والنطق والتعليم يعمل في كل صفحات الموقع
 * - اختيار أي نص → ترجمة فورية
 * - نطق الكلمات بأي لغة
 * - حفظ الكلمات المفضلة
 */

import React, {
    createContext,
    useContext,
    useState,
    useCallback,
    useEffect,
    useRef,
    type ReactNode,
} from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import {
    X,
    Volume2,
    Languages,
    Loader2,
    BookmarkPlus,
    Check,
    Copy,
    ChevronDown,
} from 'lucide-react';

// ============================================================================
// Types
// ============================================================================

interface SupportedLanguage {
    code: string;
    name_ar: string;
    name_en: string;
    name_native: string;
    flag_emoji: string | null;
    text_direction: 'ltr' | 'rtl';
    is_active: boolean;
}

interface TranslationResult {
    success: boolean;
    translation: string;
    from_language: string;
    to_language: string;
}

interface PopupData {
    text: string;
    translation: string | null;
    isLoading: boolean;
    position: { x: number; y: number };
    sourceLang: string;
    targetLang: string;
}

interface GlobalWordContextType {
    isEnabled: boolean;
    setIsEnabled: (enabled: boolean) => void;
    sourceLang: string;
    setSourceLang: (lang: string) => void;
    targetLang: string;
    setTargetLang: (lang: string) => void;
    languages: SupportedLanguage[];
    speak: (text: string, lang?: string) => void;
    translate: (text: string, from?: string, to?: string) => Promise<TranslationResult>;
    saveWord: (word: string, translation: string, lang: string) => Promise<boolean>;
    isLoggedIn: boolean;
}

// ============================================================================
// Context
// ============================================================================

const GlobalWordContext = createContext<GlobalWordContextType | null>(null);

export function useGlobalWord() {
    const context = useContext(GlobalWordContext);
    if (!context) {
        throw new Error('useGlobalWord must be used within GlobalWordProvider');
    }
    return context;
}

// ============================================================================
// TTS Helper
// ============================================================================

const TTS_VOICES: Record<string, string> = {
    ar: 'ar-SA',
    en: 'en-US',
    fr: 'fr-FR',
    de: 'de-DE',
    es: 'es-ES',
    it: 'it-IT',
    pt: 'pt-BR',
    ru: 'ru-RU',
    zh: 'zh-CN',
    ja: 'ja-JP',
    ko: 'ko-KR',
    tr: 'tr-TR',
    nl: 'nl-NL',
    pl: 'pl-PL',
    he: 'he-IL',
    hi: 'hi-IN',
};

function speakText(text: string, langCode: string): void {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) return;

    // إيقاف أي نطق سابق
    speechSynthesis.cancel();

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = TTS_VOICES[langCode] || langCode;

    // محاولة اختيار صوت مناسب
    const voices = speechSynthesis.getVoices();
    const preferredVoice = voices.find((v) => v.lang.startsWith(langCode));
    if (preferredVoice) {
        utterance.voice = preferredVoice;
    }

    speechSynthesis.speak(utterance);
}

// ============================================================================
// Translation Cache (localStorage)
// ============================================================================

const CACHE_KEY = 'global_translation_cache';
const CACHE_TTL = 24 * 60 * 60 * 1000; // 24 hours

function getTranslationCache(text: string, from: string, to: string): string | null {
    if (typeof window === 'undefined') return null;

    try {
        const cache = JSON.parse(localStorage.getItem(CACHE_KEY) || '{}');
        const key = `${from}:${to}:${text.toLowerCase().trim()}`;
        const entry = cache[key];

        if (entry && Date.now() - entry.timestamp < CACHE_TTL) {
            return entry.translation;
        }
    } catch {
        // ignore
    }
    return null;
}

function setTranslationCache(text: string, from: string, to: string, translation: string): void {
    if (typeof window === 'undefined') return;

    try {
        const cache = JSON.parse(localStorage.getItem(CACHE_KEY) || '{}');
        const key = `${from}:${to}:${text.toLowerCase().trim()}`;
        cache[key] = { translation, timestamp: Date.now() };

        // حذف الإدخالات القديمة (أكثر من 500 إدخال)
        const keys = Object.keys(cache);
        if (keys.length > 500) {
            const sorted = keys.sort((a, b) => cache[a].timestamp - cache[b].timestamp);
            sorted.slice(0, 100).forEach((k) => delete cache[k]);
        }

        localStorage.setItem(CACHE_KEY, JSON.stringify(cache));
    } catch {
        // ignore
    }
}

// ============================================================================
// Language Detection (basic)
// ============================================================================

function detectLanguage(text: string): string {
    // كشف بسيط للغة بناءً على الحروف
    const arabicPattern = /[\u0600-\u06FF]/;
    const hebrewPattern = /[\u0590-\u05FF]/;
    const cyrillicPattern = /[\u0400-\u04FF]/;
    const chinesePattern = /[\u4E00-\u9FFF]/;
    const japanesePattern = /[\u3040-\u309F\u30A0-\u30FF]/;
    const koreanPattern = /[\uAC00-\uD7AF]/;

    if (arabicPattern.test(text)) return 'ar';
    if (hebrewPattern.test(text)) return 'he';
    if (cyrillicPattern.test(text)) return 'ru';
    if (chinesePattern.test(text)) return 'zh';
    if (japanesePattern.test(text)) return 'ja';
    if (koreanPattern.test(text)) return 'ko';

    return 'en'; // افتراضي
}

// ============================================================================
// Global Word Popup Component
// ============================================================================

interface GlobalWordPopupProps {
    popup: PopupData;
    onClose: () => void;
    onSpeak: (text: string, lang: string) => void;
    onCopy: (text: string) => void;
    languages: SupportedLanguage[];
    onChangeLang: (from: string, to: string) => void;
    onSave: () => void;
    isSaving: boolean;
    saveSuccess: boolean;
    isLoggedIn: boolean;
}

function GlobalWordPopup({
    popup,
    onClose,
    onSpeak,
    onCopy,
    languages,
    onChangeLang,
    onSave,
    isSaving,
    saveSuccess,
    isLoggedIn,
}: GlobalWordPopupProps) {
    const [copied, setCopied] = useState(false);
    const [showLangDropdown, setShowLangDropdown] = useState(false);
    const popupRef = useRef<HTMLDivElement>(null);

    // إغلاق عند النقر خارج
    useEffect(() => {
        const handleClickOutside = (e: MouseEvent) => {
            if (popupRef.current && !popupRef.current.contains(e.target as Node)) {
                onClose();
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [onClose]);

    const handleCopy = () => {
        onCopy(popup.translation || popup.text);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    // حساب موضع الـ popup بحيث لا يخرج من الشاشة
    const getPopupStyle = () => {
        const padding = 16;
        const popupWidth = 320;
        const popupHeight = 200;

        let x = popup.position.x - popupWidth / 2;
        let y = popup.position.y + 10;

        // تأكد من عدم خروجه من اليمين
        if (x + popupWidth > window.innerWidth - padding) {
            x = window.innerWidth - popupWidth - padding;
        }
        // تأكد من عدم خروجه من اليسار
        if (x < padding) {
            x = padding;
        }
        // تأكد من عدم خروجه من الأسفل
        if (y + popupHeight > window.innerHeight - padding) {
            y = popup.position.y - popupHeight - 10;
        }

        return { left: x, top: y };
    };

    const sourceLangInfo = languages.find((l) => l.code === popup.sourceLang);
    const targetLangInfo = languages.find((l) => l.code === popup.targetLang);

    return (
        <motion.div
            ref={popupRef}
            initial={{ opacity: 0, scale: 0.9, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 10 }}
            style={{
                position: 'fixed',
                zIndex: 99999,
                ...getPopupStyle(),
            }}
            className="w-80 bg-white dark:bg-gray-900 rounded-2xl shadow-2xl border border-gray-200 dark:border-gray-700 overflow-hidden"
        >
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3 bg-gradient-to-r from-primary-500/10 to-purple-500/10 dark:from-primary-500/20 dark:to-purple-500/20 border-b border-gray-200 dark:border-gray-700">
                <div className="flex items-center gap-2 flex-1 min-w-0">
                    <span
                        className="font-bold text-gray-900 dark:text-white text-lg truncate"
                        dir={popup.sourceLang === 'ar' || popup.sourceLang === 'he' ? 'rtl' : 'ltr'}
                    >
                        {popup.text}
                    </span>
                    <button
                        onClick={() => onSpeak(popup.text, popup.sourceLang)}
                        className="p-1.5 text-gray-500 hover:text-primary-600 hover:bg-primary-50 dark:hover:bg-primary-900/30 rounded-lg transition-colors flex-shrink-0"
                        title="استمع للنطق"
                    >
                        <Volume2 className="h-4 w-4" />
                    </button>
                </div>
                <button
                    onClick={onClose}
                    className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg flex-shrink-0"
                >
                    <X className="h-4 w-4" />
                </button>
            </div>

            {/* Language Selector */}
            <div className="px-4 py-2 border-b border-gray-100 dark:border-gray-800">
                <div className="relative">
                    <button
                        onClick={() => setShowLangDropdown(!showLangDropdown)}
                        className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400 hover:text-primary-600 dark:hover:text-primary-400 transition-colors"
                    >
                        <Languages className="h-4 w-4" />
                        <span>
                            {sourceLangInfo?.flag_emoji} {sourceLangInfo?.name_ar || popup.sourceLang}
                            {' → '}
                            {targetLangInfo?.flag_emoji} {targetLangInfo?.name_ar || popup.targetLang}
                        </span>
                        <ChevronDown className="h-3 w-3" />
                    </button>

                    {/* Language Dropdown */}
                    <AnimatePresence>
                        {showLangDropdown && (
                            <motion.div
                                initial={{ opacity: 0, y: -10 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -10 }}
                                className="absolute top-full left-0 mt-1 w-64 bg-white dark:bg-gray-800 rounded-lg shadow-xl border border-gray-200 dark:border-gray-700 z-10 max-h-48 overflow-y-auto"
                            >
                                {languages
                                    .filter((l) => l.is_active && l.code !== popup.sourceLang)
                                    .map((lang) => (
                                        <button
                                            key={lang.code}
                                            onClick={() => {
                                                onChangeLang(popup.sourceLang, lang.code);
                                                setShowLangDropdown(false);
                                            }}
                                            className="w-full flex items-center gap-2 px-3 py-2 text-sm hover:bg-gray-100 dark:hover:bg-gray-700 text-right"
                                        >
                                            <span>{lang.flag_emoji}</span>
                                            <span className="text-gray-700 dark:text-gray-300">
                                                {lang.name_ar}
                                            </span>
                                        </button>
                                    ))}
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
            </div>

            {/* Translation Content */}
            <div className="p-4">
                {popup.isLoading ? (
                    <div className="flex items-center justify-center py-4">
                        <Loader2 className="h-6 w-6 animate-spin text-primary-500" />
                        <span className="mr-2 text-gray-500">جاري الترجمة...</span>
                    </div>
                ) : (
                    <div className="space-y-3">
                        <p
                            className="text-xl font-medium text-gray-900 dark:text-white leading-relaxed"
                            dir={popup.targetLang === 'ar' || popup.targetLang === 'he' ? 'rtl' : 'ltr'}
                        >
                            {popup.translation || 'الترجمة غير متاحة'}
                        </p>

                        {popup.translation && popup.translation !== 'الترجمة غير متاحة' && (
                            <div className="flex items-center gap-2">
                                <button
                                    onClick={() => onSpeak(popup.translation!, popup.targetLang)}
                                    className="flex items-center gap-1.5 px-3 py-1.5 text-sm text-primary-600 hover:text-primary-700 hover:bg-primary-50 dark:hover:bg-primary-900/30 rounded-lg transition-colors"
                                >
                                    <Volume2 className="h-4 w-4" />
                                    استمع
                                </button>
                                <button
                                    onClick={handleCopy}
                                    className="flex items-center gap-1.5 px-3 py-1.5 text-sm text-gray-600 hover:text-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                                >
                                    {copied ? (
                                        <>
                                            <Check className="h-4 w-4 text-green-500" />
                                            تم النسخ
                                        </>
                                    ) : (
                                        <>
                                            <Copy className="h-4 w-4" />
                                            نسخ
                                        </>
                                    )}
                                </button>
                            </div>
                        )}
                    </div>
                )}
            </div>

            {/* Footer Actions */}
            {isLoggedIn && popup.translation && popup.translation !== 'الترجمة غير متاحة' && (
                <div className="px-4 py-3 bg-gray-50 dark:bg-gray-800/50 border-t border-gray-200 dark:border-gray-700">
                    <button
                        onClick={onSave}
                        disabled={isSaving || saveSuccess}
                        className={`w-full flex items-center justify-center gap-2 py-2 px-4 rounded-xl text-sm font-medium transition-colors
                            ${saveSuccess
                                ? 'bg-green-500 text-white cursor-not-allowed'
                                : 'bg-primary-500 hover:bg-primary-600 text-white'
                            }
                            ${isSaving ? 'opacity-70 cursor-wait' : ''}
                        `}
                    >
                        {isSaving ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                        ) : saveSuccess ? (
                            <Check className="h-4 w-4" />
                        ) : (
                            <BookmarkPlus className="h-4 w-4" />
                        )}
                        {isSaving ? 'جاري الحفظ...' : saveSuccess ? 'تم الحفظ!' : 'حفظ في قاموسي'}
                    </button>
                </div>
            )}
        </motion.div>
    );
}

// ============================================================================
// Main Provider
// ============================================================================

interface GlobalWordProviderProps {
    children: ReactNode;
}

export function GlobalWordProvider({ children }: GlobalWordProviderProps) {
    const [isEnabled, setIsEnabled] = useState(true);
    const [sourceLang, setSourceLang] = useState('en');
    const [targetLang, setTargetLang] = useState('ar');
    const [languages, setLanguages] = useState<SupportedLanguage[]>([]);
    const [popup, setPopup] = useState<PopupData | null>(null);
    const [isLoggedIn, setIsLoggedIn] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [saveSuccess, setSaveSuccess] = useState(false);

    // التحقق من تسجيل الدخول
    useEffect(() => {
        fetch('/api/auth/session')
            .then((res) => res.json())
            .then((data) => {
                setIsLoggedIn(!!data?.user);
            })
            .catch(() => setIsLoggedIn(false));
    }, []);

    // جلب اللغات المدعومة
    useEffect(() => {
        fetch('/api/words/languages')
            .then((res) => res.json())
            .then((data) => {
                if (data.success && data.languages) {
                    setLanguages(data.languages.filter((l: SupportedLanguage) => l.is_active));
                }
            })
            .catch(console.error);
    }, []);

    // نطق النص
    const speak = useCallback((text: string, lang?: string) => {
        speakText(text, lang || sourceLang);
    }, [sourceLang]);

    // ترجمة النص
    const translate = useCallback(
        async (text: string, from?: string, to?: string): Promise<TranslationResult> => {
            const fromLang = from || sourceLang;
            const toLang = to || targetLang;

            // نفس اللغة
            if (fromLang === toLang) {
                return {
                    success: true,
                    translation: text,
                    from_language: fromLang,
                    to_language: toLang,
                };
            }

            // تحقق من الكاش
            const cached = getTranslationCache(text, fromLang, toLang);
            if (cached) {
                return {
                    success: true,
                    translation: cached,
                    from_language: fromLang,
                    to_language: toLang,
                };
            }

            try {
                const res = await fetch(
                    `/api/words/translate?text=${encodeURIComponent(text)}&from=${fromLang}&to=${toLang}`
                );
                const data = await res.json();

                if (data.success) {
                    setTranslationCache(text, fromLang, toLang, data.translation);
                }

                return data;
            } catch {
                return {
                    success: false,
                    translation: text,
                    from_language: fromLang,
                    to_language: toLang,
                };
            }
        },
        [sourceLang, targetLang]
    );

    // معالجة اختيار النص
    const handleTextSelection = useCallback(() => {
        if (!isEnabled) return;

        const selection = window.getSelection();
        const text = selection?.toString().trim();

        if (!text || text.length === 0 || text.length > 500) {
            return;
        }

        // تجاهل النصوص القصيرة جداً (حرف واحد)
        if (text.length < 2) return;

        const range = selection?.getRangeAt(0);
        const rect = range?.getBoundingClientRect();

        if (!rect) return;

        // كشف لغة النص
        const detectedLang = detectLanguage(text);
        const autoTargetLang = detectedLang === 'ar' ? 'en' : 'ar';

        // تحقق من الكاش أولاً
        const cached = getTranslationCache(text, detectedLang, autoTargetLang);

        setPopup({
            text,
            translation: cached,
            isLoading: !cached,
            position: { x: rect.left + rect.width / 2, y: rect.bottom },
            sourceLang: detectedLang,
            targetLang: autoTargetLang,
        });

        // إذا لم يكن في الكاش، اترجم
        if (!cached) {
            translate(text, detectedLang, autoTargetLang).then((result) => {
                setPopup((prev) =>
                    prev && prev.text === text
                        ? { ...prev, translation: result.translation, isLoading: false }
                        : prev
                );
            });
        }
    }, [isEnabled, translate]);

    // مراقبة اختيار النص
    useEffect(() => {
        if (!isEnabled) return;

        const handleMouseUp = () => {
            // تأخير قليل للسماح للـ selection بالانتهاء
            setTimeout(handleTextSelection, 100);
        };

        const handleTouchEnd = () => {
            setTimeout(handleTextSelection, 200);
        };

        document.addEventListener('mouseup', handleMouseUp);
        document.addEventListener('touchend', handleTouchEnd);

        return () => {
            document.removeEventListener('mouseup', handleMouseUp);
            document.removeEventListener('touchend', handleTouchEnd);
        };
    }, [isEnabled, handleTextSelection]);

    // تحميل الأصوات عند البداية
    useEffect(() => {
        if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
            speechSynthesis.getVoices();
            speechSynthesis.onvoiceschanged = () => {
                speechSynthesis.getVoices();
            };
        }
    }, []);

    // إغلاق الـ popup
    const closePopup = useCallback(() => {
        setPopup(null);
        window.getSelection()?.removeAllRanges();
    }, []);

    // نسخ النص
    const handleCopy = useCallback((text: string) => {
        navigator.clipboard.writeText(text).catch(console.error);
    }, []);

    // تغيير لغة الهدف
    const handleChangeLang = useCallback(
        (from: string, to: string) => {
            if (!popup) return;

            setPopup((prev) =>
                prev ? { ...prev, targetLang: to, isLoading: true, translation: null } : null
            );

            translate(popup.text, from, to).then((result) => {
                setPopup((prev) =>
                    prev && prev.text === popup.text
                        ? { ...prev, translation: result.translation, isLoading: false, targetLang: to }
                        : prev
                );
            });
        },
        [popup, translate]
    );

    // حفظ الكلمة في قاموس المستخدم
    const saveWord = useCallback(
        async (word: string, translation: string, lang: string): Promise<boolean> => {
            if (!isLoggedIn) {
                return false;
            }

            setIsSaving(true);
            try {
                // نستخدم page_id عام للكلمات المحفوظة من الترجمة العالمية
                const res = await fetch('/api/words/highlight', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        language_code: lang,
                        page_id: 'global_translations',
                        word_id: `${word}_${translation}`.replace(/\s+/g, '_').toLowerCase(),
                    }),
                });

                const data = await res.json();
                if (data.success) {
                    setSaveSuccess(true);
                    setTimeout(() => setSaveSuccess(false), 2000);
                    return true;
                }
                return false;
            } catch {
                return false;
            } finally {
                setIsSaving(false);
            }
        },
        [isLoggedIn]
    );

    // معالجة حفظ الكلمة من الـ popup
    const handleSaveWord = useCallback(() => {
        if (!popup || !popup.translation) return;
        saveWord(popup.text, popup.translation, popup.sourceLang);
    }, [popup, saveWord]);

    const contextValue: GlobalWordContextType = {
        isEnabled,
        setIsEnabled,
        sourceLang,
        setSourceLang,
        targetLang,
        setTargetLang,
        languages,
        speak,
        translate,
        saveWord,
        isLoggedIn,
    };

    return (
        <GlobalWordContext.Provider value={contextValue}>
            {children}

            {/* Global Translation Popup */}
            <AnimatePresence>
                {popup && (
                    <GlobalWordPopup
                        popup={popup}
                        onClose={closePopup}
                        onSpeak={speak}
                        onCopy={handleCopy}
                        languages={languages}
                        onChangeLang={handleChangeLang}
                        onSave={handleSaveWord}
                        isSaving={isSaving}
                        saveSuccess={saveSuccess}
                        isLoggedIn={isLoggedIn}
                    />
                )}
            </AnimatePresence>
        </GlobalWordContext.Provider>
    );
}

export default GlobalWordProvider;
