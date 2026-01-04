"use client";

import { useParams } from "next/navigation";
import { LessonPageComponent } from "@/components/shared/LessonPage";

export default function ArabicLessonPage() {
    const params = useParams();
    const lessonId = params.lessonId as string;

    return <LessonPageComponent lessonId={lessonId} subject="arabic" />;
}
