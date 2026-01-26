"use client";

/**
 * Admin: Languages Management
 * إدارة اللغات المدعومة - مشترك بين النظامين
 */

import { useState, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import {
    Globe,
    Plus,
    Save,
    X,
    Edit2,
    Trash2,
    Volume2,
    ArrowUpDown,
    Check,
    AlertCircle,
} from "lucide-react";
import { supabase } from "@/lib/supabase";

interface SupportedLanguage {
    code: string;
    name_en: string;
    name_native: string;
    name_ar?: string | null;
    text_direction: "ltr" | "rtl" | string;
    is_active: boolean | null;
    tts_voice_id?: string | null;
    tts_locale?: string | null;
    flag_emoji?: string | null;
    sort_order: number | null;
    created_at?: string | null;
    updated_at?: string | null;
}

export default function LanguagesAdminPage() {
    const [languages, setLanguages] = useState<SupportedLanguage[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");

    // Modal
    const [showModal, setShowModal] = useState(false);
    const [editingLang, setEditingLang] = useState<SupportedLanguage | null>(null);

    // Form
    const [formData, setFormData] = useState<Partial<SupportedLanguage>>({
        code: "",
        name_en: "",
        name_native: "",
        name_ar: "",
        text_direction: "ltr",
        is_active: true,
        tts_locale: "",
        flag_emoji: "",
        sort_order: 0,
    });

    // جلب اللغات
    const fetchLanguages = useCallback(async () => {
        setIsLoading(true);
        try {
            const { data, error: fetchError } = await supabase
                .from("supported_languages")
                .select("*")
                .order("sort_order");

            if (fetchError) throw fetchError;
            setLanguages(data || []);
        } catch (err) {
            console.error("Error fetching languages:", err);
            if (err && typeof err === 'object') {
                console.error("Error details:", JSON.stringify(err, null, 2));
            }
            const message = (err as any)?.message || "فشل في جلب اللغات";
            setError(message);
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchLanguages();
    }, [fetchLanguages]);

    // فتح Modal للإضافة
    const openAddModal = () => {
        setEditingLang(null);
        setFormData({
            code: "",
            name_en: "",
            name_native: "",
            name_ar: "",
            text_direction: "ltr",
            is_active: true,
            tts_locale: "",
            flag_emoji: "",
            sort_order: languages.length + 1,
        });
        setShowModal(true);
    };

    // فتح Modal للتعديل
    const openEditModal = (lang: SupportedLanguage) => {
        setEditingLang(lang);
        setFormData(lang);
        setShowModal(true);
    };

    // حفظ اللغة
    const handleSave = async () => {
        setError("");
        setSuccess("");

        if (!formData.code || !formData.name_en || !formData.name_native) {
            setError("الكود واسم اللغة مطلوبان");
            return;
        }

        try {
            if (editingLang) {
                // تعديل
                const { error: updateError } = await supabase
                    .from("supported_languages")
                    .update({
                        name_en: formData.name_en,
                        name_native: formData.name_native,
                        name_ar: formData.name_ar,
                        text_direction: formData.text_direction,
                        is_active: formData.is_active,
                        tts_locale: formData.tts_locale,
                        flag_emoji: formData.flag_emoji,
                        sort_order: formData.sort_order,
                    })
                    .eq("code", editingLang.code);

                if (updateError) throw updateError;
                setSuccess("تم تحديث اللغة بنجاح");
            } else {
                // إضافة جديدة
                const { error: insertError } = await supabase
                    .from("supported_languages")
                    .insert({
                        code: formData.code,
                        name_en: formData.name_en,
                        name_native: formData.name_native,
                        name_ar: formData.name_ar,
                        text_direction: formData.text_direction,
                        is_active: formData.is_active,
                        tts_locale: formData.tts_locale || `${formData.code}-${formData.code?.toUpperCase()}`,
                        flag_emoji: formData.flag_emoji,
                        sort_order: formData.sort_order,
                    });

                if (insertError) throw insertError;
                setSuccess("تم إضافة اللغة بنجاح");
            }

            setShowModal(false);
            fetchLanguages();
        } catch (err: unknown) {
            const errorMessage = err instanceof Error ? err.message : "حدث خطأ";
            setError(errorMessage);
        }
    };

    // حذف لغة
    const handleDelete = async (code: string) => {
        if (!confirm("هل أنت متأكد من حذف هذه اللغة؟ سيتم حذف جميع الكلمات المرتبطة بها.")) {
            return;
        }

        try {
            const { error: deleteError } = await supabase
                .from("supported_languages")
                .delete()
                .eq("code", code);

            if (deleteError) throw deleteError;
            setSuccess("تم حذف اللغة بنجاح");
            fetchLanguages();
        } catch (err) {
            console.error("Error deleting:", err);
            setError("فشل في حذف اللغة");
        }
    };

    // Toggle تفعيل اللغة
    const toggleActive = async (lang: SupportedLanguage) => {
        try {
            const { error: updateError } = await supabase
                .from("supported_languages")
                .update({ is_active: !lang.is_active })
                .eq("code", lang.code);

            if (updateError) throw updateError;
            fetchLanguages();
        } catch (err) {
            console.error("Error toggling:", err);
            setError("فشل في تحديث الحالة");
        }
    };

    // اختبار النطق
    const testTTS = (lang: SupportedLanguage) => {
        if ("speechSynthesis" in window) {
            const text = lang.text_direction === "rtl" ? "مرحباً بك" : "Hello, how are you?";
            const utterance = new SpeechSynthesisUtterance(text);
            utterance.lang = lang.tts_locale || lang.code;
            speechSynthesis.speak(utterance);
        }
    };

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900" dir="rtl">
            <div className="container mx-auto px-4 py-8">
                {/* Header */}
                <div className="flex items-center justify-between mb-8">
                    <div className="flex items-center gap-4">
                        <div className="p-3 rounded-xl bg-blue-100 dark:bg-blue-900/30">
                            <Globe className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                        </div>
                        <div>
                            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                                إدارة اللغات
                            </h1>
                            <p className="text-gray-500 text-sm">
                                إعدادات اللغات المدعومة للنظامين
                            </p>
                        </div>
                    </div>

                    <button
                        onClick={openAddModal}
                        className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                    >
                        <Plus className="h-5 w-5" />
                        إضافة لغة
                    </button>
                </div>

                {/* Messages */}
                {error && (
                    <div className="mb-4 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg flex items-center gap-2 text-red-600 dark:text-red-400">
                        <AlertCircle className="h-5 w-5" />
                        {error}
                    </div>
                )}

                {success && (
                    <div className="mb-4 p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg flex items-center gap-2 text-green-600 dark:text-green-400">
                        <Check className="h-5 w-5" />
                        {success}
                    </div>
                )}

                {/* Languages Table */}
                <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm overflow-hidden">
                    {isLoading ? (
                        <div className="p-8 text-center text-gray-500">جاري التحميل...</div>
                    ) : languages.length === 0 ? (
                        <div className="p-8 text-center text-gray-500">
                            لا توجد لغات. أضف لغات جديدة للبدء.
                        </div>
                    ) : (
                        <table className="w-full">
                            <thead className="bg-gray-50 dark:bg-gray-900/50">
                                <tr>
                                    <th className="px-4 py-3 text-right text-sm font-medium text-gray-500">
                                        <ArrowUpDown className="h-4 w-4 inline ml-1" />
                                        الترتيب
                                    </th>
                                    <th className="px-4 py-3 text-right text-sm font-medium text-gray-500">
                                        اللغة
                                    </th>
                                    <th className="px-4 py-3 text-right text-sm font-medium text-gray-500">
                                        الكود
                                    </th>
                                    <th className="px-4 py-3 text-right text-sm font-medium text-gray-500">
                                        الاتجاه
                                    </th>
                                    <th className="px-4 py-3 text-right text-sm font-medium text-gray-500">
                                        TTS Locale
                                    </th>
                                    <th className="px-4 py-3 text-right text-sm font-medium text-gray-500">
                                        الحالة
                                    </th>
                                    <th className="px-4 py-3 text-right text-sm font-medium text-gray-500">
                                        إجراءات
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                                {languages.map((lang) => (
                                    <motion.tr
                                        key={lang.code}
                                        initial={{ opacity: 0 }}
                                        animate={{ opacity: 1 }}
                                        className="hover:bg-gray-50 dark:hover:bg-gray-700/50"
                                    >
                                        <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-400">
                                            {lang.sort_order}
                                        </td>
                                        <td className="px-4 py-3">
                                            <div className="flex items-center gap-2">
                                                <span className="text-xl">{lang.flag_emoji}</span>
                                                <div>
                                                    <p className="font-medium text-gray-900 dark:text-white">
                                                        {lang.name_native}
                                                    </p>
                                                    <p className="text-sm text-gray-500">
                                                        {lang.name_ar || lang.name_en}
                                                    </p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-4 py-3">
                                            <code className="px-2 py-1 bg-gray-100 dark:bg-gray-700 rounded text-sm">
                                                {lang.code}
                                            </code>
                                        </td>
                                        <td className="px-4 py-3 text-sm">
                                            <span
                                                className={`px-2 py-1 rounded ${lang.text_direction === "rtl"
                                                        ? "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400"
                                                        : "bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300"
                                                    }`}
                                            >
                                                {lang.text_direction.toUpperCase()}
                                            </span>
                                        </td>
                                        <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-400">
                                            {lang.tts_locale || "-"}
                                        </td>
                                        <td className="px-4 py-3">
                                            <button
                                                onClick={() => toggleActive(lang)}
                                                className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${lang.is_active
                                                        ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
                                                        : "bg-gray-100 text-gray-500 dark:bg-gray-700 dark:text-gray-400"
                                                    }`}
                                            >
                                                {lang.is_active ? "مفعّل" : "معطّل"}
                                            </button>
                                        </td>
                                        <td className="px-4 py-3">
                                            <div className="flex items-center gap-1">
                                                <button
                                                    onClick={() => testTTS(lang)}
                                                    className="p-2 text-gray-500 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded-lg transition-colors"
                                                    title="اختبار النطق"
                                                >
                                                    <Volume2 className="h-4 w-4" />
                                                </button>
                                                <button
                                                    onClick={() => openEditModal(lang)}
                                                    className="p-2 text-gray-500 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded-lg transition-colors"
                                                    title="تعديل"
                                                >
                                                    <Edit2 className="h-4 w-4" />
                                                </button>
                                                <button
                                                    onClick={() => handleDelete(lang.code)}
                                                    className="p-2 text-gray-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-lg transition-colors"
                                                    title="حذف"
                                                >
                                                    <Trash2 className="h-4 w-4" />
                                                </button>
                                            </div>
                                        </td>
                                    </motion.tr>
                                ))}
                            </tbody>
                        </table>
                    )}
                </div>

                {/* Info Box */}
                <div className="mt-6 p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
                    <h3 className="font-medium text-blue-800 dark:text-blue-200 mb-2">
                        ملاحظات مهمة
                    </h3>
                    <ul className="text-sm text-blue-700 dark:text-blue-300 space-y-1">
                        <li>• اللغات هنا مشتركة بين النظام الأول (كلمات الصفحات) والنظام الثاني (بنك الكلمات)</li>
                        <li>• TTS Locale هو كود اللغة للنطق (مثل: ar-SA, en-US, fr-FR)</li>
                        <li>• تعطيل لغة يعني إخفاء الكلمات المرتبطة بها عن المستخدمين</li>
                    </ul>
                </div>
            </div>

            {/* Add/Edit Modal */}
            {showModal && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="bg-white dark:bg-gray-800 rounded-2xl w-full max-w-md shadow-xl"
                    >
                        <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
                            <h2 className="text-lg font-bold text-gray-900 dark:text-white">
                                {editingLang ? "تعديل لغة" : "إضافة لغة جديدة"}
                            </h2>
                            <button
                                onClick={() => setShowModal(false)}
                                className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"
                            >
                                <X className="h-5 w-5" />
                            </button>
                        </div>

                        <div className="p-4 space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                {/* Code */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                        الكود *
                                    </label>
                                    <input
                                        type="text"
                                        value={formData.code || ""}
                                        onChange={(e) =>
                                            setFormData({ ...formData, code: e.target.value.toLowerCase() })
                                        }
                                        disabled={!!editingLang}
                                        placeholder="en, ar, fr..."
                                        maxLength={10}
                                        className="w-full px-3 py-2 border border-gray-200 dark:border-gray-700 rounded-lg bg-gray-50 dark:bg-gray-900 disabled:opacity-50"
                                        dir="ltr"
                                    />
                                </div>

                                {/* Flag */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                        العلم (Emoji)
                                    </label>
                                    <input
                                        type="text"
                                        value={formData.flag_emoji || ""}
                                        onChange={(e) =>
                                            setFormData({ ...formData, flag_emoji: e.target.value })
                                        }
                                        placeholder="🇺🇸"
                                        className="w-full px-3 py-2 border border-gray-200 dark:border-gray-700 rounded-lg bg-gray-50 dark:bg-gray-900 text-center text-xl"
                                    />
                                </div>
                            </div>

                            {/* Name English */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                    الاسم بالإنجليزية *
                                </label>
                                <input
                                    type="text"
                                    value={formData.name_en || ""}
                                    onChange={(e) =>
                                        setFormData({ ...formData, name_en: e.target.value })
                                    }
                                    placeholder="English"
                                    className="w-full px-3 py-2 border border-gray-200 dark:border-gray-700 rounded-lg bg-gray-50 dark:bg-gray-900"
                                    dir="ltr"
                                />
                            </div>

                            {/* Name Native */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                    الاسم باللغة الأصلية *
                                </label>
                                <input
                                    type="text"
                                    value={formData.name_native || ""}
                                    onChange={(e) =>
                                        setFormData({ ...formData, name_native: e.target.value })
                                    }
                                    placeholder="العربية, Français..."
                                    className="w-full px-3 py-2 border border-gray-200 dark:border-gray-700 rounded-lg bg-gray-50 dark:bg-gray-900"
                                />
                            </div>

                            {/* Name Arabic */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                    الاسم بالعربية
                                </label>
                                <input
                                    type="text"
                                    value={formData.name_ar || ""}
                                    onChange={(e) =>
                                        setFormData({ ...formData, name_ar: e.target.value })
                                    }
                                    placeholder="الإنجليزية, الفرنسية..."
                                    className="w-full px-3 py-2 border border-gray-200 dark:border-gray-700 rounded-lg bg-gray-50 dark:bg-gray-900"
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                {/* Direction */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                        اتجاه الكتابة
                                    </label>
                                    <select
                                        value={formData.text_direction || "ltr"}
                                        onChange={(e) =>
                                            setFormData({
                                                ...formData,
                                                text_direction: e.target.value as "ltr" | "rtl",
                                            })
                                        }
                                        className="w-full px-3 py-2 border border-gray-200 dark:border-gray-700 rounded-lg bg-gray-50 dark:bg-gray-900"
                                    >
                                        <option value="ltr">LTR (يسار لليمين)</option>
                                        <option value="rtl">RTL (يمين لليسار)</option>
                                    </select>
                                </div>

                                {/* Sort Order */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                        ترتيب الظهور
                                    </label>
                                    <input
                                        type="number"
                                        value={formData.sort_order || 0}
                                        onChange={(e) =>
                                            setFormData({
                                                ...formData,
                                                sort_order: parseInt(e.target.value) || 0,
                                            })
                                        }
                                        min={0}
                                        className="w-full px-3 py-2 border border-gray-200 dark:border-gray-700 rounded-lg bg-gray-50 dark:bg-gray-900"
                                    />
                                </div>
                            </div>

                            {/* TTS Locale */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                    TTS Locale (للنطق)
                                </label>
                                <input
                                    type="text"
                                    value={formData.tts_locale || ""}
                                    onChange={(e) =>
                                        setFormData({ ...formData, tts_locale: e.target.value })
                                    }
                                    placeholder="ar-SA, en-US, fr-FR..."
                                    className="w-full px-3 py-2 border border-gray-200 dark:border-gray-700 rounded-lg bg-gray-50 dark:bg-gray-900"
                                    dir="ltr"
                                />
                            </div>

                            {/* Active */}
                            <div className="flex items-center gap-3">
                                <input
                                    type="checkbox"
                                    id="is_active"
                                    checked={formData.is_active ?? true}
                                    onChange={(e) =>
                                        setFormData({ ...formData, is_active: e.target.checked })
                                    }
                                    className="w-4 h-4 rounded border-gray-300"
                                />
                                <label
                                    htmlFor="is_active"
                                    className="text-sm text-gray-700 dark:text-gray-300"
                                >
                                    اللغة مفعّلة
                                </label>
                            </div>
                        </div>

                        {/* Actions */}
                        <div className="flex gap-3 p-4 border-t border-gray-200 dark:border-gray-700">
                            <button
                                onClick={handleSave}
                                className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                            >
                                <Save className="h-5 w-5" />
                                حفظ
                            </button>
                            <button
                                onClick={() => setShowModal(false)}
                                className="px-4 py-2 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                            >
                                إلغاء
                            </button>
                        </div>
                    </motion.div>
                </div>
            )}
        </div>
    );
}
