"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/contexts/AuthContext";
import { useAdmin } from "@/hooks/useAdmin";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import {
  BookOpen,
  FileText,
  Edit,
  Trash2,
  Search,
  Filter,
  ArrowRight,
  CheckCircle2,
  XCircle,
} from "lucide-react";
import {
  collection,
  getDocs,
  doc,
  deleteDoc,
  query,
  orderBy,
  Timestamp,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import { Input } from "@/components/Input";
import { Button } from "@/components/Button";
import type { QuestionWithExamProperties, MCQ, ExtractionQuestion, ShortEssayQuestion, GrammarQuestion, TranslationQuestion, EssayQuestion } from "@/types/questionTypes";

// Types
type QuestionType = string;
type Language = "arabic" | "english" | "mixed";

interface QuestionData {
  lessonId?: string;
  language?: Language;
  type: QuestionType;
  question?: string;
  createdAt: Timestamp;
  createdBy: string | undefined;
  options?: string[];
  correctAnswer?: number | boolean;
  examTitle?: string;
  examDescription?: string;
  durationMinutes?: number;
  sections?: Array<{ templateType?: string }>;
  questionTitle?: string;
  readingPassage?: string;
  arabicText?: string;
  mainQuestion?: string;
  multipleChoiceQuestions?: Array<unknown>;
  extractionQuestions?: Array<unknown>;
  shortEssayQuestions?: Array<unknown>;
  grammarQuestions?: Array<unknown>;
  translationQuestions?: Array<unknown>;
  essayQuestions?: Array<unknown>;
  usageScope?: "exam" | "lesson";
}

interface QuestionWithId extends QuestionData {
  id: string;
}

// Arabic lessons data
const arabicLessons = [
  { id: "arabic_nahw_01", title: "النحو" },
  { id: "arabic_reading_02", title: "القراءة" },
  { id: "arabic_poetry_03", title: "النصوص" },
  { id: "arabic_story_04", title: "القصة" },
  { id: "arabic_adab_05", title: "الأدب" },
  { id: "arabic_balagha_06", title: "البلاغة" },
  { id: "arabic_expression_07", title: "التعبير" },
  { id: "arabic_sarf_08", title: "الصرف" },
];

// English lessons data
const englishLessons = [
  { id: "eng_lesson1_voc_gram_001", title: "Lesson 1 - Vocabulary and Grammar" },
  { id: "eng_lesson2_vocab_002", title: "Lesson 2 - Vocabulary" },
  { id: "eng_lesson3_reading_003", title: "Lesson 3 - Reading Comprehension" },
  { id: "eng_lesson4_translation_004", title: "Lesson 4 - Translation" },
  { id: "eng_lesson5_literature_005", title: "Lesson 5 - Literature: Great Expectations" },
  { id: "eng_lesson6_essay_006", title: "Lesson 6 - Essay Writing: Travel Destination" },
];

export default function QuestionsManagement() {
  const { user, loading: authLoading } = useAuth();
  const { isAdmin, loading: adminLoading } = useAdmin();
  const router = useRouter();
  const searchParams = useSearchParams();
  const pathname = typeof window !== "undefined" ? window.location.pathname : "";
  const viewParam =
    pathname.endsWith("/arabic")
      ? "arabic"
      : pathname.endsWith("/english")
      ? "english"
      : pathname.endsWith("/exams-ar")
      ? "exams-ar"
      : pathname.endsWith("/exams-en")
      ? "exams-en"
      : searchParams?.get("view") || "all";

  // Questions list states
  const [questions, setQuestions] = useState<QuestionWithId[]>([]);
  const [loadingQuestions, setLoadingQuestions] = useState(true);
  
  // Delete confirmation modal states
  const [deleteConfirmModal, setDeleteConfirmModal] = useState<{
    isOpen: boolean;
    questionId: string | null;
    questionTitle: string;
  }>({
    isOpen: false,
    questionId: null,
    questionTitle: "",
  });
  
  // Success notification states
  const [successNotification, setSuccessNotification] = useState<{
    isOpen: boolean;
    message: string;
  }>({
    isOpen: false,
    message: "",
  });

  // Filter and search states
  const [searchQuery, setSearchQuery] = useState("");
  const [filterLanguage, setFilterLanguage] = useState<Language | "all">("all");
  const [filterType, setFilterType] = useState<QuestionType | "all">("all");
  const [filterLesson, setFilterLesson] = useState<string>("all");
  const [showFilters, setShowFilters] = useState(false);

  useEffect(() => {
    if (authLoading || adminLoading) {
      return;
    }

    if (!user) {
      router.push("/");
      return;
    }

    if (!isAdmin) {
      router.push("/");
      return;
    }
  }, [user, isAdmin, authLoading, adminLoading, router]);

  // Fetch questions from Firestore
  useEffect(() => {
    const fetchQuestions = async () => {
      if (!isAdmin) return;

      setLoadingQuestions(true);
      try {
        const questionsRef = collection(db, "questions");
        const q = query(questionsRef, orderBy("createdAt", "desc"));
        const querySnapshot = await getDocs(q);

        const questionsData: QuestionWithId[] = [];
        querySnapshot.forEach((doc) => {
          questionsData.push({
            id: doc.id,
            ...(doc.data() as QuestionData),
          });
        });

        setQuestions(questionsData);
      } catch (error: unknown) {
        console.error("Error fetching questions:", error);
      } finally {
        setLoadingQuestions(false);
      }
    };

    if (isAdmin && !authLoading && !adminLoading) {
      fetchQuestions();
    }
  }, [isAdmin, authLoading, adminLoading]);

  const handleEditQuestion = (question: QuestionWithId) => {
    switch (question.type) {
      case "arabic_comprehensive_exam":
        router.push(`/admin/questions/arabic-comprehensive-exam?id=${question.id}`);
        return;
      case "arabic_comprehensive":
      case "arabic_multi_section":
        router.push(`/admin/questions/arabic-template?id=${question.id}`);
        return;
      case "english_comprehensive_exam":
        router.push(`/admin/questions/english-comprehensive-exam?id=${question.id}`);
        return;
      case "english_comprehensive":
      case "english_reading":
      case "english_translation":
      case "english_literature":
      case "english_essay":
        router.push(`/admin/questions/english-manager?id=${question.id}`);
        return;
      default:
        alert("يمكن تعديل هذا النوع من الأسئلة من خلال القوالب فقط.");
    }
  };

  const handleDeleteQuestion = (question: QuestionWithId) => {
    const questionTitle =
      question.type === "arabic_comprehensive" || question.type === "arabic_comprehensive_exam"
        ? question.mainQuestion || question.examTitle || question.question || ""
        : question.examTitle || question.question || "";
    
    setDeleteConfirmModal({
      isOpen: true,
      questionId: question.id,
      questionTitle: questionTitle.substring(0, 100) + (questionTitle.length > 100 ? "..." : ""),
    });
  };

  const confirmDelete = async () => {
    if (!deleteConfirmModal.questionId) return;

    try {
      await deleteDoc(doc(db, "questions", deleteConfirmModal.questionId));

      // Refresh questions list
      const questionsRef = collection(db, "questions");
      const q = query(questionsRef, orderBy("createdAt", "desc"));
      const querySnapshot = await getDocs(q);
      const questionsData: QuestionWithId[] = [];
      querySnapshot.forEach((doc) => {
        questionsData.push({
          id: doc.id,
          ...(doc.data() as QuestionData),
        });
      });
      setQuestions(questionsData);
      
      // Close modal and show success notification
      setDeleteConfirmModal({ isOpen: false, questionId: null, questionTitle: "" });
      setSuccessNotification({
        isOpen: true,
        message: "تم حذف السؤال بنجاح",
      });
      
      // Auto-hide notification after 3 seconds
      setTimeout(() => {
        setSuccessNotification({ isOpen: false, message: "" });
      }, 3000);
    } catch (error: unknown) {
      console.error("Error deleting question:", error);
      setDeleteConfirmModal({ isOpen: false, questionId: null, questionTitle: "" });
      alert("حدث خطأ أثناء حذف السؤال");
    }
  };

  const cancelDelete = () => {
    setDeleteConfirmModal({ isOpen: false, questionId: null, questionTitle: "" });
  };


  const getLessonTitle = (lessonId: string | undefined, language: Language | undefined) => {
    if (!lessonId) return "";
    const lessons = language === "arabic" ? arabicLessons : englishLessons;
    const lesson = lessons.find((l) => l.id === lessonId);
    return lesson?.title || lessonId;
  };

  const getTypeLabel = (type: QuestionType, language?: Language) => {
    switch (type) {
      case "arabic_comprehensive_exam":
        return "امتحان عربي شامل";
      case "english_comprehensive_exam":
        return "English Comprehensive Exam";
      case "arabic_comprehensive":
        return "سؤال شامل";
      case "english_comprehensive":
        return "English Question";
      case "english_reading":
        return "Reading Comprehension";
      case "english_translation":
        return "Translation";
      case "english_literature":
        return "Literature";
      case "english_essay":
        return "Essay Writing";
      case "multipleChoice":
        return language === "english" ? "Multiple Choice" : "اختيار من متعدد";
      case "trueFalse":
        return "صح/خطأ";
      case "essay":
        return "سؤال مقالي";
      default:
        return type;
    }
  };

  const getAvailableTypes = () => {
    const unique = new Set<QuestionType>();
    questions.forEach((q) => unique.add(q.type));
    return Array.from(unique);
  };

  const getQuestionTitle = (question: QuestionWithId) => {
    if (question.type === "arabic_comprehensive_exam" || question.type === "english_comprehensive_exam") {
      return question.examTitle || question.question || "";
    }
    if (question.type === "arabic_comprehensive") {
      return (question as QuestionWithExamProperties).mainQuestion || question.question || "";
    }
    return (question as QuestionWithExamProperties).questionTitle || question.question || "";
  };

  // Filter and search logic
  const filteredQuestions = questions.filter((question) => {
    // Language filter
    const lang = question.language || "mixed";
    if (filterLanguage !== "all" && lang !== filterLanguage) {
      return false;
    }

    // Type filter
    if (filterType !== "all" && question.type !== filterType) {
      return false;
    }

    // Lesson filter
    if (filterLesson !== "all" && question.lessonId !== filterLesson) {
      return false;
    }

    // Search query
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      const questionText = getQuestionTitle(question).toLowerCase();
      const lessonTitle = getLessonTitle(question.lessonId, question.language).toLowerCase();
      
      if (!questionText.includes(query) && !lessonTitle.includes(query)) {
        // Also search in options for multiple choice
        if (question.type === "multipleChoice" && question.options) {
          const optionsMatch = question.options.some((opt) =>
            opt.toLowerCase().includes(query)
          );
          if (!optionsMatch) {
            return false;
          }
        } else {
          return false;
        }
      }
    }

    return true;
  });

  // Grouped lists (separate exams from regular questions)
  // Exams are comprehensive exams with usageScope === "exam" (or undefined for backward compatibility)
  const examQuestions: QuestionWithId[] = filteredQuestions.filter(
    (q) => 
      (q.type === "arabic_comprehensive_exam" || q.type === "english_comprehensive_exam") &&
      (q.usageScope === "exam" || q.usageScope === undefined)
  );
  // Non-exam questions include regular questions AND comprehensive exams with usageScope === "lesson"
  const nonExamQuestions = filteredQuestions.filter(
    (q) => 
      (q.type !== "arabic_comprehensive_exam" && q.type !== "english_comprehensive_exam") ||
      (q.usageScope === "lesson")
  );
  const arabicQuestions = nonExamQuestions.filter((q) => (q.language || "arabic") === "arabic");
  const englishQuestions = nonExamQuestions.filter((q) => (q.language || "english") === "english");
  const examArabic = examQuestions.filter((q) => (q.language || "mixed") === "arabic");
  const examEnglish = examQuestions.filter((q) => (q.language || "mixed") === "english");

  const viewArabicOnly = viewParam === "arabic";
  const viewEnglishOnly = viewParam === "english";
  const viewExamsArabic = viewParam === "exams-ar";
  const viewExamsEnglish = viewParam === "exams-en";
  const viewExamsAll = viewParam === "exams";

  // Get unique lessons for filter
  const getAvailableLessons = () => {
    const lessons: { id: string; title: string; language: Language }[] = [];
    questions.forEach((q) => {
      const lessonId = q.lessonId || "unknown";
      const lang = q.language || "mixed";
      const lessonTitle = getLessonTitle(lessonId, lang);
      if (!lessons.find((l) => l.id === lessonId)) {
        lessons.push({
          id: lessonId,
          title: lessonTitle,
          language: lang,
        });
      }
    });
    return lessons;
  };

  if (authLoading || adminLoading) {
    return (
      <div className="min-h-screen bg-white dark:bg-[#121218] flex items-center justify-center" dir="rtl">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">جاري التحقق من الصلاحيات...</p>
        </div>
      </div>
    );
  }

  if (!user || !isAdmin) {
    return null;
  }

  return (
    <div className="min-h-screen bg-white dark:bg-[#121218]" dir="rtl">
      <Navbar />

      <main className="container mx-auto px-4 py-8 max-w-7xl">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-6"
        >
          {/* Header */}
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-xl bg-primary-100 dark:bg-primary-900/30">
                <FileText className="h-6 w-6 text-primary-600 dark:text-primary-400" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">
                  إدارة الأسئلة
                </h1>
                <p className="text-gray-600 dark:text-gray-400 mt-1">
                  عرض وتعديل وحذف الأسئلة
                </p>
              </div>
            </div>
          </div>

          {/* Templates Section */}
          <div className="bg-white dark:bg-[#1c1c24] rounded-2xl shadow-lg border border-gray-200 dark:border-[#2e2e3a] p-6 mb-8">
            <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-4">
              قوالب الأسئلة
            </h2>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              اختر قالباً لإنشاء سؤال جديد
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Link href="/admin/questions/english-comprehensive-exam">
                <motion.div
                  whileHover={{ scale: 1.015, y: -2 }}
                  whileTap={{ scale: 0.985 }}
                  className="p-6 rounded-2xl border border-primary-200 dark:border-primary-800/60 bg-linear-to-br from-primary-50 via-white to-primary-100 dark:from-primary-900/20 dark:via-[#1c1c24] dark:to-primary-900/10 shadow-sm hover:shadow-md transition-all cursor-pointer"
                >
                  <div className="flex items-start gap-4">
                    <div className="p-3 rounded-xl bg-primary-100 dark:bg-primary-900/40 border border-primary-200 dark:border-primary-800/60">
                      <BookOpen className="h-6 w-6 text-primary-600 dark:text-primary-300" />
                    </div>
                    <div className="flex-1 space-y-2">
                      <div className="flex items-center gap-2 text-xs font-semibold text-primary-700 dark:text-primary-300">
                        <span className="px-2 py-1 rounded-full bg-primary-100 dark:bg-primary-900/40 border border-primary-200/70 dark:border-primary-800/60">
                          English Comprehensive Exam / Lesson
                        </span>
                      </div>
                      <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100">
                        قالب موحد للإنجليزي (امتحان أو درس)
                      </h3>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        Vocabulary, Grammar, Advanced Writing, Reading, Translation, Essay.
                      </p>
                      <div className="flex flex-wrap gap-2 text-[11px] text-gray-700 dark:text-gray-300">
                        <span className="px-2 py-1 rounded-full bg-white dark:bg-[#1f1f2a] border border-primary-200/70 dark:border-primary-800/60">
                          Vocab / Grammar
                        </span>
                        <span className="px-2 py-1 rounded-full bg-white dark:bg-[#1f1f2a] border border-primary-200/70 dark:border-primary-800/60">
                          Advanced Writing
                        </span>
                        <span className="px-2 py-1 rounded-full bg-white dark:bg-[#1f1f2a] border border-primary-200/70 dark:border-primary-800/60">
                          Reading + Translation + Essay
                        </span>
                      </div>
                      <div className="flex items-center gap-2 text-primary-700 dark:text-primary-300 font-semibold text-sm">
                        <span>Use template</span>
                        <ArrowRight className="h-4 w-4" />
                      </div>
                    </div>
                  </div>
                </motion.div>
              </Link>

              <Link href="/admin/questions/arabic-comprehensive-exam">
                <motion.div
                  whileHover={{ scale: 1.015, y: -2 }}
                  whileTap={{ scale: 0.985 }}
                  className="p-6 rounded-2xl border border-primary-200 dark:border-primary-800/60 bg-linear-to-br from-primary-50 via-white to-primary-100 dark:from-primary-900/20 dark:via-[#1c1c24] dark:to-primary-900/10 shadow-sm hover:shadow-md transition-all cursor-pointer"
                >
                  <div className="flex items-start gap-4">
                    <div className="p-3 rounded-xl bg-primary-100 dark:bg-primary-900/40 border border-primary-200 dark:border-primary-800/60">
                      <BookOpen className="h-6 w-6 text-primary-600 dark:text-primary-300" />
                    </div>
                    <div className="flex-1 space-y-2">
                      <div className="flex items-center gap-2 text-xs font-semibold text-primary-700 dark:text-primary-300">
                        <span className="px-2 py-1 rounded-full bg-primary-100 dark:bg-primary-900/40 border border-primary-200/70 dark:border-primary-800/60">
                          امتحان عربي شامل (Blocks)
                        </span>
                      </div>
                      <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100">
                        امتحان عربي شامل (قراءة/شعر/نحو/تعبير)
                      </h3>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        هيكل كتل: نصوص قراءة، نص شعري، نحو/استخراج، تعبير وظيفي/إبداعي، وأسئلة متعددة الأنماط.
                      </p>
                      <div className="flex flex-wrap gap-2 text-[11px] text-gray-700 dark:text-gray-300">
                        <span className="px-2 py-1 rounded-full bg-white dark:bg-[#1f1f2a] border border-primary-200/70 dark:border-primary-800/60">
                          نصوص + أسئلة مرتبطة
                        </span>
                        <span className="px-2 py-1 rounded-full bg-white dark:bg-[#1f1f2a] border border-primary-200/70 dark:border-primary-800/60">
                          MCQ + مقالي + بلاغة + مقارنة
                        </span>
                        <span className="px-2 py-1 rounded-full bg-white dark:bg-[#1f1f2a] border border-primary-200/70 dark:border-primary-800/60">
                          أوزان درجات مرنة
                        </span>
                      </div>
                      <div className="flex items-center gap-2 text-primary-700 dark:text-primary-300 font-semibold text-sm">
                        <span>استخدم القالب</span>
                        <ArrowRight className="h-4 w-4" />
                      </div>
                    </div>
                  </div>
                </motion.div>
              </Link>

              {/* English Question Manager card removed */}
            </div>
          </div>

          {/* Search and Filter Section */}
          <div className="bg-white dark:bg-[#1c1c24] rounded-2xl shadow-lg border border-gray-200 dark:border-[#2e2e3a] p-6">
            <div className="flex flex-col md:flex-row gap-4">
              {/* Search */}
              <div className="flex-1 relative">
                <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                <Input
                  type="text"
                  placeholder="ابحث في الأسئلة..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pr-10"
                />
              </div>

              {/* Filter Toggle */}
              <Button
                onClick={() => setShowFilters(!showFilters)}
                variant="outline"
                className="flex items-center gap-2"
              >
                <Filter className="h-4 w-4" />
                الفلاتر
              </Button>
            </div>

            {/* Filters */}
            <AnimatePresence>
              {showFilters && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  className="mt-4 pt-4 border-t border-gray-200 dark:border-[#2e2e3a]"
                >
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {/* Language Filter */}
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                        اللغة
                      </label>
                      <select
                        value={filterLanguage}
                        onChange={(e) => setFilterLanguage(e.target.value as Language | "all")}
                        className="w-full px-4 py-2 rounded-xl border border-gray-200 dark:border-[#2e2e3a] bg-white dark:bg-[#252530] text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-primary-500"
                      >
                        <option value="all">الكل</option>
                        <option value="arabic">عربي</option>
                        <option value="english">English</option>
                      </select>
                    </div>

                    {/* Type Filter */}
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                        نوع السؤال
                      </label>
                      <select
                        value={filterType}
                        onChange={(e) => setFilterType(e.target.value as QuestionType | "all")}
                        className="w-full px-4 py-2 rounded-xl border border-gray-200 dark:border-[#2e2e3a] bg-white dark:bg-[#252530] text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-primary-500"
                      >
                        <option value="all">الكل</option>
                      {getAvailableTypes().map((type) => (
                        <option key={type} value={type}>
                          {getTypeLabel(type)}
                        </option>
                      ))}
                      </select>
                    </div>

                    {/* Lesson Filter */}
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                        الدرس
                      </label>
                      <select
                        value={filterLesson}
                        onChange={(e) => setFilterLesson(e.target.value)}
                        className="w-full px-4 py-2 rounded-xl border border-gray-200 dark:border-[#2e2e3a] bg-white dark:bg-[#252530] text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-primary-500"
                      >
                        <option value="all">الكل</option>
                        {getAvailableLessons().map((lesson) => (
                          <option key={lesson.id} value={lesson.id}>
                            {lesson.title}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  {/* Clear Filters */}
                  <div className="mt-4">
                    <Button
                      onClick={() => {
                        setFilterLanguage("all");
                        setFilterType("all");
                        setFilterLesson("all");
                        setSearchQuery("");
                      }}
                      variant="outline"
                      className="w-full"
                    >
                      مسح جميع الفلاتر
                    </Button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>


          {/* Landing cards when no specific view is chosen */}
          {viewParam === "all" ? (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
              <Link href="/admin/questions/arabic">
                <motion.div
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className="p-5 rounded-2xl border-2 border-primary-200 dark:border-primary-800/40 bg-primary-50/60 dark:bg-primary-900/10 transition-all shadow-sm hover:shadow-md"
                >
                  <div className="flex items-start gap-3">
                    <div className="p-3 rounded-xl bg-primary-100 dark:bg-primary-900/30 text-primary-700 dark:text-primary-200">
                      <BookOpen className="h-5 w-5" />
                    </div>
                    <div className="flex-1">
                      <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100">أسئلة اللغة العربية</h3>
                      <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                        إدارة وإنشاء أسئلة العربي فقط.
                      </p>
                      <div className="mt-3 inline-flex items-center gap-2 text-primary-700 dark:text-primary-200 text-sm font-semibold">
                        <span>{arabicQuestions.length} سؤال</span>
                        <ArrowRight className="h-4 w-4" />
              </div>
            </div>
                  </div>
                </motion.div>
              </Link>

              <Link href="/admin/questions/english">
                <motion.div
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className="p-5 rounded-2xl border-2 border-primary-200 dark:border-primary-800/40 bg-primary-50/60 dark:bg-primary-900/10 transition-all shadow-sm hover:shadow-md"
                >
                  <div className="flex items-start gap-3">
                    <div className="p-3 rounded-xl bg-primary-100 dark:bg-primary-900/30 text-primary-700 dark:text-primary-200">
                      <BookOpen className="h-5 w-5" />
                    </div>
                    <div className="flex-1">
                      <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100">أسئلة اللغة الإنجليزية</h3>
                      <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                        إدارة وإنشاء أسئلة الإنجليزية فقط.
                      </p>
                      <div className="mt-3 inline-flex items-center gap-2 text-primary-700 dark:text-primary-200 text-sm font-semibold">
                        <span>{englishQuestions.length} سؤال</span>
                        <ArrowRight className="h-4 w-4" />
                      </div>
                    </div>
                  </div>
                </motion.div>
              </Link>

              <Link href="/admin/questions/exams-ar">
                <motion.div
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className="p-5 rounded-2xl border-2 border-emerald-200 dark:border-emerald-800/40 bg-emerald-50/60 dark:bg-emerald-900/10 transition-all shadow-sm hover:shadow-md"
                >
                  <div className="flex items-start gap-3">
                    <div className="p-3 rounded-xl bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-200">
                      <FileText className="h-5 w-5" />
                    </div>
                    <div className="flex-1">
                      <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100">امتحانات العربية</h3>
                      <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                        الامتحانات متعددة القوالب للغة العربية.
                      </p>
                      <div className="mt-3 inline-flex items-center gap-2 text-emerald-700 dark:text-emerald-200 text-sm font-semibold">
                        <span>{examQuestions.filter((q) => (q.language || "mixed") === "arabic").length} امتحان</span>
                        <ArrowRight className="h-4 w-4" />
                      </div>
                    </div>
                  </div>
                </motion.div>
              </Link>

              <Link href="/admin/questions/exams-en">
                <motion.div
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className="p-5 rounded-2xl border-2 border-primary-200 dark:border-primary-800/40 bg-primary-50/60 dark:bg-primary-900/10 transition-all shadow-sm hover:shadow-md"
                >
                  <div className="flex items-start gap-3">
                    <div className="p-3 rounded-xl bg-primary-100 dark:bg-primary-900/30 text-primary-700 dark:text-primary-200">
                      <FileText className="h-5 w-5" />
                    </div>
                    <div className="flex-1">
                      <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100">امتحانات الإنجليزية</h3>
                      <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                        الامتحانات متعددة القوالب للغة الإنجليزية.
                      </p>
                      <div className="mt-3 inline-flex items-center gap-2 text-primary-700 dark:text-primary-200 text-sm font-semibold">
                        <span>{examQuestions.filter((q) => (q.language || "mixed") === "english").length} امتحان</span>
                        <ArrowRight className="h-4 w-4" />
                      </div>
                    </div>
                  </div>
                </motion.div>
              </Link>
            </div>
          ) : (
          /* Questions List - separated */
          <div className="bg-white dark:bg-[#1c1c24] rounded-2xl shadow-lg border border-gray-200 dark:border-[#2e2e3a] p-6 space-y-8">
            {/* Arabic Questions */}
            {(viewParam === "all" || viewArabicOnly) && (
            <div>
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100">أسئلة اللغة العربية ({arabicQuestions.length})</h2>
                  <p className="text-gray-600 dark:text-gray-400 text-sm mt-1">الأسئلة العربية فقط</p>
                </div>
              </div>
              {loadingQuestions ? (
                <div className="text-center py-8">
                  <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary-600 mx-auto mb-3"></div>
                  <p className="text-gray-600 dark:text-gray-400">جاري تحميل الأسئلة...</p>
                </div>
              ) : arabicQuestions.length === 0 ? (
                <div className="text-center py-6 text-sm text-gray-600 dark:text-gray-400">
                  لا توجد أسئلة عربية مطابقة للبحث/الفلاتر
              </div>
            ) : (
              <div className="space-y-4">
                  {arabicQuestions.map((question, index) => (
                  <motion.div
                    key={question.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                    className="p-5 rounded-xl border border-gray-200 dark:border-[#2e2e3a] bg-gray-50 dark:bg-[#252530] hover:bg-gray-100 dark:hover:bg-[#2a2a35] transition-all"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-3 flex-wrap">
                          <span className="px-3 py-1 rounded-lg text-xs font-medium bg-primary-100 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300">
                            عربي
                          </span>
                          <span className="px-3 py-1 rounded-lg text-xs font-medium bg-gray-200 dark:bg-[#2e2e3a] text-gray-700 dark:text-gray-300">
                            {getTypeLabel(question.type, question.language)}
                          </span>
                          {getLessonTitle(question.lessonId, question.language) && (
                          <span className="px-3 py-1 rounded-lg text-xs font-medium bg-primary-100 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300">
                            {getLessonTitle(question.lessonId, question.language)}
                          </span>
                          )}
                        </div>
                        <p className="text-gray-900 dark:text-gray-100 font-medium mb-3 text-lg">
                          {getQuestionTitle(question)}
                        </p>
                        {question.type === "arabic_comprehensive" && question.arabicText && (
                          <div className="mb-3 p-3 rounded-lg bg-white dark:bg-[#1c1c24] border border-gray-200 dark:border-[#2e2e3a]">
                            <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">النص العربي:</p>
                            <p className="text-gray-900 dark:text-gray-100 font-arabic text-base leading-relaxed">
                              {question.arabicText.substring(0, 200)}
                              {question.arabicText.length > 200 && "..."}
                            </p>
                          </div>
                        )}
                        {question.type === "english_reading" && question.readingPassage && (
                          <div className="mb-3 p-3 rounded-lg bg-white dark:bg-[#1c1c24] border border-gray-200 dark:border-[#2e2e3a]">
                            <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Reading Passage:</p>
                            <p className="text-gray-900 dark:text-gray-100 text-base leading-relaxed" dir="ltr">
                              {question.readingPassage.substring(0, 200)}
                              {question.readingPassage.length > 200 && "..."}
                            </p>
                          </div>
                        )}
                        {question.type === "arabic_comprehensive" && (
                          <div className="flex flex-wrap gap-2 mt-3">
                            {(() => {
                              const examQuestion = question as QuestionWithExamProperties;
                              const mcq = examQuestion.multipleChoiceQuestions;
                              return mcq && Array.isArray(mcq) && mcq.length > 0 && (
                                <span className="text-xs px-2 py-1 rounded bg-primary-100 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300">
                                  {mcq.length} أسئلة اختيار من متعدد
                                </span>
                              );
                            })()}
                            {(() => {
                              const examQuestion = question as QuestionWithExamProperties;
                              const extraction = examQuestion.extractionQuestions;
                              return extraction && Array.isArray(extraction) && extraction.length > 0 && (
                                <span className="text-xs px-2 py-1 rounded bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300">
                                  {extraction.length} أسئلة استخراج
                                </span>
                              );
                            })()}
                            {(() => {
                              const examQuestion = question as QuestionWithExamProperties;
                              const shortEssay = examQuestion.shortEssayQuestions;
                              return shortEssay && Array.isArray(shortEssay) && shortEssay.length > 0 && (
                                <span className="text-xs px-2 py-1 rounded bg-primary-100 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300">
                                  {shortEssay.length} أسئلة مقالية
                                </span>
                              );
                            })()}
                            {(() => {
                              const examQuestion = question as QuestionWithExamProperties;
                              const grammar = examQuestion.grammarQuestions;
                              return grammar && Array.isArray(grammar) && grammar.length > 0 && (
                                <span className="text-xs px-2 py-1 rounded bg-primary-100 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300">
                                  {grammar.length} كلمات إعراب
                                </span>
                              );
                            })()}
                          </div>
                        )}
                        {question.type === "arabic_comprehensive_exam" && (
                          <div className="flex flex-wrap gap-2 mt-3">
                            {question.sections && question.sections.length > 0 && (
                              <span className="text-xs px-2 py-1 rounded bg-primary-100 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300">
                                {question.sections.length} كتل/أقسام
                              </span>
                            )}
                            {typeof question.durationMinutes === "number" && (
                              <span className="text-xs px-2 py-1 rounded bg-gray-200 dark:bg-[#2e2e3a] text-gray-700 dark:text-gray-300">
                                مدة الامتحان: {question.durationMinutes} دقيقة
                              </span>
                            )}
                          </div>
                        )}
                        {(question.type === "english_reading" || question.type === "english_comprehensive") && (
                          <div className="flex flex-wrap gap-2 mt-3">
                            {question.multipleChoiceQuestions && question.multipleChoiceQuestions.length > 0 && (
                              <span className="text-xs px-2 py-1 rounded bg-primary-100 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300">
                                {question.multipleChoiceQuestions.length} Multiple Choice Questions
                              </span>
                            )}
                          </div>
                        )}
                        {question.type === "english_translation" && (
                          <div className="flex flex-wrap gap-2 mt-3">
                            {question.translationQuestions && question.translationQuestions.length > 0 && (
                              <span className="text-xs px-2 py-1 rounded bg-primary-100 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300">
                                {question.translationQuestions.length} Translation Questions
                              </span>
                            )}
                          </div>
                        )}
                        {question.type === "english_literature" && (
                          <div className="flex flex-wrap gap-2 mt-3">
                            {question.essayQuestions && question.essayQuestions.length > 0 && (
                              <span className="text-xs px-2 py-1 rounded bg-primary-100 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300">
                                {question.essayQuestions.length} Essay Questions
                              </span>
                            )}
                          </div>
                        )}
                        {question.type === "english_essay" && (
                          <div className="flex flex-wrap gap-2 mt-3">
                            {question.essayQuestions && question.essayQuestions.length > 0 && (
                              <span className="text-xs px-2 py-1 rounded bg-primary-100 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300">
                                {question.essayQuestions.length} Essay Topics
                              </span>
                            )}
                          </div>
                        )}
                        {question.type === "multipleChoice" && question.options && (
                          <div className="space-y-2 mt-4">
                            {question.options.map((option, optIndex) => (
                              <div
                                key={optIndex}
                                className={`text-sm px-4 py-2 rounded-lg flex items-center gap-2 ${
                                  question.correctAnswer === optIndex
                                    ? "bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 font-medium border border-green-300 dark:border-green-700"
                                    : "bg-white dark:bg-[#1c1c24] text-gray-700 dark:text-gray-300 border border-gray-200 dark:border-[#2e2e3a]"
                                }`}
                              >
                                {question.correctAnswer === optIndex && (
                                  <CheckCircle2 className="h-4 w-4 shrink-0" />
                                )}
                                <span>
                                  {optIndex + 1}. {option}
                                </span>
                              </div>
                            ))}
                          </div>
                        )}
                        {question.type === "trueFalse" && (
                          <div className="mt-4 flex items-center gap-2">
                            <span className="text-sm text-gray-600 dark:text-gray-400">
                              الإجابة الصحيحة:
                            </span>
                            <span
                              className={`px-3 py-1 rounded-lg text-sm font-medium ${
                                question.correctAnswer
                                  ? "bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300"
                                  : "bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300"
                              }`}
                            >
                              {question.correctAnswer ? (
                                <>
                                  <CheckCircle2 className="h-4 w-4 inline ml-1" />
                                  صح
                                </>
                              ) : (
                                <>
                                  <XCircle className="h-4 w-4 inline ml-1" />
                                  خطأ
                                </>
                              )}
                            </span>
                          </div>
                        )}
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <button
                          onClick={() => handleEditQuestion(question)}
                          className="p-2 rounded-lg text-primary-600 dark:text-primary-400 hover:bg-primary-50 dark:hover:bg-primary-900/20 transition-colors"
                          title="تعديل"
                        >
                          <Edit className="h-5 w-5" />
                        </button>
                        <button
                          onClick={() => handleDeleteQuestion(question)}
                          className="p-2 rounded-lg text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                          title="حذف"
                        >
                          <Trash2 className="h-5 w-5" />
                        </button>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
            </div>
            )}

            {/* English Questions */}
            {(viewParam === "all" || viewEnglishOnly) && (
            <div>
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100">أسئلة اللغة الإنجليزية ({englishQuestions.length})</h2>
                  <p className="text-gray-600 dark:text-gray-400 text-sm mt-1">الأسئلة الإنجليزية فقط</p>
                </div>
              </div>
              {loadingQuestions ? (
                <div className="text-center py-8">
                  <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary-600 mx-auto mb-3"></div>
                  <p className="text-gray-600 dark:text-gray-400">جاري تحميل الأسئلة...</p>
                </div>
              ) : englishQuestions.length === 0 ? (
                <div className="text-center py-6 text-sm text-gray-600 dark:text-gray-400">
                  لا توجد أسئلة إنجليزية مطابقة للبحث/الفلاتر
                </div>
              ) : (
                <div className="space-y-4">
                  {englishQuestions.map((question, index) => (
                    <motion.div
                      key={question.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.05 }}
                      className="p-5 rounded-xl border border-gray-200 dark:border-[#2e2e3a] bg-gray-50 dark:bg-[#252530] hover:bg-gray-100 dark:hover:bg-[#2a2a35] transition-all"
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-3 flex-wrap">
                            <span className="px-3 py-1 rounded-lg text-xs font-medium bg-primary-100 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300">
                              English
                            </span>
                            <span className="px-3 py-1 rounded-lg text-xs font-medium bg-gray-200 dark:bg-[#2e2e3a] text-gray-700 dark:text-gray-300">
                              {getTypeLabel(question.type, question.language)}
                            </span>
                            {getLessonTitle(question.lessonId, question.language) && (
                              <span className="px-3 py-1 rounded-lg text-xs font-medium bg-primary-100 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300">
                                {getLessonTitle(question.lessonId, question.language)}
                              </span>
                            )}
                          </div>
                          <p className="text-gray-900 dark:text-gray-100 font-medium mb-3 text-lg" dir="ltr">
                            {getQuestionTitle(question)}
                          </p>
                          {question.type === "english_reading" && (question as QuestionWithExamProperties).readingPassage && (
                            <div className="mb-3 p-3 rounded-lg bg-white dark:bg-[#1c1c24] border border-gray-200 dark:border-[#2e2e3a]">
                              <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Reading Passage:</p>
                              <p className="text-gray-900 dark:text-gray-100 text-base leading-relaxed" dir="ltr">
                                {(() => {
                                  const examQuestion = question as QuestionWithExamProperties;
                                  const passage = examQuestion.readingPassage;
                                  if (!passage) return null;
                                  return (
                                    <>
                                      {passage.substring(0, 200)}
                                      {passage.length > 200 && "..."}
                                    </>
                                  );
                                })()}
                              </p>
                            </div>
                          )}
                          {question.type === "english_comprehensive_exam" && (
                            <div className="flex flex-wrap gap-2 mt-3">
                              {question.sections && question.sections.length > 0 && (
                                <span className="text-xs px-2 py-1 rounded bg-primary-100 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300">
                                  {question.sections.length} Sections
                                </span>
                              )}
                              {typeof question.durationMinutes === "number" && (
                                <span className="text-xs px-2 py-1 rounded bg-gray-200 dark:bg-[#2e2e3a] text-gray-700 dark:text-gray-300">
                                  Duration: {question.durationMinutes} mins
                                </span>
                              )}
                            </div>
                          )}
                          {(question.type === "english_reading" || question.type === "english_comprehensive") && (
                            <div className="flex flex-wrap gap-2 mt-3">
                              {(() => {
                                const examQuestion = question as QuestionWithExamProperties;
                                const mcq = examQuestion.multipleChoiceQuestions;
                                return mcq && Array.isArray(mcq) && mcq.length > 0 && (
                                  <span className="text-xs px-2 py-1 rounded bg-primary-100 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300">
                                    {mcq.length} Multiple Choice Questions
                                  </span>
                                );
                              })()}
                            </div>
                          )}
                          {question.type === "english_translation" && (
                            <div className="flex flex-wrap gap-2 mt-3">
                              {(() => {
                                const examQuestion = question as QuestionWithExamProperties;
                                const translation = examQuestion.translationQuestions;
                                return translation && Array.isArray(translation) && translation.length > 0 && (
                                  <span className="text-xs px-2 py-1 rounded bg-primary-100 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300">
                                    {translation.length} Translation Questions
                                  </span>
                                );
                              })()}
                            </div>
                          )}
                          {question.type === "english_literature" && (
                            <div className="flex flex-wrap gap-2 mt-3">
                              {(() => {
                                const examQuestion = question as QuestionWithExamProperties;
                                const essay = examQuestion.essayQuestions;
                                return essay && Array.isArray(essay) && essay.length > 0 && (
                                  <span className="text-xs px-2 py-1 rounded bg-primary-100 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300">
                                    {essay.length} Essay Questions
                                  </span>
                                );
                              })()}
                            </div>
                          )}
                          {question.type === "english_essay" && (
                            <div className="flex flex-wrap gap-2 mt-3">
                              {(() => {
                                const examQuestion = question as QuestionWithExamProperties;
                                const essay = examQuestion.essayQuestions;
                                return essay && Array.isArray(essay) && essay.length > 0 && (
                                  <span className="text-xs px-2 py-1 rounded bg-primary-100 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300">
                                    {essay.length} Essay Topics
                                  </span>
                                );
                              })()}
                            </div>
                          )}
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          <button
                            onClick={() => handleEditQuestion(question)}
                            className="p-2 rounded-lg text-primary-600 dark:text-primary-400 hover:bg-primary-50 dark:hover:bg-primary-900/20 transition-colors"
                            title="تعديل"
                          >
                            <Edit className="h-5 w-5" />
                          </button>
                          <button
                            onClick={() => handleDeleteQuestion(question)}
                            className="p-2 rounded-lg text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                            title="حذف"
                          >
                            <Trash2 className="h-5 w-5" />
                          </button>
                        </div>
          </div>
                    </motion.div>
                  ))}
                </div>
              )}
            </div>
            )}

            {/* Exams */}
            {(viewParam === "all" || viewExamsAll || viewExamsArabic || viewExamsEnglish) && (
            <div>
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100">
                    {viewExamsArabic
                      ? `امتحانات اللغة العربية (${examArabic.length})`
                      : viewExamsEnglish
                      ? `امتحانات اللغة الإنجليزية (${examEnglish.length})`
                      : `الامتحانات (${examQuestions.length})`}
                  </h2>
                  <p className="text-gray-600 dark:text-gray-400 text-sm mt-1">
                    {viewExamsArabic
                      ? "امتحانات اللغة العربية فقط"
                      : viewExamsEnglish
                      ? "امتحانات اللغة الإنجليزية فقط"
                      : "امتحانات متعددة القوالب"}
                  </p>
                </div>
              </div>
              {loadingQuestions ? (
                <div className="text-center py-8">
                  <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary-600 mx-auto mb-3"></div>
                  <p className="text-gray-600 dark:text-gray-400">جاري تحميل الامتحانات...</p>
                </div>
              ) : (viewExamsArabic && examArabic.length === 0) ||
                (viewExamsEnglish && examEnglish.length === 0) ||
                (!viewExamsArabic && !viewExamsEnglish && examQuestions.length === 0) ? (
                <div className="text-center py-6 text-sm text-gray-600 dark:text-gray-400">
                  لا توجد امتحانات مطابقة للبحث/الفلاتر
                </div>
              ) : (
                <div className="space-y-4">
                  {(viewExamsArabic
                    ? examArabic
                    : viewExamsEnglish
                    ? examEnglish
                    : examQuestions
                  ).map((question, index) => (
                    <motion.div
                      key={question.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.05 }}
                      className="p-5 rounded-xl border border-gray-200 dark:border-[#2e2e3a] bg-gray-50 dark:bg-[#252530] hover:bg-gray-100 dark:hover:bg-[#2a2a35] transition-all"
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-3 flex-wrap">
                            <span className="px-3 py-1 rounded-lg text-xs font-medium bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300">
                            {question.language === "english" ? "Exam" : "امتحان"}
                            </span>
                            <span className="px-3 py-1 rounded-lg text-xs font-medium bg-gray-200 dark:bg-[#2e2e3a] text-gray-700 dark:text-gray-300">
                            {getTypeLabel(question.type, question.language)}
                            </span>
                          <span className="px-3 py-1 rounded-lg text-xs font-medium bg-primary-100 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300">
                            {question.language === "english" ? "English" : "عربي"}
                          </span>
                          </div>
                          <p className="text-gray-900 dark:text-gray-100 font-medium mb-3 text-lg">
                            {getQuestionTitle(question) || "امتحان"}
                          </p>
                          {question.examDescription && (
                            <p className="text-sm text-gray-700 dark:text-gray-300">
                              {question.examDescription}
                            </p>
                          )}
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          <button
                            onClick={() => handleEditQuestion(question)}
                            className="p-2 rounded-lg text-primary-600 dark:text-primary-400 hover:bg-primary-50 dark:hover:bg-primary-900/20 transition-colors"
                            title="تعديل"
                          >
                            <Edit className="h-5 w-5" />
                          </button>
                          <button
                            onClick={() => handleDeleteQuestion(question)}
                            className="p-2 rounded-lg text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                            title="حذف"
                          >
                            <Trash2 className="h-5 w-5" />
                          </button>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}
            </div>
            )}
          </div>
          )}
        </motion.div>
      </main>

      <Footer />

      {/* Delete Confirmation Modal */}
      <AnimatePresence>
        {deleteConfirmModal.isOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={cancelDelete}
              className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            >
              <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 20 }}
                onClick={(e) => e.stopPropagation()}
                className="bg-white dark:bg-[#1c1c24] rounded-2xl shadow-2xl border border-gray-200 dark:border-[#2e2e3a] max-w-md w-full p-6"
              >
                <div className="flex items-center gap-4 mb-4">
                  <div className="p-3 rounded-xl bg-red-100 dark:bg-red-900/30">
                    <Trash2 className="h-6 w-6 text-red-600 dark:text-red-400" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-gray-900 dark:text-gray-100">
                      تأكيد الحذف
                    </h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      هل أنت متأكد من حذف هذا السؤال؟
                    </p>
                  </div>
                </div>
                
                <div className="mb-6 p-4 rounded-xl bg-gray-50 dark:bg-[#252530] border border-gray-200 dark:border-[#2e2e3a]">
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">السؤال:</p>
                  <p className="text-gray-900 dark:text-gray-100 font-medium">
                    {deleteConfirmModal.questionTitle}
                  </p>
                </div>

                <div className="flex gap-3">
                  <Button
                    onClick={cancelDelete}
                    variant="outline"
                    className="flex-1"
                  >
                    إلغاء
                  </Button>
                  <Button
                    onClick={confirmDelete}
                    className="flex-1 bg-red-600 hover:bg-red-700 text-white"
                  >
                    <Trash2 className="h-4 w-4 ml-2" />
                    حذف
                  </Button>
                </div>
              </motion.div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Success Notification */}
      <AnimatePresence>
        {successNotification.isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -100, x: "-50%" }}
            animate={{ opacity: 1, y: 0, x: "-50%" }}
            exit={{ opacity: 0, y: -100, x: "-50%" }}
            className="fixed top-6 left-1/2 transform -translate-x-1/2 z-50"
          >
            <div className="bg-green-500 text-white px-6 py-4 rounded-xl shadow-lg flex items-center gap-3 min-w-[300px]">
              <CheckCircle2 className="h-6 w-6 shrink-0" />
              <p className="font-medium">{successNotification.message}</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

