/**
 * ╔══════════════════════════════════════════════════════════════════════════╗
 * ║                     PAGE CONTAINER - حاوية الصفحة                        ║
 * ╚══════════════════════════════════════════════════════════════════════════╝
 */

'use client';

import React from 'react';

// ═══════════════════════════════════════════════════════════════════════════
// 1. TYPES
// ═══════════════════════════════════════════════════════════════════════════

export interface PageContainerProps {
    children: React.ReactNode;
    maxWidth?: 'sm' | 'md' | 'lg' | 'xl' | '2xl' | 'full';
    padding?: 'none' | 'sm' | 'md' | 'lg';
    className?: string;
}

// ═══════════════════════════════════════════════════════════════════════════
// 2. COMPONENT
// ═══════════════════════════════════════════════════════════════════════════

export function PageContainer({
    children,
    maxWidth = 'xl',
    padding = 'md',
    className = '',
}: PageContainerProps) {
    const maxWidthClasses = {
        sm: 'max-w-sm',
        md: 'max-w-md',
        lg: 'max-w-lg',
        xl: 'max-w-xl',
        '2xl': 'max-w-2xl',
        full: 'max-w-full',
    };

    const paddingClasses = {
        none: 'padding-none',
        sm: 'padding-sm',
        md: 'padding-md',
        lg: 'padding-lg',
    };

    return (
        <div className={`page-container ${maxWidthClasses[maxWidth]} ${paddingClasses[padding]} ${className}`}>
            {children}

            <style jsx>{`
                .page-container {
                    width: 100%;
                    margin: 0 auto;
                }
                
                /* Max Width */
                .max-w-sm { max-width: 640px; }
                .max-w-md { max-width: 768px; }
                .max-w-lg { max-width: 1024px; }
                .max-w-xl { max-width: 1280px; }
                .max-w-2xl { max-width: 1536px; }
                .max-w-full { max-width: 100%; }
                
                /* Padding */
                .padding-none { padding: 0; }
                .padding-sm { padding: 1rem; }
                .padding-md { padding: 1.5rem; }
                .padding-lg { padding: 2rem; }
                
                @media (max-width: 640px) {
                    .padding-sm { padding: 0.75rem; }
                    .padding-md { padding: 1rem; }
                    .padding-lg { padding: 1.5rem; }
                }
            `}</style>
        </div>
    );
}
