"use client";

// صفحة تعديل امتحان المدرس

import { useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";

export default function TeacherExamEditPage() {
    const params = useParams();
    const router = useRouter();
    const examId = params.examId as string;

    useEffect(() => {
        // التحويل لصفحة الإنشاء مع الـ ID كـ query parameter
        if (examId) {
            router.replace(`/teacher/exams/create?id=${examId}`);
        }
    }, [examId, router]);

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-[#0d0d14]">
            <div className="text-center">
                <Loader2 className="h-10 w-10 animate-spin text-primary-500 mx-auto mb-4" />
                <p className="text-gray-600 dark:text-gray-400">جاري تحميل الامتحان...</p>
            </div>
        </div>
    );
}
