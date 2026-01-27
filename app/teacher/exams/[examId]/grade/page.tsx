"use client";

// =============================================
// Teacher Exam Grading Page - صفحة تصحيح الامتحان
// =============================================

import { useParams } from "next/navigation";
import { ExamResultsGrading } from "@/components/teacher/ExamResultsGrading";

export default function TeacherExamGradingPage() {
    const params = useParams();
    const examId = params.examId as string;

    return (
        <ExamResultsGrading
            examId={examId}
            language="arabic"
        />
    );
}
