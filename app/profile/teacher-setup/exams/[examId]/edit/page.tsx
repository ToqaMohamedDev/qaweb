"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { Loader2 } from "lucide-react";
import { Navbar } from "@/components/Navbar";

export default function EditExamPage({ params }: { params: { examId: string } }) {
    const router = useRouter();
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const checkExamType = async () => {
            try {
                const { data, error } = await supabase
                    .from("teacher_exams" as any)
                    .select("type")
                    .eq("id", params.examId)
                    .single();

                if (error) throw error;

                const examData = data as unknown as { type: string } | null;

                if (examData?.type === "arabic_comprehensive_exam") {
                    router.replace(`/profile/teacher-setup/exams/create/arabic?id=${params.examId}`);
                } else if (examData?.type === "english_comprehensive_exam") {
                    router.replace(`/profile/teacher-setup/exams/create/english?id=${params.examId}`);
                } else {
                    // Default or unknown type fallback
                    router.replace("/profile/teacher-setup/exams");
                }
            } catch (error) {
                console.error("Error fetching exam type:", error);
                router.replace("/profile/teacher-setup/exams");
            }
        };

        checkExamType();
    }, [params.examId, router]);

    return (
        <>
            <Navbar />
            <div className="min-h-screen flex flex-col items-center justify-center gap-4 bg-gray-50 dark:bg-[#13131a]">
                <Loader2 className="h-10 w-10 animate-spin text-primary-500" />
                <p className="text-gray-500 dark:text-gray-400">Loading exam...</p>
            </div>
        </>
    );
}
