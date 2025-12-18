"use client";

import { useState, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import {
    Users, GraduationCap, FileText, BookOpen, TrendingUp, ArrowUpRight,
    Clock, CheckCircle2, Calendar, Activity, Zap, Loader2, RefreshCw,
    Layers, Plus, Eye, Edit, Trash2, Download, Filter, Search,
    BarChart3, PieChart, TrendingDown, Target, Award, Star,
    Bell, MessageSquare, AlertCircle, ChevronRight, ArrowUp, ArrowDown,
    Play, Pause, Settings, Globe, Smartphone, Monitor, Share2
} from "lucide-react";
import { createClient } from "@/lib/supabase";

// ============================================
// Types
// ============================================

interface DashboardStats {
    totalUsers: number;
    totalTeachers: number;
    totalStudents: number;
    totalComprehensiveExams: number;
    totalExamTemplates: number;
    totalLessons: number;
    totalStages: number;
    totalSubjects: number;
    totalQuestions: number;
    verifiedTeachers: number;
    publishedLessons: number;
    publishedExams: number;
    growth: {
        users: number;
        exams: number;
        lessons: number;
    };
}

interface RecentUser {
    id: string;
    name: string;
    email: string;
    role: string;
    is_verified: boolean;
    created_at: string;
    avatar_url?: string;
}

interface RecentExam {
    id: string;
    examTitle?: string;
    title?: { ar?: string; en?: string };
    isPublished?: boolean;
    is_published?: boolean;
    created_at: string;
    type?: string;
    language?: string;
}

interface ActivityItem {
    id: string;
    action: string;
    description: string;
    time: string;
    type: 'user' | 'teacher' | 'exam' | 'lesson' | 'system';
    icon?: React.ComponentType<any>;
}

// ============================================
// Animation Variants
// ============================================

const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
        opacity: 1,
        transition: { staggerChildren: 0.08, delayChildren: 0.1 }
    }
};

const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
        opacity: 1,
        y: 0,
        transition: { duration: 0.4, ease: "easeOut" as const }
    }
};

const cardHover = {
    y: -4,
    transition: { duration: 0.2 }
};

// ============================================
// Chart Component (Simple SVG)
// ============================================

function MiniChart({ data, color, height = 60 }: { data: number[]; color: string; height?: number }) {
    const max = Math.max(...data, 1);
    const min = Math.min(...data, 0);
    const range = max - min || 1;
    const width = 100;
    const points = data.map((value, i) => {
        const x = (i / (data.length - 1)) * width;
        const y = height - ((value - min) / range) * height * 0.8 - height * 0.1;
        return `${x},${y}`;
    }).join(' ');

    const areaPoints = `0,${height} ${points} ${width},${height}`;

    return (
        <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-full" preserveAspectRatio="none">
            <defs>
                <linearGradient id={`gradient-${color}`} x1="0%" y1="0%" x2="0%" y2="100%">
                    <stop offset="0%" stopColor={color} stopOpacity="0.3" />
                    <stop offset="100%" stopColor={color} stopOpacity="0" />
                </linearGradient>
            </defs>
            <polygon
                points={areaPoints}
                fill={`url(#gradient-${color})`}
            />
            <polyline
                points={points}
                fill="none"
                stroke={color}
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
            />
        </svg>
    );
}

// ============================================
// Progress Ring Component
// ============================================

function ProgressRing({
    progress,
    size = 80,
    strokeWidth = 8,
    color = "currentColor"
}: {
    progress: number;
    size?: number;
    strokeWidth?: number;
    color?: string;
}) {
    const radius = (size - strokeWidth) / 2;
    const circumference = radius * 2 * Math.PI;
    const offset = circumference - (progress / 100) * circumference;

    return (
        <svg width={size} height={size} className="transform -rotate-90">
            <circle
                cx={size / 2}
                cy={size / 2}
                r={radius}
                fill="none"
                stroke="currentColor"
                strokeWidth={strokeWidth}
                className="text-gray-200 dark:text-gray-700"
            />
            <motion.circle
                cx={size / 2}
                cy={size / 2}
                r={radius}
                fill="none"
                stroke={color}
                strokeWidth={strokeWidth}
                strokeLinecap="round"
                strokeDasharray={circumference}
                initial={{ strokeDashoffset: circumference }}
                animate={{ strokeDashoffset: offset }}
                transition={{ duration: 1, ease: "easeOut" }}
            />
        </svg>
    );
}

// ============================================
// Quick Action Button
// ============================================

