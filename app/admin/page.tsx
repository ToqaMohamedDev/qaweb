"use client";

// =============================================
// Admin Dashboard - لوحة التحكم (Refactored)
// =============================================

import { useState } from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import {
    Users, GraduationCap, FileText, BookOpen, Zap, Loader2, RefreshCw,
    Layers, Plus, Eye, Search, BarChart3, Target, Globe,
} from "lucide-react";

import {
    StatCardAdvanced,
    QuickActionCard,
    RecentUsersTable,
    ActivityFeed,
    ProgressRing,
    getTimeAgo,
} from "@/components/admin";
import { containerVariants, itemVariants } from "@/lib/animations";
import { useAdminDashboard } from "@/hooks/useAdminDashboard";

// ============================================
// Main Dashboard Component
// ============================================

export default function AdminDashboard() {
    const [selectedPeriod, setSelectedPeriod] = useState<'today' | 'week' | 'month'>('week');
    const [searchQuery, setSearchQuery] = useState('');

    const {
        loading,
        stats,
        recentUsers,
        recentExams,
        activities,
        chartData,
        refetch,
    } = useAdminDashboard();

    if (loading) {
        return (
            <div className="flex items-center justify-center h-screen">
                <div className="text-center">
                    <Loader2 className="h-12 w-12 animate-spin text-primary-500 mx-auto mb-4" />
                    <p className="text-gray-500 dark:text-gray-400">جاري تحميل لوحة التحكم...</p>
                </div>
            </div>
        );
    }

    const totalExams = stats?.totalComprehensiveExams || 0;
    const completionRate = stats ? Math.round((stats.publishedExams / Math.max(totalExams, 1)) * 100) : 0;

    // Quick Actions
    const quickActions = [
        { icon: Plus, title: "إضافة امتحان", description: "إنشاء امتحان جديد", href: "/admin/exams", color: "from-blue-500 to-blue-600" },
        { icon: GraduationCap, title: "إدارة المعلمين", description: "عرض وإدارة المعلمين", href: "/admin/teachers", color: "from-purple-500 to-purple-600" },
        { icon: BookOpen, title: "إضافة درس", description: "إنشاء درس جديد", href: "/admin/lessons", color: "from-green-500 to-green-600" },
        { icon: BarChart3, title: "التقارير", description: "عرض الإحصائيات التفصيلية", href: "/admin/analytics", color: "from-amber-500 to-amber-600" },
    ];

    // Mini stats
    const miniStats = [
        { label: "المراحل الدراسية", value: stats?.totalStages || 0, icon: Layers, color: "text-indigo-500" },
        { label: "المواد", value: stats?.totalSubjects || 0, icon: BookOpen, color: "text-cyan-500" },
        { label: "الأسئلة", value: stats?.totalQuestions || 0, icon: FileText, color: "text-pink-500" },
        { label: "امتحانات شاملة", value: stats?.totalComprehensiveExams || 0, icon: Target, color: "text-orange-500" },
    ];

    return (
        <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            className="space-y-6 pb-8"
        >
            {/* Header */}
            <motion.div variants={itemVariants} className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                <div>
                    <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900 dark:text-white flex items-center gap-3">
                        مرحباً بك، أدمن
                        <motion.span
                            animate={{ rotate: [0, 14, -8, 14, -4, 10, 0] }}
                            transition={{ duration: 2.5, repeat: Infinity, repeatDelay: 3 }}
                        >
                            👋
                        </motion.span>
                    </h1>
                    <p className="text-gray-600 dark:text-gray-400 mt-1">
                        إليك ملخص شامل لما يحدث في منصتك اليوم
                    </p>
                </div>

                <div className="flex flex-wrap items-center gap-3">
                    {/* Search */}
                    <div className="relative">
                        <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                        <input
                            type="text"
                            placeholder="بحث سريع..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-48 pr-10 pl-4 py-2.5 rounded-xl bg-white dark:bg-[#1c1c24] border border-gray-200 dark:border-gray-800 text-sm focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all"
                        />
                    </div>

                    {/* Period Selector */}
                    <div className="flex items-center bg-white dark:bg-[#1c1c24] rounded-xl border border-gray-200 dark:border-gray-800 p-1">
                        {(['today', 'week', 'month'] as const).map((period) => (
                            <button
                                key={period}
                                onClick={() => setSelectedPeriod(period)}
                                className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${selectedPeriod === period
                                    ? 'bg-primary-500 text-white shadow-lg'
                                    : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800'
                                    }`}
                            >
                                {period === 'today' ? 'اليوم' : period === 'week' ? 'الأسبوع' : 'الشهر'}
                            </button>
                        ))}
                    </div>

                    <button
                        onClick={refetch}
                        className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white dark:bg-[#1c1c24] border border-gray-200 dark:border-gray-800 text-gray-700 dark:text-gray-300 text-sm font-medium hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                    >
                        <RefreshCw className="h-4 w-4" />
                    </button>

                    <Link
                        href="/admin/analytics"
                        className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-primary-500 to-primary-600 hover:from-primary-600 hover:to-primary-700 text-white text-sm font-medium transition-all shadow-lg shadow-primary-500/25 hover:shadow-xl"
                    >
                        <Zap className="h-4 w-4" />
                        <span>تقرير شامل</span>
                    </Link>
                </div>
            </motion.div>

            {/* Main Stats Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <StatCardAdvanced
                    title="إجمالي المستخدمين"
                    value={stats?.totalUsers || 0}
                    subtext={`${stats?.totalStudents || 0} طالب`}
                    icon={Users}
                    color="from-blue-500 to-blue-600"
                    trend="up"
                    trendValue={`+${stats?.growth?.users || 0}%`}
                    chartData={chartData.users}
                />
                <StatCardAdvanced
                    title="المعلمين النشطين"
                    value={stats?.totalTeachers || 0}
                    subtext={`${stats?.verifiedTeachers || 0} موثق`}
                    icon={GraduationCap}
                    color="from-purple-500 to-purple-600"
                    trend="up"
                    trendValue="+5%"
                    chartData={chartData.exams}
                />
                <StatCardAdvanced
                    title="الامتحانات"
                    value={totalExams}
                    subtext={`${stats?.publishedExams || 0} منشور`}
                    icon={FileText}
                    color="from-green-500 to-green-600"
                    trend="up"
                    trendValue={`+${stats?.growth?.exams || 0}%`}
                    chartData={chartData.exams}
                />
                <StatCardAdvanced
                    title="الدروس"
                    value={stats?.totalLessons || 0}
                    subtext={`${stats?.publishedLessons || 0} منشور`}
                    icon={BookOpen}
                    color="from-amber-500 to-amber-600"
                    trend="up"
                    trendValue={`+${stats?.growth?.lessons || 0}%`}
                    chartData={chartData.lessons}
                />
            </div>

            {/* Secondary Stats + Progress */}
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
                <motion.div variants={itemVariants} className="lg:col-span-3 grid grid-cols-2 sm:grid-cols-4 gap-4">
                    {miniStats.map((stat, i) => (
                        <motion.div
                            key={i}
                            whileHover={{ scale: 1.02 }}
                            className="bg-white dark:bg-[#1c1c24] rounded-xl p-4 border border-gray-200/60 dark:border-gray-800 flex items-center gap-4"
                        >
                            <div className={`p-2.5 rounded-lg bg-gray-100 dark:bg-gray-800 ${stat.color}`}>
                                <stat.icon className="h-5 w-5" />
                            </div>
                            <div>
                                <p className="text-xl font-bold text-gray-900 dark:text-white">{stat.value.toLocaleString()}</p>
                                <p className="text-xs text-gray-500">{stat.label}</p>
                            </div>
                        </motion.div>
                    ))}
                </motion.div>

                {/* Completion Rate Card */}
                <motion.div
                    variants={itemVariants}
                    className="bg-gradient-to-br from-primary-500 to-primary-600 rounded-2xl p-5 text-white relative overflow-hidden"
                >
                    <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2" />
                    <div className="relative z-10">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-primary-100 text-sm font-medium">معدل الإنجاز</p>
                                <p className="text-3xl font-bold mt-1">{completionRate}%</p>
                                <p className="text-primary-200 text-xs mt-2">من الامتحانات منشورة</p>
                            </div>
                            <ProgressRing progress={completionRate} size={70} strokeWidth={6} color="white" />
                        </div>
                    </div>
                </motion.div>
            </div>

            {/* Quick Actions */}
            <motion.div variants={itemVariants}>
                <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                    <Zap className="h-5 w-5 text-primary-500" />
                    إجراءات سريعة
                </h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    {quickActions.map((action, i) => (
                        <QuickActionCard key={i} {...action} />
                    ))}
                </div>
            </motion.div>

            {/* Content Grid: Users Table + Activity Feed */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <RecentUsersTable users={recentUsers} />
                <ActivityFeed activities={activities} />
            </div>

            {/* Recent Exams Grid */}
            <motion.div
                variants={itemVariants}
                className="bg-white dark:bg-[#1c1c24] rounded-2xl border border-gray-200/60 dark:border-gray-800"
            >
                <div className="flex items-center justify-between p-5 border-b border-gray-200 dark:border-gray-800">
                    <div className="flex items-center gap-3">
                        <div className="p-2 rounded-lg bg-green-100 dark:bg-green-900/30">
                            <FileText className="h-5 w-5 text-green-600" />
                        </div>
                        <h2 className="text-lg font-bold text-gray-900 dark:text-white">أحدث الامتحانات</h2>
                    </div>
                    <Link
                        href="/admin/exams"
                        className="flex items-center gap-1 text-sm text-primary-600 font-medium hover:underline"
                    >
                        <span>عرض الكل</span>
                    </Link>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 p-5">
                    {recentExams.length === 0 ? (
                        <div className="col-span-4 text-center py-12">
                            <FileText className="h-12 w-12 text-gray-300 dark:text-gray-600 mx-auto mb-3" />
                            <p className="text-gray-500">لا توجد امتحانات حتى الآن</p>
                            <Link
                                href="/admin/exams"
                                className="inline-flex items-center gap-2 mt-4 px-4 py-2 bg-primary-500 text-white rounded-xl text-sm font-medium hover:bg-primary-600 transition-colors"
                            >
                                <Plus className="h-4 w-4" />
                                إنشاء امتحان
                            </Link>
                        </div>
                    ) : (
                        recentExams.map((exam) => {
                            const title = exam.examTitle || exam.title?.ar || exam.title?.en || "امتحان";
                            const isPublished = exam.isPublished || exam.is_published;
                            return (
                                <motion.div
                                    key={exam.id}
                                    whileHover={{ y: -4 }}
                                    className="p-4 rounded-xl bg-gray-50 dark:bg-gray-800/50 hover:bg-gray-100 dark:hover:bg-gray-800 transition-all border border-transparent hover:border-primary-200 dark:hover:border-primary-800"
                                >
                                    <div className="flex items-center justify-between mb-3">
                                        <span className={`px-2.5 py-1 rounded-lg text-xs font-semibold ${isPublished
                                            ? "bg-green-100 dark:bg-green-900/30 text-green-600"
                                            : "bg-yellow-100 dark:bg-yellow-900/30 text-yellow-600"
                                            }`}>
                                            {isPublished ? "منشور" : "مسودة"}
                                        </span>
                                        {exam.language && (
                                            <span className={`px-2 py-1 rounded text-xs font-medium ${exam.language === 'arabic'
                                                ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300'
                                                : 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300'
                                                }`}>
                                                {exam.language === 'arabic' ? 'عربي' : 'إنجليزي'}
                                            </span>
                                        )}
                                    </div>
                                    <h3 className="text-sm font-bold text-gray-900 dark:text-white mb-2 line-clamp-2">{title}</h3>
                                    <p className="text-xs text-gray-500 mb-3">
                                        {exam.type === 'template' ? 'قالب امتحان' : exam.type?.includes('arabic') ? 'امتحان شامل عربي' : 'امتحان شامل إنجليزي'}
                                    </p>
                                    <div className="flex items-center justify-between">
                                        <p className="text-xs text-gray-400">{getTimeAgo(exam.created_at)}</p>
                                        <Link
                                            href={exam.language === "arabic" ? `/arabic/exam/${exam.id}` : `/english/exam/${exam.id}`}
                                            target="_blank"
                                            className="text-primary-500 hover:text-primary-600"
                                        >
                                            <Eye className="h-4 w-4" />
                                        </Link>
                                    </div>
                                </motion.div>
                            );
                        })
                    )}
                </div>
            </motion.div>

            {/* Footer Stats Bar */}
            <motion.div
                variants={itemVariants}
                className="bg-gradient-to-r from-gray-900 to-gray-800 dark:from-gray-800 dark:to-gray-900 rounded-2xl p-6 text-white"
            >
                <div className="flex flex-col md:flex-row items-center justify-between gap-6">
                    <div className="flex items-center gap-4">
                        <div className="p-3 rounded-xl bg-white/10">
                            <Globe className="h-6 w-6" />
                        </div>
                        <div>
                            <p className="text-lg font-bold">منصتك تنمو! 🚀</p>
                            <p className="text-gray-400 text-sm">استمر في إضافة محتوى عالي الجودة</p>
                        </div>
                    </div>
                    <div className="flex flex-wrap items-center gap-6">
                        <div className="text-center">
                            <p className="text-2xl font-bold">{stats?.totalUsers || 0}</p>
                            <p className="text-xs text-gray-400">مستخدم نشط</p>
                        </div>
                        <div className="w-px h-10 bg-gray-700 hidden md:block" />
                        <div className="text-center">
                            <p className="text-2xl font-bold">{totalExams}</p>
                            <p className="text-xs text-gray-400">امتحان</p>
                        </div>
                        <div className="w-px h-10 bg-gray-700 hidden md:block" />
                        <div className="text-center">
                            <p className="text-2xl font-bold">{stats?.totalQuestions || 0}</p>
                            <p className="text-xs text-gray-400">سؤال</p>
                        </div>
                        <Link
                            href="/admin/analytics"
                            className="px-6 py-3 bg-white text-gray-900 rounded-xl font-semibold hover:bg-gray-100 transition-colors"
                        >
                            عرض التفاصيل
                        </Link>
                    </div>
                </div>
            </motion.div>
        </motion.div>
    );
}
