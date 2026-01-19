"use client";

import { useState, useEffect } from "react";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import {
    FileText,
    ArrowRight,
    ArrowLeft,
    ClipboardList,
    BookOpen,
    Sparkles,
    Clock,
    GraduationCap,
} from "lucide-react";
import { StructuredData, createCourseStructuredData } from "@/components/StructuredData";
import { supabase, getProfile } from "@/lib/supabase";
import { logger } from "@/lib/utils/logger";
import { HomePageLessonsGridSkeleton } from "@/components/ui/Skeleton";
import type { SupportedLanguage } from "@/lib/i18n";

// ═══════════════════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════════════════

interface Lesson {
    id: string;
    title: string;
    description: string | null;
}

interface Exam {
    id: string;
    title: string;
    description: string | null;
    duration_minutes: number | null;
    type: 'comprehensive';
    total_marks?: number | null;
}

interface SubjectPageProps {
    subject: 'arabic' | 'english';
    subjectSlug: string;
    subjectSearchPatterns: string;
}

interface Translations {
    subjectName: string;
    subjectColored: string;
    backToHome: string;
    lessonsTab: string;
    examsTab: string;
    lesson: string;
    noLessonsMessage: string;
    noExamsMessage: string;
    comprehensiveExam: string;
    exam: string;
    minutes: string;
    grade: string;
}

// ═══════════════════════════════════════════════════════════════════════════
// CONFIG
// ═══════════════════════════════════════════════════════════════════════════

const translations: Record<'arabic' | 'english', Translations> = {
    arabic: {
        subjectName: 'اللغة العربية',
        subjectColored: 'العربية',
        backToHome: 'العودة للرئيسية',
        lessonsTab: 'الدروس',
        examsTab: 'الامتحانات',
        lesson: 'درس',
        noLessonsMessage: 'لا توجد دروس لهذه المرحلة حالياً',
        noExamsMessage: 'لا توجد امتحانات لهذه المرحلة حالياً',
        comprehensiveExam: 'امتحان شامل',
        exam: 'امتحان',
        minutes: 'دقيقة',
        grade: 'درجة',
    },
    english: {
        subjectName: 'English',
        subjectColored: 'English',
        backToHome: 'Back to Home',
        lessonsTab: 'Lessons',
        examsTab: 'Exams',
        lesson: 'Lessons',
        noLessonsMessage: 'No lessons available for this stage',
        noExamsMessage: 'No exams available for this stage',
        comprehensiveExam: 'Comprehensive Exam',
        exam: 'Exam',
        minutes: 'min',
        grade: 'grade',
    },
};

// Animation variants
const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
        opacity: 1,
        transition: { staggerChildren: 0.04, delayChildren: 0.05 },
    },
};

const itemVariants = {
    hidden: { opacity: 0, y: 10 },
    visible: {
        opacity: 1,
        y: 0,
        transition: { duration: 0.3, ease: "easeOut" as const },
    },
};

const DEFAULT_STAGE_NAME = "الصف الثالث الثانوي";

// ═══════════════════════════════════════════════════════════════════════════
// COMPONENT
// ═══════════════════════════════════════════════════════════════════════════

