"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import {
    Search,
    X,
    BookOpen,
    BookMarked,
    Volume2,
    Trash2,
    Loader2,
    ChevronLeft,
    ChevronRight,
    BookmarkPlus,
    BookmarkCheck,
    Star,
    Globe,
} from "lucide-react";

import { Navbar } from "@/components/Navbar";
import { useAuth } from "@/hooks/useAuth";
import { WordDetailModal } from "@/components/words/WordDetailModal";

// Types
interface LexicalEntry {
    lemma: string;
    pronunciations?: { ipa: string; region: string }[];
    inflections?: { form: string; features: string[] }[];
    examples?: string[];
    gender?: string;
}

interface DictionaryWord {
    concept_id: string;
    word_family_root: string;
    definition: string | null;
    part_of_speech: string | null;
    domains: string[] | null;
    lexical_entries: Record<string, LexicalEntry> | null;
    relations: { synonyms?: string[]; antonyms?: string[] } | null;
    // Added by API for current language
    lemma?: string;
    pronunciations?: { ipa: string; region: string }[];
}

interface MyWord {
    id: string;
    user_id: string;
    concept_id: string;
    notes: string | null;
    is_favorite: boolean;
    created_at: string;
    dictionary: DictionaryWord;
}

interface Pagination {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
}

// Languages for top filter (without Arabic - Arabic always shown in cards)
const DISPLAY_LANGUAGES = [
    { code: "en", name: "English", nameAr: "الإنجليزية", flag: "🇬🇧" },
    { code: "fr", name: "French", nameAr: "الفرنسية", flag: "🇫🇷" },
    { code: "de", name: "German", nameAr: "الألمانية", flag: "🇩🇪" },
];

// All languages including Arabic for card display
const ALL_LANGUAGES = [
    { code: "ar", name: "Arabic", nameAr: "العربية", flag: "🇸🇦" },
    { code: "en", name: "English", nameAr: "الإنجليزية", flag: "🇬🇧" },
    { code: "fr", name: "French", nameAr: "الفرنسية", flag: "🇫🇷" },
    { code: "de", name: "German", nameAr: "الألمانية", flag: "🇩🇪" },
];

function speakText(text: string, langCode: string): void {
    if (typeof window === "undefined" || !("speechSynthesis" in window)) return;
    speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    const localeMap: Record<string, string> = {
        ar: "ar-SA", en: "en-US", fr: "fr-FR", de: "de-DE",
    };
    utterance.lang = localeMap[langCode] || langCode;

    // Improved TTS settings for better pronunciation
    utterance.rate = 0.9; // Slightly slower for clarity
    utterance.pitch = 1.0;

    // Try to find a native voice for the language
    const voices = speechSynthesis.getVoices();
    const langVoice = voices.find(v => v.lang.startsWith(langCode) || v.lang === localeMap[langCode]);
    if (langVoice) {
        utterance.voice = langVoice;
    }

    speechSynthesis.speak(utterance);
}

