"use client";

/**
 * Words Learning Page - صفحة تعلم الكلمات
 * تعرض الكلمات المتاحة للمستخدم مع خيارات الترجمة والنطق
 */

import { useState, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import {
    BookOpen,
    Languages,
    Volume2,
    Search,
    ArrowRight,
    Sparkles,
    Loader2,
    CheckCircle,
    Star,
} from "lucide-react";

import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";

// Types
interface WordBankEntry {
    id: string;
    word_text: string;
    language_code: string;
    phonetic_text?: string;
    word_definition?: string;
    example_sentence?: string;
    category_slug?: string;
    difficulty_level?: "beginner" | "intermediate" | "advanced";
    is_featured: boolean;
}

interface SupportedLanguage {
    code: string;
    name_en: string;
    name_native: string;
    name_ar?: string;
    text_direction: "ltr" | "rtl";
    flag_emoji?: string;
    is_active: boolean;
}

// Animation variants
const fadeInUp = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.4 } },
};

const staggerContainer = {
    hidden: { opacity: 0 },
    visible: {
        opacity: 1,
        transition: { staggerChildren: 0.08, delayChildren: 0.1 },
    },
};

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
    };
    utterance.lang = localeMap[langCode] || langCode;
    speechSynthesis.speak(utterance);
}

// Difficulty badge colors
const difficultyColors = {
    beginner: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
    intermediate: "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400",
    advanced: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
};

const difficultyLabels = {
    beginner: "مبتدئ",
    intermediate: "متوسط",
    advanced: "متقدم",
};

