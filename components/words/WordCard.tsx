"use client";

import { memo, useCallback, useState } from "react";
import { Volume2, Star, Loader2, Check } from "lucide-react";

interface WordCardProps {
  id: string;
  word: string;
  translation?: string;
  phonetic?: string;
  category?: string;
  level?: "beginner" | "intermediate" | "advanced";
  languageCode: string;
  isSaved?: boolean;
  onSave?: (id: string) => void;
  onPlay?: (word: string, lang: string) => void;
  isPending?: boolean;
}

function WordCardComponent({
  id,
  word,
  translation,
  phonetic,
  category,
  languageCode,
  isSaved = false,
  onSave,
  onPlay,
  isPending = false,
}: WordCardProps) {
  const [isHovered, setIsHovered] = useState(false);

  const handlePlay = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation();
      onPlay?.(word, languageCode);
    },
    [word, languageCode, onPlay]
  );

  const handleSave = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation();
      onSave?.(id);
    },
    [id, onSave]
  );

  return (
    <div
      className={`
        group relative p-4 rounded-2xl cursor-pointer
        transition-all duration-200 ease-out
        ${isSaved 
          ? "bg-purple-500/10 border-2 border-purple-500/50" 
          : "bg-[#141417] border border-white/5 hover:border-white/10"
        }
        hover:shadow-xl hover:shadow-black/20
        hover:-translate-y-1
      `}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Saved checkmark indicator */}
      {isSaved && (
        <div className="absolute top-2 left-2 w-5 h-5 rounded-full bg-purple-500 flex items-center justify-center">
          <Check className="w-3 h-3 text-white" />
        </div>
      )}

      {/* Top row: Category chip (right) + Save star (left) */}
      <div className="flex items-start justify-between gap-2 mb-3">
        {/* Category chip */}
        {category ? (
          <span className="px-2 py-1 rounded-lg text-[11px] font-medium bg-white/5 text-zinc-400">
            {category}
          </span>
        ) : (
          <span />
        )}

        {/* Save button - Star */}
        <button
          onClick={handleSave}
          disabled={isPending}
          className={`p-1.5 rounded-lg transition-all duration-150 disabled:opacity-50 ${
            isSaved 
              ? "text-yellow-400 bg-yellow-400/10" 
              : "text-zinc-500 hover:text-yellow-400 hover:bg-yellow-400/10"
          }`}
          aria-label={isSaved ? "إزالة من المحفوظات" : "حفظ الكلمة"}
        >
          {isPending ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <Star className={`w-4 h-4 ${isSaved ? "fill-current" : ""}`} />
          )}
        </button>
      </div>

      {/* Word - Hero element with better contrast */}
      <h3 className="text-xl font-bold text-white leading-tight mb-1.5">
        {word}
      </h3>

      {/* Phonetic */}
      {phonetic && (
        <p className="text-xs text-zinc-500 mb-2">
          /{phonetic}/
        </p>
      )}

      {/* Translation */}
      {translation && (
        <p className="text-sm text-zinc-400 leading-relaxed line-clamp-2 mb-3">
          {translation}
        </p>
      )}

      {/* Bottom: Play button - visible on hover */}
      <button
        onClick={handlePlay}
        className={`
          w-full py-2 rounded-xl text-sm font-medium
          flex items-center justify-center gap-2
          transition-all duration-200
          ${isHovered 
            ? "bg-purple-600 text-white" 
            : "bg-white/5 text-zinc-500"
          }
        `}
      >
        <Volume2 className="w-4 h-4" />
        <span>نطق</span>
      </button>
    </div>
  );
}

export const WordCard = memo(WordCardComponent);
