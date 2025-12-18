"use client";

import { useState, useEffect } from "react";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { StructuredData, homeStructuredData } from "@/components/StructuredData";
import { HomePageLessonsGridSkeleton } from "@/components/ui/Skeleton";
import { motion } from "framer-motion";
import Link from "next/link";
import {
  FileText,
  BookOpen,
  ArrowLeft,
  ArrowRight,
  Sparkles,
  Award,
  Star,
  GraduationCap,
  Target,
  MessageSquare,
  Play,
  Rocket,
  Crown,
  TrendingUp,
  ClipboardList,
} from "lucide-react";
import { supabase, getUserProfile } from "@/lib/supabase";
import { User } from "@supabase/supabase-js";

// Types
interface Lesson {
  id: string;
  title: string;
  description: string | null;
  subject_id: string;
  stage_id: string | null;
}

interface Stage {
  id: string;
  name: string;
  slug: string;
}

// Mock Top Students Data (Hardcoded / Dummy Data)
const mockTopStudents = [
  {
    id: "1",
    userId: "user1",
    name: "أحمد محمد",
    examTitle: "امتحان النحو الشامل",
    score: 48,
    totalQuestions: 50,
    percentage: 96,
    completedAt: "2024-12-15",
  },
  {
    id: "2",
    userId: "user2",
    name: "سارة أحمد",
    examTitle: "امتحان البلاغة",
    score: 47,
    totalQuestions: 50,
    percentage: 94,
    completedAt: "2024-12-14",
  },
  {
    id: "3",
    userId: "user3",
    name: "محمود علي",
    examTitle: "امتحان القراءة",
    score: 46,
    totalQuestions: 50,
    percentage: 92,
    completedAt: "2024-12-13",
  },
  {
    id: "4",
    userId: "user4",
    name: "فاطمة حسن",
    examTitle: "English Grammar",
    score: 45,
    totalQuestions: 50,
    percentage: 90,
    completedAt: "2024-12-12",
  },
  {
    id: "5",
    userId: "user5",
    name: "عمر خالد",
    examTitle: "امتحان الصرف",
    score: 45,
    totalQuestions: 50,
    percentage: 90,
    completedAt: "2024-12-11",
  },
  {
    id: "6",
    userId: "user6",
    name: "نور الدين",
    examTitle: "امتحان الأدب",
    score: 45,
    totalQuestions: 50,
    percentage: 90,
    completedAt: "2024-12-10",
  },
];

// Detect iOS for performance optimizations
const isIOS = typeof window !== 'undefined' && /iPad|iPhone|iPod/.test(navigator.userAgent);

// Animation variants - reduced on iOS for better performance
const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: isIOS ? 0.02 : 0.08,
      delayChildren: isIOS ? 0.05 : 0.1,
    },
  },
};

const itemVariants = {
  hidden: { opacity: isIOS ? 0.5 : 0, y: isIOS ? 5 : 15 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: isIOS ? 0.2 : 0.4,
      ease: [0.25, 0.46, 0.45, 0.94] as const,
    },
  },
};

// Default stage name for 3rd secondary
const DEFAULT_STAGE_NAME = "الصف الثالث الثانوي";

