"use client";

import { X, Volume2, BookmarkPlus, BookmarkCheck, Loader2, Copy, Check } from "lucide-react";
import { useState, useEffect } from "react";
import {
    DictionaryWord,
    LexicalEntry,
    LANGUAGES,
    speakText,
    translateGender,
} from "@/lib/utils/words";

interface WordDetailModalProps {
    word: DictionaryWord | null;
    isOpen: boolean;
    onClose: () => void;
    isSaved: boolean;
    onSave: (conceptId: string) => Promise<void>;
    onRemove: (conceptId: string) => Promise<void>;
}

export function WordDetailModal({
    word,
    isOpen,
    onClose,
    isSaved,
    onSave,
    onRemove,
}: WordDetailModalProps) {
    const [activeTab, setActiveTab] = useState<string>("en");
    const [isSaving, setIsSaving] = useState(false);
    const [copiedIpa, setCopiedIpa] = useState<string | null>(null);

    useEffect(() => {
        if (isOpen) {
            document.body.style.overflow = "hidden";
        } else {
            document.body.style.overflow = "";
        }
        return () => {
            document.body.style.overflow = "";
        };
    }, [isOpen]);

    if (!isOpen || !word) return null;

    const lexicalEntries = word.lexical_entries || {};
    const availableLanguages = Object.keys(lexicalEntries).filter(
        (lang) => lang in LANGUAGES
    );
    const currentEntry = lexicalEntries[activeTab] as LexicalEntry | undefined;
    const langConfig = LANGUAGES[activeTab];

    const handleSaveToggle = async () => {
        setIsSaving(true);
        try {
            if (isSaved) {
                await onRemove(word.concept_id);
            } else {
                await onSave(word.concept_id);
            }
        } finally {
            setIsSaving(false);
        }
    };

    const copyIpa = (ipa: string) => {
        navigator.clipboard.writeText(ipa);
        setCopiedIpa(ipa);
        setTimeout(() => setCopiedIpa(null), 2000);
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-black/80 backdrop-blur-sm"
                onClick={onClose}
            />

            {/* Modal */}
            <div className="relative w-full max-w-2xl max-h-[90vh] overflow-hidden rounded-2xl bg-[#0f0f12] border border-white/10 shadow-2xl">
                {/* Header */}
                <div className="sticky top-0 z-10 flex items-center justify-between p-4 border-b border-white/5 bg-[#0f0f12]">
                    <div className="flex items-center gap-3">
                        <h2 className="text-xl font-bold text-white">
                            {word.word_family_root}
                        </h2>
                        {word.part_of_speech && (
                            <span className="px-2 py-0.5 rounded-md bg-purple-500/20 text-purple-300 text-xs font-medium">
                                {word.part_of_speech}
                            </span>
                        )}
                    </div>
                    <div className="flex items-center gap-2">
                        <button
                            onClick={handleSaveToggle}
                            disabled={isSaving}
                            className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${isSaved
                                ? "bg-green-500/20 text-green-400 hover:bg-green-500/30"
                                : "bg-purple-500/20 text-purple-300 hover:bg-purple-500/30"
                                }`}
                        >
                            {isSaving ? (
                                <Loader2 className="w-4 h-4 animate-spin" />
                            ) : isSaved ? (
                                <BookmarkCheck className="w-4 h-4" />
                            ) : (
                                <BookmarkPlus className="w-4 h-4" />
                            )}
                            {isSaved ? "محفوظة" : "حفظ"}
                        </button>
                        <button
                            onClick={onClose}
                            className="p-2 rounded-lg hover:bg-white/10 text-zinc-400 hover:text-white transition-colors"
                        >
                            <X className="w-5 h-5" />
                        </button>
                    </div>
                </div>

                {/* Content */}
                <div className="overflow-y-auto max-h-[calc(90vh-80px)] p-4 space-y-6">
                    {/* Definition */}
                    {word.definition && (
                        <div className="p-4 rounded-xl bg-white/5 border border-white/5">
                            <h3 className="text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-2">
                                التعريف
                            </h3>
                            <p className="text-white leading-relaxed text-left" dir="ltr">{word.definition}</p>
                        </div>
                    )}

                    {/* Domains */}
                    {word.domains && word.domains.length > 0 && (
                        <div className="flex flex-wrap gap-2">
                            {word.domains.map((domain, i) => (
                                <span
                                    key={i}
                                    className="px-3 py-1 rounded-full bg-blue-500/10 text-blue-300 text-xs font-medium"
                                >
                                    {domain}
                                </span>
                            ))}
                        </div>
                    )}

                    {/* Language Tabs */}
                    <div className="flex gap-2 p-1 rounded-xl bg-white/5 overflow-x-auto scrollbar-hide">
                        {availableLanguages.map((lang) => {
                            const config = LANGUAGES[lang];
                            return (
                                <button
                                    key={lang}
                                    onClick={() => setActiveTab(lang)}
                                    className={`shrink-0 flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors whitespace-nowrap min-w-fit ${activeTab === lang
                                        ? "bg-purple-600 text-white"
                                        : "text-zinc-400 hover:text-white hover:bg-white/5"
                                        }`}
                                >
                                    <span>{config?.flag}</span>
                                    <span>{config?.nameAr}</span>
                                </button>
                            );
                        })}
                    </div>

                    {/* Language Content */}
                    {currentEntry && (
                        <div
                            className="space-y-4"
                            dir={langConfig?.dir || "ltr"}
                        >
                            {/* Lemma with pronunciation */}
                            <div className="flex items-center justify-between p-4 rounded-xl bg-gradient-to-r from-purple-500/10 to-blue-500/10 border border-white/5">
                                <div>
                                    <p className="text-2xl font-bold text-white mb-1">
                                        {currentEntry.lemma}
                                    </p>
                                    {currentEntry.gender && (
                                        <span className="text-xs text-zinc-400">
                                            ({translateGender(currentEntry.gender)})
                                        </span>
                                    )}
                                </div>
                                <button
                                    onClick={() => speakText(currentEntry.lemma, activeTab)}
                                    className="p-3 rounded-xl bg-purple-600 hover:bg-purple-500 text-white transition-colors"
                                >
                                    <Volume2 className="w-5 h-5" />
                                </button>
                            </div>

                            {/* Pronunciations */}
                            {currentEntry.pronunciations && currentEntry.pronunciations.length > 0 && (
                                <div className="p-4 rounded-xl bg-white/5 border border-white/5">
                                    <h4 className="text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-3">
                                        النطق
                                    </h4>
                                    <div className="space-y-2">
                                        {currentEntry.pronunciations.map((p, i) => (
                                            <div key={i} className="flex items-center justify-between">
                                                <div className="flex items-center gap-3">
                                                    <code className="px-3 py-1.5 rounded-lg bg-zinc-800 text-emerald-400 font-mono text-sm">
                                                        {p.ipa}
                                                    </code>
                                                    <span className="text-xs text-zinc-500">{p.region}</span>
                                                </div>
                                                <button
                                                    onClick={() => copyIpa(p.ipa)}
                                                    className="p-1.5 rounded-lg hover:bg-white/10 text-zinc-400 hover:text-white transition-colors"
                                                >
                                                    {copiedIpa === p.ipa ? (
                                                        <Check className="w-4 h-4 text-green-400" />
                                                    ) : (
                                                        <Copy className="w-4 h-4" />
                                                    )}
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Inflections */}
                            {currentEntry.inflections && currentEntry.inflections.length > 0 && (
                                <div className="p-4 rounded-xl bg-white/5 border border-white/5">
                                    <h4 className="text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-3">
                                        التصريفات
                                    </h4>
                                    <div className="flex flex-wrap gap-2">
                                        {currentEntry.inflections.map((inf, i) => (
                                            <span
                                                key={i}
                                                className="px-3 py-1.5 rounded-lg bg-zinc-800 text-zinc-300 text-sm"
                                            >
                                                {inf.form}
                                                {inf.features && inf.features.length > 0 && (
                                                    <span className="text-zinc-500 mr-1">
                                                        {" "}({inf.features.join(", ")})
                                                    </span>
                                                )}
                                            </span>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Examples */}
                            {currentEntry.examples && currentEntry.examples.length > 0 && (
                                <div className="p-4 rounded-xl bg-white/5 border border-white/5">
                                    <h4 className="text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-3">
                                        أمثلة
                                    </h4>
                                    <ul className="space-y-2">
                                        {currentEntry.examples.map((ex, i) => (
                                            <li
                                                key={i}
                                                className="flex items-start gap-2 text-zinc-300"
                                            >
                                                <span className="text-purple-400 mt-1">•</span>
                                                <span>{ex}</span>
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            )}
                        </div>
                    )}

                    {/* Relations */}
                    {word.relations && (
                        <div className="grid grid-cols-2 gap-4">
                            {word.relations.synonyms && word.relations.synonyms.length > 0 && (
                                <div className="p-4 rounded-xl bg-green-500/5 border border-green-500/10">
                                    <h4 className="text-xs font-semibold text-green-400 uppercase tracking-wider mb-3">
                                        المرادفات
                                    </h4>
                                    <div className="flex flex-wrap gap-2">
                                        {word.relations.synonyms.map((syn, i) => (
                                            <span
                                                key={i}
                                                className="px-2 py-1 rounded-md bg-green-500/10 text-green-300 text-sm"
                                            >
                                                {syn}
                                            </span>
                                        ))}
                                    </div>
                                </div>
                            )}
                            {word.relations.antonyms && word.relations.antonyms.length > 0 && (
                                <div className="p-4 rounded-xl bg-red-500/5 border border-red-500/10">
                                    <h4 className="text-xs font-semibold text-red-400 uppercase tracking-wider mb-3">
                                        الأضداد
                                    </h4>
                                    <div className="flex flex-wrap gap-2">
                                        {word.relations.antonyms.map((ant, i) => (
                                            <span
                                                key={i}
                                                className="px-2 py-1 rounded-md bg-red-500/10 text-red-300 text-sm"
                                            >
                                                {ant}
                                            </span>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
