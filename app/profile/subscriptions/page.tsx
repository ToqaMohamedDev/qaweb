"use client";

/**
 * My Subscriptions Page - اشتراكاتي
 * 
 * Shows all teachers the user is subscribed to.
 * Uses the teacher_subscriptions table.
 */

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import {
    Users,
    Star,
    BookOpen,
    FileText,
    Calendar,
    Bell,
    BellOff,
    Search,
    Loader2,
    UserMinus,
    ExternalLink,
    GraduationCap,
    ChevronLeft,
    Heart,
    Eye,
    Sparkles,
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { Avatar } from "@/components/common";

// ==========================================
// Types
// ==========================================
interface Subscription {
    id: string;
    teacher_id: string;
    created_at: string;
    teacher: {
        id: string;
        name: string;
        email: string;
        avatar_url: string | null;
        bio: string | null;
        specialization: string | null;
        rating_average: number | null;
        rating_count: number | null;
        subscriber_count: number | null;
        exam_count: number | null;
        is_verified: boolean | null;
        subjects: string[] | null;
    };
}

// ==========================================
// Animation Variants
// ==========================================
const containerVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.06 } },
};

const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { type: "spring" as const, stiffness: 300, damping: 24 } },
};

// ==========================================
// Teacher Card Component
// ==========================================
function TeacherSubscriptionCard({
    subscription,
    onUnsubscribe,
}: {
    subscription: Subscription;
    onUnsubscribe: () => void;
}) {
    const router = useRouter();
    const teacher = subscription.teacher;
    const [isUnsubscribing, setIsUnsubscribing] = useState(false);

    const handleUnsubscribe = async (e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();

        if (!confirm("هل أنت متأكد من إلغاء الاشتراك؟")) return;

        setIsUnsubscribing(true);
        try {
            await onUnsubscribe();
        } finally {
            setIsUnsubscribing(false);
        }
    };

    const formatDate = (date: string) => {
        return new Date(date).toLocaleDateString("ar-EG", {
            year: "numeric",
            month: "long",
            day: "numeric",
        });
    };

    return (
        <motion.div
            variants={itemVariants}
            whileHover={{ y: -4 }}
            className="group relative p-5 rounded-2xl bg-white dark:bg-[#0f172a]/80 border border-gray-100 dark:border-gray-800 hover:border-primary-500/30 dark:hover:border-primary-500/30 hover:shadow-xl transition-all cursor-pointer"
            onClick={() => router.push(`/teachers/${teacher.id}`)}
        >
            {/* Verified Badge */}
            {teacher.is_verified && (
                <div className="absolute top-3 left-3 px-2 py-1 rounded-lg bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 text-xs font-medium flex items-center gap-1">
                    <Sparkles className="w-3 h-3" />
                    موثق
                </div>
            )}

            <div className="flex items-start gap-4">
                {/* Avatar */}
                <Avatar
                    src={teacher.avatar_url}
                    name={teacher.name}
                    size="lg"
                    className="w-16 h-16 rounded-2xl flex-shrink-0"
                />

                {/* Content */}
                <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2 mb-1">
                        <h3 className="font-bold text-gray-900 dark:text-white group-hover:text-primary-500 transition-colors truncate">
                            {teacher.name || "معلم"}
                        </h3>
                        {teacher.rating_average !== null && teacher.rating_average > 0 && (
                            <div className="flex items-center gap-1 text-amber-500 flex-shrink-0">
                                <Star className="w-4 h-4 fill-amber-500" />
                                <span className="font-medium text-sm">
                                    {teacher.rating_average.toFixed(1)}
                                </span>
                            </div>
                        )}
                    </div>

                    {teacher.specialization && (
                        <p className="text-sm text-primary-500 dark:text-primary-400 mb-2">
                            {teacher.specialization}
                        </p>
                    )}

                    {teacher.bio && (
                        <p className="text-sm text-gray-500 dark:text-gray-400 line-clamp-2 mb-3">
                            {teacher.bio}
                        </p>
                    )}

                    {/* Stats */}
                    <div className="flex flex-wrap items-center gap-3 text-sm text-gray-500 dark:text-gray-400">
                        <span className="flex items-center gap-1">
                            <Users className="w-4 h-4" />
                            {teacher.subscriber_count || 0} مشترك
                        </span>
                        <span className="flex items-center gap-1">
                            <FileText className="w-4 h-4" />
                            {teacher.exam_count || 0} امتحان
                        </span>
                        {teacher.rating_count !== null && teacher.rating_count > 0 && (
                            <span className="flex items-center gap-1">
                                <Star className="w-4 h-4" />
                                {teacher.rating_count} تقييم
                            </span>
                        )}
                    </div>

                    {/* Subjects */}
                    {teacher.subjects && teacher.subjects.length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-3">
                            {teacher.subjects.slice(0, 3).map((subject, idx) => (
                                <span
                                    key={idx}
                                    className="px-2 py-0.5 rounded-lg bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 text-xs"
                                >
                                    {subject}
                                </span>
                            ))}
                            {teacher.subjects.length > 3 && (
                                <span className="px-2 py-0.5 rounded-lg bg-gray-100 dark:bg-gray-800 text-gray-500 text-xs">
                                    +{teacher.subjects.length - 3}
                                </span>
                            )}
                        </div>
                    )}
                </div>
            </div>

            {/* Footer */}
            <div className="flex items-center justify-between mt-4 pt-4 border-t border-gray-100 dark:border-gray-800">
                <span className="text-xs text-gray-400 dark:text-gray-500 flex items-center gap-1">
                    <Calendar className="w-3 h-3" />
                    مشترك منذ {formatDate(subscription.created_at)}
                </span>

                <div className="flex items-center gap-2">
                    <button
                        onClick={handleUnsubscribe}
                        disabled={isUnsubscribing}
                        className="p-2 rounded-lg bg-red-50 dark:bg-red-900/20 text-red-500 hover:bg-red-100 dark:hover:bg-red-900/40 transition-colors disabled:opacity-50"
                        title="إلغاء الاشتراك"
                    >
                        {isUnsubscribing ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                            <UserMinus className="w-4 h-4" />
                        )}
                    </button>
                    <button
                        onClick={(e) => {
                            e.stopPropagation();
                            router.push(`/teachers/${teacher.id}`);
                        }}
                        className="p-2 rounded-lg bg-primary-50 dark:bg-primary-900/20 text-primary-500 hover:bg-primary-100 dark:hover:bg-primary-900/40 transition-colors"
                        title="عرض الصفحة"
                    >
                        <ExternalLink className="w-4 h-4" />
                    </button>
                </div>
            </div>
        </motion.div>
    );
}

