"use client";

import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Plus, Search, Pencil, Trash2, X, Save, BookOpen, Globe, Languages, Loader2, Eye } from "lucide-react";
import { GridSkeleton, StatsCardSkeleton } from "@/components/ui/Skeleton";
import { useUIStore } from "@/lib/stores";
import { DeleteConfirmModal } from "@/components/admin";
import { DISPLAY_LANGUAGES } from "@/lib/utils/words";

interface DictionaryWord {
    concept_id: string;
    definition: string | null;
    word_family_root: string | null;
    lexical_entries: Record<string, { lemma: string; pos?: string; phonetic?: string }> | null;
    created_at: string;
}

interface Pagination {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
}

// Animation variants
const containerVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.05 } }
};

const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { type: "spring" as const, stiffness: 300, damping: 24 } }
};

export default function DictionaryAdminPage() {
    const { addToast } = useUIStore();

    // State
    const [words, setWords] = useState<DictionaryWord[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState("");
    const [debouncedSearch, setDebouncedSearch] = useState("");
    const [selectedLanguage, setSelectedLanguage] = useState("en");
    const [pagination, setPagination] = useState<Pagination>({ page: 1, limit: 20, total: 0, totalPages: 0 });

    // Modal state
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [currentWord, setCurrentWord] = useState<Partial<DictionaryWord> | null>(null);
    const [isSaving, setIsSaving] = useState(false);
    const [deleteModal, setDeleteModal] = useState<{ isOpen: boolean; wordId: string | null; wordName: string }>({ isOpen: false, wordId: null, wordName: "" });
    const [isDeleting, setIsDeleting] = useState(false);

    // View modal
    const [viewModal, setViewModal] = useState<{ isOpen: boolean; word: DictionaryWord | null }>({ isOpen: false, word: null });

    // Form state for editing
    const [formData, setFormData] = useState({
        definition: "",
        word_family_root: "",
        entries: {} as Record<string, { lemma: string; pos: string; phonetic: string }>
    });

    // Debounce search
    useEffect(() => {
        const timer = setTimeout(() => {
            setDebouncedSearch(searchQuery);
            setPagination(prev => ({ ...prev, page: 1 }));
        }, 300);
        return () => clearTimeout(timer);
    }, [searchQuery]);

    // Fetch words
    const fetchWords = useCallback(async () => {
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
                setPagination(prev => ({
                    ...prev,
                    total: data.pagination.total,
                    totalPages: data.pagination.totalPages,
                }));
            }
        } catch (error) {
            console.error("Error fetching dictionary:", error);
            addToast({ type: 'error', message: 'فشل في تحميل الكلمات' });
        } finally {
            setIsLoading(false);
        }
    }, [pagination.page, pagination.limit, selectedLanguage, debouncedSearch, addToast]);

    useEffect(() => {
        fetchWords();
    }, [fetchWords]);

    // Get word lemma for display
    const getWordLemma = (word: DictionaryWord, lang: string = selectedLanguage) => {
        const entries = word.lexical_entries || {};
        return entries[lang]?.lemma || entries['en']?.lemma || word.concept_id;
    };

    // Open edit modal
    const openEditModal = (word: DictionaryWord) => {
        setCurrentWord(word);
        setFormData({
            definition: word.definition || "",
            word_family_root: word.word_family_root || "",
            entries: { ...word.lexical_entries } as Record<string, { lemma: string; pos: string; phonetic: string }>
        });
        setIsModalOpen(true);
    };

    // Open create modal
    const openCreateModal = () => {
        setCurrentWord({});
        setFormData({
            definition: "",
            word_family_root: "",
            entries: { en: { lemma: "", pos: "", phonetic: "" } }
        });
        setIsModalOpen(true);
    };

    // Handle save
    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSaving(true);

        try {
            const payload = {
                concept_id: currentWord?.concept_id,
                definition: formData.definition,
                word_family_root: formData.word_family_root,
                lexical_entries: formData.entries
            };

            const method = currentWord?.concept_id ? 'PUT' : 'POST';
            const res = await fetch('/api/admin/dictionary', {
                method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });

            const data = await res.json();

            if (data.success) {
                addToast({ type: 'success', message: currentWord?.concept_id ? 'تم تحديث الكلمة بنجاح' : 'تمت إضافة الكلمة بنجاح' });
                setIsModalOpen(false);
                fetchWords();
            } else {
                throw new Error(data.error || 'Failed to save');
            }
        } catch (error: any) {
            addToast({ type: 'error', message: error.message || 'حدث خطأ أثناء الحفظ' });
        } finally {
            setIsSaving(false);
        }
    };

    // Handle delete
    const handleDelete = async () => {
        if (!deleteModal.wordId) return;
        setIsDeleting(true);
        try {
            const res = await fetch(`/api/admin/dictionary?concept_id=${deleteModal.wordId}`, {
                method: 'DELETE'
            });
            const data = await res.json();

            if (data.success) {
                addToast({ type: 'success', message: 'تم حذف الكلمة بنجاح' });
                setDeleteModal({ isOpen: false, wordId: null, wordName: "" });
                fetchWords();
            } else {
                throw new Error(data.error || 'Failed to delete');
            }
        } catch (error: any) {
            addToast({ type: 'error', message: error.message || 'حدث خطأ أثناء الحذف' });
        } finally {
            setIsDeleting(false);
        }
    };

    const stats = [
        {
            label: "إجمالي الكلمات",
            value: pagination.total,
            icon: BookOpen,
            gradient: "from-purple-500 to-purple-600",
            bgGradient: "from-purple-50 to-purple-100 dark:from-purple-900/20 dark:to-purple-800/20"
        },
        {
            label: "اللغات المدعومة",
            value: DISPLAY_LANGUAGES.length,
            icon: Languages,
            gradient: "from-blue-500 to-blue-600",
            bgGradient: "from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20"
        },
        {
            label: "الصفحات",
            value: pagination.totalPages,
            icon: Globe,
            gradient: "from-emerald-500 to-emerald-600",
            bgGradient: "from-emerald-50 to-emerald-100 dark:from-emerald-900/20 dark:to-emerald-800/20"
        }
    ];

    return (
        <div className="space-y-8">
            {/* Header */}
            <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-purple-500 via-indigo-500 to-blue-500 p-8">
                <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGNpcmNsZSBjeD0iMzAiIGN5PSIzMCIgcj0iMyIgZmlsbD0id2hpdGUiIGZpbGwtb3BhY2l0eT0iMC4xIi8+PC9zdmc+')] opacity-60" />
                <div className="absolute -top-20 -right-20 w-60 h-60 bg-white/10 rounded-full blur-3xl" />
                <div className="absolute -bottom-20 -left-20 w-60 h-60 bg-white/10 rounded-full blur-3xl" />

                <div className="relative flex flex-col md:flex-row md:items-center md:justify-between gap-6">
                    <div className="flex items-center gap-4">
                        <div className="p-4 rounded-2xl bg-white/20 backdrop-blur-sm">
                            <BookOpen className="h-8 w-8 text-white" />
                        </div>
                        <div>
                            <h1 className="text-3xl font-bold text-white">القاموس</h1>
                            <p className="text-white/80 mt-1">إدارة كلمات القاموس متعدد اللغات</p>
                        </div>
                    </div>
                    <motion.button
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={openCreateModal}
                        className="flex items-center gap-2 px-6 py-3 rounded-xl bg-white text-purple-600 font-semibold shadow-lg shadow-black/10 hover:shadow-xl transition-all"
                    >
                        <Plus className="h-5 w-5" />
                        <span>إضافة كلمة جديدة</span>
                    </motion.button>
                </div>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {isLoading && words.length === 0 ? (
                    <>
                        <StatsCardSkeleton />
                        <StatsCardSkeleton />
                        <StatsCardSkeleton />
                    </>
                ) : (
                    stats.map((stat, index) => (
                        <motion.div
                            key={stat.label}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: index * 0.1 }}
                            className={`relative overflow-hidden rounded-2xl bg-gradient-to-br ${stat.bgGradient} p-5 border border-gray-200/50 dark:border-gray-700/50`}
                        >
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">{stat.label}</p>
                                    <p className="text-3xl font-bold text-gray-900 dark:text-white">{stat.value}</p>
                                </div>
                                <div className={`p-3 rounded-xl bg-gradient-to-br ${stat.gradient} shadow-lg`}>
                                    <stat.icon className="h-6 w-6 text-white" />
                                </div>
                            </div>
                        </motion.div>
                    ))
                )}
            </div>

            {/* Language Filter & Search */}
            <div className="space-y-4">
                {/* Language chips */}
                <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
                    {DISPLAY_LANGUAGES.map((lang) => (
                        <button
                            key={lang.code}
                            onClick={() => {
                                setSelectedLanguage(lang.code);
                                setPagination(prev => ({ ...prev, page: 1 }));
                            }}
                            className={`shrink-0 flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-all ${
                                selectedLanguage === lang.code
                                    ? "bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-lg shadow-purple-500/25"
                                    : "bg-white dark:bg-[#1c1c24] text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 border border-gray-200 dark:border-gray-700"
                            }`}
                        >
                            <span className="text-base">{lang.flag}</span>
                            <span>{lang.nameAr}</span>
                        </button>
                    ))}
                </div>

                {/* Search */}
                <div className="relative">
                    <Search className="absolute right-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                    <input
                        type="text"
                        placeholder="البحث في القاموس..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full pr-12 pl-12 py-4 rounded-2xl border-0 ring-1 ring-gray-200 dark:ring-gray-700 bg-white dark:bg-[#1c1c24] focus:ring-2 focus:ring-purple-500 transition-all text-gray-900 dark:text-white placeholder:text-gray-400 text-lg"
                    />
                    {searchQuery && (
                        <button onClick={() => setSearchQuery("")} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                            <X className="h-5 w-5" />
                        </button>
                    )}
                </div>
            </div>

            {/* Content */}
            {isLoading ? (
                <GridSkeleton count={12} type="card" />
            ) : words.length === 0 ? (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-col items-center justify-center py-20 text-center">
                    <div className="w-24 h-24 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center mb-6">
                        <BookOpen className="h-12 w-12 text-gray-400" />
                    </div>
                    <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
                        {searchQuery ? "لا توجد نتائج" : "لا توجد كلمات"}
                    </h3>
                    <p className="text-gray-500 mb-6">
                        {searchQuery ? `لم يتم العثور على كلمات تطابق "${searchQuery}"` : "لم تقم بإضافة أي كلمات بعد."}
                    </p>
                </motion.div>
            ) : (
                <>
                    <motion.div variants={containerVariants} initial="hidden" animate="visible" className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                        {words.map((word) => (
                            <motion.div
                                key={word.concept_id}
                                variants={itemVariants}
                                className="group relative bg-white dark:bg-[#1c1c24] rounded-2xl border border-gray-200/60 dark:border-gray-800 p-5 hover:shadow-lg transition-all duration-300"
                            >
                                <div className="flex items-start justify-between mb-3">
                                    <h3 className="font-bold text-lg text-gray-900 dark:text-white">
                                        {getWordLemma(word)}
                                    </h3>
                                    <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                        <button
                                            onClick={() => setViewModal({ isOpen: true, word })}
                                            className="p-2 rounded-lg bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
                                        >
                                            <Eye className="h-4 w-4 text-gray-600 dark:text-gray-400" />
                                        </button>
                                        <button
                                            onClick={() => openEditModal(word)}
                                            className="p-2 rounded-lg bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
                                        >
                                            <Pencil className="h-4 w-4 text-gray-600 dark:text-gray-400" />
                                        </button>
                                        <button
                                            onClick={() => setDeleteModal({ isOpen: true, wordId: word.concept_id, wordName: getWordLemma(word) })}
                                            className="p-2 rounded-lg bg-red-50 dark:bg-red-900/20 hover:bg-red-100 dark:hover:bg-red-900/40 transition-colors"
                                        >
                                            <Trash2 className="h-4 w-4 text-red-500" />
                                        </button>
                                    </div>
                                </div>
                                <p className="text-sm text-gray-500 dark:text-gray-400 line-clamp-2 mb-3">
                                    {word.definition || "لا يوجد تعريف"}
                                </p>
                                {word.word_family_root && (
                                    <span className="inline-block px-2 py-1 rounded-lg bg-purple-50 dark:bg-purple-900/20 text-purple-600 dark:text-purple-400 text-xs font-medium">
                                        {word.word_family_root}
                                    </span>
                                )}
                            </motion.div>
                        ))}
                    </motion.div>

                    {/* Pagination */}
                    {pagination.totalPages > 1 && (
                        <div className="flex items-center justify-center gap-2 mt-8">
                            <button
                                onClick={() => setPagination(p => ({ ...p, page: Math.max(1, p.page - 1) }))}
                                disabled={pagination.page === 1}
                                className="px-4 py-2 rounded-xl bg-white dark:bg-[#1c1c24] border border-gray-200 dark:border-gray-700 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                            >
                                السابق
                            </button>
                            <span className="px-4 py-2 text-gray-600 dark:text-gray-400">
                                {pagination.page} / {pagination.totalPages}
                            </span>
                            <button
                                onClick={() => setPagination(p => ({ ...p, page: Math.min(p.totalPages, p.page + 1) }))}
                                disabled={pagination.page === pagination.totalPages}
                                className="px-4 py-2 rounded-xl bg-white dark:bg-[#1c1c24] border border-gray-200 dark:border-gray-700 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                            >
                                التالي
                            </button>
                        </div>
                    )}
                </>
            )}

            {/* Create/Edit Modal */}
            <AnimatePresence>
                {isModalOpen && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm" onClick={() => setIsModalOpen(false)}>
                        <motion.div initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 20 }} onClick={e => e.stopPropagation()} className="w-full max-w-2xl max-h-[90vh] overflow-y-auto bg-white dark:bg-[#1c1c24] rounded-3xl shadow-2xl">
                            <div className="sticky top-0 z-10 bg-gradient-to-br from-purple-500 via-indigo-500 to-blue-500 px-6 py-8">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <div className="p-3 rounded-xl bg-white/20 backdrop-blur-sm"><BookOpen className="h-6 w-6 text-white" /></div>
                                        <div>
                                            <h3 className="font-bold text-xl text-white">{currentWord?.concept_id ? "تعديل الكلمة" : "إضافة كلمة جديدة"}</h3>
                                            <p className="text-white/70 text-sm">{currentWord?.concept_id ? "تعديل بيانات الكلمة" : "أضف كلمة جديدة للقاموس"}</p>
                                        </div>
                                    </div>
                                    <button onClick={() => setIsModalOpen(false)} className="p-2 rounded-xl bg-white/20 hover:bg-white/30 text-white"><X className="h-5 w-5" /></button>
                                </div>
                            </div>
                            <form onSubmit={handleSave} className="p-6 space-y-5">
                                <div>
                                    <label className="block text-sm font-semibold mb-2 text-gray-900 dark:text-white">التعريف</label>
                                    <textarea
                                        value={formData.definition}
                                        onChange={e => setFormData(prev => ({ ...prev, definition: e.target.value }))}
                                        rows={3}
                                        className="w-full px-4 py-3 rounded-xl bg-gray-50 dark:bg-gray-800 border-2 border-gray-200 dark:border-gray-700 focus:border-purple-500 outline-none resize-none text-gray-900 dark:text-white"
                                        placeholder="تعريف الكلمة..."
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-semibold mb-2 text-gray-900 dark:text-white">جذر الكلمة</label>
                                    <input
                                        type="text"
                                        value={formData.word_family_root}
                                        onChange={e => setFormData(prev => ({ ...prev, word_family_root: e.target.value }))}
                                        className="w-full px-4 py-3 rounded-xl bg-gray-50 dark:bg-gray-800 border-2 border-gray-200 dark:border-gray-700 focus:border-purple-500 outline-none text-gray-900 dark:text-white"
                                        placeholder="مثال: happy"
                                        dir="ltr"
                                    />
                                </div>

                                {/* Language entries */}
                                <div className="space-y-4">
                                    <label className="block text-sm font-semibold text-gray-900 dark:text-white">الترجمات</label>
                                    {DISPLAY_LANGUAGES.slice(0, 4).map(lang => (
                                        <div key={lang.code} className="p-4 rounded-xl bg-gray-50 dark:bg-gray-800 space-y-3">
                                            <div className="flex items-center gap-2 mb-2">
                                                <span className="text-lg">{lang.flag}</span>
                                                <span className="font-medium text-gray-700 dark:text-gray-300">{lang.nameAr}</span>
                                            </div>
                                            <input
                                                type="text"
                                                placeholder="الكلمة"
                                                value={formData.entries[lang.code]?.lemma || ""}
                                                onChange={e => setFormData(prev => ({
                                                    ...prev,
                                                    entries: {
                                                        ...prev.entries,
                                                        [lang.code]: { ...prev.entries[lang.code], lemma: e.target.value }
                                                    }
                                                }))}
                                                className="w-full px-3 py-2 rounded-lg bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 focus:border-purple-500 outline-none text-gray-900 dark:text-white text-sm"
                                                dir={lang.code === 'ar' ? 'rtl' : 'ltr'}
                                            />
                                        </div>
                                    ))}
                                </div>

                                <div className="flex items-center gap-3 pt-4">
                                    <button type="button" onClick={() => setIsModalOpen(false)} className="flex-1 px-4 py-3 rounded-xl bg-gray-100 dark:bg-gray-800 font-semibold hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-900 dark:text-white transition-colors">إلغاء</button>
                                    <button type="submit" disabled={isSaving} className="flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-purple-500 text-white font-semibold hover:bg-purple-600 disabled:opacity-50 transition-colors">
                                        {isSaving ? <Loader2 className="h-5 w-5 animate-spin" /> : <Save className="h-5 w-5" />}
                                        <span>{currentWord?.concept_id ? "حفظ التغييرات" : "إضافة الكلمة"}</span>
                                    </button>
                                </div>
                            </form>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* View Modal */}
            <AnimatePresence>
                {viewModal.isOpen && viewModal.word && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm" onClick={() => setViewModal({ isOpen: false, word: null })}>
                        <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} onClick={e => e.stopPropagation()} className="w-full max-w-lg bg-white dark:bg-[#1c1c24] rounded-3xl shadow-2xl overflow-hidden">
                            <div className="bg-gradient-to-br from-purple-500 via-indigo-500 to-blue-500 px-6 py-6">
                                <div className="flex items-center justify-between">
                                    <h3 className="font-bold text-xl text-white">{getWordLemma(viewModal.word)}</h3>
                                    <button onClick={() => setViewModal({ isOpen: false, word: null })} className="p-2 rounded-xl bg-white/20 hover:bg-white/30 text-white"><X className="h-5 w-5" /></button>
                                </div>
                            </div>
                            <div className="p-6 space-y-4">
                                <div>
                                    <label className="text-sm text-gray-500 dark:text-gray-400">التعريف</label>
                                    <p className="text-gray-900 dark:text-white mt-1">{viewModal.word.definition || "لا يوجد"}</p>
                                </div>
                                <div>
                                    <label className="text-sm text-gray-500 dark:text-gray-400">جذر الكلمة</label>
                                    <p className="text-gray-900 dark:text-white mt-1">{viewModal.word.word_family_root || "لا يوجد"}</p>
                                </div>
                                <div>
                                    <label className="text-sm text-gray-500 dark:text-gray-400 mb-2 block">الترجمات</label>
                                    <div className="space-y-2">
                                        {Object.entries(viewModal.word.lexical_entries || {}).map(([code, entry]) => {
                                            const lang = DISPLAY_LANGUAGES.find(l => l.code === code);
                                            return (
                                                <div key={code} className="flex items-center gap-2 p-2 rounded-lg bg-gray-50 dark:bg-gray-800">
                                                    <span>{lang?.flag || '🌐'}</span>
                                                    <span className="font-medium text-gray-900 dark:text-white">{entry.lemma}</span>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            <DeleteConfirmModal
                isOpen={deleteModal.isOpen}
                title="حذف الكلمة"
                itemName={deleteModal.wordName}
                isDeleting={isDeleting}
                onConfirm={handleDelete}
                onCancel={() => setDeleteModal({ isOpen: false, wordId: null, wordName: "" })}
            />
        </div>
    );
}
