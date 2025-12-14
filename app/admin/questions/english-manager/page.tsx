"use client";

import { useEffect, useMemo, useState, type ChangeEvent } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { useAuth } from "@/contexts/AuthContext";
import { useAdmin } from "@/hooks/useAdmin";
import { doc, getDoc, updateDoc, Timestamp, type DocumentData } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { motion } from "framer-motion";
import Link from "next/link";
import { AlertTriangle, ArrowLeft, Save, BookOpen } from "lucide-react";
import { Button } from "@/components/Button";
import { Input } from "@/components/Input";
import { ComprehensiveForm } from "./components/ComprehensiveForm";
import { ReadingForm } from "./components/ReadingForm";
import { TranslationForm } from "./components/TranslationForm";
import { LiteratureForm } from "./components/LiteratureForm";
import { EssayForm } from "./components/EssayForm";
import type {
  QuestionType,
  BaseData,
  ComprehensiveData,
  ReadingData,
  TranslationData,
  EssayData,
  SpecificData,
} from "./types";

type Language = "arabic" | "english" | "mixed";

type QuestionData = BaseData &
  Partial<ComprehensiveData & ReadingData & TranslationData & EssayData> & {
    language?: Language;
    type: QuestionType;
    question?: string;
    examTitle?: string;
    createdAt: Timestamp;
    createdBy: string | undefined;
  };

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

