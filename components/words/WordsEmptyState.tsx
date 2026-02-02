"use client";

import { Search, BookMarked, BookOpen } from "lucide-react";
import Link from "next/link";

type EmptyStateType = "no-results" | "not-logged-in" | "no-saved-words";

interface WordsEmptyStateProps {
    type: EmptyStateType;
    searchQuery?: string;
    onAction?: () => void;
}

const EMPTY_STATES: Record<EmptyStateType, {
    icon: typeof Search;
    title: string;
    description: string;
    actionText?: string;
    actionLink?: string;
}> = {
    "no-results": {
        icon: Search,
        title: "لا توجد نتائج",
        description: "جرب البحث بكلمات مختلفة",
    },
    "not-logged-in": {
        icon: BookMarked,
        title: "سجل دخولك أولاً",
        description: "لعرض كلماتك المحفوظة",
        actionText: "تسجيل الدخول",
        actionLink: "/login?redirect=/words",
    },
    "no-saved-words": {
        icon: BookOpen,
        title: "لم تحفظ أي كلمات بعد",
        description: "اذهب للقاموس واحفظ الكلمات التي تريد تعلمها",
        actionText: "تصفح القاموس",
    },
};

export function WordsEmptyState({ type, searchQuery, onAction }: WordsEmptyStateProps) {
    const config = EMPTY_STATES[type];
    const Icon = config.icon;

    return (
        <div className="text-center py-20">
            <div className="w-16 h-16 mx-auto rounded-2xl bg-white/5 flex items-center justify-center mb-4">
                <Icon className="w-8 h-8 text-zinc-600" />
            </div>
            <h3 className="text-lg font-semibold text-white mb-2">
                {config.title}
            </h3>
            <p className="text-zinc-500 text-sm mb-4">
                {searchQuery ? `لم يتم العثور على نتائج لـ "${searchQuery}"` : config.description}
            </p>
            {config.actionLink ? (
                <Link
                    href={config.actionLink}
                    className="inline-block px-5 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-sm font-medium transition-colors"
                >
                    {config.actionText}
                </Link>
            ) : config.actionText && onAction ? (
                <button
                    onClick={onAction}
                    className="inline-block px-5 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-sm font-medium transition-colors"
                >
                    {config.actionText}
                </button>
            ) : null}
        </div>
    );
}
