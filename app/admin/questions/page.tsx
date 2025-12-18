"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import {
    BookOpen,
    FileText,
    HelpCircle,
    ArrowRight,
    Plus,
    Loader2,
    Languages,
    GraduationCap,
    Layers,
    CheckCircle2,
    Clock,
    Eye,
    TrendingUp,
    BarChart3,
    Sparkles,
    Zap,
    Target,
    Award,
    ChevronRight,
    Calendar,
    Edit3,
    ExternalLink,
} from "lucide-react";
import { createClient } from "@/lib/supabase";

interface Stats {
    totalComprehensiveExams: number;
    arabicExams: number;
    englishExams: number;
    publishedExams: number;
    draftExams: number;
    totalLessonQuestions: number;
}

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
        transition: { type: "spring" as const, stiffness: 300, damping: 24 }
    }
};

const cardHoverVariants = {
    rest: { scale: 1, y: 0 },
    hover: { scale: 1.02, y: -4, transition: { duration: 0.2, ease: "easeOut" as const } }
};

export default function QuestionsHub() {
    const [stats, setStats] = useState<Stats | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [recentExams, setRecentExams] = useState<any[]>([]);

    useEffect(() => {
        const fetchData = async () => {
            setIsLoading(true);
            try {
                const supabase = createClient();

                // Fetch comprehensive exams
                const { data: exams, error } = await supabase
                    .from("comprehensive_exams")
                    .select("*")
                    .order("created_at", { ascending: false });

                if (!error && exams) {
                    const arabicExams = exams.filter(e => e.language === "arabic");
                    const englishExams = exams.filter(e => e.language === "english");
                    const publishedExams = exams.filter(e => e.is_published);
                    const draftExams = exams.filter(e => !e.is_published);

                    setStats({
                        totalComprehensiveExams: exams.length,
                        arabicExams: arabicExams.length,
                        englishExams: englishExams.length,
                        publishedExams: publishedExams.length,
                        draftExams: draftExams.length,
                        totalLessonQuestions: 0,
                    });

                    setRecentExams(exams.slice(0, 6).map(e => ({
                        id: e.id,
                        title: e.exam_title,
                        language: e.language,
                        type: e.type,
                        isPublished: e.is_published,
                        usageScope: e.usage_scope,
                        createdAt: e.created_at,
                        blocksCount: (Array.isArray(e.blocks) ? e.blocks.length : 0) || (Array.isArray(e.sections) ? e.sections.length : 0) || 0,
                    })));
                }
            } catch (err) {
                console.error("Error fetching data:", err);
            } finally {
                setIsLoading(false);
            }
        };

        fetchData();
    }, []);

    const formatDate = (dateString: string) => {
        const date = new Date(dateString);
        const now = new Date();
        const diffTime = Math.abs(now.getTime() - date.getTime());
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

        if (diffDays === 0) return "اليوم";
        if (diffDays === 1) return "أمس";
        if (diffDays < 7) return `منذ ${diffDays} أيام`;
        return date.toLocaleDateString('ar-EG', { month: 'short', day: 'numeric' });
    };

    if (isLoading) {
        return (
            <div className="flex items-center justify-center h-[60vh]">
                <div className="flex flex-col items-center gap-4">
                    <div className="relative">
                        <div className="w-16 h-16 rounded-full border-4 border-primary-200 dark:border-primary-900/50"></div>
                        <div className="absolute top-0 left-0 w-16 h-16 rounded-full border-4 border-primary-500 border-t-transparent animate-spin"></div>
                    </div>
                    <p className="text-gray-500 dark:text-gray-400 font-medium">جاري التحميل...</p>
                </div>
            </div>
        );
    }

    const quickActions = [
        {
            title: "امتحان عربي شامل",
            subtitle: "Arabic Comprehensive",
            description: "قراءة • شعر • نحو • تعبير",
            icon: BookOpen,
            href: "/admin/questions/arabic-comprehensive-exam",
            gradient: "from-emerald-500 via-emerald-600 to-teal-600",
            bgPattern: "bg-emerald-500/5",
            iconBg: "bg-emerald-500",
            badge: "عربي",
            badgeColor: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/50 dark:text-emerald-300",
        },
        {
            title: "امتحان إنجليزي شامل",
            subtitle: "English Comprehensive",
            description: "Vocab • Grammar • Reading • Essay",
            icon: Languages,
            href: "/admin/questions/english-comprehensive-exam",
            gradient: "from-blue-500 via-blue-600 to-indigo-600",
            bgPattern: "bg-blue-500/5",
            iconBg: "bg-blue-500",
            badge: "English",
            badgeColor: "bg-blue-100 text-blue-700 dark:bg-blue-900/50 dark:text-blue-300",
        },
    ];

    const navigationCards = [
        {
            title: "إدارة الامتحانات",
            description: "عرض وتعديل وحذف جميع الامتحانات المنشأة",
            icon: FileText,
            href: "/admin/exams",
            stats: `${stats?.totalComprehensiveExams || 0}`,
            statsLabel: "امتحان",
            color: "primary",
            iconBg: "bg-primary-500",
        },
        {
            title: "إدارة الدروس",
            description: "إدارة الدروس وأسئلة كل درس",
            icon: GraduationCap,
            href: "/admin/lessons",
            stats: "∞",
            statsLabel: "درس",
            color: "purple",
            iconBg: "bg-purple-500",
        },
        {
            title: "المراحل الدراسية",
            description: "تنظيم المراحل والمواد التعليمية",
            icon: Layers,
            href: "/admin/stages",
            stats: "📚",
            statsLabel: "تنظيم",
            color: "amber",
            iconBg: "bg-amber-500",
        },
    ];

    const statsCards = [
        {
            label: "امتحانات عربية",
            value: stats?.arabicExams || 0,
            icon: BookOpen,
            color: "emerald",
            gradient: "from-emerald-500 to-teal-500",
        },
        {
            label: "امتحانات إنجليزية",
            value: stats?.englishExams || 0,
            icon: Languages,
            color: "blue",
            gradient: "from-blue-500 to-indigo-500",
        },
        {
            label: "منشور",
            value: stats?.publishedExams || 0,
            icon: CheckCircle2,
            color: "green",
            gradient: "from-green-500 to-emerald-500",
        },
        {
            label: "مسودة",
            value: stats?.draftExams || 0,
            icon: Clock,
            color: "amber",
            gradient: "from-amber-500 to-orange-500",
        },
    ];

    return (
        <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            className="space-y-8"
        >
            {/* Hero Header */}
            <motion.div variants={itemVariants} className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-primary-600 via-primary-700 to-purple-700 p-8 text-white">
                {/* Background Pattern */}
                <div className="absolute inset-0 opacity-10">
                    <div className="absolute top-0 left-0 w-96 h-96 bg-white rounded-full -translate-x-1/2 -translate-y-1/2 blur-3xl"></div>
                    <div className="absolute bottom-0 right-0 w-96 h-96 bg-purple-300 rounded-full translate-x-1/2 translate-y-1/2 blur-3xl"></div>
                </div>

                <div className="relative z-10">
                    <div className="flex items-start justify-between">
                        <div className="flex items-center gap-4">
                            <div className="p-4 rounded-2xl bg-white/20 backdrop-blur-sm border border-white/10">
                                <HelpCircle className="h-8 w-8" />
                            </div>
                            <div>
                                <h1 className="text-3xl font-bold mb-1">مركز الأسئلة والامتحانات</h1>
                                <p className="text-white/80 text-lg">إنشاء وإدارة الامتحانات الشاملة بسهولة</p>
                            </div>
                        </div>
                        <div className="hidden md:flex items-center gap-3">
                            <div className="px-4 py-2 rounded-xl bg-white/10 backdrop-blur-sm border border-white/10">
                                <div className="flex items-center gap-2">
                                    <Sparkles className="h-5 w-5 text-amber-300" />
                                    <span className="font-semibold">{stats?.totalComprehensiveExams || 0} امتحان</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </motion.div>

            {/* Stats Grid */}
            <motion.div variants={itemVariants} className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                {statsCards.map((stat, index) => (
                    <motion.div
                        key={stat.label}
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: index * 0.1 }}
                        className="group relative overflow-hidden bg-white dark:bg-[#1c1c24] rounded-2xl p-5 border border-gray-200/80 dark:border-[#2e2e3a]/80 hover:border-gray-300 dark:hover:border-[#3e3e4a] transition-all duration-300 hover:shadow-lg"
                    >
                        <div className="flex items-center justify-between mb-3">
                            <div className={`p-2.5 rounded-xl bg-gradient-to-br ${stat.gradient} shadow-lg`}>
                                <stat.icon className="h-5 w-5 text-white" />
                            </div>
                            <div className="flex items-center gap-1 text-green-500">
                                <TrendingUp className="h-4 w-4" />
                            </div>
                        </div>
                        <div>
                            <p className="text-3xl font-bold text-gray-900 dark:text-white mb-1">{stat.value}</p>
                            <p className="text-sm text-gray-500 dark:text-gray-400">{stat.label}</p>
                        </div>
                        {/* Hover Gradient */}
                        <div className={`absolute inset-0 bg-gradient-to-br ${stat.gradient} opacity-0 group-hover:opacity-5 transition-opacity duration-300`}></div>
                    </motion.div>
                ))}
            </motion.div>

            {/* Quick Actions - Create Exams */}
            <motion.div variants={itemVariants}>
                <div className="flex items-center justify-between mb-5">
                    <div className="flex items-center gap-3">
                        <div className="p-2 rounded-lg bg-gradient-to-br from-primary-500 to-purple-500">
                            <Plus className="h-5 w-5 text-white" />
                        </div>
                        <h2 className="text-xl font-bold text-gray-900 dark:text-white">إنشاء امتحان جديد</h2>
                    </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    {quickActions.map((action, i) => (
                        <Link key={i} href={action.href}>
                            <motion.div
                                variants={cardHoverVariants}
                                initial="rest"
                                whileHover="hover"
                                className={`relative overflow-hidden p-6 rounded-2xl bg-white dark:bg-[#1c1c24] border border-gray-200 dark:border-[#2e2e3a] cursor-pointer group transition-all duration-300 hover:shadow-xl hover:border-transparent`}
                            >
                                {/* Background Gradient on Hover */}
                                <div className={`absolute inset-0 bg-gradient-to-br ${action.gradient} opacity-0 group-hover:opacity-5 transition-opacity duration-500`}></div>

                                {/* Content */}
                                <div className="relative z-10">
                                    <div className="flex items-start justify-between mb-4">
                                        <div className={`p-3 rounded-xl ${action.iconBg} shadow-lg`}>
                                            <action.icon className="h-6 w-6 text-white" />
                                        </div>
                                        <span className={`px-3 py-1 rounded-full text-xs font-semibold ${action.badgeColor}`}>
                                            {action.badge}
                                        </span>
                                    </div>

                                    <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-1">
                                        {action.title}
                                    </h3>
                                    <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
                                        {action.description}
                                    </p>

                                    <div className="flex items-center justify-between">
                                        <span className="text-xs text-gray-400 dark:text-gray-500">
                                            {action.subtitle}
                                        </span>
                                        <div className="flex items-center gap-2 text-primary-600 dark:text-primary-400 font-semibold text-sm group-hover:translate-x-1 transition-transform">
                                            <span>إنشاء</span>
                                            <ArrowRight className="h-4 w-4 rotate-180" />
                                        </div>
                                    </div>
                                </div>

                                {/* Decorative Elements */}
                                <div className={`absolute -bottom-8 -left-8 w-32 h-32 bg-gradient-to-br ${action.gradient} opacity-5 rounded-full blur-2xl group-hover:opacity-10 transition-opacity`}></div>
                            </motion.div>
                        </Link>
                    ))}
                </div>
            </motion.div>

            {/* Navigation Cards */}
            <motion.div variants={itemVariants}>
                <div className="flex items-center gap-3 mb-5">
                    <div className="p-2 rounded-lg bg-gray-100 dark:bg-gray-800">
                        <Layers className="h-5 w-5 text-gray-600 dark:text-gray-400" />
                    </div>
                    <h2 className="text-xl font-bold text-gray-900 dark:text-white">أقسام الإدارة</h2>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {navigationCards.map((card, i) => (
                        <Link key={i} href={card.href}>
                            <motion.div
                                whileHover={{ y: -4, scale: 1.01 }}
                                className="group bg-white dark:bg-[#1c1c24] rounded-2xl p-5 border border-gray-200 dark:border-[#2e2e3a] hover:border-primary-300 dark:hover:border-primary-700 transition-all duration-300 hover:shadow-lg h-full"
                            >
                                <div className="flex items-center gap-4 mb-4">
                                    <div className={`p-3 rounded-xl ${card.iconBg} shadow-lg group-hover:scale-110 transition-transform`}>
                                        <card.icon className="h-5 w-5 text-white" />
                                    </div>
                                    <div className="flex-1">
                                        <h3 className="font-bold text-gray-900 dark:text-white">{card.title}</h3>
                                    </div>
                                    <ChevronRight className="h-5 w-5 text-gray-400 group-hover:text-primary-500 group-hover:-translate-x-1 transition-all" />
                                </div>
                                <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">{card.description}</p>
                                <div className="flex items-center gap-2">
                                    <span className="text-2xl font-bold text-gray-900 dark:text-white">{card.stats}</span>
                                    <span className="text-xs text-gray-400">{card.statsLabel}</span>
                                </div>
                            </motion.div>
                        </Link>
                    ))}
                </div>
            </motion.div>

            {/* Recent Exams */}
            {recentExams.length > 0 && (
                <motion.div variants={itemVariants}>
                    <div className="flex items-center justify-between mb-5">
                        <div className="flex items-center gap-3">
                            <div className="p-2 rounded-lg bg-amber-100 dark:bg-amber-900/30">
                                <Clock className="h-5 w-5 text-amber-600 dark:text-amber-400" />
                            </div>
                            <h2 className="text-xl font-bold text-gray-900 dark:text-white">أحدث الامتحانات</h2>
                        </div>
                        <Link
                            href="/admin/exams"
                            className="flex items-center gap-2 text-sm text-primary-600 dark:text-primary-400 hover:underline font-medium"
                        >
                            <span>عرض الكل</span>
                            <ArrowRight className="h-4 w-4 rotate-180" />
                        </Link>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {recentExams.map((exam, index) => (
                            <motion.div
                                key={exam.id}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: index * 0.05 }}
                            >
                                <Link href={`/admin/questions/${exam.language}-comprehensive-exam?id=${exam.id}`}>
                                    <div className="group bg-white dark:bg-[#1c1c24] rounded-2xl p-5 border border-gray-200 dark:border-[#2e2e3a] hover:border-primary-300 dark:hover:border-primary-700 transition-all duration-300 hover:shadow-lg">
                                        {/* Header */}
                                        <div className="flex items-center justify-between mb-3">
                                            <span className={`px-2.5 py-1 rounded-lg text-xs font-semibold ${exam.language === "arabic"
                                                ? "bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400"
                                                : "bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400"
                                                }`}>
                                                {exam.language === "arabic" ? "عربي" : "English"}
                                            </span>
                                            <span className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium ${exam.isPublished
                                                ? "bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400"
                                                : "bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400"
                                                }`}>
                                                {exam.isPublished ? (
                                                    <><CheckCircle2 className="h-3 w-3" /> منشور</>
                                                ) : (
                                                    <><Clock className="h-3 w-3" /> مسودة</>
                                                )}
                                            </span>
                                        </div>

                                        {/* Title */}
                                        <h3 className="font-bold text-gray-900 dark:text-white text-sm line-clamp-2 mb-3 min-h-[40px] group-hover:text-primary-600 dark:group-hover:text-primary-400 transition-colors">
                                            {exam.title}
                                        </h3>

                                        {/* Meta */}
                                        <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
                                            <div className="flex items-center gap-1.5">
                                                <Calendar className="h-3.5 w-3.5" />
                                                <span>{formatDate(exam.createdAt)}</span>
                                            </div>
                                            <div className="flex items-center gap-1.5">
                                                <Layers className="h-3.5 w-3.5" />
                                                <span>{exam.blocksCount} قسم</span>
                                            </div>
                                        </div>

                                        {/* Edit Button */}
                                        <div className="mt-4 pt-3 border-t border-gray-100 dark:border-gray-800">
                                            <div className="flex items-center justify-center gap-2 text-primary-600 dark:text-primary-400 font-medium text-sm opacity-0 group-hover:opacity-100 transition-opacity">
                                                <Edit3 className="h-4 w-4" />
                                                <span>تعديل الامتحان</span>
                                            </div>
                                        </div>
                                    </div>
                                </Link>
                            </motion.div>
                        ))}
                    </div>
                </motion.div>
            )}

            {/* Help Section */}
            <motion.div variants={itemVariants}>
                <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-slate-800 via-slate-900 to-slate-800 p-6 text-white">
                    {/* Pattern */}
                    <div className="absolute inset-0 opacity-20">
                        <div className="absolute inset-0" style={{
                            backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
                        }}></div>
                    </div>

                    <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-6">
                        <div className="flex items-start gap-4">
                            <div className="p-3 rounded-xl bg-white/10 backdrop-blur-sm">
                                <Target className="h-6 w-6" />
                            </div>
                            <div>
                                <h3 className="text-lg font-bold mb-2">كيف يعمل النظام؟</h3>
                                <div className="space-y-1 text-sm text-white/80">
                                    <p className="flex items-center gap-2">
                                        <Award className="h-4 w-4 text-amber-400" />
                                        <strong>امتحان شامل:</strong> امتحان كامل متعدد الأقسام للتقييم النهائي
                                    </p>
                                    <p className="flex items-center gap-2">
                                        <Zap className="h-4 w-4 text-blue-400" />
                                        <strong>أسئلة الدروس:</strong> أسئلة مرتبطة بدرس معين (من قسم الدروس)
                                    </p>
                                </div>
                            </div>
                        </div>
                        <Link
                            href="/admin/lessons"
                            className="flex items-center gap-2 px-6 py-3 bg-white text-slate-900 rounded-xl font-semibold hover:bg-gray-100 transition-colors whitespace-nowrap shadow-lg"
                        >
                            <span>إدارة أسئلة الدروس</span>
                            <ExternalLink className="h-4 w-4" />
                        </Link>
                    </div>
                </div>
            </motion.div>
        </motion.div>
    );
}
