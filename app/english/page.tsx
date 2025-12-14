"use client";

import { useEffect, useState, useLayoutEffect } from "react";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import {
  BookOpen,
  ArrowLeft,
  ArrowRight,
  ClipboardList,
} from "lucide-react";
import { fetchExamsByType, handleFirestoreError } from "@/lib/firebaseUtils";

const englishItems = [
  {
    id: "eng_lesson1_voc_gram_001",
    title: "Lesson 1 - Vocabulary and Grammar",
    subtitle: "Vocabulary and Grammar exercises",
    icon: "book",
  },
  {
    id: "eng_lesson2_vocab_002",
    title: "Lesson 2 - Vocabulary",
    subtitle: "Vocabulary exercises",
    icon: "book",
  },
  {
    id: "eng_lesson3_reading_003",
    title: "Lesson 3 - Reading Comprehension",
    subtitle: "Reading comprehension exercises",
    icon: "book",
  },
  {
    id: "eng_lesson4_translation_004",
    title: "Lesson 4 - Translation",
    subtitle: "Translation exercises",
    icon: "book",
  },
  {
    id: "eng_lesson5_literature_005",
    title: "Lesson 5 - Literature: Great Expectations",
    subtitle: "Literature analysis and essay writing",
    icon: "book",
  },
  {
    id: "eng_lesson6_essay_006",
    title: "Lesson 6 - Essay Writing: Travel Destination",
    subtitle: "Essay writing about travel destinations",
    icon: "book",
  },
];

