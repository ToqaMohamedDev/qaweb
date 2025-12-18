"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Settings, Globe, Bell, Shield, Palette, Database, Mail, Save, Check, Loader2, AlertCircle, RefreshCw, Moon, Sun, Monitor, User } from "lucide-react";
import { createClient } from "@/lib/supabase";

interface SettingsData {
    general: { siteName: string; siteDescription: string; language: string; maintenanceMode: boolean };
    auth: { enableRegistration: boolean; enableGoogleAuth: boolean; requireEmailVerification: boolean; maxExamAttempts: number; sessionTimeout: number };
    email: { contactEmail: string; supportEmail: string };
    appearance: { theme: string; primaryColor: string };
}

const defaultSettings: SettingsData = {
    general: { siteName: "منصة التعليم", siteDescription: "منصة تعليمية متكاملة", language: "ar", maintenanceMode: false },
    auth: { enableRegistration: true, enableGoogleAuth: true, requireEmailVerification: false, maxExamAttempts: 3, sessionTimeout: 60 },
    email: { contactEmail: "contact@example.com", supportEmail: "support@example.com" },
    appearance: { theme: "system", primaryColor: "#8B5CF6" },
};

const tabs = [
    { id: "general", label: "عام", icon: Settings },
    { id: "appearance", label: "المظهر", icon: Palette },
    { id: "auth", label: "المصادقة", icon: Shield },
    { id: "email", label: "البريد", icon: Mail },
    { id: "database", label: "قاعدة البيانات", icon: Database },
];

