'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    MessageSquare,
    Star,
    Check,
    X,
    Trash2,
    Clock,
    CheckCircle2,
    XCircle,
    RefreshCw,
    User,
} from 'lucide-react';

// =============================================
// Types
// =============================================

interface Profile {
    id: string;
    name: string;
    email: string;
    avatar_url: string | null;
    role: string;
}

interface Testimonial {
    id: string;
    user_id: string;
    content: string;
    rating: number;
    status: 'pending' | 'approved' | 'rejected';
    admin_notes: string | null;
    reviewed_by: string | null;
    reviewed_at: string | null;
    created_at: string;
    profiles: Profile;
    reviewer: { id: string; name: string } | null;
}

type StatusFilter = 'all' | 'pending' | 'approved' | 'rejected';

// =============================================
// Component
// =============================================

export default function AdminTestimonialsPage() {
    const [testimonials, setTestimonials] = useState<Testimonial[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [statusFilter, setStatusFilter] = useState<StatusFilter>('pending');
    const [processingId, setProcessingId] = useState<string | null>(null);

    const fetchTestimonials = useCallback(async () => {
        setIsLoading(true);
        setError(null);
        try {
            const res = await fetch(`/api/admin/testimonials?status=${statusFilter}`);
            const result = await res.json();

            if (!res.ok) {
                throw new Error(result.error || 'فشل في جلب الآراء');
            }

            setTestimonials(result.data || []);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'حدث خطأ');
        } finally {
            setIsLoading(false);
        }
    }, [statusFilter]);

    useEffect(() => {
        fetchTestimonials();
    }, [fetchTestimonials]);

    const handleStatusChange = async (id: string, status: 'approved' | 'rejected', adminNotes?: string) => {
        setProcessingId(id);
        try {
            const res = await fetch('/api/admin/testimonials', {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ id, status, admin_notes: adminNotes }),
            });

            const result = await res.json();

            if (!res.ok) {
                throw new Error(result.error || 'فشل في تحديث الحالة');
            }

            // Remove from list if we're filtering
            if (statusFilter !== 'all') {
                setTestimonials(prev => prev.filter(t => t.id !== id));
            } else {
                setTestimonials(prev =>
                    prev.map(t => t.id === id ? { ...t, status } : t)
                );
            }
        } catch (err) {
            setError(err instanceof Error ? err.message : 'حدث خطأ');
        } finally {
            setProcessingId(null);
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm('هل أنت متأكد من حذف هذا الرأي؟')) return;

        setProcessingId(id);
        try {
            const res = await fetch(`/api/admin/testimonials?id=${id}`, {
                method: 'DELETE',
            });

            const result = await res.json();

            if (!res.ok) {
                throw new Error(result.error || 'فشل في حذف الرأي');
            }

            setTestimonials(prev => prev.filter(t => t.id !== id));
        } catch (err) {
            setError(err instanceof Error ? err.message : 'حدث خطأ');
        } finally {
            setProcessingId(null);
        }
    };

    const getStatusBadge = (status: string) => {
        switch (status) {
            case 'pending':
                return (
                    <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400 text-xs font-medium">
                        <Clock className="h-3 w-3" />
                        قيد المراجعة
                    </span>
                );
            case 'approved':
                return (
                    <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 text-xs font-medium">
                        <CheckCircle2 className="h-3 w-3" />
                        معتمد
                    </span>
                );
            case 'rejected':
                return (
                    <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 text-xs font-medium">
                        <XCircle className="h-3 w-3" />
                        مرفوض
                    </span>
                );
            default:
                return null;
        }
    };

    return (
        <div className="max-w-5xl mx-auto space-y-6" dir="rtl">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-3">
                        <MessageSquare className="h-7 w-7 text-amber-500" />
                        إدارة آراء الطلاب
                    </h1>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                        مراجعة واعتماد آراء الطلاب للعرض في الصفحة الرئيسية
                    </p>
                </div>

                <button
                    onClick={fetchTestimonials}
                    disabled={isLoading}
                    className="flex items-center gap-2 px-4 py-2 bg-primary-500 text-white rounded-lg hover:bg-primary-600 transition-colors disabled:opacity-50"
                >
                    <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
                    تحديث
                </button>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                {(['all', 'pending', 'approved', 'rejected'] as StatusFilter[]).map((status) => {
                    const count = status === 'all'
                        ? testimonials.length
                        : testimonials.filter(t => t.status === status).length;
                    const isActive = statusFilter === status;

                    const icons = {
                        all: MessageSquare,
                        pending: Clock,
                        approved: CheckCircle2,
                        rejected: XCircle,
                    };
                    const Icon = icons[status];

                    const colors = {
                        all: 'text-gray-600 bg-gray-100 dark:bg-gray-800',
                        pending: 'text-yellow-600 bg-yellow-100 dark:bg-yellow-900/30',
                        approved: 'text-green-600 bg-green-100 dark:bg-green-900/30',
                        rejected: 'text-red-600 bg-red-100 dark:bg-red-900/30',
                    };

                    const labels = {
                        all: 'الكل',
                        pending: 'قيد المراجعة',
                        approved: 'معتمد',
                        rejected: 'مرفوض',
                    };

                    return (
                        <button
                            key={status}
                            onClick={() => setStatusFilter(status)}
                            className={`p-4 rounded-xl border-2 transition-all ${isActive
                                ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20'
                                : 'border-gray-200 dark:border-gray-700 hover:border-gray-300'
                                }`}
                        >
                            <div className="flex items-center gap-3">
                                <div className={`p-2 rounded-lg ${colors[status]}`}>
                                    <Icon className="h-5 w-5" />
                                </div>
                                <div className="text-right">
                                    <p className="text-2xl font-bold text-gray-900 dark:text-white">{count}</p>
                                    <p className="text-xs text-gray-500">{labels[status]}</p>
                                </div>
                            </div>
                        </button>
                    );
                })}
            </div>

            {/* Error */}
            {error && (
                <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl text-red-700 dark:text-red-400"
                >
                    {error}
                </motion.div>
            )}

            {/* Testimonials List */}
            <div className="space-y-4">
                {isLoading ? (
                    <div className="flex items-center justify-center py-12">
                        <RefreshCw className="h-8 w-8 text-primary-500 animate-spin" />
                    </div>
                ) : testimonials.length === 0 ? (
                    <div className="text-center py-12 bg-white dark:bg-[#1a1a1a] rounded-xl border border-gray-200 dark:border-gray-700">
                        <MessageSquare className="h-12 w-12 text-gray-300 dark:text-gray-600 mx-auto mb-3" />
                        <p className="text-gray-500 dark:text-gray-400">لا توجد آراء</p>
                    </div>
                ) : (
                    <AnimatePresence>
                        {testimonials.map((testimonial) => (
                            <motion.div
                                key={testimonial.id}
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, x: -100 }}
                                className="bg-white dark:bg-[#1a1a1a] rounded-xl border border-gray-200 dark:border-gray-700 p-5 hover:shadow-md transition-shadow"
                            >
                                <div className="flex items-start justify-between gap-4">
                                    {/* User Info */}
                                    <div className="flex items-start gap-4 flex-1">
                                        <div className="w-12 h-12 rounded-full bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center text-white font-bold text-lg shrink-0">
                                            {testimonial.profiles?.name?.charAt(0) || <User className="h-5 w-5" />}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-3 mb-1">
                                                <h3 className="font-bold text-gray-900 dark:text-white">
                                                    {testimonial.profiles?.name || 'مستخدم'}
                                                </h3>
                                                {getStatusBadge(testimonial.status)}
                                            </div>
                                            <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">
                                                {testimonial.profiles?.email}
                                            </p>

                                            {/* Rating */}
                                            <div className="flex gap-0.5 mb-3">
                                                {Array.from({ length: 5 }).map((_, i) => (
                                                    <Star
                                                        key={i}
                                                        className={`h-4 w-4 ${i < testimonial.rating
                                                            ? 'fill-amber-400 text-amber-400'
                                                            : 'text-gray-300 dark:text-gray-600'
                                                            }`}
                                                    />
                                                ))}
                                            </div>

                                            {/* Content */}
                                            <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
                                                &quot;{testimonial.content}&quot;
                                            </p>

                                            {/* Meta */}
                                            <p className="text-xs text-gray-400 mt-3">
                                                {new Date(testimonial.created_at).toLocaleDateString('ar-EG', {
                                                    year: 'numeric',
                                                    month: 'long',
                                                    day: 'numeric',
                                                })}
                                            </p>
                                        </div>
                                    </div>

                                    {/* Actions */}
                                    <div className="flex items-center gap-2 shrink-0">
                                        {testimonial.status === 'pending' && (
                                            <>
                                                <button
                                                    onClick={() => handleStatusChange(testimonial.id, 'approved')}
                                                    disabled={processingId === testimonial.id}
                                                    className="flex items-center gap-1.5 px-3 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors disabled:opacity-50 text-sm font-medium"
                                                >
                                                    <Check className="h-4 w-4" />
                                                    قبول
                                                </button>
                                                <button
                                                    onClick={() => handleStatusChange(testimonial.id, 'rejected')}
                                                    disabled={processingId === testimonial.id}
                                                    className="flex items-center gap-1.5 px-3 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors disabled:opacity-50 text-sm font-medium"
                                                >
                                                    <X className="h-4 w-4" />
                                                    رفض
                                                </button>
                                            </>
                                        )}
                                        <button
                                            onClick={() => handleDelete(testimonial.id)}
                                            disabled={processingId === testimonial.id}
                                            className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors disabled:opacity-50"
                                        >
                                            <Trash2 className="h-4 w-4" />
                                        </button>
                                    </div>
                                </div>
                            </motion.div>
                        ))}
                    </AnimatePresence>
                )}
            </div>
        </div>
    );
}
