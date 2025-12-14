"use client";

import { useMemo } from "react";
import { useParams } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { useExamSession } from "@/hooks/useExamSession";
import { UserAnswersMap } from "@/types/firestoreExam";

type QuestionOption = {
  value: number;
  label: string;
};

type Question = {
  id: string;
  text: string;
  options: QuestionOption[];
};

type QuestionCardProps = {
  question: Question;
  selectedIndex?: number;
  onSelect: (questionId: string, optionIndex: number) => void;
};

function QuestionCard({ question, selectedIndex, onSelect }: QuestionCardProps) {
  return (
    <div className="rounded-lg border p-4 space-y-3">
      <h3 className="font-semibold text-gray-900">{question.text}</h3>
      <div className="space-y-2">
        {question.options.map((option) => (
          <label key={option.value} className="flex items-center gap-2">
            <input
              type="radio"
              name={question.id}
              value={option.value}
              checked={selectedIndex === option.value}
              onChange={() => onSelect(question.id, option.value)}
              className="h-4 w-4"
            />
            <span>{option.label}</span>
          </label>
        ))}
      </div>
    </div>
  );
}

export default function ExamPage() {
  const params = useParams<{ examId: string }>();
  const examId = params?.examId;
  const { user } = useAuth();

  const { userAnswers, isLoading, setUserAnswers } = useExamSession<UserAnswersMap>(examId, user?.uid);

  const questions: Question[] = useMemo(
    () => [
      {
        id: "q1",
        text: "What is the capital of France?",
        options: [
          { value: 0, label: "Paris" },
          { value: 1, label: "London" },
          { value: 2, label: "Berlin" },
        ],
      },
      {
        id: "q2",
        text: "2 + 2 = ?",
        options: [
          { value: 0, label: "3" },
          { value: 1, label: "4" },
          { value: 2, label: "5" },
        ],
      },
    ],
    []
  );

  const handleSelect = (questionId: string, optionIndex: number) => {
    setUserAnswers((prev) => ({
      ...prev,
      [questionId]: { selectedIndex: optionIndex },
    }));
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <span className="text-gray-600">جارٍ تحميل الجلسة...</span>
      </div>
    );
  }

  return (
    <div className="container mx-auto max-w-3xl space-y-6 py-8">
      <header className="space-y-2">
        <p className="text-sm text-gray-500">Exam ID: {examId}</p>
        <h1 className="text-2xl font-bold text-gray-900">Resume Exam</h1>
      </header>

      <div className="space-y-4">
        {questions.map((question) => {
          const saved = userAnswers[question.id];
          const selectedIndex = saved && "selectedIndex" in saved ? saved.selectedIndex : undefined;
          return (
            <QuestionCard
              key={question.id}
              question={question}
              selectedIndex={selectedIndex}
              onSelect={handleSelect}
            />
          );
        })}
      </div>
    </div>
  );
}