export default function SettingsPage() {
    const [activeTab, setActiveTab] = useState("general");
    const [settings, setSettings] = useState<SettingsData>(defaultSettings);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [saved, setSaved] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [dbStats, setDbStats] = useState({ tables: 0, rows: 0, size: "0 MB" });
    const [useLocalStorage, setUseLocalStorage] = useState(false);

    const fetchSettings = async () => {
        setLoading(true);
        setError(null);
        try {
            const supabase = createClient();
            const { data, error } = await supabase.from("site_settings").select("*");

            if (error) {
                if (error.code === "42P01") {
                    // الجدول غير موجود، نستخدم localStorage
                    setUseLocalStorage(true);
                    const stored = localStorage.getItem("admin_settings");
                    if (stored) setSettings(JSON.parse(stored));
                } else {
                    throw error;
                }
            } else if (data && data.length > 0) {
                // تحويل البيانات من الجدول
                const settingsObj = { ...defaultSettings };
                data.forEach(row => {
                    if (row.key in settingsObj) {
                        (settingsObj as any)[row.key] = row.value;
                    }
                });
                setSettings(settingsObj);
            }

            // جلب إحصائيات DB
            const tables = ["profiles", "exam_templates", "comprehensive_exams", "lessons", "subjects", "educational_stages", "template_questions", "exam_attempts"];
            let totalRows = 0;
            for (const table of tables) {
                try {
                    const { count } = await supabase.from(table as any).select("*", { count: "exact", head: true });
                    totalRows += count || 0;
                } catch { }
            }
            setDbStats({ tables: tables.length, rows: totalRows, size: `${(totalRows * 0.5 / 1024).toFixed(2)} MB` });
        } catch (err: any) {
            setError(err.message || "حدث خطأ في جلب الإعدادات");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { fetchSettings(); }, []);

    const handleSave = async () => {
        setSaving(true);
        try {
            if (useLocalStorage) {
                localStorage.setItem("admin_settings", JSON.stringify(settings));
            } else {
                const supabase = createClient();
                for (const [key, value] of Object.entries(settings)) {
                    await supabase.from("site_settings").upsert({ key, value, updated_at: new Date().toISOString() }, { onConflict: "key" });
                }
            }
            setSaved(true);
            setTimeout(() => setSaved(false), 3000);
        } catch (err: any) {
            alert("خطأ: " + err.message);
        } finally {
            setSaving(false);
        }
    };

    const handleChange = <K extends keyof SettingsData>(category: K, key: keyof SettingsData[K], value: any) => {
        setSettings(prev => ({ ...prev, [category]: { ...prev[category], [key]: value } }));
    };

    if (loading) return <div className="flex items-center justify-center h-96"><Loader2 className="h-8 w-8 animate-spin text-primary-500" /></div>;
    if (error && !useLocalStorage) return <div className="bg-red-50 dark:bg-red-900/20 rounded-xl p-6 text-center"><AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" /><p className="text-red-600">{error}</p><button onClick={fetchSettings} className="mt-4 px-4 py-2 bg-red-500 text-white rounded-lg">إعادة المحاولة</button></div>;

    return (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div><h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900 dark:text-white">الإعدادات</h1><p className="text-gray-600 dark:text-gray-400 mt-1">إعدادات النظام والمنصة {useLocalStorage && "(localStorage)"}</p></div>
                <div className="flex gap-3">
                    <button onClick={fetchSettings} className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white dark:bg-[#1c1c24] border border-gray-200 dark:border-gray-800 text-sm font-medium"><RefreshCw className="h-4 w-4" /></button>
                    <button onClick={handleSave} disabled={saving} className={`flex items-center gap-2 px-6 py-2.5 rounded-xl font-medium transition-all ${saved ? "bg-green-500 text-white" : "bg-primary-500 hover:bg-primary-600 text-white"} disabled:opacity-50`}>
                        {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : saved ? <><Check className="h-4 w-4" />تم الحفظ</> : <><Save className="h-4 w-4" />حفظ</>}
                    </button>
                </div>
            </div>

            <div className="flex flex-col lg:flex-row gap-6">
                {/* Tabs */}
                <div className="w-full lg:w-56 space-y-2">
                    {tabs.map(tab => (
                        <button key={tab.id} onClick={() => setActiveTab(tab.id)} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-colors ${activeTab === tab.id ? "bg-primary-100 dark:bg-primary-900/30 text-primary-600" : "bg-white dark:bg-[#1c1c24] hover:bg-gray-50 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-300"}`}>
                            <tab.icon className="h-5 w-5" /><span className="font-medium">{tab.label}</span>
                        </button>
                    ))}
                </div>

                {/* Content */}
                <div className="flex-1 bg-white dark:bg-[#1c1c24] rounded-2xl border border-gray-200/60 dark:border-gray-800 p-6">
                    {activeTab === "general" && (
                        <div className="space-y-6">
                            <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">الإعدادات العامة</h3>
                            <div><label className="block text-sm font-medium mb-2">اسم الموقع</label><input type="text" value={settings.general.siteName} onChange={e => handleChange("general", "siteName", e.target.value)} className="w-full px-4 py-2.5 rounded-xl bg-gray-100 dark:bg-gray-800 outline-none" /></div>
                            <div><label className="block text-sm font-medium mb-2">وصف الموقع</label><textarea value={settings.general.siteDescription} onChange={e => handleChange("general", "siteDescription", e.target.value)} rows={3} className="w-full px-4 py-2.5 rounded-xl bg-gray-100 dark:bg-gray-800 outline-none resize-none" /></div>
                            <div><label className="block text-sm font-medium mb-2">اللغة الافتراضية</label><select value={settings.general.language} onChange={e => handleChange("general", "language", e.target.value)} className="w-full px-4 py-2.5 rounded-xl bg-gray-100 dark:bg-gray-800 outline-none"><option value="ar">العربية</option><option value="en">English</option></select></div>
                            <div className="flex items-center justify-between p-4 rounded-xl bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800">
                                <div className="flex items-center gap-3"><AlertCircle className="h-5 w-5 text-amber-500" /><div><p className="font-medium text-amber-800 dark:text-amber-200">وضع الصيانة</p><p className="text-sm text-amber-600 dark:text-amber-400">إيقاف الموقع للزوار أثناء الصيانة</p></div></div>
                                <button onClick={() => handleChange("general", "maintenanceMode", !settings.general.maintenanceMode)} className={`relative w-12 h-6 rounded-full transition-colors ${settings.general.maintenanceMode ? "bg-amber-500" : "bg-gray-300 dark:bg-gray-600"}`}><span className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-all ${settings.general.maintenanceMode ? "right-1" : "left-1"}`} /></button>
                            </div>
                        </div>
                    )}

                    {activeTab === "appearance" && (
                        <div className="space-y-6">
                            <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">المظهر</h3>
                            <div><label className="block text-sm font-medium mb-4">السمة</label>
                                <div className="grid grid-cols-3 gap-4">
                                    {[{ value: "light", label: "فاتح", icon: Sun }, { value: "dark", label: "داكن", icon: Moon }, { value: "system", label: "تلقائي", icon: Monitor }].map(opt => (
                                        <button key={opt.value} onClick={() => handleChange("appearance", "theme", opt.value)} className={`flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-colors ${settings.appearance.theme === opt.value ? "border-primary-500 bg-primary-50 dark:bg-primary-900/20" : "border-gray-200 dark:border-gray-700 hover:border-gray-300"}`}>
                                            <opt.icon className={`h-6 w-6 ${settings.appearance.theme === opt.value ? "text-primary-500" : "text-gray-400"}`} /><span className="text-sm font-medium">{opt.label}</span>
                                        </button>
                                    ))}
                                </div>
                            </div>
                            <div><label className="block text-sm font-medium mb-2">اللون الرئيسي</label><div className="flex items-center gap-4"><input type="color" value={settings.appearance.primaryColor} onChange={e => handleChange("appearance", "primaryColor", e.target.value)} className="w-12 h-12 rounded-xl cursor-pointer" /><span className="text-sm text-gray-500">{settings.appearance.primaryColor}</span></div></div>
                        </div>
                    )}

                    {activeTab === "auth" && (
                        <div className="space-y-6">
                            <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">إعدادات المصادقة</h3>
                            {[
                                { key: "enableRegistration" as const, label: "السماح بالتسجيل", desc: "السماح للمستخدمين الجدد بإنشاء حسابات", icon: User },
                                { key: "enableGoogleAuth" as const, label: "تسجيل الدخول بـ Google", desc: "السماح بتسجيل الدخول باستخدام حساب Google", icon: Globe },
                                { key: "requireEmailVerification" as const, label: "تأكيد البريد الإلكتروني", desc: "طلب تأكيد البريد قبل تفعيل الحساب", icon: Mail },
                            ].map(item => (
                                <div key={item.key} className="flex items-center justify-between p-4 rounded-xl bg-gray-50 dark:bg-gray-800/50">
                                    <div className="flex items-center gap-3"><item.icon className="h-5 w-5 text-gray-400" /><div><p className="font-medium text-gray-900 dark:text-white">{item.label}</p><p className="text-sm text-gray-500">{item.desc}</p></div></div>
                                    <button onClick={() => handleChange("auth", item.key, !settings.auth[item.key])} className={`relative w-12 h-6 rounded-full transition-colors ${settings.auth[item.key] ? "bg-primary-500" : "bg-gray-300 dark:bg-gray-600"}`}><span className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-all ${settings.auth[item.key] ? "right-1" : "left-1"}`} /></button>
                                </div>
                            ))}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div><label className="block text-sm font-medium mb-2">الحد الأقصى لمحاولات الامتحان</label><input type="number" value={settings.auth.maxExamAttempts} onChange={e => handleChange("auth", "maxExamAttempts", parseInt(e.target.value) || 1)} min={1} max={10} className="w-full px-4 py-2.5 rounded-xl bg-gray-100 dark:bg-gray-800 outline-none" /></div>
                                <div><label className="block text-sm font-medium mb-2">مهلة جلسة العمل (دقيقة)</label><input type="number" value={settings.auth.sessionTimeout} onChange={e => handleChange("auth", "sessionTimeout", parseInt(e.target.value) || 30)} min={15} max={480} className="w-full px-4 py-2.5 rounded-xl bg-gray-100 dark:bg-gray-800 outline-none" /></div>
                            </div>
                        </div>
                    )}

                    {activeTab === "email" && (
                        <div className="space-y-6">
                            <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">إعدادات البريد الإلكتروني</h3>
                            <div><label className="block text-sm font-medium mb-2">بريد التواصل</label><input type="email" value={settings.email.contactEmail} onChange={e => handleChange("email", "contactEmail", e.target.value)} className="w-full px-4 py-2.5 rounded-xl bg-gray-100 dark:bg-gray-800 outline-none" /></div>
                            <div><label className="block text-sm font-medium mb-2">بريد الدعم الفني</label><input type="email" value={settings.email.supportEmail} onChange={e => handleChange("email", "supportEmail", e.target.value)} className="w-full px-4 py-2.5 rounded-xl bg-gray-100 dark:bg-gray-800 outline-none" /></div>
                            <div className="p-4 rounded-xl bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800"><p className="text-sm text-blue-600 dark:text-blue-400"><strong>ملاحظة:</strong> يتم إرسال البريد عبر Supabase Auth. لتخصيص قوالب البريد، انتقل إلى لوحة تحكم Supabase.</p></div>
                        </div>
                    )}

                    {activeTab === "database" && (
                        <div className="space-y-6">
                            <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">قاعدة البيانات</h3>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                <div className="p-4 rounded-xl bg-gray-50 dark:bg-gray-800/50 text-center"><Database className="h-8 w-8 text-primary-500 mx-auto mb-2" /><p className="text-2xl font-bold text-gray-900 dark:text-white">{dbStats.tables}</p><p className="text-sm text-gray-500">جداول</p></div>
                                <div className="p-4 rounded-xl bg-gray-50 dark:bg-gray-800/50 text-center"><Database className="h-8 w-8 text-green-500 mx-auto mb-2" /><p className="text-2xl font-bold text-gray-900 dark:text-white">{dbStats.rows.toLocaleString()}</p><p className="text-sm text-gray-500">سجلات</p></div>
                                <div className="p-4 rounded-xl bg-gray-50 dark:bg-gray-800/50 text-center"><Database className="h-8 w-8 text-amber-500 mx-auto mb-2" /><p className="text-2xl font-bold text-gray-900 dark:text-white">{dbStats.size}</p><p className="text-sm text-gray-500">حجم تقريبي</p></div>
                            </div>
                            <div className="p-4 rounded-xl bg-gray-50 dark:bg-gray-800/50"><p className="font-medium text-gray-900 dark:text-white mb-2">معلومات الاتصال</p><div className="space-y-2 text-sm"><p><span className="text-gray-500">المزود:</span> <span className="text-gray-900 dark:text-white">Supabase (PostgreSQL)</span></p><p><span className="text-gray-500">الحالة:</span> <span className="text-green-500 font-medium">متصل</span></p></div></div>
                        </div>
                    )}
                </div>
            </div>
        </motion.div>
    );
}
