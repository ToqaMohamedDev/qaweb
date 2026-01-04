/**
 * ╔══════════════════════════════════════════════════════════════════════════╗
 * ║                        PAGE HEADER - رأس الصفحة                          ║
 * ╚══════════════════════════════════════════════════════════════════════════╝
 */

'use client';

import React from 'react';
import Link from 'next/link';

// ═══════════════════════════════════════════════════════════════════════════
// 1. TYPES
// ═══════════════════════════════════════════════════════════════════════════

export interface Breadcrumb {
    label: string;
    href?: string;
}

export interface PageHeaderProps {
    title: string;
    description?: string;
    breadcrumbs?: Breadcrumb[];
    actions?: React.ReactNode;
    backHref?: string;
    icon?: React.ReactNode;
    className?: string;
}

// ═══════════════════════════════════════════════════════════════════════════
// 2. COMPONENT
// ═══════════════════════════════════════════════════════════════════════════

export function PageHeader({
    title,
    description,
    breadcrumbs,
    actions,
    backHref,
    icon,
    className = '',
}: PageHeaderProps) {
    return (
        <header className={`page-header ${className}`}>
            {breadcrumbs && breadcrumbs.length > 0 && (
                <nav className="page-header-breadcrumbs" aria-label="التنقل">
                    <ol>
                        {breadcrumbs.map((crumb, index) => (
                            <li key={index}>
                                {crumb.href ? (
                                    <Link href={crumb.href} className="breadcrumb-link">
                                        {crumb.label}
                                    </Link>
                                ) : (
                                    <span className="breadcrumb-current">{crumb.label}</span>
                                )}
                                {index < breadcrumbs.length - 1 && (
                                    <span className="breadcrumb-separator">/</span>
                                )}
                            </li>
                        ))}
                    </ol>
                </nav>
            )}

            <div className="page-header-content">
                <div className="page-header-main">
                    {backHref && (
                        <Link href={backHref} className="page-header-back">
                            <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor">
                                <path d="M12.5 5L7.5 10L12.5 15" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                            </svg>
                        </Link>
                    )}

                    {icon && <span className="page-header-icon">{icon}</span>}

                    <div className="page-header-text">
                        <h1 className="page-header-title">{title}</h1>
                        {description && (
                            <p className="page-header-description">{description}</p>
                        )}
                    </div>
                </div>

                {actions && (
                    <div className="page-header-actions">
                        {actions}
                    </div>
                )}
            </div>

            <style jsx>{`
                .page-header {
                    display: flex;
                    flex-direction: column;
                    gap: 0.75rem;
                    padding-bottom: 1.5rem;
                    margin-bottom: 1.5rem;
                    border-bottom: 1px solid #e5e7eb;
                }
                
                :global(.dark) .page-header {
                    border-color: #374151;
                }
                
                .page-header-breadcrumbs ol {
                    display: flex;
                    align-items: center;
                    gap: 0.5rem;
                    list-style: none;
                    padding: 0;
                    margin: 0;
                    font-size: 0.875rem;
                }
                
                .page-header-breadcrumbs li {
                    display: flex;
                    align-items: center;
                    gap: 0.5rem;
                }
                
                .breadcrumb-link {
                    color: #3b82f6;
                    text-decoration: none;
                    transition: color 0.15s;
                }
                
                .breadcrumb-link:hover {
                    color: #2563eb;
                    text-decoration: underline;
                }
                
                .breadcrumb-current {
                    color: #6b7280;
                }
                
                :global(.dark) .breadcrumb-current {
                    color: #9ca3af;
                }
                
                .breadcrumb-separator {
                    color: #d1d5db;
                }
                
                :global(.dark) .breadcrumb-separator {
                    color: #4b5563;
                }
                
                .page-header-content {
                    display: flex;
                    justify-content: space-between;
                    align-items: flex-start;
                    gap: 1rem;
                    flex-wrap: wrap;
                }
                
                .page-header-main {
                    display: flex;
                    align-items: center;
                    gap: 0.75rem;
                }
                
                .page-header-back {
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    width: 2.5rem;
                    height: 2.5rem;
                    border-radius: 0.5rem;
                    background-color: #f3f4f6;
                    color: #6b7280;
                    transition: all 0.15s;
                }
                
                :global(.dark) .page-header-back {
                    background-color: #374151;
                    color: #9ca3af;
                }
                
                .page-header-back:hover {
                    background-color: #e5e7eb;
                    color: #374151;
                }
                
                :global(.dark) .page-header-back:hover {
                    background-color: #4b5563;
                    color: #f3f4f6;
                }
                
                .page-header-icon {
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    width: 3rem;
                    height: 3rem;
                    border-radius: 0.75rem;
                    background: linear-gradient(135deg, #3b82f6, #1d4ed8);
                    color: white;
                }
                
                .page-header-text {
                    display: flex;
                    flex-direction: column;
                    gap: 0.25rem;
                }
                
                .page-header-title {
                    font-size: 1.5rem;
                    font-weight: 700;
                    color: #111827;
                    margin: 0;
                    line-height: 1.2;
                }
                
                :global(.dark) .page-header-title {
                    color: #f9fafb;
                }
                
                .page-header-description {
                    font-size: 0.875rem;
                    color: #6b7280;
                    margin: 0;
                }
                
                :global(.dark) .page-header-description {
                    color: #9ca3af;
                }
                
                .page-header-actions {
                    display: flex;
                    align-items: center;
                    gap: 0.75rem;
                    flex-wrap: wrap;
                }
                
                @media (max-width: 640px) {
                    .page-header-content {
                        flex-direction: column;
                        align-items: stretch;
                    }
                    
                    .page-header-actions {
                        width: 100%;
                        justify-content: flex-end;
                    }
                }
            `}</style>
        </header>
    );
}
