/**
 * Centralized Error Handling
 * Provides consistent error handling across the application
 */

import { analytics } from "./analytics";

export class AppError extends Error {
  constructor(
    message: string,
    public code?: string,
    public statusCode?: number,
    public userMessage?: string
  ) {
    super(message);
    this.name = "AppError";
  }
}

export class ValidationError extends AppError {
  constructor(message: string, public field?: string) {
    super(message, "VALIDATION_ERROR", 400, message);
    this.name = "ValidationError";
  }
}

export class AuthError extends AppError {
  constructor(message: string = "Authentication failed") {
    super(message, "AUTH_ERROR", 401, "فشل تسجيل الدخول. يرجى المحاولة مرة أخرى.");
    this.name = "AuthError";
  }
}

export class NotFoundError extends AppError {
  constructor(resource: string = "Resource") {
    super(`${resource} not found`, "NOT_FOUND", 404, "المورد المطلوب غير موجود.");
    this.name = "NotFoundError";
  }
}

export class PermissionError extends AppError {
  constructor(message: string = "Permission denied") {
    super(message, "PERMISSION_ERROR", 403, "ليس لديك صلاحية للوصول إلى هذا المورد.");
    this.name = "PermissionError";
  }
}

export class NetworkError extends AppError {
  constructor(message: string = "Network request failed") {
    super(message, "NETWORK_ERROR", 0, "فشل الاتصال بالشبكة. يرجى التحقق من اتصالك بالإنترنت.");
    this.name = "NetworkError";
  }
}

/**
 * Handle and format errors for display
 */
export function handleError(error: unknown, context?: string): {
  message: string;
  code?: string;
  statusCode?: number;
} {
  // Log error to analytics
  if (error instanceof Error) {
    analytics.error(error, context);
  }

  // Handle known error types
  if (error instanceof AppError) {
    return {
      message: error.userMessage || error.message,
      code: error.code,
      statusCode: error.statusCode,
    };
  }

  // Handle Firebase errors
  if (error && typeof error === "object" && "code" in error) {
    const firebaseError = error as { code: string; message: string };
    
    switch (firebaseError.code) {
      case "auth/user-not-found":
        return {
          message: "المستخدم غير موجود.",
          code: "USER_NOT_FOUND",
          statusCode: 404,
        };
      case "auth/wrong-password":
        return {
          message: "كلمة المرور غير صحيحة.",
          code: "WRONG_PASSWORD",
          statusCode: 401,
        };
      case "auth/email-already-in-use":
        return {
          message: "البريد الإلكتروني مستخدم بالفعل.",
          code: "EMAIL_EXISTS",
          statusCode: 409,
        };
      case "auth/weak-password":
        return {
          message: "كلمة المرور ضعيفة. يرجى استخدام كلمة مرور أقوى.",
          code: "WEAK_PASSWORD",
          statusCode: 400,
        };
      case "auth/network-request-failed":
        return {
          message: "فشل الاتصال بالشبكة. يرجى التحقق من اتصالك بالإنترنت.",
          code: "NETWORK_ERROR",
          statusCode: 0,
        };
      default:
        return {
          message: firebaseError.message || "حدث خطأ غير متوقع.",
          code: firebaseError.code,
        };
    }
  }

  // Handle generic errors
  if (error instanceof Error) {
    return {
      message: error.message || "حدث خطأ غير متوقع.",
      code: "UNKNOWN_ERROR",
    };
  }

  // Fallback
  return {
    message: "حدث خطأ غير متوقع. يرجى المحاولة مرة أخرى.",
    code: "UNKNOWN_ERROR",
  };
}

/**
 * Safe async function wrapper
 */
export async function safeAsync<T>(
  fn: () => Promise<T>,
  fallback?: T
): Promise<{ data?: T; error?: ReturnType<typeof handleError> }> {
  try {
    const data = await fn();
    return { data };
  } catch (error) {
    const errorInfo = handleError(error);
    return { error: errorInfo, data: fallback };
  }
}

