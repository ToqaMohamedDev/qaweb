"use client";

// =============================================
// Teacher Results - نتائج الطلاب
// =============================================

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import {
    Users,
    FileText,
    Search,
    Eye,
    Clock,
    CheckCircle2,
    Trophy,
    TrendingUp,
    Calendar,
    ChevronDown,
    Loader2,
    Award,
    Filter,
    Download,
    Edit3,
} from "lucide-react";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { Avatar } from "@/components/common";
import { useAuthStore, selectIsApprovedTeacher } from "@/lib/stores/useAuthStore";
import { createClient } from "@/lib/supabase";

interface ExamResult {
    id: string;
    exam_id: string;
    exam_title: string;
    student_id: string;
    student_name: string;
    student_email: string;
    total_score: number;
    max_score: number;
    status: string;
    completed_at: string;
    started_at: string;
}

interface ExamSummary {
    id: string;
    title: string;
    attempts_count: number;
    avg_score: number;
    language: string;
}

const formatDate = (date: string): string => {
    const d = new Date(date);
    return d.toLocaleDateString('ar-EG', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
    });
};

const formatDuration = (start: string, end: string): string => {
    const startDate = new Date(start);
    const endDate = new Date(end);
    const diff = Math.round((endDate.getTime() - startDate.getTime()) / 60000);
    return `${diff} دقيقة`;
};

const getScoreColor = (score: number, maxScore: number): string => {
    const percentage = (score / maxScore) * 100;
    if (percentage >= 80) return 'text-green-600 bg-green-100 dark:bg-green-900/30';
    if (percentage >= 60) return 'text-blue-600 bg-blue-100 dark:bg-blue-900/30';
    if (percentage >= 40) return 'text-amber-600 bg-amber-100 dark:bg-amber-900/30';
    return 'text-red-600 bg-red-100 dark:bg-red-900/30';
};

