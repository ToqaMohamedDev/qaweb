"use client";

// =============================================
// Admin Dictionary Management - إدارة القاموس
// =============================================

import { useState, useEffect, useCallback, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
    BookOpen,
    Search,
    Plus,
    Edit2,
    Trash2,
    Loader2,
    AlertCircle,
    X,
    Save,
    ChevronLeft,
    ChevronRight,
    Languages,
    Tag,
} from "lucide-react";
import { supabase } from "@/lib/supabase";
import { DeleteConfirmModal } from "@/components/admin";
import {
    AdminPageHeader,
    AdminStatsGrid,
    FormField,
} from "@/components/admin/shared";
import { useUIStore } from "@/lib/stores";
import type { StatItem } from "@/components/admin/shared";

// ═══════════════════════════════════════════════════════════════════════════
// Types
// ═══════════════════════════════════════════════════════════════════════════

interface DictionaryWord {
    concept_id: string;
    word_family_root: string;
    definition: string | null;
    part_of_speech: string | null;
    domains: string[] | null;
    lexical_entries: Record<string, { lemma: string; examples?: string[] }> | null;
    relations: Record<string, string[]> | null;
    created_at: string | null;
    updated_at: string | null;
}

interface WordFormData {
    concept_id: string;
    word_family_root: string;
    definition: string;
    part_of_speech: string;
    lemma_ar: string;
    lemma_en: string;
    examples_ar: string;
    examples_en: string;
    domains: string;
}

const INITIAL_FORM_DATA: WordFormData = {
    concept_id: "",
    word_family_root: "",
    definition: "",
    part_of_speech: "",
    lemma_ar: "",
    lemma_en: "",
    examples_ar: "",
    examples_en: "",
    domains: "",
};

const PART_OF_SPEECH_OPTIONS = [
    { value: "noun", label: "اسم (Noun)" },
    { value: "verb", label: "فعل (Verb)" },
    { value: "adjective", label: "صفة (Adjective)" },
    { value: "adverb", label: "ظرف (Adverb)" },
    { value: "preposition", label: "حرف جر (Preposition)" },
    { value: "conjunction", label: "حرف عطف (Conjunction)" },
    { value: "pronoun", label: "ضمير (Pronoun)" },
    { value: "interjection", label: "تعجب (Interjection)" },
];

const ITEMS_PER_PAGE = 20;

// ═══════════════════════════════════════════════════════════════════════════
// Main Component
// ═══════════════════════════════════════════════════════════════════════════

