// =============================================
// Validation Utilities - أدوات التحقق
// =============================================

import { validationMessages } from '@/lib/constants/messages';

// ═══════════════════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════════════════

export type ValidationError = Record<string, string>;
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type ValidationRule<T> = (value: T, formData?: Record<string, any>) => string | null;
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type FieldValidators<T extends Record<string, any>> = {
    [K in keyof T]?: ValidationRule<T[K]>[];
};

// ═══════════════════════════════════════════════════════════════════════════
// VALIDATION RULES
// ═══════════════════════════════════════════════════════════════════════════

export const rules = {
    /**
     * Required field validation
     */
    required: (fieldName: keyof typeof validationMessages.required): ValidationRule<string> =>
        (value) => {
            if (!value || value.trim() === '') {
                return validationMessages.required[fieldName] || `${fieldName} مطلوب`;
            }
            return null;
        },

    /**
     * Email validation
     */
    email: (): ValidationRule<string> =>
        (value) => {
            if (!value) return null;
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (!emailRegex.test(value)) {
                return validationMessages.invalid.email;
            }
            return null;
        },

    /**
     * Minimum length validation
     */
    minLength: (min: number, fieldLabel: string = ''): ValidationRule<string> =>
        (value) => {
            if (!value || value.length >= min) return null;
            return validationMessages.length.min(fieldLabel, min);
        },

    /**
     * Maximum length validation
     */
    maxLength: (max: number, fieldLabel: string = ''): ValidationRule<string> =>
        (value) => {
            if (!value || value.length <= max) return null;
            return validationMessages.length.max(fieldLabel, max);
        },

    /**
     * Match another field validation
     */
    match: (targetField: string, messageKey: keyof typeof validationMessages.match = 'password'): ValidationRule<string> =>
        (value, formData) => {
            if (!formData) return null;
            if (value !== formData[targetField]) {
                return validationMessages.match[messageKey];
            }
            return null;
        },

    /**
     * Password strength validation
     */
    password: (minLength: number = 6): ValidationRule<string> =>
        (value) => {
            if (!value) return null;
            if (value.length < minLength) {
                return validationMessages.length.password(minLength);
            }
            return null;
        },

    /**
     * Phone number validation (Egyptian format)
     */
    phone: (): ValidationRule<string> =>
        (value) => {
            if (!value) return null;
            const phoneRegex = /^01[0-2,5]{1}[0-9]{8}$/;
            if (!phoneRegex.test(value)) {
                return validationMessages.invalid.phone;
            }
            return null;
        },

    /**
     * URL validation
     */
    url: (): ValidationRule<string> =>
        (value) => {
            if (!value) return null;
            try {
                new URL(value);
                return null;
            } catch {
                return validationMessages.invalid.url;
            }
        },

    /**
     * Custom pattern validation
     */
    pattern: (regex: RegExp, message: string): ValidationRule<string> =>
        (value) => {
            if (!value) return null;
            if (!regex.test(value)) {
                return message;
            }
            return null;
        },

    /**
     * Numeric validation
     */
    numeric: (): ValidationRule<string> =>
        (value) => {
            if (!value) return null;
            if (isNaN(Number(value))) {
                return validationMessages.invalid.number;
            }
            return null;
        },

    /**
     * Range validation for numbers
     */
    range: (min: number, max: number, message: string): ValidationRule<string | number> =>
        (value) => {
            if (value === '' || value === null || value === undefined) return null;
            const num = typeof value === 'string' ? Number(value) : value;
            if (num < min || num > max) {
                return message;
            }
            return null;
        },
};

// ═══════════════════════════════════════════════════════════════════════════
// VALIDATION FUNCTION
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Validate form data against field validators
 * @param formData - The form data to validate
 * @param validators - The validation rules for each field
 * @returns Object with field names as keys and error messages as values
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function validate<T extends Record<string, any>>(
    formData: T,
    validators: FieldValidators<T>
): ValidationError {
    const errors: ValidationError = {};

    for (const field in validators) {
        const fieldValidators = validators[field];
        if (!fieldValidators) continue;

        for (const validator of fieldValidators) {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const error = validator(formData[field] as never, formData as Record<string, any>);
            if (error) {
                errors[field] = error;
                break; // Stop at first error for this field
            }
        }
    }

    return errors;
}

/**
 * Check if validation result has no errors
 */
export function isValid(errors: ValidationError): boolean {
    return Object.keys(errors).length === 0;
}

// ═══════════════════════════════════════════════════════════════════════════
// PASSWORD STRENGTH
// ═══════════════════════════════════════════════════════════════════════════

export interface PasswordRequirement {
    text: string;
    met: boolean;
    key: string;
}

export interface PasswordStrength {
    strength: number;
    label: string;
    color: string;
}

import { authMessages } from '@/lib/constants/messages';

/**
 * Get password requirements status
 */
export function getPasswordRequirements(password: string): PasswordRequirement[] {
    return [
        {
            text: authMessages.passwordStrength.requirements.length,
            met: password.length >= 6,
            key: "length"
        },
        {
            text: authMessages.passwordStrength.requirements.uppercase,
            met: /[A-Z]/.test(password),
            key: "uppercase"
        },
        {
            text: authMessages.passwordStrength.requirements.lowercase,
            met: /[a-z]/.test(password),
            key: "lowercase"
        },
        {
            text: authMessages.passwordStrength.requirements.number,
            met: /\d/.test(password),
            key: "number"
        },
    ];
}

/**
 * Calculate password strength
 */
export function getPasswordStrength(password: string): PasswordStrength {
    const requirements = getPasswordRequirements(password);
    const metCount = requirements.filter(req => req.met).length;

    if (metCount === 0) return { strength: 0, label: "", color: "bg-gray-200" };
    if (metCount === 1) return { strength: 25, label: authMessages.passwordStrength.weak, color: "bg-red-500" };
    if (metCount === 2) return { strength: 50, label: authMessages.passwordStrength.medium, color: "bg-yellow-500" };
    if (metCount === 3) return { strength: 75, label: authMessages.passwordStrength.good, color: "bg-blue-500" };
    return { strength: 100, label: authMessages.passwordStrength.strong, color: "bg-green-500" };
}
