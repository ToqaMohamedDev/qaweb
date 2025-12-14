"use client";

import { useEffect, useMemo, useState, useRef, useCallback } from "react";
import { Volume2, Copy, RefreshCw, Check } from "lucide-react";

type Lang = "en" | "ar";

const detectLang = (text: string): Lang =>
  /[ء-ي]/.test(text) ? "ar" : "en";

export function SelectionTranslator() {
  const [selectedText, setSelectedText] = useState("");
  const [translated, setTranslated] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [copied, setCopied] = useState(false);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const selectedRef = useRef<string>("");

  const sourceLang = useMemo(
    () => (selectedText ? detectLang(selectedText) : "en"),
    [selectedText]
  );
  const targetLang: Lang = sourceLang === "en" ? "ar" : "en";

  const translate = useCallback(async () => {
    if (!selectedText) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(
        `https://api.mymemory.translated.net/get?q=${encodeURIComponent(
          selectedText
        )}&langpair=${sourceLang}|${targetLang}`
      );
      if (!res.ok) throw new Error("تعذر الوصول لخدمة الترجمة");
      const data = await res.json();
      const translatedText =
        data?.responseData?.translatedText?.trim() || "";
      setTranslated(translatedText);
      setCopied(false);
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : "حدث خطأ أثناء الترجمة";
      setError(message);
    } finally {
      setLoading(false);
    }
  }, [selectedText, sourceLang, targetLang]);

  useEffect(() => {
    const isInsideContainer = (node: Node | null) => {
      if (!node || !containerRef.current) return false;
      let current: Node | null = node;
      while (current) {
        if (current === containerRef.current) return true;
        current = (current as HTMLElement).parentNode;
      }
      return false;
    };

    const handleMouseUp = (e: MouseEvent) => {
      // Ignore clicks inside the translator completely
      if (e.target && containerRef.current?.contains(e.target as Node)) {
        return;
      }

      const selection = window.getSelection();
      const text = selection?.toString().trim() || "";

      // Ignore selections that happen inside the translator itself
      const anchorNode = selection?.anchorNode || null;
      if (isInsideContainer(anchorNode)) return;

      if (!text || text.length < 1) return;

      // Avoid re-fetch when selecting the same text (using ref to avoid stale closures)
      if (text === selectedRef.current) return;

      if (text.length > 80) {
        setSelectedText("");
        setTranslated("");
        setError("اختر كلمة أو جملة قصيرة (أقل من 80 حرف)");
        return;
      }

      setSelectedText(text);
      setTranslated("");
      setError(null);
      setCopied(false);
      selectedRef.current = text;
    };

    document.addEventListener("mouseup", handleMouseUp);
    return () => {
      document.removeEventListener("mouseup", handleMouseUp);
    };
  }, []);

  useEffect(() => {
    if (selectedText) {
      translate();
    }
    selectedRef.current = selectedText;
  }, [selectedText, translate]);

  const speakText = (content: string, lang: Lang) => {
    if (typeof window === "undefined" || !window.speechSynthesis || !content)
      return;
    const utterance = new SpeechSynthesisUtterance(content);
    utterance.lang = lang === "ar" ? "ar-SA" : "en-US";
    utterance.rate = 1;
    utterance.onend = () => setIsSpeaking(false);
    utterance.onerror = () => setIsSpeaking(false);
    window.speechSynthesis.cancel();
    setIsSpeaking(true);
    window.speechSynthesis.speak(utterance);
  };

  const clear = () => {
    setSelectedText("");
    setTranslated("");
    setError(null);
    setCopied(false);
  };

  const copyResult = async () => {
    if (!copyText) return;
    try {
      await navigator.clipboard.writeText(copyText);
      setCopied(true);
      setTimeout(() => setCopied(false), 1200);
    } catch {
      setError("تعذر النسخ، حاول يدويًا");
    }
  };

  if (!selectedText) return null;

  const canSpeakEnglish = sourceLang === "en";
  const copyText = [selectedText, translated].filter(Boolean).join("\n");

  return (
    <div
      ref={containerRef}
      onMouseDown={(e) => e.stopPropagation()}
      onMouseUp={(e) => e.stopPropagation()}
      className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-50 w-80 max-w-[90vw] rounded-2xl border border-white/30 dark:border-white/10 bg-linear-to-br from-white/70 via-white/60 to-white/50 dark:from-[#0b0f1a]/80 dark:via-[#0b0f1a]/70 dark:to-[#0b0f1a]/60 shadow-2xl backdrop-blur-2xl"
    >
      <div className="flex items-center justify-between px-4 py-3 border-b border-white/30 dark:border-white/10 text-sm">
        <span className="font-semibold text-gray-900 dark:text-gray-100">ترجمة سريعة</span>
        <button
          onClick={clear}
          className="text-[12px] px-2 py-1 rounded-full bg-gray-900/5 dark:bg-white/5 text-gray-600 dark:text-gray-300 hover:bg-gray-900/10 dark:hover:bg-white/10 transition-colors"
          aria-label="إغلاق"
        >
          إغلاق
        </button>
      </div>

      <div className="p-4 space-y-3">
        <p
          className="text-sm text-gray-900 dark:text-gray-100 leading-relaxed p-3 rounded-xl border border-white/40 dark:border-white/10 bg-white/60 dark:bg-white/5 shadow-inner"
          dir={sourceLang === "ar" ? "rtl" : "ltr"}
        >
          {selectedText}
        </p>

        {translated && (
          <p
            className="text-sm text-gray-900 dark:text-gray-100 leading-relaxed p-3 rounded-xl border border-primary-200/60 dark:border-primary-900/60 bg-primary-50/70 dark:bg-primary-950/20 shadow-inner"
            dir={targetLang === "ar" ? "rtl" : "ltr"}
          >
            {translated}
          </p>
        )}

        {error && (
          <p className="text-xs text-red-600 dark:text-red-400 px-1">
            {error}
          </p>
        )}

        <div className="flex items-center justify-center gap-2 text-[12px]">
          <button
            onClick={() => speakText(selectedText, sourceLang)}
            disabled={isSpeaking || !canSpeakEnglish}
            onMouseDown={(e) => e.stopPropagation()}
            onMouseUp={(e) => e.stopPropagation()}
            className="h-10 w-10 rounded-full border border-white/40 dark:border-white/10 bg-white/60 dark:bg-white/5 shadow-sm hover:shadow-md transition-all disabled:opacity-40 flex items-center justify-center"
            aria-label="استماع للنص الأصلي"
          >
            <Volume2 className="w-4 h-4 text-gray-800 dark:text-gray-100" />
          </button>
          <button
            onClick={copyResult}
            disabled={!copyText}
            onMouseDown={(e) => e.stopPropagation()}
            onMouseUp={(e) => e.stopPropagation()}
            className="h-10 w-10 rounded-full border border-white/40 dark:border-white/10 bg-white/60 dark:bg-white/5 shadow-sm hover:shadow-md transition-all disabled:opacity-40 flex items-center justify-center"
            aria-label="نسخ الترجمة"
          >
            {copied ? (
              <Check className="w-4 h-4 text-green-600 dark:text-green-300" />
            ) : (
              <Copy className="w-4 h-4 text-gray-800 dark:text-gray-100" />
            )}
          </button>
        </div>

        {loading && (
          <div className="flex items-center justify-center py-1">
            <RefreshCw className="w-4 h-4 text-primary-600 dark:text-primary-400 animate-spin" />
          </div>
        )}
      </div>
    </div>
  );
}