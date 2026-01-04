"use client";

// =============================================
// Teacher Dashboard - لوحة تحكم المدرس
// =============================================

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { motion } from "framer-motion";
import {
    LayoutDashboard,
    FileText,
    Users,
    Eye,
    TrendingUp,
    Clock,
    CheckCircle2,
    AlertCircle,
    BookOpen,
    Plus,
    ArrowLeft,
    Star,
    Calendar,
    BarChart3,
    Loader2,
    RefreshCw,
} from "lucide-react";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { useAuthStore, selectIsApprovedTeacher } from "@/lib/stores/useAuthStore";
import { createClient } from "@/lib/supabase";
import { TeacherAnalytics } from "@/components/teacher";

interface TeacherStats {
    totalExams: number;
    publishedExams: number;
    totalStudents: number;
    totalViews: number;
    avgRating: number;
    ratingCount: number;
}

interface RecentExam {
    id: string;
    title: string;
    language: string;
    is_published: boolean;
    created_at: string;
    attempts_count: number;
}

interface ExamPerformance {
    id: string;
    title: string;
    attempts: number;
    avgScore: number;
}

export default function TeacherDashboard() {
    const router = useRouter();
    const { user, isLoading: authLoading, refreshUser } = useAuthStore();
    const isApprovedTeacher = useAuthStore(selectIsApprovedTeacher);

    const [stats, setStats] = useState<TeacherStats | null>(null);
    const [recentExams, setRecentExams] = useState<RecentExam[]>([]);
    const [examPerformance, setExamPerformance] = useState<ExamPerformance[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [hasRefreshed, setHasRefreshed] = useState(false);

    // تحديث بيانات المستخدم عند فتح الصفحة للتأكد من حالة الاعتماد
    useEffect(() => {
        if (!hasRefreshed) {
            refreshUser();
            setHasRefreshed(true);
        }
    }, [refreshUser, hasRefreshed]);

    useEffect(() => {
        if (authLoading) return;

        // التحقق من أن المستخدم مدرس معتمد
        if (!user) {
            router.push("/login");
            return;
        }

        if (user.role !== 'teacher') {
            router.push("/");
            return;
        }

        if (!isApprovedTeacher) {
            // المدرس غير معتمد بعد
            setIsLoading(false);
            return;
        }

        fetchTeacherData();
    }, [user, authLoading, isApprovedTeacher]);

    const fetchTeacherData = async () => {
        if (!user) return;

        const supabase = createClient();

        try {
            // جلب جميع الامتحانات من comprehensive_exams
            const { data: allExams } = await supabase
                .from('comprehensive_exams')
                .select('id, exam_title, language, is_published, created_at, sections')
                .eq('created_by', user.id)
                .order('created_at', { ascending: false });

            // جلب الإحصائيات من الـ profile
            const { data: profile } = await supabase
                .from('profiles')
                .select('subscriber_count, rating_average, rating_count')
                .eq('id', user.id)
                .single();

            // حساب الإحصائيات
            const examsList = (allExams || []) as any[];
            const totalExams = examsList.length;
            const publishedExams = examsList.filter(e => e.is_published).length;

            setStats({
                totalExams,
                publishedExams,
                totalStudents: profile?.subscriber_count || 0,
                totalViews: 0, // Not tracked in current schema
                avgRating: profile?.rating_average || 0,
                ratingCount: profile?.rating_count || 0,
            });

            // آخر 5 امتحانات - mapped to our interface
            const mappedExams = examsList.slice(0, 5).map((exam: any) => ({
                id: exam.id,
                title: exam.exam_title || 'امتحان',
                language: exam.language || 'arabic',
                is_published: exam.is_published ?? false,
                created_at: exam.created_at,
                attempts_count: 0,
            }));
            setRecentExams(mappedExams as RecentExam[]);

            // جلب بيانات التحليلات - محاولات الطلاب مع الدرجات
            const examIds = examsList.map(e => e.id);
            if (examIds.length > 0) {
                const { data: attempts } = await supabase
                    .from('comprehensive_exam_attempts')
                    .select('exam_id, total_score, max_score')
                    .in('exam_id', examIds)
                    .in('status', ['completed', 'graded']);

                // حساب متوسط الدرجات لكل امتحان
                const performanceData: ExamPerformance[] = examsList
                    .filter(e => e.is_published)
                    .map(exam => {
                        const examAttempts = (attempts || []).filter((a: any) => a.exam_id === exam.id);
                        const attemptsCount = examAttempts.length;
                        const avgScore = attemptsCount > 0
                            ? examAttempts.reduce((sum: number, a: any) => {
                                const score = a.max_score > 0 ? (a.total_score / a.max_score) * 100 : 0;
                                return sum + score;
                            }, 0) / attemptsCount
                            : 0;

                        return {
                            id: exam.id,
                            title: exam.exam_title || 'امتحان',
                            attempts: attemptsCount,
                            avgScore,
                        };
                    })
                    .filter(e => e.attempts > 0) // فقط الامتحانات التي لها محاولات
                    .sort((a, b) => b.attempts - a.attempts); // ترتيب حسب عدد المحاولات

                setExamPerformance(performanceData);
            }
        } catch (error) {
            console.error('Error fetching teacher data:', error);
        } finally {
            setIsLoading(false);
        }
    };

    if (authLoading || isLoading) {
        return (
            <>
                <Navbar />
                <div className="min-h-screen bg-gradient-to-br from-gray-50 via-purple-50/30 to-blue-50/30 dark:from-[#0d0d14] dark:via-[#13131a] dark:to-[#0d0d14] flex items-center justify-center">
                    <Loader2 className="h-10 w-10 animate-spin text-primary-500" />
                </div>
                <Footer />
            </>
        );
    }

    // عرض رسالة للمدرس غير المعتمد
    if (!isApprovedTeacher) {
        return (
            <>
                <Navbar />
                <div className="min-h-screen bg-gradient-to-br from-gray-50 via-purple-50/30 to-blue-50/30 dark:from-[#0d0d14] dark:via-[#13131a] dark:to-[#0d0d14] flex items-center justify-center p-4" dir="rtl">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="max-w-md w-full bg-white dark:bg-[#1c1c24] rounded-3xl p-8 shadow-xl border border-gray-200 dark:border-gray-800 text-center"
                    >
                        <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center">
                            <Clock className="h-10 w-10 text-amber-600 dark:text-amber-400" />
                        </div>
                        <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-3">
                            بانتظار الاعتماد
                        </h1>
                        <p className="text-gray-600 dark:text-gray-400 mb-6 leading-relaxed">
                            شكراً لتسجيلك كمدرس! حسابك قيد المراجعة من قبل الإدارة.
                            سيتم إشعارك فور الموافقة على حسابك.
                        </p>
                        <div className="bg-amber-50 dark:bg-amber-900/20 rounded-xl p-4 mb-6">
                            <p className="text-sm text-amber-700 dark:text-amber-300">
                                💡 في هذه الأثناء، يمكنك إكمال بياناتك الشخصية من صفحة الملف الشخصي
                            </p>
                        </div>
                        <div className="flex flex-col gap-3">
                            <button
                                onClick={() => {
                                    setHasRefreshed(false);
                                    setIsLoading(true);
                                }}
                                className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-primary-500 text-white font-medium hover:bg-primary-600 transition-colors"
                            >
                                <RefreshCw className="h-4 w-4" />
                                تحديث حالة الاعتماد
                            </button>
                            <div className="flex gap-3">
                                <Link
                                    href="/profile"
                                    className="flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 font-medium hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
                                >
                                    الملف الشخصي
                                </Link>
                                <Link
                                    href="/"
                                    className="flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 font-medium hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
                                >
                                    الصفحة الرئيسية
                                </Link>
                            </div>
                        </div>
                    </motion.div>
                </div>
                <Footer />
            </>
        );
    }

    const statCards = [
        { label: "إجمالي الامتحانات", value: stats?.totalExams || 0, icon: FileText, color: "from-blue-500 to-indigo-600" },
        { label: "امتحانات منشورة", value: stats?.publishedExams || 0, icon: CheckCircle2, color: "from-green-500 to-emerald-600" },
        { label: "المشتركين", value: stats?.totalStudents || 0, icon: Users, color: "from-purple-500 to-pink-600" },
        { label: "المشاهدات", value: stats?.totalViews || 0, icon: Eye, color: "from-orange-500 to-amber-600" },
    ];

    const quickActions = [
        { label: "إنشاء امتحان جديد", href: "/teacher/exams/create", icon: Plus, color: "bg-gradient-to-r from-primary-500 to-pink-500" },
        { label: "إدارة الامتحانات", href: "/teacher/exams", icon: FileText, color: "bg-gradient-to-r from-blue-500 to-indigo-500" },
        { label: "نتائج الطلاب", href: "/teacher/results", icon: Users, color: "bg-gradient-to-r from-green-500 to-emerald-500" },
        { label: "إعدادات الملف العام", href: "/teacher/profile", icon: BookOpen, color: "bg-gradient-to-r from-purple-500 to-violet-500" },
    ];

    return (
        <>
            <Navbar />
            <div className="min-h-screen bg-gradient-to-br from-gray-50 via-purple-50/30 to-blue-50/30 dark:from-[#0d0d14] dark:via-[#13131a] dark:to-[#0d0d14]" dir="rtl">
                {/* Background Decoration */}
                <div className="fixed inset-0 overflow-hidden pointer-events-none">
                    <div className="absolute top-20 right-1/4 w-96 h-96 bg-violet-500/5 rounded-full blur-3xl" />
                    <div className="absolute bottom-20 left-1/4 w-96 h-96 bg-purple-500/5 rounded-full blur-3xl" />
                </div>

                <main className="relative container mx-auto px-4 py-8 max-w-6xl">
                    {/* Header */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="mb-8"
                    >
                        <div className="flex items-center gap-3 mb-2">
                            <div className="p-2 rounded-xl bg-gradient-to-br from-primary-500 to-pink-500 shadow-lg">
                                <LayoutDashboard className="h-6 w-6 text-white" />
                            </div>
                            <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900 dark:text-white">
                                لوحة تحكم المدرس
                            </h1>
                        </div>
                        <p className="text-gray-600 dark:text-gray-400">
                            مرحباً {user?.name}! إليك نظرة عامة على نشاطك
                        </p>
                    </motion.div>

                    {/* Stats Grid */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.1 }}
                        className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8"
                    >
                        {statCards.map((stat, index) => (
                            <div
                                key={index}
                                className="bg-white dark:bg-[#1c1c24] rounded-2xl p-5 border border-gray-200/60 dark:border-gray-800 shadow-lg"
                            >
                                <div className="flex items-center gap-3">
                                    <div className={`p-3 rounded-xl bg-gradient-to-br ${stat.color} shadow-lg`}>
                                        <stat.icon className="h-5 w-5 text-white" />
                                    </div>
                                    <div>
                                        <p className="text-2xl font-bold text-gray-900 dark:text-white">
                                            {stat.value}
                                        </p>
                                        <p className="text-sm text-gray-500 dark:text-gray-400">
                                            {stat.label}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </motion.div>

                    {/* Rating Card */}
                    {(stats?.ratingCount || 0) > 0 && (
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.15 }}
                            className="bg-gradient-to-r from-amber-500 to-orange-500 rounded-2xl p-5 mb-8 text-white"
                        >
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <Star className="h-8 w-8" />
                                    <div>
                                        <p className="text-3xl font-bold">{stats?.avgRating?.toFixed(1)}</p>
                                        <p className="text-white/80">من {stats?.ratingCount} تقييم</p>
                                    </div>
                                </div>
                                <BarChart3 className="h-12 w-12 opacity-30" />
                            </div>
                        </motion.div>
                    )}

                    {/* Quick Actions */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.2 }}
                        className="mb-8"
                    >
                        <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-4">
                            إجراءات سريعة
                        </h2>
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                            {quickActions.map((action, index) => (
                                <Link
                                    key={index}
                                    href={action.href}
                                    className={`${action.color} rounded-2xl p-5 text-white shadow-lg hover:scale-[1.02] transition-transform`}
                                >
                                    <action.icon className="h-8 w-8 mb-3" />
                                    <p className="font-semibold">{action.label}</p>
                                    <ArrowLeft className="h-5 w-5 mt-2 opacity-70" />
                                </Link>
                            ))}
                        </div>
                    </motion.div>

                    {/* Recent Exams */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.25 }}
                        className="bg-white dark:bg-[#1c1c24] rounded-2xl border border-gray-200/60 dark:border-gray-800 overflow-hidden"
                    >
                        <div className="flex items-center justify-between p-5 border-b border-gray-200 dark:border-gray-800">
                            <h2 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
                                <Calendar className="h-5 w-5 text-primary-500" />
                                آخر الامتحانات
                            </h2>
                            <Link
                                href="/teacher/exams"
                                className="text-sm text-primary-600 dark:text-primary-400 hover:underline font-medium"
                            >
                                عرض الكل
                            </Link>
                        </div>

                        {recentExams.length === 0 ? (
                            <div className="p-12 text-center">
                                <FileText className="h-12 w-12 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
                                <p className="text-gray-500 dark:text-gray-400 mb-4">
                                    لم تقم بإنشاء أي امتحانات بعد
                                </p>
                                <Link
                                    href="/teacher/exams/create"
                                    className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-primary-500 text-white font-medium hover:bg-primary-600 transition-colors"
                                >
                                    <Plus className="h-4 w-4" />
                                    إنشاء امتحان
                                </Link>
                            </div>
                        ) : (
                            <div className="divide-y divide-gray-200 dark:divide-gray-800">
                                {recentExams.map((exam) => (
                                    <div
                                        key={exam.id}
                                        className="flex items-center justify-between p-4 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors"
                                    >
                                        <div className="flex items-center gap-3">
                                            <div className="p-2 rounded-lg bg-primary-100 dark:bg-primary-900/30">
                                                <FileText className="h-5 w-5 text-primary-600 dark:text-primary-400" />
                                            </div>
                                            <div>
                                                <p className="font-medium text-gray-900 dark:text-white">
                                                    {typeof exam.title === 'string' ? exam.title : (exam.title as any)?.ar || 'امتحان'}
                                                </p>
                                                <p className="text-sm text-gray-500 dark:text-gray-400">
                                                    {exam.language === 'arabic' ? 'عربي' : 'English'} • {exam.attempts_count || 0} محاولة
                                                </p>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${exam.is_published
                                                ? 'bg-green-100 dark:bg-green-900/30 text-green-600'
                                                : 'bg-gray-100 dark:bg-gray-800 text-gray-500'
                                                }`}>
                                                {exam.is_published ? 'منشور' : 'مسودة'}
                                            </span>
                                            <Link
                                                href={`/teacher/exams/${exam.id}`}
                                                className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700"
                                            >
                                                <ArrowLeft className="h-4 w-4 text-gray-500" />
                                            </Link>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </motion.div>

                    {/* Analytics Section */}
                    {examPerformance.length > 0 && (
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.35 }}
                            className="mb-8"
                        >
                            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                                <BarChart3 className="h-5 w-5 text-primary-500" />
                                تحليل الأداء
                            </h2>
                            <TeacherAnalytics examPerformance={examPerformance} />
                        </motion.div>
                    )}
                </main>
            </div>
            <Footer />
        </>
    );
}
