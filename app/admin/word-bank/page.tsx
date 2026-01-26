"use client";

/**
 * Admin: Word Bank Management (النظام الثاني)
 * إدارة بنك الكلمات - منفصل تماماً عن كلمات الصفحات
 */

import { useState, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import {
    Library,
    Plus,
    Search,
    Trash2,
    Edit2,
    Save,
    X,
    Globe,
    Tag,
    Star,
    Volume2,
    Languages,
    ChevronDown,
    AlertTriangle,
} from "lucide-react";
import { supabase } from "@/lib/supabase";
import { WordBankEntry, SupportedLanguage, WordCategory } from "@/lib/words/types";

export default function WordBankAdminPage() {
    const [words, setWords] = useState<WordBankEntry[]>([]);
    const [languages, setLanguages] = useState<SupportedLanguage[]>([]);
    const [categories, setCategories] = useState<WordCategory[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState("");

    // Filters
    const [selectedLanguage, setSelectedLanguage] = useState<string>("all");
    const [selectedCategory, setSelectedCategory] = useState<string>("all");
    const [selectedDifficulty, setSelectedDifficulty] = useState<string>("all");
    const [searchQuery, setSearchQuery] = useState("");

    // Pagination
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);

    // Modal states
    const [showAddModal, setShowAddModal] = useState(false);
    const [editingWord, setEditingWord] = useState<WordBankEntry | null>(null);

    // Form state
    const [formData, setFormData] = useState({
        language_code: "en",
        word_text: "",
        word_definition: "",
        category_slug: "",
        difficulty_level: "beginner" as "beginner" | "intermediate" | "advanced",
        example_sentence: "",
        phonetic_text: "",
        notes: "",
        translations: [] as Array<{
            target_language: string;
            translated_text: string;
            example_sentence: string;
        }>,
    });

    // جلب اللغات والتصنيفات
    const fetchMetadata = useCallback(async () => {
        const [langsRes, catsRes] = await Promise.all([
            supabase.from("supported_languages").select("*").eq("is_active", true).order("sort_order"),
            supabase.from("word_categories").select("*").eq("is_active", true).order("sort_order"),
        ]);

        if (langsRes.data) setLanguages(langsRes.data);
        if (catsRes.data) setCategories(catsRes.data);
    }, []);

    // جلب كلمات بنك الكلمات
    const fetchWords = useCallback(async () => {
        setIsLoading(true);
        try {
            const params = new URLSearchParams();
            params.append("page", page.toString());
            params.append("limit", "20");

            if (selectedLanguage !== "all") params.append("language_code", selectedLanguage);
            if (selectedCategory !== "all") params.append("category", selectedCategory);
            if (selectedDifficulty !== "all") params.append("difficulty", selectedDifficulty);
            if (searchQuery) params.append("search", searchQuery);

            const res = await fetch(`/api/words/word-bank?${params}`);
            const data = await res.json();

            if (data.success) {
                setWords(data.words);
                setTotalPages(data.pagination.totalPages);
            }
        } catch (err) {
            console.error("Error fetching word bank:", err);
            setError("فشل في جلب الكلمات");
        } finally {
            setIsLoading(false);
        }
    }, [page, selectedLanguage, selectedCategory, selectedDifficulty, searchQuery]);

    useEffect(() => {
        fetchMetadata();
    }, [fetchMetadata]);

    useEffect(() => {
        fetchWords();
    }, [fetchWords]);

    // إضافة/تعديل كلمة
    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError("");

        try {
            const { data: { session } } = await supabase.auth.getSession();

            if (editingWord) {
                // تعديل
                const { error: updateError } = await supabase
                    .from("word_bank")
                    .update({
                        definition: formData.definition,
                        category: formData.category,
                        difficulty_level: formData.difficulty_level,
                        example_sentence: formData.example_sentence,
                        phonetic: formData.phonetic,
                        notes: formData.notes,
                    })
                    .eq("id", editingWord.id);

                if (updateError) throw updateError;
            } else {
                // إضافة جديدة
                const res = await fetch("/api/words/word-bank", {
                    method: "POST",
                    headers: {
                        Authorization: `Bearer ${session?.access_token}`,
                        "Content-Type": "application/json",
                    },
                    body: JSON.stringify(formData),
                });

                const data = await res.json();
                if (!data.success) throw new Error(data.error);
            }

            fetchWords();
            setShowAddModal(false);
            setEditingWord(null);
            resetForm();
        } catch (err: unknown) {
            const errorMessage = err instanceof Error ? err.message : "حدث خطأ";
            setError(errorMessage);
        }
    };

    // حذف كلمة
    const handleDelete = async (id: string) => {
        if (!confirm("هل أنت متأكد من حذف هذه الكلمة وجميع ترجماتها؟")) return;

        try {
            const { error: deleteError } = await supabase
                .from("word_bank")
                .delete()
                .eq("id", id);

            if (deleteError) throw deleteError;
            fetchWords();
        } catch (err) {
            console.error("Error deleting:", err);
            setError("فشل في حذف الكلمة");
        }
    };

    const resetForm = () => {
        setFormData({
            language_code: "en",
            word_text: "",
            word_definition: "",
            category_slug: "",
            difficulty_level: "beginner",
            example_sentence: "",
            phonetic_text: "",
            notes: "",
            translations: [],
        });
    };

    const openEditModal = (word: WordBankEntry) => {
        setEditingWord(word);
        setFormData({
            language_code: word.language_code,
            word_text: word.word_text,
            word_definition: word.word_definition || "",
            category_slug: word.category_slug || "",
            difficulty_level: word.difficulty_level || "beginner",
            example_sentence: word.example_sentence || "",
            phonetic_text: word.phonetic_text || "",
            notes: word.notes || "",
            translations: (word.translations || []).map((t) => ({
                target_language: t.target_language,
                translated_text: t.translated_text,
                example_sentence: t.example_sentence || "",
            })),
        });
        setShowAddModal(true);
    };

    // إضافة ترجمة جديدة
    const addTranslation = () => {
        setFormData({
            ...formData,
            translations: [
                ...formData.translations,
                { target_language: "ar", translated_text: "", example_sentence: "" },
            ],
        });
    };

    // حذف ترجمة
    const removeTranslation = (index: number) => {
        setFormData({
            ...formData,
            translations: formData.translations.filter((_, i) => i !== index),
        });
    };

    // تحديث ترجمة
    const updateTranslation = (index: number, field: string, value: string) => {
        const newTranslations = [...formData.translations];
        newTranslations[index] = { ...newTranslations[index], [field]: value };
        setFormData({ ...formData, translations: newTranslations });
    };

    // نطق الكلمة
    const speakWord = (word: string, lang: string) => {
        if ("speechSynthesis" in window) {
            const utterance = new SpeechSynthesisUtterance(word);
            utterance.lang = lang;
            speechSynthesis.speak(utterance);
        }
    };

    const getDifficultyColor = (level: number) => {
        switch (level) {
            case 1: return "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400";
            case 2: return "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400";
            case 3: return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400";
            case 4: return "bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400";
            case 5: return "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400";
            default: return "bg-gray-100 text-gray-800";
        }
    };

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900" dir="rtl">
            <div className="container mx-auto px-4 py-8">
                {/* Header */}
                <div className="flex items-center justify-between mb-8">
                    <div className="flex items-center gap-4">
                        <div className="p-3 rounded-xl bg-purple-100 dark:bg-purple-900/30">
                            <Library className="h-6 w-6 text-purple-600 dark:text-purple-400" />
                        </div>
                        <div>
                            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                                بنك الكلمات
                            </h1>
                            <p className="text-gray-500 text-sm">
                                النظام الثاني - قاموس الكلمات المنفصل
                            </p>
                        </div>
                    </div>

                    <button
                        onClick={() => {
                            resetForm();
                            setEditingWord(null);
                            setShowAddModal(true);
                        }}
                        className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
                    >
                        <Plus className="h-5 w-5" />
                        إضافة كلمة
                    </button>
                </div>

                {/* Warning Banner */}
                <div className="mb-6 p-4 bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800 rounded-lg flex items-start gap-3">
                    <AlertTriangle className="h-5 w-5 text-orange-600 flex-shrink-0 mt-0.5" />
                    <div>
                        <p className="text-orange-800 dark:text-orange-200 text-sm font-medium">
                            نظام منفصل تماماً
                        </p>
                        <p className="text-orange-700 dark:text-orange-300 text-sm mt-1">
                            هذا النظام منفصل 100% عن "كلمات الصفحات". الكلمات هنا لا تظهر في صفحات الموقع
                            ولا علاقة لها بتعليم المستخدمين للكلمات.
                        </p>
                    </div>
                </div>

                {/* Filters */}
                <div className="bg-white dark:bg-gray-800 rounded-xl p-4 mb-6 shadow-sm">
                    <div className="flex flex-wrap gap-4">
                        {/* Search */}
                        <div className="flex-1 min-w-[200px]">
                            <div className="relative">
                                <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                                <input
                                    type="text"
                                    placeholder="بحث في الكلمات..."
                                    value={searchQuery}
                                    onChange={(e) => {
                                        setSearchQuery(e.target.value);
                                        setPage(1);
                                    }}
                                    className="w-full pr-10 pl-4 py-2 border border-gray-200 dark:border-gray-700 rounded-lg bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white"
                                />
                            </div>
                        </div>

                        {/* Language Filter */}
                        <div className="relative min-w-[150px]">
                            <Globe className="absolute right-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400 pointer-events-none" />
                            <select
                                value={selectedLanguage}
                                onChange={(e) => {
                                    setSelectedLanguage(e.target.value);
                                    setPage(1);
                                }}
                                className="w-full pr-10 pl-8 py-2 border border-gray-200 dark:border-gray-700 rounded-lg bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white appearance-none"
                            >
                                <option value="all">كل اللغات</option>
                                {languages.map((lang) => (
                                    <option key={lang.code} value={lang.code}>
                                        {lang.flag_emoji} {lang.name_ar || lang.name_en}
                                    </option>
                                ))}
                            </select>
                            <ChevronDown className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
                        </div>

                        {/* Category Filter */}
                        <div className="relative min-w-[150px]">
                            <Tag className="absolute right-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400 pointer-events-none" />
                            <select
                                value={selectedCategory}
                                onChange={(e) => {
                                    setSelectedCategory(e.target.value);
                                    setPage(1);
                                }}
                                className="w-full pr-10 pl-8 py-2 border border-gray-200 dark:border-gray-700 rounded-lg bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white appearance-none"
                            >
                                <option value="all">كل التصنيفات</option>
                                {categories.map((cat) => (
                                    <option key={cat.slug} value={cat.slug}>
                                        {cat.name_ar}
                                    </option>
                                ))}
                            </select>
                            <ChevronDown className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
                        </div>

                        {/* Difficulty Filter */}
                        <div className="relative min-w-[150px]">
                            <Star className="absolute right-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400 pointer-events-none" />
                            <select
                                value={selectedDifficulty}
                                onChange={(e) => {
                                    setSelectedDifficulty(e.target.value);
                                    setPage(1);
                                }}
                                className="w-full pr-10 pl-8 py-2 border border-gray-200 dark:border-gray-700 rounded-lg bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white appearance-none"
                            >
                                <option value="all">كل المستويات</option>
                                <option value="1">سهل جداً (1)</option>
                                <option value="2">سهل (2)</option>
                                <option value="3">متوسط (3)</option>
                                <option value="4">صعب (4)</option>
                                <option value="5">صعب جداً (5)</option>
                            </select>
                            <ChevronDown className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
                        </div>
                    </div>
                </div>

                {/* Error */}
                {error && (
                    <div className="mb-4 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg text-red-600 dark:text-red-400">
                        {error}
                    </div>
                )}

                {/* Words Grid */}
                {isLoading ? (
                    <div className="p-8 text-center text-gray-500">جاري التحميل...</div>
                ) : words.length === 0 ? (
                    <div className="bg-white dark:bg-gray-800 rounded-xl p-8 text-center text-gray-500 shadow-sm">
                        لا توجد كلمات. أضف كلمات جديدة للبدء.
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {words.map((word) => {
                            const lang = languages.find((l) => l.code === word.language_code);
                            const cat = categories.find((c) => c.slug === word.category_slug);

                            return (
                                <motion.div
                                    key={word.id}
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm hover:shadow-md transition-shadow"
                                >
                                    <div className="flex items-start justify-between mb-3">
                                        <div>
                                            <div className="flex items-center gap-2">
                                                <h3 className="text-lg font-bold text-gray-900 dark:text-white">
                                                    {word.word_text}
                                                </h3>
                                                <button
                                                    onClick={() => speakWord(word.word_text, word.language_code)}
                                                    className="p-1 text-gray-400 hover:text-purple-600 transition-colors"
                                                    title="استمع للنطق"
                                                >
                                                    <Volume2 className="h-4 w-4" />
                                                </button>
                                            </div>
                                            {word.phonetic_text && (
                                                <p className="text-sm text-gray-500 mt-1">/{word.phonetic_text}/</p>
                                            )}
                                        </div>
                                        <div className="flex gap-1">
                                            <button
                                                onClick={() => openEditModal(word)}
                                                className="p-2 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded-lg"
                                            >
                                                <Edit2 className="h-4 w-4" />
                                            </button>
                                            <button
                                                onClick={() => handleDelete(word.id)}
                                                className="p-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-lg"
                                            >
                                                <Trash2 className="h-4 w-4" />
                                            </button>
                                        </div>
                                    </div>

                                    {/* Tags */}
                                    <div className="flex flex-wrap gap-2 mb-3">
                                        <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-gray-100 dark:bg-gray-700 rounded text-xs">
                                            {lang?.flag_emoji} {lang?.name_ar || word.language_code}
                                        </span>
                                        {cat && (
                                            <span className="px-2 py-0.5 bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 rounded text-xs">
                                                {cat.name_ar}
                                            </span>
                                        )}
                                        <span className={`px-2 py-0.5 rounded text-xs ${getDifficultyColor(word.difficulty_level)}`}>
                                            مستوى {word.difficulty_level}
                                        </span>
                                    </div>

                                    {/* Definition */}
                                    {word.word_definition && (
                                        <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                                            {word.word_definition}
                                        </p>
                                    )}

                                    {/* Example */}
                                    {word.example_sentence && (
                                        <p className="text-sm text-gray-500 italic border-r-2 border-purple-300 pr-2">
                                            "{word.example_sentence}"
                                        </p>
                                    )}

                                    {/* Translations */}
                                    {word.translations && word.translations.length > 0 && (
                                        <div className="mt-3 pt-3 border-t border-gray-100 dark:border-gray-700">
                                            <div className="flex items-center gap-1 text-xs text-gray-500 mb-2">
                                                <Languages className="h-3 w-3" />
                                                الترجمات
                                            </div>
                                            <div className="space-y-1">
                                                {word.translations.map((t, i) => {
                                                    const tLang = languages.find((l) => l.code === t.target_language);
                                                    return (
                                                        <div key={i} className="flex items-center gap-2 text-sm">
                                                            <span className="text-xs">{tLang?.flag_emoji}</span>
                                                            <span className="text-gray-700 dark:text-gray-300">
                                                                {t.translated_text}
                                                            </span>
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        </div>
                                    )}
                                </motion.div>
                            );
                        })}
                    </div>
                )}

                {/* Pagination */}
                {totalPages > 1 && (
                    <div className="flex items-center justify-center gap-2 mt-6">
                        <button
                            onClick={() => setPage((p) => Math.max(1, p - 1))}
                            disabled={page === 1}
                            className="px-4 py-2 border border-gray-200 dark:border-gray-700 rounded-lg disabled:opacity-50"
                        >
                            السابق
                        </button>
                        <span className="px-4 py-2 text-gray-600 dark:text-gray-400">
                            {page} من {totalPages}
                        </span>
                        <button
                            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                            disabled={page === totalPages}
                            className="px-4 py-2 border border-gray-200 dark:border-gray-700 rounded-lg disabled:opacity-50"
                        >
                            التالي
                        </button>
                    </div>
                )}
            </div>

            {/* Add/Edit Modal */}
            {showAddModal && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 overflow-y-auto">
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="bg-white dark:bg-gray-800 rounded-2xl w-full max-w-2xl shadow-xl my-8"
                    >
                        <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
                            <h2 className="text-lg font-bold text-gray-900 dark:text-white">
                                {editingWord ? "تعديل كلمة" : "إضافة كلمة جديدة لبنك الكلمات"}
                            </h2>
                            <button
                                onClick={() => {
                                    setShowAddModal(false);
                                    setEditingWord(null);
                                }}
                                className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"
                            >
                                <X className="h-5 w-5" />
                            </button>
                        </div>

                        <form onSubmit={handleSubmit} className="p-4 space-y-4 max-h-[70vh] overflow-y-auto">
                            <div className="grid grid-cols-2 gap-4">
                                {/* Language */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                        اللغة
                                    </label>
                                    <select
                                        value={formData.language_code}
                                        onChange={(e) =>
                                            setFormData({ ...formData, language_code: e.target.value })
                                        }
                                        disabled={!!editingWord}
                                        className="w-full px-4 py-2 border border-gray-200 dark:border-gray-700 rounded-lg bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white disabled:opacity-50"
                                    >
                                        {languages.map((lang) => (
                                            <option key={lang.code} value={lang.code}>
                                                {lang.flag_emoji} {lang.name_ar || lang.name_en}
                                            </option>
                                        ))}
                                    </select>
                                </div>

                                {/* Category */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                        التصنيف
                                    </label>
                                    <select
                                        value={formData.category_slug}
                                        onChange={(e) =>
                                            setFormData({ ...formData, category_slug: e.target.value })
                                        }
                                        className="w-full px-4 py-2 border border-gray-200 dark:border-gray-700 rounded-lg bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white"
                                    >
                                        <option value="">اختر تصنيف</option>
                                        {categories.map((cat) => (
                                            <option key={cat.slug} value={cat.slug}>
                                                {cat.name_ar}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                            </div>

                            {/* Word */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                    الكلمة
                                </label>
                                <input
                                    type="text"
                                    value={formData.word_text}
                                    onChange={(e) => setFormData({ ...formData, word_text: e.target.value })}
                                    required
                                    disabled={!!editingWord}
                                    className="w-full px-4 py-2 border border-gray-200 dark:border-gray-700 rounded-lg bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white disabled:opacity-50"
                                    placeholder="أدخل الكلمة"
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                {/* Phonetic */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                        النطق
                                    </label>
                                    <input
                                        type="text"
                                        value={formData.phonetic_text}
                                        onChange={(e) => setFormData({ ...formData, phonetic_text: e.target.value })}
                                        className="w-full px-4 py-2 border border-gray-200 dark:border-gray-700 rounded-lg bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white"
                                        placeholder="həˈloʊ"
                                        dir="ltr"
                                    />
                                </div>

                                {/* Difficulty */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                        مستوى الصعوبة
                                    </label>
                                    <select
                                        value={formData.difficulty_level}
                                        onChange={(e) =>
                                            setFormData({ ...formData, difficulty_level: e.target.value as "beginner" | "intermediate" | "advanced" })
                                        }
                                        className="w-full px-4 py-2 border border-gray-200 dark:border-gray-700 rounded-lg bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white"
                                    >
                                        <option value="beginner">مبتدئ</option>
                                        <option value="intermediate">متوسط</option>
                                        <option value="advanced">متقدم</option>
                                    </select>
                                </div>
                            </div>

                            {/* Definition */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                    التعريف (بنفس اللغة)
                                </label>
                                <textarea
                                    value={formData.word_definition}
                                    onChange={(e) => setFormData({ ...formData, word_definition: e.target.value })}
                                    rows={2}
                                    className="w-full px-4 py-2 border border-gray-200 dark:border-gray-700 rounded-lg bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white resize-none"
                                    placeholder="تعريف الكلمة بنفس لغتها"
                                />
                            </div>

                            {/* Example */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                    جملة مثال
                                </label>
                                <textarea
                                    value={formData.example_sentence}
                                    onChange={(e) => setFormData({ ...formData, example_sentence: e.target.value })}
                                    rows={2}
                                    className="w-full px-4 py-2 border border-gray-200 dark:border-gray-700 rounded-lg bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white resize-none"
                                    placeholder="جملة توضح استخدام الكلمة"
                                />
                            </div>

                            {/* Translations */}
                            {!editingWord && (
                                <div>
                                    <div className="flex items-center justify-between mb-2">
                                        <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                                            الترجمات
                                        </label>
                                        <button
                                            type="button"
                                            onClick={addTranslation}
                                            className="text-sm text-purple-600 hover:text-purple-700"
                                        >
                                            + إضافة ترجمة
                                        </button>
                                    </div>

                                    {formData.translations.map((trans, index) => (
                                        <div
                                            key={index}
                                            className="flex gap-2 items-start mb-2 p-3 bg-gray-50 dark:bg-gray-900 rounded-lg"
                                        >
                                            <select
                                                value={trans.target_language}
                                                onChange={(e) =>
                                                    updateTranslation(index, "target_language", e.target.value)
                                                }
                                                className="w-32 px-2 py-2 border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-sm"
                                            >
                                                {languages
                                                    .filter((l) => l.code !== formData.language_code)
                                                    .map((lang) => (
                                                        <option key={lang.code} value={lang.code}>
                                                            {lang.flag_emoji} {lang.code}
                                                        </option>
                                                    ))}
                                            </select>
                                            <input
                                                type="text"
                                                value={trans.translated_text}
                                                onChange={(e) =>
                                                    updateTranslation(index, "translated_text", e.target.value)
                                                }
                                                className="flex-1 px-3 py-2 border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-sm"
                                                placeholder="الترجمة"
                                            />
                                            <button
                                                type="button"
                                                onClick={() => removeTranslation(index)}
                                                className="p-2 text-red-500 hover:bg-red-50 rounded-lg"
                                            >
                                                <X className="h-4 w-4" />
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            )}

                            {/* Notes */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                    ملاحظات
                                </label>
                                <textarea
                                    value={formData.notes}
                                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                                    rows={2}
                                    className="w-full px-4 py-2 border border-gray-200 dark:border-gray-700 rounded-lg bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white resize-none"
                                    placeholder="ملاحظات إضافية..."
                                />
                            </div>

                            {/* Actions */}
                            <div className="flex gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
                                <button
                                    type="submit"
                                    className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
                                >
                                    <Save className="h-5 w-5" />
                                    {editingWord ? "حفظ التغييرات" : "إضافة للبنك"}
                                </button>
                                <button
                                    type="button"
                                    onClick={() => {
                                        setShowAddModal(false);
                                        setEditingWord(null);
                                    }}
                                    className="px-4 py-2 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                                >
                                    إلغاء
                                </button>
                            </div>
                        </form>
                    </motion.div>
                </div>
            )}
        </div>
    );
}
