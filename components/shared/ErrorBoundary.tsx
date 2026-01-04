'use client';

// =============================================
// Error Boundary Component
// =============================================

import React, { Component, ErrorInfo, ReactNode } from 'react';

// ═══════════════════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════════════════

interface ErrorBoundaryProps {
    children: ReactNode;
    fallback?: ReactNode;
    onError?: (error: Error, errorInfo: ErrorInfo) => void;
}

interface ErrorBoundaryState {
    hasError: boolean;
    error: Error | null;
    errorInfo: ErrorInfo | null;
}

// ═══════════════════════════════════════════════════════════════════════════
// DEFAULT ERROR FALLBACK
// ═══════════════════════════════════════════════════════════════════════════

function DefaultErrorFallback({
    error,
    reset
}: {
    error: Error | null;
    reset: () => void;
}) {
    return (
        <div className="min-h-[400px] flex items-center justify-center p-8">
            <div className="max-w-md w-full bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8 text-center">
                {/* Error Icon */}
                <div className="w-20 h-20 mx-auto mb-6 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center">
                    <svg
                        className="w-10 h-10 text-red-600 dark:text-red-400"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                    >
                        <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                        />
                    </svg>
                </div>

                {/* Error Message */}
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-3">
                    حدث خطأ غير متوقع
                </h2>
                <p className="text-gray-600 dark:text-gray-400 mb-6">
                    نأسف، حدث خطأ أثناء عرض هذه الصفحة. يرجى المحاولة مرة أخرى.
                </p>

                {/* Error Details (Development Only) */}
                {process.env.NODE_ENV === 'development' && error && (
                    <details className="mb-6 text-left">
                        <summary className="cursor-pointer text-sm text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200">
                            تفاصيل الخطأ (للمطورين)
                        </summary>
                        <pre className="mt-2 p-3 bg-gray-100 dark:bg-gray-900 rounded-lg text-xs text-red-600 dark:text-red-400 overflow-auto max-h-40" dir="ltr">
                            {error.message}
                            {'\n'}
                            {error.stack}
                        </pre>
                    </details>
                )}

                {/* Actions */}
                <div className="flex gap-3 justify-center">
                    <button
                        onClick={reset}
                        className="px-6 py-3 bg-violet-600 hover:bg-violet-700 text-white font-medium rounded-xl transition-colors"
                    >
                        حاول مرة أخرى
                    </button>
                    <button
                        onClick={() => window.location.href = '/'}
                        className="px-6 py-3 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-200 font-medium rounded-xl transition-colors"
                    >
                        العودة للرئيسية
                    </button>
                </div>
            </div>
        </div>
    );
}

// ═══════════════════════════════════════════════════════════════════════════
// ERROR BOUNDARY CLASS
// ═══════════════════════════════════════════════════════════════════════════

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

    componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
        this.setState({ errorInfo });

        // Log error to console in development
        if (process.env.NODE_ENV === 'development') {
            console.error('ErrorBoundary caught an error:', error, errorInfo);
        }

        // Call optional error handler
        this.props.onError?.(error, errorInfo);

        // TODO: Log to error reporting service (Sentry, etc.)
    }

    reset = (): void => {
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
                <DefaultErrorFallback
                    error={this.state.error}
                    reset={this.reset}
                />
            );
        }

        return this.props.children;
    }
}

// ═══════════════════════════════════════════════════════════════════════════
// ERROR BOUNDARY WRAPPER (for easier use with hooks)
// ═══════════════════════════════════════════════════════════════════════════

interface ErrorBoundaryWrapperProps {
    children: ReactNode;
    fallbackComponent?: React.ComponentType<{ error: Error | null; reset: () => void }>;
}

export function withErrorBoundary<P extends object>(
    WrappedComponent: React.ComponentType<P>,
    fallbackComponent?: React.ComponentType<{ error: Error | null; reset: () => void }>
) {
    return function WithErrorBoundaryWrapper(props: P) {
        return (
            <ErrorBoundary fallback={fallbackComponent ? React.createElement(fallbackComponent, { error: null, reset: () => { } }) : undefined}>
                <WrappedComponent {...props} />
            </ErrorBoundary>
        );
    };
}

export default ErrorBoundary;