export function SubjectPage({ subject, subjectSlug, subjectSearchPatterns }: SubjectPageProps) {
    const [activeTab, setActiveTab] = useState<"lessons" | "exams">("lessons");
    const [lessons, setLessons] = useState<Lesson[]>([]);
    const [exams, setExams] = useState<Exam[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [stageName, setStageName] = useState(DEFAULT_STAGE_NAME);

    const t = translations[subject];
    const isArabic = subject === 'arabic';
    const direction = isArabic ? 'rtl' : 'ltr';
    const BackArrow = isArabic ? ArrowRight : ArrowLeft;
    const layoutId = `activeTab${subject.charAt(0).toUpperCase() + subject.slice(1)}`;

    useEffect(() => {
        const fetchData = async () => {
            setIsLoading(true);
            try {
                let stageId: string | null = null;

                const { data: { user } } = await supabase.auth.getUser();
                if (user) {
                    const profile = await getProfile(user.id);
                    if ((profile as any)?.educational_stage_id) {
                        stageId = (profile as any).educational_stage_id;
                    }
                }

                if (!stageId) {
                    const { data: stages } = await supabase
                        .from("educational_stages")
                        .select("id, name")
                        .or("name.ilike.%ثالث%ثانوي%,name.ilike.%الثالث الثانوي%")
                        .limit(1);

                    if (stages && stages.length > 0) {
                        stageId = stages[0].id;
                        setStageName(stages[0].name);
                    }
                } else {
                    const { data: stage } = await supabase
                        .from("educational_stages")
                        .select("name")
                        .eq("id", stageId)
                        .single();

                    if (stage) {
                        setStageName(stage.name);
                    }
                }

                if (!stageId) {
                    setIsLoading(false);
                    return;
                }

                // Fetch subject
                const { data: subjectData } = await supabase
                    .from("subjects")
                    .select("id")
                    .or(subjectSearchPatterns)
                    .limit(1)
                    .single();

                if (!subjectData) {
                    setIsLoading(false);
                    return;
                }

                // Fetch lessons
                const { data: lessonsData } = await supabase
                    .from("lessons")
                    .select("id, title, description")
                    .eq("subject_id", subjectData.id)
                    .eq("stage_id", stageId)
                    .eq("is_published", true)
                    .order("order_index", { ascending: true });

                setLessons(lessonsData || []);

                // Fetch comprehensive_exams (امتحانات الأدمن فقط)
                const { data: comprehensiveData } = await supabase
                    .from("comprehensive_exams")
                    .select("id, exam_title, exam_description, duration_minutes, total_marks")
                    .eq("language", subject)
                    .eq("is_published", true)
                    .or(`stage_id.eq.${stageId},stage_id.is.null`)
                    .order("created_at", { ascending: false });

                // Format comprehensive exams
                const formattedComprehensive: Exam[] = (comprehensiveData || []).map(e => ({
                    id: e.id,
                    title: e.exam_title || (isArabic ? 'امتحان شامل' : 'Comprehensive Exam'),
                    description: e.exam_description || null,
                    duration_minutes: e.duration_minutes,
                    total_marks: e.total_marks,
                    type: 'comprehensive' as const
                }));

                // Set exams (comprehensive only - امتحانات الأدمن فقط)
                setExams(formattedComprehensive);

            } catch (error) {
                logger.error('Error fetching data', { context: `${subject}Page`, data: error });
            } finally {
                setIsLoading(false);
            }
        };

        fetchData();
    }, [subject, subjectSearchPatterns, isArabic]);

    const courseStructuredData = createCourseStructuredData(
        t.subjectName,
        isArabic
            ? "دروس وامتحانات شاملة في النحو والصرف والبلاغة والأدب"
            : "Comprehensive English lessons and exams",
        `https://qalaa.com/${subject}`,
        lessons.map((lesson) => ({
            name: lesson.title,
            description: lesson.description || "",
        }))
    );

    return (
        <>
            <StructuredData data={courseStructuredData} />
            <div
                className="min-h-screen flex flex-col bg-gradient-to-b from-gray-50 via-white to-gray-50 dark:from-[#0a0a0f] dark:via-[#121218] dark:to-[#0a0a0f]"
                dir={direction}
            >
                <Navbar />

                <main className="relative z-10 min-h-[calc(100vh-80px)]">
                    {/* Header Section */}
                    <section className="container mx-auto px-4 sm:px-6 lg:px-8 pt-4 pb-5 max-w-6xl">
                        {/* Back Button */}
                        <Link
                            href="/"
                            className="inline-flex items-center gap-2 text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors mb-4 text-sm"
                        >
                            <BackArrow className="h-4 w-4" />
                            <span>{t.backToHome}</span>
                        </Link>

                        {/* Title Row */}
                        <motion.div
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.3 }}
                            className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4"
                        >
                            {/* Left: Title + Stats */}
                            <div className="flex items-center gap-4">
                                <div className="p-3 rounded-xl bg-gradient-to-br from-primary-500 to-primary-600 shadow-lg shadow-primary-500/25">
                                    {isArabic ? (
                                        <FileText className="h-6 w-6 text-white" />
                                    ) : (
                                        <BookOpen className="h-6 w-6 text-white" />
                                    )}
                                </div>
                                <div>
                                    <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900 dark:text-white mb-1">
                                        {isArabic ? 'اللغة ' : ''}
                                        <span className="bg-gradient-to-r from-primary-600 to-pink-500 dark:from-primary-400 dark:to-pink-400 bg-clip-text text-transparent">
                                            {t.subjectColored}
                                        </span>
                                    </h1>
                                    <div className="flex items-center gap-3 text-sm text-gray-500 dark:text-gray-400">
                                        <div className={`flex items-center gap-1.5 ${!isArabic ? 'rtl' : ''}`} dir={isArabic ? 'rtl' : 'rtl'}>
                                            <Sparkles className="h-3.5 w-3.5 text-primary-500" />
                                            <span>{stageName}</span>
                                        </div>
                                        <span className="text-gray-300 dark:text-gray-600">|</span>
                                        <div className="flex items-center gap-1.5">
                                            <BookOpen className="h-3.5 w-3.5" />
                                            <span>{lessons.length} {t.lesson}</span>
                                        </div>
                                        <span className="text-gray-300 dark:text-gray-600">|</span>
                                        <div className="flex items-center gap-1.5">
                                            <ClipboardList className="h-3.5 w-3.5" />
                                            <span>{exams.length} {t.exam}</span>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Right: Tabs */}
                            <div className="inline-flex bg-gray-100 dark:bg-[#1c1c24] rounded-xl p-1.5 border border-gray-200/60 dark:border-[#2e2e3a]">
                                <button
                                    onClick={() => setActiveTab("lessons")}
                                    className={`relative px-5 py-2 rounded-lg text-sm font-semibold transition-all duration-300 ${activeTab === "lessons"
                                        ? "text-white"
                                        : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
                                        }`}
                                >
                                    {activeTab === "lessons" && (
                                        <motion.div
                                            layoutId={layoutId}
                                            className="absolute inset-0 bg-gradient-to-r from-primary-500 to-primary-600 rounded-lg shadow-lg shadow-primary-500/25"
                                            transition={{ type: "spring", stiffness: 400, damping: 30 }}
                                        />
                                    )}
                                    <span className="relative z-10 flex items-center gap-2">
                                        <BookOpen className="h-4 w-4" />
                                        {t.lessonsTab}
                                    </span>
                                </button>
                                <button
                                    onClick={() => setActiveTab("exams")}
                                    className={`relative px-5 py-2 rounded-lg text-sm font-semibold transition-all duration-300 ${activeTab === "exams"
                                        ? "text-white"
                                        : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
                                        }`}
                                >
                                    {activeTab === "exams" && (
                                        <motion.div
                                            layoutId={layoutId}
                                            className="absolute inset-0 bg-gradient-to-r from-primary-500 to-primary-600 rounded-lg shadow-lg shadow-primary-500/25"
                                            transition={{ type: "spring", stiffness: 400, damping: 30 }}
                                        />
                                    )}
                                    <span className="relative z-10 flex items-center gap-2">
                                        <ClipboardList className="h-4 w-4" />
                                        {t.examsTab}
                                    </span>
                                </button>
                            </div>
                        </motion.div>
                    </section>

                    {/* Content Section */}
                    <section className="container mx-auto px-4 sm:px-6 lg:px-8 pb-12 max-w-6xl">
                        <AnimatePresence mode="wait">
                            {activeTab === "lessons" ? (
                                <LessonsGrid
                                    lessons={lessons}
                                    isLoading={isLoading}
                                    subject={subject}
                                    translations={t}
                                    isArabic={isArabic}
                                    stageName={stageName}
                                />
                            ) : (
                                <ExamsGrid
                                    exams={exams}
                                    isLoading={isLoading}
                                    subject={subject}
                                    translations={t}
                                />
                            )}
                        </AnimatePresence>
                    </section>
                </main>

                <Footer />
            </div>
        </>
    );
}

