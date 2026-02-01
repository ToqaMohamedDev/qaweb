"use client";

/**
 * Words Learning Page - Premium Dark Theme v2
 * Clean hierarchy: Title → Search → Languages → Grid
 */

import { useState, useEffect, useCallback, useMemo } from "react";
import Link from "next/link";
import {
    Search,
    SlidersHorizontal,
    X,
    BookOpen,
    BookMarked,
    Volume2,
    Trash2,
    Loader2,
    Mic,
} from "lucide-react";

import { Navbar } from "@/components/Navbar";
import { useAuth } from "@/hooks/useAuth";
import { WordCard } from "@/components/words/WordCard";
import { FilterDrawer } from "@/components/words/FilterDrawer";
import { WordGridSkeleton } from "@/components/words/WordCardSkeleton";
import { TTSModal } from "@/components/words/TTSModal";

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

// Saved translation word from global_translations
interface SavedTranslation {
    id: string; // word_translation format
    word: string;
    translation: string;
    languageCode: string;
    savedAt: string;
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
    };
    utterance.lang = localeMap[langCode] || langCode;
    speechSynthesis.speak(utterance);
}

export default function WordsPage() {
    const { user } = useAuth();
    const [languages, setLanguages] = useState<SupportedLanguage[]>([]);
    const [words, setWords] = useState<WordBankEntry[]>([]);
    const [selectedLanguage, setSelectedLanguage] = useState<string>("en");
    const [searchQuery, setSearchQuery] = useState("");
    const [isLoading, setIsLoading] = useState(true);
    const [highlightedWords, setHighlightedWords] = useState<Set<string>>(new Set());
    const [pendingToggle, setPendingToggle] = useState<string | null>(null);
    
    // Filter state
    const [isFilterOpen, setIsFilterOpen] = useState(false);
    const [selectedCategory, setSelectedCategory] = useState<string>("all");
    const [selectedLevel, setSelectedLevel] = useState<string>("all");
    const [savedOnly, setSavedOnly] = useState(false);
    const [sortBy, setSortBy] = useState<string>("newest");
    
    // Tab state: 'bank' = word bank, 'dictionary' = my saved translations
    const [activeTab, setActiveTab] = useState<'bank' | 'dictionary'>('bank');
    
    // My Dictionary state (saved translations from popup)
    const [savedTranslations, setSavedTranslations] = useState<SavedTranslation[]>([]);
    const [isLoadingDictionary, setIsLoadingDictionary] = useState(false);
    const [deletingWord, setDeletingWord] = useState<string | null>(null);
    
    // TTS Modal state
    const [isTTSOpen, setIsTTSOpen] = useState(false);

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

    // Toggle word highlight/save
    const toggleHighlight = useCallback(async (word: WordBankEntry) => {
        if (!user) {
            // إعادة توجيه لتسجيل الدخول
            window.location.href = "/login?redirect=/words";
            return;
        }

        setPendingToggle(word.id);
        
        // Optimistic update
        setHighlightedWords(prev => {
            const newSet = new Set(prev);
            if (newSet.has(word.id)) {
                newSet.delete(word.id);
            } else {
                newSet.add(word.id);
            }
            return newSet;
        });

        try {
            const res = await fetch("/api/words/highlight", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    language_code: word.language_code,
                    page_id: "word_bank",
                    word_id: word.id,
                }),
            });

            const data = await res.json();
            if (!data.success) {
                // Revert on failure
                setHighlightedWords(prev => {
                    const newSet = new Set(prev);
                    if (newSet.has(word.id)) {
                        newSet.delete(word.id);
                    } else {
                        newSet.add(word.id);
                    }
                    return newSet;
                });
            }
        } catch (error) {
            console.error("Error toggling highlight:", error);
            // Revert on error
            fetchHighlights();
        } finally {
            setPendingToggle(null);
        }
    }, [user, fetchHighlights]);

    // Fetch saved translations from global_translations
    const fetchSavedTranslations = useCallback(async () => {
        if (!user) return;
        setIsLoadingDictionary(true);
        try {
            const res = await fetch("/api/words/highlight");
            const data = await res.json();
            if (data.success && data.highlighted_words) {
                const translations: SavedTranslation[] = [];
                
                // Parse the highlighted_words structure
                Object.entries(data.highlighted_words as Record<string, Record<string, Record<string, { at: string }>>>).forEach(
                    ([langCode, pages]) => {
                        const globalTranslations = pages["global_translations"];
                        if (globalTranslations) {
                            Object.entries(globalTranslations).forEach(([wordId, meta]) => {
                                // word_id format: "word_translation"
                                const parts = wordId.split("_");
                                if (parts.length >= 2) {
                                    const word = parts[0];
                                    const translation = parts.slice(1).join("_");
                                    translations.push({
                                        id: wordId,
                                        word,
                                        translation,
                                        languageCode: langCode,
                                        savedAt: meta.at,
                                    });
                                }
                            });
                        }
                    }
                );
                
                // Sort by date (newest first)
                translations.sort((a, b) => new Date(b.savedAt).getTime() - new Date(a.savedAt).getTime());
                setSavedTranslations(translations);
            }
        } catch (error) {
            console.error("Error fetching saved translations:", error);
        } finally {
            setIsLoadingDictionary(false);
        }
    }, [user]);

    // Delete a saved translation
    const deleteSavedTranslation = useCallback(async (translation: SavedTranslation) => {
        setDeletingWord(translation.id);
        try {
            const res = await fetch("/api/words/highlight", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    language_code: translation.languageCode,
                    page_id: "global_translations",
                    word_id: translation.id,
                }),
            });
            const data = await res.json();
            if (data.success) {
                setSavedTranslations(prev => prev.filter(t => t.id !== translation.id));
            }
        } catch (error) {
            console.error("Error deleting translation:", error);
        } finally {
            setDeletingWord(null);
        }
    }, []);

    useEffect(() => {
        fetchLanguages();
    }, [fetchLanguages]);

    useEffect(() => {
        fetchWords();
        fetchHighlights();
    }, [fetchWords, fetchHighlights]);

    // Fetch saved translations when switching to dictionary tab
    useEffect(() => {
        if (activeTab === 'dictionary' && user) {
            fetchSavedTranslations();
        }
    }, [activeTab, user, fetchSavedTranslations]);

    // Get unique categories from words
    const categories = useMemo(() => {
        const cats = new Set<string>();
        words.forEach(w => {
            if (w.category_slug) cats.add(w.category_slug);
        });
        return Array.from(cats);
    }, [words]);

    // Filter and sort words
    const filteredWords = useMemo(() => {
        let result = words.filter((word) => {
            const matchesSearch = !searchQuery || 
                word.word_text.toLowerCase().includes(searchQuery.toLowerCase()) ||
                word.word_definition?.toLowerCase().includes(searchQuery.toLowerCase());
            const matchesCategory = selectedCategory === "all" || word.category_slug === selectedCategory;
            const matchesLevel = selectedLevel === "all" || word.difficulty_level === selectedLevel;
            const matchesSaved = !savedOnly || highlightedWords.has(word.id);
            return matchesSearch && matchesCategory && matchesLevel && matchesSaved;
        });

        // Sort
        if (sortBy === "alphabetical") {
            result = [...result].sort((a, b) => a.word_text.localeCompare(b.word_text));
        } else if (sortBy === "random") {
            result = [...result].sort(() => Math.random() - 0.5);
        }

        return result;
    }, [words, searchQuery, selectedCategory, selectedLevel, savedOnly, sortBy, highlightedWords]);

    // Active filters count
    const activeFiltersCount = useMemo(() => {
        let count = 0;
        if (selectedCategory !== "all") count++;
        if (selectedLevel !== "all") count++;
        if (savedOnly) count++;
        if (sortBy !== "newest") count++;
        return count;
    }, [selectedCategory, selectedLevel, savedOnly, sortBy]);

    // Reset filters
    const resetFilters = useCallback(() => {
        setSelectedCategory("all");
        setSelectedLevel("all");
        setSavedOnly(false);
        setSortBy("newest");
    }, []);


    return (
        <div className="min-h-screen bg-[#09090b]" dir="rtl">
            <Navbar />

            {/* Premium Sticky Header */}
            <div className="sticky top-0 z-40 bg-[#09090b]/95 backdrop-blur-md border-b border-white/5">
                <div className="container mx-auto px-4 sm:px-6 max-w-6xl">
                    
                    {/* Row 1: Title + Badge + Actions */}
                    <div className="flex items-center justify-between h-14">
                        {/* Left: Tab Titles */}
                        <div className="flex items-center gap-3">
                            <button
                                onClick={() => setActiveTab('bank')}
                                className={`flex items-center gap-2 text-lg font-bold transition-colors ${
                                    activeTab === 'bank' ? "text-white" : "text-zinc-500 hover:text-zinc-300"
                                }`}
                            >
                                <BookOpen className="w-5 h-5" />
                                بنك الكلمات
                                {activeTab === 'bank' && (
                                    <span className="px-2 py-0.5 rounded-md bg-purple-500/20 text-purple-300 text-xs font-semibold">
                                        {filteredWords.length}
                                    </span>
                                )}
                            </button>
                            <span className="text-zinc-700">|</span>
                            <button
                                onClick={() => setActiveTab('dictionary')}
                                className={`flex items-center gap-2 text-lg font-bold transition-colors ${
                                    activeTab === 'dictionary' ? "text-white" : "text-zinc-500 hover:text-zinc-300"
                                }`}
                            >
                                <BookMarked className="w-5 h-5" />
                                قاموسي
                                {activeTab === 'dictionary' && savedTranslations.length > 0 && (
                                    <span className="px-2 py-0.5 rounded-md bg-purple-500/20 text-purple-300 text-xs font-semibold">
                                        {savedTranslations.length}
                                    </span>
                                )}
                            </button>
                        </div>

                        {/* Right: Actions */}
                        <div className="flex items-center gap-2">
                            {/* TTS Button - Opens Modal */}
                            <button
                                onClick={() => setIsTTSOpen(true)}
                                className="p-2.5 rounded-xl bg-white/5 text-zinc-400 hover:bg-white/10 hover:text-purple-400 transition-colors"
                                title="نطق كلمة"
                            >
                                <Mic className="w-4 h-4" />
                            </button>

                            {/* Filter button - only for bank tab */}
                            {activeTab === 'bank' && (
                                <button
                                    onClick={() => setIsFilterOpen(true)}
                                    className={`relative p-2.5 rounded-xl transition-colors ${
                                        activeFiltersCount > 0 
                                            ? "bg-purple-600 text-white" 
                                            : "bg-white/5 text-zinc-400 hover:bg-white/10 hover:text-white"
                                    }`}
                                >
                                    <SlidersHorizontal className="w-4 h-4" />
                                    {activeFiltersCount > 0 && (
                                        <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-white text-purple-600 text-[10px] font-bold flex items-center justify-center">
                                            {activeFiltersCount}
                                        </span>
                                    )}
                                </button>
                            )}
                        </div>
                    </div>

                    {/* Row 2: Search (for both tabs) */}
                    <div className="pb-3">
                        <div className="relative">
                            <Search className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-500" />
                            <input
                                type="text"
                                placeholder={activeTab === 'bank' ? "ابحث في الكلمات والتصنيفات..." : "ابحث في قاموسك..."}
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="w-full pr-12 pl-10 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500/50 transition-all"
                            />
                            {searchQuery && (
                                <button
                                    onClick={() => setSearchQuery("")}
                                    className="absolute left-3 top-1/2 -translate-y-1/2 p-1.5 rounded-lg hover:bg-white/10"
                                >
                                    <X className="w-4 h-4 text-zinc-400" />
                                </button>
                            )}
                        </div>
                    </div>

                    {/* Row 3: Language chips (only for bank tab) */}
                    {activeTab === 'bank' && (
                        <div className="pb-3 -mx-4 px-4 overflow-x-auto scrollbar-hide">
                            <div className="flex gap-2">
                                {languages.map((lang) => (
                                    <button
                                        key={lang.code}
                                        onClick={() => setSelectedLanguage(lang.code)}
                                        className={`shrink-0 flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all ${
                                            selectedLanguage === lang.code
                                                ? "bg-purple-600 text-white shadow-lg shadow-purple-500/25"
                                                : "bg-white/5 text-zinc-400 hover:bg-white/10 hover:text-white"
                                        }`}
                                    >
                                        <span className="text-base">{lang.flag_emoji || "🌐"}</span>
                                        <span>{lang.name_ar || lang.name_en}</span>
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Main Content */}
            <main className="container mx-auto px-4 sm:px-6 max-w-6xl py-4">
                {/* Word Bank Tab */}
                {activeTab === 'bank' && (
                    <>
                        {/* Active Filters Display */}
                        {activeFiltersCount > 0 && (
                            <div className="flex items-center gap-2 mb-4 p-3 rounded-xl bg-white/5 border border-white/5">
                                <span className="text-xs text-zinc-500">الفلاتر النشطة:</span>
                                <div className="flex items-center gap-2 flex-wrap">
                                    {selectedCategory !== "all" && (
                                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-purple-500/20 text-purple-300 text-xs font-medium">
                                            التصنيف: {selectedCategory}
                                            <button onClick={() => setSelectedCategory("all")} className="hover:text-white">
                                                <X className="w-3 h-3" />
                                            </button>
                                        </span>
                                    )}
                                    {selectedLevel !== "all" && (
                                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-purple-500/20 text-purple-300 text-xs font-medium">
                                            المستوى: {selectedLevel === "beginner" ? "مبتدئ" : selectedLevel === "intermediate" ? "متوسط" : "متقدم"}
                                            <button onClick={() => setSelectedLevel("all")} className="hover:text-white">
                                                <X className="w-3 h-3" />
                                            </button>
                                        </span>
                                    )}
                                    {savedOnly && (
                                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-purple-500/20 text-purple-300 text-xs font-medium">
                                            المحفوظة فقط
                                            <button onClick={() => setSavedOnly(false)} className="hover:text-white">
                                                <X className="w-3 h-3" />
                                            </button>
                                        </span>
                                    )}
                                </div>
                                <button
                                    onClick={resetFilters}
                                    className="mr-auto text-xs text-zinc-500 hover:text-white transition-colors"
                                >
                                    مسح الكل
                                </button>
                            </div>
                        )}

                        {/* Words Grid - 4 columns on desktop with larger gaps */}
                        {isLoading ? (
                            <WordGridSkeleton count={16} />
                        ) : filteredWords.length === 0 ? (
                            <div className="text-center py-20">
                                <div className="w-16 h-16 mx-auto rounded-2xl bg-white/5 flex items-center justify-center mb-4">
                                    <Search className="w-8 h-8 text-zinc-600" />
                                </div>
                                <h3 className="text-lg font-semibold text-white mb-2">
                                    {searchQuery ? "لا توجد نتائج" : "لا توجد كلمات"}
                                </h3>
                                <p className="text-zinc-500 text-sm mb-4">
                                    {searchQuery ? `جرب البحث بكلمات مختلفة عن "${searchQuery}"` : "لم يتم إضافة كلمات بعد لهذه اللغة"}
                                </p>
                                {activeFiltersCount > 0 && (
                                    <button
                                        onClick={resetFilters}
                                        className="px-4 py-2 rounded-lg bg-purple-600 hover:bg-purple-500 text-white text-sm font-medium transition-colors"
                                    >
                                        إزالة الفلاتر
                                    </button>
                                )}
                            </div>
                        ) : (
                            <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                                {filteredWords.map((word) => (
                                    <WordCard
                                        key={word.id}
                                        id={word.id}
                                        word={word.word_text}
                                        translation={word.word_definition}
                                        phonetic={word.phonetic_text}
                                        category={word.category_slug}
                                        level={word.difficulty_level}
                                        languageCode={word.language_code}
                                        isSaved={highlightedWords.has(word.id)}
                                        isPending={pendingToggle === word.id}
                                        onPlay={speakText}
                                        onSave={() => toggleHighlight(word)}
                                    />
                                ))}
                            </div>
                        )}
                    </>
                )}

                {/* My Dictionary Tab - Centered layout */}
                {activeTab === 'dictionary' && (
                    <div className="max-w-4xl mx-auto">
                        {!user ? (
                            <div className="text-center py-20">
                                <div className="w-16 h-16 mx-auto rounded-2xl bg-white/5 flex items-center justify-center mb-4">
                                    <BookMarked className="w-8 h-8 text-zinc-600" />
                                </div>
                                <h3 className="text-lg font-semibold text-white mb-2">سجل دخولك أولاً</h3>
                                <p className="text-zinc-500 text-sm mb-4">لعرض قاموسك الشخصي</p>
                                <Link
                                    href="/login?redirect=/words"
                                    className="inline-block px-5 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-sm font-medium transition-colors"
                                >
                                    تسجيل الدخول
                                </Link>
                            </div>
                        ) : isLoadingDictionary ? (
                            <div className="flex items-center justify-center py-20">
                                <Loader2 className="w-8 h-8 animate-spin text-purple-500" />
                            </div>
                        ) : savedTranslations.length === 0 ? (
                            <div className="text-center py-20">
                                <div className="w-16 h-16 mx-auto rounded-2xl bg-white/5 flex items-center justify-center mb-4">
                                    <BookMarked className="w-8 h-8 text-zinc-600" />
                                </div>
                                <h3 className="text-lg font-semibold text-white mb-2">قاموسك فارغ</h3>
                                <p className="text-zinc-500 text-sm max-w-sm mx-auto">
                                    اختر أي نص في الموقع ← سيظهر popup للترجمة ← اضغط &quot;حفظ في قاموسي&quot;
                                </p>
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                                {savedTranslations
                                    .filter(item => 
                                        !searchQuery || 
                                        item.word.toLowerCase().includes(searchQuery.toLowerCase()) ||
                                        item.translation.toLowerCase().includes(searchQuery.toLowerCase())
                                    )
                                    .map((item) => {
                                        const lang = languages.find(l => l.code === item.languageCode);
                                        return (
                                            <div
                                                key={item.id}
                                                className="group p-4 rounded-xl bg-[#141417] border border-white/5 hover:border-purple-500/30 hover:-translate-y-0.5 transition-all"
                                            >
                                                <div className="flex items-start justify-between gap-2 mb-3">
                                                    <span className="px-2 py-1 rounded-lg bg-white/5 text-xs text-zinc-400">
                                                        {lang?.flag_emoji} {lang?.name_ar || item.languageCode}
                                                    </span>
                                                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                                        <button
                                                            onClick={() => speakText(item.word, item.languageCode)}
                                                            className="p-1.5 rounded-lg hover:bg-white/10 text-zinc-400 hover:text-purple-400"
                                                            title="نطق الكلمة"
                                                        >
                                                            <Volume2 className="w-4 h-4" />
                                                        </button>
                                                        <button
                                                            onClick={() => deleteSavedTranslation(item)}
                                                            disabled={deletingWord === item.id}
                                                            className="p-1.5 rounded-lg hover:bg-red-500/20 text-zinc-400 hover:text-red-400 disabled:opacity-50"
                                                            title="حذف"
                                                        >
                                                            {deletingWord === item.id ? (
                                                                <Loader2 className="w-4 h-4 animate-spin" />
                                                            ) : (
                                                                <Trash2 className="w-4 h-4" />
                                                            )}
                                                        </button>
                                                    </div>
                                                </div>
                                                <p className="text-xl font-bold text-white mb-1 line-clamp-1">{item.word}</p>
                                                <p className="text-sm text-purple-300 line-clamp-2">{item.translation}</p>
                                                <p className="text-[10px] text-zinc-600 mt-3">
                                                    {new Date(item.savedAt).toLocaleDateString('ar-EG')}
                                                </p>
                                            </div>
                                        );
                                    })}
                            </div>
                        )}
                    </div>
                )}
            </main>

            {/* Filter Drawer */}
            <FilterDrawer
                isOpen={isFilterOpen}
                onClose={() => setIsFilterOpen(false)}
                categories={categories}
                selectedCategory={selectedCategory}
                onCategoryChange={setSelectedCategory}
                selectedLevel={selectedLevel}
                onLevelChange={setSelectedLevel}
                savedOnly={savedOnly}
                onSavedOnlyChange={setSavedOnly}
                sortBy={sortBy}
                onSortChange={setSortBy}
                onReset={resetFilters}
            />

            {/* TTS Modal */}
            <TTSModal
                isOpen={isTTSOpen}
                onClose={() => setIsTTSOpen(false)}
                languages={languages}
                onSpeak={speakText}
            />
        </div>
    );
}
