"use client";

// =============================================
// Dynamic Teacher Exam Page - صفحة امتحان المدرس الديناميكية
// Section-based display with all questions per section visible
// =============================================

import { useParams } from "next/navigation";
import { TeacherExamSectionPlayer } from "@/components/exam/TeacherExamSectionPlayer";

export default function DynamicTeacherExamPage() {
    const params = useParams();
    const examId = params.examId as string;
    const subjectSlug = params.subjectSlug as string;

    // Determine language based on subject slug
    const language = subjectSlug === "english" ? "english" : "arabic";

    return (
        <TeacherExamSectionPlayer
            examId={examId}
            language={language}
        />
    );
}
