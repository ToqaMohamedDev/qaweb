"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useRouter } from "next/navigation";
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
  ArrowLeft,
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
import type { QuestionWithExamProperties, MCQ, TranslationQuestion, EssayQuestion } from "@/types/questionTypes";

type QuestionType = string;
type Language = "arabic" | "english" | "mixed";

interface QuestionData {
  lessonId?: string;
  language?: Language;
  type: QuestionType;
  question?: string;
  questionTitle?: string;
  readingPassage?: string;
  createdAt: Timestamp;
  createdBy: string | undefined;
  options?: string[];
  correctAnswer?: number | boolean;
  multipleChoiceQuestions?: Array<unknown>;
  translationQuestions?: Array<unknown>;
  essayQuestions?: Array<unknown>;
  usageScope?: "exam" | "lesson";
}

interface QuestionWithId extends QuestionData {
  id: string;
}

const englishLessons = [
  { id: "eng_lesson1_voc_gram_001", title: "Lesson 1 - Vocabulary and Grammar" },
  { id: "eng_lesson2_vocab_002", title: "Lesson 2 - Vocabulary" },
  { id: "eng_lesson3_reading_003", title: "Lesson 3 - Reading Comprehension" },
  { id: "eng_lesson4_translation_004", title: "Lesson 4 - Translation" },
  { id: "eng_lesson5_literature_005", title: "Lesson 5 - Literature: Great Expectations" },
  { id: "eng_lesson6_essay_006", title: "Lesson 6 - Essay Writing: Travel Destination" },
];