// ═══════════════════════════════════════════════════════════════════════════
// SUB-COMPONENTS
// ═══════════════════════════════════════════════════════════════════════════

interface LessonsGridProps {
    lessons: Lesson[];
    isLoading: boolean;
    subject: string;
    translations: Translations;
    isArabic: boolean;
    stageName?: string;
}

function LessonsGrid({ lessons, isLoading, subject, translations: t, isArabic, stageName }: LessonsGridProps) {
    if (isLoading) {
        return <HomePageLessonsGridSkeleton count={8} />;
    }

    if (lessons.length === 0) {
        return (
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="text-center py-16"
            >
                {isArabic ? (
                    <FileText className="h-14 w-14 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
                ) : (
                    <BookOpen className="h-14 w-14 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
                )}
                <p className="text-gray-500 dark:text-gray-400 text-lg">{t.noLessonsMessage}</p>
            </motion.div>
        );
    }

    return (
        <motion.div
            key="lessons"
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            exit={{ opacity: 0 }}
            className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4"
        >
            {lessons.map((lesson) => (
                <motion.div key={lesson.id} variants={itemVariants}>
                    <Link href={`/${subject}/${lesson.id}`} className="block group">
                        {/* Premium Glassmorphism Card - Purple Theme */}
                        <div className="relative overflow-hidden rounded-2xl transition-all duration-300 group-hover:scale-[1.02] group-hover:shadow-xl group-hover:shadow-violet-500/20">
                            {/* Gradient Border - Purple only */}
                            <div className="absolute inset-0 bg-gradient-to-br from-violet-500 via-purple-500 to-indigo-500 rounded-2xl p-[1.5px]" />

                            {/* Glass Background */}
                            <div className="absolute inset-[1.5px] rounded-[14px] bg-white/90 dark:bg-slate-900/90 backdrop-blur-xl" />

                            {/* Purple Cloud Glow Effect */}
                            <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-violet-500/8 via-transparent to-purple-500/8 dark:from-violet-500/15 dark:via-transparent dark:to-purple-500/15" />
                            <div className="absolute -top-10 -right-10 w-24 h-24 bg-violet-500/15 dark:bg-violet-500/25 rounded-full blur-2xl" />
                            <div className="absolute -bottom-6 -left-6 w-20 h-20 bg-purple-500/10 dark:bg-purple-500/20 rounded-full blur-xl" />

                            {/* Card Content */}
                            <div className="relative rounded-2xl p-4">
                                {/* Top Glow Line */}
                                <div className="absolute top-0 left-8 right-8 h-[1px] bg-gradient-to-r from-transparent via-violet-400/30 to-transparent" />

                                {/* Icon - Purple gradient */}
                                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-500 to-purple-600 shadow-lg shadow-violet-500/25 flex items-center justify-center mb-3 group-hover:shadow-xl group-hover:shadow-violet-500/35 transition-all">
                                    {isArabic ? (
                                        <FileText className="h-5 w-5 text-white" />
                                    ) : (
                                        <BookOpen className="h-5 w-5 text-white" />
                                    )}
                                </div>

                                {/* Title */}
                                <h3 className="text-sm font-bold text-gray-800 dark:text-white mb-2 group-hover:text-violet-600 dark:group-hover:text-violet-300 transition-colors line-clamp-2">
                                    {lesson.title}
                                </h3>

                                {/* Description */}
                                {lesson.description && (
                                    <p className="text-xs text-gray-600 dark:text-gray-400 line-clamp-2 mb-2">
                                        {lesson.description}
                                    </p>
                                )}

                                {/* Stage Badge - Purple theme */}
                                {stageName && (
                                    <div className="flex items-center gap-1 pt-2 border-t border-violet-200/40 dark:border-violet-500/20">
                                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-violet-500/10 dark:bg-violet-500/15 backdrop-blur-sm border border-violet-300/30 dark:border-violet-400/20 text-[10px] font-medium text-violet-700 dark:text-violet-300">
                                            <GraduationCap className="h-3 w-3" />
                                            <span className="truncate max-w-[80px]">{stageName}</span>
                                        </span>
                                    </div>
                                )}

                                {/* Corner Sparkle */}
                                <div className="absolute bottom-2 right-2">
                                    <Sparkles className="h-4 w-4 text-violet-400/50 group-hover:text-violet-500 transition-colors" />
                                </div>
                            </div>
                        </div>
                    </Link>
                </motion.div>
            ))}
        </motion.div>
    );
}

