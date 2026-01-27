'use client';

/**
 * Exam Player with Server-Side Grading
 * Uses the new RPC functions for automatic answer grading
 */

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Clock,
  ChevronLeft,
  ChevronRight,
  CheckCircle2,
  AlertCircle,
  Send,
  BookOpen,
  Loader2,
  Flag,
  List,
  X,
  Check,
} from 'lucide-react';
import { supabase } from '@/lib/supabase';
import {
  useTeacherExamAttempt,
  useComprehensiveExamAttempt,
} from '@/hooks/useStudentAttempts';

// Types
interface ExamBlock {
  id?: string;
  titleAr?: string;
  titleEn?: string;
  type?: string;
  questions?: ExamQuestion[];
  bodyText?: string;
  title?: string;
  genre?: string;
  verses?: string[];
  poet?: string;
  poemTitle?: string;
}

interface ExamQuestion {
  id: string;
  type: string;
  text?: string;
  textAr?: string;
  textEn?: string;
  options?: string[] | { id: string; text: string }[];
  correctAnswer?: string | number;
  correctOptionId?: string;
  points?: number;
}

interface ExamPlayerProps {
  examId: string;
  examType: 'teacher' | 'comprehensive';
  language?: 'arabic' | 'english';
  onComplete?: (results: { totalScore: number; maxScore: number; percentage: number }) => void;
}

