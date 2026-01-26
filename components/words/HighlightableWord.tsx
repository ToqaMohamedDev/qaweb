"use client";

/**
 * HighlightableWord Component
 * مكون لعرض كلمة قابلة للتعليم مع ترجمة ونطق
 */

import { useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Volume2, Languages, X, Loader2 } from "lucide-react";

interface HighlightableWordProps {
    word: string;
    languageCode: string;
    isHighlighted?: boolean;
    onToggleHighlight?: (word: string, isNowHighlighted: boolean) => void;
    showTranslation?: boolean;
    targetLanguage?: string;
    className?: string;
}

export default function HighlightableWord({
    word,
    languageCode,
    isHighlighted = false,
    onToggleHighlight,
    showTranslation = true,
    targetLanguage = "ar",
    className = "",
}: HighlightableWordProps) {
    const [highlighted, setHighlighted] = useState(isHighlighted);
    const [showPopup, setShowPopup] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [translation, setTranslation] = useState<string | null>(null);
    const [isPlaying, setIsPlaying] = useState(false);

    // Toggle highlight
    const handleClick = useCallback(async () => {
        const newState = !highlighted;
        setHighlighted(newState);

        if (onToggleHighlight) {
            onToggleHighlight(word, newState);
        }

        // إرسال للـ API
        try {
            const res = await fetch("/api/words/highlight", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    language_code: languageCode,
                    word: word,
                }),
            });

            const data = await res.json();
            if (data.success) {
                setHighlighted(data.is_now_highlighted);
            }
        } catch (error) {
            console.error("Error toggling highlight:", error);
            // Revert on error
            setHighlighted(!newState);
        }
    }, [highlighted, word, languageCode, onToggleHighlight]);

    // فتح popup الترجمة
    const handleContextMenu = useCallback(
        async (e: React.MouseEvent) => {
            e.preventDefault();
            if (!showTranslation) return;

            setShowPopup(true);
            setIsLoading(true);

            try {
                const res = await fetch(
                    `/api/words/translate?text=${encodeURIComponent(word)}&from=${languageCode}&to=${targetLanguage}`
                );
                const data = await res.json();

                if (data.success) {
                    setTranslation(data.translation);
                }
            } catch (error) {
                console.error("Translation error:", error);
            } finally {
                setIsLoading(false);
            }
        },
        [word, languageCode, targetLanguage, showTranslation]
    );

    // نطق الكلمة
    const speakWord = useCallback(() => {
        if ("speechSynthesis" in window) {
            setIsPlaying(true);
            const utterance = new SpeechSynthesisUtterance(word);
            utterance.lang = languageCode;
            utterance.onend = () => setIsPlaying(false);
            utterance.onerror = () => setIsPlaying(false);
            speechSynthesis.speak(utterance);
        }
    }, [word, languageCode]);

    return (
        <span className="relative inline-block">
            <motion.span
                onClick={handleClick}
                onContextMenu={handleContextMenu}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className={`
                    cursor-pointer px-1 py-0.5 rounded transition-all duration-200
                    ${highlighted
                        ? "bg-primary-500/20 text-primary-600 dark:text-primary-400 border-b-2 border-primary-500"
                        : "hover:bg-gray-100 dark:hover:bg-gray-800"
                    }
                    ${className}
                `}
                title="اضغط للتعليم، كليك يمين للترجمة"
            >
                {word}
            </motion.span>

            {/* Translation Popup */}
            <AnimatePresence>
                {showPopup && (
                    <>
                        {/* Backdrop */}
                        <div
                            className="fixed inset-0 z-40"
                            onClick={() => setShowPopup(false)}
                        />

                        {/* Popup */}
                        <motion.div
                            initial={{ opacity: 0, y: 10, scale: 0.95 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            exit={{ opacity: 0, y: 10, scale: 0.95 }}
                            className="absolute z-50 bottom-full left-1/2 -translate-x-1/2 mb-2 min-w-[200px] bg-white dark:bg-gray-800 rounded-xl shadow-xl border border-gray-200 dark:border-gray-700 overflow-hidden"
                        >
                            {/* Header */}
                            <div className="flex items-center justify-between px-3 py-2 bg-gray-50 dark:bg-gray-900/50 border-b border-gray-200 dark:border-gray-700">
                                <div className="flex items-center gap-2">
                                    <span className="font-bold text-gray-900 dark:text-white">
                                        {word}
                                    </span>
                                    <button
                                        onClick={speakWord}
                                        disabled={isPlaying}
                                        className="p-1 text-gray-500 hover:text-primary-600 transition-colors disabled:opacity-50"
                                        title="استمع للنطق"
                                    >
                                        <Volume2
                                            className={`h-4 w-4 ${isPlaying ? "animate-pulse text-primary-600" : ""}`}
                                        />
                                    </button>
                                </div>
                                <button
                                    onClick={() => setShowPopup(false)}
                                    className="p-1 text-gray-400 hover:text-gray-600"
                                >
                                    <X className="h-4 w-4" />
                                </button>
                            </div>

                            {/* Content */}
                            <div className="p-3">
                                {isLoading ? (
                                    <div className="flex items-center justify-center py-2">
                                        <Loader2 className="h-5 w-5 animate-spin text-gray-400" />
                                    </div>
                                ) : translation ? (
                                    <div className="space-y-2">
                                        <div className="flex items-center gap-2 text-sm text-gray-500">
                                            <Languages className="h-4 w-4" />
                                            <span>الترجمة</span>
                                        </div>
                                        <p className="text-lg font-medium text-gray-900 dark:text-white">
                                            {translation}
                                        </p>
                                    </div>
                                ) : (
                                    <p className="text-gray-500 text-sm">لا توجد ترجمة</p>
                                )}
                            </div>

                            {/* Footer */}
                            <div className="px-3 py-2 bg-gray-50 dark:bg-gray-900/50 border-t border-gray-200 dark:border-gray-700">
                                <button
                                    onClick={handleClick}
                                    className={`w-full py-1.5 rounded-lg text-sm font-medium transition-colors ${
                                        highlighted
                                            ? "bg-red-100 text-red-600 hover:bg-red-200 dark:bg-red-900/30 dark:text-red-400"
                                            : "bg-primary-100 text-primary-600 hover:bg-primary-200 dark:bg-primary-900/30 dark:text-primary-400"
                                    }`}
                                >
                                    {highlighted ? "إلغاء التعليم" : "تعليم الكلمة"}
                                </button>
                            </div>
                        </motion.div>
                    </>
                )}
            </AnimatePresence>
        </span>
    );
}

/**
 * Hook لإدارة الكلمات المعلّمة
 */
export function useWordHighlights(languageCode: string) {
    const [highlightedWords, setHighlightedWords] = useState<string[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    // جلب الكلمات المعلّمة
    const fetchHighlights = useCallback(async () => {
        try {
            const res = await fetch("/api/words/highlight");
            const data = await res.json();

            if (data.success && data.highlighted_words) {
                setHighlightedWords(data.highlighted_words[languageCode] || []);
            }
        } catch (error) {
            console.error("Error fetching highlights:", error);
        } finally {
            setIsLoading(false);
        }
    }, [languageCode]);

    // Toggle كلمة
    const toggleWord = useCallback(
        async (word: string) => {
            const isCurrentlyHighlighted = highlightedWords.includes(word);

            // Optimistic update
            if (isCurrentlyHighlighted) {
                setHighlightedWords((prev) => prev.filter((w) => w !== word));
            } else {
                setHighlightedWords((prev) => [...prev, word]);
            }

            try {
                const res = await fetch("/api/words/highlight", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                        language_code: languageCode,
                        word: word,
                    }),
                });

                const data = await res.json();
                if (data.success) {
                    setHighlightedWords(data.highlighted_words[languageCode] || []);
                }
            } catch (error) {
                console.error("Error toggling highlight:", error);
                // Revert on error
                if (isCurrentlyHighlighted) {
                    setHighlightedWords((prev) => [...prev, word]);
                } else {
                    setHighlightedWords((prev) => prev.filter((w) => w !== word));
                }
            }
        },
        [highlightedWords, languageCode]
    );

    // تحقق إذا كلمة معلّمة
    const isHighlighted = useCallback(
        (word: string) => highlightedWords.includes(word),
        [highlightedWords]
    );

    return {
        highlightedWords,
        isLoading,
        fetchHighlights,
        toggleWord,
        isHighlighted,
    };
}
