"use client";

import { Loader2 } from "lucide-react";

interface WordsLoadingStateProps {
    className?: string;
}

export function WordsLoadingState({ className = "" }: WordsLoadingStateProps) {
    return (
        <div className={`flex items-center justify-center py-20 ${className}`}>
            <Loader2 className="w-8 h-8 animate-spin text-purple-500" />
        </div>
    );
}
