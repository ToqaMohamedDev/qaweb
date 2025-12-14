import { NextResponse } from "next/server";
import { doc, runTransaction, serverTimestamp, Timestamp } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { CorrectAnswerParsing, QuestionDoc, UserAnswersMap, ExamSessionDoc, UserAnswerShape } from "@/types/firestoreExam";

interface SubmitRequest {
  sessionId: string;
  userId: string;
}

type ParsedAnswer = { selections: Array<{ startIndex: number; endIndex: number; tag: string }> };
type MCQAnswer = { selectedIndex: number };

function scoreQuestion(question: QuestionDoc, userAnswer?: MCQAnswer | ParsedAnswer): number {
  if (!userAnswer) return 0;

  if (question.questionType === "multi_choice" || question.questionType === "translation") {
    const firstAnswer = question.correctAnswers[0];
    const correctIndex = firstAnswer && "correctIndex" in firstAnswer ? firstAnswer.correctIndex : undefined;
    if (typeof correctIndex !== "number") return 0;
    return (userAnswer as MCQAnswer).selectedIndex === correctIndex ? question.maxScore : 0;
  }

  if (question.questionType === "parsing" || question.questionType === "extraction") {
    const expected = question.correctAnswers as CorrectAnswerParsing[];
    const provided = (userAnswer as ParsedAnswer).selections || [];
    const allMatch =
      expected.length === provided.length &&
      expected.every((exp) =>
        provided.some(
          (sel) =>
            sel.startIndex === exp.startIndex &&
            sel.endIndex === exp.endIndex &&
            sel.tag === exp.parsingTag
        )
      );
    return allMatch ? question.maxScore : 0;
  }

  return 0;
}

export async function POST(request: Request) {
  try {
    if (!db) {
      return NextResponse.json({ error: "Database not initialized" }, { status: 500 });
    }

    const body = (await request.json()) as SubmitRequest;
    const { sessionId, userId } = body || {};
    if (!sessionId || !userId) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const sessionRef = doc(db, "examSessions", sessionId);

    const result = await runTransaction(db, async (transaction) => {
      const sessionSnap = await transaction.get(sessionRef);
      if (!sessionSnap.exists()) {
        throw new Error("Session not found");
      }

      const sessionData = sessionSnap.data() as ExamSessionDoc;
      if (sessionData.userId !== userId) {
        throw new Error("Unauthorized");
      }

      // Server-side timer validation
      if (sessionData.startedAt && sessionData.examId) {
        const examRef = doc(db, "questions", sessionData.examId);
        const examSnap = await transaction.get(examRef);
        
        if (examSnap.exists()) {
          const examData = examSnap.data();
          const durationMinutes = examData.durationMinutes;
          
          if (typeof durationMinutes === "number" && durationMinutes > 0) {
            const startedAt = sessionData.startedAt;
            const now = Timestamp.now();
            
            // Convert startedAt to milliseconds
            const startedAtMs = startedAt.toMillis();
            const nowMs = now.toMillis();
            
            // Calculate allowed duration in milliseconds (durationMinutes * 60 * 1000) + 2 minutes buffer
            const allowedDurationMs = durationMinutes * 60 * 1000;
            const bufferMs = 2 * 60 * 1000; // 2 minutes buffer
            const maxAllowedMs = allowedDurationMs + bufferMs;
            
            const elapsedMs = nowMs - startedAtMs;
            
            if (elapsedMs > maxAllowedMs) {
              // Mark session as timed_out
              transaction.update(sessionRef, {
                status: "timed_out",
                completedAt: serverTimestamp(),
              });
              
              throw new Error("TIME_EXCEEDED");
            }
          }
        }
      }

      const answers: UserAnswersMap = sessionData.userAnswers || {};
      let totalScore = 0;

      // Score each question individually
      for (const [questionId, userAnswer] of Object.entries(answers)) {
        const questionRef = doc(db, "questions", questionId);
        const questionSnap = await transaction.get(questionRef);
        if (!questionSnap.exists()) continue;
        const questionData = questionSnap.data() as QuestionDoc;
        totalScore += scoreQuestion(questionData, userAnswer as UserAnswerShape);
      }

      transaction.update(sessionRef, {
        status: "completed",
        score: totalScore,
        completedAt: serverTimestamp(),
      });

      return { score: totalScore };
    });

    return NextResponse.json({ ok: true, score: result.score });
  } catch (error) {
    console.error("submit-and-score error", error);
    
    // Handle time exceeded error specifically
    if (error instanceof Error && error.message === "TIME_EXCEEDED") {
      return NextResponse.json(
        { 
          error: "Time exceeded", 
          message: "The exam time limit has been exceeded. Submission rejected." 
        },
        { status: 403 }
      );
    }
    
    return NextResponse.json({ error: "Failed to submit and score" }, { status: 500 });
  }
}

