// =============================================
// FormField - حقل إدخال موحد لصفحات Admin
// =============================================

"use client";

import React from "react";

export interface FormFieldProps {
    label: string;
    value: string | number;
    onChange: (value: string) => void;
    type?: 'text' | 'email' | 'number' | 'textarea' | 'select';
    disabled?: boolean;
    placeholder?: string;
    rows?: number;
    options?: { value: string; label: string }[];
    fullWidth?: boolean;
    className?: string;
}

/**
 * FormField - حقل إدخال موحد
 */
export function FormField({
    label,
    value,
    onChange,
    type = 'text',
    disabled = false,
    placeholder,
    rows = 3,
    options,
    fullWidth = false,
    className = '',
}: FormFieldProps) {
    const baseInputClass = "w-full px-4 py-2.5 rounded-xl bg-gray-100 dark:bg-gray-800 outline-none focus:ring-2 focus:ring-primary-500 transition-all";
    const disabledClass = disabled ? "opacity-50 cursor-not-allowed" : "";
    const containerClass = fullWidth ? "col-span-1 md:col-span-2" : "";

    return (
        <div className={`${containerClass} ${className}`}>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                {label}
            </label>
            {type === 'textarea' ? (
                <textarea
                    value={value}
                    onChange={(e) => onChange(e.target.value)}
                    rows={rows}
                    disabled={disabled}
                    placeholder={placeholder}
                    className={`${baseInputClass} ${disabledClass} resize-none`}
                />
            ) : type === 'select' && options ? (
                <select
                    value={value}
                    onChange={(e) => onChange(e.target.value)}
                    disabled={disabled}
                    className={`${baseInputClass} ${disabledClass}`}
                >
                    {options.map((opt) => (
                        <option key={opt.value} value={opt.value}>
                            {opt.label}
                        </option>
                    ))}
                </select>
            ) : (
                <input
                    type={type}
                    value={value}
                    onChange={(e) => onChange(e.target.value)}
                    disabled={disabled}
                    placeholder={placeholder}
                    className={`${baseInputClass} ${disabledClass}`}
                />
            )}
        </div>
    );
}

/**
 * CheckboxField - حقل checkbox موحد
 */
export interface CheckboxFieldProps {
    id: string;
    label: string;
    description?: string;
    checked: boolean;
    onChange: (checked: boolean) => void;
    accentColor?: string;
    fullWidth?: boolean;
}

export function CheckboxField({
    id,
    label,
    description,
    checked,
    onChange,
    accentColor = 'accent-primary-500',
    fullWidth = true,
}: CheckboxFieldProps) {
    return (
        <div className={`flex items-center gap-3 ${fullWidth ? 'col-span-1 md:col-span-2' : ''}`}>
            <input
                type="checkbox"
                id={id}
                checked={checked}
                onChange={(e) => onChange(e.target.checked)}
                className={`w-5 h-5 rounded ${accentColor}`}
            />
            <label htmlFor={id} className="text-sm font-medium text-gray-700 dark:text-gray-300">
                {label}
                {description && (
                    <span className="block text-xs text-gray-500 dark:text-gray-400">
                        {description}
                    </span>
                )}
            </label>
        </div>
    );
}

/**
 * FormSection - قسم في الفورم مع عنوان
 */
export interface FormSectionProps {
    title: string;
    titleColor?: string;
    children: React.ReactNode;
}

export function FormSection({
    title,
    titleColor = 'text-primary-500',
    children,
}: FormSectionProps) {
    return (
        <>
            <div className="col-span-1 md:col-span-2 mt-2 pt-4 border-t border-gray-200 dark:border-gray-800">
                <h3 className={`font-semibold mb-4 ${titleColor}`}>{title}</h3>
            </div>
            {children}
        </>
    );
}
