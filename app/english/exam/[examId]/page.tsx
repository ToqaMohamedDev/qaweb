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
import { useAuth } from "@/contexts/AuthContext";
import { useExamSession } from "@/hooks/useExamSession";
import { useAutoSave } from "@/hooks/useAutoSave";

interface MCQ {
  id?: string;
  question: string;
  options: string[];
  correctAnswer: number;
  points?: number;
}

interface ChooseTwoOutOfFive {
  id: string;
  question: string;
  options: string[];
  correctAnswers: number[];
  points?: number;
}

interface ReadingPassage {
  id: string;
  passage: string;
  questions: MCQ[];
}

interface TranslationQuestion {
  id?: string;
  originalText: string;
  translationDirection: "en-to-ar" | "ar-to-en";
  options: string[];
  correctAnswer: number;
  points?: number;
}

interface EssayQuestion {
  id?: string;
  question: string;
  modelAnswer?: string;
  points?: number;
  requiredLines?: number;
  type?: "essay" | "story";
}

interface QuestionData {
  readingPassage?: string;
  multipleChoiceQuestions?: MCQ[];
  translationQuestions?: TranslationQuestion[];
  essayQuestions?: EssayQuestion[];
}

interface ExamSection {
  id: string;
  templateType?: string;
  sectionType?: "vocabulary_grammar" | "advanced_writing" | "reading" | "translation" | "essay";
  title?: string;
  questionId?: string;
  note?: string;
  questionData?: QuestionData;
  // Comprehensive exam fields
  vocabularyQuestions?: MCQ[];
  chooseTwoQuestions?: ChooseTwoOutOfFive[];
  writingMechanicsQuestions?: MCQ[];
  readingPassages?: ReadingPassage[];
  translationQuestions?: TranslationQuestion[];
  essayQuestions?: EssayQuestion[];
}

interface ExamData {
  examTitle?: string;
  examDescription?: string;
  durationMinutes?: number;
  passingScore?: number;
  sections?: ExamSection[];
}

type UserAnswer = string | number | number[] | null;

