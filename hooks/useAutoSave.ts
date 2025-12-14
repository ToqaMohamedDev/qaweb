"use client";

import { useEffect, useRef } from "react";

interface AutoSaveParams<TAnswers> {
  userId?: string | null;
  examId?: string;
  sessionId?: string;
  userAnswers: TAnswers;
  delay?: number;
}

export function useAutoSave<TAnswers>({
  userId,
  examId,
  sessionId,
  userAnswers,
  delay = 1000,
}: AutoSaveParams<TAnswers>) {
  const latestPayload = useRef({ userAnswers, sessionId });
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    latestPayload.current = { userAnswers, sessionId };
  }, [userAnswers, sessionId]);

  useEffect(() => {
    if (!userId || !examId) return;

    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    timeoutRef.current = setTimeout(async () => {
      try {
        const res = await fetch("/api/save-progress", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            sessionId: latestPayload.current.sessionId,
            userId,
            examId,
            userAnswers: latestPayload.current.userAnswers,
          }),
        });
        if (!res.ok) {
          const data = await res.json().catch(() => ({}));
          console.warn("save-progress failed", data?.error || res.statusText);
        }
      } catch (err) {
        console.error("save-progress network error", err);
      }
    }, delay);

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [userAnswers, sessionId, userId, examId, delay]);

  useEffect(() => {
    const handler = () => {
      if (!userId || !examId) return;
      const { userAnswers: latestAnswers, sessionId: latestSession } = latestPayload.current;
      try {
        navigator.sendBeacon(
          "/api/save-progress",
          new Blob(
            [
              JSON.stringify({
                sessionId: latestSession,
                userId,
                examId,
                userAnswers: latestAnswers,
              }),
            ],
            { type: "application/json" }
          )
        );
      } catch {
        fetch("/api/save-progress", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          keepalive: true,
          body: JSON.stringify({
            sessionId: latestSession,
            userId,
            examId,
            userAnswers: latestAnswers,
          }),
        }).catch(() => {});
      }
    };

    window.addEventListener("beforeunload", handler);
    return () => window.removeEventListener("beforeunload", handler);
  }, [userId, examId]);

  return null;
}
