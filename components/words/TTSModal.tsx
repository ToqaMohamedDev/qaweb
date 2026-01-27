"use client";

import { useState, useEffect, useCallback } from "react";
import { X, Volume2, Loader2 } from "lucide-react";

interface TTSModalProps {
    isOpen: boolean;
    onClose: () => void;
    languages: { code: string; name_ar?: string; name_en: string; flag_emoji?: string }[];
    onSpeak: (text: string, lang: string) => void;
}

export function TTSModal({ isOpen, onClose, languages, onSpeak }: TTSModalProps) {
    const [text, setText] = useState("");
    const [lang, setLang] = useState("en");
    const [isSpeaking, setIsSpeaking] = useState(false);

    useEffect(() => {
        const handleEscape = (e: KeyboardEvent) => {
            if (e.key === "Escape") onClose();
        };
        if (isOpen) {
            document.addEventListener("keydown", handleEscape);
            document.body.style.overflow = "hidden";
        }
        return () => {
            document.removeEventListener("keydown", handleEscape);
            document.body.style.overflow = "";
        };
    }, [isOpen, onClose]);

    const handleBackdropClick = useCallback((e: React.MouseEvent) => {
        if (e.target === e.currentTarget) onClose();
    }, [onClose]);

    const handleSpeak = () => {
        if (!text.trim()) return;
        setIsSpeaking(true);
        onSpeak(text.trim(), lang);
        setTimeout(() => setIsSpeaking(false), 1000);
    };

    if (!isOpen) return null;

    return (
        <div 
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
            onClick={handleBackdropClick}
        >
            {/* Backdrop */}
            <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" />
            
            {/* Modal */}
            <div 
                className="relative w-full max-w-md bg-[#141417] border border-white/10 rounded-2xl shadow-2xl animate-in zoom-in-95 duration-200"
                dir="rtl"
            >
                {/* Header */}
                <div className="flex items-center justify-between p-4 border-b border-white/5">
                    <h2 className="text-base font-bold text-white flex items-center gap-2">
                        <Volume2 className="w-5 h-5 text-purple-400" />
                        نطق كلمة
                    </h2>
                    <button
                        onClick={onClose}
                        className="p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-white/10 transition-colors"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Content */}
                <div className="p-4 space-y-4">
                    <div>
                        <label className="block text-xs text-zinc-400 mb-2">اكتب الكلمة أو الجملة</label>
                        <input
                            type="text"
                            value={text}
                            onChange={(e) => setText(e.target.value)}
                            onKeyDown={(e) => e.key === "Enter" && handleSpeak()}
                            placeholder="مثال: Hello World"
                            autoFocus
                            className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500/50 transition-all"
                        />
                    </div>

                    <div>
                        <label className="block text-xs text-zinc-400 mb-2">اختر اللغة</label>
                        <div className="flex flex-wrap gap-2">
                            {languages.map((l) => (
                                <button
                                    key={l.code}
                                    onClick={() => setLang(l.code)}
                                    className={`px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                                        lang === l.code
                                            ? "bg-purple-600 text-white"
                                            : "bg-white/5 text-zinc-400 hover:bg-white/10 hover:text-white"
                                    }`}
                                >
                                    {l.flag_emoji} {l.name_ar || l.name_en}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Footer */}
                <div className="p-4 border-t border-white/5">
                    <button
                        onClick={handleSpeak}
                        disabled={!text.trim() || isSpeaking}
                        className="w-full py-3 rounded-xl bg-purple-600 hover:bg-purple-500 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold flex items-center justify-center gap-2 transition-colors"
                    >
                        {isSpeaking ? (
                            <Loader2 className="w-5 h-5 animate-spin" />
                        ) : (
                            <Volume2 className="w-5 h-5" />
                        )}
                        نطق الكلمة
                    </button>
                </div>
            </div>
        </div>
    );
}
