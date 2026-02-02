"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { Search, X, BookMarked, Globe } from "lucide-react";
import { Navbar } from "@/components/Navbar";
import { useAuth } from "@/hooks/useAuth";
import {
    WordDetailModal,
    WordsPagination,
    WordsEmptyState,
    WordsLoadingState,
    DictionaryWordCard,
    MyWordCard,
} from "@/components/words";
import {
    DictionaryWord,
    MyWord,
    Pagination,
    DISPLAY_LANGUAGES,
} from "@/lib/utils/words";

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

    // Filtered my words based on search
    const filteredMyWords = useMemo(() => {
        if (!searchQuery.trim()) return myWords;
        const query = searchQuery.toLowerCase();
        return myWords.filter((item) => {
            const word = item.dictionary;
            if (!word) return false;
            const entries = word.lexical_entries || {};
            // Search in all language lemmas
            for (const lang of Object.keys(entries)) {
                const entry = entries[lang];
                if (entry?.lemma?.toLowerCase().includes(query)) return true;
            }
            // Search in definition
            if (word.definition?.toLowerCase().includes(query)) return true;
            // Search in word_family_root
            if (word.word_family_root?.toLowerCase().includes(query)) return true;
            return false;
        });
    }, [myWords, searchQuery]);

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

    // Fetch saved word IDs when on dictionary tab
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
                                className={`flex items-center gap-2 text-lg font-bold transition-colors ${
                                    activeTab === "dictionary" ? "text-white" : "text-zinc-500 hover:text-zinc-300"
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
                                className={`flex items-center gap-2 text-lg font-bold transition-colors ${
                                    activeTab === "mywords" ? "text-white" : "text-zinc-500 hover:text-zinc-300"
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

                    {/* Language chips */}
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
                                        className={`shrink-0 flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-all ${
                                            selectedLanguage === lang.code
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
                            <WordsLoadingState />
                        ) : words.length === 0 ? (
                            <WordsEmptyState type="no-results" searchQuery={searchQuery} />
                        ) : (
                            <>
                                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
                                    {words.map((word) => (
                                        <DictionaryWordCard
                                            key={word.concept_id}
                                            word={word}
                                            selectedLanguage={selectedLanguage}
                                            isSaved={savedWordIds.has(word.concept_id)}
                                            isSaving={savingWordId === word.concept_id}
                                            onSave={saveWord}
                                            onRemove={removeWord}
                                            onClick={() => openWordDetail(word)}
                                        />
                                    ))}
                                </div>

                                <WordsPagination
                                    page={pagination.page}
                                    totalPages={pagination.totalPages}
                                    onPageChange={(page) => setPagination((p) => ({ ...p, page }))}
                                    className="mt-8"
                                />
                            </>
                        )}
                    </>
                )}

                {/* My Words Tab */}
                {activeTab === "mywords" && (
                    <>
                        {!user ? (
                            <WordsEmptyState type="not-logged-in" />
                        ) : myWordsLoading ? (
                            <WordsLoadingState />
                        ) : myWords.length === 0 ? (
                            <WordsEmptyState type="no-saved-words" onAction={() => setActiveTab("dictionary")} />
                        ) : filteredMyWords.length === 0 ? (
                            <WordsEmptyState type="no-results" searchQuery={searchQuery} />
                        ) : (
                            <>
                                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
                                    {filteredMyWords.map((item) => (
                                        <MyWordCard
                                            key={item.id}
                                            item={item}
                                            isSaving={savingWordId === item.dictionary?.concept_id}
                                            onRemove={removeWord}
                                            onClick={() => item.dictionary && openWordDetail(item.dictionary)}
                                        />
                                    ))}
                                </div>

                                {!searchQuery && (
                                    <WordsPagination
                                        page={myWordsPagination.page}
                                        totalPages={myWordsPagination.totalPages}
                                        onPageChange={(page) => setMyWordsPagination((p) => ({ ...p, page }))}
                                        className="mt-8"
                                    />
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
