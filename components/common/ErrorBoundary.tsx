'use client';

// =============================================
// Error Boundary - للتعامل مع الأخطاء في React
// =============================================

import React, { Component, ReactNode } from 'react';
import { AlertTriangle, RefreshCw, Home } from 'lucide-react';
import Link from 'next/link';
import { logger } from '@/lib/utils/logger';

interface ErrorBoundaryProps {
    children: ReactNode;
    fallback?: ReactNode;
    onError?: (error: Error, errorInfo: React.ErrorInfo) => void;
    showDetails?: boolean;
}

interface ErrorBoundaryState {
    hasError: boolean;
    error: Error | null;
    errorInfo: React.ErrorInfo | null;
}

export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
    constructor(props: ErrorBoundaryProps) {
        super(props);
        this.state = {
            hasError: false,
            error: null,
            errorInfo: null,
        };
    }

    static getDerivedStateFromError(error: Error): Partial<ErrorBoundaryState> {
        return { hasError: true, error };
    }

    componentDidCatch(error: Error, errorInfo: React.ErrorInfo): void {
        this.setState({ errorInfo });

        // Log error using logger service
        logger.error('Error boundary caught an error', {
            context: 'ErrorBoundary',
            data: {
                message: error.message,
                stack: error.stack,
                componentStack: errorInfo.componentStack,
            },
        });

        // Call custom error handler if provided
        this.props.onError?.(error, errorInfo);

        // TODO: Send to error tracking service (Sentry, etc.)
    }

    handleRetry = (): void => {
        this.setState({
            hasError: false,
            error: null,
            errorInfo: null,
        });
    };

    render(): ReactNode {
        if (this.state.hasError) {
            if (this.props.fallback) {
                return this.props.fallback;
            }

            return (
                <div className="min-h-[400px] flex items-center justify-center p-6">
                    <div className="glass-card rounded-2xl p-8 max-w-lg w-full text-center">
                        {/* Error Icon */}
                        <div className="w-16 h-16 mx-auto mb-6 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center">
                            <AlertTriangle className="w-8 h-8 text-red-500" />
                        </div>

                        {/* Error Title */}
                        <h2 className="text-2xl font-bold text-foreground mb-2">
                            عذراً، حدث خطأ غير متوقع
                        </h2>

                        {/* Error Description */}
                        <p className="text-muted-foreground mb-6">
                            نعتذر عن هذا الخطأ. يمكنك تجربة إعادة تحميل الصفحة أو العودة للصفحة الرئيسية.
                        </p>

                        {/* Error Details (Development Only) */}
                        {this.props.showDetails && this.state.error && (
                            <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 rounded-lg text-left overflow-auto max-h-40">
                                <p className="text-sm font-mono text-red-600 dark:text-red-400">
                                    {this.state.error.message}
                                </p>
                                {this.state.errorInfo && (
                                    <pre className="text-xs mt-2 text-red-500 dark:text-red-300 whitespace-pre-wrap">
                                        {this.state.errorInfo.componentStack}
                                    </pre>
                                )}
                            </div>
                        )}

                        {/* Action Buttons */}
                        <div className="flex flex-col sm:flex-row gap-3 justify-center">
                            <button
                                onClick={this.handleRetry}
                                className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-primary text-white rounded-full font-medium hover:bg-primary-dark transition-colors"
                            >
                                <RefreshCw className="w-4 h-4" />
                                إعادة المحاولة
                            </button>
                            <Link
                                href="/"
                                className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-muted text-foreground rounded-full font-medium hover:bg-muted/80 transition-colors"
                            >
                                <Home className="w-4 h-4" />
                                الصفحة الرئيسية
                            </Link>
                        </div>
                    </div>
                </div>
            );
        }

        return this.props.children;
    }
}

// =============================================
// Hook version for functional components
// =============================================

interface UseErrorBoundaryReturn {
    error: Error | null;
    resetError: () => void;
    ErrorFallback: React.FC<{ error: Error }>;
}

export function useErrorHandler(): (error: Error) => void {
    const [, setError] = React.useState<Error | null>(null);

    return React.useCallback((error: Error) => {
        setError(() => {
            throw error;
        });
    }, []);
}

// =============================================
// Simple Error Fallback Component
// =============================================

interface ErrorFallbackProps {
    error?: Error;
    resetError?: () => void;
    title?: string;
    description?: string;
}

export function ErrorFallback({
    error,
    resetError,
    title = 'حدث خطأ',
    description = 'نعتذر، حدث خطأ غير متوقع.',
}: ErrorFallbackProps): React.ReactElement {
    return (
        <div className="flex flex-col items-center justify-center p-6 text-center">
            <AlertTriangle className="w-12 h-12 text-red-500 mb-4" />
            <h3 className="text-lg font-semibold text-foreground mb-2">{title}</h3>
            <p className="text-muted-foreground mb-4">{description}</p>
            {error && process.env.NODE_ENV === 'development' && (
                <p className="text-sm text-red-500 mb-4 font-mono">{error.message}</p>
            )}
            {resetError && (
                <button
                    onClick={resetError}
                    className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-dark transition-colors"
                >
                    <RefreshCw className="w-4 h-4" />
                    إعادة المحاولة
                </button>
            )}
        </div>
    );
}

// =============================================
// Page Error Boundary Wrapper
// =============================================

interface PageErrorBoundaryProps {
    children: ReactNode;
}

export function PageErrorBoundary({ children }: PageErrorBoundaryProps): React.ReactElement {
    return (
        <ErrorBoundary showDetails={process.env.NODE_ENV === 'development'}>
            {children}
        </ErrorBoundary>
    );
}

export default ErrorBoundary;