export default function Home() {
  const [user, setUser] = useState<User | null>(null);
  const [userStageId, setUserStageId] = useState<string | null>(null);
  const [selectedStageName, setSelectedStageName] = useState<string>(DEFAULT_STAGE_NAME);
  const [arabicLessons, setArabicLessons] = useState<Lesson[]>([]);
  const [englishLessons, setEnglishLessons] = useState<Lesson[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Fetch user and their preferred stage
  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        setUser(user);

        if (user) {
          const profile = await getUserProfile(user.id);
          if (profile?.educational_stage_id) {
            setUserStageId(profile.educational_stage_id);
          }
        }
      } catch (error) {
        console.error("Error fetching user:", error);
      }
    };
    fetchUserData();
  }, []);

  // Fetch lessons based on stage
  useEffect(() => {
    const fetchLessons = async () => {
      setIsLoading(true);
      try {
        // Get the stage ID (user's preferred or default 3rd secondary)
        let stageId = userStageId;

        if (!stageId) {
          // Find default stage (ثالثة ثانوي)
          const { data: stages } = await supabase
            .from("educational_stages")
            .select("id, name")
            .or("name.ilike.%ثالث%ثانوي%,name.ilike.%الثالث الثانوي%")
            .limit(1);

          if (stages && stages.length > 0) {
            stageId = stages[0].id;
            setSelectedStageName(stages[0].name);
          }
        } else {
          // Get stage name for display
          const { data: stage } = await supabase
            .from("educational_stages")
            .select("name")
            .eq("id", stageId)
            .single();

          if (stage) {
            setSelectedStageName(stage.name);
          }
        }

        if (!stageId) {
          setIsLoading(false);
          return;
        }

        // Get Arabic subject ID (by slug or name)
        const { data: arabicSubject } = await supabase
          .from("subjects")
          .select("id")
          .or("slug.eq.arabic,name.ilike.%عربي%")
          .limit(1)
          .single();

        // Get English subject ID
        const { data: englishSubject } = await supabase
          .from("subjects")
          .select("id")
          .or("slug.eq.english,name.ilike.%english%,name.ilike.%انجليزي%")
          .limit(1)
          .single();

        // Fetch Arabic lessons
        if (arabicSubject) {
          const { data: arabic } = await supabase
            .from("lessons")
            .select("id, title, description, subject_id, stage_id")
            .eq("subject_id", arabicSubject.id)
            .eq("stage_id", stageId)
            .eq("is_published", true)
            .order("order_index", { ascending: true })
            .limit(8);

          setArabicLessons(arabic || []);
        }

        // Fetch English lessons
        if (englishSubject) {
          const { data: english } = await supabase
            .from("lessons")
            .select("id, title, description, subject_id, stage_id")
            .eq("subject_id", englishSubject.id)
            .eq("stage_id", stageId)
            .eq("is_published", true)
            .order("order_index", { ascending: true })
            .limit(8);

          setEnglishLessons(english || []);
        }

      } catch (error) {
        console.error("Error fetching lessons:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchLessons();
  }, [userStageId]);

  return (
    <>
      <StructuredData data={homeStructuredData} />
      <div
        className="min-h-screen bg-gradient-to-b from-gray-50 via-white to-gray-50 dark:from-[#0a0a0f] dark:via-[#121218] dark:to-[#0a0a0f]"
        dir="rtl"
      >
        {/* Subtle Background Pattern */}
        <div className="fixed inset-0 pointer-events-none overflow-hidden">
          <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-primary-200/15 dark:bg-primary-900/10 rounded-full blur-[100px]" />
          <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-primary-300/10 dark:bg-primary-800/10 rounded-full blur-[80px]" />
        </div>

        <Navbar />

        <main className="relative z-10">
          {/* ========== HERO SECTION ========== */}
          <section className="container mx-auto px-3 sm:px-6 lg:px-8 pt-3 pb-3 sm:pt-6 sm:pb-6 max-w-6xl">
            <motion.div
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4 }}
              className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4"
            >
              <div>
                <h1 className="text-xl sm:text-2xl md:text-3xl font-extrabold text-gray-900 dark:text-white mb-0.5 sm:mb-1">
                  مرحباً بك في{" "}
                  <span className="bg-gradient-to-r from-primary-600 to-pink-500 dark:from-primary-400 dark:to-pink-400 bg-clip-text text-transparent">
                    QAlaa
                  </span>
                </h1>
                <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">
                  {selectedStageName} - اختر المادة وابدأ رحلة التعلم
                </p>
              </div>

              {/* Quiz Battle Card */}
              <Link href="/game" className="group shrink-0 self-start sm:self-auto">
                <div className="flex items-center gap-2 sm:gap-3 px-3 sm:px-4 py-2 sm:py-2.5 rounded-lg sm:rounded-xl bg-gradient-to-r from-primary-600 to-pink-500 dark:from-primary-700 dark:to-pink-600 shadow-md shadow-primary-500/20 group-hover:shadow-lg group-hover:-translate-y-0.5 transition-all">
                  <Play className="h-3.5 sm:h-4 w-3.5 sm:w-4 text-white" />
                  <span className="text-xs sm:text-sm font-bold text-white">Quiz Battle</span>
                  <ArrowLeft className="h-3 sm:h-3.5 w-3 sm:w-3.5 text-white/80" />
                </div>
              </Link>
            </motion.div>
          </section>

          {/* ========== SUBJECTS NAVIGATION ========== */}
          <section className="container mx-auto px-3 sm:px-6 lg:px-8 pb-4 sm:pb-6 max-w-6xl">
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1, duration: 0.4 }}
              className="flex gap-2 sm:gap-3 overflow-x-auto pb-2 scrollbar-hide -mx-3 px-3 sm:mx-0 sm:px-0"
              style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
            >
              {/* Subject Cards - Horizontal Scroll */}
              <a href="#arabic" className="shrink-0">
                <div className="flex items-center gap-2 sm:gap-3 px-3 sm:px-5 py-2 sm:py-3 rounded-lg sm:rounded-xl bg-white dark:bg-[#1c1c24] border-2 border-primary-500 shadow-md hover:shadow-lg transition-all group">
                  <div className="p-1.5 sm:p-2 rounded-lg bg-primary-100 dark:bg-primary-900/30">
                    <FileText className="h-4 sm:h-5 w-4 sm:w-5 text-primary-600 dark:text-primary-400" />
                  </div>
                  <div>
                    <h3 className="font-bold text-gray-900 dark:text-white text-xs sm:text-sm">اللغة العربية</h3>
                    <p className="text-[10px] sm:text-xs text-gray-500 dark:text-gray-400">{arabicLessons.length} دروس</p>
                  </div>
                </div>
              </a>

              <a href="#english" className="shrink-0">
                <div className="flex items-center gap-2 sm:gap-3 px-3 sm:px-5 py-2 sm:py-3 rounded-lg sm:rounded-xl bg-white dark:bg-[#1c1c24] border border-gray-200/60 dark:border-[#2e2e3a] hover:border-primary-400 dark:hover:border-primary-600 shadow-sm hover:shadow-md transition-all group">
                  <div className="p-1.5 sm:p-2 rounded-lg bg-primary-100 dark:bg-primary-900/30">
                    <BookOpen className="h-4 sm:h-5 w-4 sm:w-5 text-primary-600 dark:text-primary-400" />
                  </div>
                  <div dir="ltr">
                    <h3 className="font-bold text-gray-900 dark:text-white text-xs sm:text-sm">English</h3>
                    <p className="text-[10px] sm:text-xs text-gray-500 dark:text-gray-400">{englishLessons.length} Lessons</p>
                  </div>
                </div>
              </a>

              {/* Future subjects placeholder - shows how easy to add */}
              <div className="shrink-0 flex items-center gap-2 sm:gap-3 px-3 sm:px-5 py-2 sm:py-3 rounded-lg sm:rounded-xl border-2 border-dashed border-gray-300 dark:border-gray-700 opacity-50">
                <div className="p-1.5 sm:p-2 rounded-lg bg-gray-100 dark:bg-gray-800">
                  <Sparkles className="h-4 sm:h-5 w-4 sm:w-5 text-gray-400" />
                </div>
                <div>
                  <h3 className="font-bold text-gray-400 text-xs sm:text-sm">مواد أخرى</h3>
                  <p className="text-[10px] sm:text-xs text-gray-400">قريباً...</p>
                </div>
              </div>
            </motion.div>
          </section>

          {/* ========== ARABIC LESSONS SECTION ========== */}
          <section id="arabic" className="py-6 sm:py-8 md:py-10 bg-gray-50/80 dark:bg-[#0d0d12]/80 scroll-mt-16 sm:scroll-mt-20">
            <div className="container mx-auto px-3 sm:px-6 lg:px-8 max-w-6xl">
              {/* Section Header */}
              <motion.div
                initial={{ opacity: 0, y: 15 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-50px" }}
                transition={{ duration: 0.4 }}
                className="flex items-center justify-between mb-4 sm:mb-5"
              >
                <div className="flex items-center gap-2 sm:gap-3">
                  <div className="p-2 sm:p-2.5 rounded-lg sm:rounded-xl bg-gradient-to-br from-primary-500 to-primary-600 shadow-md shadow-primary-500/25">
                    <FileText className="h-4 sm:h-5 w-4 sm:w-5 text-white" />
                  </div>
                  <div>
                    <h2 className="text-base sm:text-lg md:text-xl font-extrabold text-gray-900 dark:text-white">
                      اللغة العربية
                    </h2>
                    <p className="text-[10px] sm:text-xs text-gray-500 dark:text-gray-400 hidden xs:block">{arabicLessons.length} دروس</p>
                  </div>
                </div>
                <Link
                  href="/arabic"
                  className="flex items-center gap-1 sm:gap-1.5 px-2.5 sm:px-4 py-1.5 sm:py-2 rounded-lg bg-primary-100 dark:bg-primary-900/30 text-primary-600 dark:text-primary-400 font-semibold text-[10px] sm:text-xs hover:bg-primary-200 dark:hover:bg-primary-900/50 transition-colors"
                >
                  <span>الكل</span>
                  <ArrowLeft className="h-3 sm:h-3.5 w-3 sm:w-3.5" />
                </Link>
              </motion.div>

              {/* Lessons Grid */}
              {isLoading ? (
                <HomePageLessonsGridSkeleton count={8} />
              ) : arabicLessons.length === 0 ? (
                <div className="text-center py-10">
                  <FileText className="h-12 w-12 text-gray-300 dark:text-gray-600 mx-auto mb-3" />
                  <p className="text-gray-500 dark:text-gray-400">لا توجد دروس لهذه المرحلة حالياً</p>
                </div>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2 sm:gap-3">
                  {arabicLessons.map((lesson, index) => (
                    <motion.div
                      key={lesson.id}
                      initial={{ opacity: 0, y: 10 }}
                      whileInView={{ opacity: 1, y: 0 }}
                      viewport={{ once: true, margin: "-30px" }}
                      transition={{ delay: index * 0.03, duration: 0.3 }}
                    >
                      <Link href={`/arabic/${lesson.id}`} className="block group h-full">
                        <div className="relative h-full bg-white dark:bg-[#1c1c24] rounded-lg sm:rounded-xl p-2.5 sm:p-3.5 border border-gray-200/60 dark:border-[#2e2e3a] hover:border-primary-400 dark:hover:border-primary-600 shadow-sm hover:shadow-md transition-all duration-300 group-hover:-translate-y-0.5">
                          <div className="flex items-start gap-2 sm:gap-3">
                            <div className="p-1.5 sm:p-2 rounded-lg bg-primary-100 dark:bg-primary-900/30 shrink-0 group-hover:scale-105 transition-transform">
                              <FileText className="h-3.5 sm:h-4 w-3.5 sm:w-4 text-primary-600 dark:text-primary-400" />
                            </div>
                            <div className="min-w-0">
                              <h3 className="text-xs sm:text-sm font-bold text-gray-900 dark:text-white mb-0.5 group-hover:text-primary-600 dark:group-hover:text-primary-400 transition-colors">
                                {lesson.title}
                              </h3>
                              <p className="text-[10px] sm:text-xs text-gray-500 dark:text-gray-400 truncate hidden sm:block">
                                {lesson.description || ""}
                              </p>
                            </div>
                          </div>
                        </div>
                      </Link>
                    </motion.div>
                  ))}
                </div>
              )}

              {/* Exams Link */}
              <div className="mt-4 sm:mt-5 pt-3 sm:pt-4 border-t border-gray-200/60 dark:border-[#2e2e3a]">
                <Link href="/arabic" className="inline-flex items-center gap-1.5 sm:gap-2 text-xs sm:text-sm font-semibold text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300 transition-colors">
                  <ClipboardList className="h-3.5 sm:h-4 w-3.5 sm:w-4" />
                  <span>الامتحانات الشاملة</span>
                  <ArrowLeft className="h-3 sm:h-3.5 w-3 sm:w-3.5" />
                </Link>
              </div>
            </div>
          </section>

          {/* ========== ENGLISH LESSONS SECTION ========== */}
          <section id="english" className="py-6 sm:py-8 md:py-10 scroll-mt-16 sm:scroll-mt-20">
            <div className="container mx-auto px-3 sm:px-6 lg:px-8 max-w-6xl">
              {/* Section Header */}
              <motion.div
                initial={{ opacity: 0, y: 15 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-50px" }}
                transition={{ duration: 0.4 }}
                className="flex items-center justify-between mb-4 sm:mb-5"
              >
                <div className="flex items-center gap-2 sm:gap-3">
                  <div className="p-2 sm:p-2.5 rounded-lg sm:rounded-xl bg-gradient-to-br from-primary-500 to-primary-600 shadow-md shadow-primary-500/25">
                    <BookOpen className="h-4 sm:h-5 w-4 sm:w-5 text-white" />
                  </div>
                  <div dir="ltr">
                    <h2 className="text-base sm:text-lg md:text-xl font-extrabold text-gray-900 dark:text-white">
                      English
                    </h2>
                    <p className="text-[10px] sm:text-xs text-gray-500 dark:text-gray-400 hidden xs:block">{englishLessons.length} lessons</p>
                  </div>
                </div>
                <Link
                  href="/english"
                  className="flex items-center gap-1 sm:gap-1.5 px-2.5 sm:px-4 py-1.5 sm:py-2 rounded-lg bg-primary-100 dark:bg-primary-900/30 text-primary-600 dark:text-primary-400 font-semibold text-[10px] sm:text-xs hover:bg-primary-200 dark:hover:bg-primary-900/50 transition-colors"
                  dir="ltr"
                >
                  <span>All</span>
                  <ArrowRight className="h-3 sm:h-3.5 w-3 sm:w-3.5" />
                </Link>
              </motion.div>

              {/* Lessons Grid */}
              {isLoading ? (
                <HomePageLessonsGridSkeleton count={6} />
              ) : englishLessons.length === 0 ? (
                <div className="text-center py-10">
                  <BookOpen className="h-12 w-12 text-gray-300 dark:text-gray-600 mx-auto mb-3" />
                  <p className="text-gray-500 dark:text-gray-400">No lessons available for this stage</p>
                </div>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 sm:gap-3">
                  {englishLessons.map((lesson, index) => (
                    <motion.div
                      key={lesson.id}
                      initial={{ opacity: 0, y: 10 }}
                      whileInView={{ opacity: 1, y: 0 }}
                      viewport={{ once: true, margin: "-30px" }}
                      transition={{ delay: index * 0.03, duration: 0.3 }}
                    >
                      <Link href={`/english/${lesson.id}`} className="block group h-full">
                        <div className="relative h-full bg-white dark:bg-[#1c1c24] rounded-lg sm:rounded-xl p-2.5 sm:p-3.5 border border-gray-200/60 dark:border-[#2e2e3a] hover:border-primary-400 dark:hover:border-primary-600 shadow-sm hover:shadow-md transition-all duration-300 group-hover:-translate-y-0.5" dir="ltr">
                          <div className="flex items-start gap-2 sm:gap-3">
                            <div className="p-1.5 sm:p-2 rounded-lg bg-primary-100 dark:bg-primary-900/30 shrink-0 group-hover:scale-105 transition-transform">
                              <BookOpen className="h-3.5 sm:h-4 w-3.5 sm:w-4 text-primary-600 dark:text-primary-400" />
                            </div>
                            <div className="min-w-0">
                              <h3 className="text-xs sm:text-sm font-bold text-gray-900 dark:text-white group-hover:text-primary-600 dark:group-hover:text-primary-400 transition-colors truncate">
                                {lesson.title}
                              </h3>
                              <p className="text-[10px] sm:text-xs text-gray-500 dark:text-gray-400 truncate hidden sm:block">
                                {lesson.description || ""}
                              </p>
                            </div>
                          </div>
                        </div>
                      </Link>
                    </motion.div>
                  ))}
                </div>
              )}

              {/* Exams Link */}
              <div className="mt-4 sm:mt-5 pt-3 sm:pt-4 border-t border-gray-200/60 dark:border-[#2e2e3a]">
                <Link href="/english" className="inline-flex items-center gap-1.5 sm:gap-2 text-xs sm:text-sm font-semibold text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300 transition-colors" dir="ltr">
                  <ClipboardList className="h-3.5 sm:h-4 w-3.5 sm:w-4" />
                  <span>Comprehensive Exams</span>
                  <ArrowRight className="h-3 sm:h-3.5 w-3 sm:w-3.5" />
                </Link>
              </div>
            </div>
          </section>

          {/* ========== TOP STUDENTS SECTION ========== */}
          <section className="py-14 sm:py-20 bg-gradient-to-b from-amber-50/50 via-white to-white dark:from-amber-950/10 dark:via-[#121218] dark:to-[#121218]">
            <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-5xl">
              {/* Section Header */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5 }}
                className="text-center mb-10 sm:mb-12"
              >
                <div className="inline-flex items-center gap-2 px-3 py-1.5 mb-4 rounded-full bg-amber-100/80 dark:bg-amber-900/30 border border-amber-200/60 dark:border-amber-700/40">
                  <Crown className="h-3.5 w-3.5 text-amber-600 dark:text-amber-400" />
                  <span className="text-xs font-semibold text-amber-700 dark:text-amber-300">المتفوقون</span>
                </div>
                <h2 className="text-2xl sm:text-3xl md:text-4xl font-extrabold text-gray-900 dark:text-white mb-3">
                  طلابنا <span className="text-amber-500">المتفوقون</span> 🏆
                </h2>
                <p className="text-sm sm:text-base text-gray-600 dark:text-gray-400 max-w-lg mx-auto">
                  طلاب حققوا درجات 90% وأكثر في الامتحانات
                </p>
              </motion.div>

              {/* Students Grid */}
              <motion.div
                className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5"
                variants={containerVariants}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true, margin: "-50px" }}
              >
                {mockTopStudents.slice(0, 6).map((student, index) => (
                  <motion.div
                    key={student.id}
                    variants={itemVariants}
                    className="relative bg-white dark:bg-[#1c1c24] rounded-xl p-4 sm:p-5 border border-gray-200/60 dark:border-[#2e2e3a] shadow-sm hover:shadow-md transition-shadow"
                  >
                    {/* Rank Badge for top 3 */}
                    {index < 3 && (
                      <div className={`absolute -top-2 -right-2 w-8 h-8 rounded-full flex items-center justify-center text-white font-bold text-sm shadow-lg ${index === 0
                        ? "bg-gradient-to-br from-amber-400 to-amber-600"
                        : index === 1
                          ? "bg-gradient-to-br from-gray-300 to-gray-500"
                          : "bg-gradient-to-br from-amber-600 to-amber-800"
                        }`}>
                        {index === 0 ? <Crown className="h-4 w-4" /> : index + 1}
                      </div>
                    )}

                    <div className="flex items-center gap-3">
                      {/* Avatar */}
                      <div className={`w-12 h-12 rounded-full flex items-center justify-center text-white font-bold text-lg shrink-0 ${index === 0
                        ? "bg-gradient-to-br from-amber-400 to-amber-600"
                        : "bg-gradient-to-br from-primary-400 to-primary-600"
                        }`}>
                        {student.name.charAt(0)}
                      </div>

                      {/* Info */}
                      <div className="flex-1 min-w-0">
                        <h4 className="font-bold text-gray-900 dark:text-white truncate">
                          {student.name}
                        </h4>
                        <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                          {student.examTitle}
                        </p>
                      </div>

                      {/* Score */}
                      <div className="text-center shrink-0">
                        <div className={`text-xl font-extrabold ${student.percentage >= 95
                          ? "text-amber-500"
                          : "text-primary-600 dark:text-primary-400"
                          }`}>
                          {student.percentage}%
                        </div>
                        <div className="text-[10px] text-gray-500 dark:text-gray-400">
                          {student.score}/{student.totalQuestions}
                        </div>
                      </div>
                    </div>

                    {/* Decorative */}
                    {index === 0 && (
                      <div className="absolute top-0 right-0 w-20 h-20 bg-amber-400/10 rounded-full blur-2xl -z-10" />
                    )}
                  </motion.div>
                ))}
              </motion.div>

              {/* Encouragement */}
              <motion.div
                initial={{ opacity: 0, y: 15 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.3, duration: 0.5 }}
                className="mt-8 text-center"
              >
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                  هل تريد أن تنضم لقائمة المتفوقين؟ 🌟
                </p>
                <Link
                  href="/arabic"
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white font-semibold text-sm shadow-lg shadow-amber-500/25 hover:shadow-amber-500/35 transition-all hover:-translate-y-0.5"
                >
                  <TrendingUp className="h-4 w-4" />
                  <span>ابدأ الامتحان الآن</span>
                </Link>
              </motion.div>
            </div>
          </section>

          {/* ========== HOW IT WORKS SECTION ========== */}
          <section className="py-14 sm:py-20">
            <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-5xl">
              {/* Section Header */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5 }}
                className="text-center mb-10 sm:mb-12"
              >
                <div className="inline-flex items-center gap-2 px-3 py-1.5 mb-4 rounded-full bg-primary-100/60 dark:bg-primary-900/20 border border-primary-200/50 dark:border-primary-700/30">
                  <Target className="h-3.5 w-3.5 text-primary-600 dark:text-primary-400" />
                  <span className="text-xs font-semibold text-primary-700 dark:text-primary-300">كيف يعمل</span>
                </div>
                <h2 className="text-2xl sm:text-3xl md:text-4xl font-extrabold text-gray-900 dark:text-white mb-3">
                  ثلاث خطوات فقط
                </h2>
                <p className="text-sm sm:text-base text-gray-600 dark:text-gray-400 max-w-lg mx-auto">
                  ابدأ رحلتك التعليمية بخطوات بسيطة
                </p>
              </motion.div>

              {/* Steps */}
              <motion.div
                className="grid grid-cols-1 md:grid-cols-3 gap-6 sm:gap-8"
                variants={containerVariants}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true, margin: "-50px" }}
              >
                {/* Step 1 */}
                <motion.div variants={itemVariants} className="relative text-center">
                  <div className="relative inline-block mb-4">
                    <div className="w-16 h-16 rounded-xl bg-gradient-to-br from-primary-500 to-primary-600 flex items-center justify-center shadow-lg shadow-primary-500/25">
                      <GraduationCap className="h-8 w-8 text-white" />
                    </div>
                    <div className="absolute -top-2 -right-2 w-7 h-7 rounded-full bg-primary-100 dark:bg-primary-900 flex items-center justify-center text-primary-600 dark:text-primary-400 font-bold text-xs border-2 border-white dark:border-[#121218]">
                      1
                    </div>
                  </div>
                  <h3 className="text-base sm:text-lg font-bold text-gray-900 dark:text-white mb-2">اختر المادة</h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    اختر بين اللغة العربية أو الإنجليزية
                  </p>
                </motion.div>

                {/* Step 2 */}
                <motion.div variants={itemVariants} className="relative text-center">
                  <div className="relative inline-block mb-4">
                    <div className="w-16 h-16 rounded-xl bg-gradient-to-br from-primary-500 to-primary-600 flex items-center justify-center shadow-lg shadow-primary-500/25">
                      <BookOpen className="h-8 w-8 text-white" />
                    </div>
                    <div className="absolute -top-2 -right-2 w-7 h-7 rounded-full bg-primary-100 dark:bg-primary-900 flex items-center justify-center text-primary-600 dark:text-primary-400 font-bold text-xs border-2 border-white dark:border-[#121218]">
                      2
                    </div>
                  </div>
                  <h3 className="text-base sm:text-lg font-bold text-gray-900 dark:text-white mb-2">تعلم واستكشف</h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    استعرض الدروس والأسئلة التفاعلية
                  </p>
                </motion.div>

                {/* Step 3 */}
                <motion.div variants={itemVariants} className="text-center">
                  <div className="relative inline-block mb-4">
                    <div className="w-16 h-16 rounded-xl bg-gradient-to-br from-primary-500 to-primary-600 flex items-center justify-center shadow-lg shadow-primary-500/25">
                      <Award className="h-8 w-8 text-white" />
                    </div>
                    <div className="absolute -top-2 -right-2 w-7 h-7 rounded-full bg-primary-100 dark:bg-primary-900 flex items-center justify-center text-primary-600 dark:text-primary-400 font-bold text-xs border-2 border-white dark:border-[#121218]">
                      3
                    </div>
                  </div>
                  <h3 className="text-base sm:text-lg font-bold text-gray-900 dark:text-white mb-2">اختبر نفسك</h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    قيّم مستواك من خلال امتحانات متنوعة
                  </p>
                </motion.div>
              </motion.div>
            </div>
          </section>

          {/* ========== TESTIMONIALS SECTION ========== */}
          <section className="py-14 sm:py-20 bg-gray-50/50 dark:bg-[#0d0d12]">
            <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-5xl">
              {/* Section Header */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5 }}
                className="text-center mb-10 sm:mb-12"
              >
                <div className="inline-flex items-center gap-2 px-3 py-1.5 mb-4 rounded-full bg-primary-100/60 dark:bg-primary-900/20 border border-primary-200/50 dark:border-primary-700/30">
                  <MessageSquare className="h-3.5 w-3.5 text-primary-600 dark:text-primary-400" />
                  <span className="text-xs font-semibold text-primary-700 dark:text-primary-300">آراء الطلاب</span>
                </div>
                <h2 className="text-2xl sm:text-3xl md:text-4xl font-extrabold text-gray-900 dark:text-white mb-3">
                  ماذا يقول طلابنا؟
                </h2>
              </motion.div>

              {/* Testimonials Grid */}
              <motion.div
                className="grid grid-cols-1 md:grid-cols-3 gap-5 sm:gap-6"
                variants={containerVariants}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true, margin: "-50px" }}
              >
                {[
                  {
                    name: "أحمد محمد",
                    role: "طالب ثانوي",
                    content: "المنصة سهّلت علييا فهم قواعد اللغة العربية بطريقة ممتعة. الأسئلة التفاعلية ساعدتني كتير!",
                    rating: 5
                  },
                  {
                    name: "سارة أحمد",
                    role: "طالبة جامعية",
                    content: "أفضل منصة تعليمية استخدمتها. المحتوى متنوع والامتحانات شاملة. أنصح الكل بتجربتها!",
                    rating: 5
                  },
                  {
                    name: "محمود علي",
                    role: "معلم لغة",
                    content: "استخدمت المنصة مع طلابي ولاحظت تحسن كبير في مستواهم. محتوى قيّم جداً.",
                    rating: 5
                  },
                ].map((testimonial, index) => (
                  <motion.div
                    key={index}
                    variants={itemVariants}
                    className="bg-white dark:bg-[#1c1c24] rounded-xl p-5 sm:p-6 border border-gray-200/60 dark:border-[#2e2e3a] shadow-sm"
                  >
                    {/* Stars */}
                    <div className="flex gap-0.5 mb-3">
                      {Array.from({ length: testimonial.rating }).map((_, i) => (
                        <Star key={i} className="h-4 w-4 fill-amber-400 text-amber-400" />
                      ))}
                    </div>

                    {/* Content */}
                    <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed mb-4">
                      &quot;{testimonial.content}&quot;
                    </p>

                    {/* Author */}
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary-400 to-primary-600 flex items-center justify-center text-white font-bold text-sm">
                        {testimonial.name.charAt(0)}
                      </div>
                      <div>
                        <p className="font-bold text-sm text-gray-900 dark:text-white">{testimonial.name}</p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">{testimonial.role}</p>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </motion.div>
            </div>
          </section>

          {/* ========== FINAL CTA SECTION ========== */}
          <section className="py-14 sm:py-20">
            <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-3xl">
              <motion.div
                initial={{ opacity: 0, y: 25 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6 }}
                className="relative text-center bg-gradient-to-br from-primary-600 via-primary-500 to-primary-600 dark:from-primary-800 dark:via-primary-700 dark:to-primary-800 rounded-2xl p-8 sm:p-12 overflow-hidden"
              >
                {/* Background Elements */}
                <div className="absolute inset-0 opacity-20">
                  <div className="absolute top-0 right-0 w-48 h-48 bg-white rounded-full blur-3xl" />
                  <div className="absolute bottom-0 left-0 w-56 h-56 bg-white rounded-full blur-3xl" />
                </div>

                <div className="relative z-10">
                  <div className="inline-flex items-center justify-center w-14 h-14 mb-5 rounded-xl bg-white/20 backdrop-blur-sm">
                    <Rocket className="h-7 w-7 text-white" />
                  </div>

                  <h2 className="text-2xl sm:text-3xl md:text-4xl font-extrabold text-white mb-3">
                    جاهز تبدأ رحلتك؟
                  </h2>
                  <p className="text-sm sm:text-base text-white/90 max-w-md mx-auto mb-6">
                    انضم لآلاف الطلاب الذين يتعلمون معنا يومياً
                  </p>

                  <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
                    <Link
                      href="/signup"
                      className="group flex items-center gap-2 px-6 py-3 rounded-xl bg-white text-primary-600 font-bold shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-0.5"
                    >
                      <span>إنشاء حساب مجاني</span>
                      <ArrowLeft className="h-4 w-4 group-hover:-translate-x-1 transition-transform" />
                    </Link>
                    <Link
                      href="/arabic"
                      className="flex items-center gap-2 px-6 py-3 rounded-xl bg-white/20 backdrop-blur-sm text-white font-bold border border-white/30 hover:bg-white/30 transition-all duration-300"
                    >
                      <span>استكشف الدروس</span>
                    </Link>
                  </div>
                </div>
              </motion.div>
            </div>
          </section>
        </main>

        <Footer />
      </div>
    </>
  );
}