// ==========================================
// Main Component
// ==========================================
export default function MySubscriptionsPage() {
    const { user } = useAuth();
    const router = useRouter();
    const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState("");

    // Fetch subscriptions
    useEffect(() => {
        if (!user) return;

        const fetchSubscriptions = async () => {
            setIsLoading(true);
            try {
                const res = await fetch('/api/user/subscriptions', { cache: 'no-store' });
                const result = await res.json();

                if (!result.success) {
                    console.error("Error fetching subscriptions:", result.error);
                    setSubscriptions([]);
                    return;
                }

                setSubscriptions(result.data || []);
            } catch (error) {
                console.error("Error fetching subscriptions:", error);
            } finally {
                setIsLoading(false);
            }
        };

        fetchSubscriptions();
    }, [user]);

    // Handle unsubscribe
    const handleUnsubscribe = async (subscriptionId: string) => {
        try {
            const res = await fetch('/api/user/subscriptions', {
                method: 'DELETE',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ subscriptionId }),
            });

            const result = await res.json();
            if (!result.success) {
                console.error("Error unsubscribing:", result.error);
                return;
            }

            setSubscriptions((prev) => prev.filter((s) => s.id !== subscriptionId));
        } catch (error) {
            console.error("Error unsubscribing:", error);
        }
    };

    // Filter subscriptions
    const filteredSubscriptions = subscriptions.filter((s) => {
        if (!searchQuery) return true;
        const query = searchQuery.toLowerCase();
        return (
            s.teacher.name?.toLowerCase().includes(query) ||
            s.teacher.specialization?.toLowerCase().includes(query) ||
            s.teacher.bio?.toLowerCase().includes(query)
        );
    });

    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-100 dark:from-[#0a0f1a] dark:via-[#0f172a] dark:to-[#0a0f1a]" dir="rtl">
            <Navbar />

            <section className="pt-28 pb-16 px-4">
                <div className="container mx-auto max-w-5xl">
                    {/* Header */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="text-center mb-10"
                    >
                        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary-100 dark:bg-primary-900/30 text-primary-600 dark:text-primary-400 text-sm font-medium mb-4">
                            <Heart className="w-4 h-4" />
                            <span>المعلمين المفضلين</span>
                        </div>
                        <h1 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-3">
                            <span className="gradient-text">اشتراكاتي</span>
                        </h1>
                        <p className="text-gray-600 dark:text-gray-400">
                            تابع المعلمين المفضلين لديك واطلع على آخر امتحاناتهم
                        </p>
                    </motion.div>

                    {/* Stats */}
                    <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.1 }}
                        className="flex items-center justify-center gap-6 mb-8"
                    >
                        <div className="text-center">
                            <div className="text-3xl font-bold text-primary-500">
                                {subscriptions.length}
                            </div>
                            <div className="text-sm text-gray-500 dark:text-gray-400">
                                معلم متابَع
                            </div>
                        </div>
                        <div className="w-px h-12 bg-gray-200 dark:bg-gray-700" />
                        <div className="text-center">
                            <div className="text-3xl font-bold text-green-500">
                                {subscriptions.reduce((sum, s) => sum + (s.teacher.exam_count || 0), 0)}
                            </div>
                            <div className="text-sm text-gray-500 dark:text-gray-400">
                                امتحان متاح
                            </div>
                        </div>
                    </motion.div>

                    {/* Search */}
                    <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.2 }}
                        className="max-w-md mx-auto mb-8"
                    >
                        <div className="relative">
                            <Search className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                            <input
                                type="text"
                                placeholder="ابحث عن معلم..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="w-full pr-12 pl-4 py-3 rounded-2xl bg-white dark:bg-[#0f172a] border border-gray-200 dark:border-gray-700 focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 outline-none text-gray-900 dark:text-white placeholder-gray-400"
                            />
                        </div>
                    </motion.div>

                    {/* Subscriptions List */}
                    {isLoading ? (
                        <div className="flex items-center justify-center h-64">
                            <Loader2 className="w-8 h-8 animate-spin text-primary-500" />
                        </div>
                    ) : filteredSubscriptions.length === 0 ? (
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            className="text-center py-16"
                        >
                            <div className="w-20 h-20 rounded-3xl bg-gray-100 dark:bg-gray-800 flex items-center justify-center mx-auto mb-4">
                                <Users className="w-10 h-10 text-gray-400" />
                            </div>
                            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                                {searchQuery
                                    ? "لا توجد نتائج"
                                    : "لم تشترك بأي معلم بعد"
                                }
                            </h3>
                            <p className="text-gray-500 dark:text-gray-400 mb-6">
                                {searchQuery
                                    ? "جرب البحث بكلمات مختلفة"
                                    : "اكتشف المعلمين المميزين واشترك معهم"
                                }
                            </p>
                            <Link
                                href="/teachers"
                                className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-primary-500 hover:bg-primary-600 text-white font-medium transition-colors"
                            >
                                <GraduationCap className="w-5 h-5" />
                                استكشف المعلمين
                            </Link>
                        </motion.div>
                    ) : (
                        <motion.div
                            variants={containerVariants}
                            initial="hidden"
                            animate="visible"
                            className="grid md:grid-cols-2 gap-4"
                        >
                            {filteredSubscriptions.map((subscription) => (
                                <TeacherSubscriptionCard
                                    key={subscription.id}
                                    subscription={subscription}
                                    onUnsubscribe={() => handleUnsubscribe(subscription.id)}
                                />
                            ))}
                        </motion.div>
                    )}

                    {/* CTA to discover more */}
                    {subscriptions.length > 0 && (
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ delay: 0.4 }}
                            className="text-center mt-12"
                        >
                            <Link
                                href="/teachers"
                                className="inline-flex items-center gap-2 text-primary-500 hover:text-primary-600 font-medium"
                            >
                                اكتشف المزيد من المعلمين
                                <ChevronLeft className="w-4 h-4" />
                            </Link>
                        </motion.div>
                    )}
                </div>
            </section>

            <Footer />
        </div>
    );
}