export default function EnglishQuestionsPage() {
  const { user, loading: authLoading } = useAuth();
  const { isAdmin, loading: adminLoading } = useAdmin();
  const router = useRouter();

  const [questions, setQuestions] = useState<QuestionWithId[]>([]);
  const [loadingQuestions, setLoadingQuestions] = useState(true);
  const [deleteConfirmModal, setDeleteConfirmModal] = useState<{
    isOpen: boolean;
    questionId: string | null;
    questionTitle: string;
  }>({
    isOpen: false,
    questionId: null,
    questionTitle: "",
  });
  const [successNotification, setSuccessNotification] = useState<{
    isOpen: boolean;
    message: string;
  }>({
    isOpen: false,
    message: "",
  });
  const [searchQuery, setSearchQuery] = useState("");
  const [filterType, setFilterType] = useState<QuestionType | "all">("all");
  const [filterLesson, setFilterLesson] = useState<string>("all");
  const [showFilters, setShowFilters] = useState(false);

  useEffect(() => {
    if (authLoading || adminLoading) return;
    if (!user || !isAdmin) {
      router.push("/");
      return;
    }
  }, [user, isAdmin, authLoading, adminLoading, router]);

  useEffect(() => {
    const fetchQuestions = async () => {
      if (!isAdmin) return;
      setLoadingQuestions(true);
      try {
        const questionsRef = collection(db, "questions");
        const q = query(questionsRef, orderBy("createdAt", "desc"));
        const querySnapshot = await getDocs(q);
        const questionsData: QuestionWithId[] = [];
        querySnapshot.forEach((docSnap) => {
          const data = docSnap.data() as QuestionData;
          if ((data.language || "english") === "english") {
            questionsData.push({
              id: docSnap.id,
              ...data,
            });
          }
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
    if (question.type === "english_comprehensive_exam") {
      router.push(`/admin/questions/english-comprehensive-exam?id=${question.id}`);
    } else {
      router.push(`/admin/questions/english-manager?id=${question.id}`);
    }
  };

  const handleDeleteQuestion = (question: QuestionWithId) => {
    const questionTitle =
      (question as QuestionWithExamProperties).questionTitle || question.question || (question as QuestionWithExamProperties).examTitle || "";
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
      const questionsRef = collection(db, "questions");
      const q = query(questionsRef, orderBy("createdAt", "desc"));
      const querySnapshot = await getDocs(q);
      const questionsData: QuestionWithId[] = [];
      querySnapshot.forEach((docSnap) => {
        const data = docSnap.data() as QuestionData;
        if ((data.language || "english") === "english") {
          questionsData.push({
            id: docSnap.id,
            ...data,
          });
        }
      });
      setQuestions(questionsData);
      setDeleteConfirmModal({ isOpen: false, questionId: null, questionTitle: "" });
      setSuccessNotification({ isOpen: true, message: "Question deleted successfully" });
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

  const getLessonTitle = (lessonId: string | undefined) => {
    if (!lessonId) return "";
    const lesson = englishLessons.find((l) => l.id === lessonId);
    return lesson?.title || lessonId;
  };

  const getTypeLabel = (type: QuestionType) => {
    switch (type) {
      case "english_comprehensive_exam":
        return "English Comprehensive Exam";
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
        return "Multiple Choice";
      case "trueFalse":
        return "True / False";
      case "essay":
        return "Essay";
      default:
        return type;
    }
  };

  const getQuestionTitle = (question: QuestionWithId) => {
    if (question.type === "english_comprehensive_exam") {
      const examQuestion = question as QuestionWithExamProperties;
      return (
        examQuestion.examTitle ||
        examQuestion.questionTitle ||
        question.question ||
        ""
      );
    }
    const questionWithTitle = question as QuestionWithExamProperties;
    return questionWithTitle.questionTitle || question.question || "";
  };

  const filteredQuestions = questions.filter((question) => {
    // Exclude comprehensive exams with usageScope === "exam" (they belong in exams page)
    if (
      question.type === "english_comprehensive_exam" &&
      (question.usageScope === "exam" || question.usageScope === undefined)
    ) {
      return false;
    }
    
    if (filterType !== "all" && question.type !== filterType) return false;
    if (filterLesson !== "all" && question.lessonId !== filterLesson) return false;
    if (searchQuery.trim()) {
      const queryText = searchQuery.toLowerCase();
      const questionText = getQuestionTitle(question).toLowerCase();
      const lessonTitle = getLessonTitle(question.lessonId).toLowerCase();
      if (!questionText.includes(queryText) && !lessonTitle.includes(queryText)) {
        if (question.type === "multipleChoice" && question.options) {
          const optionsMatch = question.options.some((opt) => opt.toLowerCase().includes(queryText));
          if (!optionsMatch) return false;
        } else {
          return false;
        }
      }
    }
    return true;
  });

  return (
    <div className="min-h-screen bg-white dark:bg-[#121218]" dir="rtl">
      <Navbar />

      <main className="container mx-auto px-4 py-8 max-w-7xl">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
          {/* Header */}
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-xl bg-primary-100 dark:bg-primary-900/30">
                <BookOpen className="h-6 w-6 text-primary-600 dark:text-primary-400" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">أسئلة اللغة الإنجليزية</h1>
                <p className="text-gray-600 dark:text-gray-400 mt-1">عرض وإدارة أسئلة الإنجليزي فقط.</p>
              </div>
            </div>
            <Link
              href="/admin/questions"
              className="inline-flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100"
            >
              <ArrowLeft className="h-4 w-4" />
              العودة لقائمة الأسئلة
            </Link>
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
              <Button onClick={() => setShowFilters(!showFilters)} variant="outline" className="flex items-center gap-2">
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
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                        <option value="english_reading">Reading</option>
                        <option value="english_translation">Translation</option>
                        <option value="english_literature">Literature</option>
                        <option value="english_essay">Essay Writing</option>
                        <option value="english_comprehensive">Comprehensive (Question)</option>
                        <option value="english_comprehensive_exam">Comprehensive (Exam)</option>
                        <option value="multipleChoice">MCQ</option>
                        <option value="trueFalse">True / False</option>
                        <option value="essay">Essay</option>
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
                        {englishLessons.map((lesson) => (
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

          {/* Questions List */}
          <div className="bg-white dark:bg-[#1c1c24] rounded-2xl shadow-lg border border-gray-200 dark:border-[#2e2e3a] p-6">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                  أسئلة الإنجليزية ({filteredQuestions.length})
                </h2>
                <p className="text-gray-600 dark:text-gray-400 text-sm mt-1">{questions.length} سؤال إجمالي</p>
              </div>
              <Link
                href="/admin/questions/english-comprehensive-exam"
                className="inline-flex items-center gap-2 text-sm font-semibold text-primary-700 dark:text-primary-300"
              >
                إنشاء امتحان شامل
                <ArrowLeft className="h-4 w-4 rotate-180" />
              </Link>
            </div>

            {loadingQuestions ? (
              <div className="text-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4"></div>
                <p className="text-gray-600 dark:text-gray-400">جاري تحميل الأسئلة...</p>
              </div>
            ) : filteredQuestions.length === 0 ? (
              <div className="text-center py-12">
                <FileText className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600 dark:text-gray-400 text-lg mb-2">
                  {searchQuery || filterType !== "all" || filterLesson !== "all"
                    ? "لا توجد نتائج للبحث"
                    : "لا توجد أسئلة"}
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {filteredQuestions.map((question, index) => (
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
                            {getTypeLabel(question.type)}
                          </span>
                          {getLessonTitle(question.lessonId) && (
                            <span className="px-3 py-1 rounded-lg text-xs font-medium bg-primary-100 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300">
                              {getLessonTitle(question.lessonId)}
                            </span>
                          )}
                        </div>
                        <p className="text-gray-900 dark:text-gray-100 font-medium mb-3 text-lg" dir="ltr">
                          {getQuestionTitle(question)}
                        </p>

                        {question.type === "english_reading" &&
                          (() => {
                            const q = question as QuestionWithExamProperties;
                            const reading = q.readingPassage;
                            if (!reading) return null;
                            const preview = reading.substring(0, 200);
                            const hasMore = reading.length > 200;
                            return (
                              <div className="mb-3 p-3 rounded-lg bg-white dark:bg-[#1c1c24] border border-gray-200 dark:border-[#2e2e3a]">
                                <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Reading Passage:</p>
                                <p className="text-gray-900 dark:text-gray-100 text-base leading-relaxed" dir="ltr">
                                  {preview}
                                  {hasMore && "..."}
                                </p>
                              </div>
                            );
                          })()}

                        {(question.type === "english_reading" || question.type === "english_comprehensive") && (
                          (() => {
                            const q = question as QuestionWithExamProperties;
                            const mcqs = (q.multipleChoiceQuestions as MCQ[] | undefined) ?? [];
                            if (mcqs.length === 0) return null;
                            return (
                              <div className="flex flex-wrap gap-2 mt-3">
                                <span className="text-xs px-2 py-1 rounded bg-primary-100 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300">
                                  {mcqs.length} Multiple Choice Questions
                                </span>
                              </div>
                            );
                          })()
                        )}

                        {question.type === "english_translation" && (
                          (() => {
                            const q = question as QuestionWithExamProperties;
                            const translations = (q.translationQuestions as TranslationQuestion[] | undefined) ?? [];
                            if (translations.length === 0) return null;
                            return (
                              <div className="flex flex-wrap gap-2 mt-3">
                                <span className="text-xs px-2 py-1 rounded bg-primary-100 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300">
                                  {translations.length} Translation Questions
                                </span>
                              </div>
                            );
                          })()
                        )}

                        {question.type === "english_literature" && (
                          (() => {
                            const q = question as QuestionWithExamProperties;
                            const essays = (q.essayQuestions as EssayQuestion[] | undefined) ?? [];
                            if (essays.length === 0) return null;
                            return (
                              <div className="flex flex-wrap gap-2 mt-3">
                                <span className="text-xs px-2 py-1 rounded bg-primary-100 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300">
                                  {essays.length} Essay Questions
                                </span>
                              </div>
                            );
                          })()
                        )}

                        {question.type === "english_essay" && (
                          (() => {
                            const q = question as QuestionWithExamProperties;
                            const essays = (q.essayQuestions as EssayQuestion[] | undefined) ?? [];
                            if (essays.length === 0) return null;
                            return (
                              <div className="flex flex-wrap gap-2 mt-3">
                                <span className="text-xs px-2 py-1 rounded bg-primary-100 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300">
                                  {essays.length} Essay Topics
                                </span>
                              </div>
                            );
                          })()
                        )}

                        {question.type === "english_comprehensive_exam" && (
                          (() => {
                            const q = question as QuestionWithExamProperties;
                            const sections = (q.sections ?? []) as NonNullable<QuestionWithExamProperties["sections"]>;
                            const duration = typeof q.durationMinutes === "number" ? q.durationMinutes : null;
                            const passing = q.passingScore;

                            if (sections.length === 0 && duration === null && !passing) return null;

                            return (
                              <div className="flex flex-wrap gap-2 mt-3">
                                {sections.length > 0 && (
                                  <span className="text-xs px-2 py-1 rounded bg-primary-100 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300">
                                    {sections.length} Sections
                                  </span>
                                )}
                                {duration !== null && (
                                  <span className="text-xs px-2 py-1 rounded bg-gray-200 dark:bg-[#2e2e3a] text-gray-700 dark:text-gray-300">
                                    Duration: {duration} mins
                                  </span>
                                )}
                                {typeof passing === "number" && (
                                  <span className="text-xs px-2 py-1 rounded bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300">
                                    Passing: {passing}%
                                  </span>
                                )}
                              </div>
                            );
                          })()
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
                                {question.correctAnswer === optIndex && <CheckCircle2 className="h-4 w-4 shrink-0" />}
                                <span>
                                  {optIndex + 1}. {option}
                                </span>
                              </div>
                            ))}
                          </div>
                        )}

                        {question.type === "trueFalse" && (
                          <div className="mt-4 flex items-center gap-2">
                            <span className="text-sm text-gray-600 dark:text-gray-400">الإجابة الصحيحة:</span>
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
                                  True
                                </>
                              ) : (
                                <>
                                  <XCircle className="h-4 w-4 inline ml-1" />
                                  False
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
                    <h3 className="text-xl font-bold text-gray-900 dark:text-gray-100">تأكيد الحذف</h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400">هل أنت متأكد من حذف هذا السؤال؟</p>
                  </div>
                </div>

                <div className="mb-6 p-4 rounded-xl bg-gray-50 dark:bg-[#252530] border border-gray-200 dark:border-[#2e2e3a]">
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">السؤال:</p>
                  <p className="text-gray-900 dark:text-gray-100 font-medium">{deleteConfirmModal.questionTitle}</p>
                </div>

                <div className="flex gap-3">
                  <Button onClick={cancelDelete} variant="outline" className="flex-1">
                    إلغاء
                  </Button>
                  <Button onClick={confirmDelete} className="flex-1 bg-red-600 hover:bg-red-700 text-white">
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


