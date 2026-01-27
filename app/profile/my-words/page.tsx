"use client";

/**
 * My Words Page - صفحة كلماتي المحفوظة
 * تعرض جميع الكلمات التي حفظها المستخدم مع إمكانية الترجمة والنطق
 */

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import {
    BookOpen,
    Languages,
    Volume2,
    Search,
    Trash2,
    Loader2,
    BookmarkCheck,
    Globe,
    ChevronDown,
    AlertCircle,
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";

// Types
interface SavedWord {
    wordId: string;
    pageId: string;
    languageCode: string;
    savedAt: string;
    wordText: string; // The actual word text to display
    source: 'word_bank' | 'translation'; // Source of the word
}

interface SupportedLanguage {
    code: string;
    name_en: string;
    name_native: string;
    name_ar?: string;
    flag_emoji?: string;
}

interface GroupedWords {
    [languageCode: string]: {
        [pageId: string]: SavedWord[];
    };
}

// TTS Helper
function speakText(text: string, langCode: string): void {
    if (typeof window === "undefined" || !("speechSynthesis" in window)) return;
    speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    const localeMap: Record<string, string> = {
        ar: "ar-SA",
        en: "en-US",
        fr: "fr-FR",
        de: "de-DE",
        es: "es-ES",
        he: "he-IL",
        ru: "ru-RU",
        zh: "zh-CN",
        ja: "ja-JP",
        ko: "ko-KR",
    };
    utterance.lang = localeMap[langCode] || langCode;
    speechSynthesis.speak(utterance);
}

// Animation variants
const fadeInUp = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.3 } },
};

const staggerContainer = {
    hidden: { opacity: 0 },
    visible: {
        opacity: 1,
        transition: { staggerChildren: 0.05, delayChildren: 0.1 },
    },
};

