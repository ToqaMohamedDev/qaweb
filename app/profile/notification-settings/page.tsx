"use client";

/**
 * Notification Settings Page
 * 
 * Allows users to manage their notification preferences
 * Uses the notification_preferences table from the database
 */

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
    Bell,
    Mail,
    Smartphone,
    BookOpen,
    FileText,
    Loader2,
    Save,
    CheckCircle,
    ArrowRight,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Navbar } from "@/components/Navbar";
import { createClient } from "@/lib/supabase";

// ==========================================
// Types
// ==========================================

interface NotificationPreferences {
    email_notifications: boolean;
    push_notifications: boolean;
    exam_reminders: boolean;
    new_content_alerts: boolean;
}

interface SettingToggleProps {
    icon: React.ReactNode;
    title: string;
    description: string;
    value: boolean;
    onChange: (value: boolean) => void;
    disabled?: boolean;
}

// ==========================================
// Toggle Component
// ==========================================

function SettingToggle({
    icon,
    title,
    description,
    value,
    onChange,
    disabled = false,
}: SettingToggleProps) {
    return (
        <motion.div
            whileHover={{ scale: disabled ? 1 : 1.01 }}
            className={`flex items-start gap-4 p-4 rounded-xl bg-gray-50 dark:bg-slate-800/50 border border-gray-100 dark:border-slate-700 ${disabled ? "opacity-60" : ""
                }`}
        >
            <div className="p-3 rounded-xl bg-violet-100 dark:bg-violet-900/30 text-violet-600 dark:text-violet-400">
                {icon}
            </div>

            <div className="flex-1 min-w-0">
                <h3 className="font-medium text-gray-900 dark:text-white">{title}</h3>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
                    {description}
                </p>
            </div>

            <button
                onClick={() => !disabled && onChange(!value)}
                disabled={disabled}
                className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-violet-500 focus:ring-offset-2 dark:focus:ring-offset-slate-900 ${value
                        ? "bg-violet-600"
                        : "bg-gray-300 dark:bg-gray-600"
                    } ${disabled ? "cursor-not-allowed" : ""}`}
            >
                <span
                    className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${value ? "translate-x-5" : "translate-x-0"
                        }`}
                />
            </button>
        </motion.div>
    );
}

// ==========================================
// Main Component
// ==========================================