export default function WordsPage() {
    const { user } = useAuth();

    // Tab state
    const [activeTab, setActiveTab] = useState<"dictionary" | "mywords">("dictionary");

    // Dictionary state
    const [selectedLanguage, setSelectedLanguage] = useState("en");
    const [words, setWords] = useState<DictionaryWord[]>([]);
    const [searchQuery, setSearchQuery] = useState("");
    const [debouncedSearch, setDebouncedSearch] = useState("");
    const [isLoading, setIsLoading] = useState(true);
    const [pagination, setPagination] = useState<Pagination>({
        page: 1, limit: 20, total: 0, totalPages: 0,
    });

    // My Words state
    const [myWords, setMyWords] = useState<MyWord[]>([]);
    const [myWordsLoading, setMyWordsLoading] = useState(false);
    const [myWordsPagination, setMyWordsPagination] = useState<Pagination>({
        page: 1, limit: 20, total: 0, totalPages: 0,
    });
    const [savedWordIds, setSavedWordIds] = useState<Set<string>>(new Set());

    // Modal state
    const [selectedWord, setSelectedWord] = useState<DictionaryWord | null>(null);
    const [isModalOpen, setIsModalOpen] = useState(false);

    // Saving state
    const [savingWordId, setSavingWordId] = useState<string | null>(null);

    // Debounce search
    useEffect(() => {
        const timer = setTimeout(() => {
            setDebouncedSearch(searchQuery);
            setPagination((prev) => ({ ...prev, page: 1 }));
        }, 300);
        return () => clearTimeout(timer);
    }, [searchQuery]);

    // Fetch dictionary words
    const fetchDictionary = useCallback(async () => {
        setIsLoading(true);
        try {
            const params = new URLSearchParams({
                page: pagination.page.toString(),
                limit: pagination.limit.toString(),
                language: selectedLanguage,
            });
            if (debouncedSearch) {
                params.set("search", debouncedSearch);
            }

            const res = await fetch(`/api/dictionary?${params}`);
            const data = await res.json();

            if (data.success) {
                setWords(data.words || []);
                setPagination((prev) => ({
                    ...prev,
                    total: data.pagination.total,
                    totalPages: data.pagination.totalPages,
                }));
            }
        } catch (error) {
            console.error("Error fetching dictionary:", error);
        } finally {
            setIsLoading(false);
        }
    }, [pagination.page, pagination.limit, selectedLanguage, debouncedSearch]);

    // Fetch my words
    const fetchMyWords = useCallback(async () => {
        if (!user) return;
        setMyWordsLoading(true);
        try {
            const params = new URLSearchParams({
                page: myWordsPagination.page.toString(),
                limit: myWordsPagination.limit.toString(),
            });

            const res = await fetch(`/api/my-words?${params}`);
            const data = await res.json();

            if (data.success) {
                setMyWords(data.words || []);
                setMyWordsPagination((prev) => ({
                    ...prev,
                    total: data.pagination.total,
                    totalPages: data.pagination.totalPages,
                }));
                // Update saved word IDs
                const ids = new Set<string>(data.words?.map((w: MyWord) => w.concept_id) || []);
                setSavedWordIds(ids);
            }
        } catch (error) {
            console.error("Error fetching my words:", error);
        } finally {
            setMyWordsLoading(false);
        }
    }, [user, myWordsPagination.page, myWordsPagination.limit]);

    // Effects
    useEffect(() => {
        if (activeTab === "dictionary") {
            fetchDictionary();
        }
    }, [activeTab, fetchDictionary]);

    useEffect(() => {
        if (activeTab === "mywords" && user) {
            fetchMyWords();
        }
    }, [activeTab, user, fetchMyWords]);

    // Also fetch saved word IDs when on dictionary tab
    useEffect(() => {
        if (user && activeTab === "dictionary") {
            fetch("/api/my-words?limit=1000")
                .then((res) => res.json())
                .then((data) => {
                    if (data.success) {
                        const ids = new Set<string>(data.words?.map((w: MyWord) => w.concept_id) || []);
                        setSavedWordIds(ids);
                    }
                })
                .catch(console.error);
        }
    }, [user, activeTab]);

    // Save word
    const saveWord = async (conceptId: string) => {
        if (!user) {
            window.location.href = "/login?redirect=/words";
            return;
        }
        setSavingWordId(conceptId);
        try {
            const res = await fetch("/api/my-words", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ concept_id: conceptId }),
            });
            const data = await res.json();
            if (data.success || data.alreadySaved) {
                setSavedWordIds((prev) => new Set([...prev, conceptId]));
            }
        } catch (error) {
            console.error("Error saving word:", error);
        } finally {
            setSavingWordId(null);
        }
    };

    // Remove word
    const removeWord = async (conceptId: string) => {
        setSavingWordId(conceptId);
        try {
            const res = await fetch(`/api/my-words?concept_id=${conceptId}`, {
                method: "DELETE",
            });
            const data = await res.json();
            if (data.success) {
                setSavedWordIds((prev) => {
                    const newSet = new Set(prev);
                    newSet.delete(conceptId);
                    return newSet;
                });
                // Remove from myWords list if on that tab
                setMyWords((prev) => prev.filter((w) => w.concept_id !== conceptId));
            }
        } catch (error) {
            console.error("Error removing word:", error);
        } finally {
            setSavingWordId(null);
        }
    };

    // Open word detail
    const openWordDetail = (word: DictionaryWord) => {
        setSelectedWord(word);
        setIsModalOpen(true);
    };

    // Get lemma for current language
    const getLemma = (word: DictionaryWord, lang: string) => {
        const entries = word.lexical_entries || {};
        const langEntry = entries[lang] as LexicalEntry | undefined;
        return langEntry?.lemma || word.word_family_root;
    };

    // Get IPA for current language
    const getIpa = (word: DictionaryWord, lang: string) => {
        const entries = word.lexical_entries || {};
        const langEntry = entries[lang] as LexicalEntry | undefined;
        return langEntry?.pronunciations?.[0]?.ipa || "";
    };

    return (
        <div className="min-h-screen bg-[#09090b]" dir="rtl">
            <Navbar />

            {/* Header */}
            <div className="sticky top-0 z-40 bg-[#09090b]/95 backdrop-blur-md border-b border-white/5">
                <div className="container mx-auto px-4 sm:px-6 max-w-6xl">
                    {/* Tabs */}
                    <div className="flex items-center justify-between h-14">
                        <div className="flex items-center gap-4">
                            <button
                                onClick={() => setActiveTab("dictionary")}
                                className={`flex items-center gap-2 text-lg font-bold transition-colors ${activeTab === "dictionary"
                                        ? "text-white"
                                        : "text-zinc-500 hover:text-zinc-300"
                                    }`}
                            >
                                <Globe className="w-5 h-5" />
                                القاموس
                                {activeTab === "dictionary" && (
                                    <span className="px-2 py-0.5 rounded-md bg-purple-500/20 text-purple-300 text-xs font-semibold">
                                        {pagination.total}
                                    </span>
                                )}
                            </button>
                            <span className="text-zinc-700">|</span>
                            <button
                                onClick={() => setActiveTab("mywords")}
                                className={`flex items-center gap-2 text-lg font-bold transition-colors ${activeTab === "mywords"
                                        ? "text-white"
                                        : "text-zinc-500 hover:text-zinc-300"
                                    }`}
                            >
                                <BookMarked className="w-5 h-5" />
                                كلماتي
                                {activeTab === "mywords" && savedWordIds.size > 0 && (
                                    <span className="px-2 py-0.5 rounded-md bg-purple-500/20 text-purple-300 text-xs font-semibold">
                                        {savedWordIds.size}
                                    </span>
                                )}
                            </button>
                        </div>
                    </div>

                    {/* Search */}
                    <div className="pb-3">
                        <div className="relative">
                            <Search className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-500" />
                            <input
                                type="text"
                                placeholder="ابحث عن كلمة..."
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

                    {/* Language chips - only for dictionary tab (Arabic removed - shown in cards) */}
                    {activeTab === "dictionary" && (
                        <div className="pb-3 -mx-4 px-4 overflow-x-auto scrollbar-hide">
                            <div className="flex gap-2">
                                {DISPLAY_LANGUAGES.map((lang) => (
                                    <button
                                        key={lang.code}
                                        onClick={() => {
                                            setSelectedLanguage(lang.code);
                                            setPagination((prev) => ({ ...prev, page: 1 }));
                                        }}
                                        className={`shrink-0 flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-all ${selectedLanguage === lang.code
                                                ? "bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-lg shadow-purple-500/25"
                                                : "bg-white/5 text-zinc-400 hover:bg-white/10 hover:text-white border border-white/5"
                                            }`}
                                    >
                                        <span className="text-base">{lang.flag}</span>
                                        <span>{lang.nameAr}</span>
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Main Content */}
            <main className="container mx-auto px-4 sm:px-6 max-w-6xl py-6">
                {/* Dictionary Tab */}
                {activeTab === "dictionary" && (
                    <>
                        {isLoading ? (
                            <div className="flex items-center justify-center py-20">
                                <Loader2 className="w-8 h-8 animate-spin text-purple-500" />
                            </div>
                        ) : words.length === 0 ? (
                            <div className="text-center py-20">
                                <div className="w-16 h-16 mx-auto rounded-2xl bg-white/5 flex items-center justify-center mb-4">
                                    <Search className="w-8 h-8 text-zinc-600" />
                                </div>
                                <h3 className="text-lg font-semibold text-white mb-2">
                                    لا توجد نتائج
                                </h3>
                                <p className="text-zinc-500 text-sm">
                                    جرب البحث بكلمات مختلفة
                                </p>
                            </div>
                        ) : (
                            <>
                                {/* Words Grid */}
                                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                                    {words.map((word) => {
                                        const isSaved = savedWordIds.has(word.concept_id);
                                        const lemma = getLemma(word, selectedLanguage);
                                        const arabicLemma = getLemma(word, "ar");
                                        const ipa = getIpa(word, selectedLanguage);

                                        return (
                                            <div
                                                key={word.concept_id}
                                                className="group relative p-4 rounded-2xl bg-gradient-to-br from-[#141417] to-[#1a1a1f] border border-white/5 hover:border-purple-500/30 hover:-translate-y-1 hover:shadow-xl hover:shadow-purple-500/10 transition-all duration-300 cursor-pointer"
                                                onClick={() => openWordDetail(word)}
                                            >
                                                {/* Save button */}
                                                <button
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        isSaved ? removeWord(word.concept_id) : saveWord(word.concept_id);
                                                    }}
                                                    disabled={savingWordId === word.concept_id}
                                                    className={`absolute top-3 left-3 p-2 rounded-lg transition-all ${isSaved
                                                            ? "bg-green-500/20 text-green-400"
                                                            : "bg-white/5 text-zinc-500 opacity-0 group-hover:opacity-100"
                                                        } hover:scale-110`}
                                                >
                                                    {savingWordId === word.concept_id ? (
                                                        <Loader2 className="w-4 h-4 animate-spin" />
                                                    ) : isSaved ? (
                                                        <BookmarkCheck className="w-4 h-4" />
                                                    ) : (
                                                        <BookmarkPlus className="w-4 h-4" />
                                                    )}
                                                </button>

                                                {/* Content */}
                                                <div className="pr-2 space-y-2">
                                                    {/* Arabic word - always shown first */}
                                                    <div className="pb-2 border-b border-white/5">
                                                        <p className="text-lg font-bold text-amber-400" dir="rtl">
                                                            🇸🇦 {arabicLemma}
                                                        </p>
                                                    </div>

                                                    {/* Selected language word */}
                                                    <div className="flex items-center gap-2">
                                                        <span className="text-sm">
                                                            {DISPLAY_LANGUAGES.find(l => l.code === selectedLanguage)?.flag}
                                                        </span>
                                                        <p
                                                            className="text-xl font-bold text-white"
                                                            dir="ltr"
                                                        >
                                                            {lemma}
                                                        </p>
                                                    </div>

                                                    {ipa && (
                                                        <p className="text-xs text-emerald-400/80 font-mono" dir="ltr">
                                                            /{ipa}/
                                                        </p>
                                                    )}

                                                    {word.part_of_speech && (
                                                        <span className="inline-block px-2.5 py-1 rounded-lg bg-purple-500/15 text-purple-300 text-xs font-medium">
                                                            {word.part_of_speech}
                                                        </span>
                                                    )}

                                                    {word.definition && (
                                                        <p className="text-sm text-zinc-400 line-clamp-2 leading-relaxed">
                                                            {word.definition}
                                                        </p>
                                                    )}
                                                </div>

                                                {/* Speak button */}
                                                <button
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        speakText(lemma, selectedLanguage);
                                                    }}
                                                    className="absolute bottom-3 left-3 p-2.5 rounded-xl bg-white/5 text-zinc-500 opacity-0 group-hover:opacity-100 hover:bg-purple-500/20 hover:text-purple-400 transition-all"
                                                    title="استمع للنطق"
                                                >
                                                    <Volume2 className="w-4 h-4" />
                                                </button>
                                            </div>
                                        );
                                    })}
                                </div>

                                {/* Pagination */}
                                {pagination.totalPages > 1 && (
                                    <div className="flex items-center justify-center gap-2 mt-8">
                                        <button
                                            onClick={() => setPagination((p) => ({ ...p, page: p.page - 1 }))}
                                            disabled={pagination.page === 1}
                                            className="p-2 rounded-lg bg-white/5 text-zinc-400 hover:bg-white/10 hover:text-white disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                                        >
                                            <ChevronRight className="w-5 h-5" />
                                        </button>
                                        <span className="px-4 py-2 text-sm text-zinc-400">
                                            صفحة {pagination.page} من {pagination.totalPages}
                                        </span>
                                        <button
                                            onClick={() => setPagination((p) => ({ ...p, page: p.page + 1 }))}
                                            disabled={pagination.page === pagination.totalPages}
                                            className="p-2 rounded-lg bg-white/5 text-zinc-400 hover:bg-white/10 hover:text-white disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                                        >
                                            <ChevronLeft className="w-5 h-5" />
                                        </button>
                                    </div>
                                )}
                            </>
                        )}
                    </>
                )}

                {/* My Words Tab */}
                {activeTab === "mywords" && (
                    <>
                        {!user ? (
                            <div className="text-center py-20">
                                <div className="w-16 h-16 mx-auto rounded-2xl bg-white/5 flex items-center justify-center mb-4">
                                    <BookMarked className="w-8 h-8 text-zinc-600" />
                                </div>
                                <h3 className="text-lg font-semibold text-white mb-2">
                                    سجل دخولك أولاً
                                </h3>
                                <p className="text-zinc-500 text-sm mb-4">
                                    لعرض كلماتك المحفوظة
                                </p>
                                <Link
                                    href="/login?redirect=/words"
                                    className="inline-block px-5 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-sm font-medium transition-colors"
                                >
                                    تسجيل الدخول
                                </Link>
                            </div>
                        ) : myWordsLoading ? (
                            <div className="flex items-center justify-center py-20">
                                <Loader2 className="w-8 h-8 animate-spin text-purple-500" />
                            </div>
                        ) : myWords.length === 0 ? (
                            <div className="text-center py-20">
                                <div className="w-16 h-16 mx-auto rounded-2xl bg-white/5 flex items-center justify-center mb-4">
                                    <BookMarked className="w-8 h-8 text-zinc-600" />
                                </div>
                                <h3 className="text-lg font-semibold text-white mb-2">
                                    لم تحفظ أي كلمات بعد
                                </h3>
                                <p className="text-zinc-500 text-sm mb-4">
                                    اذهب للقاموس واحفظ الكلمات التي تريد تعلمها
                                </p>
                                <button
                                    onClick={() => setActiveTab("dictionary")}
                                    className="inline-block px-5 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-sm font-medium transition-colors"
                                >
                                    تصفح القاموس
                                </button>
                            </div>
                        ) : (
                            <>
                                {/* My Words Grid */}
                                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                                    {myWords.map((item) => {
                                        const word = item.dictionary;
                                        if (!word) return null;
                                        const arabicLemma = getLemma(word, "ar");
                                        const englishLemma = getLemma(word, "en");

                                        return (
                                            <div
                                                key={item.id}
                                                className="group relative p-4 rounded-2xl bg-gradient-to-br from-[#141417] to-[#1a1a1f] border border-white/5 hover:border-purple-500/30 hover:-translate-y-1 hover:shadow-xl hover:shadow-purple-500/10 transition-all duration-300 cursor-pointer"
                                                onClick={() => openWordDetail(word)}
                                            >
                                                {/* Actions */}
                                                <div className="absolute top-3 left-3 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                                    <button
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            speakText(englishLemma, "en");
                                                        }}
                                                        className="p-2 rounded-lg bg-white/5 text-zinc-500 hover:bg-purple-500/20 hover:text-purple-400 transition-colors"
                                                        title="استمع للنطق"
                                                    >
                                                        <Volume2 className="w-4 h-4" />
                                                    </button>
                                                    <button
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            removeWord(word.concept_id);
                                                        }}
                                                        disabled={savingWordId === word.concept_id}
                                                        className="p-2 rounded-lg bg-white/5 text-zinc-500 hover:bg-red-500/20 hover:text-red-400 transition-colors"
                                                        title="حذف الكلمة"
                                                    >
                                                        {savingWordId === word.concept_id ? (
                                                            <Loader2 className="w-4 h-4 animate-spin" />
                                                        ) : (
                                                            <Trash2 className="w-4 h-4" />
                                                        )}
                                                    </button>
                                                </div>

                                                {/* Favorite indicator */}
                                                {item.is_favorite && (
                                                    <Star className="absolute top-3 right-3 w-4 h-4 text-yellow-400 fill-yellow-400" />
                                                )}

                                                {/* Content */}
                                                <div className="space-y-2">
                                                    {/* Arabic word - always shown first */}
                                                    <div className="pb-2 border-b border-white/5">
                                                        <p className="text-lg font-bold text-amber-400" dir="rtl">
                                                            🇸🇦 {arabicLemma}
                                                        </p>
                                                    </div>

                                                    {/* English word */}
                                                    <div className="flex items-center gap-2">
                                                        <span className="text-sm">🇬🇧</span>
                                                        <p className="text-xl font-bold text-white" dir="ltr">
                                                            {englishLemma}
                                                        </p>
                                                    </div>

                                                    {word.part_of_speech && (
                                                        <span className="inline-block px-2.5 py-1 rounded-lg bg-purple-500/15 text-purple-300 text-xs font-medium">
                                                            {word.part_of_speech}
                                                        </span>
                                                    )}

                                                    {word.definition && (
                                                        <p className="text-sm text-zinc-400 line-clamp-2 leading-relaxed">
                                                            {word.definition}
                                                        </p>
                                                    )}
                                                </div>

                                                {/* Languages preview */}
                                                <div className="flex gap-1.5 mt-3 pt-2 border-t border-white/5">
                                                    {word.lexical_entries &&
                                                        Object.keys(word.lexical_entries).map((lang) => {
                                                            const langConfig = ALL_LANGUAGES.find((l) => l.code === lang);
                                                            return (
                                                                <span key={lang} className="text-sm opacity-60 hover:opacity-100 transition-opacity" title={langConfig?.name}>
                                                                    {langConfig?.flag}
                                                                </span>
                                                            );
                                                        })}
                                                </div>

                                                <p className="text-[10px] text-zinc-600 mt-2">
                                                    {new Date(item.created_at).toLocaleDateString("ar-EG")}
                                                </p>
                                            </div>
                                        );
                                    })}
                                </div>

                                {/* Pagination */}
                                {myWordsPagination.totalPages > 1 && (
                                    <div className="flex items-center justify-center gap-2 mt-8">
                                        <button
                                            onClick={() => setMyWordsPagination((p) => ({ ...p, page: p.page - 1 }))}
                                            disabled={myWordsPagination.page === 1}
                                            className="p-2 rounded-lg bg-white/5 text-zinc-400 hover:bg-white/10 hover:text-white disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                                        >
                                            <ChevronRight className="w-5 h-5" />
                                        </button>
                                        <span className="px-4 py-2 text-sm text-zinc-400">
                                            صفحة {myWordsPagination.page} من {myWordsPagination.totalPages}
                                        </span>
                                        <button
                                            onClick={() => setMyWordsPagination((p) => ({ ...p, page: p.page + 1 }))}
                                            disabled={myWordsPagination.page === myWordsPagination.totalPages}
                                            className="p-2 rounded-lg bg-white/5 text-zinc-400 hover:bg-white/10 hover:text-white disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                                        >
                                            <ChevronLeft className="w-5 h-5" />
                                        </button>
                                    </div>
                                )}
                            </>
                        )}
                    </>
                )}
            </main>

            {/* Word Detail Modal */}
            <WordDetailModal
                word={selectedWord}
                isOpen={isModalOpen}
                onClose={() => {
                    setIsModalOpen(false);
                    setSelectedWord(null);
                }}
                isSaved={selectedWord ? savedWordIds.has(selectedWord.concept_id) : false}
                onSave={saveWord}
                onRemove={removeWord}
            />
        </div>
    );
}
