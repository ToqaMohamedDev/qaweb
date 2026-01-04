// =============================================
// Home Page - الصفحة الرئيسية (Clean Architecture)
// =============================================

"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import {
  FileText,
  BookOpen,
  ArrowLeft,
  Sparkles,
  Play,
} from "lucide-react";

// Layout Components
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { StructuredData, homeStructuredData } from "@/components/StructuredData";

// Home Components
import {
  LessonsSection,
  HowItWorksSection,
  TestimonialsSection,
  CTASection,
} from "@/components/home";

// Custom Hooks
import { useHomeLessons } from "@/hooks/useLessons";



export default function Home() {
  // Custom hook for lessons data
  const {
    arabicLessons,
    englishLessons,
    selectedStageName,
    status
  } = useHomeLessons();

  const isLoading = status === 'loading';

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
              {/* Arabic Subject Card */}
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

              {/* English Subject Card */}
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

              {/* Future subjects placeholder */}
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
          <LessonsSection
            id="arabic"
            title="اللغة العربية"
            lessonsCount={arabicLessons.length}
            lessons={arabicLessons}
            stageName={selectedStageName}
            isLoading={isLoading}
            href="/arabic"
            lessonHrefPrefix="/arabic"
            icon={FileText}
            examsLabel="الامتحانات الشاملة"
            viewAllLabel="الكل"
            emptyMessage="لا توجد دروس لهذه المرحلة حالياً"
            dir="rtl"
          />

          {/* ========== ENGLISH LESSONS SECTION ========== */}
          <LessonsSection
            id="english"
            title="English"
            lessonsCount={englishLessons.length}
            lessons={englishLessons}
            stageName={selectedStageName}
            isLoading={isLoading}
            href="/english"
            lessonHrefPrefix="/english"
            icon={BookOpen}
            examsLabel="Comprehensive Exams"
            viewAllLabel="All"
            emptyMessage="No lessons available for this stage"
            dir="ltr"
            skeletonCount={6}
          />



          {/* ========== HOW IT WORKS SECTION ========== */}
          <HowItWorksSection />

          {/* ========== TESTIMONIALS SECTION ========== */}
          <TestimonialsSection />

          {/* ========== FINAL CTA SECTION ========== */}
          <CTASection />
        </main>

        <Footer />
      </div>
    </>
  );
}
