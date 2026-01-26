"use client";

/**
 * WordHighlighter Component
 * مكون عرض الكلمات القابلة للتعليم مع ترجمة ونطق
 * يدعم: Click/Tap للتعليم، Right-click/Long-press للترجمة
 */

import { useState, useEffect, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Volume2, Languages, X, Loader2, Check, BookMarked } from "lucide-react";
import { PageWordWithHighlight, AllHighlights } from "@/lib/words/types";

// ============================================================================
// Types
// ============================================================================

interface WordHighlighterProps {
    pageId: string;
    languageCode: string;
    targetLanguage?: string;
    onHighlightChange?: (wordId: string, isHighlighted: boolean) => void;
}

interface TranslationPopupData {
    word: string;
    wordId: string;
    translation: string | null;
    isLoading: boolean;
    position: { x: number; y: number };
}

// ============================================================================
// Translation Cache (localStorage)
// ============================================================================

const CACHE_KEY = "translation_cache";
const CACHE_TTL = 7 * 24 * 60 * 60 * 1000; // 7 أيام

function getTranslationCache(text: string, from: string, to: string): string | null {
    if (typeof window === "undefined") return null;
    
    try {
        const cache = JSON.parse(localStorage.getItem(CACHE_KEY) || "{}");
        const key = `${from}:${to}:${text.toLowerCase()}`;
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
    if (typeof window === "undefined") return;
    
    try {
        const cache = JSON.parse(localStorage.getItem(CACHE_KEY) || "{}");
        const key = `${from}:${to}:${text.toLowerCase()}`;
        cache[key] = { translation, timestamp: Date.now() };
        
        // حذف الإدخالات القديمة (أكثر من 1000 إدخال)
        const keys = Object.keys(cache);
        if (keys.length > 1000) {
            const sorted = keys.sort((a, b) => cache[a].timestamp - cache[b].timestamp);
            sorted.slice(0, 200).forEach(k => delete cache[k]);
        }
        
        localStorage.setItem(CACHE_KEY, JSON.stringify(cache));
    } catch {
        // ignore
    }
}

// ============================================================================
// TTS Helper
// ============================================================================

function speakText(text: string, langCode: string): void {
    if (typeof window === "undefined" || !("speechSynthesis" in window)) return;
    
    // إيقاف أي نطق سابق
    speechSynthesis.cancel();
    
    const utterance = new SpeechSynthesisUtterance(text);
    
    // تحديد locale النطق
    const localeMap: Record<string, string> = {
        ar: "ar-SA",
        en: "en-US",
        fr: "fr-FR",
        de: "de-DE",
        es: "es-ES",
        it: "it-IT",
    };
    
    utterance.lang = localeMap[langCode] || langCode;
    
    // محاولة اختيار صوت مناسب
    const voices = speechSynthesis.getVoices();
    const preferredVoice = voices.find(v => v.lang.startsWith(langCode));
    if (preferredVoice) {
        utterance.voice = preferredVoice;
    }
    
    speechSynthesis.speak(utterance);
}

// ============================================================================
// Main Component
// ============================================================================

export default function WordHighlighter({
    pageId,
    languageCode,
    targetLanguage = "ar",
    onHighlightChange,
}: WordHighlighterProps) {
    const [words, setWords] = useState<PageWordWithHighlight[]>([]);
    const [userHighlights, setUserHighlights] = useState<AllHighlights>({});
    const [isLoading, setIsLoading] = useState(true);
    const [popup, setPopup] = useState<TranslationPopupData | null>(null);
    const [pendingToggle, setPendingToggle] = useState<string | null>(null);
    
    const longPressTimer = useRef<NodeJS.Timeout | null>(null);
    const containerRef = useRef<HTMLDivElement>(null);

    // جلب الكلمات والتعليم
    const fetchData = useCallback(async () => {
        setIsLoading(true);
        try {
            // جلب كلمات الصفحة
            const wordsRes = await fetch(
                `/api/words/page-words?page_id=${pageId}&language_code=${languageCode}`
            );
            const wordsData = await wordsRes.json();

            // جلب تعليم المستخدم
            const highlightsRes = await fetch("/api/words/highlight");
            const highlightsData = await highlightsRes.json();

            if (wordsData.success) {
                const pageHighlights = highlightsData.highlighted_words?.[languageCode]?.[pageId] || {};
                
                const wordsWithHighlights = wordsData.words.map((w: PageWordWithHighlight) => ({
                    ...w,
                    is_highlighted: !!pageHighlights[w.word_id],
                    highlighted_at: pageHighlights[w.word_id]?.at,
                }));
                
                setWords(wordsWithHighlights);
                setUserHighlights(highlightsData.highlighted_words || {});
            }
        } catch (error) {
            console.error("Error fetching words:", error);
        } finally {
            setIsLoading(false);
        }
    }, [pageId, languageCode]);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    // Toggle تعليم كلمة
    const toggleHighlight = useCallback(async (wordId: string) => {
        setPendingToggle(wordId);
        
        // تحديث متفائل
        setWords(prev =>
            prev.map(w =>
                w.word_id === wordId
                    ? { ...w, is_highlighted: !w.is_highlighted }
                    : w
            )
        );

        try {
            const res = await fetch("/api/words/highlight", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    language_code: languageCode,
                    page_id: pageId,
                    word_id: wordId,
                }),
            });

            const data = await res.json();
            
            if (data.success) {
                setUserHighlights(data.highlighted_words);
                onHighlightChange?.(wordId, data.is_now_highlighted);
            } else {
                // Revert
                setWords(prev =>
                    prev.map(w =>
                        w.word_id === wordId
                            ? { ...w, is_highlighted: !w.is_highlighted }
                            : w
                    )
                );
            }
        } catch (error) {
            console.error("Toggle error:", error);
            // Revert
            setWords(prev =>
                prev.map(w =>
                    w.word_id === wordId
                        ? { ...w, is_highlighted: !w.is_highlighted }
                        : w
                )
            );
        } finally {
            setPendingToggle(null);
        }
    }, [languageCode, pageId, onHighlightChange]);

    // ترجمة كلمة
    const translateWord = useCallback(async (word: string, wordId: string, x: number, y: number) => {
        // تحقق من الكاش أولاً
        const cached = getTranslationCache(word, languageCode, targetLanguage);
        
        setPopup({
            word,
            wordId,
            translation: cached,
            isLoading: !cached,
            position: { x, y },
        });

        if (cached) return;

        try {
            const res = await fetch(
                `/api/words/translate?text=${encodeURIComponent(word)}&from=${languageCode}&to=${targetLanguage}`
            );
            const data = await res.json();

            if (data.success) {
                setTranslationCache(word, languageCode, targetLanguage, data.translation);
                setPopup(prev =>
                    prev?.wordId === wordId
                        ? { ...prev, translation: data.translation, isLoading: false }
                        : prev
                );
            } else {
                setPopup(prev =>
                    prev?.wordId === wordId
                        ? { ...prev, translation: "الترجمة غير متاحة", isLoading: false }
                        : prev
                );
            }
        } catch {
            setPopup(prev =>
                prev?.wordId === wordId
                    ? { ...prev, translation: "فشل الاتصال", isLoading: false }
                    : prev
            );
        }
    }, [languageCode, targetLanguage]);

    // معالجة Click
    const handleClick = (wordId: string) => {
        if (longPressTimer.current) {
            clearTimeout(longPressTimer.current);
            longPressTimer.current = null;
        }
        toggleHighlight(wordId);
    };

    // معالجة Context Menu (Right-click)
    const handleContextMenu = (e: React.MouseEvent, word: PageWordWithHighlight) => {
        e.preventDefault();
        translateWord(word.word_text, word.word_id, e.clientX, e.clientY);
    };

    // معالجة Touch Start (Long press)
    const handleTouchStart = (word: PageWordWithHighlight, e: React.TouchEvent) => {
        const touch = e.touches[0];
        longPressTimer.current = setTimeout(() => {
            translateWord(word.word_text, word.word_id, touch.clientX, touch.clientY);
            longPressTimer.current = null;
        }, 500);
    };

    // معالجة Touch End
    const handleTouchEnd = () => {
        if (longPressTimer.current) {
            clearTimeout(longPressTimer.current);
            longPressTimer.current = null;
        }
    };

    // إغلاق Popup
    const closePopup = () => setPopup(null);

    // Click خارج Popup
    useEffect(() => {
        const handleClickOutside = (e: MouseEvent) => {
            if (popup && containerRef.current && !containerRef.current.contains(e.target as Node)) {
                closePopup();
            }
        };

        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, [popup]);

    if (isLoading) {
        return (
            <div className="flex items-center justify-center p-8">
                <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
            </div>
        );
    }

    if (words.length === 0) {
        return null;
    }

    return (
        <div ref={containerRef} className="relative">
            {/* Words */}
            <div className="flex flex-wrap gap-2" dir={languageCode === "ar" ? "rtl" : "ltr"}>
                {words.map((word) => (
                    <motion.span
                        key={word.word_id}
                        onClick={() => handleClick(word.word_id)}
                        onContextMenu={(e) => handleContextMenu(e, word)}
                        onTouchStart={(e) => handleTouchStart(word, e)}
                        onTouchEnd={handleTouchEnd}
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        className={`
                            relative cursor-pointer px-2 py-1 rounded-lg transition-all duration-200 select-none
                            ${word.is_highlighted
                                ? "bg-primary-500/20 text-primary-600 dark:text-primary-400 ring-2 ring-primary-500/30"
                                : "bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700"
                            }
                            ${pendingToggle === word.word_id ? "opacity-70" : ""}
                        `}
                        title={word.is_highlighted ? "اضغط لإلغاء التعليم" : "اضغط للتعليم، ضغط مطول للترجمة"}
                    >
                        {word.word_text}
                        {word.is_highlighted && (
                            <span className="absolute -top-1 -right-1 w-2 h-2 bg-primary-500 rounded-full" />
                        )}
                    </motion.span>
                ))}
            </div>

            {/* Translation Popup */}
            <AnimatePresence>
                {popup && (
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9, y: 10 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.9, y: 10 }}
                        style={{
                            position: "fixed",
                            left: Math.min(popup.position.x, window.innerWidth - 280),
                            top: Math.min(popup.position.y + 10, window.innerHeight - 200),
                        }}
                        className="z-50 w-64 bg-white dark:bg-gray-800 rounded-xl shadow-2xl border border-gray-200 dark:border-gray-700 overflow-hidden"
                    >
                        {/* Header */}
                        <div className="flex items-center justify-between px-3 py-2 bg-gray-50 dark:bg-gray-900/50 border-b border-gray-200 dark:border-gray-700">
                            <div className="flex items-center gap-2">
                                <span className="font-bold text-gray-900 dark:text-white text-lg">
                                    {popup.word}
                                </span>
                                <button
                                    onClick={() => speakText(popup.word, languageCode)}
                                    className="p-1.5 text-gray-500 hover:text-primary-600 hover:bg-primary-50 dark:hover:bg-primary-900/30 rounded-lg transition-colors"
                                    title="استمع للنطق"
                                >
                                    <Volume2 className="h-4 w-4" />
                                </button>
                            </div>
                            <button
                                onClick={closePopup}
                                className="p-1 text-gray-400 hover:text-gray-600 hover:bg-gray-100 dark:hover:bg-gray-700 rounded"
                            >
                                <X className="h-4 w-4" />
                            </button>
                        </div>

                        {/* Translation */}
                        <div className="p-3">
                            {popup.isLoading ? (
                                <div className="flex items-center justify-center py-3">
                                    <Loader2 className="h-5 w-5 animate-spin text-gray-400" />
                                </div>
                            ) : (
                                <div className="space-y-2">
                                    <div className="flex items-center gap-1.5 text-xs text-gray-500">
                                        <Languages className="h-3.5 w-3.5" />
                                        <span>الترجمة</span>
                                    </div>
                                    <p className="text-lg font-medium text-gray-900 dark:text-white" dir="rtl">
                                        {popup.translation}
                                    </p>
                                    {popup.translation && popup.translation !== "الترجمة غير متاحة" && (
                                        <button
                                            onClick={() => speakText(popup.translation!, targetLanguage)}
                                            className="flex items-center gap-1.5 text-sm text-primary-600 hover:text-primary-700"
                                        >
                                            <Volume2 className="h-3.5 w-3.5" />
                                            استمع للترجمة
                                        </button>
                                    )}
                                </div>
                            )}
                        </div>

                        {/* Actions */}
                        <div className="px-3 py-2 bg-gray-50 dark:bg-gray-900/50 border-t border-gray-200 dark:border-gray-700">
                            <button
                                onClick={() => {
                                    toggleHighlight(popup.wordId);
                                    closePopup();
                                }}
                                className={`w-full flex items-center justify-center gap-2 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                                    words.find(w => w.word_id === popup.wordId)?.is_highlighted
                                        ? "bg-red-100 text-red-600 hover:bg-red-200 dark:bg-red-900/30 dark:text-red-400"
                                        : "bg-primary-100 text-primary-600 hover:bg-primary-200 dark:bg-primary-900/30 dark:text-primary-400"
                                }`}
                            >
                                {words.find(w => w.word_id === popup.wordId)?.is_highlighted ? (
                                    <>
                                        <X className="h-4 w-4" />
                                        إلغاء التعليم
                                    </>
                                ) : (
                                    <>
                                        <BookMarked className="h-4 w-4" />
                                        تعليم الكلمة
                                    </>
                                )}
                            </button>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Stats */}
            <div className="mt-4 flex items-center gap-4 text-sm text-gray-500">
                <span className="flex items-center gap-1">
                    <Check className="h-4 w-4 text-primary-500" />
                    {words.filter(w => w.is_highlighted).length} كلمة معلّمة
                </span>
                <span>من أصل {words.length} كلمة</span>
            </div>
        </div>
    );
}

