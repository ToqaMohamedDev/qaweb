// =============================================
// Utils Exports - نقطة تصدير الأدوات
// =============================================

export * from './formatters';
export * from './helpers';
export { logger } from './logger';

// NEW - API Helpers (exported as namespace to avoid conflicts)
export { ApiHelpers, HttpStatus, withErrorHandling, validateRequired, parseBody } from './api-helpers';
export type { ApiSuccessResponse, ApiErrorResponse } from './api-helpers';

// NEW - Date Utils (exported as namespace)
export { DateUtils } from './date-utils';

// NEW - String Utils (exported as namespace)
export { StringUtils } from './string-utils';

// NEW - Validation Utils
export {
    rules,
    validate,
    isValid,
    getPasswordRequirements,
    getPasswordStrength
} from './validation';
// Rename ValidationError to avoid conflict with question-bank types
export type {
    ValidationError as FormValidationErrors,
    ValidationRule,
    FieldValidators,
    PasswordRequirement,
    PasswordStrength
} from './validation';
