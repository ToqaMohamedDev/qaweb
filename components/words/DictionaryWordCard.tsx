"use client";

import { memo } from "react";
import { Volume2, BookmarkPlus, BookmarkCheck, Loader2 } from "lucide-react";
import {
    DictionaryWord,
    getLemma,
    getIpa,
    speakText,
    DISPLAY_LANGUAGES,
} from "@/lib/utils/words";

interface DictionaryWordCardProps {
    word: DictionaryWord;
    selectedLanguage: string;
    isSaved: boolean;
    isSaving: boolean;
    onSave: (conceptId: string) => void;
    onRemove: (conceptId: string) => void;
    onClick: () => void;
}

function DictionaryWordCardComponent({
    word,
    selectedLanguage,
    isSaved,
    isSaving,
    onSave,
    onRemove,
    onClick,
}: DictionaryWordCardProps) {
    const lemma = getLemma(word, selectedLanguage);
    const arabicLemma = getLemma(word, "ar");
    const ipa = getIpa(word, selectedLanguage);
    const langConfig = DISPLAY_LANGUAGES.find(l => l.code === selectedLanguage);

    return (
        <div
            className="group relative p-3 rounded-xl bg-zinc-900 dark:bg-zinc-900 border border-zinc-800 hover:border-purple-500/30 transition-all cursor-pointer"
            onClick={onClick}
        >
            {/* Header: Arabic word + Actions */}
            <div className="flex items-center justify-between gap-2 mb-2">
                <p className="text-base font-semibold text-amber-400 truncate" dir="rtl">
                    {arabicLemma}
                </p>
                <div className="flex items-center gap-1 shrink-0">
                    <button
                        onClick={(e) => {
                            e.stopPropagation();
                            speakText(lemma, selectedLanguage);
                        }}
                        className="p-1.5 rounded-lg text-zinc-500 hover:bg-purple-500/20 hover:text-purple-400 transition-colors"
                        title="استمع"
                    >
                        <Volume2 className="w-3.5 h-3.5" />
                    </button>
                    <button
                        onClick={(e) => {
                            e.stopPropagation();
                            if (isSaved) {
                                onRemove(word.concept_id);
                            } else {
                                onSave(word.concept_id);
                            }
                        }}
                        disabled={isSaving}
                        className={`p-1.5 rounded-lg transition-colors ${
                            isSaved
                                ? "text-green-400 hover:bg-green-500/20"
                                : "text-zinc-500 hover:bg-white/10"
                        }`}
                        title={isSaved ? "محفوظة" : "حفظ"}
                    >
                        {isSaving ? (
                            <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        ) : isSaved ? (
                            <BookmarkCheck className="w-3.5 h-3.5" />
                        ) : (
                            <BookmarkPlus className="w-3.5 h-3.5" />
                        )}
                    </button>
                </div>
            </div>

            {/* Foreign word */}
            <div className="flex items-center gap-1.5 mb-1" dir="ltr">
                <span className="text-xs">{langConfig?.flag}</span>
                <p className="text-lg font-bold text-white">{lemma}</p>
                {ipa && (
                    <span className="text-[10px] text-emerald-400/70 font-mono">/{ipa}/</span>
                )}
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
        </div>
    );
}

export const DictionaryWordCard = memo(DictionaryWordCardComponent);
