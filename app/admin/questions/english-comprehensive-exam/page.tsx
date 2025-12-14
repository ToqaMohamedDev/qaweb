"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useRouter, useSearchParams } from "next/navigation";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { useAuth } from "@/contexts/AuthContext";
import { useAdmin } from "@/hooks/useAdmin";
import {
  BookOpen,
  Plus,
  X,
  Trash2,
  Save,
  CheckCircle2,
  AlertTriangle,
  FileText,
  Languages,
  PenTool,
  BookMarked,
} from "lucide-react";
import {
  collection,
  addDoc,
  doc,
  getDoc,
  updateDoc,
  serverTimestamp,
  Timestamp,
  type DocumentData,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import { Input } from "@/components/Input";
import { Textarea } from "@/components/Textarea";
import { Button } from "@/components/Button";

// Types
type UsageScope = "exam" | "lesson";
type GradingMode = "manual" | "hybrid";

const englishLessons = [
  { id: "eng_lesson1_voc_gram_001", title: "Lesson 1 - Vocabulary and Grammar" },
  { id: "eng_lesson2_vocab_002", title: "Lesson 2 - Vocabulary" },
  { id: "eng_lesson3_reading_003", title: "Lesson 3 - Reading Comprehension" },
  { id: "eng_lesson4_translation_004", title: "Lesson 4 - Translation" },
  { id: "eng_lesson5_literature_005", title: "Lesson 5 - Literature: Great Expectations" },
  { id: "eng_lesson6_essay_006", title: "Lesson 6 - Essay Writing: Travel Destination" },
];

interface MCQ {
  id: string;
  question: string;
  options: string[];
  correctAnswer: number;
  points?: number;
}

interface ChooseTwoOutOfFive {
  id: string;
  question: string;
  options: string[];
  correctAnswers: number[]; // Array of 2 correct answer indices
  points?: number;
}

interface ReadingPassage {
  id: string;
  passage: string;
  questions: MCQ[];
}

interface TranslationQuestion {
  id: string;
  originalText: string;
  translationDirection: "en-to-ar" | "ar-to-en";
  options: string[];
  correctAnswer: number;
  points?: number;
}

interface EssayQuestion {
  id: string;
  question: string;
  modelAnswer?: string;
  points?: number;
  requiredLines?: number;
  type: "essay" | "story";
}

interface ExamSection {
  id: string;
  sectionType: "vocabulary_grammar" | "advanced_writing" | "reading" | "translation" | "essay";
  title: string;
  note?: string;
  // Vocabulary & Grammar
  vocabularyQuestions?: MCQ[];
  // Advanced Writing
  chooseTwoQuestions?: ChooseTwoOutOfFive[];
  writingMechanicsQuestions?: MCQ[];
  // Reading
  readingPassages?: ReadingPassage[];
  // Translation
  translationQuestions?: TranslationQuestion[];
  // Essay
  essayQuestions?: EssayQuestion[];
}

const sectionTypes = [
  {
    value: "vocabulary_grammar",
    label: "Vocabulary & Grammar",
    icon: BookOpen,
    description: "11 points - MCQ",
  },
  {
    value: "advanced_writing",
    label: "Advanced Writing Skills",
    icon: PenTool,
    description: "16 points - Choose 2/5 + Writing Mechanics",
  },
  {
    value: "reading",
    label: "Reading Comprehension",
    icon: BookMarked,
    description: "16 points - Two reading passages",
  },
  {
    value: "translation",
    label: "Translation",
    icon: Languages,
    description: "8 points - MCQ",
  },
  {
    value: "essay",
    label: "Essay Questions",
    icon: FileText,
    description: "9 points - Essay + Story Questions",
  },
] as const;

export default function EnglishComprehensiveExam() {
  const { user, loading: authLoading } = useAuth();
  const { isAdmin, loading: adminLoading } = useAdmin();
  const router = useRouter();
  const searchParams = useSearchParams();
  const examId = searchParams?.get("id") || null;

  const [usageScope, setUsageScope] = useState<UsageScope>("exam");
  const [selectedLesson, setSelectedLesson] = useState<string>("");
  const [examTitle, setExamTitle] = useState("");
  const [examDescription, setExamDescription] = useState("");
  const [durationMinutes, setDurationMinutes] = useState<number | "">("");
  const [passingScore, setPassingScore] = useState<number | "">("");
  const [gradingMode, setGradingMode] = useState<GradingMode>("hybrid");
  const [branchTags, setBranchTags] = useState<string[]>([]);
  const [sections, setSections] = useState<ExamSection[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState("");
  const [isLoadingExam, setIsLoadingExam] = useState(false);
  const [successNotification, setSuccessNotification] = useState<{
    isOpen: boolean;
    message: string;
  }>({
    isOpen: false,
    message: "",
  });
  
  // Optimistic updates state
  const [pendingOperations, setPendingOperations] = useState<Array<{
    type: string;
    rollback: () => void;
  }>>([]);

  useEffect(() => {
    if (authLoading || adminLoading) return;
    if (!user || !isAdmin) {
      router.push("/");
      return;
    }
  }, [user, isAdmin, authLoading, adminLoading, router]);

  useEffect(() => {
    const loadExam = async () => {
      if (!examId || !isAdmin) return;
      setIsLoadingExam(true);
      try {
        const ref = doc(db, "questions", examId);
        const snap = await getDoc(ref);
        if (snap.exists()) {
          const data = snap.data();
          if (data.type === "english_comprehensive_exam") {
            setUsageScope((data.usageScope as UsageScope) || "exam");
            setSelectedLesson(data.lessonId || "");
            setExamTitle(data.examTitle || "");
            setExamDescription(data.examDescription || "");
            setDurationMinutes(data.durationMinutes ?? "");
            setPassingScore(data.passingScore ?? "");
            setGradingMode((data.gradingMode as GradingMode) || "hybrid");
            setBranchTags((data.branchTags as string[]) || []);
            setSections(data.sections || []);
          }
        }
      } catch (error) {
        console.error("Error loading exam:", error);
        alert("An error occurred while loading the exam");
      } finally {
        setIsLoadingExam(false);
      }
    };

    if (examId && isAdmin && !authLoading && !adminLoading) {
      loadExam();
    }
  }, [examId, isAdmin, authLoading, adminLoading]);

  const addSection = (sectionType: ExamSection["sectionType"]) => {
    const sectionTypeInfo = sectionTypes.find((s) => s.value === sectionType);
    const newSection: ExamSection = {
      id: `section-${Date.now()}-${Math.random().toString(16).slice(2, 6)}`,
      sectionType,
      title: sectionTypeInfo?.label || sectionType,
      note: "",
    };

    // Initialize section-specific arrays
    if (sectionType === "vocabulary_grammar") {
      newSection.vocabularyQuestions = [];
    } else if (sectionType === "advanced_writing") {
      newSection.chooseTwoQuestions = [];
      newSection.writingMechanicsQuestions = [];
    } else if (sectionType === "reading") {
      newSection.readingPassages = [];
    } else if (sectionType === "translation") {
      newSection.translationQuestions = [];
    } else if (sectionType === "essay") {
      newSection.essayQuestions = [];
    }

    // Optimistic update: apply immediately
    const previousSections = sections;
    setSections((prev) => [...prev, newSection]);
    
    // If we have an examId, save optimistically
    if (examId) {
      const rollback = () => {
        setSections(previousSections);
        setPendingOperations((prev) => prev.filter((op) => op.type !== `add-section-${newSection.id}`));
      };
      
      setPendingOperations((prev) => [
        ...prev,
        { type: `add-section-${newSection.id}`, rollback },
      ]);
      
      // Save to Firestore in background
      saveSectionOptimistically(newSection, previousSections, rollback).catch((error) => {
        console.error("Error saving section optimistically:", error);
        rollback();
        setSubmitError("Failed to save section. Please try again.");
      });
    }
  };
  
  // Helper function for optimistic save
  const saveSectionOptimistically = async (
    newSection: ExamSection,
    previousSections: ExamSection[],
    rollback: () => void
  ) => {
    if (!examId || !user?.uid) return;
    
    try {
      const currentSections = [...previousSections, newSection];
      await updateDoc(doc(db, "questions", examId), {
        sections: currentSections.map((s) => ({
          ...s,
          note: s.note?.trim() || "",
        })),
        updatedAt: serverTimestamp(),
      });
      
      // Remove from pending operations on success
      setPendingOperations((prev) => prev.filter((op) => op.type !== `add-section-${newSection.id}`));
    } catch (error) {
      throw error;
    }
  };

  const updateSection = (id: string, updater: (s: ExamSection) => ExamSection) => {
    // Optimistic update: apply immediately
    const previousSections = sections;
    const previousSection = previousSections.find((s) => s.id === id);
    
    setSections((prev) => prev.map((s) => (s.id === id ? updater(s) : s)));
    
    // If we have an examId, save optimistically
    if (examId && previousSection) {
      const rollback = () => {
        setSections(previousSections);
        setPendingOperations((prev) => prev.filter((op) => op.type !== `update-section-${id}`));
      };
      
      setPendingOperations((prev) => [
        ...prev.filter((op) => op.type !== `update-section-${id}`),
        { type: `update-section-${id}`, rollback },
      ]);
      
      // Save to Firestore in background
      const updatedSection = updater(previousSection);
      saveSectionUpdateOptimistically(id, updatedSection, previousSections, rollback).catch((error) => {
        console.error("Error updating section optimistically:", error);
        rollback();
        setSubmitError("Failed to update section. Please try again.");
      });
    }
  };
  
  // Helper function for optimistic section update
  const saveSectionUpdateOptimistically = async (
    sectionId: string,
    updatedSection: ExamSection,
    previousSections: ExamSection[],
    rollback: () => void
  ) => {
    if (!examId || !user?.uid) return;
    
    try {
      const currentSections = previousSections.map((s) => (s.id === sectionId ? updatedSection : s));
      await updateDoc(doc(db, "questions", examId), {
        sections: currentSections.map((s) => ({
          ...s,
          note: s.note?.trim() || "",
        })),
        updatedAt: serverTimestamp(),
      });
      
      // Remove from pending operations on success
      setPendingOperations((prev) => prev.filter((op) => op.type !== `update-section-${sectionId}`));
    } catch (error) {
      throw error;
    }
  };

  const removeSection = (id: string) => {
    // Optimistic update: apply immediately
    const previousSections = sections;
    const sectionToRemove = previousSections.find((s) => s.id === id);
    
    setSections((prev) => prev.filter((s) => s.id !== id));
    
    // If we have an examId, save optimistically
    if (examId && sectionToRemove) {
      const rollback = () => {
        setSections(previousSections);
        setPendingOperations((prev) => prev.filter((op) => op.type !== `remove-section-${id}`));
      };
      
      setPendingOperations((prev) => [
        ...prev,
        { type: `remove-section-${id}`, rollback },
      ]);
      
      // Save to Firestore in background
      saveSectionRemovalOptimistically(id, previousSections, rollback).catch((error) => {
        console.error("Error removing section optimistically:", error);
        rollback();
        setSubmitError("Failed to remove section. Please try again.");
      });
    }
  };
  
  // Helper function for optimistic section removal
  const saveSectionRemovalOptimistically = async (
    sectionId: string,
    previousSections: ExamSection[],
    rollback: () => void
  ) => {
    if (!examId || !user?.uid) return;
    
    try {
      const currentSections = previousSections.filter((s) => s.id !== sectionId);
      await updateDoc(doc(db, "questions", examId), {
        sections: currentSections.map((s) => ({
          ...s,
          note: s.note?.trim() || "",
        })),
        updatedAt: serverTimestamp(),
      });
      
      // Remove from pending operations on success
      setPendingOperations((prev) => prev.filter((op) => op.type !== `remove-section-${sectionId}`));
    } catch (error) {
      throw error;
    }
  };

  // Vocabulary & Grammar helpers
  const addVocabularyQuestion = (sectionId: string) => {
    // Optimistic update is handled by updateSection
    updateSection(sectionId, (s) => ({
      ...s,
      vocabularyQuestions: [
        ...(s.vocabularyQuestions || []),
        {
          id: `mcq-${Date.now()}`,
          question: "",
          options: ["", "", "", ""],
          correctAnswer: 0,
          points: 1,
        },
      ],
    }));
  };

  const updateVocabularyQuestion = (
    sectionId: string,
    questionId: string,
    updater: (q: MCQ) => MCQ
  ) => {
    updateSection(sectionId, (s) => ({
      ...s,
      vocabularyQuestions: (s.vocabularyQuestions || []).map((q) =>
        q.id === questionId ? updater(q) : q
      ),
    }));
  };

  const removeVocabularyQuestion = (sectionId: string, questionId: string) => {
    updateSection(sectionId, (s) => ({
      ...s,
      vocabularyQuestions: (s.vocabularyQuestions || []).filter((q) => q.id !== questionId),
    }));
  };

  // Choose 2 out of 5 helpers
  const addChooseTwoQuestion = (sectionId: string) => {
    updateSection(sectionId, (s) => ({
      ...s,
      chooseTwoQuestions: [
        ...(s.chooseTwoQuestions || []),
        {
          id: `choose2-${Date.now()}`,
          question: "",
          options: ["", "", "", "", ""],
          correctAnswers: [0, 1],
          points: 2,
        },
      ],
    }));
  };

  const updateChooseTwoQuestion = (
    sectionId: string,
    questionId: string,
    updater: (q: ChooseTwoOutOfFive) => ChooseTwoOutOfFive
  ) => {
    updateSection(sectionId, (s) => ({
      ...s,
      chooseTwoQuestions: (s.chooseTwoQuestions || []).map((q) =>
        q.id === questionId ? updater(q) : q
      ),
    }));
  };

  const removeChooseTwoQuestion = (sectionId: string, questionId: string) => {
    updateSection(sectionId, (s) => ({
      ...s,
      chooseTwoQuestions: (s.chooseTwoQuestions || []).filter((q) => q.id !== questionId),
    }));
  };

  // Reading Passage helpers
  const addReadingPassage = (sectionId: string) => {
    updateSection(sectionId, (s) => ({
      ...s,
      readingPassages: [
        ...(s.readingPassages || []),
        {
          id: `passage-${Date.now()}`,
          passage: "",
          questions: [],
        },
      ],
    }));
  };

  const addQuestionToPassage = (sectionId: string, passageId: string) => {
    updateSection(sectionId, (s) => ({
      ...s,
      readingPassages: (s.readingPassages || []).map((p) =>
        p.id === passageId
          ? {
              ...p,
              questions: [
                ...p.questions,
                {
                  id: `mcq-${Date.now()}`,
                  question: "",
                  options: ["", "", "", ""],
                  correctAnswer: 0,
                  points: 1,
                },
              ],
            }
          : p
      ),
    }));
  };

  const updatePassageQuestion = (
    sectionId: string,
    passageId: string,
    questionId: string,
    updater: (q: MCQ) => MCQ
  ) => {
    updateSection(sectionId, (s) => ({
      ...s,
      readingPassages: (s.readingPassages || []).map((p) =>
        p.id === passageId
          ? {
              ...p,
              questions: p.questions.map((q) => (q.id === questionId ? updater(q) : q)),
            }
          : p
      ),
    }));
  };

  const removePassage = (sectionId: string, passageId: string) => {
    updateSection(sectionId, (s) => ({
      ...s,
      readingPassages: (s.readingPassages || []).filter((p) => p.id !== passageId),
    }));
  };

  const removePassageQuestion = (sectionId: string, passageId: string, questionId: string) => {
    updateSection(sectionId, (s) => ({
      ...s,
      readingPassages: (s.readingPassages || []).map((p) =>
        p.id === passageId
          ? {
              ...p,
              questions: p.questions.filter((q) => q.id !== questionId),
            }
          : p
      ),
    }));
  };

  // Translation helpers
  const addTranslationQuestion = (sectionId: string) => {
    updateSection(sectionId, (s) => ({
      ...s,
      translationQuestions: [
        ...(s.translationQuestions || []),
        {
          id: `trans-${Date.now()}`,
          originalText: "",
          translationDirection: "en-to-ar",
          options: ["", "", "", ""],
          correctAnswer: 0,
          points: 1,
        },
      ],
    }));
  };

  const updateTranslationQuestion = (
    sectionId: string,
    questionId: string,
    updater: (q: TranslationQuestion) => TranslationQuestion
  ) => {
    updateSection(sectionId, (s) => ({
      ...s,
      translationQuestions: (s.translationQuestions || []).map((q) =>
        q.id === questionId ? updater(q) : q
      ),
    }));
  };

  const removeTranslationQuestion = (sectionId: string, questionId: string) => {
    updateSection(sectionId, (s) => ({
      ...s,
      translationQuestions: (s.translationQuestions || []).filter((q) => q.id !== questionId),
    }));
  };

  // Essay helpers
  const addEssayQuestion = (sectionId: string, type: "essay" | "story") => {
    updateSection(sectionId, (s) => ({
      ...s,
      essayQuestions: [
        ...(s.essayQuestions || []),
        {
          id: `essay-${Date.now()}`,
          question: "",
          modelAnswer: "",
          points: type === "essay" ? 5 : 2,
          type,
          requiredLines: type === "essay" ? 6 : undefined,
        },
      ],
    }));
  };

  const updateEssayQuestion = (
    sectionId: string,
    questionId: string,
    updater: (q: EssayQuestion) => EssayQuestion
  ) => {
    updateSection(sectionId, (s) => ({
      ...s,
      essayQuestions: (s.essayQuestions || []).map((q) =>
        q.id === questionId ? updater(q) : q
      ),
    }));
  };

  const removeEssayQuestion = (sectionId: string, questionId: string) => {
    updateSection(sectionId, (s) => ({
      ...s,
      essayQuestions: (s.essayQuestions || []).filter((q) => q.id !== questionId),
    }));
  };

  // Writing Mechanics helpers
  const addWritingMechanicsQuestion = (sectionId: string) => {
    updateSection(sectionId, (s) => ({
      ...s,
      writingMechanicsQuestions: [
        ...(s.writingMechanicsQuestions || []),
        {
          id: `writing-${Date.now()}`,
          question: "",
          options: ["", "", "", ""],
          correctAnswer: 0,
          points: 1,
        },
      ],
    }));
  };

  const updateWritingMechanicsQuestion = (
    sectionId: string,
    questionId: string,
    updater: (q: MCQ) => MCQ
  ) => {
    updateSection(sectionId, (s) => ({
      ...s,
      writingMechanicsQuestions: (s.writingMechanicsQuestions || []).map((q) =>
        q.id === questionId ? updater(q) : q
      ),
    }));
  };

  const removeWritingMechanicsQuestion = (sectionId: string, questionId: string) => {
    updateSection(sectionId, (s) => ({
      ...s,
      writingMechanicsQuestions: (s.writingMechanicsQuestions || []).filter(
        (q) => q.id !== questionId
      ),
    }));
  };

  const validate = () => {
    if (usageScope === "lesson" && !selectedLesson) {
      setSubmitError("Please select a lesson for lesson template");
      return false;
    }
    if (!examTitle.trim()) {
      setSubmitError("Please enter exam title");
      return false;
    }
    if (!sections.length) {
      setSubmitError("Please add at least one section");
      return false;
    }
    setSubmitError("");
    return true;
  };

  const handleSubmit = async () => {
    if (!validate()) return;
    
    // Rollback any pending optimistic operations before final submit
    if (pendingOperations.length > 0) {
      // Wait for pending operations to complete or rollback
      const pendingPromises = pendingOperations.map((op) => {
        // Try to wait a bit for operations to complete
        return new Promise<void>((resolve) => {
          setTimeout(() => {
            // If still pending, rollback
            if (pendingOperations.some((p) => p.type === op.type)) {
              op.rollback();
            }
            resolve();
          }, 500);
        });
      });
      
      await Promise.all(pendingPromises);
    }
    
    setIsSubmitting(true);
    setSuccessNotification({ isOpen: false, message: "" });
    try {
      const payload: DocumentData = {
        type: "english_comprehensive_exam",
        language: "english",
        usageScope,
        examTitle: examTitle.trim(),
        examDescription: examDescription.trim(),
        durationMinutes: durationMinutes === "" ? null : Number(durationMinutes),
        passingScore: passingScore === "" ? null : Number(passingScore),
        gradingMode,
        branchTags,
        sections: sections.map((s) => ({
          ...s,
          note: s.note?.trim() || "",
        })),
        createdBy: user?.uid,
      };

      // Only include lessonId if usageScope is "lesson" and selectedLesson is set
      if (usageScope === "lesson" && selectedLesson) {
        payload.lessonId = selectedLesson;
      }

      // Remove undefined values
      const cleanPayload: DocumentData = Object.fromEntries(
        Object.entries(payload).filter(([, v]) => v !== undefined)
      ) as DocumentData;

      if (examId) {
        await updateDoc(doc(db, "questions", examId), cleanPayload);
        setSuccessNotification({ isOpen: true, message: "Exam updated successfully" });
      } else {
        await addDoc(collection(db, "questions"), {
          ...cleanPayload,
          createdAt: serverTimestamp() as Timestamp,
        });
        setSuccessNotification({ isOpen: true, message: "Exam created successfully" });
        setExamTitle("");
        setExamDescription("");
        setDurationMinutes("");
        setPassingScore("");
        setSections([]);
      }

      setTimeout(() => {
        setSuccessNotification({ isOpen: false, message: "" });
        router.push("/admin/questions");
      }, 1400);
    } catch (error) {
      console.error("Error saving exam:", error);
      setSubmitError("An error occurred while saving the exam");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (authLoading || adminLoading || isLoadingExam) {
    return (
      <div className="min-h-screen bg-white dark:bg-[#121218] flex items-center justify-center" dir="ltr">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">
            {isLoadingExam ? "Loading exam..." : "Checking permissions..."}
          </p>
        </div>
      </div>
    );
  }

  if (!user || !isAdmin) return null;

  return (
    <div className="min-h-screen bg-white dark:bg-[#121218]" dir="ltr">
      <Navbar />
      <main className="container mx-auto px-4 py-8 max-w-7xl">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-xl bg-primary-50 dark:bg-primary-900/20 border border-primary-200 dark:border-primary-800/50">
                <BookOpen className="h-6 w-6 text-primary-600 dark:text-primary-400" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">
                  {examId ? "Edit Comprehensive English Exam / Lesson Template" : "Create Comprehensive English Exam / Lesson Template"}
                </h1>
                <p className="text-gray-600 dark:text-gray-400 mt-1">
                  Comprehensive template for English exam or single lesson with all question types.
                </p>
              </div>
            </div>
            <Button onClick={() => router.push("/admin/questions")} variant="outline" className="flex items-center gap-2">
              <X className="h-4 w-4" />
              Cancel
            </Button>
          </div>

          {/* Exam Info */}
          <div className="bg-white dark:bg-[#1c1c24] rounded-2xl shadow-lg border border-gray-200 dark:border-[#2e2e3a] p-6 space-y-4">
            <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100">Exam Information</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1">
                  Usage Scope
                </label>
                <select
                  value={usageScope}
                  onChange={(e) => setUsageScope(e.target.value as UsageScope)}
                  className="w-full rounded-lg border border-gray-200 dark:border-[#2e2e3a] bg-white dark:bg-[#1c1c24] px-3 py-2 text-sm"
                >
                  <option value="exam">Comprehensive Exam</option>
                  <option value="lesson">Lesson Template</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1">
                  Exam Title
                </label>
                <Input
                  value={examTitle}
                  onChange={(e) => setExamTitle(e.target.value)}
                  placeholder="e.g., English Exam - First Semester"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1">
                    Duration (minutes)
                  </label>
                  <Input
                    type="number"
                    min={0}
                    value={durationMinutes === "" ? "" : String(durationMinutes)}
                    onChange={(e) => setDurationMinutes(e.target.value === "" ? "" : Number(e.target.value))}
                    placeholder="Optional"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1">
                    Passing Score
                  </label>
                  <Input
                    type="number"
                    min={0}
                    value={passingScore === "" ? "" : String(passingScore)}
                    onChange={(e) => setPassingScore(e.target.value === "" ? "" : Number(e.target.value))}
                    placeholder="Optional"
                  />
                </div>
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1">
                  Description
                </label>
                <Textarea
                  rows={3}
                  value={examDescription}
                  onChange={(e) => setExamDescription(e.target.value)}
                  placeholder="Instructions or exam description..."
                />
              </div>
              <div className="space-y-2">
                {usageScope === "lesson" && (
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1">
                      Lesson
                    </label>
                    <select
                      value={selectedLesson}
                      onChange={(e) => setSelectedLesson(e.target.value)}
                      className="w-full rounded-lg border border-gray-200 dark:border-[#2e2e3a] bg-white dark:bg-[#1c1c24] px-3 py-2 text-sm"
                    >
                      <option value="">Select lesson</option>
                      {englishLessons.map((l) => (
                        <option key={l.id} value={l.id}>
                          {l.title}
                        </option>
                      ))}
                    </select>
                  </div>
                )}
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1">
                  Grading Mode
                </label>
                <select
                  value={gradingMode}
                  onChange={(e) => setGradingMode(e.target.value as GradingMode)}
                  className="w-full rounded-lg border border-gray-200 dark:border-[#2e2e3a] bg-white dark:bg-[#1c1c24] px-3 py-2 text-sm"
                >
                  <option value="manual">Manual</option>
                  <option value="hybrid">Hybrid</option>
                </select>
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1">
                  Branches
                </label>
                <div className="flex flex-wrap gap-2">
                  {(["Naho", "Adab", "Balagha", "Qiraa", "Qesaa", "Taraaib", "TafkirNaqdi"] as const).map((b) => {
                    const active = branchTags.includes(b);
                    return (
                      <button
                        key={b}
                        onClick={() =>
                          setBranchTags((prev) => (active ? prev.filter((x) => x !== b) : [...prev, b]))
                        }
                        className={`px-3 py-1.5 rounded-full border text-sm ${
                          active
                            ? "bg-primary-100 border-primary-300 text-primary-700"
                            : "bg-gray-50 border-gray-200 text-gray-700"
                        }`}
                      >
                        {b}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>

          {/* Add Section Buttons */}
          <div className="bg-white dark:bg-[#1c1c24] rounded-2xl shadow-lg border border-gray-200 dark:border-[#2e2e3a] p-6">
            <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-4">Add Sections</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {sectionTypes.map((sectionType) => {
                const Icon = sectionType.icon;
                return (
                  <button
                    key={sectionType.value}
                    onClick={() => addSection(sectionType.value as ExamSection["sectionType"])}
                    className="flex items-center gap-3 p-4 rounded-xl border border-gray-200 dark:border-[#2e2e3a] hover:bg-gray-50 dark:hover:bg-[#252530] transition-colors text-left"
                  >
                    <Icon className="h-5 w-5 text-primary-600 dark:text-primary-400 flex-shrink-0" />
                    <div className="flex-1">
                      <div className="font-semibold text-gray-900 dark:text-gray-100 text-sm">
                        {sectionType.label}
                      </div>
                      <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                        {sectionType.description}
                      </div>
                    </div>
                    <Plus className="h-4 w-4 text-gray-400" />
                  </button>
                );
              })}
            </div>
          </div>

          {/* Sections */}
          <div className="space-y-4">
            {sections.map((section) => {
              const sectionTypeInfo = sectionTypes.find((s) => s.value === section.sectionType);
              const Icon = sectionTypeInfo?.icon || BookOpen;

              return (
                <motion.div
                  key={section.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-white dark:bg-[#1c1c24] rounded-2xl shadow-lg border border-gray-200 dark:border-[#2e2e3a] p-6 space-y-4"
                >
                  {/* Section Header */}
                  <div className="flex items-center justify-between pb-4 border-b border-gray-200 dark:border-[#2e2e3a]">
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-lg bg-primary-100 dark:bg-primary-900/30">
                        <Icon className="h-5 w-5 text-primary-600 dark:text-primary-400" />
                      </div>
                      <div>
                        <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100">
                          {section.title}
                        </h3>
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                          {sectionTypeInfo?.description}
                        </p>
                      </div>
                    </div>
                    <button
                      onClick={() => removeSection(section.id)}
                      className="p-2 rounded-lg border border-red-200 dark:border-red-900/40 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>

                  {/* Section Title Input */}
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1">
                      Section Title
                    </label>
                    <Input
                      value={section.title}
                      onChange={(e) => updateSection(section.id, (s) => ({ ...s, title: e.target.value }))}
                      placeholder="Section title"
                    />
                  </div>

                  {/* Section Note */}
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1">
                      Notes (Optional)
                    </label>
                    <Textarea
                      rows={2}
                      value={section.note || ""}
                      onChange={(e) => updateSection(section.id, (s) => ({ ...s, note: e.target.value }))}
                      placeholder="Notes for examiner..."
                    />
                  </div>

                  {/* Vocabulary & Grammar Section */}
                  {section.sectionType === "vocabulary_grammar" && (
                    <div className="space-y-4 pt-4 border-t border-gray-200 dark:border-[#2e2e3a]">
                      <div className="flex items-center justify-between">
                        <h4 className="font-semibold text-gray-900 dark:text-gray-100">
                          Vocabulary & Grammar Questions
                        </h4>
                        <Button
                          onClick={() => addVocabularyQuestion(section.id)}
                          variant="outline"
                          className="flex items-center gap-2 px-3 py-2 text-sm"
                        >
                          <Plus className="h-4 w-4" />
                          Add Question
                        </Button>
                      </div>
                      {section.vocabularyQuestions?.map((q, qIndex) => (
                        <div
                          key={q.id}
                          className="p-4 rounded-lg border border-gray-200 dark:border-[#2e2e3a] bg-gray-50 dark:bg-[#252530] space-y-3"
                        >
                          <div className="flex items-center justify-between">
                            <span className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                              Question {qIndex + 1}
                            </span>
                            <button
                              onClick={() => removeVocabularyQuestion(section.id, q.id)}
                              className="text-red-600 dark:text-red-400 hover:text-red-700"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </div>
                          <Textarea
                            value={q.question}
                            onChange={(e) =>
                              updateVocabularyQuestion(section.id, q.id, (q) => ({
                                ...q,
                                question: e.target.value,
                              }))
                            }
                            placeholder="Question text..."
                            rows={2}
                            dir="ltr"
                          />
                          <div className="grid grid-cols-2 gap-2">
                            {q.options.map((opt, optIndex) => (
                              <div key={optIndex} className="flex items-center gap-2">
                                <span className="text-sm font-medium text-gray-600 dark:text-gray-400 w-6">
                                  {String.fromCharCode(65 + optIndex)}.
                                </span>
                                <Input
                                  value={opt}
                                  onChange={(e) =>
                                    updateVocabularyQuestion(section.id, q.id, (q) => {
                                      const newOptions = [...q.options];
                                      newOptions[optIndex] = e.target.value;
                                      return { ...q, options: newOptions };
                                    })
                                  }
                                  placeholder={`Option ${String.fromCharCode(65 + optIndex)}`}
                                  dir="ltr"
                                />
                                <input
                                  type="radio"
                                  name={`vocab-${q.id}`}
                                  checked={q.correctAnswer === optIndex}
                                  onChange={() =>
                                    updateVocabularyQuestion(section.id, q.id, (q) => ({
                                      ...q,
                                      correctAnswer: optIndex,
                                    }))
                                  }
                                  className="w-4 h-4 text-primary-600"
                                />
                              </div>
                            ))}
                          </div>
                          <div className="flex items-center gap-2">
                            <label className="text-sm text-gray-600 dark:text-gray-400">Points:</label>
                            <Input
                              type="number"
                              min={0}
                              value={q.points || 1}
                              onChange={(e) =>
                                updateVocabularyQuestion(section.id, q.id, (q) => ({
                                  ...q,
                                  points: Number(e.target.value) || 1,
                                }))
                              }
                              className="w-20"
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Advanced Writing Section */}
                  {section.sectionType === "advanced_writing" && (
                    <div className="space-y-6 pt-4 border-t border-gray-200 dark:border-[#2e2e3a]">
                      {/* Choose 2 out of 5 */}
                      <div className="space-y-4">
                        <div className="flex items-center justify-between">
                          <h4 className="font-semibold text-gray-900 dark:text-gray-100">
                            Choose 2 out of 5 Questions (2 points each)
                          </h4>
                          <Button
                            onClick={() => addChooseTwoQuestion(section.id)}
                            variant="outline"
                            className="flex items-center gap-2 px-3 py-2 text-sm"
                          >
                            <Plus className="h-4 w-4" />
                            Add Question
                          </Button>
                        </div>
                        {section.chooseTwoQuestions?.map((q, qIndex) => (
                          <div
                            key={q.id}
                            className="p-4 rounded-lg border border-gray-200 dark:border-[#2e2e3a] bg-gray-50 dark:bg-[#252530] space-y-3"
                          >
                            <div className="flex items-center justify-between">
                              <span className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                                Question {qIndex + 1} (Select exactly 2 correct answers)
                              </span>
                              <button
                                onClick={() => removeChooseTwoQuestion(section.id, q.id)}
                                className="text-red-600 dark:text-red-400 hover:text-red-700"
                              >
                                <Trash2 className="h-4 w-4" />
                              </button>
                            </div>
                            <Textarea
                              value={q.question}
                              onChange={(e) =>
                                updateChooseTwoQuestion(section.id, q.id, (q) => ({
                                  ...q,
                                  question: e.target.value,
                                }))
                              }
                              placeholder="Question text..."
                              rows={2}
                              dir="ltr"
                            />
                            <div className="space-y-2">
                              {q.options.map((opt, optIndex) => (
                                <div key={optIndex} className="flex items-center gap-2">
                                  <span className="text-sm font-medium text-gray-600 dark:text-gray-400 w-6">
                                    {String.fromCharCode(65 + optIndex)}.
                                  </span>
                                  <Input
                                    value={opt}
                                    onChange={(e) =>
                                      updateChooseTwoQuestion(section.id, q.id, (q) => {
                                        const newOptions = [...q.options];
                                        newOptions[optIndex] = e.target.value;
                                        return { ...q, options: newOptions };
                                      })
                                    }
                                    placeholder={`Option ${String.fromCharCode(65 + optIndex)}`}
                                    dir="ltr"
                                    className="flex-1"
                                  />
                                  <input
                                    type="checkbox"
                                    checked={q.correctAnswers.includes(optIndex)}
                                    onChange={(e) =>
                                      updateChooseTwoQuestion(section.id, q.id, (q) => {
                                        let newAnswers = [...q.correctAnswers];
                                        if (e.target.checked) {
                                          if (newAnswers.length < 2) {
                                            newAnswers.push(optIndex);
                                          }
                                        } else {
                                          newAnswers = newAnswers.filter((a) => a !== optIndex);
                                        }
                                        return { ...q, correctAnswers: newAnswers };
                                      })
                                    }
                                    className="w-4 h-4 text-primary-600"
                                  />
                                </div>
                              ))}
                            </div>
                            <div className="text-xs text-gray-500 dark:text-gray-400">
                              Must select exactly 2 correct answers
                            </div>
                          </div>
                        ))}
                      </div>

                      {/* Writing Mechanics */}
                      <div className="space-y-4 pt-4 border-t border-gray-200 dark:border-[#2e2e3a]">
                        <div className="flex items-center justify-between">
                          <h4 className="font-semibold text-gray-900 dark:text-gray-100">
                            Writing Mechanics Questions
                          </h4>
                          <Button
                            onClick={() => addWritingMechanicsQuestion(section.id)}
                            variant="outline"
                            className="flex items-center gap-2 px-3 py-2 text-sm"
                          >
                            <Plus className="h-4 w-4" />
                            Add Question
                          </Button>
                        </div>
                        {section.writingMechanicsQuestions?.map((q, qIndex) => (
                          <div
                            key={q.id}
                            className="p-4 rounded-lg border border-gray-200 dark:border-[#2e2e3a] bg-gray-50 dark:bg-[#252530] space-y-3"
                          >
                            <div className="flex items-center justify-between">
                              <span className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                                Question {qIndex + 1}
                              </span>
                              <button
                                onClick={() => removeWritingMechanicsQuestion(section.id, q.id)}
                                className="text-red-600 dark:text-red-400 hover:text-red-700"
                              >
                                <Trash2 className="h-4 w-4" />
                              </button>
                            </div>
                            <Textarea
                              value={q.question}
                              onChange={(e) =>
                                updateWritingMechanicsQuestion(section.id, q.id, (q) => ({
                                  ...q,
                                  question: e.target.value,
                                }))
                              }
                              placeholder="Question text..."
                              rows={2}
                              dir="ltr"
                            />
                            <div className="grid grid-cols-2 gap-2">
                              {q.options.map((opt, optIndex) => (
                                <div key={optIndex} className="flex items-center gap-2">
                                  <span className="text-sm font-medium text-gray-600 dark:text-gray-400 w-6">
                                    {String.fromCharCode(65 + optIndex)}.
                                  </span>
                                  <Input
                                    value={opt}
                                    onChange={(e) =>
                                      updateWritingMechanicsQuestion(section.id, q.id, (q) => {
                                        const newOptions = [...q.options];
                                        newOptions[optIndex] = e.target.value;
                                        return { ...q, options: newOptions };
                                      })
                                    }
                                    placeholder={`Option ${String.fromCharCode(65 + optIndex)}`}
                                    dir="ltr"
                                  />
                                  <input
                                    type="radio"
                                    name={`writing-${q.id}`}
                                    checked={q.correctAnswer === optIndex}
                                    onChange={() =>
                                      updateWritingMechanicsQuestion(section.id, q.id, (q) => ({
                                        ...q,
                                        correctAnswer: optIndex,
                                      }))
                                    }
                                    className="w-4 h-4 text-primary-600"
                                  />
                                </div>
                              ))}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Reading Section */}
                  {section.sectionType === "reading" && (
                    <div className="space-y-4 pt-4 border-t border-gray-200 dark:border-[#2e2e3a]">
                      <div className="flex items-center justify-between">
                        <h4 className="font-semibold text-gray-900 dark:text-gray-100">Reading Passages</h4>
                        <Button
                          onClick={() => addReadingPassage(section.id)}
                          variant="outline"
                          className="flex items-center gap-2 px-3 py-2 text-sm"
                        >
                          <Plus className="h-4 w-4" />
                          Add Passage
                        </Button>
                      </div>
                      {section.readingPassages?.map((passage, pIndex) => (
                        <div
                          key={passage.id}
                          className="p-4 rounded-lg border border-gray-200 dark:border-[#2e2e3a] bg-gray-50 dark:bg-[#252530] space-y-4"
                        >
                          <div className="flex items-center justify-between">
                            <span className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                              Passage {pIndex + 1}
                            </span>
                            <button
                              onClick={() => removePassage(section.id, passage.id)}
                              className="text-red-600 dark:text-red-400 hover:text-red-700"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </div>
                          <div>
                            <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1">
                              Passage Text
                            </label>
                            <Textarea
                              value={passage.passage}
                              onChange={(e) =>
                                updateSection(section.id, (s) => ({
                                  ...s,
                                  readingPassages: (s.readingPassages || []).map((p) =>
                                    p.id === passage.id ? { ...p, passage: e.target.value } : p
                                  ),
                                }))
                              }
                              placeholder="Passage text..."
                              rows={6}
                              dir="ltr"
                            />
                          </div>
                          <div className="space-y-3 pt-3 border-t border-gray-200 dark:border-[#2e2e3a]">
                            <div className="flex items-center justify-between">
                              <h5 className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                                Passage Questions
                              </h5>
                              <Button
                                onClick={() => addQuestionToPassage(section.id, passage.id)}
                                variant="outline"
                                className="flex items-center gap-1 text-xs px-3 py-2"
                              >
                                <Plus className="h-3 w-3" />
                                Add Question
                              </Button>
                            </div>
                            {passage.questions.map((q, qIndex) => (
                              <div
                                key={q.id}
                                className="p-3 rounded-lg border border-gray-200 dark:border-[#2e2e3a] bg-white dark:bg-[#1c1c24] space-y-2"
                              >
                                <div className="flex items-center justify-between">
                                  <span className="text-xs font-medium text-gray-600 dark:text-gray-400">
                                    Question {qIndex + 1}
                                  </span>
                                  <button
                                    onClick={() => removePassageQuestion(section.id, passage.id, q.id)}
                                    className="text-red-600 dark:text-red-400"
                                  >
                                    <X className="h-3 w-3" />
                                  </button>
                                </div>
                                <Textarea
                                  value={q.question}
                                  onChange={(e) =>
                                    updatePassageQuestion(section.id, passage.id, q.id, (q) => ({
                                      ...q,
                                      question: e.target.value,
                                    }))
                                  }
                                  placeholder="Question text..."
                                  rows={2}
                                  dir="ltr"
                                  className="text-sm"
                                />
                                <div className="grid grid-cols-2 gap-2">
                                  {q.options.map((opt, optIndex) => (
                                    <div key={optIndex} className="flex items-center gap-1">
                                      <span className="text-xs font-medium text-gray-500 w-4">
                                        {String.fromCharCode(65 + optIndex)}.
                                      </span>
                                      <Input
                                        value={opt}
                                        onChange={(e) =>
                                          updatePassageQuestion(section.id, passage.id, q.id, (q) => {
                                            const newOptions = [...q.options];
                                            newOptions[optIndex] = e.target.value;
                                            return { ...q, options: newOptions };
                                          })
                                        }
                                        placeholder={`Option ${String.fromCharCode(65 + optIndex)}`}
                                        dir="ltr"
                                        className="text-sm"
                                      />
                                      <input
                                        type="radio"
                                        name={`passage-${passage.id}-${q.id}`}
                                        checked={q.correctAnswer === optIndex}
                                        onChange={() =>
                                          updatePassageQuestion(section.id, passage.id, q.id, (q) => ({
                                            ...q,
                                            correctAnswer: optIndex,
                                          }))
                                        }
                                        className="w-3 h-3 text-primary-600"
                                      />
                                    </div>
                                  ))}
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Translation Section */}
                  {section.sectionType === "translation" && (
                    <div className="space-y-4 pt-4 border-t border-gray-200 dark:border-[#2e2e3a]">
                      <div className="flex items-center justify-between">
                        <h4 className="font-semibold text-gray-900 dark:text-gray-100">Translation Questions</h4>
                        <Button
                          onClick={() => addTranslationQuestion(section.id)}
                          variant="outline"
                          className="flex items-center gap-2 px-3 py-2 text-sm"
                        >
                          <Plus className="h-4 w-4" />
                          Add Question
                        </Button>
                      </div>
                      {section.translationQuestions?.map((q, qIndex) => (
                        <div
                          key={q.id}
                          className="p-4 rounded-lg border border-gray-200 dark:border-[#2e2e3a] bg-gray-50 dark:bg-[#252530] space-y-3"
                        >
                          <div className="flex items-center justify-between">
                            <span className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                              Question {qIndex + 1}
                            </span>
                            <button
                              onClick={() => removeTranslationQuestion(section.id, q.id)}
                              className="text-red-600 dark:text-red-400 hover:text-red-700"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </div>
                          <div>
                            <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1">
                              Translation Direction
                            </label>
                            <select
                              value={q.translationDirection}
                              onChange={(e) =>
                                updateTranslationQuestion(section.id, q.id, (q) => ({
                                  ...q,
                                  translationDirection: e.target.value as "en-to-ar" | "ar-to-en",
                                }))
                              }
                              className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-[#2e2e3a] bg-white dark:bg-[#1c1c24] text-gray-900 dark:text-gray-100"
                            >
                              <option value="en-to-ar">English → Arabic</option>
                              <option value="ar-to-en">Arabic → English</option>
                            </select>
                          </div>
                          <div>
                            <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1">
                              Original Text
                            </label>
                            <Textarea
                              value={q.originalText}
                              onChange={(e) =>
                                updateTranslationQuestion(section.id, q.id, (q) => ({
                                  ...q,
                                  originalText: e.target.value,
                                }))
                              }
                              placeholder="Text to translate..."
                              rows={2}
                              dir={q.translationDirection === "en-to-ar" ? "ltr" : "rtl"}
                            />
                          </div>
                          <div className="grid grid-cols-2 gap-2">
                            {q.options.map((opt, optIndex) => (
                              <div key={optIndex} className="flex items-center gap-2">
                                <span className="text-sm font-medium text-gray-600 dark:text-gray-400 w-6">
                                  {String.fromCharCode(65 + optIndex)}.
                                </span>
                                <Input
                                  value={opt}
                                  onChange={(e) =>
                                    updateTranslationQuestion(section.id, q.id, (q) => {
                                      const newOptions = [...q.options];
                                      newOptions[optIndex] = e.target.value;
                                      return { ...q, options: newOptions };
                                    })
                                  }
                                  placeholder={`Option ${String.fromCharCode(65 + optIndex)}`}
                                  dir={q.translationDirection === "en-to-ar" ? "rtl" : "ltr"}
                                />
                                <input
                                  type="radio"
                                  name={`trans-${q.id}`}
                                  checked={q.correctAnswer === optIndex}
                                  onChange={() =>
                                    updateTranslationQuestion(section.id, q.id, (q) => ({
                                      ...q,
                                      correctAnswer: optIndex,
                                    }))
                                  }
                                  className="w-4 h-4 text-primary-600"
                                />
                              </div>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Essay Section */}
                  {section.sectionType === "essay" && (
                    <div className="space-y-4 pt-4 border-t border-gray-200 dark:border-[#2e2e3a]">
                      <div className="flex items-center gap-2">
                        <Button
                          onClick={() => addEssayQuestion(section.id, "essay")}
                          variant="outline"
                          className="flex items-center gap-2 px-3 py-2 text-sm"
                        >
                          <Plus className="h-4 w-4" />
                          Add Essay Question (5 points)
                        </Button>
                        <Button
                          onClick={() => addEssayQuestion(section.id, "story")}
                          variant="outline"
                          className="flex items-center gap-2 px-3 py-2 text-sm"
                        >
                          <Plus className="h-4 w-4" />
                          Add Story Question (2 points)
                        </Button>
                      </div>
                      {section.essayQuestions?.map((q, qIndex) => (
                        <div
                          key={q.id}
                          className="p-4 rounded-lg border border-gray-200 dark:border-[#2e2e3a] bg-gray-50 dark:bg-[#252530] space-y-3"
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <span className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                                {q.type === "essay" ? "Essay Question" : "Story Question"} {qIndex + 1}
                              </span>
                              <span className="text-xs px-2 py-1 rounded bg-primary-100 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300">
                                {q.points} درجات
                              </span>
                            </div>
                            <button
                              onClick={() => removeEssayQuestion(section.id, q.id)}
                              className="text-red-600 dark:text-red-400 hover:text-red-700"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </div>
                          <div>
                            <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1">
                              Question Text
                            </label>
                            <Textarea
                              value={q.question}
                              onChange={(e) =>
                                updateEssayQuestion(section.id, q.id, (q) => ({
                                  ...q,
                                  question: e.target.value,
                                }))
                              }
                              placeholder="Question text..."
                              rows={3}
                              dir="ltr"
                            />
                          </div>
                          {q.type === "essay" && (
                            <div>
                              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1">
                                Required Lines
                              </label>
                              <Input
                                type="number"
                                min={1}
                                value={q.requiredLines || 6}
                                onChange={(e) =>
                                  updateEssayQuestion(section.id, q.id, (q) => ({
                                    ...q,
                                    requiredLines: Number(e.target.value) || 6,
                                  }))
                                }
                                className="w-32"
                              />
                            </div>
                          )}
                          <div>
                            <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1">
                              Model Answer (Optional)
                            </label>
                            <Textarea
                              value={q.modelAnswer || ""}
                              onChange={(e) =>
                                updateEssayQuestion(section.id, q.id, (q) => ({
                                  ...q,
                                  modelAnswer: e.target.value,
                                }))
                              }
                              placeholder="Model answer..."
                              rows={4}
                              dir="ltr"
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </motion.div>
              );
            })}
          </div>

          {submitError && (
            <div className="flex items-center gap-2 text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-900/40 px-4 py-3 rounded-xl">
              <AlertTriangle className="h-5 w-5" />
              <span className="text-sm">{submitError}</span>
            </div>
          )}

          <div className="flex items-center justify-end gap-3">
            <Button onClick={() => router.push("/admin/questions")} variant="outline" className="flex items-center gap-2">
              <X className="h-4 w-4" />
              Cancel
            </Button>
            <Button onClick={handleSubmit} disabled={isSubmitting} className="flex items-center gap-2">
              <Save className="h-4 w-4" />
              {isSubmitting ? "Saving..." : examId ? "Update Exam" : "Save Exam"}
            </Button>
          </div>
        </motion.div>
      </main>

      <AnimatePresence>
        {successNotification.isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className="fixed bottom-6 right-6 bg-emerald-600 text-white px-4 py-3 rounded-2xl shadow-xl flex items-center gap-2"
          >
            <CheckCircle2 className="h-5 w-5" />
            <span className="text-sm">{successNotification.message}</span>
          </motion.div>
        )}
      </AnimatePresence>

      <Footer />
    </div>
  );
}