// ============================================================================
// Selection-based Translation (للنص المحدد)
// ============================================================================

export function useTextSelection(
    containerRef: React.RefObject<HTMLElement>,
    languageCode: string,
    targetLanguage: string = "ar"
) {
    const [selectedText, setSelectedText] = useState("");
    const [translation, setTranslation] = useState<string | null>(null);
    const [isTranslating, setIsTranslating] = useState(false);
    const [popupPosition, setPopupPosition] = useState<{ x: number; y: number } | null>(null);

    const handleSelection = useCallback(() => {
        const selection = window.getSelection();
        const text = selection?.toString().trim();

        if (text && text.length > 0 && text.length <= 500) {
            const range = selection?.getRangeAt(0);
            const rect = range?.getBoundingClientRect();
            
            if (rect) {
                setSelectedText(text);
                setPopupPosition({ x: rect.left + rect.width / 2, y: rect.bottom });
                
                // تحقق من الكاش
                const cached = getTranslationCache(text, languageCode, targetLanguage);
                if (cached) {
                    setTranslation(cached);
                    return;
                }

                // ترجمة
                setIsTranslating(true);
                fetch(`/api/words/translate?text=${encodeURIComponent(text)}&from=${languageCode}&to=${targetLanguage}`)
                    .then(res => res.json())
                    .then(data => {
                        if (data.success) {
                            setTranslationCache(text, languageCode, targetLanguage, data.translation);
                            setTranslation(data.translation);
                        }
                    })
                    .catch(() => setTranslation("فشل الترجمة"))
                    .finally(() => setIsTranslating(false));
            }
        } else {
            setSelectedText("");
            setTranslation(null);
            setPopupPosition(null);
        }
    }, [languageCode, targetLanguage]);

    useEffect(() => {
        const container = containerRef.current;
        if (!container) return;

        container.addEventListener("mouseup", handleSelection);
        container.addEventListener("touchend", handleSelection);

        return () => {
            container.removeEventListener("mouseup", handleSelection);
            container.removeEventListener("touchend", handleSelection);
        };
    }, [containerRef, handleSelection]);

    const clearSelection = () => {
        setSelectedText("");
        setTranslation(null);
        setPopupPosition(null);
        window.getSelection()?.removeAllRanges();
    };

    return {
        selectedText,
        translation,
        isTranslating,
        popupPosition,
        clearSelection,
        speak: (text: string, lang: string) => speakText(text, lang),
    };
}
