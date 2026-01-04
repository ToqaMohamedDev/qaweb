// =============================================
// Form Components - مكونات النماذج المشتركة
// =============================================

'use client';

import { forwardRef, InputHTMLAttributes, SelectHTMLAttributes, TextareaHTMLAttributes, ReactNode } from 'react';
import { AlertCircle, CheckCircle2, Eye, EyeOff, Loader2 } from 'lucide-react';
import { useState } from 'react';

// ═══════════════════════════════════════════════════════════════════════════
// SHARED TYPES
// ═══════════════════════════════════════════════════════════════════════════

type InputVariant = 'default' | 'glass' | 'filled';
type InputSize = 'sm' | 'md' | 'lg';

interface BaseProps {
    label?: string;
    error?: string;
    hint?: string;
    required?: boolean;
    variant?: InputVariant;
    inputSize?: InputSize;
    leftIcon?: ReactNode;
    rightIcon?: ReactNode;
    isLoading?: boolean;
    isSuccess?: boolean;
}

// ═══════════════════════════════════════════════════════════════════════════
// STYLE HELPERS
// ═══════════════════════════════════════════════════════════════════════════

const getVariantClasses = (variant: InputVariant, hasError: boolean, disabled?: boolean) => {
    const base = 'w-full rounded-xl transition-all duration-200 outline-none';

    const variants: Record<InputVariant, string> = {
        default: `
            border bg-white dark:bg-[#1c1c24]
            ${hasError
                ? 'border-red-300 dark:border-red-600 focus:border-red-500 focus:ring-2 focus:ring-red-500/20'
                : 'border-gray-200 dark:border-[#2e2e3a] focus:border-violet-500 dark:focus:border-violet-400 focus:ring-2 focus:ring-violet-500/20'
            }
            ${disabled ? 'opacity-60 cursor-not-allowed bg-gray-50 dark:bg-[#252530]' : ''}
        `,
        glass: `
            border backdrop-blur-sm
            bg-white/80 dark:bg-[#1c1c24]/80
            ${hasError
                ? 'border-red-300/60 dark:border-red-600/60'
                : 'border-gray-200/60 dark:border-[#2e2e3a]/60 focus:border-violet-500/60'
            }
            ${disabled ? 'opacity-60 cursor-not-allowed' : ''}
        `,
        filled: `
            border-0 bg-gray-100 dark:bg-[#252530]
            ${hasError
                ? 'ring-2 ring-red-500/30'
                : 'focus:ring-2 focus:ring-violet-500/30'
            }
            ${disabled ? 'opacity-60 cursor-not-allowed' : ''}
        `,
    };

    return `${base} ${variants[variant]}`;
};

const getSizeClasses = (size: InputSize) => {
    const sizes: Record<InputSize, string> = {
        sm: 'px-3 py-2 text-sm',
        md: 'px-4 py-2.5 text-base',
        lg: 'px-4 py-3 text-lg',
    };
    return sizes[size];
};

// ═══════════════════════════════════════════════════════════════════════════
// FORM INPUT
// ═══════════════════════════════════════════════════════════════════════════

interface FormInputProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'size'>, BaseProps { }

