"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { Mail, Lock, User, ArrowLeft, CheckCircle2, AlertCircle, Eye, EyeOff, UserPlus, GraduationCap, BookOpen } from "lucide-react";
import { Input } from "@/components/Input";
import { Button } from "@/components/Button";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { signUpWithEmail, signInWithGoogle, UserRole } from "@/lib/supabase";

export default function SignUpPage() {
    const router = useRouter();
    const [formData, setFormData] = useState({
        name: "",
        email: "",
        password: "",
        confirmPassword: "",
        role: "student" as UserRole,
    });
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [errors, setErrors] = useState<Record<string, string>>({});
    const [isLoading, setIsLoading] = useState(false);
    const [googleLoading, setGoogleLoading] = useState(false);
    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");

    const passwordRequirements = useMemo(() => [
        { text: "6 أحرف على الأقل", met: formData.password.length >= 6, key: "length" },
        { text: "حرف كبير", met: /[A-Z]/.test(formData.password), key: "uppercase" },
        { text: "حرف صغير", met: /[a-z]/.test(formData.password), key: "lowercase" },
        { text: "رقم", met: /\d/.test(formData.password), key: "number" },
    ], [formData.password]);

    const passwordStrength = useMemo(() => {
        const metCount = passwordRequirements.filter(req => req.met).length;
        if (metCount === 0) return { strength: 0, label: "", color: "bg-gray-200" };
        if (metCount === 1) return { strength: 25, label: "ضعيفة", color: "bg-red-500" };
        if (metCount === 2) return { strength: 50, label: "متوسطة", color: "bg-yellow-500" };
        if (metCount === 3) return { strength: 75, label: "جيدة", color: "bg-blue-500" };
        return { strength: 100, label: "قوية", color: "bg-green-500" };
    }, [passwordRequirements]);

    // Validation
    const validate = () => {
        const newErrors: Record<string, string> = {};

        if (!formData.name) newErrors.name = "الاسم مطلوب";
        else if (formData.name.length < 2) newErrors.name = "الاسم يجب أن يكون حرفين على الأقل";

        if (!formData.email) newErrors.email = "البريد الإلكتروني مطلوب";
        else if (!/\S+@\S+\.\S+/.test(formData.email)) newErrors.email = "البريد الإلكتروني غير صحيح";

        if (!formData.password) newErrors.password = "كلمة المرور مطلوبة";
        else if (formData.password.length < 6) newErrors.password = "كلمة المرور يجب أن تكون 6 أحرف على الأقل";

        if (!formData.confirmPassword) newErrors.confirmPassword = "تأكيد كلمة المرور مطلوب";
        else if (formData.password !== formData.confirmPassword) newErrors.confirmPassword = "كلمة المرور غير متطابقة";

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    // Handle signup with Supabase
    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!validate()) return;

        setIsLoading(true);
        setError("");
        setSuccess("");

        try {
            await signUpWithEmail(
                formData.email,
                formData.password,
                formData.name,
                formData.role
            );
            setSuccess("تم إنشاء الحساب بنجاح! يرجى التحقق من بريدك الإلكتروني لتأكيد الحساب.");
            // Clear form
            setFormData({
                name: "",
                email: "",
                password: "",
                confirmPassword: "",
                role: "student",
            });
        } catch (err: any) {
            // Handle specific error messages
            if (err.message?.includes("User already registered")) {
                setError("هذا البريد الإلكتروني مسجل بالفعل");
            } else if (err.message?.includes("Password should be")) {
                setError("كلمة المرور ضعيفة جداً");
            } else {
                setError(err.message || "حدث خطأ أثناء إنشاء الحساب");
            }
        } finally {
            setIsLoading(false);
        }
    };

    // Handle Google sign up with Supabase
    const handleGoogleSignIn = async () => {
        setGoogleLoading(true);
        setError("");

        try {
            await signInWithGoogle();
            // OAuth will redirect, no need to handle here
        } catch (err: any) {
            setError(err.message || "حدث خطأ أثناء التسجيل بـ Google");
            setGoogleLoading(false);
        }
    };

    // Role options
    const roleOptions: { value: UserRole; label: string; icon: React.ReactNode; description: string }[] = [
        {
            value: "student",
            label: "طالب",
            icon: <GraduationCap className="h-5 w-5" />,
            description: "أريد التعلم والمشاركة في الاختبارات",
        },
        {
            value: "teacher",
            label: "مدرس",
            icon: <BookOpen className="h-5 w-5" />,
            description: "أريد إنشاء وإدارة الاختبارات",
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
                <div className="w-full max-w-md">
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
                            <UserPlus className="h-8 w-8 text-white" />
                        </motion.div>

                        {/* Title */}
                        <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900 dark:text-white mb-2">
                            إنشاء حساب جديد ✨
                        </h1>

                        {/* Subtitle */}
                        <p className="text-sm sm:text-base text-gray-600 dark:text-gray-400">
                            انضم إلينا وابدأ رحلة التعلم
                        </p>
                    </motion.div>

                    {/* Form Card */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.15, duration: 0.5 }}
                        className="relative rounded-2xl p-6 sm:p-8 bg-white dark:bg-[#1c1c24] border border-gray-200/60 dark:border-[#2e2e3a] shadow-xl"
                    >
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

                        {/* Success Alert */}
                        <AnimatePresence mode="wait">
                            {success && (
                                <motion.div
                                    initial={{ opacity: 0, y: -10, height: 0 }}
                                    animate={{ opacity: 1, y: 0, height: "auto" }}
                                    exit={{ opacity: 0, y: -10, height: 0 }}
                                    transition={{ duration: 0.3 }}
                                    className="mb-5 p-4 rounded-xl bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800/50 flex items-start gap-3"
                                >
                                    <CheckCircle2 className="h-5 w-5 text-green-600 dark:text-green-400 shrink-0 mt-0.5" />
                                    <p className="text-sm text-green-700 dark:text-green-300 flex-1">{success}</p>
                                </motion.div>
                            )}
                        </AnimatePresence>

                        <form onSubmit={handleSubmit} className="space-y-5">
                            <div className="space-y-4">
                                {/* Role Selector */}
                                <div className="space-y-2">
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                                        نوع الحساب
                                    </label>
                                    <div className="grid grid-cols-2 gap-3">
                                        {roleOptions.map((option) => (
                                            <motion.button
                                                key={option.value}
                                                type="button"
                                                onClick={() => setFormData({ ...formData, role: option.value })}
                                                whileHover={{ scale: 1.02 }}
                                                whileTap={{ scale: 0.98 }}
                                                className={`relative p-4 rounded-xl border-2 transition-all duration-200 text-right ${formData.role === option.value
                                                        ? "border-primary-500 bg-primary-50 dark:bg-primary-900/20"
                                                        : "border-gray-200 dark:border-[#2e2e3a] bg-white dark:bg-[#1c1c24] hover:border-gray-300 dark:hover:border-[#3e3e4a]"
                                                    }`}
                                            >
                                                {formData.role === option.value && (
                                                    <motion.div
                                                        initial={{ scale: 0 }}
                                                        animate={{ scale: 1 }}
                                                        className="absolute top-2 left-2"
                                                    >
                                                        <CheckCircle2 className="h-5 w-5 text-primary-500" />
                                                    </motion.div>
                                                )}
                                                <div className={`inline-flex p-2 rounded-lg mb-2 ${formData.role === option.value
                                                        ? "bg-primary-100 dark:bg-primary-800/30 text-primary-600 dark:text-primary-400"
                                                        : "bg-gray-100 dark:bg-[#252530] text-gray-600 dark:text-gray-400"
                                                    }`}>
                                                    {option.icon}
                                                </div>
                                                <div>
                                                    <p className={`font-semibold ${formData.role === option.value
                                                            ? "text-primary-700 dark:text-primary-300"
                                                            : "text-gray-700 dark:text-gray-300"
                                                        }`}>
                                                        {option.label}
                                                    </p>
                                                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                                                        {option.description}
                                                    </p>
                                                </div>
                                            </motion.button>
                                        ))}
                                    </div>
                                </div>

                                <Input
                                    type="text"
                                    label="الاسم الكامل"
                                    placeholder="أدخل اسمك الكامل"
                                    value={formData.name}
                                    onChange={(e) => {
                                        setFormData({ ...formData, name: e.target.value });
                                        if (errors.name) setErrors({ ...errors, name: "" });
                                    }}
                                    error={errors.name}
                                    icon={<User className="h-5 w-5" />}
                                    autoComplete="name"
                                />

                                <Input
                                    type="email"
                                    label="البريد الإلكتروني"
                                    placeholder="example@email.com"
                                    value={formData.email}
                                    onChange={(e) => {
                                        setFormData({ ...formData, email: e.target.value });
                                        if (errors.email) setErrors({ ...errors, email: "" });
                                    }}
                                    error={errors.email}
                                    icon={<Mail className="h-5 w-5" />}
                                    dir="ltr"
                                    autoComplete="email"
                                />

                                <div className="relative">
                                    <Input
                                        type={showPassword ? "text" : "password"}
                                        label="كلمة المرور"
                                        placeholder="••••••••"
                                        value={formData.password}
                                        onChange={(e) => {
                                            setFormData({ ...formData, password: e.target.value });
                                            if (errors.password) setErrors({ ...errors, password: "" });
                                        }}
                                        error={errors.password}
                                        icon={<Lock className="h-5 w-5" />}
                                        autoComplete="new-password"
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowPassword(!showPassword)}
                                        className="absolute left-4 top-[2.75rem] p-1.5 text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 transition-colors"
                                        aria-label={showPassword ? "إخفاء كلمة المرور" : "إظهار كلمة المرور"}
                                    >
                                        {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                                    </button>
                                </div>

                                {/* Password Strength */}
                                <AnimatePresence>
                                    {formData.password && (
                                        <motion.div
                                            initial={{ opacity: 0, height: 0 }}
                                            animate={{ opacity: 1, height: "auto" }}
                                            exit={{ opacity: 0, height: 0 }}
                                            transition={{ duration: 0.3 }}
                                            className="space-y-3 p-4 rounded-xl bg-gray-50 dark:bg-[#252530] border border-gray-200/60 dark:border-[#2e2e3a]"
                                        >
                                            {/* Strength Bar */}
                                            <div>
                                                <div className="flex items-center justify-between mb-1.5">
                                                    <span className="text-xs font-medium text-gray-700 dark:text-gray-300">
                                                        قوة كلمة المرور
                                                    </span>
                                                    {passwordStrength.label && (
                                                        <span className={`text-xs font-semibold ${passwordStrength.color.replace('bg-', 'text-')}`}>
                                                            {passwordStrength.label}
                                                        </span>
                                                    )}
                                                </div>
                                                <div className="w-full h-2 bg-gray-200 dark:bg-[#2e2e3a] rounded-full overflow-hidden">
                                                    <motion.div
                                                        initial={{ width: 0 }}
                                                        animate={{ width: `${passwordStrength.strength}%` }}
                                                        transition={{ duration: 0.3 }}
                                                        className={`h-full ${passwordStrength.color} transition-colors`}
                                                    />
                                                </div>
                                            </div>

                                            {/* Requirements */}
                                            <div className="grid grid-cols-2 gap-2">
                                                {passwordRequirements.map((req) => (
                                                    <div key={req.key} className="flex items-center gap-2 text-sm">
                                                        <CheckCircle2
                                                            className={`h-4 w-4 transition-colors ${req.met ? "text-green-500" : "text-gray-300 dark:text-gray-600"
                                                                }`}
                                                        />
                                                        <span className={`transition-colors ${req.met ? "text-green-600 dark:text-green-400 font-medium" : "text-gray-500 dark:text-gray-400"
                                                            }`}>
                                                            {req.text}
                                                        </span>
                                                    </div>
                                                ))}
                                            </div>
                                        </motion.div>
                                    )}
                                </AnimatePresence>

                                <div className="relative">
                                    <Input
                                        type={showConfirmPassword ? "text" : "password"}
                                        label="تأكيد كلمة المرور"
                                        placeholder="••••••••"
                                        value={formData.confirmPassword}
                                        onChange={(e) => {
                                            setFormData({ ...formData, confirmPassword: e.target.value });
                                            if (errors.confirmPassword) setErrors({ ...errors, confirmPassword: "" });
                                        }}
                                        error={errors.confirmPassword}
                                        icon={<Lock className="h-5 w-5" />}
                                        autoComplete="new-password"
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                        className="absolute left-4 top-[2.75rem] p-1.5 text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 transition-colors"
                                        aria-label={showConfirmPassword ? "إخفاء كلمة المرور" : "إظهار كلمة المرور"}
                                    >
                                        {showConfirmPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                                    </button>
                                </div>
                            </div>

                            {/* Terms */}
                            <div className="flex items-start gap-2">
                                <input
                                    type="checkbox"
                                    id="terms"
                                    className="mt-1 w-4 h-4 rounded border-gray-300 dark:border-gray-600 text-primary-600 focus:ring-2 focus:ring-primary-500/20 focus:ring-offset-0 transition-all"
                                />
                                <label htmlFor="terms" className="text-sm text-gray-600 dark:text-gray-400 cursor-pointer leading-relaxed">
                                    أوافق على{" "}
                                    <Link href="/terms" className="text-primary-600 dark:text-primary-400 hover:underline font-medium">
                                        الشروط والأحكام
                                    </Link>{" "}
                                    و{" "}
                                    <Link href="/privacy" className="text-primary-600 dark:text-primary-400 hover:underline font-medium">
                                        سياسة الخصوصية
                                    </Link>
                                </label>
                            </div>

                            <Button
                                type="submit"
                                fullWidth
                                isLoading={isLoading}
                                disabled={isLoading || googleLoading}
                            >
                                إنشاء الحساب
                            </Button>
                        </form>

                        {/* Divider */}
                        <div className="relative my-6">
                            <div className="absolute inset-0 flex items-center">
                                <div className="w-full border-t border-gray-200 dark:border-[#2e2e3a]"></div>
                            </div>
                            <div className="relative flex justify-center text-sm">
                                <span className="px-4 bg-white dark:bg-[#1c1c24] text-gray-500 dark:text-gray-400 font-medium">
                                    أو
                                </span>
                            </div>
                        </div>

                        {/* Google Sign Up */}
                        <motion.button
                            type="button"
                            onClick={handleGoogleSignIn}
                            disabled={isLoading || googleLoading}
                            whileHover={{ scale: 1.01 }}
                            whileTap={{ scale: 0.99 }}
                            className="w-full flex items-center justify-center gap-3 px-4 py-3.5 rounded-xl border-2 border-gray-200 dark:border-[#2e2e3a] bg-white dark:bg-[#1c1c24] hover:bg-gray-50 dark:hover:bg-[#252530] hover:border-gray-300 dark:hover:border-[#3e3e4a] transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            <svg className="w-5 h-5" viewBox="0 0 24 24">
                                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                            </svg>
                            <span className="text-gray-700 dark:text-gray-300 font-semibold">
                                {googleLoading ? "جاري التسجيل..." : "التسجيل بـ Google"}
                            </span>
                        </motion.button>
                    </motion.div>

                    {/* Login Link */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.3 }}
                        className="mt-6 text-center"
                    >
                        <p className="text-gray-600 dark:text-gray-400 text-sm">
                            لديك حساب بالفعل؟{" "}
                            <Link
                                href="/login"
                                className="text-primary-600 dark:text-primary-400 font-semibold hover:text-primary-700 dark:hover:text-primary-300 hover:underline inline-flex items-center gap-1.5 transition-colors group"
                            >
                                تسجيل الدخول
                                <ArrowLeft className="h-4 w-4 group-hover:-translate-x-1 transition-transform" />
                            </Link>
                        </p>
                    </motion.div>
                </div>
            </main>

            <Footer />
        </div>
    );
}