interface ExamsGridProps {
    exams: Exam[];
    isLoading: boolean;
    subject: string;
    translations: Translations;
}

function ExamsGrid({ exams, isLoading, subject, translations: t }: ExamsGridProps) {
    const isArabic = subject === 'arabic';

    if (isLoading) {
        return <HomePageLessonsGridSkeleton count={6} />;
    }

    if (exams.length === 0) {
        return (
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="text-center py-16"
            >
                <ClipboardList className="h-14 w-14 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
                <p className="text-gray-500 dark:text-gray-400 text-lg">{t.noExamsMessage}</p>
            </motion.div>
        );
    }

    return (
        <motion.div
            key="exams"
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            exit={{ opacity: 0 }}
            className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4"
        >
            {exams.map((exam) => (
                <motion.div key={`${exam.type}-${exam.id}`} variants={itemVariants}>
                    <Link
                        href={`/${subject}/exam/${exam.id}`}
                        className="block group"
                    >
                        {/* Premium Glassmorphism Card */}
                        <div className="relative overflow-hidden rounded-2xl transition-all duration-300 group-hover:scale-[1.02] group-hover:shadow-xl group-hover:shadow-violet-500/20">
                            {/* Gradient Border */}
                            <div className="absolute inset-0 bg-gradient-to-br from-violet-500 via-purple-500 to-fuchsia-500 rounded-2xl p-[1.5px]" />

                            {/* Glass Background */}
                            <div className="absolute inset-[1.5px] rounded-[14px] bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl" />

                            {/* Violet Cloud Glow Effect */}
                            <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-violet-500/10 via-transparent to-purple-500/10 dark:from-violet-500/20 dark:via-transparent dark:to-purple-500/20" />
                            <div className="absolute -top-12 -right-12 w-32 h-32 bg-violet-500/20 dark:bg-violet-500/30 rounded-full blur-3xl" />
                            <div className="absolute -bottom-8 -left-8 w-24 h-24 bg-purple-500/15 dark:bg-purple-500/25 rounded-full blur-2xl" />

                            {/* Card Content */}
                            <div className="relative rounded-2xl p-5">
                                {/* Top Glow Line */}
                                <div className="absolute top-0 left-10 right-10 h-[1px] bg-gradient-to-r from-transparent via-violet-400/40 to-transparent" />

                                {/* Header Row */}
                                <div className="flex items-center justify-between mb-4">
                                    {/* Badge - Premium gradient */}
                                    <span className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-gradient-to-r from-violet-500 to-purple-500 text-xs font-bold text-white shadow-lg shadow-violet-500/30">
                                        <Sparkles className="h-3.5 w-3.5" />
                                        {exam.type === 'comprehensive' ? t.comprehensiveExam : t.exam}
                                    </span>

                                    {/* Icon Circle - Premium gradient */}
                                    <div className="w-11 h-11 rounded-full bg-gradient-to-br from-violet-500 to-purple-500 shadow-lg shadow-violet-500/30 flex items-center justify-center group-hover:shadow-xl group-hover:shadow-violet-500/40 transition-all">
                                        <ClipboardList className="h-5 w-5 text-white" />
                                    </div>
                                </div>

                                {/* Title */}
                                <h3 className="text-lg font-bold text-gray-800 dark:text-white mb-3 group-hover:text-violet-600 dark:group-hover:text-violet-200 transition-colors">
                                    {exam.title}
                                </h3>

                                {/* Meta Info */}
                                <div className="flex items-center gap-3 text-sm text-gray-600 dark:text-violet-300/80 mb-4">
                                    <div className="flex items-center gap-1.5">
                                        <GraduationCap className="h-4 w-4 text-violet-500" />
                                        <span>{isArabic ? 'الصف الثالث الثانوي' : '3rd Secondary'}</span>
                                    </div>
                                    <div className="w-1 h-1 rounded-full bg-violet-400/50" />
                                    <span>{isArabic ? 'لغة عربية' : 'English'}</span>
                                </div>

                                {/* Stats Row */}
                                <div className="flex items-center gap-4 pt-3 border-t border-violet-200/50 dark:border-violet-500/20">
                                    {exam.duration_minutes && (
                                        <div className="flex items-center gap-1.5 text-sm text-gray-600 dark:text-violet-300/70">
                                            <Clock className="h-4 w-4 text-violet-500" />
                                            <span>{exam.duration_minutes} {t.minutes}</span>
                                        </div>
                                    )}
                                    {exam.total_marks && (
                                        <div className="flex items-center gap-1.5 text-sm text-gray-600 dark:text-violet-300/70">
                                            <FileText className="h-4 w-4 text-violet-500" />
                                            <span>{exam.total_marks} {t.grade}</span>
                                        </div>
                                    )}
                                </div>

                                {/* Corner Sparkle */}
                                <div className="absolute bottom-3 right-3">
                                    <Sparkles className="h-5 w-5 text-violet-400/60 group-hover:text-violet-500 transition-colors" />
                                </div>
                            </div>
                        </div>
                    </Link>
                </motion.div>
            ))}
        </motion.div>
    );
}