export default function MyWordsPage() {
    const { user, isLoading: authLoading } = useAuth();
    const [savedWords, setSavedWords] = useState<SavedWord[]>([]);
    const [languages, setLanguages] = useState<SupportedLanguage[]>([]);
    const [selectedLanguage, setSelectedLanguage] = useState<string>("all");
    const [searchQuery, setSearchQuery] = useState("");
    const [isLoading, setIsLoading] = useState(true);
    const [isDeleting, setIsDeleting] = useState<string | null>(null);
    const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set());

    // Fetch languages
    const fetchLanguages = useCallback(async () => {
        try {
            const res = await fetch("/api/words/languages");
            const data = await res.json();
            if (data.success && data.languages) {
                setLanguages(data.languages);
            }
        } catch (error) {
            console.error("Error fetching languages:", error);
        }
    }, []);

    // Fetch user's saved words
    const fetchSavedWords = useCallback(async () => {
        if (!user) return;
        
        setIsLoading(true);
        try {
            const res = await fetch("/api/words/highlight");
            const data = await res.json();
            
            if (data.success && data.highlighted_words) {
                const words: SavedWord[] = [];
                const highlightedWords = data.highlighted_words as Record<string, Record<string, Record<string, { at: string }>>>;
                
                // تحويل البنية المتداخلة إلى قائمة مسطحة
                Object.entries(highlightedWords).forEach(([langCode, pages]) => {
                    Object.entries(pages).forEach(([pageId, wordIds]) => {
                        Object.entries(wordIds).forEach(([wordId, details]) => {
                            // Determine if wordId is a UUID (from word_bank) or text (from translation)
                            const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(wordId);
                            
                            words.push({
                                wordId,
                                pageId,
                                languageCode: langCode,
                                savedAt: details.at,
                                // If it's a UUID, we'll need to fetch word data later
                                // For now, use wordId as the display text (will be replaced if fetched)
                                wordText: isUUID ? wordId : wordId,
                                source: pageId === 'word_bank' ? 'word_bank' : 'translation',
                            });
                        });
                    });
                });
                
                // ترتيب حسب تاريخ الحفظ (الأحدث أولاً)
                words.sort((a, b) => new Date(b.savedAt).getTime() - new Date(a.savedAt).getTime());
                setSavedWords(words);
                
                // فتح كل الأقسام تلقائياً
                const allLangs = new Set(words.map(w => w.languageCode));
                setExpandedSections(allLangs);
            }
        } catch (error) {
            console.error("Error fetching saved words:", error);
        } finally {
            setIsLoading(false);
        }
    }, [user]);

    // Remove a saved word
    const removeWord = useCallback(async (word: SavedWord) => {
        setIsDeleting(word.wordId);
        try {
            const res = await fetch("/api/words/highlight", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    language_code: word.languageCode,
                    page_id: word.pageId,
                    word_id: word.wordId,
                }),
            });
            
            const data = await res.json();
            if (data.success) {
                setSavedWords(prev => prev.filter(w => 
                    !(w.wordId === word.wordId && w.pageId === word.pageId && w.languageCode === word.languageCode)
                ));
            }
        } catch (error) {
            console.error("Error removing word:", error);
        } finally {
            setIsDeleting(null);
        }
    }, []);

    useEffect(() => {
        fetchLanguages();
    }, [fetchLanguages]);

    useEffect(() => {
        if (user) {
            fetchSavedWords();
        }
    }, [user, fetchSavedWords]);

    // Filter words
    const filteredWords = savedWords.filter(word => {
        const matchesLanguage = selectedLanguage === "all" || word.languageCode === selectedLanguage;
        const matchesSearch = !searchQuery || 
            word.wordText?.toLowerCase().includes(searchQuery.toLowerCase()) ||
            word.wordId.toLowerCase().includes(searchQuery.toLowerCase());
        return matchesLanguage && matchesSearch;
    });

    // Group words by language
    const groupedWords: GroupedWords = filteredWords.reduce((acc, word) => {
        if (!acc[word.languageCode]) {
            acc[word.languageCode] = {};
        }
        if (!acc[word.languageCode][word.pageId]) {
            acc[word.languageCode][word.pageId] = [];
        }
        acc[word.languageCode][word.pageId].push(word);
        return acc;
    }, {} as GroupedWords);

    // Toggle section expansion
    const toggleSection = (langCode: string) => {
        setExpandedSections(prev => {
            const newSet = new Set(prev);
            if (newSet.has(langCode)) {
                newSet.delete(langCode);
            } else {
                newSet.add(langCode);
            }
            return newSet;
        });
    };

    // Get language display info
    const getLanguageInfo = (code: string) => {
        const lang = languages.find(l => l.code === code);
        return {
            name: lang?.name_ar || lang?.name_en || code,
            flag: lang?.flag_emoji || "🌐",
        };
    };

    // Loading state
    if (authLoading) {
        return (
            <div className="min-h-screen bg-gray-50 dark:bg-[#0a0a0f] flex items-center justify-center">
                <Loader2 className="w-8 h-8 animate-spin text-primary-500" />
            </div>
        );
    }

    // Not logged in
    if (!user) {
        return (
            <div className="min-h-screen bg-gray-50 dark:bg-[#0a0a0f]" dir="rtl">
                <Navbar />
                <main className="container mx-auto px-4 py-16 text-center">
                    <div className="max-w-md mx-auto">
                        <div className="w-20 h-20 mx-auto rounded-2xl bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center mb-6">
                            <AlertCircle className="w-10 h-10 text-amber-600 dark:text-amber-400" />
                        </div>
                        <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
                            يجب تسجيل الدخول
                        </h1>
                        <p className="text-gray-600 dark:text-gray-400 mb-8">
                            قم بتسجيل الدخول لعرض كلماتك المحفوظة
                        </p>
                        <Link
                            href="/login"
                            className="inline-flex items-center gap-2 px-6 py-3 bg-primary-600 text-white rounded-xl font-semibold hover:bg-primary-700 transition-colors"
                        >
                            تسجيل الدخول
                        </Link>
                    </div>
                </main>
                <Footer />
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-[#0a0a0f]" dir="rtl">
            <Navbar />

            <main className="container mx-auto px-4 py-8 max-w-5xl">
                {/* Header */}
                <div className="mb-8">
                    <div className="flex items-center gap-4 mb-4">
                        <div className="w-14 h-14 rounded-2xl bg-primary-500/10 flex items-center justify-center">
                            <BookmarkCheck className="w-7 h-7 text-primary-600 dark:text-primary-400" />
                        </div>
                        <div>
                            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white">
                                كلماتي المحفوظة
                            </h1>
                            <p className="text-gray-600 dark:text-gray-400">
                                {savedWords.length} كلمة محفوظة
                            </p>
                        </div>
                    </div>

                    {/* Filters */}
                    <div className="flex flex-col sm:flex-row gap-4 mt-6">
                        {/* Search */}
                        <div className="relative flex-1">
                            <Search className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                            <input
                                type="text"
                                placeholder="ابحث عن كلمة..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="w-full pr-12 pl-4 py-3 rounded-xl bg-white dark:bg-white/5 border border-gray-200 dark:border-white/10 text-gray-900 dark:text-white placeholder-gray-400 focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                            />
                        </div>

                        {/* Language Filter */}
                        <div className="flex gap-2 flex-wrap">
                            <button
                                onClick={() => setSelectedLanguage("all")}
                                className={`px-4 py-2.5 rounded-xl border transition-all ${
                                    selectedLanguage === "all"
                                        ? "bg-primary-600 text-white border-primary-600"
                                        : "bg-white dark:bg-white/5 border-gray-200 dark:border-white/10 text-gray-700 dark:text-gray-300"
                                }`}
                            >
                                الكل
                            </button>
                            {Object.keys(groupedWords).map(langCode => {
                                const { name, flag } = getLanguageInfo(langCode);
                                return (
                                    <button
                                        key={langCode}
                                        onClick={() => setSelectedLanguage(langCode)}
                                        className={`flex items-center gap-2 px-4 py-2.5 rounded-xl border transition-all ${
                                            selectedLanguage === langCode
                                                ? "bg-primary-600 text-white border-primary-600"
                                                : "bg-white dark:bg-white/5 border-gray-200 dark:border-white/10 text-gray-700 dark:text-gray-300"
                                        }`}
                                    >
                                        <span>{flag}</span>
                                        <span>{name}</span>
                                    </button>
                                );
                            })}
                        </div>
                    </div>
                </div>

                {/* Content */}
                {isLoading ? (
                    <div className="flex items-center justify-center py-20">
                        <Loader2 className="w-8 h-8 animate-spin text-primary-500" />
                    </div>
                ) : filteredWords.length === 0 ? (
                    <div className="text-center py-20 bg-white dark:bg-white/5 rounded-2xl border border-gray-100 dark:border-white/10">
                        <div className="w-20 h-20 mx-auto rounded-2xl bg-gray-100 dark:bg-gray-800 flex items-center justify-center mb-6">
                            <BookOpen className="w-10 h-10 text-gray-400" />
                        </div>
                        <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
                            لا توجد كلمات محفوظة
                        </h3>
                        <p className="text-gray-500 dark:text-gray-400 mb-6">
                            {searchQuery
                                ? `لم يتم العثور على نتائج لـ "${searchQuery}"`
                                : "ابدأ بحفظ الكلمات أثناء القراءة"}
                        </p>
                        <Link
                            href="/words"
                            className="inline-flex items-center gap-2 px-6 py-3 bg-primary-600 text-white rounded-xl font-semibold hover:bg-primary-700 transition-colors"
                        >
                            <Languages className="w-5 h-5" />
                            تصفح بنك الكلمات
                        </Link>
                    </div>
                ) : (
                    <motion.div
                        className="space-y-4"
                        initial="hidden"
                        animate="visible"
                        variants={staggerContainer}
                    >
                        {Object.entries(groupedWords).map(([langCode, pages]) => {
                            const { name, flag } = getLanguageInfo(langCode);
                            const isExpanded = expandedSections.has(langCode);
                            const totalWords = Object.values(pages).flat().length;

                            return (
                                <motion.div
                                    key={langCode}
                                    variants={fadeInUp}
                                    className="bg-white dark:bg-white/5 rounded-2xl border border-gray-100 dark:border-white/10 overflow-hidden"
                                >
                                    {/* Language Header */}
                                    <button
                                        onClick={() => toggleSection(langCode)}
                                        className="w-full flex items-center justify-between p-5 hover:bg-gray-50 dark:hover:bg-white/5 transition-colors"
                                    >
                                        <div className="flex items-center gap-4">
                                            <span className="text-2xl">{flag}</span>
                                            <div className="text-right">
                                                <h3 className="text-lg font-bold text-gray-900 dark:text-white">
                                                    {name}
                                                </h3>
                                                <p className="text-sm text-gray-500 dark:text-gray-400">
                                                    {totalWords} كلمة
                                                </p>
                                            </div>
                                        </div>
                                        <ChevronDown
                                            className={`w-5 h-5 text-gray-400 transition-transform ${
                                                isExpanded ? "rotate-180" : ""
                                            }`}
                                        />
                                    </button>

                                    {/* Words List */}
                                    <AnimatePresence>
                                        {isExpanded && (
                                            <motion.div
                                                initial={{ height: 0, opacity: 0 }}
                                                animate={{ height: "auto", opacity: 1 }}
                                                exit={{ height: 0, opacity: 0 }}
                                                transition={{ duration: 0.2 }}
                                                className="border-t border-gray-100 dark:border-white/10"
                                            >
                                                {Object.entries(pages).map(([pageId, words]) => (
                                                    <div key={pageId} className="p-4">
                                                        {/* Page Header */}
                                                        <div className="flex items-center gap-2 mb-3 text-sm text-gray-500 dark:text-gray-400">
                                                            <Globe className="w-4 h-4" />
                                                            <span>{pageId === "global_translations" ? "الترجمة العامة" : pageId}</span>
                                                        </div>

                                                        {/* Words Grid */}
                                                        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2">
                                                            {words.map((word) => (
                                                                <div
                                                                    key={`${word.languageCode}-${word.pageId}-${word.wordId}`}
                                                                    className="group relative p-3 rounded-xl bg-gray-50 dark:bg-white/5 border border-gray-100 dark:border-white/10 hover:border-primary-300 dark:hover:border-primary-700 transition-colors"
                                                                >
                                                                    {/* Word Text */}
                                                                    <div className="flex items-start justify-between gap-2 mb-2">
                                                                        <p className="font-bold text-gray-900 dark:text-white text-sm leading-tight">
                                                                            {word.wordText}
                                                                        </p>
                                                                        <button
                                                                            onClick={() => speakText(word.wordText, word.languageCode)}
                                                                            className="shrink-0 p-1 rounded bg-white dark:bg-gray-800 hover:bg-primary-100 dark:hover:bg-primary-900/30 transition-colors"
                                                                        >
                                                                            <Volume2 className="w-3 h-3 text-primary-600" />
                                                                        </button>
                                                                    </div>
                                                                    
                                                                    {/* Source & Date */}
                                                                    <div className="flex items-center justify-between text-[10px] text-gray-400">
                                                                        <span className={`px-1.5 py-0.5 rounded ${
                                                                            word.source === 'word_bank' 
                                                                                ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400'
                                                                                : 'bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400'
                                                                        }`}>
                                                                            {word.source === 'word_bank' ? 'بنك الكلمات' : 'ترجمة'}
                                                                        </span>
                                                                        <button
                                                                            onClick={() => removeWord(word)}
                                                                            disabled={isDeleting === word.wordId}
                                                                            className="p-1 rounded text-gray-300 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 opacity-0 group-hover:opacity-100 transition-all disabled:opacity-50"
                                                                        >
                                                                            {isDeleting === word.wordId ? (
                                                                                <Loader2 className="w-3 h-3 animate-spin" />
                                                                            ) : (
                                                                                <Trash2 className="w-3 h-3" />
                                                                            )}
                                                                        </button>
                                                                    </div>
                                                                </div>
                                                            ))}
                                                        </div>
                                                    </div>
                                                ))}
                                            </motion.div>
                                        )}
                                    </AnimatePresence>
                                </motion.div>
                            );
                        })}
                    </motion.div>
                )}
            </main>

            <Footer />
        </div>
    );
}
