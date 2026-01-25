"use client";

// =============================================
// Dynamic Lesson Page - صفحة الدرس الديناميكية
// =============================================

import { useParams } from "next/navigation";
import { LessonPageComponent } from "@/components/shared/LessonPage";

export default function DynamicLessonPage() {
    const params = useParams();
    const subjectSlug = params.subjectSlug as string;
    const lessonId = params.lessonId as string;

    return (
        <LessonPageComponent
            lessonId={lessonId}
            subject={subjectSlug as 'arabic' | 'english'}
        />
    );
}
