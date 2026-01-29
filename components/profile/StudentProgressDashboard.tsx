'use client';

/**
 * Student Progress Dashboard
 * Shows exam attempts and question bank progress in the student profile
 * 
 * IMPORTANT: This component separates:
 * 1. Site Exams (امتحانات الموقع) - comprehensive_exams table
 * 2. Teacher Exams (امتحانات المدرسين) - teacher_exams table
 * 3. Question Bank Practice (بنك الأسئلة) - question_bank_attempts table
 * 
 * These are completely independent systems.
 */

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import {
  BookOpen,
  FileText,
  GraduationCap,
  Loader2,
  Target,
  TrendingUp,
  Calendar,
  Play,
} from 'lucide-react';
import {
  useStudentExamAttempts,
  useQuestionBankProgress,
} from '@/hooks/useStudentAttempts';

interface ExamStats {
  total: number;
  taken: number;
  passed: number;
  averageScore: number;
  totalScore?: number;
}

interface StudentProgressDashboardProps {
  studentId?: string;
  language?: 'arabic' | 'english';
  /** Stats from useProfile hook - includes total available exams for the stage */
  stats?: {
    siteExams?: ExamStats;
    teacherExams?: ExamStats;
    questionBank?: ExamStats;
  };
}

// Tab types - completely separate categories
type TabType = 'site_exams' | 'teacher_exams' | 'question_bank';