export default function NotificationSettingsPage() {
    const router = useRouter();

    // State
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [showSuccess, setShowSuccess] = useState(false);
    const [userId, setUserId] = useState<string | null>(null);

    const [preferences, setPreferences] = useState<NotificationPreferences>({
        email_notifications: true,
        push_notifications: true,
        exam_reminders: true,
        new_content_alerts: true,
    });

    // ==========================================
    // Fetch Preferences
    // ==========================================

    useEffect(() => {
        fetchPreferences();
    }, []);

    const fetchPreferences = async () => {
        setIsLoading(true);
        try {
            const supabase = createClient();

            // Get current user
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) {
                router.push("/login");
                return;
            }
            setUserId(user.id);

            // Fetch preferences
            const { data, error } = await supabase
                .from("notification_preferences")
                .select("*")
                .eq("user_id", user.id)
                .single();

            if (error && error.code !== "PGRST116") {
                throw error;
            }

            if (data) {
                setPreferences({
                    email_notifications: data.email_notifications ?? true,
                    push_notifications: data.push_notifications ?? true,
                    exam_reminders: data.exam_reminders ?? true,
                    new_content_alerts: data.new_content_alerts ?? true,
                });
            }
        } catch (err) {
            console.error("Error fetching preferences:", err);
        } finally {
            setIsLoading(false);
        }
    };

    // ==========================================
    // Save Preferences
    // ==========================================

    const handleSave = async () => {
        if (!userId) return;

        setIsSaving(true);
        try {
            const supabase = createClient();

            const { error } = await supabase
                .from("notification_preferences")
                .upsert({
                    user_id: userId,
                    ...preferences,
                    updated_at: new Date().toISOString(),
                }, {
                    onConflict: "user_id",
                });

            if (error) throw error;

            setShowSuccess(true);
            setTimeout(() => setShowSuccess(false), 3000);
        } catch (err) {
            console.error("Error saving preferences:", err);
        } finally {
            setIsSaving(false);
        }
    };

    // ==========================================
    // Render
    // ==========================================

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-[#0a0f1a]" dir="rtl">
            <Navbar />

            <div className="max-w-2xl mx-auto px-4 py-8">
                {/* Breadcrumb */}
                <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400 mb-6">
                    <Link href="/profile" className="hover:text-violet-600 transition-colors">
                        الملف الشخصي
                    </Link>
                    <ArrowRight className="h-4 w-4 rotate-180" />
                    <span className="text-gray-900 dark:text-white">إعدادات الإشعارات</span>
                </div>

                {/* Header */}
                <motion.div
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mb-8"
                >
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-3">
                        <div className="p-2 rounded-xl bg-violet-100 dark:bg-violet-900/30">
                            <Bell className="h-6 w-6 text-violet-600 dark:text-violet-400" />
                        </div>
                        إعدادات الإشعارات
                    </h1>
                    <p className="text-gray-500 dark:text-gray-400 mt-2">
                        تحكم في كيفية تلقي الإشعارات والتنبيهات
                    </p>
                </motion.div>

                {isLoading ? (
                    <div className="flex items-center justify-center py-20">
                        <Loader2 className="h-8 w-8 animate-spin text-violet-600" />
                    </div>
                ) : (
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="space-y-4"
                    >
                        {/* Email Notifications */}
                        <SettingToggle
                            icon={<Mail className="h-5 w-5" />}
                            title="إشعارات البريد الإلكتروني"
                            description="استلام الإشعارات عبر البريد الإلكتروني"
                            value={preferences.email_notifications}
                            onChange={(value) =>
                                setPreferences((prev) => ({ ...prev, email_notifications: value }))
                            }
                        />

                        {/* Push Notifications */}
                        <SettingToggle
                            icon={<Smartphone className="h-5 w-5" />}
                            title="الإشعارات الفورية"
                            description="استلام الإشعارات الفورية في المتصفح"
                            value={preferences.push_notifications}
                            onChange={(value) =>
                                setPreferences((prev) => ({ ...prev, push_notifications: value }))
                            }
                        />

                        {/* Exam Reminders */}
                        <SettingToggle
                            icon={<FileText className="h-5 w-5" />}
                            title="تذكيرات الامتحانات"
                            description="تلقي تنبيهات قبل مواعيد الامتحانات"
                            value={preferences.exam_reminders}
                            onChange={(value) =>
                                setPreferences((prev) => ({ ...prev, exam_reminders: value }))
                            }
                        />

                        {/* New Content Alerts */}
                        <SettingToggle
                            icon={<BookOpen className="h-5 w-5" />}
                            title="تنبيهات المحتوى الجديد"
                            description="إعلامك بالدروس والامتحانات الجديدة"
                            value={preferences.new_content_alerts}
                            onChange={(value) =>
                                setPreferences((prev) => ({ ...prev, new_content_alerts: value }))
                            }
                        />

                        {/* Save Button */}
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ delay: 0.3 }}
                            className="pt-6"
                        >
                            <motion.button
                                whileHover={{ scale: 1.02 }}
                                whileTap={{ scale: 0.98 }}
                                onClick={handleSave}
                                disabled={isSaving}
                                className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-violet-600 hover:bg-violet-700 text-white rounded-xl font-medium transition-colors disabled:opacity-50"
                            >
                                {isSaving ? (
                                    <Loader2 className="h-5 w-5 animate-spin" />
                                ) : showSuccess ? (
                                    <>
                                        <CheckCircle className="h-5 w-5" />
                                        تم الحفظ بنجاح!
                                    </>
                                ) : (
                                    <>
                                        <Save className="h-5 w-5" />
                                        حفظ التغييرات
                                    </>
                                )}
                            </motion.button>
                        </motion.div>

                        {/* Info Box */}
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ delay: 0.4 }}
                            className="mt-6 p-4 rounded-xl bg-blue-50 dark:bg-blue-900/20 border border-blue-100 dark:border-blue-800"
                        >
                            <p className="text-sm text-blue-700 dark:text-blue-300">
                                💡 <span className="font-medium">نصيحة:</span> يمكنك تفعيل تذكيرات الامتحانات لتلقي إشعار قبل موعد كل امتحان بـ 24 ساعة.
                            </p>
                        </motion.div>
                    </motion.div>
                )}
            </div>
        </div>
    );
}
