"use client";

// =============================================
// Teacher Exams - إدارة امتحانات المدرس
// =============================================

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { motion } from "framer-motion";
import {
    FileText,
    Plus,
    Search,
    Eye,
    Edit2,
    Trash2,
    CheckCircle2,
    XCircle,
    Users,
    Clock,
    ArrowLeft,
    Loader2,
    MoreHorizontal,
    Filter,
} from "lucide-react";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { useAuthStore, selectIsApprovedTeacher } from "@/lib/stores/useAuthStore";
import { createClient } from "@/lib/supabase";

interface TeacherExam {
    id: string;
    title: string | { ar?: string; en?: string };
    language: string;
    is_published: boolean;
    created_at: string;
    updated_at: string;
    duration_minutes: number;
    questions_count: number;
    attempts_count: number;
}

export default function TeacherExamsPage() {
    const router = useRouter();
    const { user } = useAuthStore();
    const isApprovedTeacher = useAuthStore(selectIsApprovedTeacher);

    const [exams, setExams] = useState<TeacherExam[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [mounted, setMounted] = useState(false);

    const [search, setSearch] = useState("");
    const [filter, setFilter] = useState<'all' | 'published' | 'draft'>('all');
    const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
    const [isDeleting, setIsDeleting] = useState(false);

    // Wait for hydration
    useEffect(() => {
        setMounted(true);
    }, []);

    // Fetch data immediately when mounted - no need to wait for auth store
    useEffect(() => {
        if (!mounted) return;
        console.log('[TeacherExams] Mounted - triggering data fetch');
        fetchExams();
    }, [mounted]);

    const fetchExams = async () => {
        // Safety timeout - 8 seconds (increased for Vercel cold starts)
        const timeoutId = setTimeout(() => setIsLoading(false), 8000);

        const supabase = createClient();

        try {
            // Get user ID - try getUser() first, fallback to Zustand
            let userId: string | null = null;

            const { data: userData, error: userError } = await supabase.auth.getUser();
            if (!userError && userData.user) {
                userId = userData.user.id;
            } else if (user?.id) {
                userId = user.id;
            }

            if (!userId) {
                console.log('No user found');
                clearTimeout(timeoutId);
                setIsLoading(false);
                return;
            }

            const { data, error } = await supabase
                .from('teacher_exams')
                .select('*')
                .eq('created_by', userId) // Use session user ID!
                .order('created_at', { ascending: false });

            if (error) {
                console.error('Supabase Error:', JSON.stringify(error, null, 2));
                throw error;
            }

            // Helper function to count questions from sections
            const countQuestions = (sections: any): number => {
                if (!sections || !Array.isArray(sections)) return 0;
                return sections.reduce((total: number, section: any) => {
                    if (section.questions && Array.isArray(section.questions)) {
                        return total + section.questions.length;
                    }
                    return total;
                }, 0);
            };

            // Map the data to match our interface
            const mappedExams = (data || []).map((exam: any) => ({
                id: exam.id,
                title: exam.exam_title || exam.title || 'امتحان بدون عنوان',
                language: exam.language || 'arabic',
                is_published: exam.is_published ?? false,
                created_at: exam.created_at,
                updated_at: exam.updated_at,
                duration_minutes: exam.duration_minutes || 30,
                questions_count: countQuestions(exam.sections),
                attempts_count: 0,
            }));

            setExams(mappedExams as TeacherExam[]);
        } catch (error: any) {
            console.error('Error fetching exams:', error);
        } finally {
            clearTimeout(timeoutId);
            setIsLoading(false);
        }
    };

    const handleDelete = async (examId: string) => {
        setIsDeleting(true);
        const supabase = createClient();

        try {
            // Refresh session before write operation (critical for Vercel)
            const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
            if (sessionError || !sessionData.session) {
                alert('الجلسة منتهية - يرجى تسجيل الدخول مرة أخرى');
                return;
            }

            const { error } = await supabase
                .from('teacher_exams')
                .delete()
                .eq('id', examId);

            if (error) throw error;

            setExams(exams.filter(e => e.id !== examId));
            setDeleteConfirm(null);
        } catch (error: any) {
            console.error('Error deleting exam:', error);
            alert(`فشل الحذف: ${error.message || 'حدث خطأ'}`);
        } finally {
            setIsDeleting(false);
        }
    };

    const handlePublishToggle = async (examId: string, currentStatus: boolean) => {
        const supabase = createClient();

        try {
            // Refresh session before write operation (critical for Vercel)
            const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
            if (sessionError || !sessionData.session) {
                alert('الجلسة منتهية - يرجى تسجيل الدخول مرة أخرى');
                return;
            }

            const { error } = await supabase
                .from('teacher_exams')
                .update({ is_published: !currentStatus })
                .eq('id', examId);

            if (error) throw error;

            // تحديث الحالة المحلية
            const updatedExams = exams.map(e =>
                e.id === examId ? { ...e, is_published: !currentStatus } : e
            );
            setExams(updatedExams);

            // إرسال إشعارات للمشتركين عند النشر (فقط عند التحويل من مسودة لمنشور)
            if (!currentStatus && user) {
                const exam = exams.find(e => e.id === examId);
                if (exam) {
                    try {
                        await fetch('/api/notifications/exam-published', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({
                                examId,
                                examTitle: getExamTitle(exam),
                                teacherId: user.id,
                                teacherName: user.name || 'المدرس'
                            })
                        });
                    } catch (notifyError) {
                        console.error('Failed to send notifications:', notifyError);
                    }
                }
            }
        } catch (error: any) {
            console.error('Error updating exam:', error);
            alert(`فشل التحديث: ${error.message || 'حدث خطأ'}`);
        }
    };

    const getExamTitle = (exam: TeacherExam) => {
        if (typeof exam.title === 'string') return exam.title;
        return exam.language === 'arabic' ? (exam.title?.ar || 'امتحان') : (exam.title?.en || 'Exam');
    };

    const filteredExams = exams.filter(exam => {
        const examTitle = getExamTitle(exam) || '';
        const matchSearch = examTitle.toLowerCase().includes(search.toLowerCase());
        const matchFilter = filter === 'all' ||
            (filter === 'published' ? exam.is_published : !exam.is_published);
        return matchSearch && matchFilter;
    });

    // Show loader while fetching data - simplified, no auth dependency
    const shouldShowLoading = !mounted || isLoading;

    if (shouldShowLoading) {
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

    return (
        <>
            <Navbar />
            <div className="min-h-screen bg-gradient-to-br from-gray-50 via-purple-50/30 to-blue-50/30 dark:from-[#0d0d14] dark:via-[#13131a] dark:to-[#0d0d14]" dir="rtl">
                {/* Background */}
                <div className="fixed inset-0 overflow-hidden pointer-events-none">
                    <div className="absolute top-20 right-1/4 w-96 h-96 bg-violet-500/5 rounded-full blur-3xl" />
                </div>

                <main className="relative container mx-auto px-4 py-8 max-w-5xl">
                    {/* Breadcrumb */}
                    <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400 mb-6">
                        <Link href="/teacher" className="hover:text-primary-500">لوحة التحكم</Link>
                        <span>/</span>
                        <span className="text-gray-900 dark:text-white">الامتحانات</span>
                    </div>

                    {/* Header */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8"
                    >
                        <div>
                            <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900 dark:text-white">
                                إدارة الامتحانات
                            </h1>
                            <p className="text-gray-600 dark:text-gray-400 mt-1">
                                {exams.length} امتحان
                            </p>
                        </div>
                        <Link
                            href="/teacher/exams/create"
                            className="inline-flex items-center gap-2 px-5 py-3 rounded-xl bg-gradient-to-r from-primary-500 to-pink-500 text-white font-semibold shadow-lg shadow-primary-500/25 hover:shadow-xl transition-all"
                        >
                            <Plus className="h-5 w-5" />
                            إنشاء امتحان جديد
                        </Link>
                    </motion.div>

                    {/* Filters */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.1 }}
                        className="bg-white dark:bg-[#1c1c24] rounded-2xl p-4 border border-gray-200/60 dark:border-gray-800 mb-6 flex flex-col sm:flex-row gap-4"
                    >
                        <div className="flex-1 relative">
                            <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                            <input
                                type="text"
                                placeholder="بحث في الامتحانات..."
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                className="w-full pr-10 pl-4 py-2.5 rounded-xl bg-gray-100 dark:bg-gray-800 text-sm outline-none focus:ring-2 focus:ring-primary-500"
                            />
                        </div>
                        <div className="flex gap-2">
                            {(['all', 'published', 'draft'] as const).map((f) => (
                                <button
                                    key={f}
                                    onClick={() => setFilter(f)}
                                    className={`px-4 py-2.5 rounded-xl text-sm font-medium transition-colors ${filter === f
                                        ? 'bg-primary-500 text-white'
                                        : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700'
                                        }`}
                                >
                                    {f === 'all' ? 'الكل' : f === 'published' ? 'منشور' : 'مسودة'}
                                </button>
                            ))}
                        </div>
                    </motion.div>

                    {/* Exams List */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.15 }}
                        className="space-y-4"
                    >
                        {filteredExams.length === 0 ? (
                            <div className="bg-white dark:bg-[#1c1c24] rounded-2xl p-12 border border-gray-200/60 dark:border-gray-800 text-center">
                                <FileText className="h-16 w-16 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
                                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                                    {exams.length === 0 ? 'لا توجد امتحانات' : 'لا توجد نتائج'}
                                </h3>
                                <p className="text-gray-500 dark:text-gray-400 mb-6">
                                    {exams.length === 0
                                        ? 'ابدأ بإنشاء أول امتحان لك'
                                        : 'جرب تغيير معايير البحث'
                                    }
                                </p>
                                {exams.length === 0 && (
                                    <Link
                                        href="/teacher/exams/create"
                                        className="inline-flex items-center gap-2 px-5 py-3 rounded-xl bg-primary-500 text-white font-medium hover:bg-primary-600 transition-colors"
                                    >
                                        <Plus className="h-5 w-5" />
                                        إنشاء امتحان
                                    </Link>
                                )}
                            </div>
                        ) : (
                            filteredExams.map((exam, index) => (
                                <motion.div
                                    key={exam.id}
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: 0.1 * index }}
                                    className="bg-white dark:bg-[#1c1c24] rounded-2xl border border-gray-200/60 dark:border-gray-800 p-5 hover:shadow-lg transition-shadow"
                                >
                                    <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                                        {/* Exam Info */}
                                        <div className="flex-1">
                                            <div className="flex items-start gap-3">
                                                <div className="p-2.5 rounded-xl bg-primary-100 dark:bg-primary-900/30">
                                                    <FileText className="h-6 w-6 text-primary-600 dark:text-primary-400" />
                                                </div>
                                                <div>
                                                    <h3 className="font-bold text-gray-900 dark:text-white mb-1">
                                                        {getExamTitle(exam)}
                                                    </h3>
                                                    <div className="flex flex-wrap items-center gap-3 text-sm text-gray-500 dark:text-gray-400">
                                                        <span className="flex items-center gap-1">
                                                            <Clock className="h-4 w-4" />
                                                            {exam.duration_minutes} دقيقة
                                                        </span>
                                                        <span className="flex items-center gap-1">
                                                            <FileText className="h-4 w-4" />
                                                            {exam.questions_count} سؤال
                                                        </span>
                                                        <span className="flex items-center gap-1">
                                                            <Users className="h-4 w-4" />
                                                            {exam.attempts_count || 0} محاولة
                                                        </span>
                                                        <span className={`px-2 py-0.5 rounded text-xs ${exam.language === 'arabic'
                                                            ? 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600'
                                                            : 'bg-blue-100 dark:bg-blue-900/30 text-blue-600'
                                                            }`}>
                                                            {exam.language === 'arabic' ? 'عربي' : 'English'}
                                                        </span>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Status & Actions */}
                                        <div className="flex items-center gap-2">
                                            <button
                                                onClick={() => handlePublishToggle(exam.id, exam.is_published)}
                                                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${exam.is_published
                                                    ? 'bg-green-100 dark:bg-green-900/30 text-green-600 hover:bg-green-200'
                                                    : 'bg-gray-100 dark:bg-gray-800 text-gray-500 hover:bg-amber-100 hover:text-amber-600'
                                                    }`}
                                            >
                                                {exam.is_published ? (
                                                    <><CheckCircle2 className="h-4 w-4" />منشور</>
                                                ) : (
                                                    <><XCircle className="h-4 w-4" />مسودة</>
                                                )}
                                            </button>

                                            <Link
                                                href={`/${exam.language}/teacher-exam/${exam.id}`}
                                                className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800"
                                                title="معاينة"
                                            >
                                                <Eye className="h-4 w-4 text-gray-500" />
                                            </Link>

                                            <Link
                                                href={`/teacher/exams/${exam.id}/edit`}
                                                className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800"
                                                title="تعديل"
                                            >
                                                <Edit2 className="h-4 w-4 text-gray-500" />
                                            </Link>

                                            <button
                                                onClick={() => setDeleteConfirm(exam.id)}
                                                className="p-2 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20"
                                                title="حذف"
                                            >
                                                <Trash2 className="h-4 w-4 text-red-500" />
                                            </button>
                                        </div>
                                    </div>

                                    {/* Delete Confirmation */}
                                    {deleteConfirm === exam.id && (
                                        <motion.div
                                            initial={{ opacity: 0, height: 0 }}
                                            animate={{ opacity: 1, height: 'auto' }}
                                            className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-800 flex items-center justify-between"
                                        >
                                            <p className="text-sm text-red-600 dark:text-red-400">
                                                هل أنت متأكد من حذف هذا الامتحان؟
                                            </p>
                                            <div className="flex gap-2">
                                                <button
                                                    onClick={() => setDeleteConfirm(null)}
                                                    className="px-3 py-1.5 rounded-lg bg-gray-100 dark:bg-gray-800 text-sm font-medium"
                                                >
                                                    إلغاء
                                                </button>
                                                <button
                                                    onClick={() => handleDelete(exam.id)}
                                                    disabled={isDeleting}
                                                    className="px-3 py-1.5 rounded-lg bg-red-500 text-white text-sm font-medium hover:bg-red-600 disabled:opacity-50"
                                                >
                                                    {isDeleting ? 'جاري الحذف...' : 'نعم، احذف'}
                                                </button>
                                            </div>
                                        </motion.div>
                                    )}
                                </motion.div>
                            ))
                        )}
                    </motion.div>
                </main>
            </div>
            <Footer />
        </>
    );
}
