"use client";

// =============================================
// Teacher Exams Management Page - إدارة امتحانات المدرس
// =============================================

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import {
    Plus,
    FileText,
    Edit3,
    Trash2,
    Eye,
    EyeOff,
    Loader2,
    ArrowRight,
    CheckCircle,
    AlertCircle,
    Users,
    Clock,
    Award,
    BookOpen,
    Languages,
} from "lucide-react";
import { supabase } from "@/lib/supabase";
import { logger } from "@/lib/utils/logger";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";

interface TeacherExam {
    id: string;
    exam_title: string;
    exam_description: string | null;
    type: string;
    language: string;
    total_marks: number;
    duration_minutes: number;
    is_published: boolean;
    created_at: string;
    attempt_count?: number;
}

export default function TeacherExamsPage() {
    const router = useRouter();
    const [exams, setExams] = useState<TeacherExam[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [userId, setUserId] = useState<string | null>(null);
    const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
    const [isDeleting, setIsDeleting] = useState(false);
    const [notification, setNotification] = useState<{
        type: 'success' | 'error';
        message: string;
    } | null>(null);

    useEffect(() => {
        const fetchUserAndExams = async () => {
            try {
                const { data: { user } } = await supabase.auth.getUser();
                if (!user) {
                    router.push("/login");
                    return;
                }
                setUserId(user.id);

                // Fetch teacher's exams
                const { data: examsData, error: examsError } = await supabase
                    .from("teacher_exams" as any)
                    .select("*")
                    .eq("created_by", user.id)
                    .order("created_at", { ascending: false });

                if (examsError) throw examsError;

                // Get attempt counts for each exam
                const examsWithCounts: TeacherExam[] = await Promise.all(
                    (examsData || []).map(async (exam: any) => {
                        const { count } = await supabase
                            .from("teacher_exam_attempts" as any)
                            .select("*", { count: "exact", head: true })
                            .eq("exam_id", exam.id);

                        return {
                            id: exam.id,
                            exam_title: exam.exam_title,
                            exam_description: exam.exam_description,
                            type: exam.type,
                            language: exam.language || 'arabic',
                            total_marks: exam.total_marks || 0,
                            duration_minutes: exam.duration_minutes || 0,
                            is_published: exam.is_published || false,
                            created_at: exam.created_at,
                            attempt_count: count || 0,
                        };
                    })
                );

                setExams(examsWithCounts);
            } catch (err) {
                logger.error("Error fetching exams", { context: "TeacherExamsPage", data: err });
            } finally {
                setIsLoading(false);
            }
        };

        fetchUserAndExams();
    }, [router]);

    const handleTogglePublish = async (examId: string, currentState: boolean) => {
        try {
            const { error } = await supabase
                .from("teacher_exams" as any)
                .update({ is_published: !currentState })
                .eq("id", examId);

            if (error) throw error;

            setExams(prev =>
                prev.map(exam =>
                    exam.id === examId ? { ...exam, is_published: !currentState } : exam
                )
            );

            setNotification({
                type: 'success',
                message: currentState ? 'تم إخفاء الامتحان' : 'تم نشر الامتحان',
            });
            setTimeout(() => setNotification(null), 3000);
        } catch (err) {
            logger.error("Error toggling publish", { context: "TeacherExamsPage", data: err });
            setNotification({
                type: 'error',
                message: 'حدث خطأ أثناء تحديث الامتحان',
            });
        }
    };

    const handleDelete = async (examId: string) => {
        setIsDeleting(true);
        try {
            const { error } = await supabase
                .from("teacher_exams" as any)
                .delete()
                .eq("id", examId);

            if (error) throw error;

            setExams(prev => prev.filter(exam => exam.id !== examId));
            setDeleteConfirm(null);
            setNotification({
                type: 'success',
                message: 'تم حذف الامتحان بنجاح',
            });
            setTimeout(() => setNotification(null), 3000);
        } catch (err) {
            logger.error("Error deleting exam", { context: "TeacherExamsPage", data: err });
            setNotification({
                type: 'error',
                message: 'حدث خطأ أثناء حذف الامتحان',
            });
        } finally {
            setIsDeleting(false);
        }
    };

    const getExamTypeLabel = (type: string) => {
        switch (type) {
            case 'arabic_comprehensive_exam':
                return 'امتحان لغة عربية';
            case 'english_comprehensive_exam':
                return 'امتحان لغة إنجليزية';
            default:
                return 'امتحان';
        }
    };

    if (isLoading) {
        return (
            <>
                <Navbar />
                <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-[#13131a]">
                    <Loader2 className="h-10 w-10 text-primary-500 animate-spin" />
                </div>
            </>
        );
    }

    return (
        <>
            <Navbar />
            <div className="min-h-screen bg-gray-50 dark:bg-[#13131a] pt-4" dir="rtl">
                {/* Notification */}
                <AnimatePresence>
                    {notification && (
                        <motion.div
                            initial={{ opacity: 0, y: -20 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -20 }}
                            className={`fixed top-20 right-4 z-50 flex items-center gap-2 px-4 py-3 rounded-xl shadow-lg ${notification.type === 'success'
                                ? 'bg-green-500 text-white'
                                : 'bg-red-500 text-white'
                                }`}
                        >
                            {notification.type === 'success' ? (
                                <CheckCircle className="h-5 w-5" />
                            ) : (
                                <AlertCircle className="h-5 w-5" />
                            )}
                            <span>{notification.message}</span>
                        </motion.div>
                    )}
                </AnimatePresence>

                <div className="max-w-5xl mx-auto px-4 py-8">
                    {/* Header */}
                    <div className="flex items-center justify-between mb-8">
                        <div className="flex items-center gap-4">
                            <Link
                                href="/profile/teacher-setup"
                                className="p-2 rounded-xl bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
                            >
                                <ArrowRight className="h-5 w-5" />
                            </Link>
                            <div>
                                <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                                    امتحاناتي
                                </h1>
                                <p className="text-gray-500 dark:text-gray-400 text-sm">
                                    إنشاء وإدارة الامتحانات الخاصة بك
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Create New Exam - Coming Soon */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
                        <div
                            className="flex items-center gap-4 p-5 rounded-2xl bg-gradient-to-br from-gray-400 to-gray-500 text-white cursor-not-allowed opacity-60"
                        >
                            <div className="w-12 h-12 rounded-xl bg-white/20 flex items-center justify-center">
                                <BookOpen className="h-6 w-6" />
                            </div>
                            <div>
                                <span className="block font-bold text-lg">امتحان لغة عربية</span>
                                <span className="text-sm opacity-80">قريباً...</span>
                            </div>
                        </div>

                        <div
                            className="flex items-center gap-4 p-5 rounded-2xl bg-gradient-to-br from-gray-400 to-gray-500 text-white cursor-not-allowed opacity-60"
                        >
                            <div className="w-12 h-12 rounded-xl bg-white/20 flex items-center justify-center">
                                <Languages className="h-6 w-6" />
                            </div>
                            <div>
                                <span className="block font-bold text-lg">امتحان لغة إنجليزية</span>
                                <span className="text-sm opacity-80">Coming Soon...</span>
                            </div>
                        </div>
                    </div>

                    {/* Exams List */}
                    {exams.length === 0 ? (
                        <div className="bg-white dark:bg-[#1c1c24] rounded-2xl border border-gray-200 dark:border-gray-800 p-12 text-center">
                            <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-gray-100 dark:bg-gray-800 flex items-center justify-center">
                                <FileText className="h-8 w-8 text-gray-400" />
                            </div>
                            <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">
                                لا توجد امتحانات بعد
                            </h3>
                            <p className="text-gray-500 dark:text-gray-400 mb-6">
                                ابدأ بإنشاء أول امتحان لك وشاركه مع طلابك
                            </p>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {exams.map((exam, index) => (
                                <motion.div
                                    key={exam.id}
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: index * 0.05 }}
                                    className="bg-white dark:bg-[#1c1c24] rounded-2xl border border-gray-200 dark:border-gray-800 p-5 hover:border-primary-300 dark:hover:border-primary-700 transition-colors"
                                >
                                    <div className="flex items-start justify-between gap-4">
                                        <div className="flex-1">
                                            <div className="flex items-center gap-3 mb-2">
                                                <h3 className="text-lg font-bold text-gray-900 dark:text-white">
                                                    {exam.exam_title}
                                                </h3>
                                                <span className={`px-2 py-1 rounded-lg text-xs font-medium ${exam.is_published
                                                    ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300'
                                                    : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400'
                                                    }`}>
                                                    {exam.is_published ? 'منشور' : 'مسودة'}
                                                </span>
                                            </div>

                                            {exam.exam_description && (
                                                <p className="text-gray-500 dark:text-gray-400 text-sm mb-3 line-clamp-2">
                                                    {exam.exam_description}
                                                </p>
                                            )}

                                            <div className="flex flex-wrap gap-4 text-sm text-gray-500 dark:text-gray-400">
                                                <span className="flex items-center gap-1.5">
                                                    <FileText className="h-4 w-4" />
                                                    {getExamTypeLabel(exam.type)}
                                                </span>
                                                <span className="flex items-center gap-1.5">
                                                    <Clock className="h-4 w-4" />
                                                    {exam.duration_minutes} دقيقة
                                                </span>
                                                <span className="flex items-center gap-1.5">
                                                    <Award className="h-4 w-4" />
                                                    {exam.total_marks} درجة
                                                </span>
                                                <span className="flex items-center gap-1.5">
                                                    <Users className="h-4 w-4" />
                                                    {exam.attempt_count} محاولة
                                                </span>
                                            </div>
                                        </div>

                                        <div className="flex items-center gap-2">
                                            <button
                                                onClick={() => handleTogglePublish(exam.id, exam.is_published)}
                                                className={`p-2.5 rounded-xl transition-colors ${exam.is_published
                                                    ? 'bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400 hover:bg-green-200 dark:hover:bg-green-900/50'
                                                    : 'bg-gray-100 dark:bg-gray-800 text-gray-500 hover:bg-gray-200 dark:hover:bg-gray-700'
                                                    }`}
                                                title={exam.is_published ? 'إخفاء' : 'نشر'}
                                            >
                                                {exam.is_published ? <Eye className="h-5 w-5" /> : <EyeOff className="h-5 w-5" />}
                                            </button>
                                            <Link
                                                href={`/profile/teacher-setup/exams/${exam.id}/edit`}
                                                className="p-2.5 rounded-xl bg-primary-100 dark:bg-primary-900/30 text-primary-600 dark:text-primary-400 hover:bg-primary-200 dark:hover:bg-primary-900/50 transition-colors"
                                            >
                                                <Edit3 className="h-5 w-5" />
                                            </Link>
                                            <button
                                                onClick={() => setDeleteConfirm(exam.id)}
                                                className="p-2.5 rounded-xl bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 hover:bg-red-200 dark:hover:bg-red-900/50 transition-colors"
                                            >
                                                <Trash2 className="h-5 w-5" />
                                            </button>
                                        </div>
                                    </div>
                                </motion.div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Delete Confirmation Modal */}
                <AnimatePresence>
                    {deleteConfirm && (
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4"
                        >
                            <motion.div
                                initial={{ scale: 0.95 }}
                                animate={{ scale: 1 }}
                                exit={{ scale: 0.95 }}
                                className="bg-white dark:bg-[#1c1c24] rounded-2xl p-6 max-w-sm w-full shadow-xl"
                            >
                                <div className="text-center">
                                    <div className="w-12 h-12 mx-auto mb-4 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center">
                                        <Trash2 className="h-6 w-6 text-red-600 dark:text-red-400" />
                                    </div>
                                    <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">
                                        حذف الامتحان؟
                                    </h3>
                                    <p className="text-gray-500 dark:text-gray-400 mb-6">
                                        سيتم حذف الامتحان وجميع المحاولات المرتبطة به نهائياً.
                                    </p>
                                    <div className="flex gap-3">
                                        <button
                                            onClick={() => setDeleteConfirm(null)}
                                            className="flex-1 px-4 py-2.5 rounded-xl bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 font-medium hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
                                        >
                                            إلغاء
                                        </button>
                                        <button
                                            onClick={() => handleDelete(deleteConfirm)}
                                            disabled={isDeleting}
                                            className="flex-1 px-4 py-2.5 rounded-xl bg-red-600 text-white font-medium hover:bg-red-700 transition-colors disabled:opacity-50"
                                        >
                                            {isDeleting ? (
                                                <Loader2 className="h-5 w-5 animate-spin mx-auto" />
                                            ) : (
                                                'حذف'
                                            )}
                                        </button>
                                    </div>
                                </div>
                            </motion.div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
            <Footer />
        </>
    );
}
