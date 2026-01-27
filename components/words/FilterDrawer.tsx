"use client";

import { useEffect, useCallback } from "react";
import { X } from "lucide-react";

interface FilterDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  categories: string[];
  selectedCategory: string;
  onCategoryChange: (category: string) => void;
  selectedLevel: string;
  onLevelChange: (level: string) => void;
  savedOnly: boolean;
  onSavedOnlyChange: (value: boolean) => void;
  sortBy: string;
  onSortChange: (sort: string) => void;
  onReset: () => void;
}

const levels = [
  { value: "all", label: "الكل", short: "الكل" },
  { value: "beginner", label: "مبتدئ", short: "A1-A2" },
  { value: "intermediate", label: "متوسط", short: "B1-B2" },
  { value: "advanced", label: "متقدم", short: "C1-C2" },
];

const sortOptions = [
  { value: "newest", label: "الأحدث" },
  { value: "oldest", label: "الأقدم" },
  { value: "alphabetical", label: "أبجدي" },
  { value: "random", label: "عشوائي" },
];

export function FilterDrawer({
  isOpen,
  onClose,
  categories,
  selectedCategory,
  onCategoryChange,
  selectedLevel,
  onLevelChange,
  savedOnly,
  onSavedOnlyChange,
  sortBy,
  onSortChange,
  onReset,
}: FilterDrawerProps) {
  
  // Close on escape key
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

  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 z-50 flex justify-end"
      onClick={handleBackdropClick}
    >
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" />
      
      {/* Drawer */}
      <div 
        className="relative w-full max-w-sm bg-[#0c0c0f] border-l border-white/5 h-full flex flex-col animate-in slide-in-from-right duration-200"
        dir="rtl"
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-white/5">
          <h2 className="text-base font-bold text-white">الفلاتر</h2>
          <button
            onClick={onClose}
            className="p-2 rounded-lg text-zinc-400 hover:text-white hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable content */}
        <div className="flex-1 overflow-y-auto p-4 space-y-6">
          
          {/* Section: Categories */}
          {categories.length > 0 && (
            <div>
              <div className="flex items-center gap-3 mb-3">
                <h3 className="text-xs font-semibold text-zinc-500 uppercase tracking-wider">التصنيف</h3>
                <div className="flex-1 h-px bg-white/5" />
              </div>
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={() => onCategoryChange("all")}
                  className={`px-3 py-2 rounded-xl text-sm font-medium transition-all ${
                    selectedCategory === "all"
                      ? "bg-purple-600/20 text-purple-300 ring-1 ring-purple-500/50"
                      : "bg-white/5 text-zinc-400 hover:bg-white/10 hover:text-white"
                  }`}
                >
                  الكل
                </button>
                {categories.map((cat) => (
                  <button
                    key={cat}
                    onClick={() => onCategoryChange(cat)}
                    className={`px-3 py-2 rounded-xl text-sm font-medium transition-all ${
                      selectedCategory === cat
                        ? "bg-purple-600/20 text-purple-300 ring-1 ring-purple-500/50"
                        : "bg-white/5 text-zinc-400 hover:bg-white/10 hover:text-white"
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Section: Level - Radio Cards */}
          <div>
            <div className="flex items-center gap-3 mb-3">
              <h3 className="text-xs font-semibold text-zinc-500 uppercase tracking-wider">المستوى</h3>
              <div className="flex-1 h-px bg-white/5" />
            </div>
            <div className="grid grid-cols-4 gap-2">
              {levels.map((level) => (
                <button
                  key={level.value}
                  onClick={() => onLevelChange(level.value)}
                  className={`p-3 rounded-xl text-center transition-all ${
                    selectedLevel === level.value
                      ? "bg-purple-600/20 ring-1 ring-purple-500/50"
                      : "bg-white/5 hover:bg-white/10"
                  }`}
                >
                  <p className={`text-sm font-semibold ${selectedLevel === level.value ? "text-purple-300" : "text-white"}`}>
                    {level.label}
                  </p>
                  {level.short !== level.label && (
                    <p className={`text-[10px] mt-0.5 ${selectedLevel === level.value ? "text-purple-400" : "text-zinc-500"}`}>
                      {level.short}
                    </p>
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* Section: Saved Only Toggle */}
          <div>
            <div className="flex items-center gap-3 mb-3">
              <h3 className="text-xs font-semibold text-zinc-500 uppercase tracking-wider">المحفوظة</h3>
              <div className="flex-1 h-px bg-white/5" />
            </div>
            <button
              onClick={() => onSavedOnlyChange(!savedOnly)}
              className={`w-full px-4 py-3 rounded-xl text-sm font-medium flex items-center justify-between transition-all ${
                savedOnly
                  ? "bg-purple-600/20 ring-1 ring-purple-500/50"
                  : "bg-white/5 hover:bg-white/10"
              }`}
            >
              <span className={savedOnly ? "text-purple-300" : "text-zinc-400"}>إظهار المحفوظة فقط</span>
              <div className={`w-11 h-6 rounded-full transition-colors relative ${savedOnly ? "bg-purple-600" : "bg-zinc-700"}`}>
                <div className={`absolute top-0.5 w-5 h-5 rounded-full bg-white shadow-md transition-all ${savedOnly ? "right-0.5" : "right-5"}`} />
              </div>
            </button>
          </div>

          {/* Section: Sort - Segmented Control */}
          <div>
            <div className="flex items-center gap-3 mb-3">
              <h3 className="text-xs font-semibold text-zinc-500 uppercase tracking-wider">الترتيب</h3>
              <div className="flex-1 h-px bg-white/5" />
            </div>
            <div className="p-1 bg-white/5 rounded-xl">
              <div className="grid grid-cols-4 gap-1">
                {sortOptions.map((option) => (
                  <button
                    key={option.value}
                    onClick={() => onSortChange(option.value)}
                    className={`py-2.5 rounded-lg text-xs font-medium transition-all ${
                      sortBy === option.value
                        ? "bg-purple-600 text-white shadow-lg"
                        : "text-zinc-400 hover:text-white"
                    }`}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Sticky Footer - Reset & Apply */}
        <div className="p-4 border-t border-white/5 bg-[#0c0c0f]">
          <div className="flex items-center gap-3">
            <button
              onClick={onReset}
              className="px-4 py-2.5 rounded-xl text-sm font-medium text-zinc-400 hover:text-white hover:bg-white/10 transition-colors"
            >
              تفريغ
            </button>
            <button
              onClick={onClose}
              className="flex-1 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-sm font-semibold transition-colors"
            >
              تطبيق
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
