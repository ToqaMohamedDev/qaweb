// =============================================
// Settings Admin Page - إعدادات النظام
// =============================================

"use client";

import { useState, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import {
    Settings,
    Globe,
    Shield,
    Palette,
    Database,
    Mail,
    Save,
    Check,
    Loader2,
    AlertCircle,
    RefreshCw,
    Moon,
    Sun,
    Monitor,
    User,
} from "lucide-react";
import { createClient } from "@/lib/supabase";
import { AdminPageHeader } from "@/components/admin/shared";

// ═══════════════════════════════════════════════════════════════════════════
// Types
// ═══════════════════════════════════════════════════════════════════════════

interface GeneralSettings {
    siteName: string;
    siteDescription: string;
    language: string;
    maintenanceMode: boolean;
}

interface AuthSettings {
    enableRegistration: boolean;
    enableGoogleAuth: boolean;
    requireEmailVerification: boolean;
    maxExamAttempts: number;
    sessionTimeout: number;
}

interface EmailSettings {
    contactEmail: string;
    supportEmail: string;
}

interface AppearanceSettings {
    theme: string;
    primaryColor: string;
}

interface SettingsData {
    general: GeneralSettings;
    auth: AuthSettings;
    email: EmailSettings;
    appearance: AppearanceSettings;
}

interface DbStats {
    tables: number;
    rows: number;
    size: string;
}

type SettingsTab = "general" | "appearance" | "auth" | "email" | "database";

// ═══════════════════════════════════════════════════════════════════════════
// Constants
// ═══════════════════════════════════════════════════════════════════════════

const DEFAULT_SETTINGS: SettingsData = {
    general: {
        siteName: "منصة التعليم",
        siteDescription: "منصة تعليمية متكاملة",
        language: "ar",
        maintenanceMode: false,
    },
    auth: {
        enableRegistration: true,
        enableGoogleAuth: true,
        requireEmailVerification: false,
        maxExamAttempts: 3,
        sessionTimeout: 60,
    },
    email: {
        contactEmail: "contact@example.com",
        supportEmail: "support@example.com",
    },
    appearance: {
        theme: "system",
        primaryColor: "#8B5CF6",
    },
};

const TABS = [
    { id: "general" as SettingsTab, label: "عام", icon: Settings },
    { id: "appearance" as SettingsTab, label: "المظهر", icon: Palette },
    { id: "auth" as SettingsTab, label: "المصادقة", icon: Shield },
    { id: "email" as SettingsTab, label: "البريد", icon: Mail },
    { id: "database" as SettingsTab, label: "قاعدة البيانات", icon: Database },
];

const THEME_OPTIONS = [
    { value: "light", label: "فاتح", icon: Sun },
    { value: "dark", label: "داكن", icon: Moon },
    { value: "system", label: "تلقائي", icon: Monitor },
];

const AUTH_TOGGLES = [
    {
        key: "enableRegistration" as const,
        label: "السماح بالتسجيل",
        desc: "السماح للمستخدمين الجدد بإنشاء حسابات",
        icon: User,
    },
    {
        key: "enableGoogleAuth" as const,
        label: "تسجيل الدخول بـ Google",
        desc: "السماح بتسجيل الدخول باستخدام حساب Google",
        icon: Globe,
    },
    {
        key: "requireEmailVerification" as const,
        label: "تأكيد البريد الإلكتروني",
        desc: "طلب تأكيد البريد قبل تفعيل الحساب",
        icon: Mail,
    },
];

const DB_TABLES = ["profiles", "comprehensive_exams", "lessons", "subjects", "educational_stages"];

// ═══════════════════════════════════════════════════════════════════════════
// Main Component
// ═══════════════════════════════════════════════════════════════════════════

export default function SettingsPage() {
    // State
    const [activeTab, setActiveTab] = useState<SettingsTab>("general");
    const [settings, setSettings] = useState<SettingsData>(DEFAULT_SETTINGS);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [saved, setSaved] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [dbStats, setDbStats] = useState<DbStats>({ tables: 0, rows: 0, size: "0 MB" });
    const [useLocalStorage, setUseLocalStorage] = useState(false);

    // ═══════════════════════════════════════════════════════════════════════
    // Data Fetching
    // ═══════════════════════════════════════════════════════════════════════

    const fetchSettings = useCallback(async () => {
        setLoading(true);
        setError(null);

        try {
            // Use API route for fetching settings
            const res = await fetch('/api/admin/query?table=site_settings&select=*&limit=100');
            const result = await res.json();

            if (!res.ok) {
                if (result.error?.includes('42P01')) {
                    // Table doesn't exist, use localStorage
                    setUseLocalStorage(true);
                    const stored = localStorage.getItem("admin_settings");
                    if (stored) setSettings(JSON.parse(stored));
                } else {
                    throw new Error(result.error);
                }
            } else if (result.data && result.data.length > 0) {
                const settingsObj = { ...DEFAULT_SETTINGS };
                result.data.forEach((row: any) => {
                    if (row.key in settingsObj) {
                        (settingsObj as any)[row.key] = row.value;
                    }
                });
                setSettings(settingsObj);
            } else {
                // No settings found, use localStorage
                setUseLocalStorage(true);
                const stored = localStorage.getItem("admin_settings");
                if (stored) setSettings(JSON.parse(stored));
            }

            // Fetch DB stats
            await fetchDbStats();
        } catch (err: any) {
            setError(err.message || "حدث خطأ في جلب الإعدادات");
        } finally {
            setLoading(false);
        }
    }, []);

    const fetchDbStats = async () => {
        let totalRows = 0;
        for (const table of DB_TABLES) {
            try {
                const res = await fetch(`/api/admin/query?table=${table}&select=id&limit=1`);
                const result = await res.json();
                totalRows += result.count || 0;
            } catch {
                /* ignore */
            }
        }
        setDbStats({
            tables: DB_TABLES.length,
            rows: totalRows,
            size: `${((totalRows * 0.5) / 1024).toFixed(2)} MB`,
        });
    };

    useEffect(() => {
        fetchSettings();
    }, [fetchSettings]);

    // ═══════════════════════════════════════════════════════════════════════
    // Handlers
    // ═══════════════════════════════════════════════════════════════════════

    const handleSave = useCallback(async () => {
        setSaving(true);
        try {
            if (useLocalStorage) {
                localStorage.setItem("admin_settings", JSON.stringify(settings));
            } else {
                const supabase = createClient();
                for (const [key, value] of Object.entries(settings)) {
                    await supabase
                        .from("site_settings")
                        .upsert(
                            { key, value, updated_at: new Date().toISOString() },
                            { onConflict: "key" }
                        );
                }
            }
            setSaved(true);
            setTimeout(() => setSaved(false), 3000);
        } catch (err: any) {
            alert("خطأ: " + err.message);
        } finally {
            setSaving(false);
        }
    }, [settings, useLocalStorage]);

    const handleChange = useCallback(
        <K extends keyof SettingsData>(
            category: K,
            key: keyof SettingsData[K],
            value: any
        ) => {
            setSettings((prev) => ({
                ...prev,
                [category]: { ...prev[category], [key]: value },
            }));
        },
        []
    );

    // ═══════════════════════════════════════════════════════════════════════
    // Loading & Error States
    // ═══════════════════════════════════════════════════════════════════════

    if (loading) {
        return (
            <div className="flex items-center justify-center h-96">
                <Loader2 className="h-8 w-8 animate-spin text-primary-500" />
            </div>
        );
    }

    if (error && !useLocalStorage) {
        return (
            <div className="bg-red-50 dark:bg-red-900/20 rounded-xl p-6 text-center">
                <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
                <p className="text-red-600 dark:text-red-400">{error}</p>
                <button
                    onClick={fetchSettings}
                    className="mt-4 px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"
                >
                    إعادة المحاولة
                </button>
            </div>
        );
    }

    // ═══════════════════════════════════════════════════════════════════════
    // Render
    // ═══════════════════════════════════════════════════════════════════════

    return (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
            {/* Header */}
            <SettingsHeader
                useLocalStorage={useLocalStorage}
                saving={saving}
                saved={saved}
                onRefresh={fetchSettings}
                onSave={handleSave}
            />

            <div className="flex flex-col lg:flex-row gap-6">
                {/* Tabs Sidebar */}
                <TabsSidebar activeTab={activeTab} onTabChange={setActiveTab} />

                {/* Content */}
                <div className="flex-1 bg-white dark:bg-[#1c1c24] rounded-2xl border border-gray-200/60 dark:border-gray-800 p-6">
                    {activeTab === "general" && (
                        <GeneralTab settings={settings.general} onChange={handleChange} />
                    )}
                    {activeTab === "appearance" && (
                        <AppearanceTab settings={settings.appearance} onChange={handleChange} />
                    )}
                    {activeTab === "auth" && (
                        <AuthTab settings={settings.auth} onChange={handleChange} />
                    )}
                    {activeTab === "email" && (
                        <EmailTab settings={settings.email} onChange={handleChange} />
                    )}
                    {activeTab === "database" && <DatabaseTab stats={dbStats} />}
                </div>
            </div>
        </motion.div>
    );
}

// ═══════════════════════════════════════════════════════════════════════════
// Sub Components
// ═══════════════════════════════════════════════════════════════════════════

interface SettingsHeaderProps {
    useLocalStorage: boolean;
    saving: boolean;
    saved: boolean;
    onRefresh: () => void;
    onSave: () => void;
}

function SettingsHeader({ useLocalStorage, saving, saved, onRefresh, onSave }: SettingsHeaderProps) {
    return (
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
                <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900 dark:text-white">
                    الإعدادات
                </h1>
                <p className="text-gray-600 dark:text-gray-400 mt-1">
                    إعدادات النظام والمنصة {useLocalStorage && "(localStorage)"}
                </p>
            </div>
            <div className="flex gap-3">
                <button
                    onClick={onRefresh}
                    className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white dark:bg-[#1c1c24] border border-gray-200 dark:border-gray-800 text-sm font-medium hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                >
                    <RefreshCw className="h-4 w-4" />
                </button>
                <button
                    onClick={onSave}
                    disabled={saving}
                    className={`flex items-center gap-2 px-6 py-2.5 rounded-xl font-medium transition-all ${saved
                        ? "bg-green-500 text-white"
                        : "bg-primary-500 hover:bg-primary-600 text-white"
                        } disabled:opacity-50`}
                >
                    {saving ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                    ) : saved ? (
                        <>
                            <Check className="h-4 w-4" />
                            تم الحفظ
                        </>
                    ) : (
                        <>
                            <Save className="h-4 w-4" />
                            حفظ
                        </>
                    )}
                </button>
            </div>
        </div>
    );
}

interface TabsSidebarProps {
    activeTab: SettingsTab;
    onTabChange: (tab: SettingsTab) => void;
}

function TabsSidebar({ activeTab, onTabChange }: TabsSidebarProps) {
    return (
        <div className="w-full lg:w-56 space-y-2">
            {TABS.map((tab) => (
                <button
                    key={tab.id}
                    onClick={() => onTabChange(tab.id)}
                    className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-colors ${activeTab === tab.id
                        ? "bg-primary-100 dark:bg-primary-900/30 text-primary-600"
                        : "bg-white dark:bg-[#1c1c24] hover:bg-gray-50 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-300"
                        }`}
                >
                    <tab.icon className="h-5 w-5" />
                    <span className="font-medium">{tab.label}</span>
                </button>
            ))}
        </div>
    );
}

// ═══════════════════════════════════════════════════════════════════════════
// Tab Components
// ═══════════════════════════════════════════════════════════════════════════

interface GeneralTabProps {
    settings: GeneralSettings;
    onChange: <K extends keyof SettingsData>(category: K, key: keyof SettingsData[K], value: any) => void;
}

function GeneralTab({ settings, onChange }: GeneralTabProps) {
    return (
        <div className="space-y-6">
            <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">الإعدادات العامة</h3>

            <SettingsInput
                label="اسم الموقع"
                value={settings.siteName}
                onChange={(v) => onChange("general", "siteName", v)}
            />

            <SettingsTextarea
                label="وصف الموقع"
                value={settings.siteDescription}
                onChange={(v) => onChange("general", "siteDescription", v)}
            />

            <SettingsSelect
                label="اللغة الافتراضية"
                value={settings.language}
                onChange={(v) => onChange("general", "language", v)}
                options={[
                    { value: "ar", label: "العربية" },
                    { value: "en", label: "English" },
                ]}
            />

            <MaintenanceModeToggle
                enabled={settings.maintenanceMode}
                onChange={(v) => onChange("general", "maintenanceMode", v)}
            />
        </div>
    );
}

interface AppearanceTabProps {
    settings: AppearanceSettings;
    onChange: <K extends keyof SettingsData>(category: K, key: keyof SettingsData[K], value: any) => void;
}

function AppearanceTab({ settings, onChange }: AppearanceTabProps) {
    return (
        <div className="space-y-6">
            <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">المظهر</h3>

            <div>
                <label className="block text-sm font-medium mb-4">السمة</label>
                <div className="grid grid-cols-3 gap-4">
                    {THEME_OPTIONS.map((opt) => (
                        <button
                            key={opt.value}
                            onClick={() => onChange("appearance", "theme", opt.value)}
                            className={`flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-colors ${settings.theme === opt.value
                                ? "border-primary-500 bg-primary-50 dark:bg-primary-900/20"
                                : "border-gray-200 dark:border-gray-700 hover:border-gray-300"
                                }`}
                        >
                            <opt.icon
                                className={`h-6 w-6 ${settings.theme === opt.value ? "text-primary-500" : "text-gray-400"
                                    }`}
                            />
                            <span className="text-sm font-medium">{opt.label}</span>
                        </button>
                    ))}
                </div>
            </div>

            <div>
                <label className="block text-sm font-medium mb-2">اللون الرئيسي</label>
                <div className="flex items-center gap-4">
                    <input
                        type="color"
                        value={settings.primaryColor}
                        onChange={(e) => onChange("appearance", "primaryColor", e.target.value)}
                        className="w-12 h-12 rounded-xl cursor-pointer"
                    />
                    <span className="text-sm text-gray-500">{settings.primaryColor}</span>
                </div>
            </div>
        </div>
    );
}

interface AuthTabProps {
    settings: AuthSettings;
    onChange: <K extends keyof SettingsData>(category: K, key: keyof SettingsData[K], value: any) => void;
}

function AuthTab({ settings, onChange }: AuthTabProps) {
    return (
        <div className="space-y-6">
            <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">إعدادات المصادقة</h3>

            {AUTH_TOGGLES.map((item) => (
                <ToggleItem
                    key={item.key}
                    icon={item.icon}
                    label={item.label}
                    description={item.desc}
                    enabled={settings[item.key]}
                    onChange={(v) => onChange("auth", item.key, v)}
                />
            ))}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <SettingsInput
                    label="الحد الأقصى لمحاولات الامتحان"
                    value={settings.maxExamAttempts.toString()}
                    onChange={(v) => onChange("auth", "maxExamAttempts", parseInt(v) || 1)}
                    type="number"
                />
                <SettingsInput
                    label="مهلة جلسة العمل (دقيقة)"
                    value={settings.sessionTimeout.toString()}
                    onChange={(v) => onChange("auth", "sessionTimeout", parseInt(v) || 30)}
                    type="number"
                />
            </div>
        </div>
    );
}

interface EmailTabProps {
    settings: EmailSettings;
    onChange: <K extends keyof SettingsData>(category: K, key: keyof SettingsData[K], value: any) => void;
}

function EmailTab({ settings, onChange }: EmailTabProps) {
    return (
        <div className="space-y-6">
            <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">
                إعدادات البريد الإلكتروني
            </h3>

            <SettingsInput
                label="بريد التواصل"
                value={settings.contactEmail}
                onChange={(v) => onChange("email", "contactEmail", v)}
                type="email"
            />

            <SettingsInput
                label="بريد الدعم الفني"
                value={settings.supportEmail}
                onChange={(v) => onChange("email", "supportEmail", v)}
                type="email"
            />

            <div className="p-4 rounded-xl bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800">
                <p className="text-sm text-blue-600 dark:text-blue-400">
                    <strong>ملاحظة:</strong> يتم إرسال البريد عبر Supabase Auth. لتخصيص قوالب
                    البريد، انتقل إلى لوحة تحكم Supabase.
                </p>
            </div>
        </div>
    );
}

function DatabaseTab({ stats }: { stats: DbStats }) {
    return (
        <div className="space-y-6">
            <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">قاعدة البيانات</h3>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <StatCard icon={Database} value={stats.tables} label="جداول" color="text-primary-500" />
                <StatCard
                    icon={Database}
                    value={stats.rows.toLocaleString()}
                    label="سجلات"
                    color="text-green-500"
                />
                <StatCard icon={Database} value={stats.size} label="حجم تقريبي" color="text-amber-500" />
            </div>

            <div className="p-4 rounded-xl bg-gray-50 dark:bg-gray-800/50">
                <p className="font-medium text-gray-900 dark:text-white mb-2">معلومات الاتصال</p>
                <div className="space-y-2 text-sm">
                    <p>
                        <span className="text-gray-500">المزود:</span>{" "}
                        <span className="text-gray-900 dark:text-white">Supabase (PostgreSQL)</span>
                    </p>
                    <p>
                        <span className="text-gray-500">الحالة:</span>{" "}
                        <span className="text-green-500 font-medium">متصل</span>
                    </p>
                </div>
            </div>
        </div>
    );
}

// ═══════════════════════════════════════════════════════════════════════════
// Helper Components
// ═══════════════════════════════════════════════════════════════════════════

interface SettingsInputProps {
    label: string;
    value: string;
    onChange: (value: string) => void;
    type?: "text" | "email" | "number";
}

function SettingsInput({ label, value, onChange, type = "text" }: SettingsInputProps) {
    return (
        <div>
            <label className="block text-sm font-medium mb-2">{label}</label>
            <input
                type={type}
                value={value}
                onChange={(e) => onChange(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl bg-gray-100 dark:bg-gray-800 outline-none focus:ring-2 focus:ring-primary-500"
            />
        </div>
    );
}

function SettingsTextarea({
    label,
    value,
    onChange,
}: {
    label: string;
    value: string;
    onChange: (value: string) => void;
}) {
    return (
        <div>
            <label className="block text-sm font-medium mb-2">{label}</label>
            <textarea
                value={value}
                onChange={(e) => onChange(e.target.value)}
                rows={3}
                className="w-full px-4 py-2.5 rounded-xl bg-gray-100 dark:bg-gray-800 outline-none resize-none focus:ring-2 focus:ring-primary-500"
            />
        </div>
    );
}

interface SettingsSelectProps {
    label: string;
    value: string;
    onChange: (value: string) => void;
    options: { value: string; label: string }[];
}

function SettingsSelect({ label, value, onChange, options }: SettingsSelectProps) {
    return (
        <div>
            <label className="block text-sm font-medium mb-2">{label}</label>
            <select
                value={value}
                onChange={(e) => onChange(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl bg-gray-100 dark:bg-gray-800 outline-none focus:ring-2 focus:ring-primary-500"
            >
                {options.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                        {opt.label}
                    </option>
                ))}
            </select>
        </div>
    );
}

function MaintenanceModeToggle({
    enabled,
    onChange,
}: {
    enabled: boolean;
    onChange: (value: boolean) => void;
}) {
    return (
        <div className="flex items-center justify-between p-4 rounded-xl bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800">
            <div className="flex items-center gap-3">
                <AlertCircle className="h-5 w-5 text-amber-500" />
                <div>
                    <p className="font-medium text-amber-800 dark:text-amber-200">وضع الصيانة</p>
                    <p className="text-sm text-amber-600 dark:text-amber-400">
                        إيقاف الموقع للزوار أثناء الصيانة
                    </p>
                </div>
            </div>
            <Toggle enabled={enabled} onChange={onChange} />
        </div>
    );
}

interface ToggleItemProps {
    icon: any;
    label: string;
    description: string;
    enabled: boolean;
    onChange: (value: boolean) => void;
}

function ToggleItem({ icon: Icon, label, description, enabled, onChange }: ToggleItemProps) {
    return (
        <div className="flex items-center justify-between p-4 rounded-xl bg-gray-50 dark:bg-gray-800/50">
            <div className="flex items-center gap-3">
                <Icon className="h-5 w-5 text-gray-400" />
                <div>
                    <p className="font-medium text-gray-900 dark:text-white">{label}</p>
                    <p className="text-sm text-gray-500">{description}</p>
                </div>
            </div>
            <Toggle enabled={enabled} onChange={onChange} />
        </div>
    );
}

function Toggle({ enabled, onChange }: { enabled: boolean; onChange: (value: boolean) => void }) {
    return (
        <button
            onClick={() => onChange(!enabled)}
            className={`relative w-12 h-6 rounded-full transition-colors ${enabled ? "bg-primary-500" : "bg-gray-300 dark:bg-gray-600"
                }`}
        >
            <span
                className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-all ${enabled ? "right-1" : "left-1"
                    }`}
            />
        </button>
    );
}

function StatCard({
    icon: Icon,
    value,
    label,
    color,
}: {
    icon: any;
    value: string | number;
    label: string;
    color: string;
}) {
    return (
        <div className="p-4 rounded-xl bg-gray-50 dark:bg-gray-800/50 text-center">
            <Icon className={`h-8 w-8 ${color} mx-auto mb-2`} />
            <p className="text-2xl font-bold text-gray-900 dark:text-white">{value}</p>
            <p className="text-sm text-gray-500">{label}</p>
        </div>
    );
}
