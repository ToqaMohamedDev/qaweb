// =============================================
// useFormValidation Hook - خطاف التحقق من النماذج
// =============================================

import { useState, useCallback, useMemo } from 'react';
import {
    validate,
    isValid,
    rules,
    getPasswordRequirements,
    getPasswordStrength,
    type ValidationError,
    type FieldValidators,
    type PasswordRequirement,
    type PasswordStrength
} from '@/lib/utils/validation';

// ═══════════════════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════════════════

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export interface UseFormValidationOptions<T extends Record<string, any>> {
    initialValues: T;
    validators: FieldValidators<T>;
    onSubmit?: (values: T) => Promise<void> | void;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export interface UseFormValidationReturn<T extends Record<string, any>> {
    // Form state
    values: T;
    errors: ValidationError;
    touched: Record<keyof T, boolean>;

    // Status
    isSubmitting: boolean;
    isValid: boolean;
    isDirty: boolean;

    // Actions
    setFieldValue: <K extends keyof T>(field: K, value: T[K]) => void;
    setFieldTouched: (field: keyof T) => void;
    setValues: (values: Partial<T>) => void;
    setErrors: (errors: ValidationError) => void;
    clearFieldError: (field: keyof T) => void;
    validateField: (field: keyof T) => string | null;
    validateForm: () => ValidationError;
    handleSubmit: (e: React.FormEvent) => Promise<void>;
    reset: () => void;

    // Password specific (if applicable)
    passwordRequirements: PasswordRequirement[];
    passwordStrength: PasswordStrength;

    // Utilities
    getInputProps: (field: keyof T) => {
        value: T[keyof T];
        onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => void;
        onBlur: () => void;
        error?: string;
    };
}

// ═══════════════════════════════════════════════════════════════════════════
// HOOK IMPLEMENTATION
// ═══════════════════════════════════════════════════════════════════════════

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function useFormValidation<T extends Record<string, any>>({
    initialValues,
    validators,
    onSubmit,
}: UseFormValidationOptions<T>): UseFormValidationReturn<T> {
    // State
    const [values, setValues] = useState<T>(initialValues);
    const [errors, setErrors] = useState<ValidationError>({});
    const [touched, setTouched] = useState<Record<keyof T, boolean>>(
        Object.keys(initialValues).reduce(
            (acc, key) => ({ ...acc, [key]: false }),
            {} as Record<keyof T, boolean>
        )
    );
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Computed values
    const isDirty = useMemo(() =>
        JSON.stringify(values) !== JSON.stringify(initialValues),
        [values, initialValues]
    );

    const formIsValid = useMemo(() => isValid(errors), [errors]);

    // Password specific
    const passwordRequirements = useMemo(() => {
        const password = (values as Record<string, string>).password ?? '';
        return getPasswordRequirements(password);
    }, [(values as Record<string, string>).password]);

    const passwordStrength = useMemo(() => {
        const password = (values as Record<string, string>).password ?? '';
        return getPasswordStrength(password);
    }, [(values as Record<string, string>).password]);

    // Actions
    const setFieldValue = useCallback(<K extends keyof T>(field: K, value: T[K]) => {
        setValues(prev => ({ ...prev, [field]: value }));
        // Clear error when user starts typing
        if (errors[field as string]) {
            setErrors(prev => {
                const newErrors = { ...prev };
                delete newErrors[field as string];
                return newErrors;
            });
        }
    }, [errors]);

    const setFieldTouched = useCallback((field: keyof T) => {
        setTouched(prev => ({ ...prev, [field]: true }));
    }, []);

    const setAllValues = useCallback((newValues: Partial<T>) => {
        setValues(prev => ({ ...prev, ...newValues }));
    }, []);

    const clearFieldError = useCallback((field: keyof T) => {
        setErrors(prev => {
            const newErrors = { ...prev };
            delete newErrors[field as string];
            return newErrors;
        });
    }, []);

    const validateField = useCallback((field: keyof T): string | null => {
        const fieldValidators = validators[field];
        if (!fieldValidators) return null;

        for (const validator of fieldValidators) {
            const error = validator(values[field] as never, values as Record<string, unknown>);
            if (error) return error;
        }
        return null;
    }, [values, validators]);

    const validateForm = useCallback((): ValidationError => {
        const newErrors = validate(values, validators);
        setErrors(newErrors);
        return newErrors;
    }, [values, validators]);

    const handleSubmit = useCallback(async (e: React.FormEvent) => {
        e.preventDefault();

        // Mark all fields as touched
        setTouched(
            Object.keys(values).reduce(
                (acc, key) => ({ ...acc, [key]: true }),
                {} as Record<keyof T, boolean>
            )
        );

        const formErrors = validateForm();
        if (!isValid(formErrors)) return;

        if (onSubmit) {
            setIsSubmitting(true);
            try {
                await onSubmit(values);
            } finally {
                setIsSubmitting(false);
            }
        }
    }, [values, validateForm, onSubmit]);

    const reset = useCallback(() => {
        setValues(initialValues);
        setErrors({});
        setTouched(
            Object.keys(initialValues).reduce(
                (acc, key) => ({ ...acc, [key]: false }),
                {} as Record<keyof T, boolean>
            )
        );
        setIsSubmitting(false);
    }, [initialValues]);

    const getInputProps = useCallback((field: keyof T) => ({
        value: values[field],
        onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
            setFieldValue(field, e.target.value as T[keyof T]);
        },
        onBlur: () => {
            setFieldTouched(field);
            const error = validateField(field);
            if (error) {
                setErrors(prev => ({ ...prev, [field as string]: error }));
            }
        },
        error: touched[field] ? errors[field as string] : undefined,
    }), [values, errors, touched, setFieldValue, setFieldTouched, validateField]);

    return {
        values,
        errors,
        touched,
        isSubmitting,
        isValid: formIsValid,
        isDirty,
        setFieldValue,
        setFieldTouched,
        setValues: setAllValues,
        setErrors,
        clearFieldError,
        validateField,
        validateForm,
        handleSubmit,
        reset,
        passwordRequirements,
        passwordStrength,
        getInputProps,
    };
}

// ═══════════════════════════════════════════════════════════════════════════
// EXPORT VALIDATION RULES FOR CONVENIENCE
// ═══════════════════════════════════════════════════════════════════════════

export { rules, validate, isValid };
