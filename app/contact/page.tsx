"use client";

/**
 * Contact Us Page - صفحة اتصل بنا
 * 
 * Allows users to send messages via the contact form.
 * Uses the messages table from the database.
 */

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import {
    Mail,
    Phone,
    MapPin,
    Send,
    MessageSquare,
    Clock,
    CheckCircle2,
    Loader2,
    Sparkles,
    HeadphonesIcon,
    ArrowLeft,
    User,
    AtSign,
    FileText,
    AlertCircle,
} from "lucide-react";
import { sendMessage } from "@/lib/services/message.service";
import { useAuth } from "@/hooks/useAuth";
import Link from "next/link";

// ==========================================
// Types
// ==========================================
interface FormData {
    name: string;
    email: string;
    subject: string;
    message: string;
}

interface FormErrors {
    name?: string;
    email?: string;
    subject?: string;
    message?: string;
}

// ==========================================
// Contact Info Data
// ==========================================
const contactInfo = [
    {
        icon: Mail,
        title: "البريد الإلكتروني",
        value: "contact@qaalaa.com",
        href: "mailto:contact@qaalaa.com",
        color: "from-blue-500 to-cyan-500",
    },
    {
        icon: Phone,
        title: "رقم الهاتف",
        value: "+20 123 456 7890",
        href: "tel:+201234567890",
        color: "from-green-500 to-emerald-500",
    },
    {
        icon: MapPin,
        title: "الموقع",
        value: "القاهرة، مصر",
        href: "#",
        color: "from-orange-500 to-red-500",
    },
    {
        icon: Clock,
        title: "ساعات العمل",
        value: "السبت - الخميس: 9 ص - 5 م",
        href: "#",
        color: "from-purple-500 to-pink-500",
    },
];

// ==========================================
// FAQ Data
// ==========================================
const faqs = [
    {
        question: "كيف يمكنني التسجيل كمعلم؟",
        answer: "يمكنك التسجيل كمعلم من خلال إنشاء حساب جديد ثم الانتقال إلى إعدادات الملف الشخصي واختيار 'أريد أن أكون معلم'.",
    },
    {
        question: "هل الاشتراك في المنصة مجاني؟",
        answer: "نعم، الاشتراك في المنصة مجاني تماماً للطلاب. يمكنك الوصول إلى الدروس والاختبارات المجانية.",
    },
    {
        question: "كيف يمكنني متابعة تقدمي؟",
        answer: "يمكنك متابعة تقدمك من خلال صفحة الملف الشخصي، حيث ستجد إحصائيات مفصلة عن الدروس والاختبارات.",
    },
];

