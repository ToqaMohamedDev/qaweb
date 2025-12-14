/**
 * Firebase utility functions for optimized queries and error handling
 */

import { 
  collection, 
  getDocs, 
  query, 
  where, 
  orderBy,
  Query,
  QueryConstraint,
  FirestoreError
} from "firebase/firestore";
import { db } from "./firebase";

/**
 * Safely executes a Firestore query with fallback options
 * @param baseQuery - The base query function
 * @param constraints - Array of query constraints
 * @param fallbackConstraints - Fallback constraints if orderBy fails
 * @returns Query snapshot
 */
export async function safeQuery<T = unknown>(
  baseQuery: () => Query,
  constraints: QueryConstraint[],
  fallbackConstraints?: QueryConstraint[]
): Promise<T[]> {
  try {
    // Try with all constraints including orderBy
    const q = query(baseQuery(), ...constraints);
    const snapshot = await getDocs(q);
    return snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() })) as T[];
  } catch (error) {
    // If orderBy fails (missing index), try with fallback constraints
    if (fallbackConstraints && error instanceof Error && error.message.includes("index")) {
      try {
        const q = query(baseQuery(), ...fallbackConstraints);
        const snapshot = await getDocs(q);
        return snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() })) as T[];
      } catch (fallbackError) {
        console.error("Fallback query failed:", fallbackError);
        throw fallbackError;
      }
    }
    throw error;
  }
}

/**
 * Fetches questions by language and lesson ID with optimized query
 */
export async function fetchQuestionsByLesson(
  language: "arabic" | "english",
  lessonId: string,
  questionType?: string
) {
  const questionsRef = collection(db, "questions");
  
  const constraints = [
    where("language", "==", language),
    where("lessonId", "==", lessonId),
    ...(questionType ? [where("type", "==", questionType)] : []),
    orderBy("createdAt", "desc")
  ];
  
  const fallbackConstraints = [
    where("language", "==", language),
    where("lessonId", "==", lessonId),
    ...(questionType ? [where("type", "==", questionType)] : [])
  ];
  
  const questions = await safeQuery(
    () => questionsRef,
    constraints,
    fallbackConstraints
  );
  
  // Filter out comprehensive exams with usageScope === "exam" (they belong in exams section)
  return questions.filter((q: unknown) => {
    const question = q as { type?: string; usageScope?: "exam" | "lesson" };
    const isExamWithUsageScope = 
      (question.type === "english_comprehensive_exam" || question.type === "arabic_comprehensive_exam") &&
      question.usageScope === "exam";
    return !isExamWithUsageScope;
  });
}

/**
 * Fetches exam questions with optimized query
 */
export async function fetchExamsByType(examType: string = "multi_template_exam") {
  const questionsRef = collection(db, "questions");
  
  const constraints = [
    where("type", "==", examType),
    orderBy("createdAt", "desc")
  ];
  
  const fallbackConstraints = [
    where("type", "==", examType)
  ];
  
  return safeQuery(
    () => questionsRef,
    constraints,
    fallbackConstraints
  );
}

/**
 * Counts questions by lesson ID
 */
export async function countQuestionsByLesson(
  language: "arabic" | "english"
): Promise<Record<string, number>> {
  const questionsRef = collection(db, "questions");
  
  const constraints = [
    where("language", "==", language),
    orderBy("createdAt", "desc")
  ];
  
  const fallbackConstraints = [
    where("language", "==", language)
  ];
  
  try {
    const questions = await safeQuery(
      () => questionsRef,
      constraints,
      fallbackConstraints
    );
    
    const counts: Record<string, number> = {};
    questions.forEach((q: unknown) => {
      const question = q as { lessonId?: string; type?: string; usageScope?: "exam" | "lesson" };
      if (question.lessonId) {
        // Exclude comprehensive exams with usageScope === "exam" from lesson counts
        // (they belong in exams section, not lessons)
        const isExamWithUsageScope = 
          (question.type === "english_comprehensive_exam" || question.type === "arabic_comprehensive_exam") &&
          question.usageScope === "exam";
        
        if (!isExamWithUsageScope) {
          counts[question.lessonId] = (counts[question.lessonId] || 0) + 1;
        }
      }
    });
    
    return counts;
  } catch (error) {
    console.error("Error counting questions:", error);
    return {};
  }
}

/**
 * Type guard for Firestore errors
 */
export function isFirestoreError(error: unknown): error is FirestoreError {
  return (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    "message" in error
  );
}

/**
 * Handles Firestore errors gracefully
 */
export function handleFirestoreError(error: unknown, context: string): void {
  if (process.env.NODE_ENV === "development") {
    if (isFirestoreError(error)) {
      console.error(`Firestore error in ${context}:`, {
        code: error.code,
        message: error.message,
      });
    } else if (error instanceof Error) {
      console.error(`Error in ${context}:`, error.message);
    } else {
      console.error(`Unknown error in ${context}:`, error);
    }
  }
}

