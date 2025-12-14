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
  FileText,
  Edit,
  Trash2,
  Search,
  Filter,
  ArrowLeft,
  CheckCircle2,
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
import type { QuestionWithExamProperties, MCQ, ExtractionQuestion, ShortEssayQuestion, GrammarQuestion } from "@/types/questionTypes";

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
  usageScope?: "exam" | "lesson";
}

interface QuestionWithId extends QuestionData {
  id: string;
}

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

export default function ArabicQuestionsPage() {
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
        querySnapshot.forEach((doc) => {
          const data = doc.data() as QuestionData;
          if ((data.language || "arabic") === "arabic") {
            questionsData.push({
              id: doc.id,
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
    if (question.type === "arabic_comprehensive_exam") {
      router.push(`/admin/questions/arabic-comprehensive-exam?id=${question.id}`);
    } else if (question.type === "arabic_comprehensive" || question.type === "arabic_multi_section") {
      router.push(`/admin/questions/arabic-template?id=${question.id}`);
    } else {
      // For other types (multipleChoice, trueFalse, essay), redirect to arabic-template as well
      // or show a message that editing is not yet supported for this type
      router.push(`/admin/questions/arabic-template?id=${question.id}`);
    }
  };

  const handleDeleteQuestion = (question: QuestionWithId) => {
    const questionTitle = (question as QuestionWithExamProperties).mainQuestion || question.question || "";
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
      querySnapshot.forEach((doc) => {
        const data = doc.data() as QuestionData;
        if ((data.language || "arabic") === "arabic" && data.type !== "multi_template_exam") {
          questionsData.push({
            id: doc.id,
            ...data,
          });
        }
      });
      setQuestions(questionsData);
      setDeleteConfirmModal({ isOpen: false, questionId: null, questionTitle: "" });
      setSuccessNotification({ isOpen: true, message: "تم حذف السؤال بنجاح" });
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
    const lesson = arabicLessons.find((l) => l.id === lessonId);
    return lesson?.title || lessonId;
  };

  const getTypeLabel = (type: QuestionType) => {
    switch (type) {
      case "arabic_comprehensive":
        return "سؤال شامل";
      case "arabic_multi_section":
        return "سؤال متعدد المقاطع";
      default:
        return type;
    }
  };

  const getQuestionTitle = (question: QuestionWithId) => {
    if (question.type === "arabic_comprehensive" || question.type === "arabic_multi_section") {
      const questionWithMain = question as QuestionWithExamProperties;
      return questionWithMain.mainQuestion || question.question || "";
    }
    return question.question || "";
  };

  const filteredQuestions = questions.filter((question) => {
    // Exclude comprehensive exams with usageScope === "exam" (they belong in exams page)
    if (
      question.type === "arabic_comprehensive_exam" &&
      (question.usageScope === "exam" || question.usageScope === undefined)
    ) {
      return false;
    }
    
    if (filterType !== "all" && question.type !== filterType) return false;
    if (filterLesson !== "all" && question.lessonId !== filterLesson) return false;
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      const questionText = getQuestionTitle(question).toLowerCase();
      const lessonTitle = getLessonTitle(question.lessonId).toLowerCase();
      if (!questionText.includes(query) && !lessonTitle.includes(query)) {
        if (question.type === "multipleChoice" && question.options) {
          const optionsMatch = question.options.some((opt) =>
            opt.toLowerCase().includes(query)
          );
          if (!optionsMatch) return false;
        } else {
          return false;
        }
      }
    }
    return true;
  });

  const getAvailableLessons = () => {
    const lessons: { id: string; title: string }[] = [];
    questions.forEach((q) => {
      const lessonId = q.lessonId || "unknown";
      const lessonTitle = getLessonTitle(lessonId);
      if (!lessons.find((l) => l.id === lessonId)) {
        lessons.push({ id: lessonId, title: lessonTitle });
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
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-3">
              <Link href="/admin/questions" className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-[#2a2a35] transition-colors">
                <ArrowLeft className="h-5 w-5 text-gray-600 dark:text-gray-400" />
              </Link>
              <div className="p-3 rounded-xl bg-primary-100 dark:bg-primary-900/30">
                <FileText className="h-6 w-6 text-primary-600 dark:text-primary-400" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">أسئلة اللغة العربية</h1>
                <p className="text-gray-600 dark:text-gray-400 mt-1">عرض وتعديل وحذف الأسئلة العربية</p>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-[#1c1c24] rounded-2xl shadow-lg border border-gray-200 dark:border-[#2e2e3a] p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100">
                الأسئلة ({filteredQuestions.length})
              </h2>
              <div className="flex items-center gap-3">
                <div className="relative flex-1 max-w-md">
                  <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                  <Input
                    type="text"
                    placeholder="ابحث في الأسئلة..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pr-10"
                  />
                </div>
                <Button
                  onClick={() => setShowFilters(!showFilters)}
                  variant="outline"
                  className="flex items-center gap-2"
                >
                  <Filter className="h-4 w-4" />
                  فلاتر
                </Button>
              </div>
            </div>

            <AnimatePresence>
              {showFilters && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  className="mb-6 p-4 rounded-xl border border-gray-200 dark:border-[#2e2e3a] bg-gray-50 dark:bg-[#252530] space-y-4"
                >
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                        نوع السؤال
                      </label>
                      <select
                        value={filterType}
                        onChange={(e) => setFilterType(e.target.value)}
                        className="w-full px-4 py-2 rounded-xl border border-gray-200 dark:border-[#2e2e3a] bg-white dark:bg-[#252530] text-gray-900 dark:text-gray-100"
                      >
                        <option value="all">الكل</option>
                        <option value="arabic_comprehensive">سؤال شامل</option>
                        <option value="arabic_multi_section">سؤال متعدد المقاطع</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                        الدرس
                      </label>
                      <select
                        value={filterLesson}
                        onChange={(e) => setFilterLesson(e.target.value)}
                        className="w-full px-4 py-2 rounded-xl border border-gray-200 dark:border-[#2e2e3a] bg-white dark:bg-[#252530] text-gray-900 dark:text-gray-100"
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
                </motion.div>
              )}
            </AnimatePresence>

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
                    : "لا توجد أسئلة عربية محفوظة"}
                </p>
                {!searchQuery && filterType === "all" && filterLesson === "all" && (
                  <Link href="/admin/questions/arabic-template">
                    <Button className="mt-4">
                      إنشاء سؤال جديد
                    </Button>
                  </Link>
                )}
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
                            عربي
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
                        <p className="text-gray-900 dark:text-gray-100 font-medium mb-3 text-lg">
                          {getQuestionTitle(question)}
                        </p>
                        {question.type === "arabic_comprehensive" && (question as QuestionWithExamProperties).arabicText && (
                          (() => {
                            const arabicText = (question as QuestionWithExamProperties).arabicText;
                            if (!arabicText) return null;
                            const preview = arabicText.substring(0, 200);
                            const hasMore = arabicText.length > 200;
                            return (
                          <div className="mb-3 p-3 rounded-lg bg-white dark:bg-[#1c1c24] border border-gray-200 dark:border-[#2e2e3a]">
                            <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">النص العربي:</p>
                            <p className="text-gray-900 dark:text-gray-100 font-arabic text-base leading-relaxed">
                              {preview}
                              {hasMore && "..."}
                            </p>
                          </div>
                            );
                          })()
                        )}
                        {question.type === "arabic_comprehensive" && (() => {
                          const q = question as QuestionWithExamProperties;
                          const mcqs = (q.multipleChoiceQuestions as MCQ[] | undefined) ?? [];
                          const extractions = (q.extractionQuestions as ExtractionQuestion[] | undefined) ?? [];
                          const essays = (q.shortEssayQuestions as ShortEssayQuestion[] | undefined) ?? [];
                          const grammar = (q.grammarQuestions as GrammarQuestion[] | undefined) ?? [];

                          const hasAny =
                            mcqs.length > 0 ||
                            extractions.length > 0 ||
                            essays.length > 0 ||
                            grammar.length > 0;

                          if (!hasAny) return null;

                          return (
                            <div className="flex flex-wrap gap-2 mt-3">
                              {mcqs.length > 0 && (
                                <span className="text-xs px-2 py-1 rounded bg-primary-100 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300">
                                  {mcqs.length} أسئلة اختيار من متعدد
                                </span>
                              )}
                              {extractions.length > 0 && (
                                <span className="text-xs px-2 py-1 rounded bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300">
                                  {extractions.length} أسئلة استخراج
                                </span>
                              )}
                              {essays.length > 0 && (
                                <span className="text-xs px-2 py-1 rounded bg-primary-100 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300">
                                  {essays.length} أسئلة مقالية
                                </span>
                              )}
                              {grammar.length > 0 && (
                                <span className="text-xs px-2 py-1 rounded bg-primary-100 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300">
                                  {grammar.length} كلمات إعراب
                                </span>
                              )}
                            </div>
                          );
                        })()}
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
