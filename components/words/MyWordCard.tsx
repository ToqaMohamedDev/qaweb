"use client";

import { memo } from "react";
import { Volume2, Trash2, Loader2, Star } from "lucide-react";
import {
    MyWord,
    getLemma,
    speakText,
    ALL_LANGUAGES,
} from "@/lib/utils/words";

interface MyWordCardProps {
    item: MyWord;
    isSaving: boolean;
    onRemove: (conceptId: string) => void;
    onClick: () => void;
}

function MyWordCardComponent({
    item,
    isSaving,
    onRemove,
    onClick,
}: MyWordCardProps) {
    const word = item.dictionary;
    if (!word) return null;

    const arabicLemma = getLemma(word, "ar");
    const englishLemma = getLemma(word, "en");

    return (
        <div
            className="group relative p-3 rounded-xl bg-zinc-900 dark:bg-zinc-900 border border-zinc-800 hover:border-purple-500/30 transition-all cursor-pointer"
            onClick={onClick}
        >
            {/* Header: Arabic + Actions */}
            <div className="flex items-center justify-between gap-2 mb-2">
                <div className="flex items-center gap-1.5 min-w-0">
                    {item.is_favorite && (
                        <Star className="w-3 h-3 text-yellow-400 fill-yellow-400 shrink-0" />
                    )}
                    <p className="text-base font-semibold text-amber-400 truncate" dir="rtl">
                        {arabicLemma}
                    </p>
                </div>
                <div className="flex items-center gap-1 shrink-0">
                    <button
                        onClick={(e) => {
                            e.stopPropagation();
                            speakText(englishLemma, "en");
                        }}
                        className="p-1.5 rounded-lg text-zinc-500 hover:bg-purple-500/20 hover:text-purple-400 transition-colors"
                        title="استمع"
                    >
                        <Volume2 className="w-3.5 h-3.5" />
                    </button>
                    <button
                        onClick={(e) => {
                            e.stopPropagation();
                            onRemove(word.concept_id);
                        }}
                        disabled={isSaving}
                        className="p-1.5 rounded-lg text-zinc-500 hover:bg-red-500/20 hover:text-red-400 transition-colors"
                        title="حذف"
                    >
                        {isSaving ? (
                            <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        ) : (
                            <Trash2 className="w-3.5 h-3.5" />
                        )}
                    </button>
                </div>
            </div>

            {/* English word */}
            <div className="flex items-center gap-1.5 mb-1" dir="ltr">
                <span className="text-xs">🇬🇧</span>
                <p className="text-lg font-bold text-white">{englishLemma}</p>
            </div>

            {/* Part of speech & Definition */}
            <div className="flex items-start gap-2" dir="ltr">
                {word.part_of_speech && (
                    <span className="shrink-0 px-1.5 py-0.5 rounded bg-purple-500/15 text-purple-300 text-[10px] font-medium">
                        {word.part_of_speech}
                    </span>
                )}
                {word.definition && (
                    <p className="text-xs text-zinc-500 line-clamp-1">{word.definition}</p>
                )}
            </div>

            {/* Languages preview */}
            {word.lexical_entries && Object.keys(word.lexical_entries).length > 1 && (
                <div className="flex gap-1 mt-2 pt-2 border-t border-zinc-800">
                    {Object.keys(word.lexical_entries).map((lang) => {
                        const langConfig = ALL_LANGUAGES.find((l) => l.code === lang);
                        return (
                            <span key={lang} className="text-xs opacity-50" title={langConfig?.name}>
                                {langConfig?.flag}
                            </span>
                        );
                    })}
                </div>
            )}
        </div>
    );
}

export const MyWordCard = memo(MyWordCardComponent);
