"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import {
  FileText,
  ArrowRight,
  ChevronDown,
  ChevronUp,
  BookOpen,
  CheckCircle2,
  XCircle,
  Check,
} from "lucide-react";
import { Input } from "@/components/Input";
import { Textarea } from "@/components/Textarea";
import { Button } from "@/components/Button";
import { fetchQuestionsByLesson, handleFirestoreError } from "@/lib/firebaseUtils";
import { SelectionTranslator } from "@/components/SelectionTranslator";
import type { ExamBlock, ExamQuestion, MCQ, ExtractionQuestion, ShortEssayQuestion } from "@/types/questionTypes";
import { useAuth } from "@/contexts/AuthContext";
import { useExamSession } from "@/hooks/useExamSession";

type BlockQuestion = {
  id: string;
  questionType: string;
  prompt?: string;
  question?: string;
  options?: string[];
  correctAnswer?: number | string;
  answer?: string;
  points?: number;
};

type LessonBlock =
  | (ExamBlock & {
      note?: string;
      blockType?: string;
      questions?: Array<ExamQuestion | BlockQuestion>;
      poemTitle?: string;
      poet?: string;
      verses?: { shatrA: string; shatrB: string }[];
      constraints?: { maxLines?: number; minWords?: number; maxWords?: number };
      bodyText?: string;
      contextText?: string;
      prompt?: string;
      multipleChoiceQuestions?: MCQ[];
      extractionQuestions?: ExtractionQuestion[];
      shortEssayQuestions?: ShortEssayQuestion[];
    })
  | {
      id: string;
      blockType?: string;
      title?: string;
      note?: string;
      questions?: Array<ExamQuestion | BlockQuestion>;
      type?: string;
      poemTitle?: string;
      poet?: string;
      verses?: { shatrA: string; shatrB: string }[];
      constraints?: { maxLines?: number; minWords?: number; maxWords?: number };
      bodyText?: string;
      contextText?: string;
      prompt?: string;
      multipleChoiceQuestions?: MCQ[];
      extractionQuestions?: ExtractionQuestion[];
      shortEssayQuestions?: ShortEssayQuestion[];
    };

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

interface Question {
  id: string;
  lessonId: string;
  language: string;
  type: string;
  question?: string; // For simple questions
  questionTitle?: string; // For comprehensive questions
  arabicText?: string;
  essayRequirement?: string;
  mainQuestion?: string;
  options?: string[]; // For multipleChoice type
  correctAnswer?: number | boolean; // For multipleChoice and trueFalse
  multipleChoiceQuestions?: Array<{
    question: string;
    options: string[];
    correctAnswer: number;
  }>;
  extractionQuestions?: Array<{
    question: string;
    answer: string;
  }>;
  shortEssayQuestions?: Array<{
    question: string;
    answer: string;
  }>;
  grammarQuestions?: Array<{
    word: string;
    grammar: string;
    color: string;
  }>;
  sections?: Array<{
    id: string;
    blockType?: string;
    title?: string;
    note?: string;
    questions?: Array<{
      id: string;
      questionType: string;
      prompt?: string;
      question?: string;
      options?: string[];
      correctAnswer?: number | string;
      answer?: string;
      points?: number;
    }>;
  }>; // For comprehensive exam with usageScope === "lesson"
  blocks?: ExamBlock[]; // For arabic_comprehensive_exam
  usageScope?: "exam" | "lesson";
}

