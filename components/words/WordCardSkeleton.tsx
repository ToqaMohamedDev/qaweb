"use client";

import { memo } from "react";

function WordCardSkeletonComponent() {
  return (
    <div className="p-3 rounded-xl bg-[#1a1a1f] border border-white/5 animate-pulse">
      {/* Top row */}
      <div className="flex items-center justify-between gap-2 mb-2">
        <div className="flex items-center gap-1.5">
          <div className="w-8 h-4 rounded bg-white/10" />
          <div className="w-12 h-4 rounded bg-white/5" />
        </div>
        <div className="flex items-center gap-1">
          <div className="w-6 h-6 rounded-md bg-white/5" />
          <div className="w-6 h-6 rounded-md bg-white/5" />
        </div>
      </div>

      {/* Word */}
      <div className="w-3/4 h-5 rounded bg-white/15 mb-2" />

      {/* Phonetic */}
      <div className="w-1/3 h-3 rounded bg-white/5 mb-2" />

      {/* Translation */}
      <div className="w-full h-4 rounded bg-white/8 mb-1" />
      <div className="w-2/3 h-4 rounded bg-white/8" />
    </div>
  );
}

export const WordCardSkeleton = memo(WordCardSkeletonComponent);

// Grid of skeletons
export function WordGridSkeleton({ count = 12 }: { count?: number }) {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-2">
      {Array.from({ length: count }).map((_, i) => (
        <WordCardSkeleton key={i} />
      ))}
    </div>
  );
}
