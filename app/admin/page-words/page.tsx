"use client";

/**
 * Admin: Page Words Management (النظام الأول)
 * إدارة كلمات الصفحات - منفصل تماماً عن Word Bank
 */

import { useState, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import {
    BookOpen,
    Plus,
    Search,
    Trash2,
    Edit2,
    Save,
    X,
    Globe,
    FileText,
    GripVertical,
    ChevronDown,
} from "lucide-react";
import { supabase } from "@/lib/supabase";
import { PageWord, SupportedLanguage } from "@/lib/words/types";

export default function PageWordsAdminPage() {
    const [words, setWords] = useState<PageWord[]>([]);
    const [languages, setLanguages] = useState<SupportedLanguage[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState("");

    // Filters
    const [selectedLanguage, setSelectedLanguage] = useState<string>("all");
    const [selectedPage, setSelectedPage] = useState<string>("all");
    const [searchQuery, setSearchQuery] = useState("");

    // Modal states
    const [showAddModal, setShowAddModal] = useState(false);
    const [editingWord, setEditingWord] = useState<PageWord | null>(null);

    // Form state
    const [formData, setFormData] = useState({
        language_code: "ar",
        word_id: "",
        page_id: "",
        word_text: "",
        word_position: 0,
        word_context: "",
    });

    // جلب اللغات المدعومة
    const fetchLanguages = useCallback(async () => {
        const { data } = await supabase
            .from("supported_languages")
            .select("*")
            .eq("is_active", true)
            .order("sort_order");

        if (data) setLanguages(data);
    }, []);

    // جلب كلمات الصفحات
    const fetchWords = useCallback(async () => {
        setIsLoading(true);
        try {
            let query = supabase
                .from("page_words")
                .select("*")
                .order("page_id")
                .order("word_position");

            if (selectedLanguage !== "all") {
                query = query.eq("language_code", selectedLanguage);
            }

            if (selectedPage !== "all") {
                query = query.eq("page_id", selectedPage);
            }

            if (searchQuery) {
                query = query.ilike("word_text", `%${searchQuery}%`);
            }

            const { data, error: fetchError } = await query;

            if (fetchError) throw fetchError;
            setWords(data || []);
        } catch (err) {
            console.error("Error fetching words:", err);
            if (err && typeof err === 'object') {
                console.error("Error details:", JSON.stringify(err, null, 2));
            }
            const message = (err as any)?.message || "فشل في جلب الكلمات";
            setError(message);
        } finally {
            setIsLoading(false);
        }
    }, [selectedLanguage, selectedPage, searchQuery]);

    useEffect(() => {
        fetchLanguages();
    }, [fetchLanguages]);

    useEffect(() => {
        fetchWords();
    }, [fetchWords]);

    // جلب قائمة الصفحات الفريدة
    const uniquePages = [...new Set(words.map((w) => w.page_id))];

    // إضافة/تعديل كلمة
    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError("");

        try {
            const { data: { session } } = await supabase.auth.getSession();

            if (editingWord) {
                // تعديل
                const { error: updateError } = await supabase
                    .from("page_words")
                    .update({
                        word_text: formData.word_text,
                        word_position: formData.word_position,
                        word_context: formData.word_context,
                    })
                    .eq("id", editingWord.id);

                if (updateError) throw updateError;
            } else {
                // إضافة جديدة
                const res = await fetch("/api/words/page-words", {
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
        if (!confirm("هل أنت متأكد من حذف هذه الكلمة؟")) return;

        try {
            const { error: deleteError } = await supabase
                .from("page_words")
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
            language_code: "ar",
            word_id: "",
            page_id: "",
            word_text: "",
            word_position: 0,
            word_context: "",
        });
    };

    const openEditModal = (word: PageWord) => {
        setEditingWord(word);
        setFormData({
            language_code: word.language_code,
            word_id: word.word_id,
            page_id: word.page_id,
            word_text: word.word_text,
            word_position: word.word_position ?? 0,
            word_context: word.word_context || "",
        });
        setShowAddModal(true);
    };

    // توليد word_id تلقائي
    const generateWordId = () => {
        const pageWords = words.filter(w => w.page_id === formData.page_id);
        const maxNum = pageWords.reduce((max, w) => {
            const num = parseInt(w.word_id.replace('w', '')) || 0;
            return num > max ? num : max;
        }, 0);
        return `w${maxNum + 1}`;
    };

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900" dir="rtl">
            <div className="container mx-auto px-4 py-8">
                {/* Header */}
                <div className="flex items-center justify-between mb-8">
                    <div className="flex items-center gap-4">
                        <div className="p-3 rounded-xl bg-blue-100 dark:bg-blue-900/30">
                            <BookOpen className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                        </div>
                        <div>
                            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                                كلمات الصفحات
                            </h1>
                            <p className="text-gray-500 text-sm">
                                النظام الأول - إدارة الكلمات المعروضة في صفحات الموقع
                            </p>
                        </div>
                    </div>

                    <button
                        onClick={() => {
                            resetForm();
                            setEditingWord(null);
                            setShowAddModal(true);
                        }}
                        className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                    >
                        <Plus className="h-5 w-5" />
                        إضافة كلمة
                    </button>
                </div>

                {/* Warning Banner */}
                <div className="mb-6 p-4 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
                    <p className="text-yellow-800 dark:text-yellow-200 text-sm">
                        ⚠️ <strong>ملاحظة:</strong> هذا النظام منفصل تماماً عن "بنك الكلمات".
                        الكلمات هنا تُعرض في صفحات الموقع ويمكن للمستخدم تعليمها.
                    </p>
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
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    className="w-full pr-10 pl-4 py-2 border border-gray-200 dark:border-gray-700 rounded-lg bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white"
                                />
                            </div>
                        </div>

                        {/* Language Filter */}
                        <div className="relative min-w-[150px]">
                            <Globe className="absolute right-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400 pointer-events-none" />
                            <select
                                value={selectedLanguage}
                                onChange={(e) => setSelectedLanguage(e.target.value)}
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

                        {/* Page Filter */}
                        <div className="relative min-w-[200px]">
                            <FileText className="absolute right-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400 pointer-events-none" />
                            <select
                                value={selectedPage}
                                onChange={(e) => setSelectedPage(e.target.value)}
                                className="w-full pr-10 pl-8 py-2 border border-gray-200 dark:border-gray-700 rounded-lg bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white appearance-none"
                            >
                                <option value="all">كل الصفحات</option>
                                {uniquePages.map((page) => (
                                    <option key={page} value={page}>
                                        {page}
                                    </option>
                                ))}
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

                {/* Words Table */}
                <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm overflow-hidden">
                    {isLoading ? (
                        <div className="p-8 text-center text-gray-500">جاري التحميل...</div>
                    ) : words.length === 0 ? (
                        <div className="p-8 text-center text-gray-500">
                            لا توجد كلمات. أضف كلمات جديدة للبدء.
                        </div>
                    ) : (
                        <table className="w-full">
                            <thead className="bg-gray-50 dark:bg-gray-900/50">
                                <tr>
                                    <th className="px-4 py-3 text-right text-sm font-medium text-gray-500">
                                        <GripVertical className="h-4 w-4 inline ml-2" />
                                        الترتيب
                                    </th>
                                    <th className="px-4 py-3 text-right text-sm font-medium text-gray-500">
                                        الكلمة
                                    </th>
                                    <th className="px-4 py-3 text-right text-sm font-medium text-gray-500">
                                        اللغة
                                    </th>
                                    <th className="px-4 py-3 text-right text-sm font-medium text-gray-500">
                                        الصفحة
                                    </th>
                                    <th className="px-4 py-3 text-right text-sm font-medium text-gray-500">
                                        السياق
                                    </th>
                                    <th className="px-4 py-3 text-center text-sm font-medium text-gray-500">
                                        إجراءات
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                                {words.map((word) => {
                                    const lang = languages.find(
                                        (l) => l.code === word.language_code
                                    );
                                    return (
                                        <motion.tr
                                            key={word.id}
                                            initial={{ opacity: 0 }}
                                            animate={{ opacity: 1 }}
                                            className="hover:bg-gray-50 dark:hover:bg-gray-900/30"
                                        >
                                            <td className="px-4 py-3 text-gray-500">
                                                {word.word_position}
                                            </td>
                                            <td className="px-4 py-3 font-medium text-gray-900 dark:text-white">
                                                {word.word_text}
                                            </td>
                                            <td className="px-4 py-3">
                                                <span className="inline-flex items-center gap-1 px-2 py-1 bg-gray-100 dark:bg-gray-700 rounded text-sm">
                                                    {lang?.flag_emoji} {lang?.name_ar || word.language_code}
                                                </span>
                                            </td>
                                            <td className="px-4 py-3 text-gray-600 dark:text-gray-400 text-sm font-mono">
                                                <div>
                                                    <span className="text-gray-900 dark:text-white">{word.page_id}</span>
                                                    <span className="text-xs text-gray-400 mr-2">({word.word_id})</span>
                                                </div>
                                            </td>
                                            <td className="px-4 py-3 text-gray-500 text-sm max-w-[200px] truncate">
                                                {word.word_context || "-"}
                                            </td>
                                            <td className="px-4 py-3">
                                                <div className="flex items-center justify-center gap-2">
                                                    <button
                                                        onClick={() => openEditModal(word)}
                                                        className="p-2 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded-lg transition-colors"
                                                    >
                                                        <Edit2 className="h-4 w-4" />
                                                    </button>
                                                    <button
                                                        onClick={() => handleDelete(word.id)}
                                                        className="p-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-lg transition-colors"
                                                    >
                                                        <Trash2 className="h-4 w-4" />
                                                    </button>
                                                </div>
                                            </td>
                                        </motion.tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    )}
                </div>

                {/* Stats */}
                <div className="mt-4 text-sm text-gray-500">
                    إجمالي: {words.length} كلمة
                </div>
            </div>

            {/* Add/Edit Modal */}
            {showAddModal && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="bg-white dark:bg-gray-800 rounded-2xl w-full max-w-md shadow-xl"
                    >
                        <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
                            <h2 className="text-lg font-bold text-gray-900 dark:text-white">
                                {editingWord ? "تعديل كلمة" : "إضافة كلمة جديدة"}
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

                        <form onSubmit={handleSubmit} className="p-4 space-y-4">
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

                            {/* Word */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                    الكلمة
                                </label>
                                <input
                                    type="text"
                                    value={formData.word_text}
                                    onChange={(e) =>
                                        setFormData({ ...formData, word_text: e.target.value })
                                    }
                                    required
                                    className="w-full px-4 py-2 border border-gray-200 dark:border-gray-700 rounded-lg bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white"
                                    placeholder="أدخل الكلمة"
                                />
                            </div>

                            {/* Page ID */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                    معرّف الصفحة (page_id)
                                </label>
                                <input
                                    type="text"
                                    value={formData.page_id}
                                    onChange={(e) =>
                                        setFormData({ ...formData, page_id: e.target.value })
                                    }
                                    required
                                    disabled={!!editingWord}
                                    className="w-full px-4 py-2 border border-gray-200 dark:border-gray-700 rounded-lg bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white font-mono text-sm disabled:opacity-50"
                                    placeholder="lesson-1, p101..."
                                    dir="ltr"
                                />
                                <p className="text-xs text-gray-500 mt-1">معرّف ثابت للصفحة يُستخدم في JSON التعليم</p>
                            </div>

                            {/* Word ID */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                    معرّف الكلمة (word_id)
                                </label>
                                <div className="flex gap-2">
                                    <input
                                        type="text"
                                        value={formData.word_id}
                                        onChange={(e) =>
                                            setFormData({ ...formData, word_id: e.target.value })
                                        }
                                        required
                                        disabled={!!editingWord}
                                        className="flex-1 px-4 py-2 border border-gray-200 dark:border-gray-700 rounded-lg bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white font-mono text-sm disabled:opacity-50"
                                        placeholder="w1, w2..."
                                        dir="ltr"
                                    />
                                    {!editingWord && formData.page_id && (
                                        <button
                                            type="button"
                                            onClick={() => setFormData({ ...formData, word_id: generateWordId() })}
                                            className="px-3 py-2 text-sm bg-gray-100 dark:bg-gray-700 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600"
                                        >
                                            توليد
                                        </button>
                                    )}
                                </div>
                                <p className="text-xs text-gray-500 mt-1">معرّف فريد للكلمة داخل الصفحة</p>
                            </div>

                            {/* Position */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                    الترتيب
                                </label>
                                <input
                                    type="number"
                                    value={formData.word_position}
                                    onChange={(e) =>
                                        setFormData({
                                            ...formData,
                                            word_position: parseInt(e.target.value) || 0,
                                        })
                                    }
                                    className="w-full px-4 py-2 border border-gray-200 dark:border-gray-700 rounded-lg bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white"
                                    min={0}
                                />
                            </div>

                            {/* Context */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                    السياق (اختياري)
                                </label>
                                <textarea
                                    value={formData.word_context}
                                    onChange={(e) =>
                                        setFormData({ ...formData, word_context: e.target.value })
                                    }
                                    rows={2}
                                    className="w-full px-4 py-2 border border-gray-200 dark:border-gray-700 rounded-lg bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white resize-none"
                                    placeholder="جملة أو سياق يوضح استخدام الكلمة"
                                />
                            </div>

                            {/* Actions */}
                            <div className="flex gap-3 pt-4">
                                <button
                                    type="submit"
                                    className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                                >
                                    <Save className="h-5 w-5" />
                                    {editingWord ? "حفظ التغييرات" : "إضافة"}
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
