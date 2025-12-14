import { NextResponse } from "next/server";
import {
  addDoc,
  collection,
  doc,
  getDoc,
  getDocs,
  limit,
  query,
  serverTimestamp,
  setDoc,
  updateDoc,
  where,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import { ExamSessionDoc, UserAnswersMap } from "@/types/firestoreExam";

type ErrorResponse = { success: false; error: string };
type SuccessResponse = { success: true; sessionId: string };

const jsonError = (message: string, status = 400) =>
  NextResponse.json<ErrorResponse>({ success: false, error: message }, { status });

function validateSaveProgressRequest(body: unknown): {
  valid: boolean;
  data?: { userId: string; examId: string; sessionId?: string; userAnswers: UserAnswersMap };
  error?: string;
} {
  if (!body || typeof body !== "object") {
    return { valid: false, error: "Invalid payload: must be an object" };
  }

  const obj = body as Record<string, unknown>;

  if (!obj.userId || typeof obj.userId !== "string" || obj.userId.trim().length === 0) {
    return { valid: false, error: "Invalid payload: userId must be a non-empty string" };
  }

  if (!obj.examId || typeof obj.examId !== "string" || obj.examId.trim().length === 0) {
    return { valid: false, error: "Invalid payload: examId must be a non-empty string" };
  }

  if (obj.sessionId !== undefined && (typeof obj.sessionId !== "string" || obj.sessionId.trim().length === 0)) {
    return { valid: false, error: "Invalid payload: sessionId must be a non-empty string if provided" };
  }

  if (obj.userAnswers !== undefined && (typeof obj.userAnswers !== "object" || obj.userAnswers === null || Array.isArray(obj.userAnswers))) {
    return { valid: false, error: "Invalid payload: userAnswers must be an object" };
  }

  return {
    valid: true,
    data: {
      userId: obj.userId as string,
      examId: obj.examId as string,
      sessionId: obj.sessionId as string | undefined,
      userAnswers: (obj.userAnswers || {}) as UserAnswersMap,
    },
  };
}

export async function POST(request: Request) {
  try {
    if (!db) {
      return jsonError("Database not initialized", 500);
    }

    const body = await request.json().catch(() => null);
    const validation = validateSaveProgressRequest(body);

    if (!validation.valid || !validation.data) {
      return jsonError(validation.error || "Invalid payload", 400);
    }

    const { sessionId, userId, examId, userAnswers } = validation.data;

    // Scenario A: update by provided sessionId (or create if it doesn't exist)
    if (sessionId) {
      const sessionRef = doc(db, "examSessions", sessionId);
      const snap = await getDoc(sessionRef);
      const existing = (snap.exists() ? (snap.data() as ExamSessionDoc) : undefined) || undefined;
      const mergedAnswers = { ...(existing?.userAnswers || {}), ...userAnswers };

      await setDoc(
        sessionRef,
        {
          sessionId,
          userId,
          examId,
          status: "in_progress",
          userAnswers: mergedAnswers,
          startedAt: existing?.startedAt ?? serverTimestamp(),
          lastUpdated: serverTimestamp(),
        },
        { merge: true }
      );

      return NextResponse.json<SuccessResponse>({ success: true, sessionId });
    }

    // Scenario B: no sessionId provided → try to reuse existing in-progress session
    const sessionsRef = collection(db, "examSessions");
    const inProgressQuery = query(
      sessionsRef,
      where("userId", "==", userId),
      where("examId", "==", examId),
      where("status", "==", "in_progress"),
      limit(1)
    );
    const existingSnap = await getDocs(inProgressQuery);

    if (!existingSnap.empty) {
      const existingDoc = existingSnap.docs[0];
      const existingData = existingDoc.data() as ExamSessionDoc;
      const mergedAnswers = { ...(existingData.userAnswers || {}), ...userAnswers };

      await updateDoc(existingDoc.ref, {
        userAnswers: mergedAnswers,
        lastUpdated: serverTimestamp(),
      });

      return NextResponse.json<SuccessResponse>({ success: true, sessionId: existingDoc.id });
    }

    // Create new session
    const newDocRef = await addDoc(collection(db, "examSessions"), {
      userId,
      examId,
      status: "in_progress",
      userAnswers,
      startedAt: serverTimestamp(),
      lastUpdated: serverTimestamp(),
    });

    return NextResponse.json<SuccessResponse>({ success: true, sessionId: newDocRef.id });
  } catch (error) {
    console.error("save-progress error", error);
    return jsonError("Failed to save progress", 500);
  }
}

