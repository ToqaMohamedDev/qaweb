"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import {
  BookOpen,
  ArrowRight,
  ChevronDown,
  ChevronUp,
  CheckCircle2,
  XCircle,
  FileText,
  Languages,
  PenTool,
  Eye,
  EyeOff,
  ClipboardList,
} from "lucide-react";
import { Textarea } from "@/components/Textarea";
import { Button } from "@/components/Button";
import { fetchQuestionsByLesson, handleFirestoreError } from "@/lib/firebaseUtils";
import { SelectionTranslator } from "@/components/SelectionTranslator";
import { useAuth } from "@/contexts/AuthContext";
import { useExamSession } from "@/hooks/useExamSession";

const englishLessons = [
  { id: "eng_lesson1_voc_gram_001", title: "Lesson 1 - Vocabulary and Grammar" },
  { id: "eng_lesson2_vocab_002", title: "Lesson 2 - Vocabulary" },
  { id: "eng_lesson3_reading_003", title: "Lesson 3 - Reading Comprehension" },
  { id: "eng_lesson4_translation_004", title: "Lesson 4 - Translation" },
  { id: "eng_lesson5_literature_005", title: "Lesson 5 - Literature: Great Expectations" },
  { id: "eng_lesson6_essay_006", title: "Lesson 6 - Essay Writing: Travel Destination" },
];

interface MCQ {
  id?: string;
  question: string;
  options: string[];
  correctAnswer: number;
  points?: number;
  explanation?: string;
}

interface TranslationQuestion {
  id?: string;
  originalText: string;
  translationDirection: "en-to-ar" | "ar-to-en";
  options?: string[];
  correctAnswer?: number;
  explanation?: string;
}

interface EssayQuestion {
  id?: string;
  question: string;
  modelAnswer?: string;
  type?: "essay" | "story";
}

interface ExamSection {
  id: string;
  sectionType?: "vocabulary_grammar" | "advanced_writing" | "reading" | "translation" | "essay";
  title?: string;
  note?: string;
  questionData?: {
    readingPassage?: string;
    multipleChoiceQuestions?: MCQ[];
    translationQuestions?: TranslationQuestion[];
    essayQuestions?: EssayQuestion[];
  };
  vocabularyQuestions?: MCQ[];
  chooseTwoQuestions?: Array<{
    id: string;
    question: string;
    options: string[];
    correctAnswer: number[];
    points: number;
  }>;
  writingMechanicsQuestions?: MCQ[];
  readingPassages?: Array<{
    id: string;
    passage: string;
    questions: MCQ[];
  }>;
  translationQuestions?: TranslationQuestion[];
  essayQuestions?: EssayQuestion[];
}

interface Question {
  id: string;
  lessonId: string;
  language: string;
  type: string;
  questionTitle?: string;
  questionSubtitle?: string;
  question?: string; // Fallback for older questions
  readingPassage?: string;
  multipleChoiceQuestions?: MCQ[];
  translationQuestions?: TranslationQuestion[];
  essayQuestions?: EssayQuestion[];
  sections?: ExamSection[]; // For comprehensive exams
  usageScope?: "exam" | "lesson";
}

const getDir = (text: string) => (/[ء-ي]/.test(text) ? "rtl" : "ltr");

