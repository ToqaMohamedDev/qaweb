'use client';

// =============================================
// useAsync Hook - إدارة حالة الـ async operations
// =============================================

import { useState, useCallback, useRef, useEffect } from 'react';
import { logger } from '@/lib/utils/logger';

export interface AsyncState<T> {
    data: T | null;
    error: Error | null;
    isLoading: boolean;
    isSuccess: boolean;
    isError: boolean;
}

interface UseAsyncOptions {
    immediate?: boolean;
    onSuccess?: (data: unknown) => void;
    onError?: (error: Error) => void;
}

interface UseAsyncReturn<T, Args extends unknown[]> extends AsyncState<T> {
    execute: (...args: Args) => Promise<T | null>;
    reset: () => void;
    setData: (data: T | null) => void;
}

const initialState: AsyncState<null> = {
    data: null,
    error: null,
    isLoading: false,
    isSuccess: false,
    isError: false,
};

/**
 * useAsync - Hook for managing async operations with loading, error, and success states
 * 
 * @example
 * const { data, isLoading, execute } = useAsync(fetchUsers);
 * 
 * useEffect(() => {
 *   execute();
 * }, [execute]);
 */
export function useAsync<T, Args extends unknown[] = []>(
    asyncFunction: (...args: Args) => Promise<T>,
    options: UseAsyncOptions = {}
): UseAsyncReturn<T, Args> {
    const { immediate = false, onSuccess, onError } = options;

    const [state, setState] = useState<AsyncState<T>>({
        ...initialState,
        data: null as T | null,
    });

    const mountedRef = useRef(true);
    const lastCallIdRef = useRef(0);

    useEffect(() => {
        mountedRef.current = true;
        return () => {
            mountedRef.current = false;
        };
    }, []);

    const execute = useCallback(
        async (...args: Args): Promise<T | null> => {
            const callId = ++lastCallIdRef.current;

            setState(prev => ({
                ...prev,
                isLoading: true,
                error: null,
            }));

            try {
                const result = await asyncFunction(...args);

                // Only update state if this is the latest call and component is mounted
                if (mountedRef.current && callId === lastCallIdRef.current) {
                    setState({
                        data: result,
                        error: null,
                        isLoading: false,
                        isSuccess: true,
                        isError: false,
                    });
                    onSuccess?.(result);
                }

                return result;
            } catch (err) {
                const error = err instanceof Error ? err : new Error(String(err));

                if (mountedRef.current && callId === lastCallIdRef.current) {
                    setState({
                        data: null,
                        error,
                        isLoading: false,
                        isSuccess: false,
                        isError: true,
                    });
                    onError?.(error);
                }

                return null;
            }
        },
        [asyncFunction, onSuccess, onError]
    );

    const reset = useCallback(() => {
        setState({
            ...initialState,
            data: null as T | null,
        });
    }, []);

    const setData = useCallback((data: T | null) => {
        setState(prev => ({
            ...prev,
            data,
        }));
    }, []);

    // Execute immediately if option is set
    useEffect(() => {
        if (immediate) {
            execute(...([] as unknown as Args));
        }
    }, [immediate, execute]);

    return {
        ...state,
        execute,
        reset,
        setData,
    };
}

/**
 * useDebounce - Debounce a value
 */
export function useDebounce<T>(value: T, delay: number): T {
    const [debouncedValue, setDebouncedValue] = useState(value);

    useEffect(() => {
        const timer = setTimeout(() => setDebouncedValue(value), delay);
        return () => clearTimeout(timer);
    }, [value, delay]);

    return debouncedValue;
}

/**
 * useThrottle - Throttle a value
 */
export function useThrottle<T>(value: T, limit: number): T {
    const [throttledValue, setThrottledValue] = useState(value);
    const lastRan = useRef(Date.now());

    useEffect(() => {
        const handler = setTimeout(() => {
            if (Date.now() - lastRan.current >= limit) {
                setThrottledValue(value);
                lastRan.current = Date.now();
            }
        }, limit - (Date.now() - lastRan.current));

        return () => clearTimeout(handler);
    }, [value, limit]);

    return throttledValue;
}

/**
 * usePrevious - Track the previous value
 */
export function usePrevious<T>(value: T): T | undefined {
    const ref = useRef<T | undefined>(undefined);

    useEffect(() => {
        ref.current = value;
    }, [value]);

    return ref.current;
}

/**
 * useLocalStorage - Sync state with localStorage
 */
export function useLocalStorage<T>(
    key: string,
    initialValue: T
): [T, (value: T | ((prev: T) => T)) => void] {
    const [storedValue, setStoredValue] = useState<T>(() => {
        if (typeof window === 'undefined') {
            return initialValue;
        }
        try {
            const item = window.localStorage.getItem(key);
            return item ? JSON.parse(item) : initialValue;
        } catch {
            return initialValue;
        }
    });

    const setValue = useCallback(
        (value: T | ((prev: T) => T)) => {
            try {
                const valueToStore = value instanceof Function ? value(storedValue) : value;
                setStoredValue(valueToStore);
                if (typeof window !== 'undefined') {
                    window.localStorage.setItem(key, JSON.stringify(valueToStore));
                }
            } catch (error) {
                logger.error('Error saving to localStorage', { context: 'useLocalStorage', data: error });
            }
        },
        [key, storedValue]
    );

    return [storedValue, setValue];
}

/**
 * useMediaQuery - Detect media query matches
 */
export function useMediaQuery(query: string): boolean {
    const [matches, setMatches] = useState(false);

    useEffect(() => {
        if (typeof window === 'undefined') return;

        const mediaQuery = window.matchMedia(query);
        setMatches(mediaQuery.matches);

        const handler = (event: MediaQueryListEvent) => setMatches(event.matches);
        mediaQuery.addEventListener('change', handler);

        return () => mediaQuery.removeEventListener('change', handler);
    }, [query]);

    return matches;
}

/**
 * useIsMobile - Check if screen is mobile size
 */
export function useIsMobile(): boolean {
    return useMediaQuery('(max-width: 768px)');
}

/**
 * useIsDesktop - Check if screen is desktop size
 */
export function useIsDesktop(): boolean {
    return useMediaQuery('(min-width: 1024px)');
}

export default useAsync;