export default function TeacherResultsPage() {
    const router = useRouter();
    const { user, isLoading: authLoading } = useAuthStore();
    const isApprovedTeacher = useAuthStore(selectIsApprovedTeacher);

    const [results, setResults] = useState<ExamResult[]>([]);
    const [examSummaries, setExamSummaries] = useState<ExamSummary[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [search, setSearch] = useState("");
    const [selectedExam, setSelectedExam] = useState<string>('all');
    const [view, setView] = useState<'results' | 'summary'>('results');
    const [isExporting, setIsExporting] = useState(false);

    // دالة تصدير النتائج لملف CSV (Excel-compatible)
    const exportToExcel = async () => {
        if (filteredResults.length === 0) {
            alert('لا توجد نتائج للتصدير');
            return;
        }

        setIsExporting(true);
        try {
            // تحضير البيانات
            const headers = ['الطالب', 'البريد الإلكتروني', 'الامتحان', 'الدرجة', 'أقصى درجة', 'النسبة', 'التاريخ', 'المدة (دقيقة)'];

            const rows = filteredResults.map(result => {
                const percentage = result.max_score > 0
                    ? Math.round((result.total_score / result.max_score) * 100)
                    : 0;
                const duration = result.started_at && result.completed_at
                    ? Math.round((new Date(result.completed_at).getTime() - new Date(result.started_at).getTime()) / 60000)
                    : 0;

                return [
                    result.student_name || 'طالب',
                    result.student_email || '',
                    result.exam_title || '',
                    result.total_score || 0,
                    result.max_score || 0,
                    `${percentage}%`,
                    result.completed_at ? new Date(result.completed_at).toLocaleDateString('ar-EG') : '',
                    duration
                ];
            });

            // إنشاء محتوى CSV مع BOM للدعم العربي
            const BOM = '\uFEFF';
            const csvContent = BOM + [
                headers.join(','),
                ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
            ].join('\n');

            // إنشاء ملف وتحميله
            const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
            const url = URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;

            // اسم الملف
            const examName = selectedExam !== 'all'
                ? examSummaries.find(e => e.id === selectedExam)?.title || 'نتائج'
                : 'كل_النتائج';
            const date = new Date().toLocaleDateString('ar-EG').replace(/\//g, '-');
            link.download = `نتائج_${examName}_${date}.csv`;

            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            URL.revokeObjectURL(url);

        } catch (error) {
            console.error('Error exporting:', error);
            alert('حدث خطأ أثناء التصدير');
        } finally {
            setIsExporting(false);
        }
    };


    useEffect(() => {
        if (authLoading) return;

        if (!user || user.role !== 'teacher') {
            router.push("/");
            return;
        }

        if (!isApprovedTeacher) {
            router.push("/teacher");
            return;
        }

        fetchResults();
    }, [user, authLoading, isApprovedTeacher]);

    const fetchResults = async () => {
        if (!user) return;

        const supabase = createClient();

        try {
            // جلب الامتحانات الخاصة بالمدرس
            const { data: exams } = await (supabase
                .from('teacher_exams' as any) as any)
                .select('id, exam_title, language, attempts_count')
                .eq('created_by', user.id);

            // جلب نتائج الطلاب
            const examIds = (exams || []).map((e: any) => e.id);

            if (examIds.length > 0) {
                const { data: attempts } = await (supabase
                    .from('teacher_exam_attempts' as any) as any)
                    .select('*')
                    .in('exam_id', examIds)
                    .in('status', ['completed', 'graded'])
                    .order('completed_at', { ascending: false });

                // تجميع النتائج مع اسم الامتحان
                const resultsWithExamTitle = (attempts || []).map((attempt: any) => {
                    const exam = exams?.find((e: any) => e.id === attempt.exam_id);
                    return {
                        ...attempt,
                        exam_title: exam?.exam_title || 'امتحان',
                    };
                });

                setResults(resultsWithExamTitle);

                // حساب ملخص كل امتحان
                const summaries = (exams || []).map((exam: any) => {
                    const examAttempts = resultsWithExamTitle.filter((r: any) => r.exam_id === exam.id);
                    const avgScore = examAttempts.length > 0
                        ? examAttempts.reduce((sum: number, r: any) => sum + (r.total_score || 0), 0) / examAttempts.length
                        : 0;
                    return {
                        id: exam.id,
                        title: exam.exam_title,
                        attempts_count: examAttempts.length,
                        avg_score: avgScore,
                        language: exam.language,
                    };
                });

                setExamSummaries(summaries);
            }
        } catch (error) {
            console.error('Error fetching results:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const filteredResults = results.filter(result => {
        const matchSearch = (result.student_name || '').toLowerCase().includes(search.toLowerCase()) ||
            (result.student_email || '').toLowerCase().includes(search.toLowerCase()) ||
            (result.exam_title || '').toLowerCase().includes(search.toLowerCase());
        const matchExam = selectedExam === 'all' || result.exam_id === selectedExam;
        return matchSearch && matchExam;
    });

    if (authLoading || isLoading) {
        return (
            <>
                <Navbar />
                <div className="min-h-screen bg-gradient-to-br from-gray-50 via-purple-50/30 to-blue-50/30 dark:from-[#0d0d14] dark:via-[#13131a] dark:to-[#0d0d14] flex items-center justify-center">
                    <Loader2 className="h-10 w-10 animate-spin text-primary-500" />
                </div>
                <Footer />
            </>
        );
    }

    const totalAttempts = results.length;
    const avgScore = totalAttempts > 0
        ? results.reduce((sum, r) => sum + ((r.total_score || 0) / (r.max_score || 1) * 100), 0) / totalAttempts
        : 0;
    const uniqueStudents = new Set(results.map(r => r.student_id)).size;

    return (
        <>
            <Navbar />
            <div className="min-h-screen bg-gradient-to-br from-gray-50 via-purple-50/30 to-blue-50/30 dark:from-[#0d0d14] dark:via-[#13131a] dark:to-[#0d0d14]" dir="rtl">
                {/* Background */}
                <div className="fixed inset-0 overflow-hidden pointer-events-none">
                    <div className="absolute top-20 right-1/4 w-96 h-96 bg-green-500/5 rounded-full blur-3xl" />
                </div>

                <main className="relative container mx-auto px-4 py-8 max-w-6xl">
                    {/* Breadcrumb */}
                    <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400 mb-6">
                        <Link href="/teacher" className="hover:text-primary-500">لوحة التحكم</Link>
                        <span>/</span>
                        <span className="text-gray-900 dark:text-white">نتائج الطلاب</span>
                    </div>

                    {/* Header */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="mb-8"
                    >
                        <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900 dark:text-white flex items-center gap-3">
                            <div className="p-2 rounded-xl bg-gradient-to-br from-green-500 to-emerald-600 shadow-lg">
                                <Users className="h-6 w-6 text-white" />
                            </div>
                            نتائج الطلاب
                        </h1>
                        <p className="text-gray-600 dark:text-gray-400 mt-2">
                            متابعة أداء الطلاب في امتحاناتك
                        </p>
                    </motion.div>

                    {/* Stats Cards */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.1 }}
                        className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8"
                    >
                        <div className="bg-white dark:bg-[#1c1c24] rounded-2xl p-5 border border-gray-200/60 dark:border-gray-800">
                            <div className="flex items-center gap-3">
                                <div className="p-3 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 shadow-lg">
                                    <Users className="h-5 w-5 text-white" />
                                </div>
                                <div>
                                    <p className="text-2xl font-bold text-gray-900 dark:text-white">{uniqueStudents}</p>
                                    <p className="text-sm text-gray-500 dark:text-gray-400">طالب</p>
                                </div>
                            </div>
                        </div>
                        <div className="bg-white dark:bg-[#1c1c24] rounded-2xl p-5 border border-gray-200/60 dark:border-gray-800">
                            <div className="flex items-center gap-3">
                                <div className="p-3 rounded-xl bg-gradient-to-br from-green-500 to-emerald-600 shadow-lg">
                                    <CheckCircle2 className="h-5 w-5 text-white" />
                                </div>
                                <div>
                                    <p className="text-2xl font-bold text-gray-900 dark:text-white">{totalAttempts}</p>
                                    <p className="text-sm text-gray-500 dark:text-gray-400">امتحان مكتمل</p>
                                </div>
                            </div>
                        </div>
                        <div className="bg-white dark:bg-[#1c1c24] rounded-2xl p-5 border border-gray-200/60 dark:border-gray-800">
                            <div className="flex items-center gap-3">
                                <div className="p-3 rounded-xl bg-gradient-to-br from-amber-500 to-orange-600 shadow-lg">
                                    <Trophy className="h-5 w-5 text-white" />
                                </div>
                                <div>
                                    <p className="text-2xl font-bold text-gray-900 dark:text-white">{avgScore.toFixed(1)}%</p>
                                    <p className="text-sm text-gray-500 dark:text-gray-400">متوسط الدرجات</p>
                                </div>
                            </div>
                        </div>
                    </motion.div>

                    {/* View Toggle & Filters */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.15 }}
                        className="bg-white dark:bg-[#1c1c24] rounded-2xl p-4 border border-gray-200/60 dark:border-gray-800 mb-6"
                    >
                        <div className="flex flex-col sm:flex-row gap-4">
                            {/* View Toggle */}
                            <div className="flex bg-gray-100 dark:bg-gray-800 rounded-xl p-1">
                                <button
                                    onClick={() => setView('results')}
                                    className={`flex-1 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${view === 'results'
                                        ? 'bg-white dark:bg-gray-700 text-primary-600 shadow-sm'
                                        : 'text-gray-600 dark:text-gray-400'}`}
                                >
                                    النتائج التفصيلية
                                </button>
                                <button
                                    onClick={() => setView('summary')}
                                    className={`flex-1 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${view === 'summary'
                                        ? 'bg-white dark:bg-gray-700 text-primary-600 shadow-sm'
                                        : 'text-gray-600 dark:text-gray-400'}`}
                                >
                                    ملخص الامتحانات
                                </button>
                            </div>

                            {view === 'results' && (
                                <>
                                    {/* Search */}
                                    <div className="flex-1 relative">
                                        <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                                        <input
                                            type="text"
                                            placeholder="بحث بالاسم أو البريد..."
                                            value={search}
                                            onChange={(e) => setSearch(e.target.value)}
                                            className="w-full pr-10 pl-4 py-2.5 rounded-xl bg-gray-100 dark:bg-gray-800 text-sm outline-none focus:ring-2 focus:ring-primary-500"
                                        />
                                    </div>

                                    {/* Exam Filter */}
                                    <select
                                        value={selectedExam}
                                        onChange={(e) => setSelectedExam(e.target.value)}
                                        className="px-4 py-2.5 rounded-xl bg-gray-100 dark:bg-gray-800 text-sm outline-none focus:ring-2 focus:ring-primary-500"
                                    >
                                        <option value="all">كل الامتحانات</option>
                                        {examSummaries.map(exam => (
                                            <option key={exam.id} value={exam.id}>{exam.title}</option>
                                        ))}
                                    </select>

                                    {/* Export Button */}
                                    <button
                                        onClick={exportToExcel}
                                        disabled={isExporting || filteredResults.length === 0}
                                        className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-green-500 to-emerald-600 text-white text-sm font-medium hover:from-green-600 hover:to-emerald-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-green-500/20"
                                    >
                                        {isExporting ? (
                                            <Loader2 className="h-4 w-4 animate-spin" />
                                        ) : (
                                            <Download className="h-4 w-4" />
                                        )}
                                        تصدير Excel
                                    </button>
                                </>
                            )}
                        </div>
                    </motion.div>

                    {/* Results Table or Summary */}
                    <AnimatePresence mode="wait">
                        {view === 'results' ? (
                            <motion.div
                                key="results"
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -20 }}
                                className="bg-white dark:bg-[#1c1c24] rounded-2xl border border-gray-200/60 dark:border-gray-800 overflow-hidden"
                            >
                                {filteredResults.length === 0 ? (
                                    <div className="p-12 text-center">
                                        <Users className="h-16 w-16 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
                                        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                                            لا توجد نتائج
                                        </h3>
                                        <p className="text-gray-500 dark:text-gray-400">
                                            لم يقم أي طالب بحل امتحاناتك بعد
                                        </p>
                                    </div>
                                ) : (
                                    <div className="overflow-x-auto">
                                        <table className="w-full">
                                            <thead className="bg-gray-50 dark:bg-gray-800/50">
                                                <tr>
                                                    <th className="text-right px-4 py-3 text-sm font-semibold text-gray-700 dark:text-gray-300">الطالب</th>
                                                    <th className="text-right px-4 py-3 text-sm font-semibold text-gray-700 dark:text-gray-300">الامتحان</th>
                                                    <th className="text-center px-4 py-3 text-sm font-semibold text-gray-700 dark:text-gray-300">الدرجة</th>
                                                    <th className="text-center px-4 py-3 text-sm font-semibold text-gray-700 dark:text-gray-300">التاريخ</th>
                                                    <th className="text-center px-4 py-3 text-sm font-semibold text-gray-700 dark:text-gray-300">المدة</th>
                                                    <th className="text-center px-4 py-3 text-sm font-semibold text-gray-700 dark:text-gray-300">إجراءات</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-gray-200 dark:divide-gray-800">
                                                {filteredResults.map((result) => (
                                                    <tr key={result.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50">
                                                        <td className="px-4 py-4">
                                                            <div className="flex items-center gap-3">
                                                                <Avatar
                                                                    name={result.student_name || 'طالب'}
                                                                    size="sm"
                                                                    rounded="full"
                                                                />
                                                                <div>
                                                                    <p className="font-medium text-gray-900 dark:text-white">
                                                                        {result.student_name || 'طالب'}
                                                                    </p>
                                                                    <p className="text-xs text-gray-500 dark:text-gray-400">
                                                                        {result.student_email || ''}
                                                                    </p>
                                                                </div>
                                                            </div>
                                                        </td>
                                                        <td className="px-4 py-4">
                                                            <p className="text-sm text-gray-700 dark:text-gray-300">
                                                                {result.exam_title}
                                                            </p>
                                                        </td>
                                                        <td className="px-4 py-4 text-center">
                                                            <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm font-semibold ${getScoreColor(result.total_score || 0, result.max_score || 1)}`}>
                                                                {result.total_score || 0}/{result.max_score || 0}
                                                                <span className="text-xs opacity-70">
                                                                    ({Math.round(((result.total_score || 0) / (result.max_score || 1)) * 100)}%)
                                                                </span>
                                                            </span>
                                                        </td>
                                                        <td className="px-4 py-4 text-center">
                                                            <span className="text-sm text-gray-600 dark:text-gray-400">
                                                                {result.completed_at ? formatDate(result.completed_at) : '-'}
                                                            </span>
                                                        </td>
                                                        <td className="px-4 py-4 text-center">
                                                            <span className="text-sm text-gray-600 dark:text-gray-400">
                                                                {result.started_at && result.completed_at
                                                                    ? formatDuration(result.started_at, result.completed_at)
                                                                    : '-'}
                                                            </span>
                                                        </td>
                                                        <td className="px-4 py-4 text-center">
                                                            <Link
                                                                href={`/teacher/exams/${result.exam_id}/grade`}
                                                                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-primary-100 dark:bg-primary-900/30 text-primary-600 dark:text-primary-400 text-sm font-medium hover:bg-primary-200 dark:hover:bg-primary-900/50 transition-colors"
                                                            >
                                                                <Edit3 className="h-3.5 w-3.5" />
                                                                تصحيح
                                                            </Link>
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                )}
                            </motion.div>
                        ) : (
                            <motion.div
                                key="summary"
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -20 }}
                                className="grid grid-cols-1 md:grid-cols-2 gap-4"
                            >
                                {examSummaries.length === 0 ? (
                                    <div className="col-span-2 bg-white dark:bg-[#1c1c24] rounded-2xl p-12 border border-gray-200/60 dark:border-gray-800 text-center">
                                        <FileText className="h-16 w-16 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
                                        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                                            لا توجد امتحانات
                                        </h3>
                                        <p className="text-gray-500 dark:text-gray-400 mb-4">
                                            قم بإنشاء امتحان أولاً
                                        </p>
                                        <Link
                                            href="/teacher/exams/create"
                                            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-primary-500 text-white font-medium"
                                        >
                                            إنشاء امتحان
                                        </Link>
                                    </div>
                                ) : (
                                    examSummaries.map((exam) => (
                                        <div
                                            key={exam.id}
                                            className="bg-white dark:bg-[#1c1c24] rounded-2xl p-5 border border-gray-200/60 dark:border-gray-800"
                                        >
                                            <div className="flex items-start justify-between mb-4">
                                                <div className="flex items-center gap-3">
                                                    <div className="p-2 rounded-xl bg-primary-100 dark:bg-primary-900/30">
                                                        <FileText className="h-6 w-6 text-primary-600 dark:text-primary-400" />
                                                    </div>
                                                    <div>
                                                        <h3 className="font-bold text-gray-900 dark:text-white">
                                                            {exam.title}
                                                        </h3>
                                                        <span className={`text-xs px-2 py-0.5 rounded ${exam.language === 'arabic'
                                                            ? 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600'
                                                            : 'bg-blue-100 dark:bg-blue-900/30 text-blue-600'}`}>
                                                            {exam.language === 'arabic' ? 'عربي' : 'English'}
                                                        </span>
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="grid grid-cols-2 gap-4">
                                                <div className="bg-gray-50 dark:bg-gray-800/50 rounded-xl p-3 text-center">
                                                    <p className="text-2xl font-bold text-gray-900 dark:text-white">
                                                        {exam.attempts_count}
                                                    </p>
                                                    <p className="text-xs text-gray-500">محاولات</p>
                                                </div>
                                                <div className="bg-gray-50 dark:bg-gray-800/50 rounded-xl p-3 text-center">
                                                    <p className="text-2xl font-bold text-gray-900 dark:text-white">
                                                        {exam.avg_score.toFixed(1)}
                                                    </p>
                                                    <p className="text-xs text-gray-500">متوسط الدرجة</p>
                                                </div>
                                            </div>
                                            <button
                                                onClick={() => {
                                                    setSelectedExam(exam.id);
                                                    setView('results');
                                                }}
                                                className="w-full mt-4 px-4 py-2 rounded-xl bg-gray-100 dark:bg-gray-800 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
                                            >
                                                عرض التفاصيل
                                            </button>
                                        </div>
                                    ))
                                )}
                            </motion.div>
                        )}
                    </AnimatePresence>
                </main>
            </div>
            <Footer />
        </>
    );
}