export default function EnglishManager() {
  const { user, loading: authLoading } = useAuth();
  const { isAdmin, loading: adminLoading } = useAdmin();
  const router = useRouter();
  const searchParams = useSearchParams();
  const questionId = searchParams?.get("id");

  const [question, setQuestion] = useState<QuestionWithId | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [baseData, setBaseData] = useState<BaseData>({
    lessonId: "",
    questionTitle: "",
    questionSubtitle: "",
  });
  const [specificData, setSpecificData] = useState<SpecificData | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);

  useEffect(() => {
    if (authLoading || adminLoading) return;
    if (!user || !isAdmin) {
      router.push("/");
    }
  }, [user, isAdmin, authLoading, adminLoading, router]);

  useEffect(() => {
    const loadQuestion = async () => {
      if (!questionId) {
        setLoading(false);
        return;
      }
      try {
        const docRef = doc(db, "questions", questionId);
        const snap = await getDoc(docRef);
        if (snap.exists()) {
          const data = snap.data() as QuestionData;
          setQuestion({ id: snap.id, ...data });
          // Redirect to proper editor if it is a comprehensive exam
          if ((data.type as string) === "english_comprehensive_exam") {
            router.replace(`/admin/questions/english-comprehensive-exam?id=${questionId}`);
            return;
          }
          setBaseData({
            lessonId: data.lessonId || "",
            questionTitle: data.questionTitle || data.question || data.examTitle || "",
            questionSubtitle: (data as QuestionData & { questionSubtitle?: string }).questionSubtitle || "",
          });
          if (data.type === "english_reading") {
            setSpecificData({
              readingPassage: (data as QuestionData & ReadingData).readingPassage || "",
              multipleChoiceQuestions: (data as QuestionData & ReadingData).multipleChoiceQuestions || [],
            } as ReadingData);
          } else if (data.type === "english_translation") {
            setSpecificData({
              translationQuestions: (data as QuestionData & TranslationData).translationQuestions || [],
            } as TranslationData);
          } else if (data.type === "english_literature") {
            setSpecificData({
              essayQuestions: (data as QuestionData & EssayData).essayQuestions || [],
            } as EssayData);
          } else if (data.type === "english_essay") {
            setSpecificData({
              essayQuestions: (data as QuestionData & EssayData).essayQuestions || [],
            } as EssayData);
          } else {
            // english_comprehensive fallback
            setSpecificData({
              multipleChoiceQuestions: (data as QuestionData & ComprehensiveData).multipleChoiceQuestions || [],
            } as ComprehensiveData);
          }
        }
      } catch (error) {
        console.error("Error loading question:", error);
        setLoadError("تعذر تحميل السؤال");
      } finally {
        setLoading(false);
      }
    };

    loadQuestion();
  }, [questionId, router]);

  const handleSave = async () => {
    if (!question || !questionId) return;
    setSaving(true);
    try {
      const payload: DocumentData = {
        lessonId: baseData.lessonId || "",
        language: "english",
        type: question.type,
        questionTitle: baseData.questionTitle,
        question: baseData.questionTitle,
        questionSubtitle: baseData.questionSubtitle,
        updatedAt: Timestamp.now(),
      };

      if (specificData) {
        Object.assign(payload, specificData);
      }

      // Remove undefined values before saving
      const cleanPayload: DocumentData = Object.fromEntries(
        Object.entries(payload).filter(([, v]) => v !== undefined)
      ) as DocumentData;

      await updateDoc(doc(db, "questions", questionId), cleanPayload);
      alert("تم حفظ السؤال بنجاح");
      router.push("/admin/questions/english");
    } catch (error) {
      console.error("Error saving question:", error);
      alert("حدث خطأ أثناء الحفظ");
    } finally {
      setSaving(false);
    }
  };

  const currentForm = useMemo(() => {
    if (!question) return null;
    switch (question.type) {
      case "english_reading":
        return (
          <ReadingForm
            initialData={specificData as ReadingData}
            onChange={(data) => setSpecificData(data)}
          />
        );
      case "english_translation":
        return (
          <TranslationForm
            initialData={specificData as TranslationData}
            onChange={(data) => setSpecificData(data)}
          />
        );
      case "english_literature":
        return (
          <LiteratureForm
            initialData={specificData as EssayData}
            onChange={(data) => setSpecificData(data)}
          />
        );
      case "english_essay":
        return (
          <EssayForm
            initialData={specificData as EssayData}
            onChange={(data) => setSpecificData(data)}
          />
        );
      default:
        return (
          <ComprehensiveForm
            initialData={specificData as ComprehensiveData}
            onChange={(data) => setSpecificData(data)}
          />
        );
    }
  }, [question, specificData]);

  if (authLoading || adminLoading || loading) {
    return (
      <div className="min-h-screen bg-white dark:bg-[#121218] flex items-center justify-center" dir="rtl">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">جاري التحميل...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white dark:bg-[#121218]" dir="rtl">
      <Navbar />
      <main className="container mx-auto px-4 py-10 max-w-5xl">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="bg-white dark:bg-[#1c1c24] rounded-2xl border border-gray-200 dark:border-[#2e2e3a] p-6 sm:p-8 shadow-lg space-y-6">
          <div className="flex items-start justify-between gap-3 flex-wrap">
            <div className="flex items-start gap-3">
              <div className="p-3 rounded-xl bg-primary-100 dark:bg-primary-900/30">
                <BookOpen className="h-6 w-6 text-primary-600 dark:text-primary-300" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">محرر أسئلة الإنجليزي</h1>
                <p className="text-gray-600 dark:text-gray-400 mt-1">
                  {question ? `نوع السؤال: ${question.type}` : "لم يتم العثور على السؤال"}
                </p>
                {loadError && <p className="text-sm text-red-500 mt-1">{loadError}</p>}
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button
                onClick={handleSave}
                disabled={saving || !question}
                className="flex items-center gap-2 bg-primary-600 hover:bg-primary-700 text-white"
              >
                <Save className="h-4 w-4" />
                {saving ? "جاري الحفظ..." : "حفظ"}
              </Button>
              <Link
                href="/admin/questions/english"
                className="inline-flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100"
              >
                <ArrowLeft className="h-4 w-4" />
                العودة لأسئلة الإنجليزي
              </Link>
            </div>
          </div>

          {question ? (
            <div className="space-y-6">
              {/* Base fields */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                    العنوان الرئيسي
                  </label>
                  <Input
                    value={baseData.questionTitle}
                    onChange={(e: ChangeEvent<HTMLInputElement>) =>
                      setBaseData({ ...baseData, questionTitle: e.target.value })
                    }
                    placeholder="Title / Question"
                    dir="ltr"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                    العنوان الفرعي (اختياري)
                  </label>
                  <Input
                    value={baseData.questionSubtitle}
                    onChange={(e: ChangeEvent<HTMLInputElement>) =>
                      setBaseData({ ...baseData, questionSubtitle: e.target.value })
                    }
                    placeholder="Subtitle..."
                    dir="ltr"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                    الدرس
                  </label>
                  <select
                    value={baseData.lessonId}
                    onChange={(e) => setBaseData({ ...baseData, lessonId: e.target.value })}
                    className="w-full px-4 py-2 rounded-xl border border-gray-200 dark:border-[#2e2e3a] bg-white dark:bg-[#252530] text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-primary-500"
                  >
                    <option value="">اختر الدرس</option>
                    {englishLessons.map((lesson) => (
                      <option key={lesson.id} value={lesson.id}>
                        {lesson.title}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                    النوع
                  </label>
                  <Input value={question.type} readOnly className="bg-gray-100 dark:bg-[#252530] cursor-not-allowed" />
                </div>
              </div>

              <div className="border-t border-gray-200 dark:border-[#2e2e3a] pt-4">
                {currentForm}
              </div>
            </div>
          ) : (
            <div className="p-6 rounded-xl border border-primary-200 dark:border-primary-800/50 bg-primary-50 dark:bg-primary-900/10 flex items-start gap-3">
              <AlertTriangle className="h-5 w-5 text-primary-600 dark:text-primary-300 mt-1" />
              <div>
                <p className="text-sm text-primary-800 dark:text-primary-200 font-semibold">لم يتم العثور على السؤال.</p>
                <Link
                  href="/admin/questions/english"
                  className="mt-2 inline-flex items-center gap-2 text-sm text-primary-700 dark:text-primary-300"
                >
                  العودة لأسئلة الإنجليزي
                  <ArrowLeft className="h-4 w-4 rotate-180" />
                </Link>
              </div>
            </div>
          )}
        </motion.div>
      </main>
      <Footer />
    </div>
  );
}

