"use client";

import { useParams } from "next/navigation";
import { LessonPageComponent } from "@/components/shared/LessonPage";

export default function EnglishLessonPage() {
    const params = useParams();
    const lessonId = params.lessonId as string;

    return <LessonPageComponent lessonId={lessonId} subject="english" />;
}
