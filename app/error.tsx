"use client";

import { useEffect, useState, useCallback } from "react";
import { motion } from "framer-motion";
import { AlertTriangle, RefreshCw, Home, ChevronDown, ChevronUp } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/Button";
import { analytics } from "@/lib/analytics";

interface ErrorProps {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function Error({ error, reset }: ErrorProps) {
  const [isRetrying, setIsRetrying] = useState(false);
  const [retryCount, setRetryCount] = useState(0);
  const [showDetails, setShowDetails] = useState(false);
  const MAX_RETRIES = 3;

  useEffect(() => {
    // Log the error to analytics
    analytics.error(error, "ErrorBoundary");

    // Log the error to an error reporting service
    if (process.env.NODE_ENV === "production") {
      // Send to error tracking service (e.g., Sentry)
      // errorTrackingService.captureException(error);
    } else {
      console.error("Error Boundary:", error);
    }
  }, [error]);

  const handleRetry = useCallback(async () => {
    if (retryCount >= MAX_RETRIES) return;

    setIsRetrying(true);
    setRetryCount((prev) => prev + 1);

    // Small delay before retry for better UX
    await new Promise((resolve) => setTimeout(resolve, 500));

    reset();
    setIsRetrying(false);
  }, [reset, retryCount]);

  const canRetry = retryCount < MAX_RETRIES;

  return (
    <div
      className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 via-white to-gray-50 dark:from-[#121218] dark:via-[#0d0d12] dark:to-[#121218] px-4"
      role="alert"
      aria-live="assertive"
    >
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center max-w-lg w-full"
      >
        {/* Error Icon */}
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
          className="flex items-center justify-center mb-8"
        >
          <div className="relative">
            <div className="absolute inset-0 bg-red-500/20 rounded-full blur-xl animate-pulse" />
            <div className="relative flex h-24 w-24 items-center justify-center rounded-full bg-red-100 dark:bg-red-900/30">
              <AlertTriangle className="h-12 w-12 text-red-600 dark:text-red-400" aria-hidden="true" />
            </div>
          </div>
        </motion.div>

        <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-4">
          حدث خطأ ما
        </h1>
        <p className="text-gray-600 dark:text-gray-400 mb-8">
          نعتذر عن هذا الخطأ. يرجى المحاولة مرة أخرى أو العودة للصفحة الرئيسية.
        </p>

        {/* Error Details (Development/Debug) */}
        {error.message && (
          <div className="mb-8">
            <button
              onClick={() => setShowDetails(!showDetails)}
              className="flex items-center justify-center gap-2 mx-auto text-sm text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 transition-colors"
              aria-expanded={showDetails}
            >
              <span>تفاصيل الخطأ</span>
              {showDetails ? (
                <ChevronUp className="h-4 w-4" aria-hidden="true" />
              ) : (
                <ChevronDown className="h-4 w-4" aria-hidden="true" />
              )}
            </button>

            {showDetails && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                className="mt-4 p-4 bg-gray-100 dark:bg-gray-800/50 rounded-xl text-right"
              >
                <p className="text-sm text-gray-600 dark:text-gray-400 font-mono break-all">
                  {error.message}
                </p>
                {error.digest && (
                  <p className="text-xs text-gray-500 dark:text-gray-500 mt-2">
                    Error ID: {error.digest}
                  </p>
                )}
              </motion.div>
            )}
          </div>
        )}

        {/* Retry Counter */}
        {retryCount > 0 && canRetry && (
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
            محاولات المتبقية: {MAX_RETRIES - retryCount}
          </p>
        )}

        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
          {canRetry ? (
            <Button
              onClick={handleRetry}
              isLoading={isRetrying}
              loadingText="جاري إعادة المحاولة..."
              aria-label="محاولة إعادة تحميل الصفحة"
            >
              <RefreshCw className={`h-5 w-5 ml-2 ${isRetrying ? "animate-spin" : ""}`} aria-hidden="true" />
              حاول مرة أخرى
            </Button>
          ) : (
            <p className="text-red-500 dark:text-red-400 text-sm">
              تم استنفاد جميع المحاولات. يرجى العودة للصفحة الرئيسية.
            </p>
          )}

          <Link href="/" aria-label="العودة للصفحة الرئيسية">
            <Button variant="outline">
              <Home className="h-5 w-5 ml-2" aria-hidden="true" />
              العودة للرئيسية
            </Button>
          </Link>
        </div>
      </motion.div>
    </div>
  );
}