export default function AdminWordsPage() {
    const { addToast } = useUIStore();

    // Data state
    const [words, setWords] = useState<DictionaryWord[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [totalCount, setTotalCount] = useState(0);

    // Filters
    const [search, setSearch] = useState("");
    const [page, setPage] = useState(1);

    // Modal state
    const [showModal, setShowModal] = useState(false);
    const [selectedWord, setSelectedWord] = useState<DictionaryWord | null>(null);
    const [formData, setFormData] = useState<WordFormData>(INITIAL_FORM_DATA);
    const [isSaving, setIsSaving] = useState(false);

    // Delete modal
    const [deleteModal, setDeleteModal] = useState<{
        isOpen: boolean;
        conceptId: string | null;
        wordName: string;
    }>({ isOpen: false, conceptId: null, wordName: "" });
    const [isDeleting, setIsDeleting] = useState(false);

    // ═══════════════════════════════════════════════════════════════════════
    // Fetch Data
    // ═══════════════════════════════════════════════════════════════════════

    const fetchWords = useCallback(async () => {
        setIsLoading(true);
        setError(null);

        try {
            let query = supabase
                .from("dictionary")
                .select("*", { count: "exact" })
                .order("created_at", { ascending: false })
                .range((page - 1) * ITEMS_PER_PAGE, page * ITEMS_PER_PAGE - 1);

            if (search.trim()) {
                query = query.or(`word_family_root.ilike.%${search}%,definition.ilike.%${search}%`);
            }

            const { data, error: fetchError, count } = await query;

            if (fetchError) throw fetchError;

            setWords((data as any) || []);
            setTotalCount(count || 0);
        } catch (err) {
            console.error("Error fetching words:", err);
            setError(err instanceof Error ? err.message : "حدث خطأ في جلب البيانات");
        } finally {
            setIsLoading(false);
        }
    }, [page, search]);

    useEffect(() => {
        fetchWords();
    }, [fetchWords]);

    // ═══════════════════════════════════════════════════════════════════════
    // Stats
    // ═══════════════════════════════════════════════════════════════════════

    const stats: StatItem[] = useMemo(() => [
        {
            label: "إجمالي الكلمات",
            value: totalCount,
            icon: BookOpen,
            color: "from-blue-500 to-blue-600",
        },
        {
            label: "أسماء",
            value: words.filter(w => w.part_of_speech === "noun").length,
            icon: Tag,
            color: "from-green-500 to-green-600",
        },
        {
            label: "أفعال",
            value: words.filter(w => w.part_of_speech === "verb").length,
            icon: Tag,
            color: "from-purple-500 to-purple-600",
        },
        {
            label: "صفات",
            value: words.filter(w => w.part_of_speech === "adjective").length,
            icon: Tag,
            color: "from-amber-500 to-amber-600",
        },
    ], [words, totalCount]);

    // ═══════════════════════════════════════════════════════════════════════
    // Handlers
    // ═══════════════════════════════════════════════════════════════════════

    const handleAdd = () => {
        setSelectedWord(null);
        setFormData({
            ...INITIAL_FORM_DATA,
            concept_id: `word_${Date.now()}`,
        });
        setShowModal(true);
    };

    const handleEdit = (word: DictionaryWord) => {
        setSelectedWord(word);
        const entries = word.lexical_entries || {};
        setFormData({
            concept_id: word.concept_id,
            word_family_root: word.word_family_root,
            definition: word.definition || "",
            part_of_speech: word.part_of_speech || "",
            lemma_ar: entries.ar?.lemma || "",
            lemma_en: entries.en?.lemma || "",
            examples_ar: entries.ar?.examples?.join("\n") || "",
            examples_en: entries.en?.examples?.join("\n") || "",
            domains: Array.isArray(word.domains) ? word.domains.join(", ") : "",
        });
        setShowModal(true);
    };

    const handleSave = async () => {
        if (!formData.word_family_root.trim()) {
            addToast({ type: "error", message: "يرجى إدخال جذر الكلمة" });
            return;
        }

        setIsSaving(true);

        try {
            const lexicalEntries: Record<string, { lemma: string; examples?: string[] }> = {};

            if (formData.lemma_ar.trim()) {
                lexicalEntries.ar = {
                    lemma: formData.lemma_ar.trim(),
                    examples: formData.examples_ar.split("\n").filter(e => e.trim()),
                };
            }
            if (formData.lemma_en.trim()) {
                lexicalEntries.en = {
                    lemma: formData.lemma_en.trim(),
                    examples: formData.examples_en.split("\n").filter(e => e.trim()),
                };
            }

            const wordData = {
                concept_id: formData.concept_id,
                word_family_root: formData.word_family_root.trim(),
                definition: formData.definition.trim() || null,
                part_of_speech: formData.part_of_speech || null,
                lexical_entries: Object.keys(lexicalEntries).length > 0 ? lexicalEntries : null,
                domains: formData.domains.trim()
                    ? formData.domains.split(",").map(d => d.trim()).filter(Boolean)
                    : null,
                updated_at: new Date().toISOString(),
            };

            if (selectedWord) {
                // Update existing
                const { error: updateError } = await supabase
                    .from("dictionary")
                    .update(wordData)
                    .eq("concept_id", selectedWord.concept_id);

                if (updateError) throw updateError;
                addToast({ type: "success", message: "تم تحديث الكلمة بنجاح" });
            } else {
                // Insert new
                const { error: insertError } = await supabase
                    .from("dictionary")
                    .insert({
                        ...wordData,
                        created_at: new Date().toISOString(),
                    });

                if (insertError) throw insertError;
                addToast({ type: "success", message: "تم إضافة الكلمة بنجاح" });
            }

            setShowModal(false);
            fetchWords();
        } catch (err) {
            console.error("Error saving word:", err);
            addToast({ type: "error", message: err instanceof Error ? err.message : "حدث خطأ" });
        } finally {
            setIsSaving(false);
        }
    };

    const handleDelete = async () => {
        if (!deleteModal.conceptId) return;

        setIsDeleting(true);
        try {
            const { error: deleteError } = await supabase
                .from("dictionary")
                .delete()
                .eq("concept_id", deleteModal.conceptId);

            if (deleteError) throw deleteError;

            addToast({ type: "success", message: "تم حذف الكلمة بنجاح" });
            setDeleteModal({ isOpen: false, conceptId: null, wordName: "" });
            fetchWords();
        } catch (err) {
            console.error("Error deleting word:", err);
            addToast({ type: "error", message: err instanceof Error ? err.message : "حدث خطأ" });
        } finally {
            setIsDeleting(false);
        }
    };

    const totalPages = Math.ceil(totalCount / ITEMS_PER_PAGE);

    // ═══════════════════════════════════════════════════════════════════════
    // Render
    // ═══════════════════════════════════════════════════════════════════════

    if (isLoading && words.length === 0) {
        return (
            <div className="flex items-center justify-center h-96">
                <Loader2 className="h-8 w-8 animate-spin text-primary-500" />
            </div>
        );
    }

    if (error && words.length === 0) {
        return (
            <div className="bg-red-50 dark:bg-red-900/20 rounded-xl p-6 text-center">
                <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
                <p className="text-red-600 dark:text-red-400">{error}</p>
                <button
                    onClick={fetchWords}
                    className="mt-4 px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600"
                >
                    إعادة المحاولة
                </button>
            </div>
        );
    }

    return (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
            {/* Header */}
            <AdminPageHeader
                title="إدارة القاموس"
                subtitle="إضافة وتعديل وحذف الكلمات"
                count={totalCount}
                onRefresh={fetchWords}
                isLoading={isLoading}
            />

            {/* Stats */}
            <AdminStatsGrid stats={stats} columns={4} />

            {/* Toolbar */}
            <div className="bg-white dark:bg-[#1c1c24] rounded-2xl p-4 border border-gray-200/60 dark:border-gray-800 flex flex-col sm:flex-row gap-4">
                <div className="flex-1 relative">
                    <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                    <input
                        type="text"
                        placeholder="بحث بالكلمة أو التعريف..."
                        value={search}
                        onChange={(e) => {
                            setSearch(e.target.value);
                            setPage(1);
                        }}
                        className="w-full pr-10 pl-4 py-2.5 rounded-xl bg-gray-100 dark:bg-gray-800 border-none text-sm outline-none focus:ring-2 focus:ring-primary-500"
                    />
                </div>
                <button
                    onClick={handleAdd}
                    className="flex items-center gap-2 px-4 py-2.5 bg-primary-500 text-white rounded-xl hover:bg-primary-600 transition-colors"
                >
                    <Plus className="h-5 w-5" />
                    إضافة كلمة
                </button>
            </div>

            {/* Table */}
            <div className="bg-white dark:bg-[#1c1c24] rounded-2xl border border-gray-200/60 dark:border-gray-800 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead className="bg-gray-50 dark:bg-gray-800/50">
                            <tr>
                                <th className="px-5 py-4 text-right text-xs font-semibold text-gray-500 uppercase">
                                    الكلمة
                                </th>
                                <th className="px-5 py-4 text-right text-xs font-semibold text-gray-500 uppercase">
                                    التعريف
                                </th>
                                <th className="px-5 py-4 text-right text-xs font-semibold text-gray-500 uppercase">
                                    نوع الكلمة
                                </th>
                                <th className="px-5 py-4 text-right text-xs font-semibold text-gray-500 uppercase">
                                    اللغات
                                </th>
                                <th className="px-5 py-4"></th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200 dark:divide-gray-800">
                            {words.length === 0 ? (
                                <tr>
                                    <td colSpan={5} className="px-5 py-12 text-center text-gray-500">
                                        لا توجد كلمات
                                    </td>
                                </tr>
                            ) : (
                                words.map((word) => {
                                    const entries = word.lexical_entries || {};
                                    const languages = Object.keys(entries);

                                    return (
                                        <tr key={word.concept_id} className="hover:bg-gray-50 dark:hover:bg-gray-800/30">
                                            <td className="px-5 py-4">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center text-white font-bold">
                                                        {word.word_family_root?.charAt(0) || "?"}
                                                    </div>
                                                    <div>
                                                        <p className="text-sm font-medium text-gray-900 dark:text-white">
                                                            {word.word_family_root}
                                                        </p>
                                                        <p className="text-xs text-gray-500">{word.concept_id}</p>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-5 py-4 text-sm text-gray-600 dark:text-gray-400 max-w-xs truncate">
                                                {word.definition || "-"}
                                            </td>
                                            <td className="px-5 py-4">
                                                <span className="px-2 py-1 rounded-lg text-xs bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400">
                                                    {word.part_of_speech || "-"}
                                                </span>
                                            </td>
                                            <td className="px-5 py-4">
                                                <div className="flex gap-1">
                                                    {languages.map(lang => (
                                                        <span
                                                            key={lang}
                                                            className="px-2 py-1 rounded text-xs bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400"
                                                        >
                                                            {lang.toUpperCase()}
                                                        </span>
                                                    ))}
                                                </div>
                                            </td>
                                            <td className="px-5 py-4">
                                                <div className="flex gap-1">
                                                    <button
                                                        onClick={() => handleEdit(word)}
                                                        className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800"
                                                    >
                                                        <Edit2 className="h-4 w-4 text-gray-500" />
                                                    </button>
                                                    <button
                                                        onClick={() => setDeleteModal({
                                                            isOpen: true,
                                                            conceptId: word.concept_id,
                                                            wordName: word.word_family_root,
                                                        })}
                                                        className="p-2 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20"
                                                    >
                                                        <Trash2 className="h-4 w-4 text-red-500" />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Pagination */}
                {totalPages > 1 && (
                    <div className="flex items-center justify-between px-5 py-4 border-t border-gray-200 dark:border-gray-800">
                        <p className="text-sm text-gray-500">
                            صفحة {page} من {totalPages} ({totalCount} كلمة)
                        </p>
                        <div className="flex gap-2">
                            <button
                                onClick={() => setPage(Math.max(1, page - 1))}
                                disabled={page === 1}
                                className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 disabled:opacity-50"
                            >
                                <ChevronRight className="h-5 w-5" />
                            </button>
                            <button
                                onClick={() => setPage(Math.min(totalPages, page + 1))}
                                disabled={page === totalPages}
                                className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 disabled:opacity-50"
                            >
                                <ChevronLeft className="h-5 w-5" />
                            </button>
                        </div>
                    </div>
                )}
            </div>

            {/* Edit/Add Modal */}
            <AnimatePresence>
                {showModal && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
                        onClick={() => setShowModal(false)}
                    >
                        <motion.div
                            initial={{ scale: 0.95 }}
                            animate={{ scale: 1 }}
                            exit={{ scale: 0.95 }}
                            onClick={(e) => e.stopPropagation()}
                            className="bg-white dark:bg-[#1c1c24] rounded-2xl p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto"
                        >
                            {/* Header */}
                            <div className="flex justify-between items-center mb-6">
                                <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                                    {selectedWord ? "تعديل كلمة" : "إضافة كلمة جديدة"}
                                </h2>
                                <button
                                    onClick={() => setShowModal(false)}
                                    className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg"
                                >
                                    <X className="h-5 w-5" />
                                </button>
                            </div>

                            {/* Form */}
                            <div className="space-y-4">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <FormField
                                        label="جذر الكلمة"
                                        value={formData.word_family_root}
                                        onChange={(v) => setFormData(prev => ({ ...prev, word_family_root: v }))}
                                    />
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                            نوع الكلمة
                                        </label>
                                        <select
                                            value={formData.part_of_speech}
                                            onChange={(e) => setFormData(prev => ({ ...prev, part_of_speech: e.target.value }))}
                                            className="w-full px-4 py-2.5 rounded-xl bg-gray-100 dark:bg-gray-800 border-none text-sm outline-none"
                                        >
                                            <option value="">اختر نوع الكلمة</option>
                                            {PART_OF_SPEECH_OPTIONS.map(opt => (
                                                <option key={opt.value} value={opt.value}>{opt.label}</option>
                                            ))}
                                        </select>
                                    </div>
                                </div>

                                <FormField
                                    label="التعريف"
                                    value={formData.definition}
                                    onChange={(v) => setFormData(prev => ({ ...prev, definition: v }))}
                                    type="textarea"
                                    rows={2}
                                />

                                <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
                                    <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3 flex items-center gap-2">
                                        <Languages className="h-4 w-4" />
                                        المداخل اللغوية
                                    </h3>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div className="space-y-3">
                                            <FormField
                                                label="الكلمة بالعربية"
                                                value={formData.lemma_ar}
                                                onChange={(v) => setFormData(prev => ({ ...prev, lemma_ar: v }))}
                                            />
                                            <FormField
                                                label="أمثلة بالعربية (سطر لكل مثال)"
                                                value={formData.examples_ar}
                                                onChange={(v) => setFormData(prev => ({ ...prev, examples_ar: v }))}
                                                type="textarea"
                                                rows={3}
                                            />
                                        </div>
                                        <div className="space-y-3">
                                            <FormField
                                                label="الكلمة بالإنجليزية"
                                                value={formData.lemma_en}
                                                onChange={(v) => setFormData(prev => ({ ...prev, lemma_en: v }))}
                                            />
                                            <FormField
                                                label="أمثلة بالإنجليزية (سطر لكل مثال)"
                                                value={formData.examples_en}
                                                onChange={(v) => setFormData(prev => ({ ...prev, examples_en: v }))}
                                                type="textarea"
                                                rows={3}
                                            />
                                        </div>
                                    </div>
                                </div>

                                <FormField
                                    label="المجالات (مفصولة بفواصل)"
                                    value={formData.domains}
                                    onChange={(v) => setFormData(prev => ({ ...prev, domains: v }))}
                                    placeholder="مثال: علوم, طب, تقنية"
                                />
                            </div>

                            {/* Actions */}
                            <div className="flex gap-3 mt-6">
                                <button
                                    onClick={() => setShowModal(false)}
                                    className="flex-1 px-4 py-2.5 rounded-xl bg-gray-100 dark:bg-gray-800 font-medium hover:bg-gray-200 dark:hover:bg-gray-700"
                                >
                                    إلغاء
                                </button>
                                <button
                                    onClick={handleSave}
                                    disabled={isSaving}
                                    className="flex-1 px-4 py-2.5 rounded-xl bg-primary-500 text-white font-medium hover:bg-primary-600 disabled:opacity-50 flex items-center justify-center gap-2"
                                >
                                    {isSaving ? (
                                        <Loader2 className="h-5 w-5 animate-spin" />
                                    ) : (
                                        <Save className="h-5 w-5" />
                                    )}
                                    {selectedWord ? "تحديث" : "إضافة"}
                                </button>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Delete Confirmation Modal */}
            <DeleteConfirmModal
                isOpen={deleteModal.isOpen}
                title="حذف الكلمة"
                itemName={deleteModal.wordName}
                isDeleting={isDeleting}
                onConfirm={handleDelete}
                onCancel={() => setDeleteModal({ isOpen: false, conceptId: null, wordName: "" })}
            />
        </motion.div>
    );
}