export default function EnglishLessonQuestionsPage() {
  const params = useParams();
  const lessonId = params.lessonId as string;
  const { user } = useAuth();
  
  const [questions, setQuestions] = useState<Question[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedQuestions, setExpandedQuestions] = useState<Record<string, boolean>>({});
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({});
  const [showResults, setShowResults] = useState<Record<string, boolean>>({});
  const [showCorrectAnswers, setShowCorrectAnswers] = useState<Record<string, boolean>>({});
  const [showExplanations, setShowExplanations] = useState<Record<string, boolean>>({});

  const {
    userAnswers,
    setUserAnswers,
    isLoading: sessionLoading,
    sessionId,
  } = useExamSession<Record<string, string | number | null>>(lessonId, user?.uid, {});

  const lesson = englishLessons.find((l) => l.id === lessonId);

  useEffect(() => {
    const fetchQuestions = async () => {
      if (!lessonId) return;

      setLoading(true);
      try {
        const fetchedQuestions = await fetchQuestionsByLesson(
          "english",
          lessonId
        ) as Question[];
        
        // Keep all questions - don't filter them out
        setQuestions(fetchedQuestions);
        
        // Auto-expand first question
        if (fetchedQuestions.length > 0) {
          setExpandedQuestions({ [fetchedQuestions[0].id]: true });
        }
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

  const toggleSection = (sectionId: string) => {
    setExpandedSections((prev) => ({
      ...prev,
      [sectionId]: !prev[sectionId],
    }));
  };

  const toggleShowResults = (questionId: string) => {
    setShowResults((prev) => ({
      ...prev,
      [questionId]: !prev[questionId],
    }));
  };

  const toggleShowCorrectAnswers = (questionId: string) => {
    setShowCorrectAnswers((prev) => ({
      ...prev,
      [questionId]: !prev[questionId],
    }));
  };

  const toggleShowExplanations = (questionId: string) => {
    setShowExplanations((prev) => ({
      ...prev,
      [questionId]: !prev[questionId],
    }));
  };

  const handleMultipleChoiceAnswer = (sectionId: string, questionIndex: number, optionIndex: number) => {
    const answerKey = `${sectionId}_mcq_${questionIndex}`;
    setUserAnswers((prev) => ({
      ...prev,
      [answerKey]: optionIndex,
    }));
  };

  const handleTranslationAnswer = (sectionId: string, questionIndex: number, answer: string) => {
    const answerKey = `${sectionId}_trans_${questionIndex}`;
    setUserAnswers((prev) => ({
      ...prev,
      [answerKey]: answer,
    }));
  };

  const handleEssayAnswer = (sectionId: string, questionIndex: number, answer: string) => {
    const answerKey = `${sectionId}_essay_${questionIndex}`;
    setUserAnswers((prev) => ({
      ...prev,
      [answerKey]: answer,
    }));
  };

  if (!lesson) {
    return (
      <div className="min-h-screen bg-white dark:bg-[#121218]" dir="rtl">
        <Navbar />
        <main className="container mx-auto px-4 py-8 text-center">
          <p className="text-gray-600 dark:text-gray-400">Lesson not found</p>
          <Link href="/english" className="text-primary-600 dark:text-primary-400 mt-4 inline-block">
            Go back
          </Link>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-50 dark:from-[#121218] dark:via-[#0d0d12] dark:to-[#121218]" dir="rtl">
      <Navbar />
      
      <main className="container mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 max-w-6xl">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-10"
        >
          <Link
            href="/english"
            className="inline-flex items-center gap-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 transition-all duration-300 mb-6 group"
          >
            <ArrowRight className="h-4 w-4 group-hover:translate-x-[-4px] transition-transform" />
            <span className="text-sm font-medium">Go back</span>
          </Link>
          
          <div className="flex items-center gap-4">
            <div className="p-4 rounded-xl bg-gradient-to-br from-primary-500 to-primary-500 shadow-lg shadow-primary-500/30">
              <BookOpen className="h-7 w-7 text-white" />
            </div>
            <div>
              <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-gray-900 dark:text-gray-100 mb-1">
                {lesson.title}
              </h1>
              <p className="text-sm sm:text-base text-gray-600 dark:text-gray-400 font-medium">
                {questions.length} {questions.length === 1 ? 'Question' : 'Questions'}
              </p>
            </div>
          </div>
        </motion.div>

        {/* Questions List */}
        {loading || sessionLoading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4"></div>
            <p className="text-gray-600 dark:text-gray-400">Loading questions...</p>
          </div>
        ) : questions.length === 0 ? (
          <div className="text-center py-12">
            <BookOpen className="h-16 w-16 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600 dark:text-gray-400 text-lg mb-2">
              No questions available for this lesson
            </p>
            <Link
              href="/english"
              className="text-primary-600 dark:text-primary-400 hover:underline"
            >
              Go back
            </Link>
          </div>
        ) : (
          <div className="space-y-6">
            {questions.length === 0 ? (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-center py-12 bg-white dark:bg-[#1c1c24] rounded-2xl border border-gray-200 dark:border-[#2e2e3a]"
              >
                <BookOpen className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600 dark:text-gray-400 text-lg mb-2">
                  No questions available for this lesson yet
                </p>
                <p className="text-sm text-gray-500 dark:text-gray-500">
                  Check back later or contact your instructor
                </p>
              </motion.div>
            ) : (
              questions.map((question, index) => {
                const questionType = question.type || "";
                const hasReading = !!question.readingPassage;
                const hasMCQ = question.multipleChoiceQuestions && question.multipleChoiceQuestions.length > 0;
                const hasTranslation = question.translationQuestions && question.translationQuestions.length > 0;
                const hasEssay = question.essayQuestions && question.essayQuestions.length > 0;
                
                // Don't skip questions - show them even if empty with a message
              
              // Determine question type based on type field or content
              const getQuestionTypeIcon = () => {
                if (questionType === "english_reading" || hasReading) return <FileText className="h-5 w-5" />;
                if (questionType === "english_translation" || hasTranslation) return <Languages className="h-5 w-5" />;
                if (questionType === "english_literature" || questionType === "english_essay" || hasEssay) return <PenTool className="h-5 w-5" />;
                if (questionType === "english_comprehensive" || hasMCQ) return <BookOpen className="h-5 w-5" />;
                return <BookOpen className="h-5 w-5" />;
              };
              
              const getQuestionTypeLabel = () => {
                if (questionType === "english_reading") return "Reading Comprehension";
                if (questionType === "english_translation") return "Translation";
                if (questionType === "english_literature") return "Literature";
                if (questionType === "english_essay") return "Essay Writing";
                if (questionType === "english_comprehensive") return "Vocabulary & Grammar";
                if (hasReading) return "Reading";
                if (hasTranslation) return "Translation";
                if (hasEssay) return "Essay";
                if (hasMCQ) return "Multiple Choice";
                return "Question";
              };
              
              return (
              <motion.div
                key={question.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className="bg-white dark:bg-[#1c1c24] rounded-2xl shadow-lg border border-gray-200 dark:border-[#2e2e3a] overflow-hidden hover:shadow-xl transition-shadow"
                dir={getDir(question.questionTitle || question.questionSubtitle || "")}
              >
                {/* Question Header */}
                <div
                  onClick={() => toggleQuestion(question.id)}
                  className="p-5 cursor-pointer hover:bg-gradient-to-r hover:from-primary-50/50 hover:to-primary-50/50 dark:hover:from-primary-900/10 dark:hover:to-primary-900/10 transition-all duration-300 border-b border-gray-100 dark:border-[#2e2e3a]"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4 flex-1">
                      <div className="p-3 rounded-xl bg-gradient-to-br from-primary-500 to-primary-500 shadow-md">
                        <div className="text-white">
                          {getQuestionTypeIcon()}
                        </div>
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="px-2.5 py-1 rounded-lg text-xs font-semibold bg-primary-100 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300 border border-primary-200 dark:border-primary-800/50">
                            {getQuestionTypeLabel()}
                          </span>
                          <span className="text-xs text-gray-500 dark:text-gray-400">
                            Question {index + 1}
                          </span>
                        </div>
                        <h2
                          className="text-lg font-bold text-gray-900 dark:text-gray-100 mb-1"
                          dir={getDir(question.questionTitle || question.question || "")}
                        >
                          {question.questionTitle || question.question || `Question ${index + 1}`}
                        </h2>
                        {question.questionSubtitle && (
                          <p
                            className="text-sm text-gray-600 dark:text-gray-400"
                            dir={getDir(question.questionSubtitle)}
                          >
                            {question.questionSubtitle}
                          </p>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {expandedQuestions[question.id] && (
                        <div className="flex items-center gap-1 text-xs text-gray-500 dark:text-gray-400">
                          {hasMCQ && (
                            <span className="px-2 py-1 rounded bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300">
                              {question.multipleChoiceQuestions?.length} MCQ
                            </span>
                          )}
                          {hasTranslation && (
                            <span className="px-2 py-1 rounded bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-300">
                              {question.translationQuestions?.length} Trans
                            </span>
                          )}
                          {hasEssay && (
                            <span className="px-2 py-1 rounded bg-primary-100 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300">
                              {question.essayQuestions?.length} Essay
                            </span>
                          )}
                        </div>
                      )}
                      {expandedQuestions[question.id] ? (
                        <ChevronUp className="h-5 w-5 text-gray-500 dark:text-gray-400" />
                      ) : (
                        <ChevronDown className="h-5 w-5 text-gray-500 dark:text-gray-400" />
                      )}
                    </div>
                  </div>
                </div>

                {/* Question Content */}
                <AnimatePresence>
                  {expandedQuestions[question.id] && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      exit={{ opacity: 0, height: 0 }}
                      className="px-5 pb-5 space-y-4"
                    >
                      {/* Reading Passage */}
                      {question.readingPassage && (
                        <div className="p-4 rounded-xl bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 border border-blue-200 dark:border-blue-800/50 shadow-sm">
                          <div className="flex items-center gap-2 mb-3">
                            <FileText className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                            <h3 className="text-sm font-bold text-blue-900 dark:text-blue-100">
                              Reading Passage
                            </h3>
                          </div>
                          <p
                            className="text-sm leading-relaxed text-gray-900 dark:text-gray-100 whitespace-pre-wrap"
                            dir={getDir(question.readingPassage || "")}
                          >
                            {question.readingPassage}
                          </p>
                        </div>
                      )}

                      {/* Multiple Choice Questions */}
                      {question.multipleChoiceQuestions && question.multipleChoiceQuestions.length > 0 && (
                        <div className="space-y-4">
                          <div className="flex items-center gap-2 pb-2 border-b border-gray-200 dark:border-[#2e2e3a]">
                            <BookOpen className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                            <h3 className="text-base font-bold text-gray-900 dark:text-gray-100">
                              Multiple Choice Questions
                            </h3>
                            <span className="ml-auto text-xs text-gray-500 dark:text-gray-400">
                              {question.multipleChoiceQuestions.length} {question.multipleChoiceQuestions.length === 1 ? 'question' : 'questions'}
                            </span>
                          </div>
                          {question.multipleChoiceQuestions.map((mcq, mcqIndex) => {
                            const answerKey = `${question.id}_mcq_${mcqIndex}`;
                            const userAnswer = userAnswers[answerKey];
                            const showResult = showResults[question.id];
                            
                            return (
                              <div
                                key={mcqIndex}
                                className="p-4 rounded-xl bg-gradient-to-br from-gray-50 to-blue-50/30 dark:from-[#252530] dark:to-blue-900/10 border border-gray-200 dark:border-[#2e2e3a] shadow-sm"
                              >
                                <div className="flex items-start gap-3 mb-3">
                                  <div className="flex-shrink-0 w-8 h-8 rounded-lg bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                                    <span className="text-sm font-bold text-blue-700 dark:text-blue-300">
                                      {mcqIndex + 1}
                                    </span>
                                  </div>
                                  <p
                                    className="text-sm font-semibold text-gray-900 dark:text-gray-100 flex-1"
                                    dir={getDir(mcq.question)}
                                  >
                                    {mcq.question}
                                  </p>
                                </div>
                                <div className="space-y-2">
                                  {mcq.options.map((option, optIndex) => {
                                    const isSelected = userAnswer === optIndex;
                                    const isCorrectAnswer = mcq.correctAnswer === optIndex;
                                    let bgClass = "bg-white dark:bg-[#1c1c24] border-2 border-gray-200 dark:border-[#2e2e3a] hover:border-primary-300 dark:hover:border-primary-700";
                                    
                                    if (showResult) {
                                      if (isCorrectAnswer) {
                                        bgClass = "bg-green-50 dark:bg-green-900/30 border-2 border-green-500 dark:border-green-600 shadow-sm";
                                      } else if (isSelected && !isCorrectAnswer) {
                                        bgClass = "bg-red-50 dark:bg-red-900/30 border-2 border-red-500 dark:border-red-600 shadow-sm";
                                      }
                                    } else if (isSelected) {
                                      bgClass = "bg-primary-50 dark:bg-primary-900/30 border-2 border-primary-500 dark:border-primary-600 shadow-sm";
                                    }
                                    
                                    return (
                                      <label
                                        key={optIndex}
                                        className={`flex items-center gap-3 p-3 rounded-lg cursor-pointer transition-all ${bgClass}`}
                                      >
                                        <input
                                          type="radio"
                                          name={answerKey}
                                          checked={isSelected}
                                          onChange={() => {
                                            setUserAnswers((prev) => ({
                                              ...prev,
                                              [answerKey]: optIndex,
                                            }));
                                          }}
                                          className="h-4 w-4 text-primary-600 focus:ring-2 focus:ring-primary-500"
                                          disabled={showResult}
                                        />
                                        <span className="text-sm font-medium text-gray-700 dark:text-gray-300 w-6">
                                          {String.fromCharCode(65 + optIndex)}.
                                        </span>
                                        <span
                                          className="text-sm text-gray-900 dark:text-gray-100 flex-1"
                                          dir={getDir(option)}
                                        >
                                          {option}
                                        </span>
                                        {showResult && isCorrectAnswer && (
                                          <CheckCircle2 className="h-5 w-5 text-green-600 dark:text-green-400 flex-shrink-0" />
                                        )}
                                        {showResult && isSelected && !isCorrectAnswer && (
                                          <XCircle className="h-5 w-5 text-red-600 dark:text-red-400 flex-shrink-0" />
                                        )}
                                      </label>
                                    );
                                  })}
                                </div>
                                
                                {/* Show Correct Answer and Explanation */}
                                {(showResults[question.id] || showCorrectAnswers[question.id] || showExplanations[question.id]) && (
                                  <div className="mt-4 p-4 rounded-xl bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 border-2 border-green-200 dark:border-green-800/50 shadow-sm">
                                    <div className="flex items-center gap-2 mb-2">
                                      <CheckCircle2 className="h-5 w-5 text-green-600 dark:text-green-400" />
                                      <h5 className="text-sm font-bold text-green-900 dark:text-green-100">
                                        Correct Answer:
                                      </h5>
                                    </div>
                                    <p className="text-sm font-semibold text-green-800 dark:text-green-200 mb-2" dir="ltr">
                                      {String.fromCharCode(65 + mcq.correctAnswer)}. {mcq.options[mcq.correctAnswer]}
                                    </p>
                                    {mcq.explanation && (showExplanations[question.id] || showResults[question.id]) && (
                                      <div className="mt-3 pt-3 border-t border-green-200 dark:border-green-800/50">
                                        <div className="flex items-center gap-2 mb-2">
                                          <FileText className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                                          <h5 className="text-sm font-bold text-blue-900 dark:text-blue-100">
                                            Explanation:
                                          </h5>
                                        </div>
                                        <p className="text-sm text-blue-800 dark:text-blue-200 leading-relaxed" dir={getDir(mcq.explanation)}>
                                          {mcq.explanation}
                                        </p>
                                      </div>
                                    )}
                                  </div>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      )}

                      {/* Translation Questions */}
                      {question.translationQuestions && question.translationQuestions.length > 0 && (
                        <div className="space-y-4">
                          <div className="flex items-center gap-2 pb-2 border-b border-gray-200 dark:border-[#2e2e3a]">
                            <Languages className="h-5 w-5 text-orange-600 dark:text-orange-400" />
                            <h3 className="text-base font-bold text-gray-900 dark:text-gray-100">
                              Translation Questions
                            </h3>
                            <span className="ml-auto text-xs text-gray-500 dark:text-gray-400">
                              {question.translationQuestions.length} {question.translationQuestions.length === 1 ? 'question' : 'questions'}
                            </span>
                          </div>
                          {question.translationQuestions.map((tq, tqIndex) => {
                            const answerKey = `${question.id}_trans_${tqIndex}`;
                            const userAnswer = userAnswers[answerKey];
                            const showResult = showResults[question.id];
                            
                            return (
                              <div
                                key={tqIndex}
                                className="p-4 rounded-xl bg-gradient-to-br from-gray-50 to-orange-50/30 dark:from-[#252530] dark:to-orange-900/10 border border-gray-200 dark:border-[#2e2e3a] shadow-sm"
                              >
                                <div className="flex items-start gap-3 mb-3">
                                  <div className="flex-shrink-0 w-8 h-8 rounded-lg bg-orange-100 dark:bg-orange-900/30 flex items-center justify-center">
                                    <span className="text-sm font-bold text-orange-700 dark:text-orange-300">
                                      {tqIndex + 1}
                                    </span>
                                  </div>
                                  <div className="flex-1">
                                    <div className="flex items-center gap-2 mb-2">
                                      <span className="px-2 py-1 rounded text-xs font-semibold bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-300">
                                        {tq.translationDirection === "en-to-ar" ? "EN → AR" : "AR → EN"}
                                      </span>
                                    </div>
                                    <p
                                      className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-3 p-3 bg-white dark:bg-[#1c1c24] rounded-lg border-2 border-orange-200 dark:border-orange-800/50"
                                      dir={getDir(tq.originalText)}
                                    >
                                      {tq.originalText}
                                    </p>
                                  </div>
                                </div>
                                <div className="space-y-2">
                                  {tq.options && tq.options.map((option, optIndex) => {
                                    const isSelected = userAnswer === optIndex;
                                    const isCorrectAnswer = tq.correctAnswer === optIndex;
                                    let bgClass = "bg-white dark:bg-[#1c1c24] border-2 border-gray-200 dark:border-[#2e2e3a] hover:border-orange-300 dark:hover:border-orange-700";
                                    
                                    if (showResult) {
                                      if (isCorrectAnswer) {
                                        bgClass = "bg-green-50 dark:bg-green-900/30 border-2 border-green-500 dark:border-green-600 shadow-sm";
                                      } else if (isSelected && !isCorrectAnswer) {
                                        bgClass = "bg-red-50 dark:bg-red-900/30 border-2 border-red-500 dark:border-red-600 shadow-sm";
                                      }
                                    } else if (isSelected) {
                                      bgClass = "bg-orange-50 dark:bg-orange-900/30 border-2 border-orange-500 dark:border-orange-600 shadow-sm";
                                    }
                                    
                                    return (
                                      <label
                                        key={optIndex}
                                        className={`flex items-center gap-3 p-3 rounded-lg cursor-pointer transition-all ${bgClass}`}
                                      >
                                        <input
                                          type="radio"
                                          name={answerKey}
                                          checked={isSelected}
                                          onChange={() => {
                                            setUserAnswers((prev) => ({
                                              ...prev,
                                              [answerKey]: optIndex,
                                            }));
                                          }}
                                          className="h-4 w-4 text-orange-600 focus:ring-2 focus:ring-orange-500"
                                          disabled={showResult}
                                        />
                                        <span className="text-sm font-medium text-gray-700 dark:text-gray-300 w-6">
                                          {String.fromCharCode(65 + optIndex)}.
                                        </span>
                                        <span
                                          className="text-sm text-gray-900 dark:text-gray-100 flex-1"
                                          dir={getDir(option)}
                                        >
                                          {option}
                                        </span>
                                        {showResult && isCorrectAnswer && (
                                          <CheckCircle2 className="h-5 w-5 text-green-600 dark:text-green-400 flex-shrink-0" />
                                        )}
                                        {showResult && isSelected && !isCorrectAnswer && (
                                          <XCircle className="h-5 w-5 text-red-600 dark:text-red-400 flex-shrink-0" />
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

                      {/* Essay Questions */}
                      {question.essayQuestions && question.essayQuestions.length > 0 && (
                        <div className="space-y-4">
                          <div className="flex items-center gap-2 pb-2 border-b border-gray-200 dark:border-[#2e2e3a]">
                            <PenTool className="h-5 w-5 text-primary-600 dark:text-primary-400" />
                            <h3 className="text-base font-bold text-gray-900 dark:text-gray-100">
                              Essay Questions
                            </h3>
                            <span className="ml-auto text-xs text-gray-500 dark:text-gray-400">
                              {question.essayQuestions.length} {question.essayQuestions.length === 1 ? 'question' : 'questions'}
                            </span>
                          </div>
                          {question.essayQuestions.map((eq, eqIndex) => {
                            const answerKey = `${question.id}_essay_${eqIndex}`;
                            const userAnswer = userAnswers[answerKey] || "";
                            const showCorrect = showCorrectAnswers[question.id];
                            
                            return (
                              <div
                                key={eqIndex}
                                className="p-4 rounded-xl bg-gradient-to-br from-gray-50 to-primary-50/30 dark:from-[#252530] dark:to-primary-900/10 border border-gray-200 dark:border-[#2e2e3a] shadow-sm"
                              >
                                <div className="flex items-start gap-3 mb-3">
                                  <div className="flex-shrink-0 w-8 h-8 rounded-lg bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center">
                                    <span className="text-sm font-bold text-primary-700 dark:text-primary-300">
                                      {eqIndex + 1}
                                    </span>
                                  </div>
                                  <p
                                    className="text-sm font-semibold text-gray-900 dark:text-gray-100 flex-1"
                                    dir={getDir(eq.question)}
                                  >
                                    {eq.question}
                                  </p>
                                </div>
                                <Textarea
                                  value={userAnswer}
                                  onChange={(e) => {
                                    setUserAnswers((prev) => ({
                                      ...prev,
                                      [answerKey]: e.target.value,
                                    }));
                                  }}
                                  placeholder="Write your answer here..."
                                  rows={8}
                                  className="w-full mb-3 border-2 border-gray-200 dark:border-[#2e2e3a] focus:border-primary-500 dark:focus:border-primary-600"
                                  dir={getDir(String(userAnswer || eq.question))}
                                />
                                {showCorrect && eq.modelAnswer && (
                                  <div className="mt-3 p-4 rounded-xl bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 border-2 border-blue-200 dark:border-blue-800/50 shadow-sm">
                                    <div className="flex items-center gap-2 mb-2">
                                      <Eye className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                                      <p className="text-xs font-bold text-blue-700 dark:text-blue-300">
                                        Model Answer
                                      </p>
                                    </div>
                                    <p
                                      className="text-sm text-blue-900 dark:text-blue-100 whitespace-pre-wrap leading-relaxed"
                                      dir={getDir(eq.modelAnswer || "")}
                                    >
                                      {eq.modelAnswer}
                                    </p>
                                  </div>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      )}

                      {/* Comprehensive Exam Sections */}
                      {question.type === "english_comprehensive_exam" && question.sections && question.sections.length > 0 && (
                        <div className="space-y-4">
                          <div className="flex items-center gap-2 pb-2 border-b border-gray-200 dark:border-[#2e2e3a]">
                            <ClipboardList className="h-5 w-5 text-orange-600 dark:text-orange-400" />
                            <h3 className="text-base font-bold text-gray-900 dark:text-gray-100">
                              Exam Sections
                            </h3>
                            <span className="ml-auto text-xs text-gray-500 dark:text-gray-400">
                              {question.sections.length} {question.sections.length === 1 ? 'section' : 'sections'}
                            </span>
                          </div>
                          {question.sections.map((section, sectionIndex) => {
                            const questionData = section.questionData;
                            const isComprehensiveExam = !questionData;
                            const isExpanded = expandedSections[section.id];
                            const showResult = showResults[question.id];
                            const showCorrect = showCorrectAnswers[question.id];

                            return (
                              <motion.div
                                key={section.id}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: sectionIndex * 0.05 }}
                                className="bg-gray-50 dark:bg-[#252530] rounded-xl border border-gray-200 dark:border-[#2e2e3a] overflow-hidden"
                              >
                                {/* Section Header */}
                                <div
                                  onClick={() => toggleSection(section.id)}
                                  className="p-4 cursor-pointer hover:bg-gray-100 dark:hover:bg-[#2a2a35] transition-colors"
                                >
                                  <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                      <div className="p-2 rounded-lg bg-orange-100 dark:bg-orange-900/30">
                                        <span className="text-sm font-bold text-orange-700 dark:text-orange-300">
                                          {sectionIndex + 1}
                                        </span>
                                      </div>
                                      <div>
                                        <h4 className="text-base font-bold text-gray-900 dark:text-gray-100" dir="ltr">
                                          {isComprehensiveExam ? (section.title || `Section ${sectionIndex + 1}`) : `Section ${sectionIndex + 1}`}
                                          {section.note && (
                                            <span className="text-sm font-normal text-gray-600 dark:text-gray-400 mr-2">
                                              - {section.note}
                                            </span>
                                          )}
                                        </h4>
                                        {section.sectionType && (
                                          <span className="text-xs px-2 py-1 rounded bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-300 mt-1 inline-block">
                                            {section.sectionType}
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

                                {/* Section Content */}
                                <AnimatePresence>
                                  {isExpanded && (
                                    <motion.div
                                      initial={{ opacity: 0, height: 0 }}
                                      animate={{ opacity: 1, height: "auto" }}
                                      exit={{ opacity: 0, height: 0 }}
                                      className="px-4 pb-4 space-y-4"
                                    >
                                      {/* Reading Passage */}
                                      {questionData?.readingPassage && (
                                        <div className="p-4 rounded-lg bg-gray-50 dark:bg-[#252530] border border-gray-200 dark:border-[#2e2e3a]">
                                          <h5 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                                            Reading Passage:
                                          </h5>
                                          <p className="text-base leading-relaxed text-gray-900 dark:text-gray-100 whitespace-pre-wrap" dir="ltr">
                                            {questionData.readingPassage}
                                          </p>
                                        </div>
                                      )}

                                      {/* Multiple Choice Questions */}
                                      {questionData?.multipleChoiceQuestions && questionData.multipleChoiceQuestions.length > 0 && (
                                        <div className="space-y-3">
                                          <h5 className="text-base font-bold text-gray-900 dark:text-gray-100">
                                            Multiple Choice Questions:
                                          </h5>
                                          {questionData.multipleChoiceQuestions.map((mcq, mcqIndex: number) => {
                                            const answerKey = `${section.id}_mcq_${mcqIndex}`;
                                            const userAnswer = userAnswers[answerKey];
                                            const isCorrect = userAnswer === mcq.correctAnswer;
                                            const showAnswer = showResult || showCorrect;

                                            return (
                                              <div key={mcqIndex} className="p-3 rounded-lg bg-white dark:bg-[#1c1c24] border border-gray-200 dark:border-[#2e2e3a]">
                                                <p className="font-medium text-gray-900 dark:text-gray-100 mb-3" dir="ltr">
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
                                                        <span className="text-gray-900 dark:text-gray-100" dir="ltr">
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

                                      {/* Vocabulary & Grammar Questions */}
                                      {section.vocabularyQuestions && section.vocabularyQuestions.length > 0 && (
                                        <div className="space-y-3">
                                          <h5 className="text-base font-bold text-gray-900 dark:text-gray-100">
                                            Vocabulary & Grammar Questions:
                                          </h5>
                                          {section.vocabularyQuestions.map((mcq, mcqIndex: number) => {
                                            const answerKey = `${section.id}_vocab_${mcq.id || mcqIndex}`;
                                            const userAnswer = userAnswers[answerKey] as number | undefined;
                                            const isCorrect = userAnswer === mcq.correctAnswer;
                                            const showAnswer = showResult || showCorrect;

                                            return (
                                              <div key={mcq.id || mcqIndex} className="p-3 rounded-lg bg-white dark:bg-[#1c1c24] border border-gray-200 dark:border-[#2e2e3a]">
                                                <p className="font-medium text-gray-900 dark:text-gray-100 mb-3" dir="ltr">
                                                  {mcqIndex + 1}. {mcq.question}
                                                </p>
                                                <div className="space-y-2">
                                                  {mcq.options.map((opt: string, optIndex: number) => {
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
                                                            ? "bg-orange-100 dark:bg-orange-900/30 border-2 border-orange-500"
                                                            : "bg-gray-50 dark:bg-[#252530] border border-gray-200 dark:border-[#2e2e3a] hover:bg-gray-100 dark:hover:bg-[#2a2a35]"
                                                        }`}
                                                      >
                                                        <input
                                                          type="radio"
                                                          name={answerKey}
                                                          checked={isSelected}
                                                          onChange={() => {
                                                            const key = `${section.id}_vocab_${mcq.id || mcqIndex}`;
                                                            setUserAnswers((prev) => ({
                                                              ...prev,
                                                              [key]: optIndex,
                                                            }));
                                                          }}
                                                          disabled={showAnswer}
                                                          className="w-4 h-4 text-orange-600"
                                                        />
                                                        <span className="text-gray-900 dark:text-gray-100" dir="ltr">
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

                                      {/* Translation Questions */}
                                      {questionData?.translationQuestions && questionData.translationQuestions.length > 0 && (
                                        <div className="space-y-3">
                                          <h5 className="text-base font-bold text-gray-900 dark:text-gray-100">
                                            Translation Questions:
                                          </h5>
                                          {questionData.translationQuestions.map((trans, transIndex: number) => {
                                            const answerKey = `${section.id}_trans_${transIndex}`;
                                            const userAnswer = userAnswers[answerKey] || "";
                                            const showAnswer = showResult || showCorrect;
                                            const showExplanation = showExplanations[question.id] || showResult;

                                            return (
                                              <div key={transIndex} className="p-3 rounded-lg bg-white dark:bg-[#1c1c24] border border-gray-200 dark:border-[#2e2e3a]">
                                                <p className="font-medium text-gray-900 dark:text-gray-100 mb-2" dir="ltr">
                                                  {transIndex + 1}. {trans.originalText}
                                                </p>
                                                <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">
                                                  Direction: {trans.translationDirection === "en-to-ar" ? "English → Arabic" : "Arabic → English"}
                                                </p>
                                                <Textarea
                                                  value={userAnswer as string}
                                                  onChange={(e) => handleTranslationAnswer(section.id, transIndex, e.target.value)}
                                                  placeholder="Write your translation here..."
                                                  rows={4}
                                                  className="w-full mb-3"
                                                  dir={getDir(String(userAnswer || trans.originalText))}
                                                  disabled={showAnswer}
                                                />
                                                
                                                {/* Show Correct Answer and Explanation */}
                                                {trans.options && trans.correctAnswer !== undefined && (showAnswer || showExplanation) && (
                                                  <div className="mt-3 p-4 rounded-xl bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 border-2 border-green-200 dark:border-green-800/50 shadow-sm">
                                                    <div className="flex items-center gap-2 mb-2">
                                                      <CheckCircle2 className="h-5 w-5 text-green-600 dark:text-green-400" />
                                                      <h5 className="text-sm font-bold text-green-900 dark:text-green-100">
                                                        Correct Answer:
                                                      </h5>
                                                    </div>
                                                    <p className="text-sm font-semibold text-green-800 dark:text-green-200 mb-2" dir={getDir(trans.options[trans.correctAnswer])}>
                                                      {String.fromCharCode(65 + trans.correctAnswer)}. {trans.options[trans.correctAnswer]}
                                                    </p>
                                                    {trans.explanation && showExplanation && (
                                                      <div className="mt-3 pt-3 border-t border-green-200 dark:border-green-800/50">
                                                        <div className="flex items-center gap-2 mb-2">
                                                          <FileText className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                                                          <h5 className="text-sm font-bold text-blue-900 dark:text-blue-100">
                                                            Explanation:
                                                          </h5>
                                                        </div>
                                                        <p className="text-sm text-blue-800 dark:text-blue-200 leading-relaxed" dir={getDir(trans.explanation)}>
                                                          {trans.explanation}
                                                        </p>
                                                      </div>
                                                    )}
                                                  </div>
                                                )}
                                              </div>
                                            );
                                          })}
                                        </div>
                                      )}

                                      {/* Essay Questions */}
                                      {questionData?.essayQuestions && questionData.essayQuestions.length > 0 && (
                                        <div className="space-y-3">
                                          <h5 className="text-base font-bold text-gray-900 dark:text-gray-100">
                                            Essay Questions:
                                          </h5>
                                          {questionData.essayQuestions.map((essay, essayIndex: number) => {
                                            const answerKey = `${section.id}_essay_${essayIndex}`;
                                            const userAnswer = userAnswers[answerKey] || "";

                                            return (
                                              <div key={essayIndex} className="p-3 rounded-lg bg-white dark:bg-[#1c1c24] border border-gray-200 dark:border-[#2e2e3a]">
                                                <p className="font-medium text-gray-900 dark:text-gray-100 mb-2" dir="ltr">
                                                  {essayIndex + 1}. {essay.question}
                                                </p>
                                                <Textarea
                                                  value={userAnswer as string}
                                                  onChange={(e) => handleEssayAnswer(section.id, essayIndex, e.target.value)}
                                                  placeholder="Write your essay here..."
                                                  rows={8}
                                                  className="w-full"
                                                  dir="ltr"
                                                />
                                                {showCorrect && essay.modelAnswer && (
                                                  <div className="mt-3 p-3 rounded-lg bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800">
                                                    <p className="text-xs font-semibold text-blue-700 dark:text-blue-300 mb-1">
                                                      Model Answer:
                                                    </p>
                                                    <p className="text-sm text-blue-900 dark:text-blue-100 whitespace-pre-wrap" dir="ltr">
                                                      {essay.modelAnswer}
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

                      {/* Show message if question has no content */}
                      {!hasReading && !hasMCQ && !hasTranslation && !hasEssay && question.type !== "english_comprehensive_exam" && (
                        <div className="p-4 rounded-xl bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800/50">
                          <p className="text-sm text-yellow-800 dark:text-yellow-200">
                            This question appears to be empty or incomplete. Please contact your instructor.
                          </p>
                        </div>
                      )}

                      {/* Control Buttons */}
                      <div className="flex gap-3 pt-4 border-t border-gray-200 dark:border-[#2e2e3a]">
                        {(hasMCQ || hasTranslation) && (
                          <>
                            <Button
                              onClick={() => toggleShowResults(question.id)}
                              variant="outline"
                              className="flex-1 flex items-center justify-center gap-2"
                            >
                              {showResults[question.id] ? (
                                <>
                                  <EyeOff className="h-4 w-4" />
                                  Hide Results
                                </>
                              ) : (
                                <>
                                  <CheckCircle2 className="h-4 w-4" />
                                  Check Answers
                                </>
                              )}
                            </Button>
                            {(question.multipleChoiceQuestions?.some(mcq => mcq.explanation) || 
                              question.translationQuestions?.some(tq => tq.explanation)) && (
                              <Button
                                onClick={() => toggleShowExplanations(question.id)}
                                variant="outline"
                                className="flex-1 flex items-center justify-center gap-2"
                              >
                                {showExplanations[question.id] ? (
                                  <>
                                    <EyeOff className="h-4 w-4" />
                                    Hide Explanations
                                  </>
                                ) : (
                                  <>
                                    <FileText className="h-4 w-4" />
                                    Show Explanations
                                  </>
                                )}
                              </Button>
                            )}
                          </>
                        )}
                        {hasEssay && (
                          <Button
                            onClick={() => toggleShowCorrectAnswers(question.id)}
                            variant="outline"
                            className="flex-1 flex items-center justify-center gap-2"
                          >
                            {showCorrectAnswers[question.id] ? (
                              <>
                                <EyeOff className="h-4 w-4" />
                                Hide Model Answers
                              </>
                            ) : (
                              <>
                                <Eye className="h-4 w-4" />
                                Show Model Answers
                              </>
                            )}
                          </Button>
                        )}
                        {!hasMCQ && !hasTranslation && !hasEssay && (
                          <Button
                            onClick={() => toggleShowResults(question.id)}
                            variant="outline"
                            className="flex-1 flex items-center justify-center gap-2"
                          >
                            {showResults[question.id] ? (
                              <>
                                <EyeOff className="h-4 w-4" />
                                Hide Details
                              </>
                            ) : (
                              <>
                                <Eye className="h-4 w-4" />
                                Show Details
                              </>
                            )}
                          </Button>
                        )}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
              );
              })
            )}
          </div>
        )}
      </main>

      <SelectionTranslator />
      <Footer />
    </div>
  );
}

