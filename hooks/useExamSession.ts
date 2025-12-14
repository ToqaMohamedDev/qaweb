"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { collection, getDocs, limit, query, where } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { ExamSessionDoc } from "@/types/firestoreExam";

type AnswersRecord = Record<string, unknown>;

interface UseExamSessionResult<TAnswers extends AnswersRecord> {
  userAnswers: TAnswers;
  sessionId?: string;
  isLoading: boolean;
  setUserAnswers: React.Dispatch<React.SetStateAction<TAnswers>>;
}

export function useExamSession<TAnswers extends AnswersRecord = AnswersRecord>(
  examId?: string,
  userId?: string | null,
  initialAnswers?: TAnswers
): UseExamSessionResult<TAnswers> {
  const router = useRouter();
  const [userAnswers, setUserAnswers] = useState<TAnswers>(initialAnswers ?? ({} as TAnswers));
  const [sessionId, setSessionId] = useState<string | undefined>(undefined);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;

    const fetchSession = async () => {
      // If user is not ready, skip
      if (!examId || !userId) {
        if (isMounted) {
          setIsLoading(false);
        }
        return;
      }

      try {
        const sessionsRef = collection(db, "examSessions");
        const q = query(
          sessionsRef,
          where("userId", "==", userId),
          where("examId", "==", examId),
          limit(1)
        );

        const snapshot = await getDocs(q);
        if (snapshot.empty) {
          if (isMounted) {
            setUserAnswers({} as TAnswers);
            setSessionId(undefined);
            setIsLoading(false);
          }
          return;
        }

        const docSnap = snapshot.docs[0];
        const data = docSnap.data() as ExamSessionDoc;

        if (data.status === "completed" && data.sessionId) {
          router.replace(`/results/${data.sessionId}`);
          return;
        }

        if (isMounted) {
          setSessionId(data.sessionId);
          setUserAnswers((data.userAnswers as TAnswers) || ({} as TAnswers));
          setIsLoading(false);
        }
      } catch (error) {
        // In case of error, fall back to empty state
        if (isMounted) {
          setUserAnswers(initialAnswers ?? ({} as TAnswers));
          setSessionId(undefined);
          setIsLoading(false);
        }
      }
    };

    fetchSession();

    return () => {
      isMounted = false;
    };
  }, [examId, router, userId]);

  return {
    userAnswers,
    sessionId,
    isLoading,
    setUserAnswers,
  };
}