export function StudentProgressDashboard({
  studentId,
  language = 'arabic',
  stats,
}: StudentProgressDashboardProps) {
  const isRTL = language === 'arabic';

  const {
    data: examAttempts,
    loading: examsLoading,
    error: examsError,
    fetchAttempts,
  } = useStudentExamAttempts(studentId);

  const {
    progress: bankProgress,
    loading: banksLoading,
    error: banksError,
    fetchProgress,
  } = useQuestionBankProgress(studentId);

  // 3 separate tabs for the 3 different systems
  const [activeTab, setActiveTab] = useState<TabType>('site_exams');

  // Fetch data on mount
  useEffect(() => {
    fetchAttempts().catch(console.error);
    fetchProgress().catch(console.error);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const labels = {
    title: isRTL ? 'تقدمك الدراسي' : 'Your Progress',
    siteExams: isRTL ? 'امتحانات الموقع' : 'Site Exams',
    teacherExams: isRTL ? 'امتحانات المدرسين' : 'Teacher Exams',
    questionBank: isRTL ? 'بنك الأسئلة' : 'Question Bank',
    noSiteExams: isRTL ? 'لم تخض أي امتحان من الموقع بعد' : 'No site exams taken yet',
    noTeacherExams: isRTL ? 'لم تخض أي امتحان مدرس بعد' : 'No teacher exams taken yet',
    noPractice: isRTL ? 'لم تبدأ أي تمرين بعد' : 'No practice sessions yet',
    viewAll: isRTL ? 'عرض الكل' : 'View All',
    score: isRTL ? 'الدرجة' : 'Score',
    status: isRTL ? 'الحالة' : 'Status',
    completed: isRTL ? 'مكتمل' : 'Completed',
    inProgress: isRTL ? 'قيد التنفيذ' : 'In Progress',
    submitted: isRTL ? 'تم التسليم' : 'Submitted',
    graded: isRTL ? 'تم التصحيح' : 'Graded',
    continue: isRTL ? 'متابعة' : 'Continue',
    review: isRTL ? 'مراجعة' : 'Review',
    exploreSiteExams: isRTL ? 'استكشف امتحانات الموقع' : 'Explore Site Exams',
    exploreTeacherExams: isRTL ? 'استكشف امتحانات المدرسين' : 'Explore Teacher Exams',
    exploreLessons: isRTL ? 'استكشف الدروس' : 'Explore Lessons',
  };

  const isLoading = examsLoading || banksLoading;
  const hasError = examsError || banksError;

  // ==========================================
  // SEPARATE STATS FOR EACH CATEGORY
  // ==========================================

  // Site Exams Stats (comprehensive_exams)
  // Use total from stats (total available for stage), fallback to attempts count
  const siteExamsTotal = stats?.siteExams?.total ?? (examAttempts?.comprehensive_exams?.length || 0);
  const siteExamsCompleted = examAttempts?.comprehensive_exams?.filter(e => e.status !== 'in_progress').length || 0;
  const siteExamsAvgScore = (() => {
    const completed = examAttempts?.comprehensive_exams?.filter(e => e.percentage !== null) || [];
    if (completed.length === 0) return 0;
    return Math.round(completed.reduce((sum, e) => sum + (e.percentage || 0), 0) / completed.length);
  })();

  // Teacher Exams Stats (teacher_exams)
  // Use total from stats (total available for stage), fallback to attempts count
  const teacherExamsTotal = stats?.teacherExams?.total ?? (examAttempts?.teacher_exams?.length || 0);
  const teacherExamsCompleted = examAttempts?.teacher_exams?.filter(e => e.status !== 'in_progress').length || 0;
  const teacherExamsAvgScore = (() => {
    const completed = examAttempts?.teacher_exams?.filter(e => e.percentage !== null) || [];
    if (completed.length === 0) return 0;
    return Math.round(completed.reduce((sum, e) => sum + (e.percentage || 0), 0) / completed.length);
  })();

  // Question Bank Stats (question_bank_attempts)
  // Use total from stats (total available for stage), fallback to attempts count
  const questionBankTotal = stats?.questionBank?.total ?? (bankProgress?.length || 0);
  const questionBankCompleted = bankProgress?.filter(p => p.status === 'completed').length || 0;
  const questionBankAvgScore = (() => {
    const completed = bankProgress?.filter(p => p.score_percentage > 0) || [];
    if (completed.length === 0) return 0;
    return Math.round(completed.reduce((sum, p) => sum + p.score_percentage, 0) / completed.length);
  })();

  const getStatusBadge = (status: string) => {
    const statusMap: Record<string, { label: string; color: string }> = {
      in_progress: { label: labels.inProgress, color: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400' },
      submitted: { label: labels.submitted, color: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400' },
      graded: { label: labels.graded, color: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' },
      completed: { label: labels.completed, color: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' },
    };
    const s = statusMap[status] || statusMap.in_progress;
    return <span className={`px-2 py-1 rounded-full text-xs font-medium ${s.color}`}>{s.label}</span>;
  };

  const getScoreColor = (percentage: number | null) => {
    if (percentage === null) return 'text-gray-500';
    if (percentage >= 80) return 'text-green-500';
    if (percentage >= 60) return 'text-blue-500';
    if (percentage >= 40) return 'text-yellow-500';
    return 'text-red-500';
  };

  if (isLoading) {
    return (
      <div className="bg-white/80 dark:bg-[#1c1c24]/80 backdrop-blur-xl rounded-2xl border border-gray-200/60 dark:border-gray-800/60 p-6">
        <div className="flex items-center justify-center h-40">
          <Loader2 className="w-8 h-8 animate-spin text-primary-500" />
        </div>
      </div>
    );
  }

  if (hasError) {
    return (
      <div className="bg-white/80 dark:bg-[#1c1c24]/80 backdrop-blur-xl rounded-2xl border border-gray-200/60 dark:border-gray-800/60 p-6">
        <div className="flex flex-col items-center justify-center h-40 text-center">
          <div className="w-12 h-12 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center mb-3">
            <FileText className="w-6 h-6 text-red-500" />
          </div>
          <p className="text-gray-500 dark:text-gray-400">
            {isRTL ? 'حدث خطأ أثناء تحميل البيانات' : 'Error loading data'}
          </p>
          <button
            onClick={() => {
              fetchAttempts().catch(console.error);
              fetchProgress().catch(console.error);
            }}
            className="mt-3 px-4 py-2 text-sm bg-blue-500 text-white rounded-lg hover:bg-blue-600"
          >
            {isRTL ? 'إعادة المحاولة' : 'Retry'}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6" dir={isRTL ? 'rtl' : 'ltr'}>
      {/* Stats Cards - Separate stats for each category */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Site Exams Stats */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white dark:bg-[#1c1c24] rounded-xl border border-gray-200 dark:border-gray-800 p-4"
        >
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-lg bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
              <FileText className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <p className="text-sm text-gray-500">{labels.siteExams}</p>
              <p className="text-xl font-bold text-gray-900 dark:text-white">{siteExamsCompleted}/{siteExamsTotal}</p>
            </div>
          </div>
          <div className="flex items-center gap-2 text-sm">
            <TrendingUp className="w-4 h-4 text-green-500" />
            <span className="text-gray-600 dark:text-gray-400">{isRTL ? 'المتوسط:' : 'Avg:'}</span>
            <span className="font-bold text-green-600">{siteExamsAvgScore}%</span>
          </div>
        </motion.div>

        {/* Teacher Exams Stats */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white dark:bg-[#1c1c24] rounded-xl border border-gray-200 dark:border-gray-800 p-4"
        >
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-lg bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center">
              <GraduationCap className="w-5 h-5 text-purple-600 dark:text-purple-400" />
            </div>
            <div>
              <p className="text-sm text-gray-500">{labels.teacherExams}</p>
              <p className="text-xl font-bold text-gray-900 dark:text-white">{teacherExamsCompleted}/{teacherExamsTotal}</p>
            </div>
          </div>
          <div className="flex items-center gap-2 text-sm">
            <TrendingUp className="w-4 h-4 text-green-500" />
            <span className="text-gray-600 dark:text-gray-400">{isRTL ? 'المتوسط:' : 'Avg:'}</span>
            <span className="font-bold text-green-600">{teacherExamsAvgScore}%</span>
          </div>
        </motion.div>

        {/* Question Bank Stats */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-white dark:bg-[#1c1c24] rounded-xl border border-gray-200 dark:border-gray-800 p-4"
        >
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-lg bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center">
              <BookOpen className="w-5 h-5 text-amber-600 dark:text-amber-400" />
            </div>
            <div>
              <p className="text-sm text-gray-500">{labels.questionBank}</p>
              <p className="text-xl font-bold text-gray-900 dark:text-white">{questionBankCompleted}/{questionBankTotal}</p>
            </div>
          </div>
          <div className="flex items-center gap-2 text-sm">
            <Target className="w-4 h-4 text-green-500" />
            <span className="text-gray-600 dark:text-gray-400">{isRTL ? 'المتوسط:' : 'Avg:'}</span>
            <span className="font-bold text-green-600">{questionBankAvgScore}%</span>
          </div>
        </motion.div>
      </div>

      {/* 3 SEPARATE TABS */}
      <div className="bg-white/80 dark:bg-[#1c1c24]/80 backdrop-blur-xl rounded-2xl border border-gray-200/60 dark:border-gray-800/60 overflow-hidden">
        <div className="flex border-b border-gray-200 dark:border-gray-800 overflow-x-auto">
          {/* Tab 1: Site Exams */}
          <button
            onClick={() => setActiveTab('site_exams')}
            className={`flex-1 min-w-[120px] px-4 py-3 text-sm font-medium transition-colors ${
              activeTab === 'site_exams'
                ? 'text-blue-600 dark:text-blue-400 border-b-2 border-blue-500 bg-blue-50/50 dark:bg-blue-900/10'
                : 'text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'
            }`}
          >
            <div className="flex items-center justify-center gap-2">
              <FileText className="w-4 h-4" />
              <span className="whitespace-nowrap">{labels.siteExams}</span>
            </div>
          </button>

          {/* Tab 2: Teacher Exams */}
          <button
            onClick={() => setActiveTab('teacher_exams')}
            className={`flex-1 min-w-[120px] px-4 py-3 text-sm font-medium transition-colors ${
              activeTab === 'teacher_exams'
                ? 'text-purple-600 dark:text-purple-400 border-b-2 border-purple-500 bg-purple-50/50 dark:bg-purple-900/10'
                : 'text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'
            }`}
          >
            <div className="flex items-center justify-center gap-2">
              <GraduationCap className="w-4 h-4" />
              <span className="whitespace-nowrap">{labels.teacherExams}</span>
            </div>
          </button>

          {/* Tab 3: Question Bank */}
          <button
            onClick={() => setActiveTab('question_bank')}
            className={`flex-1 min-w-[120px] px-4 py-3 text-sm font-medium transition-colors ${
              activeTab === 'question_bank'
                ? 'text-amber-600 dark:text-amber-400 border-b-2 border-amber-500 bg-amber-50/50 dark:bg-amber-900/10'
                : 'text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'
            }`}
          >
            <div className="flex items-center justify-center gap-2">
              <BookOpen className="w-4 h-4" />
              <span className="whitespace-nowrap">{labels.questionBank}</span>
            </div>
          </button>
        </div>

        <div className="p-4">
          {/* ==========================================
              TAB 1: SITE EXAMS (امتحانات الموقع)
              comprehensive_exams table
              ========================================== */}
          {activeTab === 'site_exams' && (
            <div className="space-y-2">
              {examAttempts?.comprehensive_exams && examAttempts.comprehensive_exams.length > 0 ? (
                <>
                  {examAttempts.comprehensive_exams.map((exam) => (
                    <div
                      key={exam.attempt_id}
                      className="flex items-center justify-between p-3 bg-blue-50/50 dark:bg-blue-900/10 border border-blue-100 dark:border-blue-900/30 rounded-xl"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                          <FileText className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                        </div>
                        <div>
                          <p className="font-medium text-gray-900 dark:text-white">
                            {typeof exam.exam_title === 'object' ? (isRTL ? exam.exam_title.ar : exam.exam_title.en) : exam.exam_title}
                          </p>
                          <div className="flex items-center gap-2 text-xs text-gray-500">
                            {getStatusBadge(exam.status)}
                            {exam.completed_at && (
                              <span className="flex items-center gap-1">
                                <Calendar className="w-3 h-3" />
                                {new Date(exam.completed_at).toLocaleDateString(isRTL ? 'ar-EG' : 'en-US')}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                      <div className="text-end">
                        {exam.percentage !== null ? (
                          <p className={`text-xl font-bold ${getScoreColor(exam.percentage)}`}>
                            {Math.round(exam.percentage)}%
                          </p>
                        ) : (
                          <Link
                            href={`/arabic/exam/${exam.exam_id}`}
                            className="px-3 py-1.5 text-sm bg-blue-500 text-white rounded-lg hover:bg-blue-600"
                          >
                            {labels.continue}
                          </Link>
                        )}
                      </div>
                    </div>
                  ))}
                </>
              ) : (
                <div className="text-center py-10">
                  <div className="w-16 h-16 rounded-2xl bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center mx-auto mb-4">
                    <FileText className="w-8 h-8 text-blue-400" />
                  </div>
                  <p className="text-gray-500 mb-4">{labels.noSiteExams}</p>
                  <Link
                    href="/exams"
                    className="inline-flex items-center gap-2 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
                  >
                    <Play className="w-4 h-4" />
                    {labels.exploreSiteExams}
                  </Link>
                </div>
              )}
            </div>
          )}

          {/* ==========================================
              TAB 2: TEACHER EXAMS (امتحانات المدرسين)
              teacher_exams table
              ========================================== */}
          {activeTab === 'teacher_exams' && (
            <div className="space-y-2">
              {examAttempts?.teacher_exams && examAttempts.teacher_exams.length > 0 ? (
                <>
                  {examAttempts.teacher_exams.map((exam) => (
                    <div
                      key={exam.attempt_id}
                      className="flex items-center justify-between p-3 bg-purple-50/50 dark:bg-purple-900/10 border border-purple-100 dark:border-purple-900/30 rounded-xl"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center">
                          <GraduationCap className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                        </div>
                        <div>
                          <p className="font-medium text-gray-900 dark:text-white">
                            {typeof exam.exam_title === 'object' ? (isRTL ? exam.exam_title.ar : exam.exam_title.en) : exam.exam_title}
                          </p>
                          <div className="flex items-center gap-2 text-xs text-gray-500">
                            <span className="text-purple-600 dark:text-purple-400">{exam.teacher_name}</span>
                            {getStatusBadge(exam.status)}
                          </div>
                        </div>
                      </div>
                      <div className="text-end">
                        {exam.percentage !== null ? (
                          <p className={`text-xl font-bold ${getScoreColor(exam.percentage)}`}>
                            {Math.round(exam.percentage)}%
                          </p>
                        ) : (
                          <Link
                            href={`/arabic/teacher-exam/${exam.exam_id}`}
                            className="px-3 py-1.5 text-sm bg-purple-500 text-white rounded-lg hover:bg-purple-600"
                          >
                            {labels.continue}
                          </Link>
                        )}
                      </div>
                    </div>
                  ))}
                </>
              ) : (
                <div className="text-center py-10">
                  <div className="w-16 h-16 rounded-2xl bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center mx-auto mb-4">
                    <GraduationCap className="w-8 h-8 text-purple-400" />
                  </div>
                  <p className="text-gray-500 mb-4">{labels.noTeacherExams}</p>
                  <Link
                    href="/teachers"
                    className="inline-flex items-center gap-2 px-4 py-2 bg-purple-500 text-white rounded-lg hover:bg-purple-600"
                  >
                    <Play className="w-4 h-4" />
                    {labels.exploreTeacherExams}
                  </Link>
                </div>
              )}
            </div>
          )}

          {/* ==========================================
              TAB 3: QUESTION BANK (بنك الأسئلة)
              question_bank_attempts table
              ========================================== */}
          {activeTab === 'question_bank' && (
            <div className="space-y-2">
              {bankProgress && bankProgress.length > 0 ? (
                <>
                  {bankProgress.map((practice) => (
                    <div
                      key={practice.attempt_id}
                      className="flex items-center justify-between p-3 bg-amber-50/50 dark:bg-amber-900/10 border border-amber-100 dark:border-amber-900/30 rounded-xl"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center">
                          <BookOpen className="w-5 h-5 text-amber-600 dark:text-amber-400" />
                        </div>
                        <div>
                          <p className="font-medium text-gray-900 dark:text-white">
                            {typeof practice.bank_title === 'object' 
                              ? (isRTL ? practice.bank_title.ar : practice.bank_title.en) 
                              : practice.bank_title}
                          </p>
                          <div className="flex items-center gap-2 text-xs text-gray-500">
                            <span>{practice.answered_count}/{practice.total_questions} {isRTL ? 'سؤال' : 'questions'}</span>
                            {getStatusBadge(practice.status)}
                          </div>
                        </div>
                      </div>
                      <div className="text-end">
                        {practice.status === 'completed' ? (
                          <div>
                            <p className={`text-xl font-bold ${getScoreColor(practice.score_percentage)}`}>
                              {Math.round(practice.score_percentage)}%
                            </p>
                            <p className="text-xs text-gray-500">
                              {practice.correct_count}/{practice.total_questions}
                            </p>
                          </div>
                        ) : (
                          <Link
                            href={`/arabic/question-bank/${practice.question_bank_id}`}
                            className="px-3 py-1.5 text-sm bg-amber-500 text-white rounded-lg hover:bg-amber-600"
                          >
                            {labels.continue}
                          </Link>
                        )}
                      </div>
                    </div>
                  ))}
                </>
              ) : (
                <div className="text-center py-10">
                  <div className="w-16 h-16 rounded-2xl bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center mx-auto mb-4">
                    <BookOpen className="w-8 h-8 text-amber-400" />
                  </div>
                  <p className="text-gray-500 mb-4">{labels.noPractice}</p>
                  <Link
                    href="/"
                    className="inline-flex items-center gap-2 px-4 py-2 bg-amber-500 text-white rounded-lg hover:bg-amber-600"
                  >
                    <Play className="w-4 h-4" />
                    {labels.exploreLessons}
                  </Link>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default StudentProgressDashboard;
