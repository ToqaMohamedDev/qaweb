"use client";

// =============================================
// Dynamic Teacher Exam Page - صفحة امتحان المدرس الديناميكية
// =============================================

import { useParams } from "next/navigation";
import { UnifiedExamPlayer } from "@/components/exam/UnifiedExamPlayer";

export default function DynamicTeacherExamPage() {
    const params = useParams();
    const examId = params.examId as string;
    const subjectSlug = params.subjectSlug as string;

    // Determine language based on subject slug
    const language = subjectSlug === "english" ? "english" : "arabic";

    return (
        <UnifiedExamPlayer
            examId={examId}
            language={language}
            isTeacherExam={true}
        />
    );
}