export default function EnglishPage() {
  const [exams, setExams] = useState<Array<{ id: string; examTitle?: string; examDescription?: string; durationMinutes?: number; sections?: Array<{ templateType?: string }> }>>([]);
  const [showExams, setShowExams] = useState(false);
  const [mounted, setMounted] = useState(false);

  useLayoutEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    const fetchExams = async () => {
      try {
        // Fetch both old multi_template_exam and new english_comprehensive_exam
        const [multiTemplateExams, comprehensiveExams] = await Promise.all([
          fetchExamsByType("multi_template_exam"),
          fetchExamsByType("english_comprehensive_exam"),
        ]);
        
        // Filter old exams with english sections
        const englishExams = Array.isArray(multiTemplateExams)
          ? (multiTemplateExams as Array<{ sections?: Array<{ templateType?: string }> }>).filter((exam) => {
              const sections = (exam.sections || []) as Array<{ templateType?: string }>;
              return sections.some((s) => 
                s.templateType === "english_comprehensive" ||
                s.templateType === "english_reading" ||
                s.templateType === "english_translation" ||
                s.templateType === "english_literature" ||
                s.templateType === "english_essay"
              );
            })
          : [];
        
        // Filter comprehensive exams: only show exams with usageScope === "exam" or undefined (exclude lessons)
        const filteredComprehensiveExams = Array.isArray(comprehensiveExams)
          ? (comprehensiveExams as Array<{ usageScope?: "exam" | "lesson" }>).filter((exam) => {
              return exam.usageScope === "exam" || exam.usageScope === undefined;
            })
          : [];
        
        // Combine both types
        const allExams = [...englishExams, ...filteredComprehensiveExams];
        setExams(allExams as Array<{ id: string; examTitle?: string; examDescription?: string; durationMinutes?: number; sections?: Array<{ templateType?: string }> }>);
      } catch (error) {
        handleFirestoreError(error, "fetchExams");
        setExams([]);
      }
    };

    fetchExams();
  }, []);

  return (
    <div className="min-h-screen bg-linear-to-br from-gray-50 via-white to-gray-50 dark:from-[#121218] dark:via-[#0d0d12] dark:to-[#121218]" dir="rtl">
      <Navbar />
      
      <main className="container mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 max-w-7xl">
        {/* Header with Back Button */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="mb-10 sm:mb-12"
        >
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 transition-all duration-300 mb-6 group"
          >
            <ArrowRight className="h-4 w-4 group-hover:translate-x-[-4px] transition-transform" />
            <span className="text-sm font-medium">العودة للصفحة الرئيسية</span>
          </Link>
          
          <div className="flex flex-col items-center gap-6 mb-8">
          <div className="flex items-center gap-4">
            <div className="p-4 rounded-xl bg-linear-to-br from-primary-500 to-primary-500 shadow-lg shadow-primary-500/30">
              <BookOpen className="h-7 w-7 text-white" />
            </div>
            <div>
              <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-gray-900 dark:text-gray-100 mb-1 leading-tight">
                English Language
              </h1>
              <p className="text-sm sm:text-base text-gray-600 dark:text-gray-400 font-medium">
                English lessons and exercises
              </p>
            </div>
            </div>

          {/* Tabs Navigation - Centered (always visible) */}
          <div className="relative flex items-center gap-2 bg-gray-100 dark:bg-[#1c1c24] rounded-md p-1.5 shadow-inner overflow-hidden border border-gray-200/70 dark:border-[#2e2e3a]">
            {/* Animated Background (pill gliding in a groove) */}
            {mounted && (
              <motion.div
                initial={{ x: showExams ? '0%' : '100%' }}
                animate={{ 
                  x: showExams ? '0%' : '100%',
                }}
                transition={{ type: "spring", stiffness: 420, damping: 34 }}
                className="absolute inset-y-1 left-1 rounded-sm bg-white/90 dark:bg-[#252530]/90 shadow-[0_8px_22px_rgba(0,0,0,0.12)] dark:shadow-[0_8px_22px_rgba(0,0,0,0.35)] border border-white/70 dark:border-white/10"
                style={{ width: 'calc(50% - 8px)' }}
              />
            )}
            
            <button
              onClick={() => setShowExams(false)}
              className={`relative z-10 px-8 py-2.5 rounded-sm text-sm font-semibold transition-colors duration-200 ${
                !showExams
                  ? 'text-gray-900 dark:text-gray-100'
                  : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100'
              }`}
            >
              Lessons
            </button>
            <button
              onClick={() => setShowExams(true)}
              className={`relative z-10 px-8 py-2.5 rounded-sm text-sm font-semibold transition-colors duration-200 ${
                showExams
                  ? 'text-gray-900 dark:text-gray-100'
                  : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100'
              }`}
            >
              Exams
            </button>
          </div>
          </div>
        </motion.div>

        {/* Content based on toggle with animation */}
        <AnimatePresence mode="wait">
          {showExams ? (
            /* Exams Section */
            exams.length > 0 ? (
              <motion.div
                key="exams"
                initial={{ opacity: 0, x: 50 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -50 }}
                transition={{ duration: 0.3, ease: "easeInOut" }}
                className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4"
              >
                {exams.map((exam, index) => (
                  <Link
                    key={exam.id}
                    href={`/english/exam/${exam.id}`}
                  >
                    <motion.div
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.05, duration: 0.4 }}
                      whileHover={{ y: -4, scale: 1.01 }}
                      className="group relative bg-white dark:bg-[#1c1c24] rounded-xl sm:rounded-2xl p-5 border border-primary-200/60 dark:border-primary-800/40 shadow-sm hover:shadow-lg transition-all duration-300 cursor-pointer overflow-hidden"
                      dir="ltr"
                    >
                      <div className="absolute inset-0 bg-linear-to-br from-primary-50/80 to-transparent dark:from-primary-900/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                      <div className="absolute top-0 left-0 w-20 h-20 bg-primary-200/20 dark:bg-primary-800/15 rounded-full blur-2xl group-hover:blur-3xl transition-all duration-300" />
                      
                      <div className="relative z-10">
                        <div className="mb-4">
                          <div className="inline-flex p-3 rounded-lg bg-linear-to-br from-primary-500 to-primary-600 shadow-md shadow-primary-500/25 group-hover:shadow-lg group-hover:shadow-primary-500/35 transition-all duration-300">
                            <ClipboardList className="h-5 w-5 text-white" />
                          </div>
                        </div>
                        <h3 className="text-base sm:text-lg font-bold text-gray-900 dark:text-gray-100 mb-2 group-hover:text-gray-800 dark:group-hover:text-gray-50 transition-colors duration-300 leading-tight" dir="ltr">
                          {exam.examTitle || "Exam"}
                        </h3>
                        {exam.examDescription && (
                          <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed mb-4 line-clamp-2" dir="ltr">
                            {exam.examDescription}
                          </p>
                        )}
                        <div className="flex items-center text-gray-700 dark:text-gray-300 opacity-0 group-hover:opacity-100 transition-all duration-300">
                          <span className="text-xs font-medium ml-2">Start Exam</span>
                          <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform duration-300" />
                        </div>
                      </div>
                    </motion.div>
                  </Link>
                ))}
              </motion.div>
            ) : (
              <motion.div
                key="no-exams"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.3 }}
                className="text-center py-12"
              >
                <ClipboardList className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600 dark:text-gray-400">No exams available at the moment</p>
              </motion.div>
            )
          ) : (
            /* English Items Grid */
            <motion.div
              key="lessons"
              initial={{ opacity: 0, x: -50 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 50 }}
              transition={{ duration: 0.3, ease: "easeInOut" }}
              className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4"
            >
          {englishItems.map((item, index) => (
            <Link
              key={item.id}
              href={`/english/${item.id}`}
            >
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.04, duration: 0.4 }}
                whileHover={{ y: -4, scale: 1.01 }}
                className="group relative bg-white dark:bg-[#1c1c24] rounded-xl sm:rounded-2xl p-5 border border-gray-200/80 dark:border-[#2e2e3a]/80 shadow-sm hover:shadow-lg transition-all duration-300 cursor-pointer overflow-hidden"
                dir="ltr"
              >
              {/* Subtle Background Effect */}
              <div className="absolute inset-0 bg-linear-to-br from-gray-50/80 to-transparent dark:from-gray-900/30 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
              
              {/* Subtle Decorative Element */}
              <div className="absolute top-0 left-0 w-20 h-20 bg-gray-200/20 dark:bg-gray-800/15 rounded-full blur-2xl group-hover:blur-3xl transition-all duration-300" />
              
              <div className="relative z-10">
                {/* Icon */}
                <div className="mb-4">
                  <div className="inline-flex p-3 rounded-lg bg-linear-to-br from-primary-500 to-primary-500 shadow-md shadow-primary-500/25 group-hover:shadow-lg group-hover:shadow-primary-500/35 transition-all duration-300">
                    <BookOpen className="h-5 w-5 text-white" />
                  </div>
                </div>

                {/* Title */}
                <h3 className="text-base sm:text-lg font-bold text-gray-900 dark:text-gray-100 mb-2 group-hover:text-gray-800 dark:group-hover:text-gray-50 transition-colors duration-300 leading-tight" dir="ltr">
                  {item.title}
                </h3>

                {/* Subtitle */}
                <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed mb-4" dir="ltr">
                  {item.subtitle}
                </p>

                {/* Arrow Indicator */}
                <div className="flex items-center text-gray-700 dark:text-gray-300 opacity-0 group-hover:opacity-100 transition-all duration-300">
                  <span className="text-xs font-medium ml-2">Start Learning</span>
                  <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform duration-300" />
                </div>
              </div>
            </motion.div>
            </Link>
          ))}
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      <Footer />
    </div>
  );
}

