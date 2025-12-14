import { DocumentReference, Timestamp } from "firebase/firestore";

export type QuestionType =
  | "multi_choice"
  | "parsing"
  | "extraction"
  | "translation"
  | "essay"
  | "reading";

export interface CorrectAnswerParsing {
  startIndex: number;
  endIndex: number;
  parsingTag: string;
}

export interface CorrectAnswerMCQ {
  correctIndex: number;
}

export type CorrectAnswer = CorrectAnswerParsing | CorrectAnswerMCQ;

export interface QuestionDoc {
  questionId: string;
  questionType: QuestionType;
  contextText?: string;
  contextRef?: DocumentReference;
  maxScore: number;
  correctAnswers: CorrectAnswer[];
  language?: "arabic" | "english";
  createdAt?: Timestamp;
  updatedAt?: Timestamp;
  createdBy?: string;
}

export type UserAnswerShape =
  | { selectedIndex: number } // MCQ / translation
  | {
      selections: Array<{ startIndex: number; endIndex: number; tag: string }>;
    }; // parsing / extraction
  // Extend for essay as needed (e.g., freeText)

export type UserAnswersMap = Record<string, UserAnswerShape>;

export type ExamSessionStatus = "in_progress" | "completed" | "review" | "timed_out";

export interface ExamSessionDoc {
  sessionId: string;
  userId: string;
  examId: string;
  status: ExamSessionStatus;
  userAnswers: UserAnswersMap;
  startedAt?: Timestamp;
  lastUpdated: Timestamp;
  score?: number;
  completedAt?: Timestamp;
}

