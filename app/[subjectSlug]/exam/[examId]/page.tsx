"use client";

// =============================================
// Dynamic Exam Page - صفحة الامتحان الديناميكية
// =============================================

import { useParams } from "next/navigation";
import { UnifiedExamPlayer } from "@/components/exam/UnifiedExamPlayer";

export default function DynamicExamPage() {
    const params = useParams();
    const examId = params.examId as string;

    return (
        <UnifiedExamPlayer
            examId={examId}
            language="arabic"
        />
    );
}
