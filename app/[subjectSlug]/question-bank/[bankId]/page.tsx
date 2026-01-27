"use client";

// =============================================
// Question Bank Practice Page - صفحة تدريب بنك الأسئلة
// =============================================

import { useParams } from "next/navigation";
import { QuestionBankPlayer } from "@/components/exam/QuestionBankPlayer";

export default function QuestionBankPracticePage() {
    const params = useParams();
    const bankId = params.bankId as string;
    const subjectSlug = params.subjectSlug as string;

    // Determine language based on subject slug
    const language = subjectSlug === "english" ? "english" : "arabic";

    return (
        <QuestionBankPlayer
            questionBankId={bankId}
            language={language as "arabic" | "english"}
        />
    );
}