export default function LessonQuestionsPage() {
  const params = useParams();
  const lessonId = params.lessonId as string;
  const { user } = useAuth();
  
  const [questions, setQuestions] = useState<Question[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedQuestions, setExpandedQuestions] = useState<Record<string, boolean>>({});
  const [expandedBlocks, setExpandedBlocks] = useState<Record<string, boolean>>({});
  
  const [showResults, setShowResults] = useState<Record<string, boolean>>({});
  const [showCorrectAnswers, setShowCorrectAnswers] = useState<Record<string, boolean>>({});

  const {
    userAnswers,
    setUserAnswers,
    isLoading: sessionLoading,
    sessionId,
  } = useExamSession<Record<string, string | number | null>>(lessonId, user?.uid, {});

  const lesson = arabicLessons.find((l) => l.id === lessonId);

  useEffect(() => {
    const fetchQuestions = async () => {
      if (!lessonId) return;

      setLoading(true);
      try {
        // Fetch all Arabic questions for this lesson (not just arabic_comprehensive)
        const questionsData = await fetchQuestionsByLesson(
          "arabic",
          lessonId
        ) as Question[];

        setQuestions(questionsData);
        
        // Expand first question by default
        const initialExpanded: Record<string, boolean> = {};
        const initialExpandedBlocks: Record<string, boolean> = {};
        
        if (questionsData.length > 0) {
          initialExpanded[questionsData[0].id] = true;
          
          // Also expand first block of arabic_comprehensive_exam if it exists
          const firstQuestion = questionsData[0];
          if (firstQuestion.type === "arabic_comprehensive_exam" && (firstQuestion.blocks || firstQuestion.sections)) {
            const blocks = firstQuestion.blocks || firstQuestion.sections || [];
            if (blocks.length > 0) {
              const firstBlockId = blocks[0].id || `block_${firstQuestion.id}_0`;
              initialExpandedBlocks[firstBlockId] = true;
            }
          }
        }
        
        setExpandedQuestions(initialExpanded);
        setExpandedBlocks(initialExpandedBlocks);
        
      } catch (error) {
        console.error("Error fetching questions:", error);
        handleFirestoreError(error, "fetchQuestions");
      } finally {
        setLoading(false);
      }
    };

    fetchQuestions();
  }, [lessonId]);

  // Autosave progress for lesson practice using lessonId as examId
  useEffect(() => {
    if (!user || !lessonId) return;
    if (sessionLoading) return;

    const activeSessionId = sessionId || `${lessonId}-${user.uid}`;
    const controller = new AbortController();
    const timeoutId = setTimeout(async () => {
      try {
        await fetch("/api/save-progress", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            sessionId: activeSessionId,
            userId: user.uid,
            examId: lessonId,
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
  }, [lessonId, sessionId, sessionLoading, user, userAnswers]);

  const toggleQuestion = (questionId: string) => {
    setExpandedQuestions((prev) => ({
      ...prev,
      [questionId]: !prev[questionId],
    }));
  };

  const toggleBlock = (blockId: string) => {
    setExpandedBlocks((prev) => ({
      ...prev,
      [blockId]: !prev[blockId],
    }));
  };

  const handleMultipleChoiceAnswer = (questionId: string, mcqIndex: number, answerIndex: number) => {
    const key = `${questionId}_mcq_${mcqIndex}`;
    setUserAnswers((prev) => ({
      ...prev,
      [key]: answerIndex,
    }));
  };

  const handleExtractionAnswer = (questionId: string, extIndex: number, answer: string) => {
    const key = `${questionId}_ext_${extIndex}`;
    setUserAnswers((prev) => ({
      ...prev,
      [key]: answer,
    }));
  };

  const handleEssayAnswer = (questionId: string, essayIndex: number, answer: string) => {
    const key = `${questionId}_essay_${essayIndex}`;
    setUserAnswers((prev) => ({
      ...prev,
      [key]: answer,
    }));
  };

  const checkAnswers = (questionId: string) => {
    setShowResults((prev) => ({
      ...prev,
      [questionId]: true,
    }));
  };

  const showCorrectAnswersForQuestion = (questionId: string) => {
    setShowCorrectAnswers((prev) => ({
      ...prev,
      [questionId]: !prev[questionId],
    }));
  };

const getDir = (text: string) => (/[A-Za-z]/.test(text) ? "ltr" : "rtl");

const highlightWordsInText = (text: string, words: Array<{ word: string; color: string }>) => {
    if (!text || words.length === 0) return text;

    let highlightedText = text;
    const sortedWords = [...words]
      .filter(q => q.word && q.word.trim())
      .sort((a, b) => b.word.length - a.word.length);

    sortedWords.forEach((grammarQ) => {
      if (grammarQ.word) {
        const word = grammarQ.word.trim();
        const escapedWord = word.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        const regex = new RegExp(`(${escapedWord})`, 'g');
        
        highlightedText = highlightedText.replace(
          regex,
          `<mark class="bg-blue-200 dark:bg-blue-900/40 text-blue-900 dark:text-blue-100 border border-blue-300 dark:border-blue-700 px-1 py-0.5 rounded font-semibold inline-block">$1</mark>`
        );
      }
    });

    return highlightedText;
  };


  if (!lesson) {
    return (
      <div className="min-h-screen bg-white dark:bg-[#121218]" dir="rtl">
        <Navbar />
        <main className="container mx-auto px-4 py-8 text-center">
          <p className="text-gray-600 dark:text-gray-400">الدرس غير موجود</p>
          <Link href="/arabic" className="text-blue-600 dark:text-blue-400 mt-4 inline-block">
            العودة للصفحة السابقة
          </Link>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-linear-to-br from-gray-50 via-white to-gray-50 dark:from-[#121218] dark:via-[#0d0d12] dark:to-[#121218]" dir="rtl">
      <Navbar />
      
      <main className="container mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 max-w-6xl">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-10"
        >
          <Link
            href="/arabic"
            className="inline-flex items-center gap-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 transition-all duration-300 mb-6 group"
          >
            <ArrowRight className="h-4 w-4 group-hover:translate-x-[-4px] transition-transform" />
            <span className="text-sm font-medium">العودة للصفحة السابقة</span>
          </Link>
          
          <div className="flex items-center gap-4">
            <div className="p-4 rounded-xl bg-linear-to-br from-blue-500 to-cyan-500 shadow-lg shadow-blue-500/30">
              <BookOpen className="h-7 w-7 text-white" />
            </div>
            <div>
              <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-gray-900 dark:text-gray-100 mb-1">
                {lesson.title}
              </h1>
              <p className="text-sm sm:text-base text-gray-600 dark:text-gray-400 font-medium">
                {questions.length} سؤال
              </p>
            </div>
          </div>
        </motion.div>

        {/* Questions List */}
        {loading || sessionLoading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600 dark:text-gray-400">جاري تحميل الأسئلة...</p>
          </div>
        ) : questions.length === 0 ? (
          <div className="text-center py-12">
            <FileText className="h-16 w-16 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600 dark:text-gray-400 text-lg mb-2">
              لا توجد أسئلة متاحة لهذا الدرس
            </p>
            <Link
              href="/arabic"
              className="text-blue-600 dark:text-blue-400 hover:underline"
            >
              العودة للصفحة السابقة
            </Link>
          </div>
        ) : (
          <div className="space-y-6">
            {questions.map((question, index) => (
              <motion.div
                key={question.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className="bg-white dark:bg-[#1c1c24] rounded-2xl shadow-lg border border-gray-200 dark:border-[#2e2e3a] overflow-hidden"
                dir={getDir(
                  question.mainQuestion ||
                    question.arabicText ||
                    question.essayRequirement ||
                    ""
                )}
              >
                {/* Question Header */}
                <div
                  onClick={() => toggleQuestion(question.id)}
                  className="p-4 cursor-pointer hover:bg-gray-50 dark:hover:bg-[#252530] transition-colors"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="p-1.5 rounded-lg bg-blue-100 dark:bg-blue-900/30">
                        <FileText className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                      </div>
                      <div>
                        <h2 className="text-lg font-bold text-gray-900 dark:text-gray-100">
                          {question.questionTitle || question.mainQuestion || question.question || `السؤال ${index + 1}`}
                        </h2>
                        {question.type && (
                          <span className="text-xs text-gray-500 dark:text-gray-400 mt-1 block">
                            النوع: {question.type}
                          </span>
                        )}
                      </div>
                    </div>
                    {expandedQuestions[question.id] ? (
                      <ChevronUp className="h-4 w-4 text-gray-500" />
                    ) : (
                      <ChevronDown className="h-4 w-4 text-gray-500" />
                    )}
                  </div>
                </div>

                {/* Question Content */}
                <AnimatePresence>
                  {expandedQuestions[question.id] && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      exit={{ opacity: 0, height: 0 }}
                      className="px-4 pb-4 space-y-3"
                    >
                      {/* Simple Question Text (for simple question types) */}
                      {question.type === "essay" && question.question && (
                        <div className="p-3 rounded-lg bg-gray-50 dark:bg-[#252530] border border-gray-200 dark:border-[#2e2e3a]">
                          <h3 className="text-xs font-semibold text-gray-700 dark:text-gray-300 mb-2">
                            السؤال:
                          </h3>
                          <p className="text-sm text-gray-900 dark:text-gray-100" dir={getDir(question.question)}>
                            {question.question}
                          </p>
                        </div>
                      )}

                      {/* True/False Question */}
                      {question.type === "trueFalse" && question.question && question.correctAnswer !== undefined && (
                        <div className="space-y-2">
                          <h3 className="text-base font-bold text-gray-900 dark:text-gray-100 mb-3">
                            {question.question}
                          </h3>
                          <div className="space-y-2">
                            {[true, false].map((value, idx) => {
                              const answerKey = `${question.id}_truefalse`;
                              const userAnswer = userAnswers[answerKey];
                              const isSelected = userAnswer === (value ? 1 : 0);
                              const isCorrect = (question.correctAnswer as boolean) === value;
                              const showResult = showResults[question.id];
                              let bgClass = "bg-white dark:bg-[#1c1c24] border-2 border-gray-200 dark:border-[#2e2e3a]";
                              
                              if (showResult) {
                                if (isCorrect) {
                                  bgClass = "bg-green-100 dark:bg-green-900/30 border-2 border-green-500 dark:border-green-600";
                                } else if (isSelected && !isCorrect) {
                                  bgClass = "bg-red-100 dark:bg-red-900/30 border-2 border-red-500 dark:border-red-600";
                                }
                              } else if (isSelected) {
                                bgClass = "bg-blue-100 dark:bg-blue-900/30 border-2 border-blue-500 dark:border-blue-600";
                              }
                              
                              return (
                                <div
                                  key={idx}
                                  onClick={() => !showResult && setUserAnswers(prev => ({ ...prev, [answerKey]: value ? 1 : 0 }))}
                                  className={`p-3 rounded-lg flex items-center gap-2 cursor-pointer transition-all ${bgClass}`}
                                >
                                  <input
                                    type="radio"
                                    name={`${question.id}_truefalse`}
                                    checked={isSelected}
                                    onChange={() => !showResult && setUserAnswers(prev => ({ ...prev, [answerKey]: value ? 1 : 0 }))}
                                    className="h-4 w-4 text-blue-600"
                                    disabled={showResult}
                                  />
                                  <span className="text-gray-900 dark:text-gray-100">
                                    {value ? "صحيح" : "خطأ"}
                                  </span>
                                  {showResult && isCorrect && (
                                    <CheckCircle2 className="h-5 w-5 text-green-600 dark:text-green-400 ml-auto" />
                                  )}
                                  {showResult && isSelected && !isCorrect && (
                                    <XCircle className="h-5 w-5 text-red-600 dark:text-red-400 ml-auto" />
                                  )}
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      )}

                      {/* Arabic Text */}
                      {question.arabicText && (
                        <div className="p-3 rounded-lg bg-gray-50 dark:bg-[#252530] border border-gray-200 dark:border-[#2e2e3a]">
                          <h3 className="text-xs font-semibold text-gray-700 dark:text-gray-300 mb-2">
                            النص العربي:
                          </h3>
                          <div
                            className="font-arabic text-base leading-relaxed text-gray-900 dark:text-gray-100"
                            dir={getDir(question.arabicText || "")}
                            dangerouslySetInnerHTML={{
                              __html: question.grammarQuestions && question.grammarQuestions.length > 0
                                ? highlightWordsInText(
                                    question.arabicText,
                                    question.grammarQuestions
                                  )
                                : question.arabicText
                            }}
                          />
                        </div>
                      )}

                      {/* Essay Requirement */}
                      {question.essayRequirement && (
                        <div className="p-3 rounded-lg bg-gray-50 dark:bg-[#252530] border border-gray-200 dark:border-[#2e2e3a]">
                          <h3 className="text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                            المطلوب من الطالب:
                          </h3>
                          <p className="text-sm text-gray-900 dark:text-gray-100" dir={getDir(question.essayRequirement || "")}>
                            {question.essayRequirement}
                          </p>
                        </div>
                      )}

                      {/* Multiple Choice Questions */}
                      {question.multipleChoiceQuestions && question.multipleChoiceQuestions.length > 0 && (
                        <div className="space-y-2">
                          <h3 className="text-base font-bold text-gray-900 dark:text-gray-100" dir={getDir("أسئلة الاختيار من متعدد")}>
                            أسئلة الاختيار من متعدد:
                          </h3>
                          {question.multipleChoiceQuestions.map((mcq, mcqIndex) => {
                            const answerKey = `${question.id}_mcq_${mcqIndex}`;
                            const userAnswer = userAnswers[answerKey];
                            const isCorrect = userAnswer === mcq.correctAnswer;
                            const showResult = showResults[question.id];
                            
                            return (
                              <div
                                key={mcqIndex}
                                className="p-3 rounded-lg bg-gray-50 dark:bg-[#252530] border border-gray-200 dark:border-[#2e2e3a]"
                              >
                                <p className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-2" dir={getDir(mcq.question)}>
                                  {mcqIndex + 1}. {mcq.question}
                                </p>
                                <div className="space-y-1.5">
                                  {mcq.options.map((option, optIndex) => {
                                    const isSelected = userAnswer === optIndex;
                                    const isCorrectAnswer = mcq.correctAnswer === optIndex;
                                    let bgClass = "bg-white dark:bg-[#1c1c24] border border-gray-200 dark:border-[#2e2e3a]";
                                    
                                    if (showResult) {
                                      if (isCorrectAnswer) {
                                        bgClass = "bg-green-100 dark:bg-green-900/30 border border-green-300 dark:border-green-700";
                                      } else if (isSelected && !isCorrectAnswer) {
                                        bgClass = "bg-red-100 dark:bg-red-900/30 border border-red-300 dark:border-red-700";
                                      }
                                    } else if (isSelected) {
                                      bgClass = "bg-blue-100 dark:bg-blue-900/30 border border-blue-300 dark:border-blue-700";
                                    }
                                    
                                    return (
                                      <div
                                        key={optIndex}
                                        onClick={() => !showResult && handleMultipleChoiceAnswer(question.id, mcqIndex, optIndex)}
                                        className={`p-2 rounded-lg flex items-center gap-2 cursor-pointer transition-all ${
                                          !showResult ? "hover:bg-gray-100 dark:hover:bg-[#2a2a35]" : ""
                                        } ${bgClass}`}
                                      >
                                        <input
                                          type="radio"
                                          name={`${question.id}_mcq_${mcqIndex}`}
                                          checked={isSelected}
                                          onChange={() => !showResult && handleMultipleChoiceAnswer(question.id, mcqIndex, optIndex)}
                                          className="h-4 w-4 text-blue-600"
                                          disabled={showResult}
                                        />
                                        {showResult && isCorrectAnswer && (
                                          <CheckCircle2 className="h-5 w-5 text-green-600 dark:text-green-400 shrink-0" />
                                        )}
                                        {showResult && isSelected && !isCorrectAnswer && (
                                          <XCircle className="h-5 w-5 text-red-600 dark:text-red-400 shrink-0" />
                                        )}
                                        <span className="text-gray-900 dark:text-gray-100 flex-1" dir={getDir(option)}>
                                          {String.fromCharCode(65 + optIndex)}. {option}
                                        </span>
                                      </div>
                                    );
                                  })}
                                </div>
                                {showResult && (
                                  <div className={`mt-2 p-1.5 rounded flex items-center gap-1.5 ${
                                    isCorrect 
                                      ? "bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-200"
                                      : "bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-200"
                                  }`}>
                                    {isCorrect ? (
                                      <>
                                        <CheckCircle2 className="h-3.5 w-3.5" />
                                        <span className="text-xs font-medium">صحيح</span>
                                      </>
                                    ) : (
                                      <>
                                        <XCircle className="h-3.5 w-3.5" />
                                        <span className="text-xs font-medium">خاطئ</span>
                                      </>
                                    )}
                                  </div>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      )}

                      {/* Extraction Questions */}
                      {question.extractionQuestions && question.extractionQuestions.length > 0 && (
                        <div className="space-y-2">
                          <h3 className="text-base font-bold text-gray-900 dark:text-gray-100" dir={getDir("أسئلة الاستخراج")}>
                            أسئلة الاستخراج:
                          </h3>
                          {question.extractionQuestions.map((ext, extIndex) => {
                            const answerKey = `${question.id}_ext_${extIndex}`;
                            const userAnswer = String(userAnswers[answerKey] || "");
                            const showResult = showResults[question.id];
                            const showCorrect = showCorrectAnswers[question.id];
                            const isCorrect = userAnswer.trim().toLowerCase() === ext.answer.trim().toLowerCase();
                            
                            return (
                              <div
                                key={extIndex}
                                className="p-3 rounded-lg bg-gray-50 dark:bg-[#252530] border border-gray-200 dark:border-[#2e2e3a]"
                              >
                                <p className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-2" dir={getDir(ext.question)}>
                                  {extIndex + 1}. {ext.question}
                                </p>
                                <Input
                                  type="text"
                                  value={userAnswer}
                                  onChange={(e) => handleExtractionAnswer(question.id, extIndex, e.target.value)}
                                  placeholder="اكتب إجابتك هنا..."
                                  disabled={showResult}
                                  className="mb-2 text-sm"
                                />
                                {showResult && (
                                  <div className={`p-2 rounded mb-1.5 flex items-center gap-1.5 ${
                                    isCorrect 
                                      ? "bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-200"
                                      : "bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-200"
                                  }`}>
                                    {isCorrect ? (
                                      <>
                                        <CheckCircle2 className="h-3.5 w-3.5 text-green-600 dark:text-green-400" />
                                        <span className="text-xs font-medium">صحيح</span>
                                      </>
                                    ) : (
                                      <>
                                        <XCircle className="h-3.5 w-3.5 text-red-600 dark:text-red-400" />
                                        <span className="text-xs font-medium">خاطئ</span>
                                      </>
                                    )}
                                  </div>
                                )}
                                {showCorrect && (
                                  <div className="mt-1.5 p-2 rounded bg-blue-100 dark:bg-blue-900/30 border border-blue-300 dark:border-blue-700">
                                    <p className="text-xs font-medium text-blue-800 dark:text-blue-200 mb-0.5">
                                      الإجابة الصحيحة:
                                    </p>
                                    <p className="text-sm text-blue-900 dark:text-blue-100" dir={getDir(ext.answer)}>
                                      {ext.answer}
                                    </p>
                                  </div>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      )}

                      {/* Short Essay Questions */}
                      {question.shortEssayQuestions && question.shortEssayQuestions.length > 0 && (
                        <div className="space-y-2">
                          <h3 className="text-base font-bold text-gray-900 dark:text-gray-100" dir={getDir("الأسئلة المقالية القصيرة")}>
                            الأسئلة المقالية القصيرة:
                          </h3>
                          {question.shortEssayQuestions.map((essay, essayIndex) => {
                            const answerKey = `${question.id}_essay_${essayIndex}`;
                            const userAnswer = userAnswers[answerKey] || "";
                            const showCorrect = showCorrectAnswers[question.id];
                            
                            return (
                              <div
                                key={essayIndex}
                                className="p-3 rounded-lg bg-gray-50 dark:bg-[#252530] border border-gray-200 dark:border-[#2e2e3a]"
                              >
                                <p className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-2" dir={getDir(essay.question)}>
                                  {essayIndex + 1}. {essay.question}
                                </p>
                                <Textarea
                                  value={userAnswer}
                                  onChange={(e) => handleEssayAnswer(question.id, essayIndex, e.target.value)}
                                  placeholder="اكتب إجابتك هنا..."
                                  rows={3}
                                  disabled={showResults[question.id]}
                                  className="mb-2 text-sm"
                                />
                                {showCorrect && (
                                  <div className="mt-1.5 p-2 rounded bg-blue-100 dark:bg-blue-900/30 border border-blue-300 dark:border-blue-700">
                                    <p className="text-xs font-medium text-blue-800 dark:text-blue-200 mb-0.5">
                                      الإجابة النموذجية:
                                    </p>
                                    <p className="text-sm text-blue-900 dark:text-blue-100 leading-relaxed" dir={getDir(essay.answer)}>
                                      {essay.answer}
                                    </p>
                                  </div>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      )}

                      {/* Grammar Questions */}
                      {question.grammarQuestions && question.grammarQuestions.length > 0 && (
                        <div className="space-y-2">
                          <h3 className="text-base font-bold text-gray-900 dark:text-gray-100" dir={getDir("أسئلة الإعراب")}>
                            أسئلة الإعراب:
                          </h3>
                          {question.grammarQuestions.map((grammar, gramIndex) => {
                            const answerKey = `${question.id}_gram_${gramIndex}`;
                            const userAnswer = userAnswers[answerKey] || "";
                            const showCorrect = showCorrectAnswers[question.id];
                            
                            return (
                              <div
                                key={gramIndex}
                                className="p-3 rounded-lg bg-gray-50 dark:bg-[#252530] border border-gray-200 dark:border-[#2e2e3a]"
                              >
                                <div className="flex items-center gap-2 mb-2">
                                  <span className="px-2 py-0.5 rounded text-sm bg-blue-200 dark:bg-blue-900/40 text-blue-900 dark:text-blue-100 border border-blue-300 dark:border-blue-700 font-semibold">
                                    {grammar.word}
                                  </span>
                                </div>
                                <Textarea
                                  value={userAnswer}
                                  onChange={(e) => {
                                    const key = `${question.id}_gram_${gramIndex}`;
                                    setUserAnswers((prev) => ({
                                      ...prev,
                                      [key]: e.target.value,
                                    }));
                                  }}
                                  placeholder="اكتب إعراب الكلمة هنا..."
                                  rows={2}
                                  disabled={showResults[question.id]}
                                  className="mb-2 text-sm"
                                />
                                {showCorrect && (
                                  <div className="mt-1.5 p-2 rounded bg-green-100 dark:bg-green-900/30 border border-green-300 dark:border-green-700">
                                    <p className="text-xs font-medium text-green-800 dark:text-green-200 mb-0.5">
                                      الإعراب الصحيح:
                                    </p>
                                    <p className="text-sm text-green-900 dark:text-green-100" dir={getDir(grammar.grammar)}>
                                      {grammar.grammar}
                                    </p>
                                  </div>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      )}

                      {/* Comprehensive Exam Blocks (for arabic_comprehensive_exam with usageScope === "lesson") */}
                      {question.type === "arabic_comprehensive_exam" && (question.blocks || question.sections) && (
                        <div className="space-y-4">
                          <div className="flex items-center gap-2 pb-2 border-b border-gray-200 dark:border-[#2e2e3a]">
                            <FileText className="h-5 w-5 text-orange-600 dark:text-orange-400" />
                            <h3 className="text-base font-bold text-gray-900 dark:text-gray-100">
                              مقاطع الامتحان
                            </h3>
                            <span className="ml-auto text-xs text-gray-500 dark:text-gray-400">
                              {(question.blocks || question.sections || []).length} {((question.blocks || question.sections || []).length === 1 ? 'مقطع' : 'مقاطع')}
                            </span>
                          </div>
                          {((question.blocks || question.sections || []) as LessonBlock[]).map((block, blockIndex: number) => {
                            const blockId = block.id || `block_${question.id}_${blockIndex}`;
                            const blockType =
                              (block as { type?: string; blockType?: string }).type ||
                              (block as { type?: string; blockType?: string }).blockType;
                            const isExpanded = expandedBlocks[blockId];
                            const showResult = showResults[question.id];
                            const showCorrect = showCorrectAnswers[question.id];

                            return (
                              <motion.div
                                key={blockId}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: blockIndex * 0.05 }}
                                className="bg-gray-50 dark:bg-[#252530] rounded-xl border border-gray-200 dark:border-[#2e2e3a] overflow-hidden"
                              >
                                {/* Block Header */}
                                <div
                                  onClick={() => toggleBlock(blockId)}
                                  className="p-4 cursor-pointer hover:bg-gray-100 dark:hover:bg-[#2a2a35] transition-colors"
                                >
                                  <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                      <div className="p-2 rounded-lg bg-orange-100 dark:bg-orange-900/30">
                                        <span className="text-sm font-bold text-orange-700 dark:text-orange-300">
                                          {blockIndex + 1}
                                        </span>
                                      </div>
                                      <div>
                                        <h4 className="text-base font-bold text-gray-900 dark:text-gray-100">
                                          {block.title || `المقطع ${blockIndex + 1}`}
                                        </h4>
                                        {block.note && (
                                          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                                            {block.note}
                                          </p>
                                        )}
                                        {blockType && (
                                          <span className="text-xs px-2 py-1 rounded bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-300 mt-1 inline-block">
                                            {blockType === "reading_passage" ? "نص قراءة" : 
                                             blockType === "poetry_text" ? "نص شعري" :
                                             blockType === "grammar_block" ? "نحو/قواعد" :
                                             "تعبير"}
                                          </span>
                                        )}
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
                                      className="px-4 pb-4 space-y-4"
                                    >
                                      {/* Reading Passage Body Text */}
                                      {blockType === "reading_passage" && "bodyText" in block && block.bodyText && (
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
                                      {blockType === "poetry_text" && "verses" in block && Array.isArray(block.verses) && block.verses.length > 0 && (
                                        <div className="p-4 rounded-lg bg-gray-50 dark:bg-[#252530] border border-gray-200 dark:border-[#2e2e3a]">
                                          {block.poemTitle && (
                                            <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                                              {block.poemTitle}
                                            </h4>
                                          )}
                                          {blockType === "poetry_text" && "poet" in block && block.poet && (
                                            <p className="text-xs text-gray-600 dark:text-gray-400 mb-3">
                                              {block.poet}
                                            </p>
                                          )}
                                          <div className="space-y-2">
                                            {block.verses.map((verse: { shatrA: string; shatrB: string }, vIdx: number) => (
                                              <div key={vIdx} className="font-arabic text-base leading-relaxed text-gray-900 dark:text-gray-100" dir="rtl">
                                                <p>{verse.shatrA}</p>
                                                <p>{verse.shatrB}</p>
                                              </div>
                                            ))}
                                          </div>
                                        </div>
                                      )}

                                      {/* Grammar Context Text */}
                                      {blockType === "grammar_block" && block.contextText && (
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
                                      {blockType === "expression_block" && block.prompt && (
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

                                      {/* Multiple Choice Questions in Block (direct) - OLD FORMAT */}
                                      {block.multipleChoiceQuestions && block.multipleChoiceQuestions.length > 0 && (
                                        <div className="space-y-3">
                                          <h4 className="text-base font-bold text-gray-900 dark:text-gray-100">
                                            أسئلة الاختيار من متعدد:
                                          </h4>
                                          {("multipleChoiceQuestions" in block) && block.multipleChoiceQuestions && block.multipleChoiceQuestions.map((mcq: MCQ, mcqIndex: number) => {
                                            const answerKey = `${blockId}_mcq_${mcqIndex}`;
                                            const userAnswer = userAnswers[answerKey];
                                            const isCorrect = userAnswer === mcq.correctAnswer;
                                            const showAnswer = showResult || showCorrect;

                                            return (
                                              <div key={mcqIndex} className="p-3 rounded-lg bg-white dark:bg-[#1c1c24] border border-gray-200 dark:border-[#2e2e3a]">
                                                <p className="font-medium text-gray-900 dark:text-gray-100 mb-3" dir="rtl">
                                                  {mcqIndex + 1}. {mcq.question}
                                                </p>
                                                <div className="space-y-2">
                                                  {mcq.options && mcq.options.map((opt: string, optIndex: number) => {
                                                    const isSelected = userAnswer === optIndex;
                                                    const isCorrectOption = optIndex === mcq.correctAnswer;
                                                    let bgClass = "bg-white dark:bg-[#1c1c24] border border-gray-200 dark:border-[#2e2e3a]";
                                                    
                                                    if (showAnswer) {
                                                      if (isCorrectOption) {
                                                        bgClass = "bg-green-100 dark:bg-green-900/30 border border-green-300 dark:border-green-700";
                                                      } else if (isSelected && !isCorrect) {
                                                        bgClass = "bg-red-100 dark:bg-red-900/30 border border-red-300 dark:border-red-700";
                                                      }
                                                    } else if (isSelected) {
                                                      bgClass = "bg-blue-100 dark:bg-blue-900/30 border border-blue-300 dark:border-blue-700";
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
                                                          className="h-4 w-4 text-blue-600"
                                                          disabled={showAnswer}
                                                        />
                                                        <span className="text-gray-900 dark:text-gray-100 flex-1" dir="rtl">
                                                          {String.fromCharCode(65 + optIndex)}. {opt}
                                                        </span>
                                                        {showAnswer && isCorrectOption && (
                                                          <CheckCircle2 className="h-5 w-5 text-green-600 dark:text-green-400" />
                                                        )}
                                                        {showAnswer && isSelected && !isCorrect && (
                                                          <XCircle className="h-5 w-5 text-red-600 dark:text-red-400" />
                                                        )}
                                                      </div>
                                                    );
                                                  })}
                                                </div>
                                              </div>
                                            );
                                          })}
                                        </div>
                                      )}

                                      {/* Extraction Questions in Block */}
                                      {block.extractionQuestions && block.extractionQuestions.length > 0 && (
                                        <div className="space-y-3">
                                          <h4 className="text-base font-bold text-gray-900 dark:text-gray-100">
                                            أسئلة الاستخراج:
                                          </h4>
                                          {block.extractionQuestions && block.extractionQuestions.map((ext: ExtractionQuestion, extIndex: number) => {
                                            const answerKey = `${blockId}_ext_${extIndex}`;
                                            const userAnswer = String(userAnswers[answerKey] || "");
                                            const showAnswer = showResult || showCorrect;

                                            return (
                                              <div key={extIndex} className="p-3 rounded-lg bg-white dark:bg-[#1c1c24] border border-gray-200 dark:border-[#2e2e3a]">
                                                <p className="font-medium text-gray-900 dark:text-gray-100 mb-2" dir="rtl">
                                                  {extIndex + 1}. {ext.question}
                                                </p>
                                                <Input
                                                  type="text"
                                                  value={userAnswer}
                                                  onChange={(e) => setUserAnswers(prev => ({ ...prev, [answerKey]: e.target.value }))}
                                                  placeholder="اكتب إجابتك هنا..."
                                                  disabled={showAnswer}
                                                  className="w-full"
                                                  dir="rtl"
                                                />
                                                {showCorrect && ext.answer && (
                                                  <div className="mt-2 p-2 rounded-lg bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800">
                                                    <p className="text-xs font-semibold text-green-700 dark:text-green-300 mb-1">
                                                      الإجابة الصحيحة:
                                                    </p>
                                                    <p className="text-sm text-green-900 dark:text-green-100" dir="rtl">{ext.answer}</p>
                                                  </div>
                                                )}
                                              </div>
                                            );
                                          })}
                                        </div>
                                      )}

                                      {/* Short Essay Questions in Block */}
                                      {block.shortEssayQuestions && block.shortEssayQuestions.length > 0 && (
                                        <div className="space-y-3">
                                          <h4 className="text-base font-bold text-gray-900 dark:text-gray-100">
                                            أسئلة المقال القصير:
                                          </h4>
                                          {block.shortEssayQuestions && block.shortEssayQuestions.map((essay: ShortEssayQuestion, essayIndex: number) => {
                                            const answerKey = `${blockId}_essay_${essayIndex}`;
                                            const userAnswer = String(userAnswers[answerKey] || "");
                                            const showAnswer = showResult || showCorrect;

                                            return (
                                              <div key={essayIndex} className="p-3 rounded-lg bg-white dark:bg-[#1c1c24] border border-gray-200 dark:border-[#2e2e3a]">
                                                <p className="font-medium text-gray-900 dark:text-gray-100 mb-2" dir="rtl">
                                                  {essayIndex + 1}. {essay.question}
                                                </p>
                                                <Textarea
                                                  value={userAnswer}
                                                  onChange={(e) => setUserAnswers(prev => ({ ...prev, [answerKey]: e.target.value }))}
                                                  placeholder="اكتب إجابتك هنا..."
                                                  rows={4}
                                                  disabled={showAnswer}
                                                  className="w-full"
                                                  dir="rtl"
                                                />
                                                {showCorrect && essay.answer && (
                                                  <div className="mt-2 p-2 rounded-lg bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800">
                                                    <p className="text-xs font-semibold text-green-700 dark:text-green-300 mb-1">
                                                      الإجابة النموذجية:
                                                    </p>
                                                    <p className="text-sm text-green-900 dark:text-green-100 leading-relaxed" dir="rtl">{essay.answer}</p>
                                                  </div>
                                                )}
                                              </div>
                                            );
                                          })}
                                        </div>
                                      )}

                                      {/* Questions Array in Block */}
                                      {block.questions && block.questions.length > 0 && (
                                        <div className="space-y-4">
                                          {(block.questions as Array<ExamQuestion | BlockQuestion>).map((q, qIndex: number) => {
                                            const answerKey = `${blockId}_q_${q.id || qIndex}`;
                                            const userAnswer = userAnswers[answerKey];
                                            const showAnswer = showResult || showCorrect;
                                            const isExamQuestion = "type" in q;
                                            const questionLabel =
                                              isExamQuestion && q.type === "mcq"
                                                ? q.stem
                                                : "prompt" in q && q.prompt
                                                ? q.prompt
                                                : "question" in q && q.question
                                                ? q.question
                                                : "السؤال";

                                            return (
                                              <div key={q.id || qIndex} className="p-3 rounded-lg bg-white dark:bg-[#1c1c24] border border-gray-200 dark:border-[#2e2e3a]">
                                                <p className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-3" dir="rtl">
                                                  {qIndex + 1}. {questionLabel}
                                                </p>
                                                
                                                {/* Multiple Choice Question */}
                                                {isExamQuestion && q.type === "mcq" && q.options && q.options.length > 0 && (
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
                                                        bgClass = "bg-blue-100 dark:bg-blue-900/30 border border-blue-300 dark:border-blue-700";
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
                                                            className="h-4 w-4 text-blue-600"
                                                            disabled={showAnswer}
                                                          />
                                                          <span className="text-gray-900 dark:text-gray-100 flex-1">
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
                                                {isExamQuestion && q.type === "maqali" && (
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
                                                {isExamQuestion && q.type === "comparison_story" && (
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
                                                {isExamQuestion && q.type === "rhetoric" && (
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
                                                {isExamQuestion && q.type === "grammar_extraction" && (
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
                                                {showCorrect && isExamQuestion && "correctAnswer" in q && q.correctAnswer && (
                                                  <div className="mt-3 p-3 rounded-lg bg-blue-100 dark:bg-blue-900/30 border border-blue-300 dark:border-blue-700">
                                                    <p className="text-xs font-medium text-blue-800 dark:text-blue-200 mb-1">
                                                      الإجابة الصحيحة:
                                                    </p>
                                                    <p className="text-sm text-blue-900 dark:text-blue-100" dir="rtl">
                                                      {q.correctAnswer}
                                                    </p>
                                                  </div>
                                                )}
                                                
                                                {/* Show Model Answer Keywords */}
                                                {showCorrect && isExamQuestion && "modelAnswerKeywords" in q && q.modelAnswerKeywords && q.modelAnswerKeywords.length > 0 && (
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
                                    </motion.div>
                                  )}
                                </AnimatePresence>
                              </motion.div>
                            );
                          })}
                        </div>
                      )}

                      {/* Action Buttons */}
                      <div className="flex gap-2 pt-3 border-t border-gray-200 dark:border-[#2e2e3a]">
                        {!showResults[question.id] ? (
                          <Button
                            onClick={() => checkAnswers(question.id)}
                            className="flex-1 text-sm py-2"
                          >
                            <Check className="h-4 w-4 ml-2" />
                            التحقق من الإجابات
                          </Button>
                        ) : (
                          <Button
                            onClick={() => showCorrectAnswersForQuestion(question.id)}
                            variant="outline"
                            className="flex-1 text-sm py-2"
                          >
                            {showCorrectAnswers[question.id] ? "إخفاء" : "عرض"} الإجابات الصحيحة
                          </Button>
                        )}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            ))}
          </div>
        )}
      </main>

      <SelectionTranslator />
      <Footer />
    </div>
  );
}

