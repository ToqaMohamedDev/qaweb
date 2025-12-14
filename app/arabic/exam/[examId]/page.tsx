"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { db } from "@/lib/firebase";
import { doc, getDoc } from "firebase/firestore";
import { handleFirestoreError } from "@/lib/firebaseUtils";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import { ArrowRight, ClipboardList, CheckCircle2, XCircle, ChevronDown, ChevronUp } from "lucide-react";
import { Button } from "@/components/Button";
import { Textarea } from "@/components/Textarea";
import { Input } from "@/components/Input";
import type { ExamBlock, ExamQuestion, Verse } from "@/types/questionTypes";
import { useAuth } from "@/contexts/AuthContext";
import { useExamSession } from "@/hooks/useExamSession";

interface MCQ {
  question: string;
  options: string[];
  correctAnswer: number;
}

interface ExtractionQuestion {
  type: string;
  question: string;
  answer: string;
}

interface ShortEssayQuestion {
  question: string;
  answer: string;
}

interface SubSection {
  arabicText?: string;
  essayRequirement?: string;
  multipleChoiceQuestions?: MCQ[];
  extractionQuestions?: ExtractionQuestion[];
  shortEssayQuestions?: ShortEssayQuestion[];
}

interface QuestionData {
  arabicText?: string;
  essayRequirement?: string;
  multipleChoiceQuestions?: MCQ[];
  extractionQuestions?: ExtractionQuestion[];
  shortEssayQuestions?: ShortEssayQuestion[];
  sections?: SubSection[];
}

interface ExamSection {
  id: string;
  templateType: string;
  questionId: string;
  note?: string;
  questionData?: QuestionData;
}

interface ExamData {
  type?: string;
  examTitle?: string;
  examDescription?: string;
  durationMinutes?: number;
  passingScore?: number;
  sections?: ExamSection[];
  blocks?: ExamBlock[];
}