export const FormInput = forwardRef<HTMLInputElement, FormInputProps>(({
    label,
    error,
    hint,
    required,
    variant = 'default',
    inputSize = 'md',
    leftIcon,
    rightIcon,
    isLoading,
    isSuccess,
    className = '',
    type = 'text',
    disabled,
    ...props
}, ref) => {
    const [showPassword, setShowPassword] = useState(false);
    const isPassword = type === 'password';
    const inputType = isPassword ? (showPassword ? 'text' : 'password') : type;

    return (
        <div className="w-full">
            {label && (
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                    {label}
                    {required && <span className="text-red-500 mr-1">*</span>}
                </label>
            )}

            <div className="relative">
                {leftIcon && (
                    <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
                        {leftIcon}
                    </div>
                )}

                <input
                    ref={ref}
                    type={inputType}
                    disabled={disabled || isLoading}
                    className={`
                        ${getVariantClasses(variant, !!error, disabled)}
                        ${getSizeClasses(inputSize)}
                        ${leftIcon ? 'pr-4 pl-10' : ''}
                        ${rightIcon || isPassword || isLoading || isSuccess ? 'pl-4 pr-10' : ''}
                        text-gray-900 dark:text-gray-100
                        placeholder:text-gray-400 dark:placeholder:text-gray-500
                        ${className}
                    `}
                    {...props}
                />

                <div className="absolute left-3 top-1/2 -translate-y-1/2 flex items-center gap-1">
                    {isLoading && <Loader2 className="h-4 w-4 animate-spin text-gray-400" />}
                    {isSuccess && !isLoading && <CheckCircle2 className="h-4 w-4 text-green-500" />}
                    {isPassword && !isLoading && !isSuccess && (
                        <button
                            type="button"
                            onClick={() => setShowPassword(!showPassword)}
                            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                        >
                            {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </button>
                    )}
                    {rightIcon && !isPassword && !isLoading && !isSuccess && rightIcon}
                </div>
            </div>

            {error && (
                <p className="mt-1.5 text-sm text-red-500 flex items-center gap-1">
                    <AlertCircle className="h-3.5 w-3.5" />
                    {error}
                </p>
            )}

            {hint && !error && (
                <p className="mt-1.5 text-sm text-gray-500 dark:text-gray-400">{hint}</p>
            )}
        </div>
    );
});

FormInput.displayName = 'FormInput';

// ═══════════════════════════════════════════════════════════════════════════
// FORM SELECT
// ═══════════════════════════════════════════════════════════════════════════

interface FormSelectOption {
    value: string;
    label: string;
    disabled?: boolean;
}

interface FormSelectProps extends Omit<SelectHTMLAttributes<HTMLSelectElement>, 'size'>, BaseProps {
    options: FormSelectOption[];
    placeholder?: string;
}

export const FormSelect = forwardRef<HTMLSelectElement, FormSelectProps>(({
    label,
    error,
    hint,
    required,
    variant = 'default',
    inputSize = 'md',
    leftIcon,
    options,
    placeholder,
    className = '',
    disabled,
    ...props
}, ref) => {
    return (
        <div className="w-full">
            {label && (
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                    {label}
                    {required && <span className="text-red-500 mr-1">*</span>}
                </label>
            )}

            <div className="relative">
                {leftIcon && (
                    <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none">
                        {leftIcon}
                    </div>
                )}

                <select
                    ref={ref}
                    disabled={disabled}
                    className={`
                        ${getVariantClasses(variant, !!error, disabled)}
                        ${getSizeClasses(inputSize)}
                        ${leftIcon ? 'pr-4 pl-10' : ''}
                        appearance-none cursor-pointer
                        text-gray-900 dark:text-gray-100
                        ${className}
                    `}
                    {...props}
                >
                    {placeholder && (
                        <option value="" disabled>
                            {placeholder}
                        </option>
                    )}
                    {options.map(opt => (
                        <option key={opt.value} value={opt.value} disabled={opt.disabled}>
                            {opt.label}
                        </option>
                    ))}
                </select>

                {/* Custom dropdown arrow */}
                <div className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none">
                    <svg className="h-4 w-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                </div>
            </div>

            {error && (
                <p className="mt-1.5 text-sm text-red-500 flex items-center gap-1">
                    <AlertCircle className="h-3.5 w-3.5" />
                    {error}
                </p>
            )}

            {hint && !error && (
                <p className="mt-1.5 text-sm text-gray-500 dark:text-gray-400">{hint}</p>
            )}
        </div>
    );
});

FormSelect.displayName = 'FormSelect';

// ═══════════════════════════════════════════════════════════════════════════
// FORM TEXTAREA
// ═══════════════════════════════════════════════════════════════════════════

interface FormTextareaProps extends Omit<TextareaHTMLAttributes<HTMLTextAreaElement>, 'size'>, BaseProps {
    maxLength?: number;
    showCount?: boolean;
}

export const FormTextarea = forwardRef<HTMLTextAreaElement, FormTextareaProps>(({
    label,
    error,
    hint,
    required,
    variant = 'default',
    inputSize = 'md',
    maxLength,
    showCount,
    className = '',
    disabled,
    value,
    ...props
}, ref) => {
    const charCount = typeof value === 'string' ? value.length : 0;

    return (
        <div className="w-full">
            {label && (
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                    {label}
                    {required && <span className="text-red-500 mr-1">*</span>}
                </label>
            )}

            <div className="relative">
                <textarea
                    ref={ref}
                    disabled={disabled}
                    maxLength={maxLength}
                    value={value}
                    className={`
                        ${getVariantClasses(variant, !!error, disabled)}
                        ${getSizeClasses(inputSize)}
                        resize-none leading-relaxed
                        text-gray-900 dark:text-gray-100
                        placeholder:text-gray-400 dark:placeholder:text-gray-500
                        ${className}
                    `}
                    {...props}
                />

                {showCount && maxLength && (
                    <div className="absolute bottom-2 left-3 text-xs text-gray-400">
                        {charCount}/{maxLength}
                    </div>
                )}
            </div>

            {error && (
                <p className="mt-1.5 text-sm text-red-500 flex items-center gap-1">
                    <AlertCircle className="h-3.5 w-3.5" />
                    {error}
                </p>
            )}

            {hint && !error && (
                <p className="mt-1.5 text-sm text-gray-500 dark:text-gray-400">{hint}</p>
            )}
        </div>
    );
});

FormTextarea.displayName = 'FormTextarea';

// ═══════════════════════════════════════════════════════════════════════════
// FORM CHECKBOX
// ═══════════════════════════════════════════════════════════════════════════

interface FormCheckboxProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'type' | 'size'> {
    label: string;
    description?: string;
    error?: string;
}

export const FormCheckbox = forwardRef<HTMLInputElement, FormCheckboxProps>(({
    label,
    description,
    error,
    className = '',
    disabled,
    ...props
}, ref) => {
    return (
        <div className={`${disabled ? 'opacity-60' : ''}`}>
            <label className="flex items-start gap-3 cursor-pointer group">
                <input
                    ref={ref}
                    type="checkbox"
                    disabled={disabled}
                    className={`
                        mt-0.5 h-5 w-5 rounded border-2
                        border-gray-300 dark:border-gray-600
                        text-violet-600 focus:ring-violet-500 focus:ring-offset-0
                        disabled:cursor-not-allowed
                        ${className}
                    `}
                    {...props}
                />
                <div className="flex-1">
                    <span className="text-sm font-medium text-gray-900 dark:text-gray-100 group-hover:text-violet-600 dark:group-hover:text-violet-400 transition-colors">
                        {label}
                    </span>
                    {description && (
                        <p className="mt-0.5 text-sm text-gray-500 dark:text-gray-400">{description}</p>
                    )}
                </div>
            </label>

            {error && (
                <p className="mt-1.5 text-sm text-red-500 flex items-center gap-1 mr-8">
                    <AlertCircle className="h-3.5 w-3.5" />
                    {error}
                </p>
            )}
        </div>
    );
});

FormCheckbox.displayName = 'FormCheckbox';

// ═══════════════════════════════════════════════════════════════════════════
// FORM RADIO GROUP
// ═══════════════════════════════════════════════════════════════════════════

interface RadioOption {
    value: string;
    label: string;
    description?: string;
    disabled?: boolean;
}

interface FormRadioGroupProps {
    name: string;
    label?: string;
    options: RadioOption[];
    value?: string;
    onChange?: (value: string) => void;
    error?: string;
    required?: boolean;
    direction?: 'horizontal' | 'vertical';
}

export function FormRadioGroup({
    name,
    label,
    options,
    value,
    onChange,
    error,
    required,
    direction = 'vertical',
}: FormRadioGroupProps) {
    return (
        <div className="w-full">
            {label && (
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    {label}
                    {required && <span className="text-red-500 mr-1">*</span>}
                </label>
            )}

            <div className={`flex ${direction === 'vertical' ? 'flex-col gap-2' : 'flex-row flex-wrap gap-4'}`}>
                {options.map(opt => (
                    <label
                        key={opt.value}
                        className={`
                            flex items-start gap-3 cursor-pointer group
                            ${opt.disabled ? 'opacity-60 cursor-not-allowed' : ''}
                        `}
                    >
                        <input
                            type="radio"
                            name={name}
                            value={opt.value}
                            checked={value === opt.value}
                            onChange={() => onChange?.(opt.value)}
                            disabled={opt.disabled}
                            className="mt-0.5 h-5 w-5 border-2 border-gray-300 dark:border-gray-600 text-violet-600 focus:ring-violet-500"
                        />
                        <div className="flex-1">
                            <span className="text-sm font-medium text-gray-900 dark:text-gray-100 group-hover:text-violet-600 dark:group-hover:text-violet-400 transition-colors">
                                {opt.label}
                            </span>
                            {opt.description && (
                                <p className="mt-0.5 text-sm text-gray-500 dark:text-gray-400">{opt.description}</p>
                            )}
                        </div>
                    </label>
                ))}
            </div>

            {error && (
                <p className="mt-1.5 text-sm text-red-500 flex items-center gap-1">
                    <AlertCircle className="h-3.5 w-3.5" />
                    {error}
                </p>
            )}
        </div>
    );
}

// ═══════════════════════════════════════════════════════════════════════════
// FORM SWITCH
// ═══════════════════════════════════════════════════════════════════════════

interface FormSwitchProps {
    label: string;
    description?: string;
    checked?: boolean;
    onChange?: (checked: boolean) => void;
    disabled?: boolean;
    size?: 'sm' | 'md';
}

export function FormSwitch({
    label,
    description,
    checked = false,
    onChange,
    disabled,
    size = 'md',
}: FormSwitchProps) {
    const sizes = {
        sm: { track: 'w-8 h-4', thumb: 'h-3 w-3', translate: 'translate-x-4' },
        md: { track: 'w-11 h-6', thumb: 'h-5 w-5', translate: 'translate-x-5' },
    };

    return (
        <label className={`flex items-center justify-between gap-4 cursor-pointer ${disabled ? 'opacity-60 cursor-not-allowed' : ''}`}>
            <div className="flex-1">
                <span className="text-sm font-medium text-gray-900 dark:text-gray-100">{label}</span>
                {description && (
                    <p className="text-sm text-gray-500 dark:text-gray-400">{description}</p>
                )}
            </div>

            <button
                type="button"
                role="switch"
                aria-checked={checked}
                disabled={disabled}
                onClick={() => onChange?.(!checked)}
                className={`
                    relative inline-flex shrink-0 rounded-full
                    transition-colors duration-200 ease-in-out
                    focus:outline-none focus:ring-2 focus:ring-violet-500 focus:ring-offset-2
                    ${sizes[size].track}
                    ${checked ? 'bg-violet-600' : 'bg-gray-200 dark:bg-gray-700'}
                `}
            >
                <span
                    className={`
                        pointer-events-none inline-block rounded-full bg-white shadow-lg
                        transform transition duration-200 ease-in-out
                        ${sizes[size].thumb}
                        ${checked ? sizes[size].translate : 'translate-x-0.5'}
                        ${size === 'sm' ? 'mt-0.5' : 'mt-0.5'}
                    `}
                />
            </button>
        </label>
    );
}

// ═══════════════════════════════════════════════════════════════════════════
// FORM FIELD GROUP (for grouping related fields)
// ═══════════════════════════════════════════════════════════════════════════

interface FormFieldGroupProps {
    label?: string;
    description?: string;
    children: ReactNode;
    columns?: 1 | 2 | 3 | 4;
}

export function FormFieldGroup({ label, description, children, columns = 1 }: FormFieldGroupProps) {
    const gridCols = {
        1: 'grid-cols-1',
        2: 'grid-cols-1 md:grid-cols-2',
        3: 'grid-cols-1 md:grid-cols-3',
        4: 'grid-cols-1 md:grid-cols-2 lg:grid-cols-4',
    };

    return (
        <div className="space-y-3">
            {(label || description) && (
                <div>
                    {label && <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100">{label}</h3>}
                    {description && <p className="text-sm text-gray-500 dark:text-gray-400">{description}</p>}
                </div>
            )}
            <div className={`grid ${gridCols[columns]} gap-4`}>
                {children}
            </div>
        </div>
    );
}

// ═══════════════════════════════════════════════════════════════════════════
// FORM SECTION
// ═══════════════════════════════════════════════════════════════════════════

interface FormSectionProps {
    title: string;
    description?: string;
    icon?: ReactNode;
    children: ReactNode;
    className?: string;
}

export function FormSection({ title, description, icon, children, className = '' }: FormSectionProps) {
    return (
        <div className={`bg-white dark:bg-[#1c1c24] rounded-2xl shadow-lg border border-gray-200 dark:border-[#2e2e3a] p-6 ${className}`}>
            <div className="flex items-start gap-3 mb-4">
                {icon && (
                    <div className="p-2 rounded-xl bg-violet-100 dark:bg-violet-900/30 text-violet-600 dark:text-violet-400">
                        {icon}
                    </div>
                )}
                <div>
                    <h2 className="text-lg font-bold text-gray-900 dark:text-white">{title}</h2>
                    {description && <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">{description}</p>}
                </div>
            </div>
            <div className="space-y-4">
                {children}
            </div>
        </div>
    );
}

// ═══════════════════════════════════════════════════════════════════════════
// EXPORTS
// ═══════════════════════════════════════════════════════════════════════════

export const Form = {
    Input: FormInput,
    Select: FormSelect,
    Textarea: FormTextarea,
    Checkbox: FormCheckbox,
    RadioGroup: FormRadioGroup,
    Switch: FormSwitch,
    FieldGroup: FormFieldGroup,
    Section: FormSection,
};
