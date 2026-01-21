"use client";

// =============================================
// Onboarding Page - صفحة اختيار الدور للمستخدمين الجدد
// =============================================

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
    GraduationCap,
    BookOpen,
    ArrowLeft,
    CheckCircle2,
    AlertCircle,
    Sparkles,
    Users,
    Trophy,
    Clock
} from "lucide-react";
import { Button, Navbar, Footer } from "@/components";
import { createClient } from "@/lib/supabase";
import { useAuthStore } from "@/lib/stores/useAuthStore";
import type { UserRole } from "@/lib/types";
import { updateUserRoleAction } from "@/lib/actions/update-user-role";

type SelectedRole = 'student' | 'teacher' | null;

export default function OnboardingPage() {
    const router = useRouter();
    const { refreshUser, user } = useAuthStore();
    const [selectedRole, setSelectedRole] = useState<SelectedRole>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState("");

    // إذا كان المستخدم قد اختار دوره بالفعل، قم بإعادة توجيهه
    if (user && user.roleSelected) {
        if (user.role === 'admin') {
            router.replace('/admin');
        } else if (user.role === 'teacher') {
            router.replace('/teacher');
        } else {
            router.replace('/');
        }
        return null; // Don't render anything
    }

    const handleContinue = async () => {
        if (!selectedRole) {
            setError("يرجى اختيار نوع الحساب");
            return;
        }

        setIsLoading(true);
        setError("");

        try {
            const supabase = createClient();

            // جلب المستخدم الحالي
            const { data: { user } } = await supabase.auth.getUser();

            if (!user) {
                throw new Error("لم يتم العثور على المستخدم");
            }

            // استخدام server action لتحديث الدور (bypasses RLS)
            const result = await updateUserRoleAction({
                userId: user.id,
                role: selectedRole,
                email: user.email || '',
                name: user.user_metadata?.name || user.user_metadata?.full_name,
                avatarUrl: user.user_metadata?.avatar_url,
            });

            console.log('[Onboarding] updateUserRole result:', result);

            if (!result.success) {
                throw new Error(result.error || 'فشل في حفظ البيانات');
            }

            // تحديث حالة المصادقة
            await refreshUser();

            // التوجيه للصفحة المناسبة
            if (selectedRole === 'teacher') {
                // توجيه المدرس لإكمال بياناته
                router.push("/profile?tab=settings&welcome=teacher");
            } else {
                // توجيه الطالب للصفحة الرئيسية
                router.push("/?welcome=true");
            }
        } catch (err: any) {
            console.error('Onboarding error:', err);
            setError(err.message || "حدث خطأ أثناء حفظ الاختيار");
            setIsLoading(false);
        }
    };

    const roleOptions = [
        {
            value: 'student' as const,
            label: "طالب",
            icon: GraduationCap,
            description: "أريد التعلم والمشاركة في الاختبارات والمسابقات",
            features: [
                { icon: Trophy, text: "المشاركة في Quiz Battle" },
                { icon: BookOpen, text: "الوصول لجميع الدروس والاختبارات" },
                { icon: Users, text: "متابعة المدرسين المفضلين" },
            ],
            color: "from-blue-500 to-indigo-600",
            bgColor: "bg-blue-50 dark:bg-blue-900/20",
            borderColor: "border-blue-500",
        },
        {
            value: 'teacher' as const,
            label: "مدرس",
            icon: BookOpen,
            description: "أريد إنشاء المحتوى والاختبارات وبناء قاعدة طلاب",
            features: [
                { icon: BookOpen, text: "إنشاء الامتحانات والأسئلة" },
                { icon: Users, text: "بناء قاعدة مشتركين" },
                { icon: Clock, text: "يتطلب موافقة الإدارة" },
            ],
            color: "from-purple-500 to-pink-600",
            bgColor: "bg-purple-50 dark:bg-purple-900/20",
            borderColor: "border-purple-500",
            note: "ملاحظة: ستحتاج موافقة الإدارة لتفعيل صلاحيات المدرس",
        },
    ];

    return (
        <div className="min-h-screen bg-gradient-to-b from-gray-50 via-white to-gray-50 dark:from-[#0a0a0f] dark:via-[#121218] dark:to-[#0a0a0f] flex flex-col" dir="rtl">
            {/* Background decoration */}
            <div className="fixed inset-0 overflow-hidden pointer-events-none">
                <div className="absolute top-1/4 right-0 w-[500px] h-[500px] bg-primary-200/20 dark:bg-primary-900/10 rounded-full blur-[100px]" />
                <div className="absolute bottom-1/4 left-0 w-[400px] h-[400px] bg-primary-300/15 dark:bg-primary-800/10 rounded-full blur-[80px]" />
            </div>

            <Navbar />

            <main className="flex-1 flex items-center justify-center p-4 py-8 sm:py-12 relative z-10">
                <div className="w-full max-w-2xl">
                    {/* Header */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.5 }}
                        className="text-center mb-8"
                    >
                        {/* Icon */}
                        <motion.div
                            initial={{ scale: 0.8, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            transition={{ delay: 0.1, duration: 0.4 }}
                            className="inline-flex p-4 rounded-2xl bg-gradient-to-br from-primary-500 to-primary-600 shadow-xl shadow-primary-500/30 mb-5"
                        >
                            <Sparkles className="h-8 w-8 text-white" />
                        </motion.div>

                        {/* Title */}
                        <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900 dark:text-white mb-2">
                            مرحباً بك في QAlaa! 🎉
                        </h1>

                        {/* Subtitle */}
                        <p className="text-sm sm:text-base text-gray-600 dark:text-gray-400">
                            اختر نوع حسابك للمتابعة
                        </p>
                    </motion.div>

                    {/* Error Alert */}
                    <AnimatePresence mode="wait">
                        {error && (
                            <motion.div
                                initial={{ opacity: 0, y: -10, height: 0 }}
                                animate={{ opacity: 1, y: 0, height: "auto" }}
                                exit={{ opacity: 0, y: -10, height: 0 }}
                                transition={{ duration: 0.3 }}
                                className="mb-5 p-4 rounded-xl bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800/50 flex items-start gap-3"
                            >
                                <AlertCircle className="h-5 w-5 text-red-600 dark:text-red-400 shrink-0 mt-0.5" />
                                <p className="text-sm text-red-700 dark:text-red-300 flex-1">{error}</p>
                            </motion.div>
                        )}
                    </AnimatePresence>

                    {/* Role Selection Cards */}
                    <div className="grid gap-4 sm:gap-6">
                        {roleOptions.map((option, index) => {
                            const Icon = option.icon;
                            const isSelected = selectedRole === option.value;

                            return (
                                <motion.button
                                    key={option.value}
                                    type="button"
                                    onClick={() => {
                                        setSelectedRole(option.value);
                                        setError("");
                                    }}
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: 0.15 + index * 0.1, duration: 0.5 }}
                                    whileHover={{ scale: 1.01 }}
                                    whileTap={{ scale: 0.99 }}
                                    className={`relative w-full p-5 sm:p-6 rounded-2xl border-2 transition-all duration-300 text-right ${isSelected
                                        ? `${option.borderColor} ${option.bgColor} shadow-lg`
                                        : "border-gray-200 dark:border-[#2e2e3a] bg-white dark:bg-[#1c1c24] hover:border-gray-300 dark:hover:border-[#3e3e4a] hover:shadow-md"
                                        }`}
                                >
                                    {/* Selected Indicator */}
                                    {isSelected && (
                                        <motion.div
                                            initial={{ scale: 0 }}
                                            animate={{ scale: 1 }}
                                            className="absolute top-4 left-4"
                                        >
                                            <div className={`p-1 rounded-full bg-gradient-to-r ${option.color}`}>
                                                <CheckCircle2 className="h-5 w-5 text-white" />
                                            </div>
                                        </motion.div>
                                    )}

                                    <div className="flex items-start gap-4">
                                        {/* Icon */}
                                        <div className={`p-3 rounded-xl bg-gradient-to-br ${option.color} shadow-lg shrink-0`}>
                                            <Icon className="h-6 w-6 text-white" />
                                        </div>

                                        {/* Content */}
                                        <div className="flex-1">
                                            <h3 className={`text-lg sm:text-xl font-bold mb-1 ${isSelected
                                                ? "text-gray-900 dark:text-white"
                                                : "text-gray-700 dark:text-gray-300"
                                                }`}>
                                                {option.label}
                                            </h3>
                                            <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
                                                {option.description}
                                            </p>

                                            {/* Features */}
                                            <div className="space-y-2">
                                                {option.features.map((feature, i) => {
                                                    const FeatureIcon = feature.icon;
                                                    return (
                                                        <div key={i} className="flex items-center gap-2 text-sm">
                                                            <FeatureIcon className={`h-4 w-4 ${isSelected
                                                                ? "text-primary-600 dark:text-primary-400"
                                                                : "text-gray-400"
                                                                }`} />
                                                            <span className={
                                                                isSelected
                                                                    ? "text-gray-700 dark:text-gray-300"
                                                                    : "text-gray-500 dark:text-gray-400"
                                                            }>
                                                                {feature.text}
                                                            </span>
                                                        </div>
                                                    );
                                                })}
                                            </div>

                                            {/* Note for teachers */}
                                            {option.note && (
                                                <p className="mt-3 text-xs text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/20 px-3 py-2 rounded-lg">
                                                    ⚠️ {option.note}
                                                </p>
                                            )}
                                        </div>
                                    </div>
                                </motion.button>
                            );
                        })}
                    </div>

                    {/* Continue Button */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.4, duration: 0.5 }}
                        className="mt-8"
                    >
                        <Button
                            onClick={handleContinue}
                            fullWidth
                            isLoading={isLoading}
                            disabled={!selectedRole || isLoading}
                            className="py-4"
                        >
                            <span>متابعة</span>
                            <ArrowLeft className="h-5 w-5 mr-2" />
                        </Button>
                    </motion.div>

                    {/* Info */}
                    <motion.p
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.5 }}
                        className="mt-4 text-center text-xs text-gray-500 dark:text-gray-400"
                    >
                        يمكنك تغيير إعداداتك لاحقاً من الملف الشخصي
                    </motion.p>
                </div>
            </main>

            <Footer />
        </div>
    );
}
