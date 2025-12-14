"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  BookOpen,
  Plus,
  X,
  Trash2,
  Save,
  CheckCircle2,
  AlertTriangle,
} from "lucide-react";
import {
  addDoc,
  collection,
  doc,
  getDoc,
  serverTimestamp,
  Timestamp,
  updateDoc,
  type DocumentData,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { Input } from "@/components/Input";
import { Textarea } from "@/components/Textarea";
import { Button } from "@/components/Button";
import { useAuth } from "@/contexts/AuthContext";
import { useAdmin } from "@/hooks/useAdmin";

type BlockType = "reading_passage" | "poetry_text" | "grammar_block" | "expression_block";
type QuestionType = "mcq" | "maqali" | "comparison_story" | "rhetoric" | "grammar_extraction";
type GradingMode = "manual" | "hybrid";
type BranchTag = "Naho" | "Adab" | "Balagha" | "Qiraa" | "Qesaa" | "Taraaib" | "TafkirNaqdi";
type UsageScope = "exam" | "lesson";

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

interface BaseBlock {
  id: string;
  type: BlockType;
  order: number;
  branchTag?: BranchTag;
  title?: string;
}

interface ReadingBlock extends BaseBlock {
  type: "reading_passage";
  genre: "Scientific" | "Literary";
  bodyText: string;
  questions: ExamQuestion[];
}

interface PoetryBlock extends BaseBlock {
  type: "poetry_text";
  poemTitle?: string;
  poet?: string;
  verses: { shatrA: string; shatrB: string }[];
  questions: ExamQuestion[];
}

interface GrammarBlock extends BaseBlock {
  type: "grammar_block";
  contextText?: string;
  questions: ExamQuestion[];
}

interface ExpressionBlock extends BaseBlock {
  type: "expression_block";
  variant: "functional" | "creative";
  prompt: string;
  constraints?: {
    maxLines?: number;
    minWords?: number;
    maxWords?: number;
  };
  questions: ExamQuestion[];
}

type ExamBlock = ReadingBlock | PoetryBlock | GrammarBlock | ExpressionBlock;

interface BaseQuestion {
  id: string;
  type: QuestionType;
  weight: number;
  branchTag?: BranchTag;
}

interface MCQQuestion extends BaseQuestion {
  type: "mcq";
  stem: string;
  options: string[];
  correctIndex: number;
}

interface MaqaliQuestion extends BaseQuestion {
  type: "maqali";
  prompt: string;
  modelAnswerKeywords?: string[];
}

interface ComparisonStoryQuestion extends BaseQuestion {
  type: "comparison_story";
  prompt: string;
  externalSnippet: string;
  modelAnswerKeywords?: string[];
}

interface RhetoricQuestion extends BaseQuestion {
  type: "rhetoric";
  prompt: string;
  correctAnswer?: string;
}

interface GrammarExtractionQuestion extends BaseQuestion {
  type: "grammar_extraction";
  prompt: string;
  correctAnswer?: string;
}

type ExamQuestion =
  | MCQQuestion
  | MaqaliQuestion
  | ComparisonStoryQuestion
  | RhetoricQuestion
  | GrammarExtractionQuestion;

interface ExamDoc {
  type: "arabic_comprehensive_exam";
  language: "arabic";
  usageScope?: UsageScope; // exam شامل أو lesson قالب درس
  lessonId?: string; // عند اختيار قالب درس
  examTitle: string;
  examDescription?: string;
  totalMarks?: number;
  durationMinutes?: number;
  gradingMode?: GradingMode;
  branchTags?: BranchTag[];
  blocks: ExamBlock[];
  createdAt?: Timestamp;
  createdBy?: string;
}

const branchOptions: BranchTag[] = ["Naho", "Adab", "Balagha", "Qiraa", "Qesaa", "Taraaib", "TafkirNaqdi"];

export default function ArabicComprehensiveExam() {
  const { user, loading: authLoading } = useAuth();
  const { isAdmin, loading: adminLoading } = useAdmin();
  const router = useRouter();
  const searchParams = useSearchParams();
  const examId = searchParams?.get("id") || null;

  const [examTitle, setExamTitle] = useState("");
  const [examDescription, setExamDescription] = useState("");
  const [totalMarks, setTotalMarks] = useState<number | "">(80);
  const [durationMinutes, setDurationMinutes] = useState<number | "">(150);
  const [gradingMode, setGradingMode] = useState<GradingMode>("hybrid");
  const [branchTags, setBranchTags] = useState<BranchTag[]>(["Qiraa", "Adab"]);
  const [usageScope, setUsageScope] = useState<UsageScope>("exam");
  const [selectedLesson, setSelectedLesson] = useState<string>("");
  const [blocks, setBlocks] = useState<ExamBlock[]>([]);
  const [submitError, setSubmitError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoadingExam, setIsLoadingExam] = useState(false);
  const [successNotification, setSuccessNotification] = useState<{ isOpen: boolean; message: string }>({
    isOpen: false,
    message: "",
  });
  
  // Optimistic updates state
  const [pendingOperations, setPendingOperations] = useState<Array<{
    type: string;
    rollback: () => void;
  }>>([]);

  // Auth guard
  useEffect(() => {
    if (authLoading || adminLoading) return;
    if (!user || !isAdmin) {
      router.push("/");
      return;
    }
  }, [user, isAdmin, authLoading, adminLoading, router]);

  // Load exam if editing
  useEffect(() => {
    const loadExam = async () => {
      if (!examId || !isAdmin) return;
      setIsLoadingExam(true);
      try {
        const ref = doc(db, "questions", examId);
        const snap = await getDoc(ref);
        if (snap.exists()) {
          const data = snap.data() as Partial<ExamDoc>;
          if (data.type === "arabic_comprehensive_exam") {
            setExamTitle(data.examTitle || "");
            setExamDescription(data.examDescription || "");
            setTotalMarks(data.totalMarks ?? "");
            setDurationMinutes(data.durationMinutes ?? "");
            setGradingMode((data.gradingMode as GradingMode) || "hybrid");
            setBranchTags((data.branchTags as BranchTag[]) || []);
            setUsageScope((data.usageScope as UsageScope) || "exam");
            setSelectedLesson(data.lessonId || "");
            setBlocks((data.blocks as ExamBlock[]) || []);
          }
        }
      } catch (err) {
        console.error("Error loading exam", err);
        alert("حدث خطأ أثناء تحميل الامتحان");
      } finally {
        setIsLoadingExam(false);
      }
    };
    loadExam();
  }, [examId, isAdmin]);

  const addBlock = (type: BlockType) => {
    const base: BaseBlock = {
      id: `blk-${type}-${Date.now()}`,
      type,
      order: blocks.length + 1,
      branchTag: undefined,
      title: "",
    };
    let block: ExamBlock;
    if (type === "reading_passage") {
      block = {
        ...base,
        type: "reading_passage",
        genre: "Scientific",
        bodyText: "",
        questions: [],
      };
    } else if (type === "poetry_text") {
      block = {
        ...base,
        type: "poetry_text",
        poemTitle: "",
        poet: "",
        verses: [{ shatrA: "", shatrB: "" }],
        questions: [],
      };
    } else if (type === "grammar_block") {
      block = { ...base, type: "grammar_block", contextText: "", questions: [] };
    } else {
      block = {
        ...base,
        type: "expression_block",
        variant: "functional",
        prompt: "",
        constraints: { maxLines: 8 },
        questions: [],
      };
    }
    
    // Optimistic update: apply immediately
    const previousBlocks = blocks;
    setBlocks((prev) => [...prev, block]);
    
    // If we have an examId, save optimistically
    if (examId) {
      const rollback = () => {
        setBlocks(previousBlocks);
        setPendingOperations((prev) => prev.filter((op) => op.type !== `add-block-${block.id}`));
      };
      
      setPendingOperations((prev) => [
        ...prev,
        { type: `add-block-${block.id}`, rollback },
      ]);
      
      // Save to Firestore in background
      saveBlockOptimistically(block, previousBlocks, rollback).catch((error) => {
        console.error("Error saving block optimistically:", error);
        rollback();
        setSubmitError("فشل حفظ الكتلة. يرجى المحاولة مرة أخرى.");
      });
    }
  };
  
  // Helper function for optimistic block save
  const saveBlockOptimistically = async (
    newBlock: ExamBlock,
    previousBlocks: ExamBlock[],
    rollback: () => void
  ) => {
    if (!examId || !user?.uid) return;
    
    try {
      const currentBlocks = [...previousBlocks, newBlock].map((b, idx) => ({ ...b, order: idx + 1 }));
      await updateDoc(doc(db, "questions", examId), {
        blocks: currentBlocks,
        updatedAt: serverTimestamp(),
      });
      
      // Remove from pending operations on success
      setPendingOperations((prev) => prev.filter((op) => op.type !== `add-block-${newBlock.id}`));
    } catch (error) {
      throw error;
    }
  };

  const removeBlock = (id: string) => {
    // Optimistic update: apply immediately
    const previousBlocks = blocks;
    const blockToRemove = previousBlocks.find((b) => b.id === id);
    
    setBlocks((prev) => prev.filter((b) => b.id !== id).map((b, idx) => ({ ...b, order: idx + 1 })));
    
    // If we have an examId, save optimistically
    if (examId && blockToRemove) {
      const rollback = () => {
        setBlocks(previousBlocks);
        setPendingOperations((prev) => prev.filter((op) => op.type !== `remove-block-${id}`));
      };
      
      setPendingOperations((prev) => [
        ...prev,
        { type: `remove-block-${id}`, rollback },
      ]);
      
      // Save to Firestore in background
      saveBlockRemovalOptimistically(id, previousBlocks, rollback).catch((error) => {
        console.error("Error removing block optimistically:", error);
        rollback();
        setSubmitError("فشل حذف الكتلة. يرجى المحاولة مرة أخرى.");
      });
    }
  };
  
  // Helper function for optimistic block removal
  const saveBlockRemovalOptimistically = async (
    blockId: string,
    previousBlocks: ExamBlock[],
    rollback: () => void
  ) => {
    if (!examId || !user?.uid) return;
    
    try {
      const currentBlocks = previousBlocks.filter((b) => b.id !== blockId).map((b, idx) => ({ ...b, order: idx + 1 }));
      await updateDoc(doc(db, "questions", examId), {
        blocks: currentBlocks,
        updatedAt: serverTimestamp(),
      });
      
      // Remove from pending operations on success
      setPendingOperations((prev) => prev.filter((op) => op.type !== `remove-block-${blockId}`));
    } catch (error) {
      throw error;
    }
  };

  const updateBlock = (id: string, updater: (b: ExamBlock) => ExamBlock) => {
    // Optimistic update: apply immediately
    const previousBlocks = blocks;
    const previousBlock = previousBlocks.find((b) => b.id === id);
    
    setBlocks((prev) => prev.map((b) => (b.id === id ? updater(b) : b)));
    
    // If we have an examId, save optimistically
    if (examId && previousBlock) {
      const rollback = () => {
        setBlocks(previousBlocks);
        setPendingOperations((prev) => prev.filter((op) => op.type !== `update-block-${id}`));
      };
      
      setPendingOperations((prev) => [
        ...prev.filter((op) => op.type !== `update-block-${id}`),
        { type: `update-block-${id}`, rollback },
      ]);
      
      // Save to Firestore in background
      const updatedBlock = updater(previousBlock);
      saveBlockUpdateOptimistically(id, updatedBlock, previousBlocks, rollback).catch((error) => {
        console.error("Error updating block optimistically:", error);
        rollback();
        setSubmitError("فشل تحديث الكتلة. يرجى المحاولة مرة أخرى.");
      });
    }
  };
  
  // Helper function for optimistic block update
  const saveBlockUpdateOptimistically = async (
    blockId: string,
    updatedBlock: ExamBlock,
    previousBlocks: ExamBlock[],
    rollback: () => void
  ) => {
    if (!examId || !user?.uid) return;
    
    try {
      const currentBlocks = previousBlocks.map((b) => (b.id === blockId ? updatedBlock : b));
      await updateDoc(doc(db, "questions", examId), {
        blocks: currentBlocks,
        updatedAt: serverTimestamp(),
      });
      
      // Remove from pending operations on success
      setPendingOperations((prev) => prev.filter((op) => op.type !== `update-block-${blockId}`));
    } catch (error) {
      throw error;
    }
  };

  const addQuestion = (blockId: string, type: QuestionType) => {
    const newQ: ExamQuestion =
      type === "mcq"
        ? {
            id: `q-${Date.now()}`,
            type: "mcq",
            weight: 1,
            stem: "",
            options: ["", "", "", ""],
            correctIndex: 0,
          }
        : type === "maqali"
        ? { id: `q-${Date.now()}`, type: "maqali", weight: 4, prompt: "", modelAnswerKeywords: [] }
        : type === "comparison_story"
        ? {
            id: `q-${Date.now()}`,
            type: "comparison_story",
            weight: 4,
            prompt: "",
            externalSnippet: "",
            modelAnswerKeywords: [],
          }
        : type === "rhetoric"
        ? { id: `q-${Date.now()}`, type: "rhetoric", weight: 2, prompt: "", correctAnswer: "" }
        : {
            id: `q-${Date.now()}`,
            type: "grammar_extraction",
            weight: 2,
            prompt: "",
            correctAnswer: "",
          };

    updateBlock(blockId, (b) => ({
      ...b,
      questions: [...b.questions, newQ],
    }));
  };

  const updateQuestion = (blockId: string, qId: string, updater: (q: ExamQuestion) => ExamQuestion) => {
    updateBlock(blockId, (b) => ({
      ...b,
      questions: b.questions.map((q) => (q.id === qId ? updater(q) : q)),
    }));
  };

  const removeQuestion = (blockId: string, qId: string) => {
    updateBlock(blockId, (b) => ({
      ...b,
      questions: b.questions.filter((q) => q.id !== qId),
    }));
  };

  const validate = () => {
    if (!examTitle.trim()) {
      setSubmitError("أدخل عنوان الامتحان");
      return false;
    }
    if (usageScope === "lesson" && !selectedLesson) {
      setSubmitError("اختر درساً عند استخدام قالب درس");
      return false;
    }
    if (!blocks.length) {
      setSubmitError("أضف على الأقل مقطعاً واحداً");
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
      const payload: Record<string, unknown> = {
        type: "arabic_comprehensive_exam",
        language: "arabic",
        usageScope: usageScope || "exam",
        examTitle: examTitle.trim(),
        blocks: blocks.map((b, idx) => ({ ...b, order: idx + 1 })),
      };

      // Only include examDescription if it has a value
      if (examDescription && examDescription.trim()) {
        payload.examDescription = examDescription.trim();
      }

      // Only include gradingMode if it has a value
      if (gradingMode) {
        payload.gradingMode = gradingMode;
      }

      // Only include branchTags if it has values
      if (branchTags && branchTags.length > 0) {
        payload.branchTags = branchTags;
      }

      // Only include lessonId if usageScope is "lesson" and selectedLesson is set
      if (usageScope === "lesson" && selectedLesson) {
        payload.lessonId = selectedLesson;
      }
      // Don't include lessonId for exam scope (it will be undefined, which will be filtered out)

      // Only include totalMarks if it has a value
      if (totalMarks !== "" && totalMarks !== null && totalMarks !== undefined) {
        const marks = Number(totalMarks);
        if (!isNaN(marks)) {
          payload.totalMarks = marks;
        }
      }

      if (durationMinutes !== "" && durationMinutes !== null && durationMinutes !== undefined) {
        const duration = Number(durationMinutes);
        if (!isNaN(duration)) {
          payload.durationMinutes = duration;
        }
      }

      if (user?.uid) {
        payload.createdBy = user.uid;
      }

      payload.blocks = blocks.map((b, idx) => {
        const cleanBlock: Record<string, unknown> = { ...b, order: idx + 1 };
        // Remove undefined values from block
        Object.keys(cleanBlock).forEach(key => {
          if (cleanBlock[key] === undefined) {
            delete cleanBlock[key];
          }
        });
        // Clean questions array
        if (cleanBlock.questions && Array.isArray(cleanBlock.questions)) {
          cleanBlock.questions = (cleanBlock.questions as unknown[]).map((q: unknown) => {
            if (typeof q !== 'object' || q === null) return q;
            const cleanQ: Record<string, unknown> = { ...q as Record<string, unknown> };
            Object.keys(cleanQ).forEach(key => {
              if (cleanQ[key] === undefined) {
                delete cleanQ[key];
              }
            });
            return cleanQ;
          });
        }
        return cleanBlock;
      });

      // Remove undefined and null values recursively
      const cleanPayload = (obj: unknown): unknown => {
        if (obj === null || obj === undefined) {
          return null;
        }
        if (Array.isArray(obj)) {
          const cleaned = obj.map(cleanPayload).filter(v => v !== null && v !== undefined);
          return cleaned.length > 0 ? cleaned : null;
        }
        if (typeof obj === 'object') {
          const cleaned: Record<string, unknown> = {};
          Object.keys(obj).forEach(key => {
            const value = cleanPayload((obj as Record<string, unknown>)[key]);
            if (value !== null && value !== undefined) {
              cleaned[key] = value;
            }
          });
          return Object.keys(cleaned).length > 0 ? cleaned : null;
        }
        return obj;
      };

      const cleaned = cleanPayload(payload);
      const finalPayload = cleaned && typeof cleaned === 'object' && !Array.isArray(cleaned) 
        ? cleaned as Record<string, unknown>
        : {};

      // Final cleanup: remove any remaining undefined values
      const finalClean: DocumentData = {};
      Object.keys(finalPayload).forEach(key => {
        const value = finalPayload[key];
        if (value !== undefined && value !== null) {
          finalClean[key] = value;
        }
      });

      if (examId) {
        await updateDoc(doc(db, "questions", examId), finalClean);
        setSuccessNotification({ isOpen: true, message: "تم تحديث الامتحان" });
      } else {
        await addDoc(collection(db, "questions"), {
          ...finalClean,
          createdAt: serverTimestamp(),
        } as Record<string, unknown>);
        setSuccessNotification({ isOpen: true, message: "تم إنشاء الامتحان" });
        setBlocks([]);
        setExamTitle("");
        setExamDescription("");
      }

      setTimeout(() => {
        setSuccessNotification({ isOpen: false, message: "" });
        router.push("/admin/questions");
      }, 1200);
    } catch (err) {
      console.error("Error saving exam", err);
      setSubmitError("حدث خطأ أثناء حفظ الامتحان");
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderQuestionCard = (block: ExamBlock, q: ExamQuestion) => {
    const common = (
      <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
        <div>
          <label className="text-xs text-gray-500 dark:text-gray-400">الوزن (درجة)</label>
          <Input
            type="number"
            min={1}
            max={6}
            value={q.weight}
            onChange={(e) => updateQuestion(block.id, q.id, (qq) => ({ ...qq, weight: Number(e.target.value) }))}
          />
        </div>
        <div>
          <label className="text-xs text-gray-500 dark:text-gray-400">فرع</label>
          <select
            value={q.branchTag || ""}
            onChange={(e) =>
              updateQuestion(block.id, q.id, (qq) => ({ ...qq, branchTag: (e.target.value || undefined) as BranchTag }))
            }
            className="w-full rounded-lg border border-gray-200 dark:border-[#2e2e3a] bg-white dark:bg-[#1c1c24] px-3 py-2 text-sm"
          >
            <option value="">بدون</option>
            {branchOptions.map((b) => (
              <option key={b} value={b}>
                {b}
              </option>
            ))}
          </select>
        </div>
      </div>
    );

    if (q.type === "mcq") {
      return (
        <div className="space-y-3">
          <label className="text-xs text-gray-500 dark:text-gray-400">نص السؤال</label>
          <Textarea
            rows={2}
            value={q.stem}
            onChange={(e) => updateQuestion(block.id, q.id, (qq) => ({ ...qq, stem: e.target.value }))}
            placeholder="اكتب نص السؤال..."
          />
          <div className="space-y-2">
            {q.options.map((opt, optIndex) => (
              <div key={optIndex} className="flex items-center gap-2">
                <input
                  type="radio"
                  name={`mc-${block.id}-${q.id}`}
                  checked={q.correctIndex === optIndex}
                  onChange={() => updateQuestion(block.id, q.id, (qq) => ({ ...qq, correctIndex: optIndex }))}
                  className="h-4 w-4 text-primary-600"
                />
                <Input
                  value={opt}
                  onChange={(e) => {
                    const next = [...q.options];
                    next[optIndex] = e.target.value;
                    updateQuestion(block.id, q.id, (qq) => ({ ...qq, options: next }));
                  }}
                  placeholder={`الخيار ${optIndex + 1}`}
                  className="flex-1"
                />
              </div>
            ))}
          </div>
          {common}
        </div>
      );
    }

    if (q.type === "maqali") {
      return (
        <div className="space-y-3">
          <label className="text-xs text-gray-500 dark:text-gray-400">نص السؤال</label>
          <Textarea
            rows={3}
            value={q.prompt}
            onChange={(e) => updateQuestion(block.id, q.id, (qq) => ({ ...qq, prompt: e.target.value }))}
            placeholder="اكتب نص السؤال..."
          />
          <label className="text-xs text-gray-500 dark:text-gray-400">كلمات مفتاحية للإجابة النموذجية</label>
          <Textarea
            rows={2}
            value={(q.modelAnswerKeywords || []).join(", ")}
            onChange={(e) =>
              updateQuestion(block.id, q.id, (qq) => ({
                ...qq,
                modelAnswerKeywords: e.target.value
                  .split(",")
                  .map((w) => w.trim())
                  .filter(Boolean),
              }))
            }
            placeholder="مثال: مقدمة، عرض، خاتمة"
          />
          {common}
        </div>
      );
    }

    if (q.type === "comparison_story") {
      return (
        <div className="space-y-3">
          <label className="text-xs text-gray-500 dark:text-gray-400">نص السؤال</label>
          <Textarea
            rows={3}
            value={q.prompt}
            onChange={(e) => updateQuestion(block.id, q.id, (qq) => ({ ...qq, prompt: e.target.value }))}
            placeholder="اكتب نص السؤال..."
          />
          <label className="text-xs text-gray-500 dark:text-gray-400">مقتطف من «الأيام»</label>
          <Textarea
            rows={3}
            value={q.externalSnippet}
            onChange={(e) => updateQuestion(block.id, q.id, (qq) => ({ ...qq, externalSnippet: e.target.value }))}
            placeholder="ضع المقتطف المطلوب المقارنة معه..."
          />
          <label className="text-xs text-gray-500 dark:text-gray-400">كلمات مفتاحية</label>
          <Textarea
            rows={2}
            value={(q.modelAnswerKeywords || []).join(", ")}
            onChange={(e) =>
              updateQuestion(block.id, q.id, (qq) => ({
                ...qq,
                modelAnswerKeywords: e.target.value
                  .split(",")
                  .map((w) => w.trim())
                  .filter(Boolean),
              }))
            }
          />
          {common}
        </div>
      );
    }

    if (q.type === "rhetoric" || q.type === "grammar_extraction") {
      return (
        <div className="space-y-3">
          <label className="text-xs text-gray-500 dark:text-gray-400">نص السؤال</label>
          <Textarea
            rows={2}
            value={q.prompt}
            onChange={(e) => updateQuestion(block.id, q.id, (qq) => ({ ...qq, prompt: e.target.value }))}
            placeholder="اكتب نص السؤال..."
          />
          <label className="text-xs text-gray-500 dark:text-gray-400">الإجابة المرجعية (اختياري)</label>
          <Textarea
            rows={2}
            value={q.correctAnswer || ""}
            onChange={(e) => updateQuestion(block.id, q.id, (qq) => ({ ...qq, correctAnswer: e.target.value }))}
            placeholder="ضع إجابة مرجعية للمعلم"
          />
          {common}
        </div>
      );
    }
  };

  const blockHeader = (b: ExamBlock) => (
    <div className="flex items-center justify-between pb-4 border-b border-gray-200 dark:border-[#2e2e3a]">
      <div className="flex items-center gap-3">
        <div className="p-2 rounded-lg bg-primary-100 dark:bg-primary-900/30">
          <BookOpen className="h-5 w-5 text-primary-600 dark:text-primary-400" />
        </div>
        <div>
          <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100">
            {b.type === "reading_passage"
              ? "نص قراءة"
              : b.type === "poetry_text"
              ? "نص شعري"
              : b.type === "grammar_block"
              ? "نحو/قواعد"
              : "تعبير"}
          </h3>
          <p className="text-xs text-gray-500 dark:text-gray-400">الترتيب: {b.order}</p>
        </div>
      </div>
      <div className="flex items-center gap-2">
        <select
          value={b.branchTag || ""}
          onChange={(e) =>
            updateBlock(b.id, (bb) => ({ ...bb, branchTag: (e.target.value || undefined) as BranchTag }))
          }
          className="rounded-lg border border-gray-200 dark:border-[#2e2e3a] bg-white dark:bg-[#1c1c24] px-3 py-2 text-sm"
        >
          <option value="">فرع</option>
          {branchOptions.map((br) => (
            <option key={br} value={br}>
              {br}
            </option>
          ))}
        </select>
        <button
          onClick={() => removeBlock(b.id)}
          className="p-2 rounded-lg border border-red-200 dark:border-red-900/40 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20"
        >
          <Trash2 className="h-4 w-4" />
        </button>
      </div>
    </div>
  );

  const renderBlock = (b: ExamBlock) => {
    return (
      <motion.div
        key={b.id}
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white dark:bg-[#1c1c24] rounded-2xl shadow-lg border border-gray-200 dark:border-[#2e2e3a] p-6 space-y-4"
      >
        {blockHeader(b)}

        {/* Common title */}
        <div>
          <label className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1 block">عنوان المقطع</label>
          <Input
            value={b.title || ""}
            onChange={(e) => updateBlock(b.id, (bb) => ({ ...bb, title: e.target.value }))}
            placeholder="مثال: نص القراءة الأول"
          />
        </div>

        {b.type === "reading_passage" && (
          <div className="space-y-3">
            <label className="text-sm font-semibold text-gray-700 dark:text-gray-300">نوع النص</label>
            <select
              value={b.genre}
              onChange={(e) =>
                updateBlock(b.id, (bb) => ({ ...(bb as ReadingBlock), genre: e.target.value as "Scientific" | "Literary" }))
              }
              className="w-full rounded-lg border border-gray-200 dark:border-[#2e2e3a] bg-white dark:bg-[#1c1c24] px-3 py-2 text-sm"
            >
              <option value="Scientific">علمي</option>
              <option value="Literary">أدبي</option>
            </select>
            <label className="text-sm font-semibold text-gray-700 dark:text-gray-300">النص</label>
            <Textarea
              rows={6}
              value={b.bodyText}
              onChange={(e) => updateBlock(b.id, (bb) => ({ ...(bb as ReadingBlock), bodyText: e.target.value }))}
              placeholder="اكتب نص القراءة (يدعم Markdown/HTML)"
            />
          </div>
        )}

        {b.type === "poetry_text" && (
          <div className="space-y-3">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <label className="text-sm font-semibold text-gray-700 dark:text-gray-300">عنوان القصيدة</label>
                <Input
                  value={b.poemTitle || ""}
                  onChange={(e) => updateBlock(b.id, (bb) => ({ ...(bb as PoetryBlock), poemTitle: e.target.value }))}
                />
              </div>
              <div>
                <label className="text-sm font-semibold text-gray-700 dark:text-gray-300">الشاعر</label>
                <Input
                  value={b.poet || ""}
                  onChange={(e) => updateBlock(b.id, (bb) => ({ ...(bb as PoetryBlock), poet: e.target.value }))}
                />
              </div>
            </div>
            <label className="text-sm font-semibold text-gray-700 dark:text-gray-300">الأبيات (شطر/شطر)</label>
            <div className="space-y-2">
              {b.verses.map((v, vIdx) => (
                <div key={vIdx} className="grid grid-cols-1 md:grid-cols-2 gap-2">
                  <Input
                    value={v.shatrA}
                    onChange={(e) => {
                      const next = [...b.verses];
                      next[vIdx] = { ...next[vIdx], shatrA: e.target.value };
                      updateBlock(b.id, (bb) => ({ ...(bb as PoetryBlock), verses: next }));
                    }}
                    placeholder="الشطر الأول"
                  />
                  <Input
                    value={v.shatrB}
                    onChange={(e) => {
                      const next = [...b.verses];
                      next[vIdx] = { ...next[vIdx], shatrB: e.target.value };
                      updateBlock(b.id, (bb) => ({ ...(bb as PoetryBlock), verses: next }));
                    }}
                    placeholder="الشطر الثاني"
                  />
                </div>
              ))}
              <Button
                variant="outline"
                onClick={() =>
                  updateBlock(b.id, (bb) => ({ ...(bb as PoetryBlock), verses: [...(bb as PoetryBlock).verses, { shatrA: "", shatrB: "" }] }))
                }
              >
                <Plus className="h-4 w-4" /> إضافة بيت
              </Button>
            </div>
          </div>
        )}

        {b.type === "grammar_block" && (
          <div className="space-y-3">
            <label className="text-sm font-semibold text-gray-700 dark:text-gray-300">نص القاعدة/السياق (اختياري)</label>
            <Textarea
              rows={4}
              value={b.contextText || ""}
              onChange={(e) => updateBlock(b.id, (bb) => ({ ...(bb as GrammarBlock), contextText: e.target.value }))}
              placeholder="ضع السياق النحوي أو النص المستخرج منه الأسئلة"
            />
          </div>
        )}

        {b.type === "expression_block" && (
          <div className="space-y-3">
            <label className="text-sm font-semibold text-gray-700 dark:text-gray-300">نوع التعبير</label>
            <select
              value={b.variant}
              onChange={(e) =>
                updateBlock(b.id, (bb) => ({ ...(bb as ExpressionBlock), variant: e.target.value as "functional" | "creative" }))
              }
              className="w-full rounded-lg border border-gray-200 dark:border-[#2e2e3a] bg-white dark:bg-[#1c1c24] px-3 py-2 text-sm"
            >
              <option value="functional">تعبير وظيفي</option>
              <option value="creative">تعبير إبداعي</option>
            </select>
            <label className="text-sm font-semibold text-gray-700 dark:text-gray-300">المطلوب</label>
            <Textarea
              rows={3}
              value={b.prompt}
              onChange={(e) => updateBlock(b.id, (bb) => ({ ...(bb as ExpressionBlock), prompt: e.target.value }))}
              placeholder="ضع صيغة المطلوب"
            />
            <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
              <Input
                type="number"
                min={1}
                placeholder="الأسطر (وظيفي)"
                value={String((b.constraints?.maxLines ?? ""))}
                onChange={(e) =>
                  updateBlock(b.id, (bb) => ({
                    ...(bb as ExpressionBlock),
                    constraints: { ...(bb as ExpressionBlock).constraints, maxLines: e.target.value ? Number(e.target.value) : undefined },
                  }))
                }
              />
              <Input
                type="number"
                min={1}
                placeholder="حد أدنى كلمات (إبداعي)"
                value={String((b.constraints?.minWords ?? ""))}
                onChange={(e) =>
                  updateBlock(b.id, (bb) => ({
                    ...(bb as ExpressionBlock),
                    constraints: { ...(bb as ExpressionBlock).constraints, minWords: e.target.value ? Number(e.target.value) : undefined },
                  }))
                }
              />
              <Input
                type="number"
                min={1}
                placeholder="حد أقصى كلمات"
                value={String((b.constraints?.maxWords ?? ""))}
                onChange={(e) =>
                  updateBlock(b.id, (bb) => ({
                    ...(bb as ExpressionBlock),
                    constraints: { ...(bb as ExpressionBlock).constraints, maxWords: e.target.value ? Number(e.target.value) : undefined },
                  }))
                }
              />
            </div>
          </div>
        )}

        {/* Questions */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="text-base font-bold text-gray-900 dark:text-gray-100">الأسئلة</h4>
            <div className="flex items-center gap-2">
              <select
                onChange={(e) => {
                  const val = e.target.value as QuestionType;
                  if (!val) return;
                  addQuestion(b.id, val);
                  e.target.value = "";
                }}
                className="rounded-lg border border-gray-200 dark:border-[#2e2e3a] bg-white dark:bg-[#1c1c24] px-3 py-2 text-sm"
                defaultValue=""
              >
                <option value="">إضافة سؤال...</option>
                <option value="mcq">اختيار من متعدد</option>
                <option value="maqali">مقالي</option>
                <option value="comparison_story">مقارنة قصة</option>
                <option value="rhetoric">بلاغة</option>
                <option value="grammar_extraction">استخراج/نحو</option>
              </select>
            </div>
          </div>

          <div className="space-y-3">
            {b.questions.length === 0 && (
              <p className="text-sm text-gray-500 dark:text-gray-400">لا توجد أسئلة بعد.</p>
            )}
            {b.questions.map((q, qIdx) => (
              <div
                key={q.id}
                className="p-4 rounded-xl border border-gray-200 dark:border-[#2e2e3a] bg-gray-50 dark:bg-[#252530] space-y-3"
              >
                <div className="flex items-center justify-between">
                  <span className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                    سؤال {qIdx + 1} — {q.type}
                  </span>
                  <button
                    onClick={() => removeQuestion(b.id, q.id)}
                    className="text-red-600 dark:text-red-400 hover:text-red-700"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
                {renderQuestionCard(b, q)}
              </div>
            ))}
          </div>
        </div>
      </motion.div>
    );
  };

  if (authLoading || adminLoading || isLoadingExam) {
    return (
      <div className="min-h-screen bg-white dark:bg-[#121218] flex items-center justify-center" dir="rtl">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">جاري التحميل...</p>
        </div>
      </div>
    );
  }

  if (!user || !isAdmin) return null;

  return (
    <div className="min-h-screen bg-white dark:bg-[#121218]" dir="rtl">
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
                  {examId ? "تعديل امتحان/قالب عربي شامل" : "إنشاء امتحان/قالب عربي شامل"}
                </h1>
                <p className="text-gray-600 dark:text-gray-400 mt-1">
                  هيكل كتل (Blocks) يدعم نصوص القراءة، الشعر، النحو، التعبير، ويمكن حفظه كقالب درس أو امتحان شامل.
                </p>
              </div>
            </div>
            <Button onClick={() => router.push("/admin/questions")} variant="outline" className="flex items-center gap-2">
              <X className="h-4 w-4" />
              إلغاء
            </Button>
          </div>

          {/* Exam info */}
          <div className="bg-white dark:bg-[#1c1c24] rounded-2xl shadow-lg border border-gray-200 dark:border-[#2e2e3a] p-6 space-y-4">
            <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100">معلومات الامتحان</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1">نطاق الاستخدام</label>
                <select
                  value={usageScope}
                  onChange={(e) => setUsageScope(e.target.value as UsageScope)}
                  className="w-full rounded-lg border border-gray-200 dark:border-[#2e2e3a] bg-white dark:bg-[#1c1c24] px-3 py-2 text-sm"
                >
                  <option value="exam">امتحان شامل</option>
                  <option value="lesson">قالب درس</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1">عنوان الامتحان</label>
                <Input value={examTitle} onChange={(e) => setExamTitle(e.target.value)} placeholder="مثال: امتحان نهاية العام" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1">الدرجة الكلية</label>
                  <Input
                    type="number"
                    min={0}
                    value={totalMarks === "" ? "" : String(totalMarks)}
                    onChange={(e) => setTotalMarks(e.target.value === "" ? "" : Number(e.target.value))}
                    placeholder="مثال: 80"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1">المدة (دقائق)</label>
                  <Input
                    type="number"
                    min={0}
                    value={durationMinutes === "" ? "" : String(durationMinutes)}
                    onChange={(e) => setDurationMinutes(e.target.value === "" ? "" : Number(e.target.value))}
                    placeholder="مثال: 150"
                  />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1">وصف مختصر</label>
                <Textarea
                  rows={3}
                  value={examDescription}
                  onChange={(e) => setExamDescription(e.target.value)}
                  placeholder="تعليمات أو وصف الامتحان..."
                />
              </div>
              <div className="space-y-2">
                {usageScope === "lesson" && (
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1">الدرس</label>
                    <select
                      value={selectedLesson}
                      onChange={(e) => setSelectedLesson(e.target.value)}
                      className="w-full rounded-lg border border-gray-200 dark:border-[#2e2e3a] bg-white dark:bg-[#1c1c24] px-3 py-2 text-sm"
                    >
                      <option value="">اختر درساً</option>
                      {arabicLessons.map((l) => (
                        <option key={l.id} value={l.id}>
                          {l.title}
                        </option>
                      ))}
                    </select>
                  </div>
                )}
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1">وضع التصحيح</label>
                <select
                  value={gradingMode}
                  onChange={(e) => setGradingMode(e.target.value as GradingMode)}
                  className="w-full rounded-lg border border-gray-200 dark:border-[#2e2e3a] bg-white dark:bg-[#1c1c24] px-3 py-2 text-sm"
                >
                  <option value="manual">يدوي</option>
                  <option value="hybrid">هجين (يدوي + مساعدة)</option>
                </select>
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1">الفروع</label>
                <div className="flex flex-wrap gap-2">
                  {branchOptions.map((b) => {
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

          {/* Add blocks */}
          <div className="bg-white dark:bg-[#1c1c24] rounded-2xl shadow-lg border border-gray-200 dark:border-[#2e2e3a] p-6 space-y-4">
            <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-2">إضافة مقاطع</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <Button variant="outline" onClick={() => addBlock("reading_passage")} className="flex items-center gap-2">
                <Plus className="h-4 w-4" /> نص قراءة
              </Button>
              <Button variant="outline" onClick={() => addBlock("poetry_text")} className="flex items-center gap-2">
                <Plus className="h-4 w-4" /> نص شعري
              </Button>
              <Button variant="outline" onClick={() => addBlock("grammar_block")} className="flex items-center gap-2">
                <Plus className="h-4 w-4" /> نحو/قواعد
              </Button>
              <Button variant="outline" onClick={() => addBlock("expression_block")} className="flex items-center gap-2">
                <Plus className="h-4 w-4" /> تعبير
              </Button>
            </div>
          </div>

          {/* Blocks list */}
          <div className="space-y-4">
            {blocks.length === 0 && (
              <p className="text-sm text-gray-500 dark:text-gray-400 text-center py-6">لا توجد مقاطع بعد.</p>
            )}
            {blocks.map((b) => renderBlock(b))}
          </div>

          {/* Submit */}
          {submitError && (
            <div className="flex items-center gap-2 text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-900/40 px-4 py-3 rounded-xl">
              <AlertTriangle className="h-5 w-5" />
              <span className="text-sm">{submitError}</span>
            </div>
          )}

          <div className="flex items-center justify-end gap-3">
            <Button onClick={() => router.push("/admin/questions")} variant="outline" className="flex items-center gap-2">
              <X className="h-4 w-4" />
              إلغاء
            </Button>
            <Button onClick={handleSubmit} disabled={isSubmitting} className="flex items-center gap-2">
              <Save className="h-4 w-4" />
              {isSubmitting ? "جارٍ الحفظ..." : examId ? "تحديث الامتحان" : "حفظ الامتحان"}
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

