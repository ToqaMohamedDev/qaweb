'use client';

import { useEffect, useRef, type ReactNode } from 'react';
import { useAuthStore } from '@/lib/stores/useAuthStore';
import { createClient } from '@/lib/supabase'; // Client-side client
import type { UserProfileDBRow } from '@/lib/types';
import { mapDbRowToProfile } from '@/lib/types/user';
import { trackDevice } from '@/lib/actions';
import { detectDeviceInfo } from '@/lib/services';

interface AuthProviderProps {
    children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
    const { setUser, setLoading } = useAuthStore();
    const initRef = useRef(false);

    useEffect(() => {
        if (initRef.current) return;
        initRef.current = true;

        const initAuth = async () => {
            try {
                // 1. Try fetching session from our custom API (Works with HttpOnly cookies)
                console.log('[AuthProvider] Fetching session from /api/auth/session...');
                const res = await fetch('/api/auth/session', { cache: 'no-store' });

                if (res.ok) {
                    const data = await res.json();

                    if (data.user && data.profile) {
                        console.log('[AuthProvider] Session found via API');
                        setUser(mapDbRowToProfile(data.profile as UserProfileDBRow));

                        // Device tracking
                        const deviceInfo = detectDeviceInfo();
                        trackDevice({ userId: data.user.id, ...deviceInfo }).catch(() => { });

                        setLoading(false);
                        return;
                    }
                }
            } catch (err) {
                console.error('[AuthProvider] API Session fetch failed:', err);
            }

            // 2. Fallback: Try standard Supabase client (Works if cookies are NOT HttpOnly)
            try {
                const supabase = createClient();
                const { data: { session } } = await supabase.auth.getSession();

                if (session?.user) {
                    const { data: profile } = await supabase
                        .from('profiles')
                        .select('*')
                        .eq('id', session.user.id)
                        .single();

                    if (profile) {
                        setUser(mapDbRowToProfile(profile as UserProfileDBRow));
                    } else {
                        setUser(null);
                    }
                } else {
                    setUser(null);
                }
            } catch (error) {
                console.error('[AuthProvider] Standard client init failed:', error);
                setUser(null);
            } finally {
                setLoading(false);
            }
        };

        initAuth();

        // Listen for client-side changes
        const supabase = createClient();
        const { data: { subscription } } = supabase.auth.onAuthStateChange(
            async (event, session) => {
                if (event === 'SIGNED_IN' && session?.user) {
                    const { data: profile } = await supabase
                        .from('profiles')
                        .select('*')
                        .eq('id', session.user.id)
                        .single();
                    if (profile) setUser(mapDbRowToProfile(profile as UserProfileDBRow));
                } else if (event === 'SIGNED_OUT') {
                    setUser(null);
                }
            }
        );

        return () => {
            subscription.unsubscribe();
        };
    }, [setUser, setLoading]);

    return <>{children}</>;
}