export default function EnglishExamView() {
  const params = useParams();
  const router = useRouter();
  const examId = params?.examId as string;
  const { user } = useAuth();

  const [exam, setExam] = useState<ExamData | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({});
  const [showResults, setShowResults] = useState<Record<string, boolean>>({});
  const [showCorrectAnswers, setShowCorrectAnswers] = useState<Record<string, boolean>>({});

  const {
    userAnswers,
    setUserAnswers,
    isLoading: sessionLoading,
    sessionId,
  } = useExamSession<Record<string, UserAnswer>>(examId, user?.uid, {});

  useAutoSave<Record<string, UserAnswer>>({
    userId: user?.uid,
    examId,
    sessionId,
    userAnswers,
    delay: 1000,
  });

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
        const examData = snap.data() as ExamData;
        
        // Support both old multi_template_exam and new english_comprehensive_exam
        if (examType === "english_comprehensive_exam") {
          // New comprehensive exam - sections are already embedded
          setExam(examData);
          if (examData.sections && examData.sections.length > 0) {
            setExpandedSections({ [examData.sections[0].id]: true });
          }
        } else if (examType === "multi_template_exam") {
          // Old multi-template exam - load question data for each section
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
          
          // Auto-expand first section
          if (loadedSections.length > 0) {
            setExpandedSections({ [loadedSections[0].id]: true });
          }
        } else {
          setNotFound(true);
          return;
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

  // Autosave progress to Firestore via API when answers change
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

  const handleMultipleChoiceAnswer = (sectionId: string, mcqIndex: number, answerIndex: number) => {
    const key = `${sectionId}_mcq_${mcqIndex}`;
    setUserAnswers((prev) => ({
      ...prev,
      [key]: answerIndex,
    }));
  };

  const handleTranslationAnswer = (sectionId: string, transIndex: number, answer: string) => {
    const key = `${sectionId}_trans_${transIndex}`;
    setUserAnswers((prev) => ({
      ...prev,
      [key]: answer,
    }));
  };

  const handleEssayAnswer = (sectionId: string, essayIndex: number, answer: string) => {
    const key = `${sectionId}_essay_${essayIndex}`;
    setUserAnswers((prev) => ({
      ...prev,
      [key]: answer,
    }));
  };

  const handleChooseTwoAnswer = (sectionId: string, questionId: string, optionIndex: number) => {
    const key = `${sectionId}_choose2_${questionId}`;
    setUserAnswers((prev) => {
      const current = (prev[key] as number[]) || [];
      const newAnswers = current.includes(optionIndex)
        ? current.filter((i) => i !== optionIndex)
        : current.length < 2
        ? [...current, optionIndex]
        : current;
      return {
        ...prev,
        [key]: newAnswers,
      };
    });
  };

  const handleTranslationMCQAnswer = (sectionId: string, transIndex: number, answerIndex: number) => {
    const key = `${sectionId}_trans_mcq_${transIndex}`;
    setUserAnswers((prev) => ({
      ...prev,
      [key]: answerIndex,
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

  const getDir = (text: string) => (/[ء-ي]/.test(text) ? "rtl" : "ltr");

  if (loading || sessionLoading) {
    return (
      <div className="min-h-screen bg-white dark:bg-[#121218]" dir="ltr">
        <Navbar />
        <main className="container mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 max-w-5xl">
          <div className="text-center py-16">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500 mx-auto mb-4"></div>
            <p className="text-gray-600 dark:text-gray-400">Loading exam...</p>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  if (notFound || !exam) {
    return (
      <div className="min-h-screen bg-white dark:bg-[#121218]" dir="ltr">
        <Navbar />
        <main className="container mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 max-w-5xl">
          <div className="text-center py-16">
            <ClipboardList className="h-16 w-16 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-700 dark:text-gray-300 text-lg">Exam not found</p>
            <button
              onClick={() => router.back()}
              className="mt-4 px-4 py-2 rounded-lg bg-primary-600 text-white hover:bg-primary-700 transition"
            >
              Go Back
            </button>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white dark:bg-[#121218]" dir="ltr">
      <Navbar />
      <main className="container mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 max-w-5xl">
        <div className="flex items-center gap-3 mb-6">
          <Link
            href="/english"
            className="inline-flex items-center gap-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 transition"
          >
            <ArrowRight className="h-4 w-4 rotate-180" />
            <span className="text-sm font-medium">Back to Lessons</span>
          </Link>
        </div>

        {/* Exam Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white dark:bg-[#1c1c24] rounded-2xl shadow-lg border border-gray-200 dark:border-[#2e2e3a] p-6 mb-6"
        >
          <div className="flex items-start gap-3">
            <div className="p-3 rounded-xl bg-primary-100 dark:bg-primary-900/30">
              <ClipboardList className="h-6 w-6 text-primary-600 dark:text-primary-400" />
            </div>
            <div className="flex-1 space-y-2">
              <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100" dir="ltr">
                {exam.examTitle || "Exam"}
              </h1>
              {exam.examDescription && (
                <p className="text-gray-700 dark:text-gray-300 leading-relaxed" dir="ltr">
                  {exam.examDescription}
                </p>
              )}
              <div className="flex flex-wrap gap-2 text-sm text-gray-600 dark:text-gray-400">
                {exam.durationMinutes && (
                  <span className="px-3 py-1 rounded-lg bg-primary-100 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300 border border-primary-200/70 dark:border-primary-800/50">
                    Duration: {exam.durationMinutes} min
                  </span>
                )}
                {exam.sections && (
                  <span className="px-3 py-1 rounded-lg bg-primary-100 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300 border border-primary-200/70 dark:border-primary-800/50">
                    Sections: {exam.sections.length}
                  </span>
                )}
                {exam.passingScore && (
                  <span className="px-3 py-1 rounded-lg bg-primary-100 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300 border border-primary-200/70 dark:border-primary-800/50">
                    Passing Score: {exam.passingScore}
                  </span>
                )}
              </div>
            </div>
          </div>
        </motion.div>

        {/* Exam Sections */}
        {exam.sections && exam.sections.length > 0 ? (
          <div className="space-y-4">
            {exam.sections.map((section, sectionIndex) => {
              const questionData = section.questionData;
              const isComprehensiveExam = !questionData; // New comprehensive exam has embedded data
              
              if (!isComprehensiveExam && !questionData) return null;

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
                          <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100" dir="ltr">
                            {isComprehensiveExam ? (section.title || `Section ${sectionIndex + 1}`) : `Section ${sectionIndex + 1}`}
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
                        {/* Reading Passage */}
                        {questionData?.readingPassage && (
                          <div className="p-4 rounded-lg bg-gray-50 dark:bg-[#252530] border border-gray-200 dark:border-[#2e2e3a]">
                            <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                              Reading Passage:
                            </h4>
                            <p className="text-base leading-relaxed text-gray-900 dark:text-gray-100 whitespace-pre-wrap" dir="ltr">
                              {questionData.readingPassage}
                            </p>
                          </div>
                        )}

                        {/* Multiple Choice Questions */}
                        {questionData?.multipleChoiceQuestions && questionData.multipleChoiceQuestions.length > 0 && (
                          <div className="space-y-3">
                            <h4 className="text-base font-bold text-gray-900 dark:text-gray-100">
                              Multiple Choice Questions:
                            </h4>
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

                        {/* Translation Questions */}
                        {questionData?.translationQuestions && questionData.translationQuestions.length > 0 && (
                          <div className="space-y-3">
                            <h4 className="text-base font-bold text-gray-900 dark:text-gray-100">
                              Translation Questions:
                            </h4>
                            {questionData.translationQuestions.map((trans, transIndex: number) => {
                              const answerKey = `${section.id}_trans_${transIndex}`;
                              const userAnswer = userAnswers[answerKey];

                              return (
                                <div key={transIndex} className="p-3 rounded-lg bg-white dark:bg-[#1c1c24] border border-gray-200 dark:border-[#2e2e3a]">
                                  <p className="font-medium text-gray-900 dark:text-gray-100 mb-2" dir="ltr">
                                    {transIndex + 1}. {trans.originalText}
                                  </p>
                                  <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">
                                    Direction: {trans.translationDirection === "en-to-ar" ? "English → Arabic" : "Arabic → English"}
                                  </p>
                                  <Textarea
                                    value={String(userAnswer ?? "")}
                                    onChange={(e) => handleTranslationAnswer(section.id, transIndex, e.target.value)}
                                    placeholder="Write your translation here..."
                                    rows={4}
                                    className="w-full"
                                    dir={getDir(String(userAnswer || trans.originalText))}
                                  />
                                </div>
                              );
                            })}
                          </div>
                        )}

                        {/* Essay Questions */}
                        {questionData?.essayQuestions && questionData.essayQuestions.length > 0 && (
                          <div className="space-y-3">
                            <h4 className="text-base font-bold text-gray-900 dark:text-gray-100">
                              Essay Questions:
                            </h4>
                            {questionData.essayQuestions.map((essay, essayIndex: number) => {
                              const answerKey = `${section.id}_essay_${essayIndex}`;
                              const userAnswer = userAnswers[answerKey];

                              return (
                                <div key={essayIndex} className="p-3 rounded-lg bg-white dark:bg-[#1c1c24] border border-gray-200 dark:border-[#2e2e3a]">
                                  <p className="font-medium text-gray-900 dark:text-gray-100 mb-2" dir="ltr">
                                    {essayIndex + 1}. {essay.question}
                                  </p>
                                  <Textarea
                                    value={String(userAnswer ?? "")}
                                    onChange={(e) => handleEssayAnswer(section.id, essayIndex, e.target.value)}
                                    placeholder="Write your essay here..."
                                    rows={8}
                                    className="w-full"
                                    dir="ltr"
                                  />
                                </div>
                              );
                            })}
                          </div>
                        )}

                        {/* Comprehensive Exam Sections */}
                        {isComprehensiveExam && (
                          <>
                            {/* Vocabulary & Grammar */}
                            {section.vocabularyQuestions && section.vocabularyQuestions.length > 0 && (
                              <div className="space-y-3">
                                <h4 className="text-base font-bold text-gray-900 dark:text-gray-100">
                                  Vocabulary & Grammar Questions:
                                </h4>
                                {section.vocabularyQuestions.map((mcq, mcqIndex: number) => {
                                  const answerKey = `${section.id}_vocab_${mcq.id}`;
                                  const userAnswer = userAnswers[answerKey] as number | undefined;
                                  const isCorrect = userAnswer === mcq.correctAnswer;
                                  const showAnswer = showResult || showCorrect;

                                  return (
                                    <div key={mcq.id} className="p-3 rounded-lg bg-white dark:bg-[#1c1c24] border border-gray-200 dark:border-[#2e2e3a]">
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
                                                  ? "bg-primary-100 dark:bg-primary-900/30 border-2 border-primary-500"
                                                  : "bg-gray-50 dark:bg-[#252530] border border-gray-200 dark:border-[#2e2e3a] hover:bg-gray-100 dark:hover:bg-[#2a2a35]"
                                              }`}
                                            >
                                              <input
                                                type="radio"
                                                name={answerKey}
                                                checked={isSelected}
                                                onChange={() => {
                                                  const key = `${section.id}_vocab_${mcq.id}`;
                                                  setUserAnswers((prev) => ({
                                                    ...prev,
                                                    [key]: optIndex,
                                                  }));
                                                }}
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

                            {/* Choose 2 out of 5 */}
                            {section.chooseTwoQuestions && section.chooseTwoQuestions.length > 0 && (
                              <div className="space-y-3">
                                <h4 className="text-base font-bold text-gray-900 dark:text-gray-100">
                                  Choose 2 out of 5 Questions (2 points each):
                                </h4>
                                {section.chooseTwoQuestions.map((q, qIndex: number) => {
                                  const answerKey = `${section.id}_choose2_${q.id}`;
                                  const userAnswersArray = (userAnswers[answerKey] as number[]) || [];
                                  const showAnswer = showResult || showCorrect;
                                  const isFullyCorrect =
                                    userAnswersArray.length === 2 &&
                                    q.correctAnswers.every((ans) => userAnswersArray.includes(ans)) &&
                                    userAnswersArray.every((ans) => q.correctAnswers.includes(ans));

                                  return (
                                    <div key={q.id} className="p-3 rounded-lg bg-white dark:bg-[#1c1c24] border border-gray-200 dark:border-[#2e2e3a]">
                                      <p className="font-medium text-gray-900 dark:text-gray-100 mb-3" dir="ltr">
                                        {qIndex + 1}. {q.question}
                                      </p>
                                      <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">
                                        Select exactly 2 correct answers
                                      </p>
                                      <div className="space-y-2">
                                        {q.options.map((opt: string, optIndex: number) => {
                                          const isSelected = userAnswersArray.includes(optIndex);
                                          const isCorrectOption = q.correctAnswers.includes(optIndex);

                                          return (
                                            <label
                                              key={optIndex}
                                              className={`flex items-center gap-3 p-3 rounded-lg cursor-pointer transition-all ${
                                                showAnswer && isCorrectOption
                                                  ? "bg-green-100 dark:bg-green-900/30 border-2 border-green-500"
                                                  : showAnswer && isSelected && !isCorrectOption
                                                  ? "bg-red-100 dark:bg-red-900/30 border-2 border-red-500"
                                                  : isSelected
                                                  ? "bg-primary-100 dark:bg-primary-900/30 border-2 border-primary-500"
                                                  : "bg-gray-50 dark:bg-[#252530] border border-gray-200 dark:border-[#2e2e3a] hover:bg-gray-100 dark:hover:bg-[#2a2a35]"
                                              }`}
                                            >
                                              <input
                                                type="checkbox"
                                                checked={isSelected}
                                                onChange={() => handleChooseTwoAnswer(section.id, q.id, optIndex)}
                                                disabled={showAnswer}
                                                className="w-4 h-4 text-primary-600"
                                              />
                                              <span className="text-gray-900 dark:text-gray-100" dir="ltr">
                                                {String.fromCharCode(65 + optIndex)}. {opt}
                                              </span>
                                              {showAnswer && isCorrectOption && (
                                                <CheckCircle2 className="h-5 w-5 text-green-600 dark:text-green-400 ml-auto" />
                                              )}
                                              {showAnswer && isSelected && !isCorrectOption && (
                                                <XCircle className="h-5 w-5 text-red-600 dark:text-red-400 ml-auto" />
                                              )}
                                            </label>
                                          );
                                        })}
                                      </div>
                                      {showAnswer && (
                                        <div className={`mt-2 p-2 rounded-lg ${isFullyCorrect ? "bg-green-50 dark:bg-green-900/20" : "bg-red-50 dark:bg-red-900/20"}`}>
                                          <p className={`text-sm ${isFullyCorrect ? "text-green-700 dark:text-green-300" : "text-red-700 dark:text-red-300"}`}>
                                            {isFullyCorrect ? "✓ Correct (2 points)" : "✗ Incorrect (0 points)"}
                                          </p>
                                        </div>
                                      )}
                                    </div>
                                  );
                                })}
                              </div>
                            )}

                            {/* Writing Mechanics */}
                            {section.writingMechanicsQuestions && section.writingMechanicsQuestions.length > 0 && (
                              <div className="space-y-3">
                                <h4 className="text-base font-bold text-gray-900 dark:text-gray-100">
                                  Writing Mechanics Questions:
                                </h4>
                                {section.writingMechanicsQuestions.map((mcq, mcqIndex: number) => {
                                  const answerKey = `${section.id}_writing_${mcq.id}`;
                                  const userAnswer = userAnswers[answerKey] as number | undefined;
                                  const isCorrect = userAnswer === mcq.correctAnswer;
                                  const showAnswer = showResult || showCorrect;

                                  return (
                                    <div key={mcq.id} className="p-3 rounded-lg bg-white dark:bg-[#1c1c24] border border-gray-200 dark:border-[#2e2e3a]">
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
                                                  ? "bg-primary-100 dark:bg-primary-900/30 border-2 border-primary-500"
                                                  : "bg-gray-50 dark:bg-[#252530] border border-gray-200 dark:border-[#2e2e3a] hover:bg-gray-100 dark:hover:bg-[#2a2a35]"
                                              }`}
                                            >
                                              <input
                                                type="radio"
                                                name={answerKey}
                                                checked={isSelected}
                                                onChange={() => {
                                                  const key = `${section.id}_writing_${mcq.id}`;
                                                  setUserAnswers((prev) => ({
                                                    ...prev,
                                                    [key]: optIndex,
                                                  }));
                                                }}
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

                            {/* Reading Passages */}
                            {section.readingPassages && section.readingPassages.length > 0 && (
                              <div className="space-y-4">
                                <h4 className="text-base font-bold text-gray-900 dark:text-gray-100">
                                  Reading Comprehension:
                                </h4>
                                {section.readingPassages.map((passage, pIndex: number) => (
                                  <div key={passage.id} className="p-4 rounded-lg bg-gray-50 dark:bg-[#252530] border border-gray-200 dark:border-[#2e2e3a]">
                                    <h5 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                                      Passage {pIndex + 1}:
                                    </h5>
                                    <p className="text-base leading-relaxed text-gray-900 dark:text-gray-100 whitespace-pre-wrap mb-4" dir="ltr">
                                      {passage.passage}
                                    </p>
                                    <div className="space-y-3 pt-3 border-t border-gray-200 dark:border-[#2e2e3a]">
                                      {passage.questions.map((q, qIndex: number) => {
                                        const answerKey = `${section.id}_passage_${passage.id}_${q.id}`;
                                        const userAnswer = userAnswers[answerKey] as number | undefined;
                                        const isCorrect = userAnswer === q.correctAnswer;
                                        const showAnswer = showResult || showCorrect;

                                        return (
                                          <div key={q.id} className="p-3 rounded-lg bg-white dark:bg-[#1c1c24] border border-gray-200 dark:border-[#2e2e3a]">
                                            <p className="font-medium text-gray-900 dark:text-gray-100 mb-3" dir="ltr">
                                              {qIndex + 1}. {q.question}
                                            </p>
                                            <div className="space-y-2">
                                              {q.options.map((opt: string, optIndex: number) => {
                                                const isSelected = userAnswer === optIndex;
                                                const isCorrectOption = optIndex === q.correctAnswer;

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
                                                      onChange={() => {
                                                        const key = `${section.id}_passage_${passage.id}_${q.id}`;
                                                        setUserAnswers((prev) => ({
                                                          ...prev,
                                                          [key]: optIndex,
                                                        }));
                                                      }}
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
                                  </div>
                                ))}
                              </div>
                            )}

                            {/* Translation Questions (MCQ) */}
                            {section.translationQuestions && section.translationQuestions.length > 0 && (
                              <div className="space-y-3">
                                <h4 className="text-base font-bold text-gray-900 dark:text-gray-100">
                                  Translation Questions:
                                </h4>
                                {section.translationQuestions.map((trans, transIndex: number) => {
                                  const answerKey = `${section.id}_trans_mcq_${trans.id}`;
                                  const userAnswer = userAnswers[answerKey] as number | undefined;
                                  const isCorrect = userAnswer === trans.correctAnswer;
                                  const showAnswer = showResult || showCorrect;

                                  return (
                                    <div key={trans.id} className="p-3 rounded-lg bg-white dark:bg-[#1c1c24] border border-gray-200 dark:border-[#2e2e3a]">
                                      <p className="font-medium text-gray-900 dark:text-gray-100 mb-2" dir={trans.translationDirection === "en-to-ar" ? "ltr" : "rtl"}>
                                        {transIndex + 1}. {trans.originalText}
                                      </p>
                                      <p className="text-xs text-gray-500 dark:text-gray-400 mb-3">
                                        Direction: {trans.translationDirection === "en-to-ar" ? "English → Arabic" : "Arabic → English"}
                                      </p>
                                      <div className="space-y-2">
                                        {trans.options.map((opt: string, optIndex: number) => {
                                          const isSelected = userAnswer === optIndex;
                                          const isCorrectOption = optIndex === trans.correctAnswer;

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
                                                onChange={() => handleTranslationMCQAnswer(section.id, transIndex, optIndex)}
                                                disabled={showAnswer}
                                                className="w-4 h-4 text-primary-600"
                                              />
                                              <span className="text-gray-900 dark:text-gray-100" dir={trans.translationDirection === "en-to-ar" ? "rtl" : "ltr"}>
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

                            {/* Essay Questions */}
                            {section.essayQuestions && section.essayQuestions.length > 0 && (
                              <div className="space-y-3">
                                <h4 className="text-base font-bold text-gray-900 dark:text-gray-100">
                                  Essay Questions:
                                </h4>
                                {section.essayQuestions.map((essay, essayIndex: number) => {
                                  const answerKey = `${section.id}_essay_${essay.id}`;
                                  const userAnswer = userAnswers[answerKey] as string || "";

                                  return (
                                    <div key={essay.id} className="p-3 rounded-lg bg-white dark:bg-[#1c1c24] border border-gray-200 dark:border-[#2e2e3a]">
                                      <div className="flex items-center justify-between mb-2">
                                        <p className="font-medium text-gray-900 dark:text-gray-100" dir="ltr">
                                          {essayIndex + 1}. {essay.question}
                                        </p>
                                        <span className="text-xs px-2 py-1 rounded bg-primary-100 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300">
                                          {essay.points} points
                                        </span>
                                      </div>
                                      {essay.type === "essay" && essay.requiredLines && (
                                        <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">
                                          Required: {essay.requiredLines} lines
                                        </p>
                                      )}
                                      <Textarea
                                        value={userAnswer}
                                        onChange={(e) => {
                                          const key = `${section.id}_essay_${essay.id}`;
                                          setUserAnswers((prev) => ({
                                            ...prev,
                                            [key]: e.target.value,
                                          }));
                                        }}
                                        placeholder={essay.type === "essay" ? "Write your essay here..." : "Write your answer here..."}
                                        rows={essay.type === "essay" ? 10 : 6}
                                        className="w-full"
                                        dir="ltr"
                                      />
                                      {showCorrect && essay.modelAnswer && (
                                        <div className="mt-3 p-3 rounded-lg bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800">
                                          <p className="text-xs font-semibold text-green-700 dark:text-green-300 mb-1">
                                            Model Answer:
                                          </p>
                                          <p className="text-sm text-green-900 dark:text-green-100 whitespace-pre-wrap" dir="ltr">
                                            {essay.modelAnswer}
                                          </p>
                                        </div>
                                      )}
                                    </div>
                                  );
                                })}
                              </div>
                            )}
                          </>
                        )}

                        {/* Action Buttons */}
                        <div className="flex gap-3 pt-4 border-t border-gray-200 dark:border-[#2e2e3a]">
                          {!showResult && (
                            <Button
                              onClick={() => checkAnswers(section.id)}
                              className="flex-1"
                            >
                              <CheckCircle2 className="h-4 w-4 ml-2" />
                              Check Answers
                            </Button>
                          )}
                          <Button
                            onClick={() => showCorrectAnswersForSection(section.id)}
                            variant="outline"
                            className="flex-1"
                          >
                            {showCorrect ? "Hide Correct Answers" : "Show Correct Answers"}
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
            <p className="text-gray-600 dark:text-gray-400">No sections in this exam</p>
          </div>
        )}
      </main>
      <Footer />
    </div>
  );
}
