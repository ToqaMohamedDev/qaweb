"use client";

// =============================================
// Dynamic Exam Page - صفحة الامتحان الديناميكية
// =============================================

import { useParams } from "next/navigation";
import { SectionExamPlayer } from "@/components/exam/SectionExamPlayer";

export default function DynamicExamPage() {
    const params = useParams();
    const examId = params.examId as string;
    const subjectSlug = params.subjectSlug as string;

    return (
        <SectionExamPlayer
            examId={examId}
            language={subjectSlug === "english" ? "english" : "arabic"}
        />
    );
}
