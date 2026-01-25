"use client";

// =============================================
// Dynamic Subject Page - صفحة المادة الديناميكية الموحدة
// يتعامل مع أي مادة ويحدد اللغة تلقائياً
// =============================================

import { useState, useEffect, useMemo } from "react";
import { useParams, notFound } from "next/navigation";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import {
    ArrowRight,
    ArrowLeft,
    BookOpen,
    Sparkles,
    Clock,
    GraduationCap,
    ClipboardList,
    ChevronLeft,
} from "lucide-react";
import { HomePageLessonsGridSkeleton } from "@/components/ui/Skeleton";

// ═══════════════════════════════════════════════════════════════════════════
// TYPES & TRANSLATIONS
// ═══════════════════════════════════════════════════════════════════════════

interface Lesson {
    id: string;
    title: string;
    description: string | null;
    order_index?: number;
}

interface Exam {
    id: string;
    title: string;
    description: string | null;
    duration_minutes: number | null;
    type: 'comprehensive';
    total_marks?: number | null;
}

interface Subject {
    id: string;
    name: string;
    slug: string;
    icon?: string;
    color?: string;
    description?: string;
    language?: 'ar' | 'en';
}

// ترجمات للعربي والإنجليزي
const translations = {
    ar: {
        backToHome: 'العودة للرئيسية',
        lessonsTab: 'الدروس',
        examsTab: 'الامتحانات',
        lesson: 'درس',
        lessons: 'دروس',
        noLessons: 'لا توجد دروس لهذه المرحلة حالياً',
        noExams: 'لا توجد امتحانات لهذه المرحلة حالياً',
        minutes: 'دقيقة',
        grade: 'درجة',
        defaultExamTitle: 'امتحان شامل',
    },
    en: {
        backToHome: 'Back to Home',
        lessonsTab: 'Lessons',
        examsTab: 'Exams',
        lesson: 'Lesson',
        lessons: 'Lessons',
        noLessons: 'No lessons available for this stage',
        noExams: 'No exams available for this stage',
        minutes: 'min',
        grade: 'marks',
        defaultExamTitle: 'Comprehensive Exam',
    }
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

// ═══════════════════════════════════════════════════════════════════════════
// COMPONENT
// ═══════════════════════════════════════════════════════════════════════════

export default function DynamicSubjectPage() {
    const params = useParams();
    const subjectSlug = params.subjectSlug as string;

    const [activeTab, setActiveTab] = useState<"lessons" | "exams">("lessons");
    const [subject, setSubject] = useState<Subject | null>(null);
    const [lessons, setLessons] = useState<Lesson[]>([]);
    const [exams, setExams] = useState<Exam[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [stageName, setStageName] = useState("الصف الثالث الثانوي");
    const [notFoundError, setNotFoundError] = useState(false);

    // تحديد اللغة بناءً على حقل language في قاعدة البيانات
    const isEnglish = useMemo(() => {
        return subject?.language === 'en';
    }, [subject?.language]);

    const t = isEnglish ? translations.en : translations.ar;
    const direction = isEnglish ? 'ltr' : 'rtl';
    const BackArrow = isEnglish ? ArrowLeft : ArrowRight;


    useEffect(() => {
        const fetchData = async () => {
            setIsLoading(true);
            try {
                // 1. Fetch all stages
                const stagesRes = await fetch('/api/public/data?entity=stages');
                const stagesResult = await stagesRes.json();
                const allStages = stagesResult.data || [];

                // 2. Get user's stage
                let stageId: string | null = null;

                try {
                    const profileRes = await fetch('/api/profile');
                    const profileResult = await profileRes.json();

                    if (profileResult.success && profileResult.data?.profile?.educational_stage_id) {
                        const userStageId = profileResult.data.profile.educational_stage_id;
                        const userStage = allStages.find((s: { id: string; name: string }) => s.id === userStageId);

                        if (userStage) {
                            stageId = userStage.id;
                            setStageName(userStage.name);
                        }
                    }
                } catch {
                    console.log('Profile fetch skipped');
                }

                // Fallback to default stage
                if (!stageId) {
                    const defaultStage = allStages.find((s: { id: string; name: string }) =>
                        s.name?.includes('ثالث') && s.name?.includes('ثانوي')
                    );

                    if (defaultStage) {
                        stageId = defaultStage.id;
                        setStageName(defaultStage.name);
                    } else if (allStages.length > 0) {
                        stageId = allStages[0].id;
                        setStageName(allStages[0].name);
                    }
                }

                // 3. Fetch subjects and find matching one
                const subjectsRes = await fetch('/api/public/data?entity=subjects');
                const subjectsResult = await subjectsRes.json();
                const allSubjects = subjectsResult.data || [];

                const subjectData = allSubjects.find((s: Subject) => s.slug === subjectSlug);

                if (!subjectData) {
                    setNotFoundError(true);
                    setIsLoading(false);
                    return;
                }

                setSubject(subjectData);

                // 4. Fetch lessons for this subject and stage
                if (stageId) {
                    const lessonsRes = await fetch(`/api/public/data?entity=lessons&stageId=${stageId}&subjectId=${subjectData.id}`);
                    const lessonsResult = await lessonsRes.json();
                    setLessons(lessonsResult.data || []);

                    // 5. Fetch exams
                    const examsRes = await fetch(`/api/public/data?entity=exams&stageId=${stageId}&subjectId=${subjectData.id}`);
                    const examsResult = await examsRes.json();

                    const formattedExams: Exam[] = (examsResult.data || []).map((e: { id: string; title?: string; description?: string; duration_minutes?: number; total_marks?: number }) => ({
                        id: e.id,
                        title: e.title || (isEnglish ? 'Comprehensive Exam' : 'امتحان شامل'),
                        description: e.description || null,
                        duration_minutes: e.duration_minutes,
                        total_marks: e.total_marks,
                        type: 'comprehensive' as const
                    }));

                    setExams(formattedExams);
                }

            } catch (error) {
                console.error('Error fetching data:', error);
            } finally {
                setIsLoading(false);
            }
        };

        if (subjectSlug) {
            fetchData();
        }
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [subjectSlug]);

    // Show 404 if subject not found
    if (notFoundError) {
        notFound();
    }

    return (
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

                    {isLoading ? (
                        <div className="animate-pulse">
                            <div className="h-10 w-48 bg-gray-200 dark:bg-gray-700 rounded-lg mb-2" />
                            <div className="h-6 w-32 bg-gray-100 dark:bg-gray-800 rounded-lg" />
                        </div>
                    ) : subject && (
                        <motion.div
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.3 }}
                            className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4"
                        >
                            {/* Title + Stats */}
                            <div className="flex items-center gap-4">
                                <div 
                                    className="p-3 rounded-xl shadow-lg"
                                    style={{ 
                                        background: subject.color 
                                            ? `linear-gradient(135deg, ${subject.color}, ${subject.color}dd)` 
                                            : 'linear-gradient(135deg, #8B5CF6, #A78BFA)'
                                    }}
                                >
                                    <BookOpen className="h-6 w-6 text-white" />
                                </div>
                                <div>
                                    <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900 dark:text-white mb-1">
                                        <span 
                                            className="bg-clip-text text-transparent"
                                            style={{ 
                                                backgroundImage: subject.color 
                                                    ? `linear-gradient(to right, ${subject.color}, ${subject.color}cc)` 
                                                    : 'linear-gradient(to right, #8B5CF6, #EC4899)'
                                            }}
                                        >
                                            {subject.name}
                                        </span>
                                    </h1>
                                    <div className="flex items-center gap-3 text-sm text-gray-500 dark:text-gray-400">
                                        <div className="flex items-center gap-1.5">
                                            <Sparkles className="h-3.5 w-3.5 text-primary-500" />
                                            <span>{stageName}</span>
                                        </div>
                                        <span className="text-gray-300 dark:text-gray-600">|</span>
                                        <div className="flex items-center gap-1.5">
                                            <BookOpen className="h-3.5 w-3.5" />
                                            <span>{lessons.length} {lessons.length === 1 ? t.lesson : t.lessons}</span>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Stage Badge */}
                            <div className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white dark:bg-white/5 border border-gray-200 dark:border-white/10 shadow-sm">
                                <GraduationCap className="h-4 w-4 text-primary-500" />
                                <span className="text-sm font-semibold text-gray-700 dark:text-gray-300">{stageName}</span>
                            </div>
                        </motion.div>
                    )}
                </section>

                {/* Tabs */}
                <section className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-6xl">
                    <div className="flex gap-2 p-1.5 bg-gray-100 dark:bg-white/5 rounded-xl w-fit mb-6">
                        {[
                            { id: "lessons", label: t.lessonsTab, icon: BookOpen },
                            { id: "exams", label: t.examsTab, icon: ClipboardList },
                        ].map((tab) => (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id as "lessons" | "exams")}
                                className={`relative flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-semibold transition-all duration-200 ${
                                    activeTab === tab.id
                                        ? "text-white"
                                        : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
                                }`}
                            >
                                {activeTab === tab.id && (
                                    <motion.div
                                        layoutId="activeTabDynamic"
                                        className="absolute inset-0 bg-gradient-to-r from-primary-600 to-primary-500 rounded-lg"
                                        transition={{ type: "spring", bounce: 0.2, duration: 0.4 }}
                                    />
                                )}
                                <span className="relative z-10 flex items-center gap-2">
                                    <tab.icon className="h-4 w-4" />
                                    {tab.label}
                                </span>
                            </button>
                        ))}
                    </div>
                </section>

                {/* Content */}
                <section className="container mx-auto px-4 sm:px-6 lg:px-8 pb-16 max-w-6xl">
                    {isLoading ? (
                        <HomePageLessonsGridSkeleton count={6} />
                    ) : (
                        <AnimatePresence mode="wait">
                            {activeTab === "lessons" ? (
                                <motion.div
                                    key="lessons"
                                    initial="hidden"
                                    animate="visible"
                                    exit={{ opacity: 0 }}
                                    variants={containerVariants}
                                >
                                    {lessons.length === 0 ? (
                                        <div className="text-center py-16">
                                            <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-gray-100 dark:bg-gray-800 flex items-center justify-center">
                                                <BookOpen className="w-8 h-8 text-gray-400" />
                                            </div>
                                            <p className="text-gray-500 dark:text-gray-400">{t.noLessons}</p>
                                        </div>
                                    ) : (
                                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                                            {lessons.map((lesson, idx) => (
                                                <motion.div key={lesson.id} variants={itemVariants}>
                                                    <Link
                                                        href={`/${subjectSlug}/${lesson.id}`}
                                                        className="group relative block overflow-hidden rounded-2xl cursor-pointer h-full"
                                                    >
                                                        {/* Background with gradient border effect */}
                                                        <div 
                                                            className="absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500"
                                                            style={{ 
                                                                background: subject?.color 
                                                                    ? `linear-gradient(135deg, ${subject.color}30, ${subject.color}50)` 
                                                                    : 'linear-gradient(135deg, #8B5CF630, #A78BFA50)'
                                                            }}
                                                        />
                                                        
                                                        {/* Card Background */}
                                                        <div className="absolute inset-px rounded-[15px] bg-white dark:bg-[#14141c] transition-colors duration-300 border-2 border-gray-200/80 dark:border-gray-800/50" />
                                                        
                                                        {/* Glow Effect on Hover */}
                                                        <div 
                                                            className="absolute -top-20 -right-20 w-40 h-40 rounded-full blur-3xl opacity-0 group-hover:opacity-30 transition-opacity duration-500"
                                                            style={{ backgroundColor: subject?.color || '#8B5CF6' }}
                                                        />

                                                        {/* Content */}
                                                        <div className="relative p-4 sm:p-5">
                                                            <div className="flex items-start gap-4">
                                                                {/* أيقونة الدرس */}
                                                                <div className="relative">
                                                                    <div 
                                                                        className="w-14 h-14 rounded-xl flex items-center justify-center transition-all duration-300 group-hover:scale-110 group-hover:rotate-3"
                                                                        style={{ 
                                                                            background: subject?.color 
                                                                                ? `linear-gradient(135deg, ${subject.color}15, ${subject.color}25)` 
                                                                                : 'linear-gradient(135deg, #8B5CF615, #A78BFA25)',
                                                                            boxShadow: `0 4px 20px ${subject?.color || '#8B5CF6'}20`
                                                                        }}
                                                                    >
                                                                        <span className="text-2xl font-black" style={{ color: subject?.color || '#8B5CF6' }}>
                                                                            {idx + 1}
                                                                        </span>
                                                                    </div>
                                                                    {/* Sparkle badge */}
                                                                    <div 
                                                                        className="absolute -top-1 -right-1 w-5 h-5 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-300 scale-0 group-hover:scale-100"
                                                                        style={{ backgroundColor: subject?.color || '#8B5CF6' }}
                                                                    >
                                                                        <Sparkles className="w-3 h-3 text-white" />
                                                                    </div>
                                                                </div>

                                                                {/* المحتوى */}
                                                                <div className="flex-1 min-w-0 pt-1">
                                                                    <h3 className="text-base font-bold text-gray-900 dark:text-white truncate mb-1.5 transition-colors duration-300">
                                                                        {lesson.title}
                                                                    </h3>
                                                                    <p className="text-sm text-gray-500 dark:text-gray-400 line-clamp-2 mb-3">
                                                                        {lesson.description || t.lesson}
                                                                    </p>
                                                                    <div 
                                                                        className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold transition-all duration-300"
                                                                        style={{ 
                                                                            backgroundColor: subject?.color ? `${subject.color}10` : '#8B5CF610',
                                                                            color: subject?.color || '#8B5CF6'
                                                                        }}
                                                                    >
                                                                        <BookOpen className="w-3.5 h-3.5" />
                                                                        {t.lesson} {idx + 1}
                                                                    </div>
                                                                </div>
                                                            </div>

                                                            {/* Footer with arrow */}
                                                            <div className="flex items-center justify-end mt-4 pt-3 border-t border-gray-100 dark:border-gray-800">
                                                                <span 
                                                                    className="text-xs font-bold flex items-center gap-1 group-hover:gap-2 transition-all"
                                                                    style={{ color: subject?.color || '#8B5CF6' }}
                                                                >
                                                                    {isEnglish ? 'Start' : 'ابدأ'}
                                                                    <ChevronLeft className="w-4 h-4 rtl:rotate-180" />
                                                                </span>
                                                            </div>
                                                        </div>
                                                    </Link>
                                                </motion.div>
                                            ))}
                                        </div>
                                    )}
                                </motion.div>
                            ) : (
                                <motion.div
                                    key="exams"
                                    initial="hidden"
                                    animate="visible"
                                    exit={{ opacity: 0 }}
                                    variants={containerVariants}
                                >
                                    {exams.length === 0 ? (
                                        <div className="text-center py-16">
                                            <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-gray-100 dark:bg-gray-800 flex items-center justify-center">
                                                <ClipboardList className="w-8 h-8 text-gray-400" />
                                            </div>
                                            <p className="text-gray-500 dark:text-gray-400">{t.noExams}</p>
                                        </div>
                                    ) : (
                                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                                            {exams.map((exam) => (
                                                <motion.div key={exam.id} variants={itemVariants}>
                                                    <Link
                                                        href={`/${subjectSlug}/exam/${exam.id}`}
                                                        className="group relative block overflow-hidden rounded-2xl cursor-pointer h-full"
                                                    >
                                                        {/* Background with gradient border effect */}
                                                        <div 
                                                            className="absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500"
                                                            style={{ 
                                                                background: 'linear-gradient(135deg, #F59E0B30, #EF444450)'
                                                            }}
                                                        />
                                                        
                                                        {/* Card Background */}
                                                        <div className="absolute inset-px rounded-[15px] bg-white dark:bg-[#14141c] transition-colors duration-300 border-2 border-gray-200/80 dark:border-gray-800/50" />
                                                        
                                                        {/* Glow Effect on Hover */}
                                                        <div 
                                                            className="absolute -top-20 -right-20 w-40 h-40 rounded-full blur-3xl opacity-0 group-hover:opacity-30 transition-opacity duration-500"
                                                            style={{ backgroundColor: '#F59E0B' }}
                                                        />

                                                        {/* Content */}
                                                        <div className="relative p-4 sm:p-5">
                                                            <div className="flex items-start gap-4">
                                                                {/* أيقونة الامتحان */}
                                                                <div className="relative">
                                                                    <div 
                                                                        className="w-14 h-14 rounded-xl flex items-center justify-center transition-all duration-300 group-hover:scale-110 group-hover:rotate-3"
                                                                        style={{ 
                                                                            background: 'linear-gradient(135deg, #F59E0B15, #EF444425)',
                                                                            boxShadow: '0 4px 20px #F59E0B20'
                                                                        }}
                                                                    >
                                                                        <ClipboardList className="w-7 h-7" style={{ color: '#F59E0B' }} />
                                                                    </div>
                                                                    {/* Sparkle badge */}
                                                                    <div 
                                                                        className="absolute -top-1 -right-1 w-5 h-5 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-300 scale-0 group-hover:scale-100"
                                                                        style={{ backgroundColor: '#F59E0B' }}
                                                                    >
                                                                        <Sparkles className="w-3 h-3 text-white" />
                                                                    </div>
                                                                </div>

                                                                {/* المحتوى */}
                                                                <div className="flex-1 min-w-0 pt-1">
                                                                    <h3 className="text-base font-bold text-gray-900 dark:text-white truncate mb-1.5 transition-colors duration-300">
                                                                        {exam.title}
                                                                    </h3>
                                                                    <p className="text-sm text-gray-500 dark:text-gray-400 line-clamp-2 mb-3">
                                                                        {exam.description || (isEnglish ? 'Comprehensive exam' : 'امتحان شامل')}
                                                                    </p>
                                                                    <div className="flex items-center gap-2 flex-wrap">
                                                                        {exam.duration_minutes && (
                                                                            <div 
                                                                                className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold transition-all duration-300"
                                                                                style={{ 
                                                                                    backgroundColor: '#F59E0B10',
                                                                                    color: '#F59E0B'
                                                                                }}
                                                                            >
                                                                                <Clock className="w-3.5 h-3.5" />
                                                                                {exam.duration_minutes} {t.minutes}
                                                                            </div>
                                                                        )}
                                                                        {exam.total_marks && (
                                                                            <div 
                                                                                className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold transition-all duration-300"
                                                                                style={{ 
                                                                                    backgroundColor: '#EF444410',
                                                                                    color: '#EF4444'
                                                                                }}
                                                                            >
                                                                                {exam.total_marks} {t.grade}
                                                                            </div>
                                                                        )}
                                                                    </div>
                                                                </div>
                                                            </div>

                                                            {/* Footer with arrow */}
                                                            <div className="flex items-center justify-end mt-4 pt-3 border-t border-gray-100 dark:border-gray-800">
                                                                <span 
                                                                    className="text-xs font-bold flex items-center gap-1 group-hover:gap-2 transition-all"
                                                                    style={{ color: '#F59E0B' }}
                                                                >
                                                                    {isEnglish ? 'Start' : 'ابدأ'}
                                                                    <ChevronLeft className="w-4 h-4 rtl:rotate-180" />
                                                                </span>
                                                            </div>
                                                        </div>
                                                    </Link>
                                                </motion.div>
                                            ))}
                                        </div>
                                    )}
                                </motion.div>
                            )}
                        </AnimatePresence>
                    )}
                </section>
            </main>

            <Footer />
        </div>
    );
}
