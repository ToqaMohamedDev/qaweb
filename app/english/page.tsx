"use client";

import { SubjectPage } from "@/components/shared/SubjectPage";

export default function EnglishPage() {
    return (
        <SubjectPage
            subject="english"
            subjectSlug="english"
            subjectSearchPatterns="slug.eq.english,name.ilike.%english%,name.ilike.%انجليزي%"
        />
    );
}
