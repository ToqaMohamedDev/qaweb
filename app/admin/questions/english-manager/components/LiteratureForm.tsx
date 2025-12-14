"use client";

import { useState, useEffect, useRef } from "react";
import { Plus, Trash2 } from "lucide-react";
import { Textarea } from "@/components/Textarea";
import { Button } from "@/components/Button";
import type { EssayItem, EssayData } from "../types";

interface LiteratureFormProps {
  initialData?: EssayData;
  onChange: (data: EssayData) => void;
}

export function LiteratureForm({ initialData, onChange }: LiteratureFormProps) {
  const [essayQuestions, setEssayQuestions] = useState<EssayItem[]>(
    initialData?.essayQuestions || []
  );
  const prevDataRef = useRef<string>(JSON.stringify(essayQuestions));
  const isInitialMount = useRef(true);

  // Update state when initialData changes (for edit mode)
  useEffect(() => {
    if (initialData?.essayQuestions) {
      const newData = JSON.stringify(initialData.essayQuestions);
      const currentData = JSON.stringify(essayQuestions);
      if (newData !== currentData) {
        setEssayQuestions(initialData.essayQuestions);
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
    const currentData = JSON.stringify(essayQuestions);
    if (prevDataRef.current !== currentData) {
      prevDataRef.current = currentData;
      onChange({ essayQuestions });
    }
  }, [essayQuestions, onChange]);

  const addQuestion = () => {
    setEssayQuestions([
      ...essayQuestions,
      {
        id: Date.now().toString(),
        question: "",
        modelAnswer: "",
      },
    ]);
  };

  const updateQuestion = (id: string, field: keyof EssayItem, value: string) => {
    setEssayQuestions(
      essayQuestions.map((q) =>
        q.id === id ? { ...q, [field]: value } : q
      )
    );
  };

  const removeQuestion = (id: string) => {
    setEssayQuestions(essayQuestions.filter((q) => q.id !== id));
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100">
          Essay Questions
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

      {essayQuestions.length === 0 ? (
        <p className="text-gray-500 dark:text-gray-400 text-center py-8">
          No questions added. Click &quot;Add Question&quot; to start.
        </p>
      ) : (
        <div className="space-y-4">
          {essayQuestions.map((q, index) => (
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
                    Question Text
                  </label>
                  <Textarea
                    value={q.question}
                    onChange={(e) => updateQuestion(q.id, "question", e.target.value)}
                    rows={3}
                    placeholder="Enter the essay question..."
                    className="w-full text-sm"
                    dir="ltr"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
                    Model Answer (Optional)
                  </label>
                  <Textarea
                    value={q.modelAnswer || ""}
                    onChange={(e) => updateQuestion(q.id, "modelAnswer", e.target.value)}
                    rows={5}
                    placeholder="Enter a model answer (optional)..."
                    className="w-full text-sm"
                    dir="ltr"
                  />
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    This is optional and can be used as a reference for grading
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

