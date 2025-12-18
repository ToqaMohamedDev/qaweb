"use client";

import { useState, useEffect } from "react";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import {
    BookOpen,
    ArrowLeft,
    ClipboardList,
    Sparkles,
    Clock,
} from "lucide-react";
import { StructuredData, createCourseStructuredData } from "@/components/StructuredData";
import { supabase, getUserProfile } from "@/lib/supabase";
import { HomePageLessonsGridSkeleton } from "@/components/ui/Skeleton";

// Types
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
}

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

export default function EnglishPage() {
    const [activeTab, setActiveTab] = useState<"lessons" | "exams">("lessons");
    const [lessons, setLessons] = useState<Lesson[]>([]);
    const [exams, setExams] = useState<Exam[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [stageName, setStageName] = useState(DEFAULT_STAGE_NAME);

    useEffect(() => {
        const fetchData = async () => {
            setIsLoading(true);
            try {
                let stageId: string | null = null;

                const { data: { user } } = await supabase.auth.getUser();
                if (user) {
                    const profile = await getUserProfile(user.id);
                    if (profile?.educational_stage_id) {
                        stageId = profile.educational_stage_id;
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

                const { data: englishSubject } = await supabase
                    .from("subjects")
                    .select("id")
                    .or("slug.eq.english,name.ilike.%english%,name.ilike.%انجليزي%")
                    .limit(1)
                    .single();

                if (!englishSubject) {
                    setIsLoading(false);
                    return;
                }

                const { data: lessonsData } = await supabase
                    .from("lessons")
                    .select("id, title, description")
                    .eq("subject_id", englishSubject.id)
                    .eq("stage_id", stageId)
                    .eq("is_published", true)
                    .order("order_index", { ascending: true });

                setLessons(lessonsData || []);

                const { data: examsData } = await supabase
                    .from("exam_templates")
                    .select("id, title, description, duration_minutes")
                    .eq("subject_id", englishSubject.id)
                    .eq("stage_id", stageId)
                    .eq("is_active", true)
                    .order("created_at", { ascending: false });

                setExams(examsData || []);

            } catch (error) {
                console.error("Error fetching data:", error);
            } finally {
                setIsLoading(false);
            }
        };

        fetchData();
    }, []);

    const courseStructuredData = createCourseStructuredData(
        "English",
        "Comprehensive English lessons and exams",
        "https://qalaa.com/english",
        lessons.map((lesson) => ({
            name: lesson.title,
            description: lesson.description || "",
        }))
    );

    return (
        <>
            <StructuredData data={courseStructuredData} />
            <div className="min-h-screen bg-gradient-to-b from-gray-50 via-white to-gray-50 dark:from-[#0a0a0f] dark:via-[#121218] dark:to-[#0a0a0f]" dir="ltr">
                <Navbar />

                <main className="relative z-10">
                    {/* Header Section */}
                    <section className="container mx-auto px-4 sm:px-6 lg:px-8 pt-4 pb-5 max-w-6xl">
                        {/* Back Button */}
                        <Link
                            href="/"
                            className="inline-flex items-center gap-2 text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors mb-4 text-sm"
                        >
                            <ArrowLeft className="h-4 w-4" />
                            <span>Back to Home</span>
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
                                    <BookOpen className="h-6 w-6 text-white" />
                                </div>
                                <div>
                                    <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900 dark:text-white mb-1">
                                        <span className="bg-gradient-to-r from-primary-600 to-pink-500 dark:from-primary-400 dark:to-pink-400 bg-clip-text text-transparent">English</span>
                                    </h1>
                                    <div className="flex items-center gap-3 text-sm text-gray-500 dark:text-gray-400">
                                        <div className="flex items-center gap-1.5" dir="rtl">
                                            <Sparkles className="h-3.5 w-3.5 text-primary-500" />
                                            <span>{stageName}</span>
                                        </div>
                                        <span className="text-gray-300 dark:text-gray-600">|</span>
                                        <div className="flex items-center gap-1.5">
                                            <BookOpen className="h-3.5 w-3.5" />
                                            <span>{lessons.length} Lessons</span>
                                        </div>
                                        <span className="text-gray-300 dark:text-gray-600">|</span>
                                        <div className="flex items-center gap-1.5">
                                            <ClipboardList className="h-3.5 w-3.5" />
                                            <span>{exams.length} Exams</span>
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
                                            layoutId="activeTabEnglish"
                                            className="absolute inset-0 bg-gradient-to-r from-primary-500 to-primary-600 rounded-lg shadow-lg shadow-primary-500/25"
                                            transition={{ type: "spring", stiffness: 400, damping: 30 }}
                                        />
                                    )}
                                    <span className="relative z-10 flex items-center gap-2">
                                        <BookOpen className="h-4 w-4" />
                                        Lessons
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
                                            layoutId="activeTabEnglish"
                                            className="absolute inset-0 bg-gradient-to-r from-primary-500 to-primary-600 rounded-lg shadow-lg shadow-primary-500/25"
                                            transition={{ type: "spring", stiffness: 400, damping: 30 }}
                                        />
                                    )}
                                    <span className="relative z-10 flex items-center gap-2">
                                        <ClipboardList className="h-4 w-4" />
                                        Exams
                                    </span>
                                </button>
                            </div>
                        </motion.div>
                    </section>

                    {/* Content Section */}
                    <section className="container mx-auto px-4 sm:px-6 lg:px-8 pb-12 max-w-6xl">
                        <AnimatePresence mode="wait">
                            {activeTab === "lessons" ? (
                                isLoading ? (
                                    <HomePageLessonsGridSkeleton count={7} />
                                ) : lessons.length === 0 ? (
                                    <motion.div
                                        initial={{ opacity: 0 }}
                                        animate={{ opacity: 1 }}
                                        className="text-center py-16"
                                    >
                                        <BookOpen className="h-14 w-14 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
                                        <p className="text-gray-500 dark:text-gray-400 text-lg">No lessons available for this stage</p>
                                    </motion.div>
                                ) : (
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
                                                <Link href={`/english/${lesson.id}`} className="block group h-full">
                                                    <div className="h-full bg-white dark:bg-[#1c1c24] rounded-xl p-4 border border-gray-200/60 dark:border-[#2e2e3a] hover:border-primary-400 dark:hover:border-primary-600 shadow-sm hover:shadow-lg transition-all duration-200 group-hover:-translate-y-1">
                                                        <div className="p-2.5 rounded-lg bg-primary-100 dark:bg-primary-900/30 w-fit mb-3 group-hover:scale-105 transition-transform">
                                                            <BookOpen className="h-5 w-5 text-primary-600 dark:text-primary-400" />
                                                        </div>
                                                        <h3 className="text-base font-bold text-gray-900 dark:text-white mb-1.5 group-hover:text-primary-600 dark:group-hover:text-primary-400 transition-colors">
                                                            {lesson.title}
                                                        </h3>
                                                        <p className="text-sm text-gray-500 dark:text-gray-400 line-clamp-2">
                                                            {lesson.description || ""}
                                                        </p>
                                                    </div>
                                                </Link>
                                            </motion.div>
                                        ))}
                                    </motion.div>
                                )
                            ) : (
                                isLoading ? (
                                    <HomePageLessonsGridSkeleton count={6} />
                                ) : exams.length === 0 ? (
                                    <motion.div
                                        initial={{ opacity: 0 }}
                                        animate={{ opacity: 1 }}
                                        className="text-center py-16"
                                    >
                                        <ClipboardList className="h-14 w-14 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
                                        <p className="text-gray-500 dark:text-gray-400 text-lg">No exams available for this stage</p>
                                    </motion.div>
                                ) : (
                                    <motion.div
                                        key="exams"
                                        variants={containerVariants}
                                        initial="hidden"
                                        animate="visible"
                                        exit={{ opacity: 0 }}
                                        className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4"
                                    >
                                        {exams.map((exam) => (
                                            <motion.div key={exam.id} variants={itemVariants}>
                                                <Link href={`/english/exam/${exam.id}`} className="block group h-full">
                                                    <div className="h-full bg-white dark:bg-[#1c1c24] rounded-xl p-4 border border-primary-200/60 dark:border-primary-800/40 hover:border-primary-400 dark:hover:border-primary-600 shadow-sm hover:shadow-lg transition-all duration-200 group-hover:-translate-y-1">
                                                        <div className="flex items-start gap-3">
                                                            <div className="p-2.5 rounded-lg bg-primary-100 dark:bg-primary-900/30 shrink-0 group-hover:scale-105 transition-transform">
                                                                <ClipboardList className="h-5 w-5 text-primary-600 dark:text-primary-400" />
                                                            </div>
                                                            <div className="min-w-0 flex-1">
                                                                <div className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-primary-100/80 dark:bg-primary-900/30 text-xs font-semibold text-primary-700 dark:text-primary-300 mb-2">
                                                                    <Sparkles className="h-3 w-3" />
                                                                    Exam
                                                                </div>
                                                                <h3 className="text-base font-bold text-gray-900 dark:text-white mb-1 group-hover:text-primary-600 dark:group-hover:text-primary-400 transition-colors">
                                                                    {typeof exam.title === 'object' ? (exam.title as any).en || '' : exam.title}
                                                                </h3>
                                                                <p className="text-sm text-gray-500 dark:text-gray-400 line-clamp-2 mb-2">
                                                                    {typeof exam.description === 'object' ? (exam.description as any).en || '' : exam.description || ''}
                                                                </p>
                                                                {exam.duration_minutes && (
                                                                    <div className="flex items-center gap-1 text-xs text-gray-400">
                                                                        <Clock className="h-3.5 w-3.5" />
                                                                        <span>{exam.duration_minutes} min</span>
                                                                    </div>
                                                                )}
                                                            </div>
                                                        </div>
                                                    </div>
                                                </Link>
                                            </motion.div>
                                        ))}
                                    </motion.div>
                                )
                            )}
                        </AnimatePresence>
                    </section>
                </main>

                <Footer />
            </div>
        </>
    );
}