// ==========================================
// Main Component
// ==========================================
export default function ContactPage() {
    const { user, profile } = useAuth();
    const [formData, setFormData] = useState<FormData>({
        name: "",
        email: "",
        subject: "",
        message: "",
    });
    const [errors, setErrors] = useState<FormErrors>({});
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isSuccess, setIsSuccess] = useState(false);
    const [submitError, setSubmitError] = useState<string | null>(null);

    // Pre-fill form with user data if logged in
    useEffect(() => {
        if (user && profile) {
            setFormData(prev => ({
                ...prev,
                name: profile.name || "",
                email: user.email || "",
            }));
        }
    }, [user, profile]);

    // Validate form
    const validateForm = (): boolean => {
        const newErrors: FormErrors = {};

        if (!formData.name.trim()) {
            newErrors.name = "الاسم مطلوب";
        }

        if (!formData.email.trim()) {
            newErrors.email = "البريد الإلكتروني مطلوب";
        } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
            newErrors.email = "البريد الإلكتروني غير صحيح";
        }

        if (!formData.subject.trim()) {
            newErrors.subject = "الموضوع مطلوب";
        }

        if (!formData.message.trim()) {
            newErrors.message = "الرسالة مطلوبة";
        } else if (formData.message.length < 10) {
            newErrors.message = "الرسالة يجب أن تكون 10 أحرف على الأقل";
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    // Handle form submission
    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSubmitError(null);

        if (!validateForm()) return;

        setIsSubmitting(true);

        try {
            await sendMessage({
                fromName: formData.name,
                fromEmail: formData.email,
                subject: formData.subject,
                message: formData.message,
                fromUserId: user?.id,
            });

            setIsSuccess(true);
            setFormData({
                name: user ? (profile?.name || "") : "",
                email: user?.email || "",
                subject: "",
                message: "",
            });
        } catch (error) {
            console.error("Error sending message:", error);
            setSubmitError("حدث خطأ أثناء إرسال الرسالة. يرجى المحاولة مرة أخرى.");
        } finally {
            setIsSubmitting(false);
        }
    };

    // Handle input change
    const handleChange = (
        e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
    ) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
        // Clear error when user types
        if (errors[name as keyof FormErrors]) {
            setErrors(prev => ({ ...prev, [name]: undefined }));
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-100 dark:from-[#0a0f1a] dark:via-[#0f172a] dark:to-[#0a0f1a]" dir="rtl">
            <Navbar />

            {/* Hero Section */}
            <section className="relative pt-32 pb-16 overflow-hidden">
                {/* Background Decoration */}
                <div className="absolute inset-0 pointer-events-none">
                    <div className="absolute top-20 left-10 w-72 h-72 bg-primary-400/10 dark:bg-primary-500/5 rounded-full blur-3xl" />
                    <div className="absolute bottom-10 right-10 w-96 h-96 bg-cyan-400/10 dark:bg-cyan-500/5 rounded-full blur-3xl" />
                </div>

                <div className="container mx-auto px-4 max-w-6xl relative z-10">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="text-center mb-12"
                    >
                        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary-100 dark:bg-primary-900/30 text-primary-600 dark:text-primary-400 text-sm font-medium mb-6">
                            <MessageSquare className="w-4 h-4" />
                            <span>نحن هنا لمساعدتك</span>
                        </div>
                        <h1 className="text-4xl md:text-5xl font-bold text-gray-900 dark:text-white mb-4">
                            تواصل <span className="gradient-text">معنا</span>
                        </h1>
                        <p className="text-lg text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
                            لديك سؤال أو استفسار؟ نحن دائماً سعداء بالاستماع إليك ومساعدتك
                        </p>
                    </motion.div>

                    {/* Contact Info Cards */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.1 }}
                        className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-16"
                    >
                        {contactInfo.map((info, index) => (
                            <motion.a
                                key={info.title}
                                href={info.href}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.1 + index * 0.05 }}
                                whileHover={{ scale: 1.02, y: -2 }}
                                className="group p-4 rounded-2xl bg-white dark:bg-[#0f172a]/80 border border-gray-100 dark:border-gray-800 hover:border-primary-500/30 dark:hover:border-primary-500/30 transition-all shadow-sm hover:shadow-lg"
                            >
                                <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${info.color} flex items-center justify-center mb-3`}>
                                    <info.icon className="w-6 h-6 text-white" />
                                </div>
                                <h3 className="font-semibold text-gray-900 dark:text-white mb-1 text-sm">
                                    {info.title}
                                </h3>
                                <p className="text-gray-600 dark:text-gray-400 text-xs">
                                    {info.value}
                                </p>
                            </motion.a>
                        ))}
                    </motion.div>

                    {/* Main Content */}
                    <div className="grid lg:grid-cols-5 gap-8">
                        {/* Contact Form */}
                        <motion.div
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: 0.2 }}
                            className="lg:col-span-3"
                        >
                            <div className="bg-white dark:bg-[#0f172a]/80 rounded-3xl border border-gray-100 dark:border-gray-800 p-6 md:p-8 shadow-lg">
                                <div className="flex items-center gap-3 mb-6">
                                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary-500 to-primary-600 flex items-center justify-center">
                                        <Send className="w-6 h-6 text-white" />
                                    </div>
                                    <div>
                                        <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                                            أرسل رسالتك
                                        </h2>
                                        <p className="text-sm text-gray-500 dark:text-gray-400">
                                            سنرد عليك في أقرب وقت ممكن
                                        </p>
                                    </div>
                                </div>

                                <AnimatePresence mode="wait">
                                    {isSuccess ? (
                                        <motion.div
                                            key="success"
                                            initial={{ opacity: 0, scale: 0.9 }}
                                            animate={{ opacity: 1, scale: 1 }}
                                            exit={{ opacity: 0, scale: 0.9 }}
                                            className="text-center py-12"
                                        >
                                            <div className="w-20 h-20 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center mx-auto mb-4">
                                                <CheckCircle2 className="w-10 h-10 text-green-500" />
                                            </div>
                                            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
                                                تم إرسال رسالتك بنجاح!
                                            </h3>
                                            <p className="text-gray-600 dark:text-gray-400 mb-6">
                                                شكراً لتواصلك معنا. سنرد عليك قريباً.
                                            </p>
                                            <button
                                                onClick={() => setIsSuccess(false)}
                                                className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-primary-500 hover:bg-primary-600 text-white font-medium transition-colors"
                                            >
                                                <ArrowLeft className="w-4 h-4" />
                                                إرسال رسالة أخرى
                                            </button>
                                        </motion.div>
                                    ) : (
                                        <motion.form
                                            key="form"
                                            initial={{ opacity: 0 }}
                                            animate={{ opacity: 1 }}
                                            exit={{ opacity: 0 }}
                                            onSubmit={handleSubmit}
                                            className="space-y-5"
                                        >
                                            {/* Error Alert */}
                                            {submitError && (
                                                <motion.div
                                                    initial={{ opacity: 0, y: -10 }}
                                                    animate={{ opacity: 1, y: 0 }}
                                                    className="p-4 rounded-xl bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 flex items-center gap-3"
                                                >
                                                    <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0" />
                                                    <p className="text-red-700 dark:text-red-400 text-sm">
                                                        {submitError}
                                                    </p>
                                                </motion.div>
                                            )}

                                            {/* Name & Email Row */}
                                            <div className="grid md:grid-cols-2 gap-4">
                                                {/* Name */}
                                                <div>
                                                    <label className="flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                                        <User className="w-4 h-4" />
                                                        الاسم الكامل
                                                    </label>
                                                    <input
                                                        type="text"
                                                        name="name"
                                                        value={formData.name}
                                                        onChange={handleChange}
                                                        placeholder="أدخل اسمك"
                                                        className={`w-full px-4 py-3 rounded-xl bg-gray-50 dark:bg-[#1e293b] border ${errors.name
                                                                ? "border-red-500"
                                                                : "border-gray-200 dark:border-gray-700"
                                                            } focus:border-primary-500 dark:focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 outline-none transition-all text-gray-900 dark:text-white placeholder-gray-400`}
                                                    />
                                                    {errors.name && (
                                                        <p className="mt-1 text-sm text-red-500">{errors.name}</p>
                                                    )}
                                                </div>

                                                {/* Email */}
                                                <div>
                                                    <label className="flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                                        <AtSign className="w-4 h-4" />
                                                        البريد الإلكتروني
                                                    </label>
                                                    <input
                                                        type="email"
                                                        name="email"
                                                        value={formData.email}
                                                        onChange={handleChange}
                                                        placeholder="example@email.com"
                                                        dir="ltr"
                                                        className={`w-full px-4 py-3 rounded-xl bg-gray-50 dark:bg-[#1e293b] border ${errors.email
                                                                ? "border-red-500"
                                                                : "border-gray-200 dark:border-gray-700"
                                                            } focus:border-primary-500 dark:focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 outline-none transition-all text-gray-900 dark:text-white placeholder-gray-400`}
                                                    />
                                                    {errors.email && (
                                                        <p className="mt-1 text-sm text-red-500">{errors.email}</p>
                                                    )}
                                                </div>
                                            </div>

                                            {/* Subject */}
                                            <div>
                                                <label className="flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                                    <FileText className="w-4 h-4" />
                                                    الموضوع
                                                </label>
                                                <select
                                                    name="subject"
                                                    value={formData.subject}
                                                    onChange={handleChange}
                                                    className={`w-full px-4 py-3 rounded-xl bg-gray-50 dark:bg-[#1e293b] border ${errors.subject
                                                            ? "border-red-500"
                                                            : "border-gray-200 dark:border-gray-700"
                                                        } focus:border-primary-500 dark:focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 outline-none transition-all text-gray-900 dark:text-white`}
                                                >
                                                    <option value="">اختر موضوع الرسالة</option>
                                                    <option value="استفسار عام">استفسار عام</option>
                                                    <option value="مشكلة تقنية">مشكلة تقنية</option>
                                                    <option value="اقتراح أو ملاحظة">اقتراح أو ملاحظة</option>
                                                    <option value="شكوى">شكوى</option>
                                                    <option value="طلب شراكة">طلب شراكة</option>
                                                    <option value="أخرى">أخرى</option>
                                                </select>
                                                {errors.subject && (
                                                    <p className="mt-1 text-sm text-red-500">{errors.subject}</p>
                                                )}
                                            </div>

                                            {/* Message */}
                                            <div>
                                                <label className="flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                                    <MessageSquare className="w-4 h-4" />
                                                    رسالتك
                                                </label>
                                                <textarea
                                                    name="message"
                                                    value={formData.message}
                                                    onChange={handleChange}
                                                    placeholder="اكتب رسالتك هنا..."
                                                    rows={5}
                                                    className={`w-full px-4 py-3 rounded-xl bg-gray-50 dark:bg-[#1e293b] border ${errors.message
                                                            ? "border-red-500"
                                                            : "border-gray-200 dark:border-gray-700"
                                                        } focus:border-primary-500 dark:focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 outline-none transition-all text-gray-900 dark:text-white placeholder-gray-400 resize-none`}
                                                />
                                                {errors.message && (
                                                    <p className="mt-1 text-sm text-red-500">{errors.message}</p>
                                                )}
                                            </div>

                                            {/* Submit Button */}
                                            <motion.button
                                                type="submit"
                                                disabled={isSubmitting}
                                                whileHover={{ scale: 1.01 }}
                                                whileTap={{ scale: 0.99 }}
                                                className="w-full py-4 rounded-xl bg-gradient-to-r from-primary-500 to-primary-600 hover:from-primary-600 hover:to-primary-700 text-white font-semibold flex items-center justify-center gap-2 shadow-lg shadow-primary-500/25 disabled:opacity-70 disabled:cursor-not-allowed transition-all"
                                            >
                                                {isSubmitting ? (
                                                    <>
                                                        <Loader2 className="w-5 h-5 animate-spin" />
                                                        جاري الإرسال...
                                                    </>
                                                ) : (
                                                    <>
                                                        <Send className="w-5 h-5" />
                                                        إرسال الرسالة
                                                    </>
                                                )}
                                            </motion.button>
                                        </motion.form>
                                    )}
                                </AnimatePresence>
                            </div>
                        </motion.div>

                        {/* Sidebar */}
                        <motion.div
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: 0.3 }}
                            className="lg:col-span-2 space-y-6"
                        >
                            {/* Support Chat CTA */}
                            <div className="bg-gradient-to-br from-primary-500 to-primary-600 rounded-3xl p-6 text-white">
                                <div className="w-14 h-14 rounded-2xl bg-white/20 flex items-center justify-center mb-4">
                                    <HeadphonesIcon className="w-7 h-7" />
                                </div>
                                <h3 className="text-lg font-bold mb-2">تحتاج مساعدة فورية؟</h3>
                                <p className="text-white/80 text-sm mb-4">
                                    تواصل مع فريق الدعم مباشرة عبر الدردشة الحية
                                </p>
                                <Link
                                    href="/support"
                                    className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-white text-primary-600 font-medium hover:bg-white/90 transition-colors"
                                >
                                    <MessageSquare className="w-4 h-4" />
                                    بدء المحادثة
                                </Link>
                            </div>

                            {/* FAQs */}
                            <div className="bg-white dark:bg-[#0f172a]/80 rounded-3xl border border-gray-100 dark:border-gray-800 p-6">
                                <div className="flex items-center gap-3 mb-5">
                                    <div className="w-10 h-10 rounded-xl bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center">
                                        <Sparkles className="w-5 h-5 text-amber-500" />
                                    </div>
                                    <h3 className="font-bold text-gray-900 dark:text-white">
                                        الأسئلة الشائعة
                                    </h3>
                                </div>
                                <div className="space-y-4">
                                    {faqs.map((faq, index) => (
                                        <div
                                            key={index}
                                            className="p-4 rounded-xl bg-gray-50 dark:bg-[#1e293b]/50"
                                        >
                                            <h4 className="font-medium text-gray-900 dark:text-white mb-1 text-sm">
                                                {faq.question}
                                            </h4>
                                            <p className="text-gray-600 dark:text-gray-400 text-xs leading-relaxed">
                                                {faq.answer}
                                            </p>
                                        </div>
                                    ))}
                                </div>
                                <Link
                                    href="/faq"
                                    className="inline-flex items-center gap-2 mt-4 text-primary-500 hover:text-primary-600 text-sm font-medium"
                                >
                                    عرض جميع الأسئلة
                                    <ArrowLeft className="w-4 h-4" />
                                </Link>
                            </div>
                        </motion.div>
                    </div>
                </div>
            </section>

            <Footer />
        </div>
    );
}
