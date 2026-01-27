'use client';

/**
 * Question Bank Practice Player
 * For practicing questions from question banks with real-time grading
 */

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ChevronLeft,
  ChevronRight,
  CheckCircle2,
  XCircle,
  Loader2,
  AlertCircle,
  BookOpen,
  Trophy,
  Target,
  RotateCcw,
  ArrowLeft,
  Check,
  X,
  Flag,
} from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useQuestionBankAttempt } from '@/hooks/useStudentAttempts';

interface Question {
  id: string;
  type: string;
  text?: string;
  textAr?: string;
  textEn?: string;
  options?: Array<{ id: string; text: string }>;
  correctAnswer?: string | number;
  correctOptionId?: string;
  points?: number;
  explanation?: string;
}

interface QuestionBank {
  id: string;
  title: { ar: string; en: string };
  description?: { ar: string; en: string };
  questions: Question[];
  total_questions: number;
  lesson_id?: string;
}

interface QuestionBankPlayerProps {
  questionBankId: string;
  language?: 'arabic' | 'english';
  showAnswers?: boolean; // Show correct answers after answering
  onComplete?: (result: { correct: number; total: number; percentage: number }) => void;
}

export function QuestionBankPlayer({
  questionBankId,
  language = 'arabic',
  showAnswers = true,
  onComplete,
}: QuestionBankPlayerProps) {
  const router = useRouter();
  const isRTL = language === 'arabic';
  const startTimeRef = useRef<number>(Date.now());

  // State
  const [bank, setBank] = useState<QuestionBank | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [localAnswer, setLocalAnswer] = useState<string | null>(null);
  const [showResult, setShowResult] = useState(false);
  const [lastResult, setLastResult] = useState<{ isCorrect: boolean; correctAnswer?: string } | null>(null);
  const [isComplete, setIsComplete] = useState(false);

  // Hook for managing attempt
  const {
    attempt,
    loading: attemptLoading,
    error: attemptError,
    getOrCreateAttempt,
    saveAnswer,
    submitAttempt,
  } = useQuestionBankAttempt(questionBankId);

  const questions = bank?.questions || [];
  const currentQuestion = questions[currentIndex];
  const totalQuestions = questions.length;

  const labels = {
    loading: isRTL ? 'جاري التحميل...' : 'Loading...',
    error: isRTL ? 'حدث خطأ' : 'An error occurred',
    question: isRTL ? 'سؤال' : 'Question',
    of: isRTL ? 'من' : 'of',
    next: isRTL ? 'التالي' : 'Next',
    previous: isRTL ? 'السابق' : 'Previous',
    check: isRTL ? 'تحقق' : 'Check',
    correct: isRTL ? 'إجابة صحيحة!' : 'Correct!',
    incorrect: isRTL ? 'إجابة خاطئة' : 'Incorrect',
    correctAnswer: isRTL ? 'الإجابة الصحيحة:' : 'Correct answer:',
    finish: isRTL ? 'إنهاء التمرين' : 'Finish Practice',
    score: isRTL ? 'نتيجتك' : 'Your Score',
    tryAgain: isRTL ? 'حاول مرة أخرى' : 'Try Again',
    continue: isRTL ? 'متابعة' : 'Continue',
    backToLesson: isRTL ? 'العودة للدرس' : 'Back to Lesson',
  };

  // Fetch question bank
  useEffect(() => {
    const fetchBank = async () => {
      try {
        setIsLoading(true);
        setError(null);

        const { data, error: fetchError } = await supabase
          .from('question_banks')
          .select('id, title, description, questions, total_questions, lesson_id, is_published')
          .eq('id', questionBankId)
          .eq('is_published', true)
          .single();

        if (fetchError) throw fetchError;
        if (!data) throw new Error('Question bank not found');

        setBank(data as unknown as QuestionBank);

        // Get or create attempt
        await getOrCreateAttempt();
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : 'Failed to load questions';
        setError(message);
      } finally {
        setIsLoading(false);
      }
    };

    fetchBank();
  }, [questionBankId]);

  // Handle answer selection
  const handleSelectAnswer = (answerId: string) => {
    if (showResult) return;
    setLocalAnswer(answerId);
  };

  // Check answer
  const handleCheckAnswer = async () => {
    if (!currentQuestion || !localAnswer) return;

    const timeSpent = Math.floor((Date.now() - startTimeRef.current) / 1000);
    
    try {
      const result = await saveAnswer(currentQuestion.id, localAnswer, timeSpent);
      
      setLastResult({
        isCorrect: result.is_correct ?? false,
        correctAnswer: currentQuestion.correctAnswer?.toString() || currentQuestion.correctOptionId,
      });
      setShowResult(true);
    } catch (err) {
      console.error('Error saving answer:', err);
    }
  };

  // Go to next question
  const handleNext = () => {
    if (currentIndex < totalQuestions - 1) {
      setCurrentIndex(prev => prev + 1);
      setLocalAnswer(null);
      setShowResult(false);
      setLastResult(null);
      startTimeRef.current = Date.now();
    } else {
      handleComplete();
    }
  };

  // Go to previous
  const handlePrevious = () => {
    if (currentIndex > 0) {
      setCurrentIndex(prev => prev - 1);
      setLocalAnswer(null);
      setShowResult(false);
      setLastResult(null);
    }
  };

  // Complete practice
  const handleComplete = async () => {
    try {
      const result = await submitAttempt();
      setIsComplete(true);
      
      if (onComplete) {
        onComplete({
          correct: attempt?.correct_count || 0,
          total: totalQuestions,
          percentage: result.percentage,
        });
      }
    } catch (err) {
      console.error('Error completing practice:', err);
    }
  };

  // Restart practice
  const handleRestart = () => {
    setCurrentIndex(0);
    setLocalAnswer(null);
    setShowResult(false);
    setLastResult(null);
    setIsComplete(false);
    getOrCreateAttempt();
  };

  // Check if question was already answered
  const getExistingAnswer = (questionId: string) => {
    return attempt?.answers?.[questionId];
  };

  // Loading
  if (isLoading || attemptLoading) {
    return (
      <div className="min-h-[400px] flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-10 h-10 mx-auto mb-3 text-primary-500 animate-spin" />
          <p className="text-gray-600 dark:text-gray-400">{labels.loading}</p>
        </div>
      </div>
    );
  }

  // Error
  if (error || attemptError) {
    return (
      <div className="min-h-[400px] flex items-center justify-center">
        <div className="text-center max-w-md">
          <AlertCircle className="w-12 h-12 mx-auto mb-4 text-red-500" />
          <p className="text-red-600 dark:text-red-400 mb-4">{error || attemptError}</p>
          <button
            onClick={() => router.back()}
            className="px-6 py-2 bg-gray-200 dark:bg-gray-800 rounded-lg"
          >
            {labels.backToLesson}
          </button>
        </div>
      </div>
    );
  }

  // Complete screen
  if (isComplete && attempt) {
    const percentage = attempt.score_percentage || 0;
    const isPassed = percentage >= 60;

    return (
      <div className="min-h-[400px] flex items-center justify-center p-6" dir={isRTL ? 'rtl' : 'ltr'}>
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="text-center max-w-md w-full"
        >
          <div className={`w-24 h-24 mx-auto mb-6 rounded-full flex items-center justify-center ${
            isPassed 
              ? 'bg-green-100 dark:bg-green-900/30' 
              : 'bg-orange-100 dark:bg-orange-900/30'
          }`}>
            {isPassed ? (
              <Trophy className="w-12 h-12 text-green-500" />
            ) : (
              <Target className="w-12 h-12 text-orange-500" />
            )}
          </div>

          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
            {labels.score}
          </h2>

          <div className="text-5xl font-bold mb-2">
            <span className={isPassed ? 'text-green-500' : 'text-orange-500'}>
              {Math.round(percentage)}%
            </span>
          </div>

          <p className="text-gray-600 dark:text-gray-400 mb-6">
            {attempt.correct_count} / {totalQuestions} {isRTL ? 'إجابة صحيحة' : 'correct answers'}
          </p>

          <div className="flex flex-col gap-3">
            <button
              onClick={handleRestart}
              className="flex items-center justify-center gap-2 px-6 py-3 bg-primary-500 hover:bg-primary-600 text-white rounded-xl font-medium transition-colors"
            >
              <RotateCcw className="w-5 h-5" />
              {labels.tryAgain}
            </button>
            <button
              onClick={() => router.back()}
              className="flex items-center justify-center gap-2 px-6 py-3 bg-gray-100 dark:bg-[#2e2e3a] text-gray-700 dark:text-gray-300 rounded-xl font-medium"
            >
              <ArrowLeft className="w-5 h-5" />
              {labels.backToLesson}
            </button>
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto p-4" dir={isRTL ? 'rtl' : 'ltr'}>
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white">
            {isRTL ? bank?.title.ar : bank?.title.en || bank?.title.ar}
          </h2>
          <span className="text-sm text-gray-500">
            {labels.question} {currentIndex + 1} {labels.of} {totalQuestions}
          </span>
        </div>

        {/* Progress bar */}
        <div className="h-2 bg-gray-200 dark:bg-[#2e2e3a] rounded-full overflow-hidden">
          <motion.div
            className="h-full bg-primary-500"
            initial={{ width: 0 }}
            animate={{ width: `${((currentIndex + 1) / totalQuestions) * 100}%` }}
          />
        </div>

        {/* Stats */}
        {attempt && (
          <div className="flex items-center gap-4 mt-3 text-sm">
            <div className="flex items-center gap-1 text-green-600 dark:text-green-400">
              <CheckCircle2 className="w-4 h-4" />
              <span>{attempt.correct_count} {isRTL ? 'صحيح' : 'correct'}</span>
            </div>
            <div className="flex items-center gap-1 text-gray-500">
              <BookOpen className="w-4 h-4" />
              <span>{attempt.answered_count} / {totalQuestions}</span>
            </div>
          </div>
        )}
      </div>

      {/* Question Card */}
      <AnimatePresence mode="wait">
        {currentQuestion && (
          <motion.div
            key={currentQuestion.id}
            initial={{ opacity: 0, x: isRTL ? -20 : 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: isRTL ? 20 : -20 }}
            className="bg-white dark:bg-[#1c1c24] rounded-2xl border border-gray-200 dark:border-[#2e2e3a] p-6 mb-6"
          >
            {/* Question text */}
            <p className="text-lg font-medium text-gray-900 dark:text-white mb-6 leading-relaxed">
              {currentQuestion.text || (isRTL ? currentQuestion.textAr : currentQuestion.textEn)}
            </p>

            {/* Options */}
            <div className="space-y-3">
              {currentQuestion.options?.map((option, idx) => {
                const isSelected = localAnswer === option.id;
                const existingAnswer = getExistingAnswer(currentQuestion.id);
                const wasAnswered = !!existingAnswer;
                const isCorrectOption = 
                  option.id === currentQuestion.correctAnswer || 
                  option.id === currentQuestion.correctOptionId;
                
                let optionClass = 'border-gray-200 dark:border-[#2e2e3a] hover:border-primary-300';
                
                if (showResult && showAnswers) {
                  if (isCorrectOption) {
                    optionClass = 'border-green-500 bg-green-50 dark:bg-green-900/20';
                  } else if (isSelected && !lastResult?.isCorrect) {
                    optionClass = 'border-red-500 bg-red-50 dark:bg-red-900/20';
                  }
                } else if (isSelected) {
                  optionClass = 'border-primary-500 bg-primary-50 dark:bg-primary-900/20';
                }

                return (
                  <button
                    key={option.id}
                    onClick={() => handleSelectAnswer(option.id)}
                    disabled={showResult}
                    className={`w-full p-4 text-start rounded-xl border-2 transition-all ${optionClass}`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center ${
                          isSelected && !showResult
                            ? 'border-primary-500 bg-primary-500'
                            : showResult && isCorrectOption
                            ? 'border-green-500 bg-green-500'
                            : showResult && isSelected
                            ? 'border-red-500 bg-red-500'
                            : 'border-gray-300 dark:border-gray-600'
                        }`}>
                          {isSelected && !showResult && <Check className="w-4 h-4 text-white" />}
                          {showResult && isCorrectOption && <Check className="w-4 h-4 text-white" />}
                          {showResult && isSelected && !isCorrectOption && <X className="w-4 h-4 text-white" />}
                        </div>
                        <span className="text-gray-700 dark:text-gray-300">{option.text}</span>
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Result feedback */}
            {showResult && lastResult && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className={`mt-6 p-4 rounded-xl ${
                  lastResult.isCorrect
                    ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400'
                    : 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400'
                }`}
              >
                <div className="flex items-center gap-2 font-medium">
                  {lastResult.isCorrect ? (
                    <CheckCircle2 className="w-5 h-5" />
                  ) : (
                    <XCircle className="w-5 h-5" />
                  )}
                  <span>{lastResult.isCorrect ? labels.correct : labels.incorrect}</span>
                </div>
                {currentQuestion.explanation && (
                  <p className="mt-2 text-sm opacity-80">{currentQuestion.explanation}</p>
                )}
              </motion.div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Navigation */}
      <div className="flex items-center justify-between">
        <button
          onClick={handlePrevious}
          disabled={currentIndex === 0}
          className="flex items-center gap-2 px-5 py-2.5 bg-gray-100 dark:bg-[#2e2e3a] text-gray-700 dark:text-gray-300 rounded-xl font-medium disabled:opacity-50"
        >
          {isRTL ? <ChevronRight className="w-5 h-5" /> : <ChevronLeft className="w-5 h-5" />}
          {labels.previous}
        </button>

        {!showResult ? (
          <button
            onClick={handleCheckAnswer}
            disabled={!localAnswer}
            className="px-8 py-2.5 bg-primary-500 hover:bg-primary-600 disabled:opacity-50 text-white rounded-xl font-medium transition-colors"
          >
            {labels.check}
          </button>
        ) : currentIndex === totalQuestions - 1 ? (
          <button
            onClick={handleComplete}
            className="flex items-center gap-2 px-6 py-2.5 bg-green-500 hover:bg-green-600 text-white rounded-xl font-medium"
          >
            <Trophy className="w-5 h-5" />
            {labels.finish}
          </button>
        ) : (
          <button
            onClick={handleNext}
            className="flex items-center gap-2 px-6 py-2.5 bg-primary-500 hover:bg-primary-600 text-white rounded-xl font-medium"
          >
            {labels.continue}
            {isRTL ? <ChevronLeft className="w-5 h-5" /> : <ChevronRight className="w-5 h-5" />}
          </button>
        )}
      </div>
    </div>
  );
}

export default QuestionBankPlayer;