export default function WordsPage() {
    const [languages, setLanguages] = useState<SupportedLanguage[]>([]);
    const [words, setWords] = useState<WordBankEntry[]>([]);
    const [selectedLanguage, setSelectedLanguage] = useState<string>("en");
    const [searchQuery, setSearchQuery] = useState("");
    const [isLoading, setIsLoading] = useState(true);
    const [highlightedWords, setHighlightedWords] = useState<Set<string>>(new Set());

    // Fetch languages
    const fetchLanguages = useCallback(async () => {
        try {
            const res = await fetch("/api/words/languages");
            const data = await res.json();
            if (data.success && data.languages) {
                setLanguages(data.languages.filter((l: SupportedLanguage) => l.is_active));
            }
        } catch (error) {
            console.error("Error fetching languages:", error);
        }
    }, []);

    // Fetch words from word bank
    const fetchWords = useCallback(async () => {
        setIsLoading(true);
        try {
            const res = await fetch(`/api/words/word-bank?language_code=${selectedLanguage}&limit=50`);
            const data = await res.json();
            if (data.success && data.words) {
                setWords(data.words);
            }
        } catch (error) {
            console.error("Error fetching words:", error);
        } finally {
            setIsLoading(false);
        }
    }, [selectedLanguage]);

    // Fetch user highlights
    const fetchHighlights = useCallback(async () => {
        try {
            const res = await fetch("/api/words/highlight");
            const data = await res.json();
            if (data.success && data.highlighted_words) {
                const langHighlights = data.highlighted_words[selectedLanguage] || {};
                const allWordIds = new Set<string>();
                Object.values(langHighlights as Record<string, Record<string, unknown>>).forEach((pageHighlights) => {
                    Object.keys(pageHighlights).forEach((wordId) => allWordIds.add(wordId));
                });
                setHighlightedWords(allWordIds);
            }
        } catch (error) {
            console.error("Error fetching highlights:", error);
        }
    }, [selectedLanguage]);

    useEffect(() => {
        fetchLanguages();
    }, [fetchLanguages]);

    useEffect(() => {
        fetchWords();
        fetchHighlights();
    }, [fetchWords, fetchHighlights]);

    // Filter words by search query
    const filteredWords = words.filter(
        (word) =>
            word.word_text.toLowerCase().includes(searchQuery.toLowerCase()) ||
            word.word_definition?.toLowerCase().includes(searchQuery.toLowerCase())
    );

    // Featured words
    const featuredWords = words.filter((w) => w.is_featured).slice(0, 6);

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-[#0a0a0f]" dir="rtl">
            <Navbar />

            <main className="relative">
                {/* Hero Section */}
                <section className="relative pt-8 pb-12 sm:pt-12 sm:pb-16 overflow-hidden">
                    <div className="absolute inset-0 bg-gradient-to-b from-primary-50/50 via-transparent to-transparent dark:from-primary-950/20" />
                    <div className="absolute top-0 left-0 w-[500px] h-[500px] bg-primary-500/5 rounded-full blur-[100px] -translate-y-1/2 -translate-x-1/4" />

                    <div className="container mx-auto px-4 sm:px-6 max-w-6xl relative">
                        <div className="max-w-3xl mx-auto text-center">
                            {/* Badge */}
                            <motion.div
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary-500/10 border border-primary-500/20 mb-6"
                            >
                                <Languages className="w-4 h-4 text-primary-500" />
                                <span className="text-sm font-semibold text-primary-600 dark:text-primary-400">
                                    تعلم الكلمات بسهولة
                                </span>
                            </motion.div>

                            {/* Title */}
                            <motion.h1
                                initial={{ opacity: 0, y: 16 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.1 }}
                                className="text-3xl sm:text-4xl lg:text-5xl font-bold text-gray-900 dark:text-white mb-4"
                            >
                                تعلم{" "}
                                <span className="text-primary-600 dark:text-primary-400">الكلمات</span>{" "}
                                بطريقة تفاعلية
                            </motion.h1>

                            {/* Description */}
                            <motion.p
                                initial={{ opacity: 0, y: 16 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.15 }}
                                className="text-base sm:text-lg text-gray-600 dark:text-gray-400 mb-8 max-w-xl mx-auto"
                            >
                                اكتشف كلمات جديدة، استمع للنطق الصحيح، وتعلم الترجمة بلغات متعددة
                            </motion.p>

                            {/* Language Selector */}
                            <motion.div
                                initial={{ opacity: 0, y: 16 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.2 }}
                                className="flex flex-wrap justify-center gap-3 mb-8"
                            >
                                {languages.map((lang) => (
                                    <button
                                        key={lang.code}
                                        onClick={() => setSelectedLanguage(lang.code)}
                                        className={`flex items-center gap-2 px-4 py-2.5 rounded-xl border transition-all ${
                                            selectedLanguage === lang.code
                                                ? "bg-primary-600 text-white border-primary-600 shadow-lg shadow-primary-500/20"
                                                : "bg-white dark:bg-white/5 border-gray-200 dark:border-white/10 text-gray-700 dark:text-gray-300 hover:border-primary-300"
                                        }`}
                                    >
                                        <span className="text-lg">{lang.flag_emoji || "🌐"}</span>
                                        <span className="font-medium">{lang.name_ar || lang.name_en}</span>
                                    </button>
                                ))}
                            </motion.div>

                            {/* Search */}
                            <motion.div
                                initial={{ opacity: 0, y: 16 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.25 }}
                                className="relative max-w-md mx-auto"
                            >
                                <Search className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                                <input
                                    type="text"
                                    placeholder="ابحث عن كلمة..."
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    className="w-full pr-12 pl-4 py-3 rounded-xl bg-white dark:bg-white/5 border border-gray-200 dark:border-white/10 text-gray-900 dark:text-white placeholder-gray-400 focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                                />
                            </motion.div>
                        </div>
                    </div>
                </section>

                {/* Featured Words */}
                {featuredWords.length > 0 && !searchQuery && (
                    <section className="py-12 sm:py-16">
                        <div className="container mx-auto px-4 sm:px-6 max-w-6xl">
                            <div className="flex items-center gap-3 mb-8">
                                <div className="w-10 h-10 rounded-xl bg-amber-500/10 flex items-center justify-center">
                                    <Star className="w-5 h-5 text-amber-500" />
                                </div>
                                <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                                    كلمات مميزة
                                </h2>
                            </div>

                            <motion.div
                                className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4"
                                initial="hidden"
                                whileInView="visible"
                                viewport={{ once: true }}
                                variants={staggerContainer}
                            >
                                {featuredWords.map((word) => (
                                    <motion.div
                                        key={word.id}
                                        variants={fadeInUp}
                                        className="group relative p-4 rounded-2xl bg-gradient-to-br from-amber-50 to-orange-50 dark:from-amber-900/20 dark:to-orange-900/20 border border-amber-200/50 dark:border-amber-800/30 text-center cursor-pointer hover:shadow-lg transition-all"
                                        onClick={() => speakText(word.word_text, word.language_code)}
                                    >
                                        <div className="absolute top-2 left-2">
                                            <Star className="w-4 h-4 text-amber-500 fill-amber-500" />
                                        </div>
                                        <p className="text-xl font-bold text-gray-900 dark:text-white mb-1">
                                            {word.word_text}
                                        </p>
                                        {word.phonetic_text && (
                                            <p className="text-xs text-gray-500 dark:text-gray-400">
                                                /{word.phonetic_text}/
                                            </p>
                                        )}
                                        <button
                                            className="mt-2 p-1.5 rounded-lg bg-white/50 dark:bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity"
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                speakText(word.word_text, word.language_code);
                                            }}
                                        >
                                            <Volume2 className="w-4 h-4 text-primary-600" />
                                        </button>
                                    </motion.div>
                                ))}
                            </motion.div>
                        </div>
                    </section>
                )}

                {/* All Words */}
                <section className="py-12 sm:py-16 bg-gray-50/50 dark:bg-white/2">
                    <div className="container mx-auto px-4 sm:px-6 max-w-6xl">
                        <div className="flex items-center justify-between mb-8">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-xl bg-primary-500/10 flex items-center justify-center">
                                    <BookOpen className="w-5 h-5 text-primary-600" />
                                </div>
                                <div>
                                    <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                                        بنك الكلمات
                                    </h2>
                                    <p className="text-sm text-gray-500 dark:text-gray-400">
                                        {filteredWords.length} كلمة متاحة
                                    </p>
                                </div>
                            </div>
                        </div>

                        {isLoading ? (
                            <div className="flex items-center justify-center py-16">
                                <Loader2 className="w-8 h-8 animate-spin text-primary-500" />
                            </div>
                        ) : filteredWords.length === 0 ? (
                            <div className="text-center py-16 bg-white dark:bg-white/5 rounded-2xl border border-gray-100 dark:border-white/10">
                                <div className="w-16 h-16 mx-auto rounded-2xl bg-gray-100 dark:bg-gray-800 flex items-center justify-center mb-4">
                                    <Search className="w-8 h-8 text-gray-400" />
                                </div>
                                <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">
                                    لا توجد كلمات
                                </h3>
                                <p className="text-sm text-gray-500 dark:text-gray-400">
                                    {searchQuery
                                        ? `لم يتم العثور على نتائج لـ "${searchQuery}"`
                                        : "لم يتم إضافة كلمات لهذه اللغة بعد"}
                                </p>
                            </div>
                        ) : (
                            <motion.div
                                className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4"
                                initial="hidden"
                                whileInView="visible"
                                viewport={{ once: true }}
                                variants={staggerContainer}
                            >
                                {filteredWords.map((word) => (
                                    <motion.div
                                        key={word.id}
                                        variants={fadeInUp}
                                        className={`group relative p-5 rounded-2xl bg-white dark:bg-white/5 border transition-all hover:shadow-lg ${
                                            highlightedWords.has(word.id)
                                                ? "border-primary-300 dark:border-primary-700 ring-2 ring-primary-500/20"
                                                : "border-gray-100 dark:border-white/10"
                                        }`}
                                    >
                                        {/* Highlighted badge */}
                                        {highlightedWords.has(word.id) && (
                                            <div className="absolute top-3 left-3">
                                                <CheckCircle className="w-5 h-5 text-primary-500" />
                                            </div>
                                        )}

                                        {/* Header */}
                                        <div className="flex items-start justify-between mb-3">
                                            <div>
                                                <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                                                    {word.word_text}
                                                </h3>
                                                {word.phonetic_text && (
                                                    <p className="text-sm text-gray-500 dark:text-gray-400">
                                                        /{word.phonetic_text}/
                                                    </p>
                                                )}
                                            </div>

                                            {/* TTS Button */}
                                            <button
                                                onClick={() => speakText(word.word_text, word.language_code)}
                                                className="p-2 rounded-lg bg-gray-100 dark:bg-gray-800 hover:bg-primary-100 dark:hover:bg-primary-900/30 transition-colors"
                                            >
                                                <Volume2 className="w-5 h-5 text-gray-600 dark:text-gray-400" />
                                            </button>
                                        </div>

                                        {/* Definition */}
                                        {word.word_definition && (
                                            <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                                                {word.word_definition}
                                            </p>
                                        )}

                                        {/* Example */}
                                        {word.example_sentence && (
                                            <p className="text-sm text-gray-500 dark:text-gray-500 italic border-r-2 border-primary-300 pr-3 mb-3">
                                                {word.example_sentence}
                                            </p>
                                        )}

                                        {/* Footer */}
                                        <div className="flex items-center justify-between mt-4 pt-3 border-t border-gray-100 dark:border-white/10">
                                            {/* Difficulty */}
                                            {word.difficulty_level && (
                                                <span
                                                    className={`px-2.5 py-1 rounded-full text-xs font-medium ${
                                                        difficultyColors[word.difficulty_level]
                                                    }`}
                                                >
                                                    {difficultyLabels[word.difficulty_level]}
                                                </span>
                                            )}

                                            {/* Category */}
                                            {word.category_slug && (
                                                <span className="px-2.5 py-1 rounded-full text-xs font-medium bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400">
                                                    {word.category_slug}
                                                </span>
                                            )}
                                        </div>
                                    </motion.div>
                                ))}
                            </motion.div>
                        )}
                    </div>
                </section>

                {/* CTA Section */}
                <section className="py-16 sm:py-20">
                    <div className="container mx-auto px-4 sm:px-6 max-w-6xl">
                        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-primary-600 to-primary-700 p-8 sm:p-12">
                            <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl" />
                            <div className="absolute bottom-0 left-0 w-48 h-48 bg-primary-400/20 rounded-full blur-2xl" />

                            <div className="relative text-center max-w-2xl mx-auto">
                                <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/20 mb-6">
                                    <Sparkles className="w-4 h-4 text-white" />
                                    <span className="text-sm font-semibold text-white">
                                        ابدأ رحلة التعلم
                                    </span>
                                </div>

                                <h2 className="text-2xl sm:text-3xl font-bold text-white mb-4">
                                    تعلم الكلمات أثناء قراءة الدروس
                                </h2>
                                <p className="text-white/80 mb-8">
                                    انتقل للدروس واضغط على أي كلمة لحفظها وترجمتها فوراً
                                </p>

                                <Link
                                    href="/arabic"
                                    className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-white text-primary-600 font-semibold hover:bg-gray-50 transition-colors"
                                >
                                    <BookOpen className="w-5 h-5" />
                                    <span>ابدأ القراءة</span>
                                    <ArrowRight className="w-4 h-4 rtl:rotate-180" />
                                </Link>
                            </div>
                        </div>
                    </div>
                </section>
            </main>

            <Footer />
        </div>
    );
}
