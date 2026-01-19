'use client';

// =============================================
// Client Providers - كل الـ providers اللي محتاجة client
// =============================================

import { Suspense, type ReactNode } from 'react';
import dynamic from 'next/dynamic';
import { ThemeProvider } from '@/components/ThemeProvider';
import { QueryProvider, AuthProvider } from '@/lib/providers';
import { OneSignalProvider } from '@/components/providers/OneSignalProvider';

// Lazy load heavy components
const ChatWidget = dynamic(() => import('@/components/ChatWidget'), { ssr: false });
const VisitorTracker = dynamic(() => import('@/components/VisitorTracker').then(m => ({ default: m.VisitorTracker })), { ssr: false });
const ToastContainer = dynamic(() => import('@/components/shared').then(m => ({ default: m.ToastContainer })), { ssr: false });
const SplashScreenWrapper = dynamic(() => import('@/components/SplashScreen').then(m => ({ default: m.SplashScreenWrapper })), { ssr: false });

interface ClientProvidersProps {
    children: ReactNode;
}

export function ClientProviders({ children }: ClientProvidersProps) {
    return (
        <ThemeProvider>
            <QueryProvider>
                <SplashScreenWrapper>
                    <AuthProvider>
                        <OneSignalProvider>
                            {/* Main Content */}
                            <div id="main-content" style={{ minHeight: '100dvh', position: 'relative' }} suppressHydrationWarning>
                                <Suspense fallback={null}>
                                    {children}
                                </Suspense>
                            </div>
                            {/* Lazy loaded components */}
                            <Suspense fallback={null}>
                                <ChatWidget />
                                <VisitorTracker />
                                <ToastContainer />
                            </Suspense>
                        </OneSignalProvider>
                    </AuthProvider>
                </SplashScreenWrapper>
            </QueryProvider>
        </ThemeProvider>
    );
}