export default function ArabicExamView() {
  const params = useParams();
  const router = useRouter();
  const examId = params?.examId as string;
  const { user } = useAuth();

  const [exam, setExam] = useState<ExamData | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({});
  const [expandedBlocks, setExpandedBlocks] = useState<Record<string, boolean>>({});
  const [showResults, setShowResults] = useState<Record<string, boolean>>({});
  const [showCorrectAnswers, setShowCorrectAnswers] = useState<Record<string, boolean>>({});

  const {
    userAnswers,
    setUserAnswers,
    isLoading: sessionLoading,
    sessionId,
  } = useExamSession<Record<string, string | number | null>>(examId, user?.uid, {});

  useEffect(() => {
    const loadExam = async () => {
      if (!examId) return;
      try {
        const snap = await getDoc(doc(db, "questions", examId));
        if (!snap.exists()) {
          setNotFound(true);
          return;
        }
        
        const examType = snap.data().type;
        // Support both old multi_template_exam and new arabic_comprehensive_exam
        if (examType !== "multi_template_exam" && examType !== "arabic_comprehensive_exam") {
          setNotFound(true);
          return;
        }
        
        const examData = snap.data() as ExamData;
        
        // Load question data for each section
        const loadedSections = await Promise.all(
          (examData.sections || []).map(async (section) => {
            if (!section.questionId) return section;
            try {
              const questionDoc = await getDoc(doc(db, "questions", section.questionId));
              if (questionDoc.exists()) {
                return { ...section, questionData: questionDoc.data() };
              }
            } catch (err: unknown) {
              handleFirestoreError(err, "loadQuestion");
            }
            return section;
          })
        );
        
        setExam({ ...examData, sections: loadedSections });
        
        // Auto-expand first section or block
        if (examType === "arabic_comprehensive_exam" && examData.blocks && examData.blocks.length > 0) {
          setExpandedSections({ [examData.blocks[0].id]: true });
        } else if (loadedSections.length > 0) {
          setExpandedSections({ [loadedSections[0].id]: true });
        }
      } catch (err: unknown) {
        handleFirestoreError(err, "loadExam");
        setNotFound(true);
      } finally {
        setLoading(false);
      }
    };
    loadExam();
  }, [examId]);

  // Autosave progress using examId
  useEffect(() => {
    if (!user || !examId) return;
    if (sessionLoading) return;

    const activeSessionId = sessionId || `${examId}-${user.uid}`;
    const controller = new AbortController();
    const timeoutId = setTimeout(async () => {
      try {
        await fetch("/api/save-progress", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            sessionId: activeSessionId,
            userId: user.uid,
            examId,
            userAnswers,
          }),
          signal: controller.signal,
        });
      } catch (error) {
        // Ignore abort errors
        if (error instanceof Error && error.name === "AbortError") {
          return;
        }
        console.error("save-progress failed", error);
      }
    }, 400);

    return () => {
      try {
        if (controller && !controller.signal.aborted) {
          controller.abort();
        }
      } catch (error) {
        // Ignore errors during cleanup
      }
      clearTimeout(timeoutId);
    };
  }, [examId, sessionId, sessionLoading, user, userAnswers]);

  const toggleSection = (sectionId: string) => {
    setExpandedSections((prev) => ({
      ...prev,
      [sectionId]: !prev[sectionId],
    }));
  };

  const toggleBlock = (blockId: string) => {
    setExpandedBlocks((prev) => ({
      ...prev,
      [blockId]: !prev[blockId],
    }));
  };

  const handleMultipleChoiceAnswer = (sectionId: string, mcqIndex: number, answerIndex: number) => {
    const key = `${sectionId}_mcq_${mcqIndex}`;
    setUserAnswers((prev) => ({
      ...prev,
      [key]: answerIndex,
    }));
  };

  const handleExtractionAnswer = (sectionId: string, extIndex: number, answer: string, isSubSection: boolean = false, subIndex?: number) => {
    const key = isSubSection && subIndex !== undefined
      ? `${sectionId}_sub_${subIndex}_ext_${extIndex}`
      : `${sectionId}_ext_${extIndex}`;
    setUserAnswers((prev) => ({
      ...prev,
      [key]: answer,
    }));
  };

  const handleEssayAnswer = (sectionId: string, essayIndex: number, answer: string, isSubSection: boolean = false, subIndex?: number) => {
    const key = isSubSection && subIndex !== undefined
      ? `${sectionId}_sub_${subIndex}_essay_${essayIndex}`
      : `${sectionId}_essay_${essayIndex}`;
    setUserAnswers((prev) => ({
      ...prev,
      [key]: answer,
    }));
  };

  const checkAnswers = (sectionId: string) => {
    setShowResults((prev) => ({
      ...prev,
      [sectionId]: true,
    }));
  };

  const showCorrectAnswersForSection = (sectionId: string) => {
    setShowCorrectAnswers((prev) => ({
      ...prev,
      [sectionId]: !prev[sectionId],
    }));
  };

  if (loading || sessionLoading) {
    return (
      <div className="min-h-screen bg-white dark:bg-[#121218]" dir="rtl">
        <Navbar />
        <main className="container mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 max-w-5xl">
          <div className="text-center py-16">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500 mx-auto mb-4"></div>
            <p className="text-gray-600 dark:text-gray-400">جاري تحميل الامتحان...</p>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  if (notFound || !exam) {
    return (
      <div className="min-h-screen bg-white dark:bg-[#121218]" dir="rtl">
        <Navbar />
        <main className="container mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 max-w-5xl">
          <div className="text-center py-16">
            <ClipboardList className="h-16 w-16 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-700 dark:text-gray-300 text-lg">الامتحان غير موجود</p>
            <button
              onClick={() => router.back()}
              className="mt-4 px-4 py-2 rounded-lg bg-primary-600 text-white hover:bg-primary-700 transition"
            >
              رجوع
            </button>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white dark:bg-[#121218]" dir="rtl">
      <Navbar />
      <main className="container mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 max-w-5xl">
        <div className="flex items-center gap-3 mb-6">
          <Link
            href="/arabic"
            className="inline-flex items-center gap-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 transition"
          >
            <ArrowRight className="h-4 w-4" />
            <span className="text-sm font-medium">العودة للدروس</span>
          </Link>
        </div>

        {/* Exam Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white dark:bg-[#1c1c24] rounded-2xl shadow-lg border border-gray-200 dark:border-[#2e2e3a] p-6 mb-6"
        >
          <div className="flex items-start gap-3">
            <div className="p-3 rounded-xl bg-emerald-100 dark:bg-emerald-900/30">
              <ClipboardList className="h-6 w-6 text-emerald-600 dark:text-emerald-300" />
            </div>
            <div className="flex-1 space-y-2">
              <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                {exam.examTitle || "امتحان"}
              </h1>
              {exam.examDescription && (
                <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
                  {exam.examDescription}
                </p>
              )}
              <div className="flex flex-wrap gap-2 text-sm text-gray-600 dark:text-gray-400">
                {exam.durationMinutes && (
                  <span className="px-3 py-1 rounded-lg bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300 border border-emerald-200/70 dark:border-emerald-800/50">
                    المدة: {exam.durationMinutes} دقيقة
                  </span>
                )}
                {(exam.sections || exam.blocks) && (
                  <span className="px-3 py-1 rounded-lg bg-primary-100 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300 border border-primary-200/70 dark:border-primary-800/50">
                    المقاطع: {(exam.sections?.length || 0) + (exam.blocks?.length || 0)}
                  </span>
                )}
                {exam.passingScore && (
                  <span className="px-3 py-1 rounded-lg bg-primary-100 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300 border border-primary-200/70 dark:border-primary-800/50">
                    درجة النجاح: {exam.passingScore}
                  </span>
                )}
              </div>
            </div>
          </div>
        </motion.div>

        {/* Exam Blocks (for arabic_comprehensive_exam) */}
        {exam.type === "arabic_comprehensive_exam" && exam.blocks && exam.blocks.length > 0 ? (
          <div className="space-y-4">
            {exam.blocks.map((block, blockIndex: number) => {
              const blockId = block.id || `block_${examId}_${blockIndex}`;
              const isExpanded = expandedBlocks[blockId];
              const showResult = showResults[blockId];
              const showCorrect = showCorrectAnswers[blockId];

              return (
                <motion.div
                  key={blockId}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: blockIndex * 0.1 }}
                  className="bg-white dark:bg-[#1c1c24] rounded-2xl shadow-lg border border-gray-200 dark:border-[#2e2e3a] overflow-hidden"
                >
                  {/* Block Header */}
                  <div
                    onClick={() => toggleBlock(blockId)}
                    className="p-5 cursor-pointer hover:bg-gray-50 dark:hover:bg-[#252530] transition-colors"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="p-2 rounded-lg bg-primary-100 dark:bg-primary-900/30">
                          <span className="text-sm font-bold text-primary-700 dark:text-primary-300">
                            {blockIndex + 1}
                          </span>
                        </div>
                        <div>
                          <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100">
                            {block.title || `المقطع ${blockIndex + 1}`}
                            {block.type && (
                              <span className="text-sm font-normal text-gray-600 dark:text-gray-400 mr-2">
                                - {block.type === "reading_passage" ? "نص قراءة" : 
                                    block.type === "poetry_text" ? "نص شعري" :
                                    block.type === "grammar_block" ? "نحو/قواعد" :
                                    "تعبير"}
                              </span>
                            )}
                          </h3>
                        </div>
                      </div>
                      {isExpanded ? (
                        <ChevronUp className="h-5 w-5 text-gray-500" />
                      ) : (
                        <ChevronDown className="h-5 w-5 text-gray-500" />
                      )}
                    </div>
                  </div>

                  {/* Block Content */}
                  <AnimatePresence>
                    {isExpanded && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        exit={{ opacity: 0, height: 0 }}
                        className="px-5 pb-5 space-y-4"
                      >
                        {/* Reading Passage Body Text */}
                        {block.type === "reading_passage" && block.bodyText && (
                          <div className="p-4 rounded-lg bg-gray-50 dark:bg-[#252530] border border-gray-200 dark:border-[#2e2e3a]">
                            <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                              النص:
                            </h4>
                            <p className="font-arabic text-base leading-relaxed text-gray-900 dark:text-gray-100" dir="rtl">
                              {block.bodyText}
                            </p>
                          </div>
                        )}

                        {/* Poetry Verses */}
                        {block.type === "poetry_text" && block.verses && block.verses.length > 0 && (
                          <div className="p-4 rounded-lg bg-gray-50 dark:bg-[#252530] border border-gray-200 dark:border-[#2e2e3a]">
                            {block.poemTitle && (
                              <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                                {block.poemTitle}
                              </h4>
                            )}
                            {block.poet && (
                              <p className="text-xs text-gray-600 dark:text-gray-400 mb-3">
                                {block.poet}
                              </p>
                            )}
                            <div className="space-y-2">
                              {"verses" in block && block.verses.map((verse: Verse, vIdx: number) => (
                                <div key={vIdx} className="font-arabic text-base leading-relaxed text-gray-900 dark:text-gray-100" dir="rtl">
                                  <p>{verse.shatrA}</p>
                                  <p>{verse.shatrB}</p>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Grammar Context Text */}
                        {block.type === "grammar_block" && block.contextText && (
                          <div className="p-4 rounded-lg bg-gray-50 dark:bg-[#252530] border border-gray-200 dark:border-[#2e2e3a]">
                            <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                              النص:
                            </h4>
                            <p className="font-arabic text-base leading-relaxed text-gray-900 dark:text-gray-100" dir="rtl">
                              {block.contextText}
                            </p>
                          </div>
                        )}

                        {/* Expression Prompt */}
                        {block.type === "expression_block" && block.prompt && (
                          <div className="p-4 rounded-lg bg-gray-50 dark:bg-[#252530] border border-gray-200 dark:border-[#2e2e3a]">
                            <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                              المطلوب:
                            </h4>
                            <p className="text-sm text-gray-900 dark:text-gray-100" dir="rtl">
                              {block.prompt}
                            </p>
                            {block.constraints && (
                              <div className="mt-2 text-xs text-gray-600 dark:text-gray-400">
                                {block.constraints.maxLines && `الحد الأقصى للأسطر: ${block.constraints.maxLines}`}
                                {block.constraints.minWords && ` الحد الأدنى للكلمات: ${block.constraints.minWords}`}
                                {block.constraints.maxWords && ` الحد الأقصى للكلمات: ${block.constraints.maxWords}`}
                              </div>
                            )}
                          </div>
                        )}

                        {/* Questions in Block */}
                        {block.questions && block.questions.length > 0 && (
                          <div className="space-y-4">
                            {block.questions && block.questions.map((q: ExamQuestion, qIndex: number) => {
                              const answerKey = `${blockId}_q_${q.id || qIndex}`;
                              const questionLabel =
                                q.type === "mcq"
                                  ? q.stem
                                  : "prompt" in q
                                  ? q.prompt
                                  : "السؤال";
                              const userAnswer = userAnswers[answerKey];
                              const showAnswer = showResult || showCorrect;

                              return (
                                <div key={q.id || qIndex} className="p-3 rounded-lg bg-white dark:bg-[#1c1c24] border border-gray-200 dark:border-[#2e2e3a]">
                                  <p className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-3" dir="rtl">
                                    {qIndex + 1}. {questionLabel}
                                  </p>
                                  
                                  {/* Multiple Choice Question */}
                                  {q.type === "mcq" && q.options && q.options.length > 0 && (
                                    <div className="space-y-2">
                                      {q.options.map((opt: string, optIndex: number) => {
                                        const isSelected = userAnswer === optIndex;
                                        const isCorrect = q.correctIndex === optIndex;
                                        let bgClass = "bg-white dark:bg-[#1c1c24] border border-gray-200 dark:border-[#2e2e3a]";
                                        
                                        if (showAnswer) {
                                          if (isCorrect) {
                                            bgClass = "bg-green-100 dark:bg-green-900/30 border border-green-300 dark:border-green-700";
                                          } else if (isSelected && !isCorrect) {
                                            bgClass = "bg-red-100 dark:bg-red-900/30 border border-red-300 dark:border-red-700";
                                          }
                                        } else if (isSelected) {
                                          bgClass = "bg-primary-100 dark:bg-primary-900/30 border border-primary-300 dark:border-primary-700";
                                        }
                                        
                                        return (
                                          <div
                                            key={optIndex}
                                            onClick={() => !showAnswer && setUserAnswers(prev => ({ ...prev, [answerKey]: optIndex }))}
                                            className={`p-2 rounded-lg flex items-center gap-2 cursor-pointer transition-all ${bgClass}`}
                                          >
                                            <input
                                              type="radio"
                                              name={answerKey}
                                              checked={isSelected}
                                              onChange={() => !showAnswer && setUserAnswers(prev => ({ ...prev, [answerKey]: optIndex }))}
                                              className="h-4 w-4 text-primary-600"
                                              disabled={showAnswer}
                                            />
                                            <span className="text-gray-900 dark:text-gray-100 flex-1" dir="rtl">
                                              {String.fromCharCode(65 + optIndex)}. {opt}
                                            </span>
                                            {showAnswer && isCorrect && (
                                              <CheckCircle2 className="h-5 w-5 text-green-600 dark:text-green-400" />
                                            )}
                                            {showAnswer && isSelected && !isCorrect && (
                                              <XCircle className="h-5 w-5 text-red-600 dark:text-red-400" />
                                            )}
                                          </div>
                                        );
                                      })}
                                    </div>
                                  )}

                                  {/* Essay Question (maqali) */}
                                  {q.type === "maqali" && "prompt" in q && (
                                    <Textarea
                                      value={String(userAnswer || "")}
                                      onChange={(e) => setUserAnswers(prev => ({ ...prev, [answerKey]: e.target.value }))}
                                      placeholder="اكتب إجابتك هنا..."
                                      rows={6}
                                      disabled={showAnswer}
                                      className="w-full"
                                      dir="rtl"
                                    />
                                  )}

                                  {/* Comparison Story Question */}
                                  {q.type === "comparison_story" && "externalSnippet" in q && (
                                    <div className="space-y-3">
                                      {q.externalSnippet && (
                                        <div className="p-3 rounded-lg bg-gray-50 dark:bg-[#252530] border border-gray-200 dark:border-[#2e2e3a]">
                                          <p className="text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                                            مقتطف من «الأيام»:
                                          </p>
                                          <p className="text-sm text-gray-900 dark:text-gray-100" dir="rtl">
                                            {q.externalSnippet}
                                          </p>
                                        </div>
                                      )}
                                      <Textarea
                                        value={String(userAnswer || "")}
                                        onChange={(e) => setUserAnswers(prev => ({ ...prev, [answerKey]: e.target.value }))}
                                        placeholder="اكتب إجابتك هنا..."
                                        rows={6}
                                        disabled={showAnswer}
                                        className="w-full"
                                        dir="rtl"
                                      />
                                    </div>
                                  )}

                                  {/* Rhetoric Question */}
                                  {q.type === "rhetoric" && (
                                    <Input
                                      type="text"
                                      value={String(userAnswer || "")}
                                      onChange={(e) => setUserAnswers(prev => ({ ...prev, [answerKey]: e.target.value }))}
                                      placeholder="اكتب إجابتك هنا..."
                                      disabled={showAnswer}
                                      className="w-full"
                                      dir="rtl"
                                    />
                                  )}

                                  {/* Grammar Extraction Question */}
                                  {q.type === "grammar_extraction" && (
                                    <Input
                                      type="text"
                                      value={String(userAnswer || "")}
                                      onChange={(e) => setUserAnswers(prev => ({ ...prev, [answerKey]: e.target.value }))}
                                      placeholder="اكتب إجابتك هنا..."
                                      disabled={showAnswer}
                                      className="w-full"
                                      dir="rtl"
                                    />
                                  )}

                                  {/* Show Correct Answer */}
                                  {showCorrect && "correctAnswer" in q && q.correctAnswer && (
                                    <div className="mt-3 p-3 rounded-lg bg-primary-100 dark:bg-primary-900/30 border border-primary-300 dark:border-primary-700">
                                      <p className="text-xs font-medium text-primary-800 dark:text-primary-200 mb-1">
                                        الإجابة الصحيحة:
                                      </p>
                                      <p className="text-sm text-primary-900 dark:text-primary-100" dir="rtl">
                                        {q.correctAnswer}
                                      </p>
                                    </div>
                                  )}
                                  
                                  {/* Show Model Answer Keywords */}
                                  {showCorrect && "modelAnswerKeywords" in q && q.modelAnswerKeywords && q.modelAnswerKeywords.length > 0 && (
                                    <div className="mt-3 p-3 rounded-lg bg-primary-100 dark:bg-primary-900/30 border border-primary-300 dark:border-primary-700">
                                      <p className="text-xs font-medium text-primary-800 dark:text-primary-200 mb-1">
                                        كلمات مفتاحية للإجابة:
                                      </p>
                                      <p className="text-sm text-primary-900 dark:text-primary-100" dir="rtl">
                                        {q.modelAnswerKeywords.join(", ")}
                                      </p>
                                    </div>
                                  )}
                                </div>
                              );
                            })}
                          </div>
                        )}

                        {/* Action Buttons */}
                        <div className="flex gap-2 pt-3 border-t border-gray-200 dark:border-[#2e2e3a]">
                          {!showResult ? (
                            <Button
                              onClick={() => setShowResults(prev => ({ ...prev, [blockId]: true }))}
                              className="flex-1 text-sm py-2"
                            >
                              التحقق من الإجابات
                            </Button>
                          ) : (
                            <Button
                              onClick={() => setShowCorrectAnswers(prev => ({ ...prev, [blockId]: !prev[blockId] }))}
                              variant="outline"
                              className="flex-1 text-sm py-2"
                            >
                              {showCorrect ? "إخفاء" : "عرض"} الإجابات الصحيحة
                            </Button>
                          )}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.div>
              );
            })}
          </div>
        ) : exam.sections && exam.sections.length > 0 ? (
          <div className="space-y-4">
            {/* Exam Sections */}
            {exam.sections.map((section, sectionIndex) => {
              const questionData = section.questionData;
              if (!questionData) return null;

              const isExpanded = expandedSections[section.id];
              const showResult = showResults[section.id];
              const showCorrect = showCorrectAnswers[section.id];

              return (
                <motion.div
                  key={section.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: sectionIndex * 0.1 }}
                  className="bg-white dark:bg-[#1c1c24] rounded-2xl shadow-lg border border-gray-200 dark:border-[#2e2e3a] overflow-hidden"
                >
                  {/* Section Header */}
                  <div
                    onClick={() => toggleSection(section.id)}
                    className="p-5 cursor-pointer hover:bg-gray-50 dark:hover:bg-[#252530] transition-colors"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="p-2 rounded-lg bg-primary-100 dark:bg-primary-900/30">
                          <span className="text-sm font-bold text-primary-700 dark:text-primary-300">
                            {sectionIndex + 1}
                          </span>
                        </div>
                        <div>
                          <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100">
                            المقطع {sectionIndex + 1}
                            {section.note && (
                              <span className="text-sm font-normal text-gray-600 dark:text-gray-400 mr-2">
                                - {section.note}
                              </span>
                            )}
                          </h3>
                        </div>
                      </div>
                      {isExpanded ? (
                        <ChevronUp className="h-5 w-5 text-gray-500" />
                      ) : (
                        <ChevronDown className="h-5 w-5 text-gray-500" />
                      )}
                    </div>
                  </div>

                  {/* Section Content */}
                  <AnimatePresence>
                    {isExpanded && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        exit={{ opacity: 0, height: 0 }}
                        className="px-5 pb-5 space-y-4"
                      >
                        {/* Arabic Text */}
                        {questionData.arabicText && (
                          <div className="p-4 rounded-lg bg-gray-50 dark:bg-[#252530] border border-gray-200 dark:border-[#2e2e3a]">
                            <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                              النص العربي:
                            </h4>
                            <p className="font-arabic text-base leading-relaxed text-gray-900 dark:text-gray-100">
                              {questionData.arabicText}
                            </p>
                          </div>
                        )}

                        {/* Essay Requirement */}
                        {questionData.essayRequirement && (
                          <div className="p-4 rounded-lg bg-gray-50 dark:bg-[#252530] border border-gray-200 dark:border-[#2e2e3a]">
                            <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                              المطلوب من الطالب:
                            </h4>
                            <p className="text-sm text-gray-900 dark:text-gray-100">
                              {questionData.essayRequirement}
                            </p>
                          </div>
                        )}

                        {/* Direct Questions from questionData (for arabic_comprehensive) */}
                        {questionData.multipleChoiceQuestions && questionData.multipleChoiceQuestions.length > 0 && !questionData.sections && (
                          <div className="space-y-3">
                            <h4 className="text-base font-bold text-gray-900 dark:text-gray-100">
                              أسئلة الاختيار من متعدد:
                            </h4>
                            {questionData.multipleChoiceQuestions.map((mcq, mcqIndex: number) => {
                              const answerKey = `${section.id}_mcq_${mcqIndex}`;
                              const userAnswer = userAnswers[answerKey];
                              const isCorrect = userAnswer === mcq.correctAnswer;
                              const showAnswer = showResult || showCorrect;

                              return (
                                <div key={mcqIndex} className="p-3 rounded-lg bg-white dark:bg-[#1c1c24] border border-gray-200 dark:border-[#2e2e3a]">
                                  <p className="font-medium text-gray-900 dark:text-gray-100 mb-3">
                                    {mcqIndex + 1}. {mcq.question}
                                  </p>
                                  <div className="space-y-2">
                                    {mcq.options && mcq.options.map((opt: string, optIndex: number) => {
                                      const isSelected = userAnswer === optIndex;
                                      const isCorrectOption = optIndex === mcq.correctAnswer;

                                      return (
                                        <label
                                          key={optIndex}
                                          className={`flex items-center gap-3 p-3 rounded-lg cursor-pointer transition-all ${
                                            showAnswer && isCorrectOption
                                              ? "bg-green-100 dark:bg-green-900/30 border-2 border-green-500"
                                              : showAnswer && isSelected && !isCorrect
                                              ? "bg-red-100 dark:bg-red-900/30 border-2 border-red-500"
                                              : isSelected
                                              ? "bg-primary-100 dark:bg-primary-900/30 border-2 border-primary-500"
                                              : "bg-gray-50 dark:bg-[#252530] border border-gray-200 dark:border-[#2e2e3a] hover:bg-gray-100 dark:hover:bg-[#2a2a35]"
                                          }`}
                                        >
                                          <input
                                            type="radio"
                                            name={answerKey}
                                            checked={isSelected}
                                            onChange={() => handleMultipleChoiceAnswer(section.id, mcqIndex, optIndex)}
                                            disabled={showAnswer}
                                            className="w-4 h-4 text-primary-600"
                                          />
                                          <span className="text-gray-900 dark:text-gray-100">
                                            {String.fromCharCode(65 + optIndex)}. {opt}
                                          </span>
                                          {showAnswer && isCorrectOption && (
                                            <CheckCircle2 className="h-5 w-5 text-green-600 dark:text-green-400 ml-auto" />
                                          )}
                                          {showAnswer && isSelected && !isCorrect && (
                                            <XCircle className="h-5 w-5 text-red-600 dark:text-red-400 ml-auto" />
                                          )}
                                        </label>
                                      );
                                    })}
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        )}

                        {questionData.extractionQuestions && questionData.extractionQuestions.length > 0 && !questionData.sections && (
                          <div className="space-y-3">
                            <h4 className="text-base font-bold text-gray-900 dark:text-gray-100">
                              أسئلة الاستخراج:
                            </h4>
                            {questionData.extractionQuestions.map((ext, extIndex: number) => {
                              const answerKey = `${section.id}_ext_${extIndex}`;
                              const userAnswer = userAnswers[answerKey] || "";

                              return (
                                <div key={extIndex} className="p-3 rounded-lg bg-white dark:bg-[#1c1c24] border border-gray-200 dark:border-[#2e2e3a]">
                                  <p className="font-medium text-gray-900 dark:text-gray-100 mb-2">
                                    {extIndex + 1}. {ext.question}
                                  </p>
                                  <Textarea
                                    value={userAnswer}
                                    onChange={(e) => handleExtractionAnswer(section.id, extIndex, e.target.value)}
                                    placeholder="اكتب إجابتك هنا..."
                                    rows={4}
                                    className="w-full"
                                    dir="rtl"
                                  />
                                  {showCorrect && ext.answer && (
                                    <div className="mt-2 p-2 rounded-lg bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800">
                                      <p className="text-xs font-semibold text-green-700 dark:text-green-300 mb-1">
                                        الإجابة الصحيحة:
                                      </p>
                                      <p className="text-sm text-green-900 dark:text-green-100">{ext.answer}</p>
                                    </div>
                                  )}
                                </div>
                              );
                            })}
                          </div>
                        )}

                        {questionData.shortEssayQuestions && questionData.shortEssayQuestions.length > 0 && !questionData.sections && (
                          <div className="space-y-3">
                            <h4 className="text-base font-bold text-gray-900 dark:text-gray-100">
                              أسئلة المقال القصير:
                            </h4>
                            {questionData.shortEssayQuestions.map((essay, essayIndex: number) => {
                              const answerKey = `${section.id}_essay_${essayIndex}`;
                              const userAnswer = userAnswers[answerKey] || "";

                              return (
                                <div key={essayIndex} className="p-3 rounded-lg bg-white dark:bg-[#1c1c24] border border-gray-200 dark:border-[#2e2e3a]">
                                  <p className="font-medium text-gray-900 dark:text-gray-100 mb-2">
                                    {essayIndex + 1}. {essay.question}
                                  </p>
                                  <Textarea
                                    value={userAnswer}
                                    onChange={(e) => handleEssayAnswer(section.id, essayIndex, e.target.value)}
                                    placeholder="اكتب إجابتك هنا..."
                                    rows={6}
                                    className="w-full"
                                    dir="rtl"
                                  />
                                  {showCorrect && essay.answer && (
                                    <div className="mt-2 p-2 rounded-lg bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800">
                                      <p className="text-xs font-semibold text-green-700 dark:text-green-300 mb-1">
                                        الإجابة الصحيحة:
                                      </p>
                                      <p className="text-sm text-green-900 dark:text-green-100">{essay.answer}</p>
                                    </div>
                                  )}
                                </div>
                              );
                            })}
                          </div>
                        )}

                        {/* Sections from arabic_multi_section */}
                        {questionData.sections && Array.isArray(questionData.sections) && questionData.sections.length > 0 && (
                          <div className="space-y-3">
                            {questionData.sections.map((subSection, subIndex: number) => (
                              <div key={subIndex} className="p-4 rounded-lg bg-gray-50 dark:bg-[#252530] border border-gray-200 dark:border-[#2e2e3a]">
                                {subSection.arabicText && (
                                  <div className="mb-3">
                                    <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1">
                                      النص:
                                    </h4>
                                    <p className="font-arabic text-sm leading-relaxed text-gray-900 dark:text-gray-100">
                                      {subSection.arabicText}
                                    </p>
                                  </div>
                                )}

                                {/* Multiple Choice Questions */}
                                {subSection.multipleChoiceQuestions && subSection.multipleChoiceQuestions.length > 0 && (
                                  <div className="space-y-3 mt-4">
                                    {subSection.multipleChoiceQuestions.map((mcq, mcqIndex: number) => {
                                      const answerKey = `${section.id}_sub_${subIndex}_mcq_${mcqIndex}`;
                                      const userAnswer = userAnswers[answerKey];
                                      const isCorrect = userAnswer === mcq.correctAnswer;
                                      const showAnswer = showResult || showCorrect;

                                      return (
                                        <div key={mcqIndex} className="p-3 rounded-lg bg-white dark:bg-[#1c1c24] border border-gray-200 dark:border-[#2e2e3a]">
                                          <p className="font-medium text-gray-900 dark:text-gray-100 mb-3">
                                            {mcqIndex + 1}. {mcq.question}
                                          </p>
                                          <div className="space-y-2">
                                            {mcq.options && mcq.options.map((opt: string, optIndex: number) => {
                                              const isSelected = userAnswer === optIndex;
                                              const isCorrectOption = optIndex === mcq.correctAnswer;

                                              return (
                                                <label
                                                  key={optIndex}
                                                  className={`flex items-center gap-3 p-3 rounded-lg cursor-pointer transition-all ${
                                                    showAnswer && isCorrectOption
                                                      ? "bg-green-100 dark:bg-green-900/30 border-2 border-green-500"
                                                      : showAnswer && isSelected && !isCorrect
                                                      ? "bg-red-100 dark:bg-red-900/30 border-2 border-red-500"
                                                      : isSelected
                                                      ? "bg-primary-100 dark:bg-primary-900/30 border-2 border-primary-500"
                                                      : "bg-gray-50 dark:bg-[#252530] border border-gray-200 dark:border-[#2e2e3a] hover:bg-gray-100 dark:hover:bg-[#2a2a35]"
                                                  }`}
                                                >
                                                  <input
                                                    type="radio"
                                                    name={answerKey}
                                                    checked={isSelected}
                                                    onChange={() => handleMultipleChoiceAnswer(section.id, mcqIndex, optIndex)}
                                                    disabled={showAnswer}
                                                    className="w-4 h-4 text-primary-600"
                                                  />
                                                  <span className="text-gray-900 dark:text-gray-100">
                                                    {String.fromCharCode(65 + optIndex)}. {opt}
                                                  </span>
                                                  {showAnswer && isCorrectOption && (
                                                    <CheckCircle2 className="h-5 w-5 text-green-600 dark:text-green-400 ml-auto" />
                                                  )}
                                                  {showAnswer && isSelected && !isCorrect && (
                                                    <XCircle className="h-5 w-5 text-red-600 dark:text-red-400 ml-auto" />
                                                  )}
                                                </label>
                                              );
                                            })}
                                          </div>
                                        </div>
                                      );
                                    })}
                                  </div>
                                )}

                                {/* Extraction Questions */}
                                {subSection.extractionQuestions && subSection.extractionQuestions.length > 0 && (
                                  <div className="space-y-3 mt-4">
                                    {subSection.extractionQuestions.map((ext, extIndex: number) => {
                                      const answerKey = `${section.id}_sub_${subIndex}_ext_${extIndex}`;
                                      const userAnswer = userAnswers[answerKey] || "";

                                      return (
                                        <div key={extIndex} className="p-3 rounded-lg bg-white dark:bg-[#1c1c24] border border-gray-200 dark:border-[#2e2e3a]">
                                          <p className="font-medium text-gray-900 dark:text-gray-100 mb-2">
                                            {extIndex + 1}. {ext.question}
                                          </p>
                                          <Textarea
                                            value={userAnswer}
                                            onChange={(e) => handleExtractionAnswer(section.id, extIndex, e.target.value, true, subIndex)}
                                            placeholder="اكتب إجابتك هنا..."
                                            rows={4}
                                            className="w-full"
                                            dir="rtl"
                                          />
                                          {showCorrect && ext.answer && (
                                            <div className="mt-2 p-2 rounded-lg bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800">
                                              <p className="text-xs font-semibold text-green-700 dark:text-green-300 mb-1">
                                                الإجابة الصحيحة:
                                              </p>
                                              <p className="text-sm text-green-900 dark:text-green-100">{ext.answer}</p>
                                            </div>
                                          )}
                                        </div>
                                      );
                                    })}
                                  </div>
                                )}

                                {/* Short Essay Questions */}
                                {subSection.shortEssayQuestions && subSection.shortEssayQuestions.length > 0 && (
                                  <div className="space-y-3 mt-4">
                                    {subSection.shortEssayQuestions.map((essay, essayIndex: number) => {
                                      const answerKey = `${section.id}_sub_${subIndex}_essay_${essayIndex}`;
                                      const userAnswer = userAnswers[answerKey] || "";

                                      return (
                                        <div key={essayIndex} className="p-3 rounded-lg bg-white dark:bg-[#1c1c24] border border-gray-200 dark:border-[#2e2e3a]">
                                          <p className="font-medium text-gray-900 dark:text-gray-100 mb-2">
                                            {essayIndex + 1}. {essay.question}
                                          </p>
                                          <Textarea
                                            value={userAnswer}
                                            onChange={(e) => handleEssayAnswer(section.id, essayIndex, e.target.value, true, subIndex)}
                                            placeholder="اكتب إجابتك هنا..."
                                            rows={6}
                                            className="w-full"
                                            dir="rtl"
                                          />
                                          {showCorrect && essay.answer && (
                                            <div className="mt-2 p-2 rounded-lg bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800">
                                              <p className="text-xs font-semibold text-green-700 dark:text-green-300 mb-1">
                                                الإجابة الصحيحة:
                                              </p>
                                              <p className="text-sm text-green-900 dark:text-green-100">{essay.answer}</p>
                                            </div>
                                          )}
                                        </div>
                                      );
                                    })}
                                  </div>
                                )}
                              </div>
                            ))}
                          </div>
                        )}

                        {/* Action Buttons */}
                        <div className="flex gap-3 pt-4 border-t border-gray-200 dark:border-[#2e2e3a]">
                          {!showResult && (
                            <Button
                              onClick={() => checkAnswers(section.id)}
                              className="flex-1"
                            >
                              <CheckCircle2 className="h-4 w-4 ml-2" />
                              التحقق من الإجابات
                            </Button>
                          )}
                          <Button
                            onClick={() => showCorrectAnswersForSection(section.id)}
                            variant="outline"
                            className="flex-1"
                          >
                            {showCorrect ? "إخفاء الإجابات الصحيحة" : "إظهار الإجابات الصحيحة"}
                          </Button>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.div>
              );
            })}
          </div>
        ) : (
          <div className="text-center py-12">
            <p className="text-gray-600 dark:text-gray-400">لا توجد مقاطع في هذا الامتحان</p>
          </div>
        )}
      </main>
      <Footer />
    </div>
  );
}
