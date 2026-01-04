/**
 * ╔══════════════════════════════════════════════════════════════════════════╗
 * ║                      FORM SELECT - قائمة اختيار نموذج                    ║
 * ╚══════════════════════════════════════════════════════════════════════════╝
 */

'use client';

import React from 'react';

// ═══════════════════════════════════════════════════════════════════════════
// 1. TYPES
// ═══════════════════════════════════════════════════════════════════════════

export interface SelectOption {
    value: string;
    label: string;
    disabled?: boolean;
}

export interface FormSelectProps extends Omit<React.SelectHTMLAttributes<HTMLSelectElement>, 'children'> {
    label?: string;
    error?: string;
    hint?: string;
    required?: boolean;
    options: SelectOption[];
    placeholder?: string;
    containerClassName?: string;
}

// ═══════════════════════════════════════════════════════════════════════════
// 2. COMPONENT
// ═══════════════════════════════════════════════════════════════════════════

export function FormSelect({
    label,
    error,
    hint,
    required,
    options,
    placeholder = 'اختر...',
    containerClassName = '',
    className = '',
    id,
    ...props
}: FormSelectProps) {
    const selectId = id || `select-${label?.replace(/\s+/g, '-').toLowerCase() || 'field'}`;

    return (
        <div className={`form-select-container ${containerClassName}`}>
            {label && (
                <label
                    htmlFor={selectId}
                    className="form-select-label"
                >
                    {label}
                    {required && <span className="form-select-required">*</span>}
                </label>
            )}

            <div className="form-select-wrapper">
                <select
                    id={selectId}
                    className={`
                        form-select
                        ${error ? 'form-select-error' : ''}
                        ${className}
                    `}
                    aria-invalid={!!error}
                    aria-describedby={error ? `${selectId}-error` : hint ? `${selectId}-hint` : undefined}
                    {...props}
                >
                    {placeholder && (
                        <option value="" disabled>
                            {placeholder}
                        </option>
                    )}
                    {options.map((option) => (
                        <option
                            key={option.value}
                            value={option.value}
                            disabled={option.disabled}
                        >
                            {option.label}
                        </option>
                    ))}
                </select>

                <span className="form-select-arrow">
                    <svg
                        width="12"
                        height="12"
                        viewBox="0 0 12 12"
                        fill="none"
                        stroke="currentColor"
                    >
                        <path
                            d="M3 4.5L6 7.5L9 4.5"
                            strokeWidth="1.5"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                        />
                    </svg>
                </span>
            </div>

            {error && (
                <p id={`${selectId}-error`} className="form-select-error-message" role="alert">
                    {error}
                </p>
            )}

            {hint && !error && (
                <p id={`${selectId}-hint`} className="form-select-hint">
                    {hint}
                </p>
            )}

            <style jsx>{`
                .form-select-container {
                    display: flex;
                    flex-direction: column;
                    gap: 0.375rem;
                }
                
                .form-select-label {
                    font-size: 0.875rem;
                    font-weight: 500;
                    color: var(--text-primary, #374151);
                }
                
                :global(.dark) .form-select-label {
                    color: #e5e7eb;
                }
                
                .form-select-required {
                    color: #ef4444;
                    margin-right: 0.25rem;
                }
                
                .form-select-wrapper {
                    position: relative;
                    display: flex;
                    align-items: center;
                }
                
                .form-select {
                    width: 100%;
                    padding: 0.625rem 2.5rem 0.625rem 0.875rem;
                    font-size: 0.875rem;
                    line-height: 1.5;
                    border: 1px solid #d1d5db;
                    border-radius: 0.5rem;
                    background-color: white;
                    color: #1f2937;
                    cursor: pointer;
                    appearance: none;
                    transition: all 0.15s ease-in-out;
                    outline: none;
                }
                
                :global(.dark) .form-select {
                    background-color: #1f2937;
                    border-color: #374151;
                    color: #f9fafb;
                }
                
                .form-select:focus {
                    border-color: #3b82f6;
                    box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
                }
                
                :global(.dark) .form-select:focus {
                    border-color: #60a5fa;
                    box-shadow: 0 0 0 3px rgba(96, 165, 250, 0.1);
                }
                
                .form-select:disabled {
                    background-color: #f3f4f6;
                    cursor: not-allowed;
                    opacity: 0.6;
                }
                
                :global(.dark) .form-select:disabled {
                    background-color: #111827;
                }
                
                .form-select-error {
                    border-color: #ef4444 !important;
                }
                
                .form-select-arrow {
                    position: absolute;
                    left: 0.75rem;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    color: #9ca3af;
                    pointer-events: none;
                }
                
                .form-select-error-message {
                    font-size: 0.75rem;
                    color: #ef4444;
                    margin: 0;
                }
                
                .form-select-hint {
                    font-size: 0.75rem;
                    color: #6b7280;
                    margin: 0;
                }
                
                :global(.dark) .form-select-hint {
                    color: #9ca3af;
                }
            `}</style>
        </div>
    );
}
