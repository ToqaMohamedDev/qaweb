"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/contexts/AuthContext";
import { useAdmin } from "@/hooks/useAdmin";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { FileText, Edit, Trash2, Search, ArrowLeft, CheckCircle2, Eye, X } from "lucide-react";
import {
  collection,
  getDocs,
  doc,
  getDoc,
  deleteDoc,
  query,
  orderBy,
  Timestamp,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import { Input } from "@/components/Input";
import { Button } from "@/components/Button";
import type { SectionWithQuestionData, SubSection, MCQ, ExtractionQuestion, QuestionWithExamProperties } from "@/types/questionTypes";

type Language = "arabic" | "english" | "mixed";

interface QuestionData {
  language?: Language;
  type: string;
  question?: string;
  createdAt: Timestamp;
  createdBy: string | undefined;
  usageScope?: "exam" | "lesson";
}

interface QuestionWithId extends QuestionData {
  id: string;
}

export default function ArabicExamsPage() {
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
  const [previewExam, setPreviewExam] = useState<QuestionWithId | null>(null);
  const [examDetails, setExamDetails] = useState<QuestionWithId & { sections?: SectionWithQuestionData[] } | null>(null);

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
          // Only include exams with usageScope === "exam" or undefined (exclude lessons)
          if (
            data.language === "arabic" &&
            data.type === "arabic_comprehensive_exam" &&
            (data.usageScope === "exam" || data.usageScope === undefined)
          ) {
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
    router.push(`/admin/questions/arabic-comprehensive-exam?id=${question.id}`);
  };

  const handleDeleteQuestion = (question: QuestionWithId) => {
    const questionTitle = (question as QuestionWithExamProperties).examTitle || question.question || "امتحان";
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
          // Only include exams with usageScope === "exam" or undefined (exclude lessons)
          if (
            data.language === "arabic" &&
            data.type === "arabic_comprehensive_exam" &&
            (data.usageScope === "exam" || data.usageScope === undefined)
          ) {
            questionsData.push({
              id: doc.id,
              ...data,
            });
          }
        });
      setQuestions(questionsData);
      setDeleteConfirmModal({ isOpen: false, questionId: null, questionTitle: "" });
      setSuccessNotification({ isOpen: true, message: "تم حذف الامتحان بنجاح" });
      setTimeout(() => {
        setSuccessNotification({ isOpen: false, message: "" });
      }, 3000);
    } catch (error: unknown) {
      console.error("Error deleting question:", error);
      setDeleteConfirmModal({ isOpen: false, questionId: null, questionTitle: "" });
      alert("حدث خطأ أثناء حذف الامتحان");
    }
  };

  const cancelDelete = () => {
    setDeleteConfirmModal({ isOpen: false, questionId: null, questionTitle: "" });
  };

  const handlePreview = async (question: QuestionWithId) => {
    setPreviewExam(question);
    try {
      // Load full exam details including referenced questions
      const sections = (question as QuestionWithId & { sections?: SectionWithQuestionData[] }).sections || [];
      const loadedSections = await Promise.all(
        sections.map(async (section: SectionWithQuestionData) => {
          if (!section.questionId) return section;
          try {
            const questionDoc = await getDoc(doc(db, "questions", section.questionId));
            if (questionDoc.exists()) {
              const qData = questionDoc.data();
              return { ...section, questionData: qData };
            }
          } catch (err) {
            console.error("Error loading question:", err);
          }
          return section;
        })
      );
      setExamDetails({ ...question, sections: loadedSections });
    } catch (error) {
      console.error("Error loading exam details:", error);
      setExamDetails(question);
    }
  };

  const filteredQuestions = questions.filter((question) => {
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      const questionWithExam = question as QuestionWithExamProperties;
      const examTitle = (questionWithExam.examTitle || question.question || "").toLowerCase();
      const examDesc = (questionWithExam.examDescription || "").toLowerCase();
      if (!examTitle.includes(query) && !examDesc.includes(query)) {
        return false;
      }
    }
    return true;
  });

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
              <div className="p-3 rounded-xl bg-emerald-100 dark:bg-emerald-900/30">
                <FileText className="h-6 w-6 text-emerald-600 dark:text-emerald-400" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">امتحانات اللغة العربية</h1>
                <p className="text-gray-600 dark:text-gray-400 mt-1">عرض وتعديل وحذف الامتحانات العربية</p>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-[#1c1c24] rounded-2xl shadow-lg border border-gray-200 dark:border-[#2e2e3a] p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100">
                الامتحانات ({filteredQuestions.length})
              </h2>
              <div className="relative flex-1 max-w-md">
                <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                <Input
                  type="text"
                  placeholder="ابحث في الامتحانات..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pr-10"
                />
              </div>
            </div>

            {loadingQuestions ? (
              <div className="text-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4"></div>
                <p className="text-gray-600 dark:text-gray-400">جاري تحميل الامتحانات...</p>
              </div>
            ) : filteredQuestions.length === 0 ? (
              <div className="text-center py-12">
                <FileText className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600 dark:text-gray-400 text-lg mb-2">
                  {searchQuery ? "لا توجد نتائج للبحث" : "لا توجد امتحانات عربية محفوظة"}
                </p>
                {!searchQuery && (
                  <Link href="/admin/questions/arabic-comprehensive-exam">
                    <Button className="mt-4">إنشاء امتحان جديد</Button>
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
                          <span className="px-3 py-1 rounded-lg text-xs font-medium bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300">
                            امتحان
                          </span>
                          <span className="px-3 py-1 rounded-lg text-xs font-medium bg-gray-200 dark:bg-[#2e2e3a] text-gray-700 dark:text-gray-300">
                            امتحان متعدد القوالب
                          </span>
                        </div>
                        <p className="text-gray-900 dark:text-gray-100 font-medium mb-3 text-lg">
                          {(question as QuestionWithExamProperties).examTitle || question.question || "امتحان"}
                        </p>
                        {(question as QuestionWithExamProperties).examDescription && (
                          <p className="text-sm text-gray-700 dark:text-gray-300 mb-2">
                            {(question as QuestionWithExamProperties).examDescription}
                          </p>
                        )}
                        {(question as QuestionWithExamProperties).sections && Array.isArray((question as QuestionWithExamProperties).sections) && (
                          <p className="text-xs text-gray-500 dark:text-gray-400">
                            عدد المقاطع: {((question as QuestionWithExamProperties).sections || []).length}
                          </p>
                        )}
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <button
                          onClick={() => handlePreview(question)}
                          className="p-2 rounded-lg text-green-600 dark:text-green-400 hover:bg-primary-50 dark:hover:bg-primary-900/20 transition-colors"
                          title="معاينة"
                        >
                          <Eye className="h-5 w-5" />
                        </button>
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
                    <p className="text-sm text-gray-600 dark:text-gray-400">هل أنت متأكد من حذف هذا الامتحان؟</p>
                  </div>
                </div>
                <div className="mb-6 p-4 rounded-xl bg-gray-50 dark:bg-[#252530] border border-gray-200 dark:border-[#2e2e3a]">
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">الامتحان:</p>
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

      {/* Preview Modal */}
      <AnimatePresence>
        {previewExam && examDetails && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => {
                setPreviewExam(null);
                setExamDetails(null);
              }}
              className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto"
            >
              <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 20 }}
                onClick={(e) => e.stopPropagation()}
                className="bg-white dark:bg-[#1c1c24] rounded-2xl shadow-2xl border border-gray-200 dark:border-[#2e2e3a] max-w-4xl w-full p-6 my-8 max-h-[90vh] overflow-y-auto"
              >
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">معاينة الامتحان</h2>
                  <button
                    onClick={() => {
                      setPreviewExam(null);
                      setExamDetails(null);
                    }}
                    className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-[#2a2a35] transition-colors"
                  >
                    <X className="h-5 w-5" />
                  </button>
                </div>

                <div className="space-y-6">
                  {/* Exam Header */}
                  <div className="border-b border-gray-200 dark:border-[#2e2e3a] pb-4">
                    <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-2">
                      {(examDetails as QuestionWithExamProperties).examTitle || "امتحان"}
                    </h1>
                    {(examDetails as QuestionWithExamProperties).examDescription && (
                      <p className="text-gray-700 dark:text-gray-300 mb-2">
                        {(examDetails as QuestionWithExamProperties).examDescription}
                      </p>
                    )}
                    <div className="flex gap-4 text-sm text-gray-600 dark:text-gray-400">
                      {(examDetails as QuestionWithExamProperties).durationMinutes && (
                        <span>المدة: {(examDetails as QuestionWithExamProperties).durationMinutes} دقيقة</span>
                      )}
                      {(examDetails as QuestionWithExamProperties).passingScore && (
                        <span>درجة النجاح: {(examDetails as QuestionWithExamProperties).passingScore}</span>
                      )}
                    </div>
                  </div>

                  {/* Sections */}
                  {examDetails.sections && Array.isArray(examDetails.sections) && examDetails.sections.length > 0 && (
                    <div className="space-y-6">
                      {examDetails.sections.map((section: SectionWithQuestionData, sectionIndex: number) => (
                        <div key={section.id || sectionIndex} className="border border-gray-200 dark:border-[#2e2e3a] rounded-xl p-5 bg-gray-50 dark:bg-[#252530]">
                          <div className="mb-4">
                            <h3 className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-1">
                              المقطع {sectionIndex + 1}
                              {section.note && <span className="text-sm font-normal text-gray-600 dark:text-gray-400"> - {section.note}</span>}
                            </h3>
                            <span className="text-xs px-2 py-1 rounded bg-primary-100 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300">
                              {section.templateType === "arabic_multi_section" ? "قالب اللغة العربية" : section.templateType}
                            </span>
                          </div>

                          {section.questionData ? (
                            <div className="space-y-4">
                              {/* Arabic Text */}
                              {section.questionData.arabicText && (
                                <div className="p-4 rounded-lg bg-white dark:bg-[#1c1c24] border border-gray-200 dark:border-[#2e2e3a]">
                                  <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">النص العربي:</h4>
                                  <p className="font-arabic text-base leading-relaxed text-gray-900 dark:text-gray-100">
                                    {section.questionData.arabicText}
                                  </p>
                                </div>
                              )}

                              {/* Sections from arabic_multi_section */}
                              {section.questionData?.sections && Array.isArray(section.questionData.sections) && (
                                <div className="space-y-3">
                                  {section.questionData.sections.map((subSection: SubSection, subIndex: number) => (
                                    <div key={subIndex} className="p-3 rounded-lg bg-white dark:bg-[#1c1c24] border border-gray-200 dark:border-[#2e2e3a]">
                                      {subSection.arabicText && (
                                        <div className="mb-3">
                                          <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1">النص:</h4>
                                          <p className="font-arabic text-sm leading-relaxed text-gray-900 dark:text-gray-100">
                                            {subSection.arabicText.substring(0, 200)}
                                            {subSection.arabicText.length > 200 && "..."}
                                          </p>
                                        </div>
                                      )}
                                      {subSection.multipleChoiceQuestions && subSection.multipleChoiceQuestions.length > 0 && (
                                        <div className="mb-2">
                                          <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1">
                                            أسئلة اختيار من متعدد ({subSection.multipleChoiceQuestions.length})
                                          </h4>
                                        </div>
                                      )}
                                      {subSection.extractionQuestions && subSection.extractionQuestions.length > 0 && (
                                        <div className="mb-2">
                                          <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1">
                                            أسئلة الاستخراج ({subSection.extractionQuestions.length})
                                          </h4>
                                        </div>
                                      )}
                                    </div>
                                  ))}
                                </div>
                              )}

                              {/* Multiple Choice Questions */}
                              {section.questionData.multipleChoiceQuestions && section.questionData.multipleChoiceQuestions.length > 0 && (
                                <div className="space-y-3">
                                  <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                                    أسئلة اختيار من متعدد:
                                  </h4>
                                  {section.questionData?.multipleChoiceQuestions && section.questionData.multipleChoiceQuestions.map((mcq: MCQ, mcqIndex: number) => (
                                    <div key={mcqIndex} className="p-3 rounded-lg bg-white dark:bg-[#1c1c24] border border-gray-200 dark:border-[#2e2e3a]">
                                      <p className="font-medium text-gray-900 dark:text-gray-100 mb-2">
                                        {mcqIndex + 1}. {mcq.question}
                                      </p>
                                      <div className="space-y-1">
                                        {mcq.options && mcq.options.map((opt: string, optIndex: number) => (
                                          <div key={optIndex} className={`text-sm px-3 py-1 rounded ${
                                            mcq.correctAnswer === optIndex
                                              ? "bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 font-medium"
                                              : "bg-gray-50 dark:bg-[#252530] text-gray-700 dark:text-gray-300"
                                          }`}>
                                            {String.fromCharCode(65 + optIndex)}. {opt}
                                          </div>
                                        ))}
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              )}

                              {/* Extraction Questions */}
                              {section.questionData.extractionQuestions && section.questionData.extractionQuestions.length > 0 && (
                                <div className="space-y-2">
                                  <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                                    أسئلة الاستخراج:
                                  </h4>
                                  {section.questionData?.extractionQuestions && section.questionData.extractionQuestions.map((ext: ExtractionQuestion, extIndex: number) => (
                                    <div key={extIndex} className="p-3 rounded-lg bg-white dark:bg-[#1c1c24] border border-gray-200 dark:border-[#2e2e3a]">
                                      <p className="text-sm text-gray-900 dark:text-gray-100">
                                        {extIndex + 1}. {ext.question}
                                      </p>
                                    </div>
                                  ))}
                                </div>
                              )}
                            </div>
                          ) : (
                            <p className="text-sm text-gray-500 dark:text-gray-400">لم يتم تحميل بيانات السؤال</p>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </motion.div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
