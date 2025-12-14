/**
 * Input Validation Utilities
 * Provides consistent validation across forms with security-focused sanitization
 */

export interface ValidationResult {
  isValid: boolean;
  error?: string;
}

/**
 * Sanitize input to prevent XSS attacks
 */
export function sanitizeInput(input: string): string {
  if (!input) return "";

  return input
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#x27;")
    .replace(/\//g, "&#x2F;")
    .trim();
}

/**
 * Remove HTML tags from input
 */
export function stripHtml(input: string): string {
  if (!input) return "";
  return input.replace(/<[^>]*>/g, "").trim();
}

/**
 * Email validation with improved regex
 */
export function validateEmail(email: string): ValidationResult {
  if (!email) {
    return { isValid: false, error: "البريد الإلكتروني مطلوب" };
  }

  const trimmedEmail = email.trim().toLowerCase();

  // More comprehensive email regex
  const emailRegex = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/;

  if (!emailRegex.test(trimmedEmail)) {
    return { isValid: false, error: "البريد الإلكتروني غير صحيح" };
  }

  // Check for common typos in email domains
  const commonTypos: Record<string, string> = {
    "gmial.com": "gmail.com",
    "gmaul.com": "gmail.com",
    "gmali.com": "gmail.com",
    "hotmial.com": "hotmail.com",
    "outloo.com": "outlook.com",
  };

  const domain = trimmedEmail.split("@")[1];
  if (domain && commonTypos[domain]) {
    return {
      isValid: false,
      error: `هل تقصد @${commonTypos[domain]}؟`
    };
  }

  return { isValid: true };
}

/**
 * Password validation with strength feedback
 */
export function validatePassword(password: string): ValidationResult {
  if (!password) {
    return { isValid: false, error: "كلمة المرور مطلوبة" };
  }

  if (password.length < 6) {
    return { isValid: false, error: "كلمة المرور يجب أن تكون 6 أحرف على الأقل" };
  }

  if (password.length > 128) {
    return { isValid: false, error: "كلمة المرور طويلة جداً" };
  }

  // Check for common weak passwords
  const weakPasswords = [
    "123456", "password", "123456789", "12345678", "12345",
    "1234567", "qwerty", "abc123", "111111", "password123"
  ];

  if (weakPasswords.includes(password.toLowerCase())) {
    return { isValid: false, error: "كلمة المرور ضعيفة جداً. يرجى اختيار كلمة مرور أقوى" };
  }

  return { isValid: true };
}

/**
 * Get password strength
 */
export function getPasswordStrength(password: string): {
  score: number; // 0-4
  label: string;
  color: string;
} {
  let score = 0;

  if (password.length >= 8) score++;
  if (password.length >= 12) score++;
  if (/[A-Z]/.test(password) && /[a-z]/.test(password)) score++;
  if (/\d/.test(password)) score++;
  if (/[!@#$%^&*(),.?":{}|<>]/.test(password)) score++;

  const labels = ["ضعيفة جداً", "ضعيفة", "متوسطة", "قوية", "قوية جداً"];
  const colors = ["#ef4444", "#f97316", "#eab308", "#22c55e", "#16a34a"];

  return {
    score: Math.min(score, 4),
    label: labels[Math.min(score, 4)],
    color: colors[Math.min(score, 4)],
  };
}

/**
 * Display name validation
 */
export function validateDisplayName(name: string): ValidationResult {
  if (!name) {
    return { isValid: false, error: "الاسم مطلوب" };
  }

  const trimmedName = name.trim();

  if (trimmedName.length < 2) {
    return { isValid: false, error: "الاسم يجب أن يكون حرفين على الأقل" };
  }

  if (trimmedName.length > 50) {
    return { isValid: false, error: "الاسم طويل جداً" };
  }

  // Check for suspicious characters that might indicate XSS
  if (/<|>|&|"|'/.test(trimmedName)) {
    return { isValid: false, error: "الاسم يحتوي على أحرف غير مسموح بها" };
  }

  return { isValid: true };
}

/**
 * Required field validation
 */
export function validateRequired(value: string | null | undefined, fieldName: string = "الحقل"): ValidationResult {
  if (!value || value.trim() === "") {
    return { isValid: false, error: `${fieldName} مطلوب` };
  }

  return { isValid: true };
}

/**
 * Text length validation
 */
export function validateLength(
  text: string,
  min: number,
  max: number,
  fieldName: string = "النص"
): ValidationResult {
  const trimmedText = text.trim();

  if (trimmedText.length < min) {
    return { isValid: false, error: `${fieldName} يجب أن يكون ${min} أحرف على الأقل` };
  }

  if (trimmedText.length > max) {
    return { isValid: false, error: `${fieldName} يجب أن يكون ${max} أحرف كحد أقصى` };
  }

  return { isValid: true };
}

/**
 * URL validation with protocol check
 */
export function validateURL(url: string, requireHttps: boolean = false): ValidationResult {
  if (!url) {
    return { isValid: false, error: "الرابط مطلوب" };
  }

  try {
    const parsedUrl = new URL(url);

    if (requireHttps && parsedUrl.protocol !== "https:") {
      return { isValid: false, error: "الرابط يجب أن يستخدم HTTPS" };
    }

    if (!["http:", "https:"].includes(parsedUrl.protocol)) {
      return { isValid: false, error: "الرابط يجب أن يبدأ بـ http:// أو https://" };
    }

    return { isValid: true };
  } catch {
    return { isValid: false, error: "الرابط غير صحيح" };
  }
}

/**
 * Phone number validation (Egyptian format)
 */
export function validatePhone(phone: string): ValidationResult {
  if (!phone) {
    return { isValid: false, error: "رقم الهاتف مطلوب" };
  }

  // Remove spaces and dashes
  const cleanPhone = phone.replace(/[\s-]/g, "");

  // Egyptian phone number format: 01XXXXXXXXX (11 digits starting with 01)
  const phoneRegex = /^01[0-2,5]{1}[0-9]{8}$/;
  if (!phoneRegex.test(cleanPhone)) {
    return { isValid: false, error: "رقم الهاتف غير صحيح. يرجى استخدام الصيغة: 01XXXXXXXXX" };
  }

  return { isValid: true };
}

/**
 * Validate number within range
 */
export function validateNumber(
  value: string | number,
  min?: number,
  max?: number,
  fieldName: string = "الرقم"
): ValidationResult {
  const num = typeof value === "string" ? parseFloat(value) : value;

  if (isNaN(num)) {
    return { isValid: false, error: `${fieldName} يجب أن يكون رقمًا` };
  }

  if (min !== undefined && num < min) {
    return { isValid: false, error: `${fieldName} يجب أن يكون ${min} على الأقل` };
  }

  if (max !== undefined && num > max) {
    return { isValid: false, error: `${fieldName} يجب أن يكون ${max} كحد أقصى` };
  }

  return { isValid: true };
}

/**
 * Validate form fields
 */
export function validateForm<T extends Record<string, string>>(
  data: T,
  rules: Partial<Record<keyof T, (value: string) => ValidationResult>>
): { isValid: boolean; errors: Partial<Record<keyof T, string>> } {
  const errors: Partial<Record<keyof T, string>> = {};
  let isValid = true;

  for (const [field, validator] of Object.entries(rules)) {
    if (validator) {
      const result = validator(data[field]);
      if (!result.isValid) {
        errors[field as keyof T] = result.error;
        isValid = false;
      }
    }
  }

  return { isValid, errors };
}

/**
 * Check if input contains potentially malicious content
 */
export function containsMaliciousContent(input: string): boolean {
  const maliciousPatterns = [
    /<script/i,
    /javascript:/i,
    /on\w+\s*=/i, // onclick, onerror, etc.
    /<iframe/i,
    /<embed/i,
    /<object/i,
    /data:/i,
    /vbscript:/i,
  ];

  return maliciousPatterns.some(pattern => pattern.test(input));
}
