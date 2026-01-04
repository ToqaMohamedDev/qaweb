"use client";

import { SubjectPage } from "@/components/shared/SubjectPage";

export default function ArabicPage() {
    return (
        <SubjectPage
            subject="arabic"
            subjectSlug="arabic"
            subjectSearchPatterns="slug.eq.arabic,name.ilike.%عربي%"
        />
    );
}
