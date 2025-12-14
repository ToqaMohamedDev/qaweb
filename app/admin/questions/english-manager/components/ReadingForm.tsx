"use client";

import { useState, useEffect, useRef } from "react";
import { Plus, Trash2 } from "lucide-react";
import { Input } from "@/components/Input";
import { Textarea } from "@/components/Textarea";
import { Button } from "@/components/Button";
import type { MCQ, ReadingData } from "../types";

interface ReadingFormProps {
  initialData?: ReadingData;
  onChange: (data: ReadingData) => void;
}

export function ReadingForm({ initialData, onChange }: ReadingFormProps) {
  const [readingPassage, setReadingPassage] = useState(initialData?.readingPassage || "");
  const [multipleChoiceQuestions, setMultipleChoiceQuestions] = useState<MCQ[]>(
    initialData?.multipleChoiceQuestions || []
  );
  const prevDataRef = useRef<string>(JSON.stringify({ readingPassage, multipleChoiceQuestions }));
  const isInitialMount = useRef(true);

  // Update state when initialData changes (for edit mode)
  useEffect(() => {
    if (initialData) {
      const newReadingPassage = initialData.readingPassage || "";
      const newQuestions = initialData.multipleChoiceQuestions || [];
      const newData = JSON.stringify({ readingPassage: newReadingPassage, multipleChoiceQuestions: newQuestions });
      const currentData = JSON.stringify({ readingPassage, multipleChoiceQuestions });
      
      if (newReadingPassage !== readingPassage) {
        setReadingPassage(newReadingPassage);
      }
      if (JSON.stringify(newQuestions) !== JSON.stringify(multipleChoiceQuestions)) {
        setMultipleChoiceQuestions(newQuestions);
      }
      if (newData !== currentData) {
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
    const currentData = JSON.stringify({ readingPassage, multipleChoiceQuestions });
    if (prevDataRef.current !== currentData) {
      prevDataRef.current = currentData;
      onChange({ readingPassage, multipleChoiceQuestions });
    }
  }, [readingPassage, multipleChoiceQuestions, onChange]);

  const addQuestion = () => {
    setMultipleChoiceQuestions([
      ...multipleChoiceQuestions,
      {
        id: Date.now().toString(),
        question: "",
        options: ["", "", "", ""],
        correctAnswer: 0,
      },
    ]);
  };

  const updateQuestion = (id: string, field: keyof MCQ, value: string | number) => {
    setMultipleChoiceQuestions(
      multipleChoiceQuestions.map((q) =>
        q.id === id ? { ...q, [field]: value } : q
      )
    );
  };

  const updateOption = (questionId: string, optionIndex: number, value: string) => {
    setMultipleChoiceQuestions(
      multipleChoiceQuestions.map((q) => {
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
    setMultipleChoiceQuestions(multipleChoiceQuestions.filter((q) => q.id !== id));
  };

  return (
    <div className="space-y-6">
      <div>
        <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
          Reading Passage
        </label>
        <Textarea
          value={readingPassage}
          onChange={(e) => setReadingPassage(e.target.value)}
          rows={15}
          placeholder="Enter the reading passage here..."
          className="w-full text-sm leading-relaxed"
          dir="ltr"
        />
      </div>

      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100">
            Multiple Choice Questions
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

        {multipleChoiceQuestions.length === 0 ? (
          <p className="text-gray-500 dark:text-gray-400 text-center py-8">
            No questions added. Click &quot;Add Question&quot; to start.
          </p>
        ) : (
          <div className="space-y-4">
            {multipleChoiceQuestions.map((q, index) => (
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
                      rows={2}
                      placeholder="Enter the question..."
                      className="w-full text-sm"
                      dir="ltr"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-2">
                      Options (Select the correct answer)
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
                          <Input
                            type="text"
                            value={option}
                            onChange={(e) => updateOption(q.id, optIndex, e.target.value)}
                            placeholder={`Option ${String.fromCharCode(97 + optIndex)}`}
                            className="flex-1 text-sm"
                            dir="ltr"
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
    </div>
  );
}