function QuickActionCard({
    icon: Icon,
    title,
    description,
    href,
    color
}: {
    icon: React.ComponentType<any>;
    title: string;
    description: string;
    href: string;
    color: string;
}) {
    return (
        <Link href={href}>
            <motion.div
                whileHover={{ scale: 1.02, y: -2 }}
                whileTap={{ scale: 0.98 }}
                className="relative overflow-hidden p-4 rounded-2xl bg-white dark:bg-[#1c1c24] border border-gray-200/60 dark:border-gray-800 cursor-pointer group"
            >
                <div className={`absolute inset-0 opacity-0 group-hover:opacity-5 transition-opacity bg-gradient-to-br ${color}`} />
                <div className="flex items-center gap-4">
                    <div className={`p-3 rounded-xl bg-gradient-to-br ${color} shadow-lg`}>
                        <Icon className="h-5 w-5 text-white" />
                    </div>
                    <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-gray-900 dark:text-white text-sm">{title}</h3>
                        <p className="text-xs text-gray-500 truncate">{description}</p>
                    </div>
                    <ChevronRight className="h-5 w-5 text-gray-400 group-hover:text-primary-500 transition-colors" />
                </div>
            </motion.div>
        </Link>
    );
}

// ============================================
// Stat Card with Trend
// ============================================

function StatCardAdvanced({
    title,
    value,
    subtext,
    icon: Icon,
    color,
    trend,
    trendValue,
    chartData
}: {
    title: string;
    value: string | number;
    subtext?: string;
    icon: React.ComponentType<any>;
    color: string;
    trend?: 'up' | 'down' | 'neutral';
    trendValue?: string;
    chartData?: number[];
}) {
    const TrendIcon = trend === 'up' ? ArrowUp : trend === 'down' ? ArrowDown : null;

    return (
        <motion.div
            variants={itemVariants}
            whileHover={cardHover}
            className="relative overflow-hidden bg-white dark:bg-[#1c1c24] rounded-2xl p-5 border border-gray-200/60 dark:border-gray-800 shadow-sm hover:shadow-xl transition-all duration-300"
        >
            {/* Background Pattern */}
            <div className="absolute top-0 right-0 w-32 h-32 opacity-5">
                <Icon className="w-full h-full" />
            </div>

            <div className="relative z-10">
                <div className="flex items-start justify-between mb-4">
                    <div className={`p-3 rounded-xl bg-gradient-to-br ${color} shadow-lg shadow-${color.split('-')[1]}-500/25`}>
                        <Icon className="h-5 w-5 text-white" />
                    </div>
                    {trend && TrendIcon && (
                        <div className={`flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-semibold ${trend === 'up'
                                ? 'bg-green-100 dark:bg-green-900/30 text-green-600'
                                : 'bg-red-100 dark:bg-red-900/30 text-red-600'
                            }`}>
                            <TrendIcon className="h-3 w-3" />
                            <span>{trendValue}</span>
                        </div>
                    )}
                </div>

                <h3 className="text-3xl font-bold text-gray-900 dark:text-white mb-1">
                    {typeof value === 'number' ? value.toLocaleString() : value}
                </h3>
                <p className="text-sm text-gray-500 mb-3">{title}</p>

                {subtext && (
                    <p className="text-xs text-primary-500 font-medium">{subtext}</p>
                )}

                {chartData && chartData.length > 0 && (
                    <div className="mt-4 h-12">
                        <MiniChart
                            data={chartData}
                            color={color.includes('blue') ? '#3B82F6' :
                                color.includes('purple') ? '#8B5CF6' :
                                    color.includes('green') ? '#10B981' :
                                        color.includes('amber') ? '#F59E0B' : '#6366F1'}
                        />
                    </div>
                )}
            </div>
        </motion.div>
    );
}

// ============================================
// Main Dashboard Component
// ============================================

