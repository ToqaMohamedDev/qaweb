'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
    MessageSquare,
    Star,
    Send,
    CheckCircle2,
    Clock,
    XCircle,
    ArrowRight,
} from 'lucide-react';
import Link from 'next/link';
import { useAuthStore } from '@/lib/stores/useAuthStore';

// =============================================
// Types
// =============================================

interface ExistingTestimonial {
    id: string;
    content: string;
    rating: number;
    status: 'pending' | 'approved' | 'rejected';
    created_at: string;
}

// =============================================
// Component
// =============================================

export default function TestimonialPage() {
    const { user } = useAuthStore();
    const [content, setContent] = useState('');
    const [rating, setRating] = useState(5);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState(false);
    const [existingTestimonial, setExistingTestimonial] = useState<ExistingTestimonial | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    // Check for existing testimonial
    useEffect(() => {
        const checkExisting = async () => {
            if (!user) {
                setIsLoading(false);
                return;
            }

            try {
                const res = await fetch('/api/testimonials/my');
                if (res.ok) {
                    const result = await res.json();
                    if (result.data) {
                        setExistingTestimonial(result.data);
                    }
                }
            } catch {
                // No existing testimonial
            } finally {
                setIsLoading(false);
            }
        };

        checkExisting();
    }, [user]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);
        setIsSubmitting(true);

        try {
            const res = await fetch('/api/testimonials', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ content, rating }),
            });

            const result = await res.json();

            if (!res.ok) {
                throw new Error(result.error || 'فشل في إرسال الرأي');
            }

            setSuccess(true);
            setExistingTestimonial(result.data);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'حدث خطأ');
        } finally {
            setIsSubmitting(false);
        }
    };

    const getStatusInfo = (status: string) => {
        switch (status) {
            case 'pending':
                return {
                    icon: Clock,
                    color: 'text-yellow-500',
                    bg: 'bg-yellow-100 dark:bg-yellow-900/30',
                    text: 'قيد المراجعة',
                    description: 'رأيك قيد المراجعة من قبل الإدارة وسيتم عرضه بعد الموافقة عليه.',
                };
            case 'approved':
                return {
                    icon: CheckCircle2,
                    color: 'text-green-500',
                    bg: 'bg-green-100 dark:bg-green-900/30',
                    text: 'تم القبول',
                    description: 'رأيك معتمد ويُعرض الآن في الصفحة الرئيسية. شكراً لمشاركتك!',
                };
            case 'rejected':
                return {
                    icon: XCircle,
                    color: 'text-red-500',
                    bg: 'bg-red-100 dark:bg-red-900/30',
                    text: 'مرفوض',
                    description: 'للأسف تم رفض رأيك. يمكنك إرسال رأي جديد.',
                };
            default:
                return null;
        }
    };

    if (!user) {
        return (
            <div className="max-w-2xl mx-auto p-6" dir="rtl">
                <div className="text-center py-12 bg-white dark:bg-[#1a1a1a] rounded-2xl border border-gray-200 dark:border-gray-700">
                    <MessageSquare className="h-16 w-16 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
                    <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
                        يجب تسجيل الدخول
                    </h2>
                    <p className="text-gray-500 dark:text-gray-400 mb-6">
                        قم بتسجيل الدخول لمشاركة رأيك معنا
                    </p>
                    <Link
                        href="/login"
                        className="inline-flex items-center gap-2 px-6 py-3 bg-primary-500 text-white rounded-xl hover:bg-primary-600 transition-colors font-medium"
                    >
                        تسجيل الدخول
                        <ArrowRight className="h-4 w-4" />
                    </Link>
                </div>
            </div>
        );
    }

    if (isLoading) {
        return (
            <div className="max-w-2xl mx-auto p-6 flex items-center justify-center min-h-[400px]">
                <div className="animate-spin rounded-full h-12 w-12 border-4 border-primary-500 border-t-transparent" />
            </div>
        );
    }

    // Show existing testimonial status
    if (existingTestimonial && !success) {
        const statusInfo = getStatusInfo(existingTestimonial.status);

        return (
            <div className="max-w-2xl mx-auto p-6" dir="rtl">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-white dark:bg-[#1a1a1a] rounded-2xl border border-gray-200 dark:border-gray-700 p-8"
                >
                    {/* Header */}
                    <div className="text-center mb-8">
                        <div className={`inline-flex items-center justify-center w-16 h-16 rounded-full ${statusInfo?.bg} mb-4`}>
                            {statusInfo && <statusInfo.icon className={`h-8 w-8 ${statusInfo.color}`} />}
                        </div>
                        <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                            {statusInfo?.text}
                        </h1>
                        <p className="text-gray-500 dark:text-gray-400">
                            {statusInfo?.description}
                        </p>
                    </div>

                    {/* Existing testimonial */}
                    <div className="bg-gray-50 dark:bg-[#252525] rounded-xl p-6 mb-6">
                        <div className="flex gap-1 mb-3">
                            {Array.from({ length: 5 }).map((_, i) => (
                                <Star
                                    key={i}
                                    className={`h-5 w-5 ${i < existingTestimonial.rating
                                        ? 'fill-amber-400 text-amber-400'
                                        : 'text-gray-300 dark:text-gray-600'
                                        }`}
                                />
                            ))}
                        </div>
                        <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
                            &quot;{existingTestimonial.content}&quot;
                        </p>
                        <p className="text-xs text-gray-400 mt-4">
                            {new Date(existingTestimonial.created_at).toLocaleDateString('ar-EG', {
                                year: 'numeric',
                                month: 'long',
                                day: 'numeric',
                            })}
                        </p>
                    </div>

                    <Link
                        href="/profile"
                        className="flex items-center justify-center gap-2 w-full py-3 bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded-xl hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors font-medium"
                    >
                        <ArrowRight className="h-4 w-4" />
                        العودة للملف الشخصي
                    </Link>
                </motion.div>
            </div>
        );
    }

    // Success state
    if (success) {
        return (
            <div className="max-w-2xl mx-auto p-6" dir="rtl">
                <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="bg-white dark:bg-[#1a1a1a] rounded-2xl border border-gray-200 dark:border-gray-700 p-8 text-center"
                >
                    <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-green-100 dark:bg-green-900/30 mb-6">
                        <CheckCircle2 className="h-10 w-10 text-green-500" />
                    </div>
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-3">
                        شكراً لمشاركتك!
                    </h1>
                    <p className="text-gray-500 dark:text-gray-400 mb-8">
                        تم إرسال رأيك بنجاح وسيتم مراجعته من قبل الإدارة قريباً.
                    </p>
                    <Link
                        href="/profile"
                        className="inline-flex items-center gap-2 px-6 py-3 bg-primary-500 text-white rounded-xl hover:bg-primary-600 transition-colors font-medium"
                    >
                        <ArrowRight className="h-4 w-4" />
                        العودة للملف الشخصي
                    </Link>
                </motion.div>
            </div>
        );
    }

    // Form
    return (
        <div className="max-w-2xl mx-auto p-6" dir="rtl">
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white dark:bg-[#1a1a1a] rounded-2xl border border-gray-200 dark:border-gray-700 p-8"
            >
                {/* Header */}
                <div className="text-center mb-8">
                    <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-amber-100 dark:bg-amber-900/30 mb-4">
                        <MessageSquare className="h-8 w-8 text-amber-500" />
                    </div>
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                        شاركنا رأيك
                    </h1>
                    <p className="text-gray-500 dark:text-gray-400">
                        نحب أن نسمع تجربتك مع المنصة
                    </p>
                </div>

                {/* Error */}
                {error && (
                    <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl text-red-700 dark:text-red-400 text-sm">
                        {error}
                    </div>
                )}

                {/* Form */}
                <form onSubmit={handleSubmit} className="space-y-6">
                    {/* Rating */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                            تقييمك للمنصة
                        </label>
                        <div className="flex gap-2 justify-center">
                            {[1, 2, 3, 4, 5].map((value) => (
                                <button
                                    key={value}
                                    type="button"
                                    onClick={() => setRating(value)}
                                    className="p-2 transition-transform hover:scale-110"
                                >
                                    <Star
                                        className={`h-8 w-8 ${value <= rating
                                            ? 'fill-amber-400 text-amber-400'
                                            : 'text-gray-300 dark:text-gray-600 hover:text-amber-300'
                                            } transition-colors`}
                                    />
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Content */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                            رأيك
                        </label>
                        <textarea
                            value={content}
                            onChange={(e) => setContent(e.target.value)}
                            placeholder="اكتب رأيك وتجربتك مع المنصة..."
                            rows={5}
                            className="w-full px-4 py-3 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-[#252525] text-gray-900 dark:text-white placeholder-gray-400 focus:ring-2 focus:ring-primary-500 focus:border-transparent resize-none transition-colors"
                            required
                            minLength={10}
                            maxLength={500}
                        />
                        <p className="text-xs text-gray-400 mt-2 text-left">
                            {content.length}/500
                        </p>
                    </div>

                    {/* Submit */}
                    <button
                        type="submit"
                        disabled={isSubmitting || content.length < 10}
                        className="w-full flex items-center justify-center gap-2 py-4 bg-gradient-to-r from-amber-500 to-orange-500 text-white rounded-xl hover:from-amber-600 hover:to-orange-600 transition-all font-bold text-lg disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {isSubmitting ? (
                            <>
                                <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent" />
                                جاري الإرسال...
                            </>
                        ) : (
                            <>
                                <Send className="h-5 w-5" />
                                إرسال الرأي
                            </>
                        )}
                    </button>

                    <p className="text-xs text-gray-400 text-center">
                        سيتم مراجعة رأيك من قبل الإدارة قبل نشره
                    </p>
                </form>
            </motion.div>
        </div>
    );
}
