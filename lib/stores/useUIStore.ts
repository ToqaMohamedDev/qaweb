// =============================================
// UI Store - إدارة حالة الواجهة
// =============================================

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

// ═══════════════════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════════════════

type Theme = 'light' | 'dark' | 'system';
type Language = 'ar' | 'en';

interface Toast {
    id: string;
    type: 'success' | 'error' | 'warning' | 'info';
    message: string;
    duration?: number;
}

interface Modal {
    id: string;
    type: string;
    data?: unknown;
}

interface UIState {
    // ─── Theme ───
    theme: Theme;
    setTheme: (theme: Theme) => void;

    // ─── Language ───
    language: Language;
    setLanguage: (language: Language) => void;

    // ─── Sidebar ───
    sidebarOpen: boolean;
    sidebarCollapsed: boolean;
    toggleSidebar: () => void;
    setSidebarOpen: (open: boolean) => void;
    setSidebarCollapsed: (collapsed: boolean) => void;

    // ─── Toast Notifications ───
    toasts: Toast[];
    addToast: (toast: Omit<Toast, 'id'>) => void;
    removeToast: (id: string) => void;
    clearToasts: () => void;

    // ─── Modals ───
    modals: Modal[];
    openModal: (type: string, data?: unknown) => void;
    closeModal: (id?: string) => void;
    closeAllModals: () => void;

    // ─── Loading States ───
    globalLoading: boolean;
    setGlobalLoading: (loading: boolean) => void;

    // ─── Mobile ───
    isMobile: boolean;
    setIsMobile: (isMobile: boolean) => void;
}

// ═══════════════════════════════════════════════════════════════════════════
// HELPERS
// ═══════════════════════════════════════════════════════════════════════════

const generateId = () => Math.random().toString(36).substring(2, 9);

// ═══════════════════════════════════════════════════════════════════════════
// STORE
// ═══════════════════════════════════════════════════════════════════════════

export const useUIStore = create<UIState>()(
    persist(
        (set, get) => ({
            // ─── Theme ───
            theme: 'system',
            setTheme: (theme) => set({ theme }),

            // ─── Language ───
            language: 'ar',
            setLanguage: (language) => set({ language }),

            // ─── Sidebar ───
            sidebarOpen: true,
            sidebarCollapsed: false,
            toggleSidebar: () => set((state) => ({ sidebarOpen: !state.sidebarOpen })),
            setSidebarOpen: (sidebarOpen) => set({ sidebarOpen }),
            setSidebarCollapsed: (sidebarCollapsed) => set({ sidebarCollapsed }),

            // ─── Toast Notifications ───
            toasts: [],
            addToast: (toast) => {
                const id = generateId();
                const newToast = { ...toast, id };

                set((state) => ({ toasts: [...state.toasts, newToast] }));

                // Auto remove after duration
                const duration = toast.duration ?? 5000;
                if (duration > 0) {
                    setTimeout(() => {
                        get().removeToast(id);
                    }, duration);
                }
            },
            removeToast: (id) => set((state) => ({
                toasts: state.toasts.filter((t) => t.id !== id)
            })),
            clearToasts: () => set({ toasts: [] }),

            // ─── Modals ───
            modals: [],
            openModal: (type, data) => {
                const id = generateId();
                set((state) => ({
                    modals: [...state.modals, { id, type, data }]
                }));
            },
            closeModal: (id) => {
                if (id) {
                    set((state) => ({
                        modals: state.modals.filter((m) => m.id !== id)
                    }));
                } else {
                    // Close last modal
                    set((state) => ({
                        modals: state.modals.slice(0, -1)
                    }));
                }
            },
            closeAllModals: () => set({ modals: [] }),

            // ─── Loading States ───
            globalLoading: false,
            setGlobalLoading: (globalLoading) => set({ globalLoading }),

            // ─── Mobile ───
            isMobile: false,
            setIsMobile: (isMobile) => set({ isMobile }),
        }),
        {
            name: 'ui-storage',
            storage: createJSONStorage(() => localStorage),
            partialize: (state) => ({
                theme: state.theme,
                language: state.language,
                sidebarCollapsed: state.sidebarCollapsed,
            }),
        }
    )
);

// ═══════════════════════════════════════════════════════════════════════════
// TOAST HELPERS
// ═══════════════════════════════════════════════════════════════════════════

export const toast = {
    success: (message: string, duration?: number) =>
        useUIStore.getState().addToast({ type: 'success', message, duration }),

    error: (message: string, duration?: number) =>
        useUIStore.getState().addToast({ type: 'error', message, duration }),

    warning: (message: string, duration?: number) =>
        useUIStore.getState().addToast({ type: 'warning', message, duration }),

    info: (message: string, duration?: number) =>
        useUIStore.getState().addToast({ type: 'info', message, duration }),
};

// ═══════════════════════════════════════════════════════════════════════════
// SELECTORS
// ═══════════════════════════════════════════════════════════════════════════

export const selectTheme = (state: UIState) => state.theme;
export const selectLanguage = (state: UIState) => state.language;
export const selectIsRTL = (state: UIState) => state.language === 'ar';