export function ExamPlayerWithGrading({
  examId,
  examType,
  language = 'arabic',
  onComplete,
}: ExamPlayerProps) {
  const router = useRouter();
  const isRTL = language === 'arabic';
  const startTimeRef = useRef<Record<string, number>>({});

  // State
  const [exam, setExam] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentBlockIndex, setCurrentBlockIndex] = useState(0);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [localAnswers, setLocalAnswers] = useState<Record<string, any>>({});
  const [flaggedQuestions, setFlaggedQuestions] = useState<Set<string>>(new Set());
  const [timeRemaining, setTimeRemaining] = useState<number | null>(null);
  const [showNavigator, setShowNavigator] = useState(false);
  const [savingAnswer, setSavingAnswer] = useState(false);

  // Use the appropriate hook based on exam type
  const teacherExam = useTeacherExamAttempt(examId);
  const compExam = useComprehensiveExamAttempt(examId);
  
  const examHook = examType === 'teacher' ? teacherExam : compExam;
  const { attemptId, answers: serverAnswers, status, loading: hookLoading, error: hookError, saveAnswer, submitExam } = examHook;

  const blocks: ExamBlock[] = exam?.blocks || [];
  const currentBlock = blocks[currentBlockIndex];
  const questions = currentBlock?.questions || [];
  const currentQuestion = questions[currentQuestionIndex];
  
  const allQuestions = blocks.flatMap((b, bi) => 
    (b.questions || []).map((q, qi) => ({ ...q, blockIndex: bi, questionIndex: qi }))
  );
  const totalQuestions = allQuestions.length;
  const currentQuestionNumber = allQuestions.findIndex(
    q => q.blockIndex === currentBlockIndex && q.questionIndex === currentQuestionIndex
  ) + 1;

  // Labels
  const labels = {
    loading: isRTL ? 'جاري تحميل الامتحان...' : 'Loading exam...',
    error: isRTL ? 'حدث خطأ في تحميل الامتحان' : 'Error loading exam',
    next: isRTL ? 'التالي' : 'Next',
    previous: isRTL ? 'السابق' : 'Previous',
    submit: isRTL ? 'إرسال الامتحان' : 'Submit Exam',
    submitting: isRTL ? 'جاري الإرسال...' : 'Submitting...',
    question: isRTL ? 'سؤال' : 'Question',
    of: isRTL ? 'من' : 'of',
    saving: isRTL ? 'جاري الحفظ...' : 'Saving...',
    saved: isRTL ? 'تم الحفظ' : 'Saved',
    navigator: isRTL ? 'قائمة الأسئلة' : 'Question Navigator',
    flag: isRTL ? 'تحديد للمراجعة' : 'Flag for review',
  };

  // Fetch exam data
  useEffect(() => {
    const fetchExam = async () => {
      try {
        setIsLoading(true);
        setError(null);

        const tableName = examType === 'teacher' ? 'teacher_exams' : 'comprehensive_exams';
        const { data, error: fetchError } = await supabase
          .from(tableName)
          .select('*')
          .eq('id', examId)
          .eq('is_published', true)
          .single();

        if (fetchError) throw fetchError;
        if (!data) throw new Error('Exam not found or not published');

        // Cast to any to handle different table structures
        const examData = data as any;
        setExam({
          id: examData.id,
          title: examData.title || examData.exam_title,
          description: examData.description || examData.exam_description,
          duration: examData.duration_minutes,
          totalMarks: examData.total_marks,
          blocks: examData.blocks || examData.sections || [],
        });

        if (data.duration_minutes) {
          setTimeRemaining(data.duration_minutes * 60);
        }
      } catch (err: any) {
        console.error('Error fetching exam:', err);
        setError(err.message || labels.error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchExam();
  }, [examId, examType]);

  // Start timer for current question
  useEffect(() => {
    if (currentQuestion) {
      startTimeRef.current[currentQuestion.id] = Date.now();
    }
  }, [currentQuestion?.id]);

  // Timer countdown
  useEffect(() => {
    if (timeRemaining === null || timeRemaining <= 0) return;

    const timer = setInterval(() => {
      setTimeRemaining((prev) => {
        if (prev === null || prev <= 1) {
          clearInterval(timer);
          handleSubmit();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [timeRemaining]);

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // Handle answer selection with server-side grading
  const handleAnswer = useCallback(async (questionId: string, answer: any) => {
    // Update local state immediately for responsiveness
    setLocalAnswers(prev => ({ ...prev, [questionId]: answer }));

    // Calculate time spent
    const startTime = startTimeRef.current[questionId] || Date.now();
    const timeSpent = Math.floor((Date.now() - startTime) / 1000);

    // Save to server
    setSavingAnswer(true);
    try {
      await saveAnswer(questionId, answer, timeSpent, flaggedQuestions.has(questionId));
    } catch (err) {
      console.error('Error saving answer:', err);
    } finally {
      setSavingAnswer(false);
    }
  }, [saveAnswer, flaggedQuestions]);

  // Toggle flag
  const toggleFlag = useCallback((questionId: string) => {
    setFlaggedQuestions(prev => {
      const newSet = new Set(prev);
      if (newSet.has(questionId)) {
        newSet.delete(questionId);
      } else {
        newSet.add(questionId);
      }
      return newSet;
    });
  }, []);

  // Navigation
  const goToNext = () => {
    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex(prev => prev + 1);
    } else if (currentBlockIndex < blocks.length - 1) {
      setCurrentBlockIndex(prev => prev + 1);
      setCurrentQuestionIndex(0);
    }
  };

  const goToPrevious = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(prev => prev - 1);
    } else if (currentBlockIndex > 0) {
      setCurrentBlockIndex(prev => prev - 1);
      const prevBlock = blocks[currentBlockIndex - 1];
      setCurrentQuestionIndex((prevBlock.questions?.length || 1) - 1);
    }
  };

  const goToQuestion = (blockIndex: number, questionIndex: number) => {
    setCurrentBlockIndex(blockIndex);
    setCurrentQuestionIndex(questionIndex);
    setShowNavigator(false);
  };

  const isLastQuestion = currentBlockIndex === blocks.length - 1 &&
    currentQuestionIndex === questions.length - 1;

  // Submit exam
  const handleSubmit = async () => {
    if (hookLoading || !attemptId) return;

    try {
      const result = await submitExam();
      
      if (onComplete) {
        onComplete({
          totalScore: result.total_score,
          maxScore: result.max_score,
          percentage: result.percentage,
        });
      } else {
        router.push(`/profile/exam-history`);
      }
    } catch (err) {
      console.error('Error submitting exam:', err);
    }
  };

  // Get answer for display
  const getAnswer = (questionId: string) => {
    return localAnswers[questionId] ?? serverAnswers[questionId]?.answer;
  };

  const isAnswered = (questionId: string) => {
    return getAnswer(questionId) !== undefined;
  };

  // Render question
  const renderQuestion = (q: ExamQuestion) => {
    const questionText = q.text || (isRTL ? q.textAr : q.textEn) || '';
    const userAnswer = getAnswer(q.id);

    return (
      <div className="space-y-6">
        <p className="text-lg font-medium text-gray-900 dark:text-white leading-relaxed">
          {questionText}
        </p>

        {/* MCQ Options */}
        {['mcq', 'multiple_choice', 'single_choice', 'true_false'].includes(q.type) && q.options && (
          <div className="space-y-3">
            {(q.options as any[]).map((option, idx) => {
              const optionText = typeof option === 'string' ? option : option.text;
              const optionId = typeof option === 'string' ? String(idx) : option.id;
              const isSelected = String(userAnswer) === String(optionId);

              return (
                <button
                  key={idx}
                  onClick={() => handleAnswer(q.id, optionId)}
                  disabled={savingAnswer}
                  className={`w-full p-4 text-start rounded-xl border-2 transition-all ${
                    isSelected
                      ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20'
                      : 'border-gray-200 dark:border-[#2e2e3a] hover:border-primary-300 dark:hover:border-primary-700'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center ${
                      isSelected 
                        ? 'border-primary-500 bg-primary-500' 
                        : 'border-gray-300 dark:border-gray-600'
                    }`}>
                      {isSelected && <Check className="w-4 h-4 text-white" />}
                    </div>
                    <span className={isSelected ? 'text-primary-700 dark:text-primary-400' : 'text-gray-700 dark:text-gray-300'}>
                      {optionText}
                    </span>
                  </div>
                </button>
              );
            })}
          </div>
        )}

        {/* True/False without options array */}
        {q.type === 'true_false' && !q.options && (
          <div className="flex gap-4">
            {[{ id: 'true', text: isRTL ? 'صح' : 'True' }, { id: 'false', text: isRTL ? 'خطأ' : 'False' }].map((opt) => (
              <button
                key={opt.id}
                onClick={() => handleAnswer(q.id, opt.id)}
                disabled={savingAnswer}
                className={`flex-1 p-4 rounded-xl border-2 transition-all ${
                  String(userAnswer) === opt.id
                    ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20'
                    : 'border-gray-200 dark:border-[#2e2e3a] hover:border-primary-300'
                }`}
              >
                <span className={String(userAnswer) === opt.id ? 'text-primary-700 dark:text-primary-400 font-medium' : 'text-gray-700 dark:text-gray-300'}>
                  {opt.text}
                </span>
              </button>
            ))}
          </div>
        )}

        {/* Essay/Text Input */}
        {['essay', 'maqali', 'text', 'short_answer'].includes(q.type) && (
          <textarea
            value={userAnswer || ''}
            onChange={(e) => handleAnswer(q.id, e.target.value)}
            placeholder={isRTL ? 'اكتب إجابتك هنا...' : 'Write your answer here...'}
            className="w-full h-40 p-4 bg-white dark:bg-[#1c1c24] border border-gray-200 dark:border-[#2e2e3a] rounded-xl resize-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            dir={isRTL ? 'rtl' : 'ltr'}
          />
        )}
      </div>
    );
  };

  // Loading state
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-[#0f0f12]">
        <div className="text-center">
          <Loader2 className="w-12 h-12 mx-auto mb-4 text-primary-500 animate-spin" />
          <p className="text-gray-600 dark:text-gray-400">{labels.loading}</p>
        </div>
      </div>
    );
  }

  // Error state
  if (error || hookError) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-[#0f0f12]">
        <div className="text-center max-w-md mx-auto p-6">
          <AlertCircle className="w-12 h-12 mx-auto mb-4 text-red-500" />
          <p className="text-red-600 dark:text-red-400">{error || hookError}</p>
          <button
            onClick={() => router.back()}
            className="mt-4 px-6 py-2 bg-gray-200 dark:bg-gray-800 rounded-lg text-gray-700 dark:text-gray-300"
          >
            {isRTL ? 'رجوع' : 'Go Back'}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-[#0f0f12]" dir={isRTL ? 'rtl' : 'ltr'}>
      {/* Header */}
      <header className="sticky top-0 z-50 bg-white/80 dark:bg-[#1c1c24]/80 backdrop-blur-md border-b border-gray-200 dark:border-[#2e2e3a]">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setShowNavigator(true)}
              className="p-2 rounded-lg bg-gray-100 dark:bg-[#2e2e3a] hover:bg-gray-200 dark:hover:bg-[#3e3e4a]"
            >
              <List className="w-5 h-5 text-gray-600 dark:text-gray-400" />
            </button>
            <h1 className="text-lg font-bold text-gray-900 dark:text-white truncate">
              {exam?.title}
            </h1>
          </div>

          <div className="flex items-center gap-3">
            {/* Saving indicator */}
            {savingAnswer && (
              <span className="text-xs text-gray-500 flex items-center gap-1">
                <Loader2 className="w-3 h-3 animate-spin" />
                {labels.saving}
              </span>
            )}

            {/* Timer */}
            {timeRemaining !== null && (
              <div className={`flex items-center gap-2 px-4 py-2 rounded-full ${
                timeRemaining < 300
                  ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
                  : 'bg-gray-100 text-gray-700 dark:bg-[#2e2e3a] dark:text-gray-300'
              }`}>
                <Clock className="w-4 h-4" />
                <span className="font-mono font-semibold">{formatTime(timeRemaining)}</span>
              </div>
            )}
          </div>
        </div>

        {/* Progress */}
        <div className="h-1 bg-gray-100 dark:bg-[#2e2e3a]">
          <div
            className="h-full bg-primary-500 transition-all duration-300"
            style={{ width: `${(Object.keys(serverAnswers).length / Math.max(totalQuestions, 1)) * 100}%` }}
          />
        </div>
      </header>

      {/* Question Navigator Modal */}
      <AnimatePresence>
        {showNavigator && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4"
            onClick={() => setShowNavigator(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white dark:bg-[#1c1c24] rounded-2xl p-6 max-w-md w-full max-h-[80vh] overflow-y-auto"
              onClick={e => e.stopPropagation()}
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-bold text-gray-900 dark:text-white">{labels.navigator}</h3>
                <button onClick={() => setShowNavigator(false)} className="p-2 hover:bg-gray-100 dark:hover:bg-[#2e2e3a] rounded-lg">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="grid grid-cols-5 gap-2">
                {allQuestions.map((q, idx) => {
                  const isCurrentQ = q.blockIndex === currentBlockIndex && q.questionIndex === currentQuestionIndex;
                  const answered = isAnswered(q.id);
                  const flagged = flaggedQuestions.has(q.id);

                  return (
                    <button
                      key={q.id}
                      onClick={() => goToQuestion(q.blockIndex, q.questionIndex)}
                      className={`relative w-10 h-10 rounded-lg font-medium transition-all ${
                        isCurrentQ
                          ? 'bg-primary-500 text-white'
                          : answered
                          ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400'
                          : 'bg-gray-100 dark:bg-[#2e2e3a] text-gray-600 dark:text-gray-400'
                      }`}
                    >
                      {idx + 1}
                      {flagged && (
                        <Flag className="w-3 h-3 absolute -top-1 -right-1 text-orange-500" />
                      )}
                    </button>
                  );
                })}
              </div>

              <div className="mt-4 flex items-center gap-4 text-sm text-gray-600 dark:text-gray-400">
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 rounded bg-green-100 dark:bg-green-900/30" />
                  <span>{isRTL ? 'تمت الإجابة' : 'Answered'}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Flag className="w-4 h-4 text-orange-500" />
                  <span>{isRTL ? 'للمراجعة' : 'Flagged'}</span>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main Content */}
      <main className="max-w-4xl mx-auto px-4 py-8 pb-32">
        <AnimatePresence mode="wait">
          <motion.div
            key={`${currentBlockIndex}-${currentQuestionIndex}`}
            initial={{ opacity: 0, x: isRTL ? -20 : 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: isRTL ? 20 : -20 }}
            className="space-y-6"
          >
            {/* Block Title */}
            {currentBlock && (currentBlock.titleAr || currentBlock.titleEn) && (
              <div className="text-center">
                <span className="inline-block px-4 py-1 rounded-full bg-primary-100 dark:bg-primary-900/30 text-primary-600 dark:text-primary-400 text-sm font-medium">
                  {isRTL ? currentBlock.titleAr : currentBlock.titleEn || currentBlock.titleAr}
                </span>
              </div>
            )}

            {/* Reading Passage */}
            {currentBlock?.bodyText && (
              <div className="p-6 bg-blue-50 dark:bg-blue-900/20 rounded-2xl border border-blue-200 dark:border-blue-800">
                <div className="flex items-center gap-2 mb-4">
                  <BookOpen className="w-5 h-5 text-blue-600" />
                  <span className="font-semibold text-blue-800 dark:text-blue-300">
                    {isRTL ? 'نص القراءة' : 'Reading Passage'}
                  </span>
                </div>
                <div className="prose prose-blue dark:prose-invert max-w-none">
                  <p className="whitespace-pre-wrap leading-relaxed">{currentBlock.bodyText}</p>
                </div>
              </div>
            )}

            {/* Question Card */}
            {currentQuestion && (
              <div className="bg-white dark:bg-[#1c1c24] rounded-2xl border border-gray-200 dark:border-[#2e2e3a] p-8">
                <div className="flex items-center justify-between mb-6">
                  <span className="text-sm text-gray-500">
                    {labels.question} {currentQuestionNumber} {labels.of} {totalQuestions}
                  </span>
                  <div className="flex items-center gap-3">
                    {currentQuestion.points && (
                      <span className="text-sm text-primary-500 font-medium">
                        {currentQuestion.points} {isRTL ? 'درجة' : 'pts'}
                      </span>
                    )}
                    <button
                      onClick={() => toggleFlag(currentQuestion.id)}
                      className={`p-2 rounded-lg transition-colors ${
                        flaggedQuestions.has(currentQuestion.id)
                          ? 'bg-orange-100 dark:bg-orange-900/30 text-orange-500'
                          : 'bg-gray-100 dark:bg-[#2e2e3a] text-gray-400 hover:text-orange-500'
                      }`}
                      title={labels.flag}
                    >
                      <Flag className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {renderQuestion(currentQuestion)}
              </div>
            )}
          </motion.div>
        </AnimatePresence>
      </main>

      {/* Footer Navigation */}
      <footer className="fixed bottom-0 left-0 right-0 bg-white/80 dark:bg-[#1c1c24]/80 backdrop-blur-md border-t border-gray-200 dark:border-[#2e2e3a]">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center justify-between">
          <button
            onClick={goToPrevious}
            disabled={currentBlockIndex === 0 && currentQuestionIndex === 0}
            className="flex items-center gap-2 px-6 py-3 bg-gray-100 dark:bg-[#2e2e3a] text-gray-700 dark:text-gray-300 rounded-xl font-medium disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-200 dark:hover:bg-[#3e3e4a] transition-colors"
          >
            {isRTL ? <ChevronRight className="w-5 h-5" /> : <ChevronLeft className="w-5 h-5" />}
            {labels.previous}
          </button>

          {/* Progress indicator */}
          <div className="hidden md:flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
            <CheckCircle2 className="w-4 h-4 text-green-500" />
            <span>{Object.keys(serverAnswers).length} / {totalQuestions}</span>
          </div>

          {isLastQuestion ? (
            <button
              onClick={handleSubmit}
              disabled={hookLoading || !attemptId}
              className="flex items-center gap-2 px-8 py-3 bg-green-500 hover:bg-green-600 text-white rounded-xl font-medium disabled:opacity-50 transition-colors"
            >
              {hookLoading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  {labels.submitting}
                </>
              ) : (
                <>
                  <Send className="w-5 h-5" />
                  {labels.submit}
                </>
              )}
            </button>
          ) : (
            <button
              onClick={goToNext}
              className="flex items-center gap-2 px-6 py-3 bg-primary-500 hover:bg-primary-600 text-white rounded-xl font-medium transition-colors"
            >
              {labels.next}
              {isRTL ? <ChevronLeft className="w-5 h-5" /> : <ChevronRight className="w-5 h-5" />}
            </button>
          )}
        </div>
      </footer>
    </div>
  );
}

export default ExamPlayerWithGrading;
