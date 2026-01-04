/**
 * ╔══════════════════════════════════════════════════════════════════════════╗
 * ║                    FORM WRAPPER - غلاف النموذج                           ║
 * ╚══════════════════════════════════════════════════════════════════════════╝
 */

'use client';

import React from 'react';

// ═══════════════════════════════════════════════════════════════════════════
// 1. TYPES
// ═══════════════════════════════════════════════════════════════════════════

export interface FormWrapperProps {
    children: React.ReactNode;
    onSubmit?: (e: React.FormEvent<HTMLFormElement>) => void;
    title?: string;
    description?: string;
    actions?: React.ReactNode;
    isLoading?: boolean;
    className?: string;
}

// ═══════════════════════════════════════════════════════════════════════════
// 2. COMPONENT
// ═══════════════════════════════════════════════════════════════════════════

export function FormWrapper({
    children,
    onSubmit,
    title,
    description,
    actions,
    isLoading,
    className = '',
}: FormWrapperProps) {
    const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        if (!isLoading && onSubmit) {
            onSubmit(e);
        }
    };

    return (
        <form
            onSubmit={handleSubmit}
            className={`form-wrapper ${className}`}
        >
            {(title || description) && (
                <div className="form-wrapper-header">
                    {title && <h2 className="form-wrapper-title">{title}</h2>}
                    {description && <p className="form-wrapper-description">{description}</p>}
                </div>
            )}

            <div className="form-wrapper-content">
                {children}
            </div>

            {actions && (
                <div className="form-wrapper-actions">
                    {actions}
                </div>
            )}

            {isLoading && (
                <div className="form-wrapper-overlay">
                    <div className="form-wrapper-spinner"></div>
                </div>
            )}

            <style jsx>{`
                .form-wrapper {
                    position: relative;
                    display: flex;
                    flex-direction: column;
                    gap: 1.5rem;
                    background-color: white;
                    border: 1px solid #e5e7eb;
                    border-radius: 0.75rem;
                    padding: 1.5rem;
                    box-shadow: 0 1px 3px 0 rgba(0, 0, 0, 0.05);
                }
                
                :global(.dark) .form-wrapper {
                    background-color: #1f2937;
                    border-color: #374151;
                }
                
                .form-wrapper-header {
                    display: flex;
                    flex-direction: column;
                    gap: 0.5rem;
                    padding-bottom: 1rem;
                    border-bottom: 1px solid #e5e7eb;
                }
                
                :global(.dark) .form-wrapper-header {
                    border-color: #374151;
                }
                
                .form-wrapper-title {
                    font-size: 1.25rem;
                    font-weight: 600;
                    color: #111827;
                    margin: 0;
                }
                
                :global(.dark) .form-wrapper-title {
                    color: #f9fafb;
                }
                
                .form-wrapper-description {
                    font-size: 0.875rem;
                    color: #6b7280;
                    margin: 0;
                }
                
                :global(.dark) .form-wrapper-description {
                    color: #9ca3af;
                }
                
                .form-wrapper-content {
                    display: flex;
                    flex-direction: column;
                    gap: 1rem;
                }
                
                .form-wrapper-actions {
                    display: flex;
                    justify-content: flex-end;
                    gap: 0.75rem;
                    padding-top: 1rem;
                    border-top: 1px solid #e5e7eb;
                }
                
                :global(.dark) .form-wrapper-actions {
                    border-color: #374151;
                }
                
                .form-wrapper-overlay {
                    position: absolute;
                    inset: 0;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    background-color: rgba(255, 255, 255, 0.8);
                    border-radius: 0.75rem;
                    z-index: 10;
                }
                
                :global(.dark) .form-wrapper-overlay {
                    background-color: rgba(17, 24, 39, 0.8);
                }
                
                .form-wrapper-spinner {
                    width: 2rem;
                    height: 2rem;
                    border: 3px solid #e5e7eb;
                    border-top-color: #3b82f6;
                    border-radius: 50%;
                    animation: spin 0.8s linear infinite;
                }
                
                @keyframes spin {
                    to {
                        transform: rotate(360deg);
                    }
                }
            `}</style>
        </form>
    );
}
