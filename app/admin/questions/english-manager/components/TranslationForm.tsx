"use client";

import { useState, useEffect, useRef } from "react";
import { Plus, Trash2 } from "lucide-react";
import { Textarea } from "@/components/Textarea";
import { Button } from "@/components/Button";
import type { TranslationItem, TranslationData } from "../types";

interface TranslationFormProps {
  initialData?: TranslationData;
  onChange: (data: TranslationData) => void;
}

export function TranslationForm({ initialData, onChange }: TranslationFormProps) {
  const [translationQuestions, setTranslationQuestions] = useState<TranslationItem[]>(
    initialData?.translationQuestions || []
  );
  const prevDataRef = useRef<string>(JSON.stringify(translationQuestions));
  const isInitialMount = useRef(true);

  // Update state when initialData changes (for edit mode)
  useEffect(() => {
    if (initialData?.translationQuestions) {
      const newData = JSON.stringify(initialData.translationQuestions);
      const currentData = JSON.stringify(translationQuestions);
      if (newData !== currentData) {
        setTranslationQuestions(initialData.translationQuestions);
        prevDataRef.current = newData;
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialData]);

  useEffect(() => {
    if (isInitialMount.current) {
      isInitialMount.current = false;
      return;
    }
    const currentData = JSON.stringify(translationQuestions);
    if (prevDataRef.current !== currentData) {
      prevDataRef.current = currentData;
      onChange({ translationQuestions });
    }
  }, [translationQuestions, onChange]);

  const addQuestion = () => {
    setTranslationQuestions([
      ...translationQuestions,
      {
        id: Date.now().toString(),
        originalText: "",
        translationDirection: "en-to-ar",
        options: ["", "", "", ""],
        correctAnswer: 0,
      },
    ]);
  };

  const updateQuestion = (id: string, field: keyof TranslationItem, value: string | number) => {
    setTranslationQuestions(
      translationQuestions.map((q) =>
        q.id === id ? { ...q, [field]: value } : q
      )
    );
  };

  const updateOption = (questionId: string, optionIndex: number, value: string) => {
    setTranslationQuestions(
      translationQuestions.map((q) => {
        if (q.id === questionId) {
          const newOptions = [...q.options];
          newOptions[optionIndex] = value;
          return { ...q, options: newOptions };
        }
        return q;
      })
    );
  };

  const removeQuestion = (id: string) => {
    setTranslationQuestions(translationQuestions.filter((q) => q.id !== id));
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100">
          Translation Questions
        </h3>
        <Button
          onClick={addQuestion}
          variant="outline"
          className="flex items-center gap-2"
        >
          <Plus className="h-4 w-4" />
          Add Question
        </Button>
      </div>

      {translationQuestions.length === 0 ? (
        <p className="text-gray-500 dark:text-gray-400 text-center py-8">
          No questions added. Click &quot;Add Question&quot; to start.
        </p>
      ) : (
        <div className="space-y-4">
          {translationQuestions.map((q, index) => (
            <div
              key={q.id}
              className="p-4 rounded-xl border border-gray-200 dark:border-[#2e2e3a] bg-gray-50 dark:bg-[#252530]"
            >
              <div className="flex items-center justify-between mb-3">
                <h4 className="font-semibold text-gray-900 dark:text-gray-100">
                  Question {index + 1}
                </h4>
                <button
                  onClick={() => removeQuestion(q.id)}
                  className="p-1 rounded-lg text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>

              <div className="space-y-3">
                <div>
                  <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
                    Translation Direction
                  </label>
                  <select
                    value={q.translationDirection}
                    onChange={(e) =>
                      updateQuestion(q.id, "translationDirection", e.target.value)
                    }
                    className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-[#2e2e3a] bg-white dark:bg-[#1c1c24] text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-primary-500 text-sm"
                  >
                    <option value="en-to-ar">English → Arabic</option>
                    <option value="ar-to-en">Arabic → English</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
                    Original Text ({q.translationDirection === "en-to-ar" ? "English" : "Arabic"})
                  </label>
                  <Textarea
                    value={q.originalText}
                    onChange={(e) => updateQuestion(q.id, "originalText", e.target.value)}
                    rows={3}
                    placeholder={`Enter the ${q.translationDirection === "en-to-ar" ? "English" : "Arabic"} text to translate...`}
                    className="w-full text-sm"
                    dir={q.translationDirection === "en-to-ar" ? "ltr" : "rtl"}
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-2">
                    Translation Options (Select the correct answer)
                  </label>
                  <div className="space-y-2">
                    {q.options.map((option, optIndex) => (
                      <div key={optIndex} className="flex items-center gap-2">
                        <input
                          type="radio"
                          name={`correct-${q.id}`}
                          checked={q.correctAnswer === optIndex}
                          onChange={() => updateQuestion(q.id, "correctAnswer", optIndex)}
                          className="h-4 w-4 text-primary-600"
                        />
                        <span className="text-sm font-medium text-gray-700 dark:text-gray-300 w-6">
                          {String.fromCharCode(97 + optIndex)})
                        </span>
                        <Textarea
                          value={option}
                          onChange={(e) => updateOption(q.id, optIndex, e.target.value)}
                          placeholder={`Option ${String.fromCharCode(97 + optIndex)}`}
                          className="flex-1 text-sm"
                          rows={2}
                          dir={q.translationDirection === "en-to-ar" ? "rtl" : "ltr"}
                        />
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

