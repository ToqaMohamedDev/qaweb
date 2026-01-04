/**
 * ╔══════════════════════════════════════════════════════════════════════════╗
 * ║                         FORM INPUT - حقل إدخال نموذج                     ║
 * ╚══════════════════════════════════════════════════════════════════════════╝
 */

'use client';

import React from 'react';

// ═══════════════════════════════════════════════════════════════════════════
// 1. TYPES
// ═══════════════════════════════════════════════════════════════════════════

export interface FormInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
    label?: string;
    error?: string;
    hint?: string;
    required?: boolean;
    leftIcon?: React.ReactNode;
    rightIcon?: React.ReactNode;
    containerClassName?: string;
}

// ═══════════════════════════════════════════════════════════════════════════
// 2. COMPONENT
// ═══════════════════════════════════════════════════════════════════════════

export function FormInput({
    label,
    error,
    hint,
    required,
    leftIcon,
    rightIcon,
    containerClassName = '',
    className = '',
    id,
    ...props
}: FormInputProps) {
    const inputId = id || `input-${label?.replace(/\s+/g, '-').toLowerCase() || 'field'}`;

    return (
        <div className={`form-input-container ${containerClassName}`}>
            {label && (
                <label
                    htmlFor={inputId}
                    className="form-input-label"
                >
                    {label}
                    {required && <span className="form-input-required">*</span>}
                </label>
            )}

            <div className="form-input-wrapper">
                {leftIcon && (
                    <span className="form-input-icon form-input-icon-left">
                        {leftIcon}
                    </span>
                )}

                <input
                    id={inputId}
                    className={`
                        form-input
                        ${leftIcon ? 'form-input-with-left-icon' : ''}
                        ${rightIcon ? 'form-input-with-right-icon' : ''}
                        ${error ? 'form-input-error' : ''}
                        ${className}
                    `}
                    aria-invalid={!!error}
                    aria-describedby={error ? `${inputId}-error` : hint ? `${inputId}-hint` : undefined}
                    {...props}
                />

                {rightIcon && (
                    <span className="form-input-icon form-input-icon-right">
                        {rightIcon}
                    </span>
                )}
            </div>

            {error && (
                <p id={`${inputId}-error`} className="form-input-error-message" role="alert">
                    {error}
                </p>
            )}

            {hint && !error && (
                <p id={`${inputId}-hint`} className="form-input-hint">
                    {hint}
                </p>
            )}

            <style jsx>{`
                .form-input-container {
                    display: flex;
                    flex-direction: column;
                    gap: 0.375rem;
                }
                
                .form-input-label {
                    font-size: 0.875rem;
                    font-weight: 500;
                    color: var(--text-primary, #374151);
                }
                
                :global(.dark) .form-input-label {
                    color: #e5e7eb;
                }
                
                .form-input-required {
                    color: #ef4444;
                    margin-right: 0.25rem;
                }
                
                .form-input-wrapper {
                    position: relative;
                    display: flex;
                    align-items: center;
                }
                
                .form-input {
                    width: 100%;
                    padding: 0.625rem 0.875rem;
                    font-size: 0.875rem;
                    line-height: 1.5;
                    border: 1px solid #d1d5db;
                    border-radius: 0.5rem;
                    background-color: white;
                    color: #1f2937;
                    transition: all 0.15s ease-in-out;
                    outline: none;
                }
                
                :global(.dark) .form-input {
                    background-color: #1f2937;
                    border-color: #374151;
                    color: #f9fafb;
                }
                
                .form-input:focus {
                    border-color: #3b82f6;
                    box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
                }
                
                :global(.dark) .form-input:focus {
                    border-color: #60a5fa;
                    box-shadow: 0 0 0 3px rgba(96, 165, 250, 0.1);
                }
                
                .form-input:disabled {
                    background-color: #f3f4f6;
                    cursor: not-allowed;
                    opacity: 0.6;
                }
                
                :global(.dark) .form-input:disabled {
                    background-color: #111827;
                }
                
                .form-input-with-left-icon {
                    padding-right: 2.5rem;
                }
                
                .form-input-with-right-icon {
                    padding-left: 2.5rem;
                }
                
                .form-input-error {
                    border-color: #ef4444 !important;
                }
                
                .form-input-error:focus {
                    box-shadow: 0 0 0 3px rgba(239, 68, 68, 0.1);
                }
                
                .form-input-icon {
                    position: absolute;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    color: #9ca3af;
                    pointer-events: none;
                }
                
                .form-input-icon-left {
                    right: 0.75rem;
                }
                
                .form-input-icon-right {
                    left: 0.75rem;
                }
                
                .form-input-error-message {
                    font-size: 0.75rem;
                    color: #ef4444;
                    margin: 0;
                }
                
                .form-input-hint {
                    font-size: 0.75rem;
                    color: #6b7280;
                    margin: 0;
                }
                
                :global(.dark) .form-input-hint {
                    color: #9ca3af;
                }
            `}</style>
        </div>
    );
}