export default function AdminDashboard() {
    const [loading, setLoading] = useState(true);
    const [stats, setStats] = useState<DashboardStats | null>(null);
    const [recentUsers, setRecentUsers] = useState<RecentUser[]>([]);
    const [recentExams, setRecentExams] = useState<RecentExam[]>([]);
    const [recentActivities, setRecentActivities] = useState<ActivityItem[]>([]);
    const [selectedPeriod, setSelectedPeriod] = useState<'today' | 'week' | 'month'>('week');
    const [searchQuery, setSearchQuery] = useState('');

    // Mock chart data (in production, this would come from analytics)
    const chartData = useMemo(() => ({
        users: [12, 19, 15, 25, 22, 30, 28, 35, 32, 40, 38, 45],
        exams: [5, 8, 12, 10, 15, 18, 14, 20, 22, 19, 25, 28],
        lessons: [8, 10, 12, 15, 14, 18, 20, 22, 25, 28, 30, 32],
        engagement: [65, 72, 68, 75, 80, 85, 78, 82, 88, 85, 90, 92]
    }), []);

    const fetchDashboardData = async () => {
        setLoading(true);
        try {
            const supabase = createClient();

            const results = await Promise.allSettled([
                supabase.from("profiles").select("id, role, is_verified, created_at"),
                supabase.from("comprehensive_exams").select("id, is_published, exam_title, type, language, created_at").order("created_at", { ascending: false }).limit(5),
                supabase.from("exam_templates").select("id, is_published, title, created_at").order("created_at", { ascending: false }).limit(5),
                supabase.from("lessons").select("id, is_published, created_at"),
                supabase.from("educational_stages").select("id"),
                supabase.from("subjects").select("id"),
                supabase.from("questions").select("id"),
                supabase.from("profiles").select("id, name, email, role, is_verified, created_at, avatar_url").order("created_at", { ascending: false }).limit(6),
            ]);

            const getDataOrEmpty = (result: PromiseSettledResult<any>) => {
                if (result.status === 'fulfilled' && result.value?.data) {
                    return result.value.data;
                }
                return [];
            };

            const profiles = getDataOrEmpty(results[0]);
            const comprehensiveExams = getDataOrEmpty(results[1]);
            const examTemplates = getDataOrEmpty(results[2]);
            const lessons = getDataOrEmpty(results[3]);
            const stages = getDataOrEmpty(results[4]);
            const subjects = getDataOrEmpty(results[5]);
            const questions = getDataOrEmpty(results[6]);
            const recentUsersData = getDataOrEmpty(results[7]);

            const allExams: RecentExam[] = [
                ...comprehensiveExams.map((e: any) => ({
                    id: e.id,
                    examTitle: e.exam_title,
                    isPublished: e.is_published,
                    created_at: e.created_at,
                    type: e.type,
                    language: e.language
                })),
                ...examTemplates.map((e: any) => ({
                    id: e.id,
                    title: e.title,
                    is_published: e.is_published,
                    created_at: e.created_at,
                    type: 'template'
                }))
            ].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()).slice(0, 4);

            // Calculate growth (mock - in production would compare with previous period)
            const calculateGrowth = () => ({ users: 12, exams: 8, lessons: 15 });

            setStats({
                totalUsers: profiles.length,
                totalTeachers: profiles.filter((p: any) => p.role === "teacher").length,
                totalStudents: profiles.filter((p: any) => p.role === "student").length,
                totalComprehensiveExams: comprehensiveExams.length,
                totalExamTemplates: examTemplates.length,
                totalLessons: lessons.length,
                totalStages: stages.length,
                totalSubjects: subjects.length,
                totalQuestions: questions.length,
                verifiedTeachers: profiles.filter((p: any) => p.role === "teacher" && p.is_verified).length,
                publishedLessons: lessons.filter((l: any) => l.is_published).length,
                publishedExams: comprehensiveExams.filter((e: any) => e.is_published).length + examTemplates.filter((e: any) => e.is_published).length,
                growth: calculateGrowth()
            });

            setRecentUsers(recentUsersData);
            setRecentExams(allExams);

            // Create activities
            const activities: ActivityItem[] = [];
            recentUsersData.slice(0, 4).forEach((u: any) => {
                activities.push({
                    id: `user-${u.id}`,
                    action: u.role === "teacher" ? "معلم جديد انضم" : "طالب جديد سجّل",
                    description: u.name || 'مستخدم جديد',
                    time: getTimeAgo(u.created_at),
                    type: u.role === "teacher" ? "teacher" : "user",
                    icon: u.role === "teacher" ? GraduationCap : Users
                });
            });
            allExams.slice(0, 3).forEach((e) => {
                const title = e.examTitle || e.title?.ar || e.title?.en || "امتحان جديد";
                activities.push({
                    id: `exam-${e.id}`,
                    action: "امتحان جديد",
                    description: title,
                    time: getTimeAgo(e.created_at),
                    type: "exam",
                    icon: FileText
                });
            });
            setRecentActivities(activities.sort((a, b) =>
                new Date(b.time).getTime() - new Date(a.time).getTime()
            ).slice(0, 6));

        } catch (err) {
            console.error("Error fetching dashboard data:", err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { fetchDashboardData(); }, []);

    const getTimeAgo = (dateStr: string) => {
        const date = new Date(dateStr);
        const now = new Date();
        const diff = Math.floor((now.getTime() - date.getTime()) / 1000);
        if (diff < 60) return "الآن";
        if (diff < 3600) return `منذ ${Math.floor(diff / 60)} د`;
        if (diff < 86400) return `منذ ${Math.floor(diff / 3600)} س`;
        if (diff < 604800) return `منذ ${Math.floor(diff / 86400)} يوم`;
        return new Date(dateStr).toLocaleDateString('ar-EG');
    };

    const getRoleBadge = (role: string) => {
        const config: Record<string, { bg: string; text: string; label: string }> = {
            teacher: { bg: "bg-purple-100 dark:bg-purple-900/30", text: "text-purple-600 dark:text-purple-400", label: "معلم" },
            student: { bg: "bg-blue-100 dark:bg-blue-900/30", text: "text-blue-600 dark:text-blue-400", label: "طالب" },
            admin: { bg: "bg-amber-100 dark:bg-amber-900/30", text: "text-amber-600 dark:text-amber-400", label: "مشرف" }
        };
        const { bg, text, label } = config[role] || config.student;
        return <span className={`inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-semibold ${bg} ${text}`}>{label}</span>;
    };

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

    const totalExams = (stats?.totalComprehensiveExams || 0) + (stats?.totalExamTemplates || 0);
    const completionRate = stats ? Math.round((stats.publishedExams / Math.max(totalExams, 1)) * 100) : 0;

    // Quick Actions
    const quickActions = [
        { icon: Plus, title: "إضافة امتحان", description: "إنشاء امتحان جديد", href: "/admin/exams", color: "from-blue-500 to-blue-600" },
        { icon: GraduationCap, title: "إدارة المعلمين", description: "عرض وإدارة المعلمين", href: "/admin/teachers", color: "from-purple-500 to-purple-600" },
        { icon: BookOpen, title: "إضافة درس", description: "إنشاء درس جديد", href: "/admin/lessons", color: "from-green-500 to-green-600" },
        { icon: BarChart3, title: "التقارير", description: "عرض الإحصائيات التفصيلية", href: "/admin/analytics", color: "from-amber-500 to-amber-600" },
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
                        onClick={fetchDashboardData}
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
                    trendValue={`+${stats?.growth.users || 0}%`}
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
                    trendValue={`+${stats?.growth.exams || 0}%`}
                    chartData={chartData.exams}
                />
                <StatCardAdvanced
                    title="الدروس"
                    value={stats?.totalLessons || 0}
                    subtext={`${stats?.publishedLessons || 0} منشور`}
                    icon={BookOpen}
                    color="from-amber-500 to-amber-600"
                    trend="up"
                    trendValue={`+${stats?.growth.lessons || 0}%`}
                    chartData={chartData.lessons}
                />
            </div>

            {/* Secondary Stats + Progress */}
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
                <motion.div variants={itemVariants} className="lg:col-span-3 grid grid-cols-2 sm:grid-cols-4 gap-4">
                    {[
                        { label: "المراحل الدراسية", value: stats?.totalStages || 0, icon: Layers, color: "text-indigo-500" },
                        { label: "المواد", value: stats?.totalSubjects || 0, icon: BookOpen, color: "text-cyan-500" },
                        { label: "الأسئلة", value: stats?.totalQuestions || 0, icon: FileText, color: "text-pink-500" },
                        { label: "امتحانات شاملة", value: stats?.totalComprehensiveExams || 0, icon: Target, color: "text-orange-500" },
                    ].map((stat, i) => (
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
                {/* Recent Users Table */}
                <motion.div
                    variants={itemVariants}
                    className="lg:col-span-2 bg-white dark:bg-[#1c1c24] rounded-2xl border border-gray-200/60 dark:border-gray-800 overflow-hidden"
                >
                    <div className="flex items-center justify-between p-5 border-b border-gray-200 dark:border-gray-800">
                        <div className="flex items-center gap-3">
                            <div className="p-2 rounded-lg bg-blue-100 dark:bg-blue-900/30">
                                <Users className="h-5 w-5 text-blue-600" />
                            </div>
                            <h2 className="text-lg font-bold text-gray-900 dark:text-white">المستخدمين الجدد</h2>
                        </div>
                        <Link
                            href="/admin/users"
                            className="flex items-center gap-1 text-sm text-primary-600 font-medium hover:underline"
                        >
                            <span>عرض الكل</span>
                            <ArrowUpRight className="h-4 w-4" />
                        </Link>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead className="bg-gray-50 dark:bg-gray-800/50">
                                <tr>
                                    <th className="px-5 py-3 text-right text-xs font-semibold text-gray-500 uppercase">المستخدم</th>
                                    <th className="px-5 py-3 text-right text-xs font-semibold text-gray-500 uppercase">الدور</th>
                                    <th className="px-5 py-3 text-right text-xs font-semibold text-gray-500 uppercase">الحالة</th>
                                    <th className="px-5 py-3 text-right text-xs font-semibold text-gray-500 uppercase">التسجيل</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-200 dark:divide-gray-800">
                                {recentUsers.length === 0 ? (
                                    <tr>
                                        <td colSpan={4} className="px-5 py-12 text-center">
                                            <Users className="h-12 w-12 text-gray-300 dark:text-gray-600 mx-auto mb-3" />
                                            <p className="text-gray-500">لا يوجد مستخدمين جدد</p>
                                        </td>
                                    </tr>
                                ) : (
                                    recentUsers.map((user) => (
                                        <tr key={user.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/30 transition-colors">
                                            <td className="px-5 py-4">
                                                <div className="flex items-center gap-3">
                                                    {user.avatar_url ? (
                                                        <img src={user.avatar_url} alt="" className="w-10 h-10 rounded-full object-cover" />
                                                    ) : (
                                                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary-400 to-primary-600 flex items-center justify-center text-white text-sm font-bold">
                                                            {user.name?.charAt(0) || "?"}
                                                        </div>
                                                    )}
                                                    <div>
                                                        <p className="text-sm font-semibold text-gray-900 dark:text-white">{user.name || 'بدون اسم'}</p>
                                                        <p className="text-xs text-gray-500">{user.email}</p>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-5 py-4">{getRoleBadge(user.role)}</td>
                                            <td className="px-5 py-4">
                                                <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium ${user.is_verified
                                                        ? "bg-green-100 dark:bg-green-900/30 text-green-600"
                                                        : "bg-gray-100 dark:bg-gray-800 text-gray-500"
                                                    }`}>
                                                    {user.is_verified ? (
                                                        <><CheckCircle2 className="h-3 w-3" />موثق</>
                                                    ) : (
                                                        <><Clock className="h-3 w-3" />قيد المراجعة</>
                                                    )}
                                                </span>
                                            </td>
                                            <td className="px-5 py-4 text-sm text-gray-500">{getTimeAgo(user.created_at)}</td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </motion.div>

                {/* Activity Feed */}
                <motion.div
                    variants={itemVariants}
                    className="bg-white dark:bg-[#1c1c24] rounded-2xl border border-gray-200/60 dark:border-gray-800"
                >
                    <div className="flex items-center justify-between p-5 border-b border-gray-200 dark:border-gray-800">
                        <div className="flex items-center gap-3">
                            <div className="p-2 rounded-lg bg-purple-100 dark:bg-purple-900/30">
                                <Activity className="h-5 w-5 text-purple-600" />
                            </div>
                            <h2 className="text-lg font-bold text-gray-900 dark:text-white">النشاط الأخير</h2>
                        </div>
                    </div>
                    <div className="p-4 space-y-4 max-h-[400px] overflow-y-auto">
                        {recentActivities.length === 0 ? (
                            <div className="text-center py-12">
                                <Activity className="h-12 w-12 text-gray-300 dark:text-gray-600 mx-auto mb-3" />
                                <p className="text-gray-500">لا يوجد نشاط حديث</p>
                            </div>
                        ) : (
                            recentActivities.map((activity, i) => {
                                const Icon = activity.icon || Activity;
                                const colors: Record<string, string> = {
                                    exam: 'bg-green-500',
                                    teacher: 'bg-purple-500',
                                    user: 'bg-blue-500',
                                    lesson: 'bg-amber-500',
                                    system: 'bg-gray-500'
                                };
                                return (
                                    <motion.div
                                        key={activity.id}
                                        initial={{ opacity: 0, x: -10 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        transition={{ delay: i * 0.1 }}
                                        className="flex gap-3 p-3 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors"
                                    >
                                        <div className={`w-10 h-10 rounded-full ${colors[activity.type]} flex items-center justify-center flex-shrink-0`}>
                                            <Icon className="h-5 w-5 text-white" />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className="text-sm font-semibold text-gray-900 dark:text-white">{activity.action}</p>
                                            <p className="text-xs text-gray-500 truncate">{activity.description}</p>
                                            <p className="text-xs text-gray-400 mt-1 flex items-center gap-1">
                                                <Clock className="h-3 w-3" />
                                                {activity.time}
                                            </p>
                                        </div>
                                    </motion.div>
                                );
                            })
                        )}
                    </div>
                </motion.div>
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
                        <ArrowUpRight className="h-4 w-4" />
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
                                            href={`/admin/exams/${exam.id}`}
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
