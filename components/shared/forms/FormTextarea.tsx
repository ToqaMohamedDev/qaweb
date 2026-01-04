/**
 * ╔══════════════════════════════════════════════════════════════════════════╗
 * ║                    FORM TEXTAREA - حقل نص متعدد الأسطر                   ║
 * ╚══════════════════════════════════════════════════════════════════════════╝
 */

'use client';

import React from 'react';

// ═══════════════════════════════════════════════════════════════════════════
// 1. TYPES
// ═══════════════════════════════════════════════════════════════════════════

export interface FormTextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
    label?: string;
    error?: string;
    hint?: string;
    required?: boolean;
    showCount?: boolean;
    maxLength?: number;
    containerClassName?: string;
}

// ═══════════════════════════════════════════════════════════════════════════
// 2. COMPONENT
// ═══════════════════════════════════════════════════════════════════════════

export function FormTextarea({
    label,
    error,
    hint,
    required,
    showCount,
    maxLength,
    containerClassName = '',
    className = '',
    id,
    value,
    ...props
}: FormTextareaProps) {
    const textareaId = id || `textarea-${label?.replace(/\s+/g, '-').toLowerCase() || 'field'}`;
    const currentLength = typeof value === 'string' ? value.length : 0;

    return (
        <div className={`form-textarea-container ${containerClassName}`}>
            <div className="form-textarea-header">
                {label && (
                    <label
                        htmlFor={textareaId}
                        className="form-textarea-label"
                    >
                        {label}
                        {required && <span className="form-textarea-required">*</span>}
                    </label>
                )}

                {showCount && maxLength && (
                    <span className={`form-textarea-count ${currentLength > maxLength ? 'form-textarea-count-exceeded' : ''}`}>
                        {currentLength} / {maxLength}
                    </span>
                )}
            </div>

            <textarea
                id={textareaId}
                className={`
                    form-textarea
                    ${error ? 'form-textarea-error' : ''}
                    ${className}
                `}
                value={value}
                maxLength={maxLength}
                aria-invalid={!!error}
                aria-describedby={error ? `${textareaId}-error` : hint ? `${textareaId}-hint` : undefined}
                {...props}
            />

            {error && (
                <p id={`${textareaId}-error`} className="form-textarea-error-message" role="alert">
                    {error}
                </p>
            )}

            {hint && !error && (
                <p id={`${textareaId}-hint`} className="form-textarea-hint">
                    {hint}
                </p>
            )}

            <style jsx>{`
                .form-textarea-container {
                    display: flex;
                    flex-direction: column;
                    gap: 0.375rem;
                }
                
                .form-textarea-header {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                }
                
                .form-textarea-label {
                    font-size: 0.875rem;
                    font-weight: 500;
                    color: var(--text-primary, #374151);
                }
                
                :global(.dark) .form-textarea-label {
                    color: #e5e7eb;
                }
                
                .form-textarea-required {
                    color: #ef4444;
                    margin-right: 0.25rem;
                }
                
                .form-textarea-count {
                    font-size: 0.75rem;
                    color: #6b7280;
                }
                
                .form-textarea-count-exceeded {
                    color: #ef4444;
                }
                
                .form-textarea {
                    width: 100%;
                    min-height: 100px;
                    padding: 0.625rem 0.875rem;
                    font-size: 0.875rem;
                    line-height: 1.5;
                    border: 1px solid #d1d5db;
                    border-radius: 0.5rem;
                    background-color: white;
                    color: #1f2937;
                    resize: vertical;
                    transition: all 0.15s ease-in-out;
                    outline: none;
                    font-family: inherit;
                }
                
                :global(.dark) .form-textarea {
                    background-color: #1f2937;
                    border-color: #374151;
                    color: #f9fafb;
                }
                
                .form-textarea:focus {
                    border-color: #3b82f6;
                    box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
                }
                
                :global(.dark) .form-textarea:focus {
                    border-color: #60a5fa;
                    box-shadow: 0 0 0 3px rgba(96, 165, 250, 0.1);
                }
                
                .form-textarea:disabled {
                    background-color: #f3f4f6;
                    cursor: not-allowed;
                    opacity: 0.6;
                }
                
                :global(.dark) .form-textarea:disabled {
                    background-color: #111827;
                }
                
                .form-textarea-error {
                    border-color: #ef4444 !important;
                }
                
                .form-textarea-error-message {
                    font-size: 0.75rem;
                    color: #ef4444;
                    margin: 0;
                }
                
                .form-textarea-hint {
                    font-size: 0.75rem;
                    color: #6b7280;
                    margin: 0;
                }
                
                :global(.dark) .form-textarea-hint {
                    color: #9ca3af;
                }
            `}</style>
        </div>
    );
}
