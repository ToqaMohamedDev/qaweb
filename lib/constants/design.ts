// =============================================
// Design Constants - ثوابت التصميم
// =============================================

// ═══════════════════════════════════════════════════════════════════════════
// COLORS
// ═══════════════════════════════════════════════════════════════════════════

export const colors = {
    // Primary
    primary: {
        50: '#f5f3ff',
        100: '#ede9fe',
        200: '#ddd6fe',
        300: '#c4b5fd',
        400: '#a78bfa',
        500: '#8b5cf6',
        600: '#7c3aed',
        700: '#6d28d9',
        800: '#5b21b6',
        900: '#4c1d95',
    },

    // Success
    success: {
        light: '#ecfdf5',
        main: '#10b981',
        dark: '#059669',
    },

    // Error
    error: {
        light: '#fef2f2',
        main: '#ef4444',
        dark: '#dc2626',
    },

    // Warning
    warning: {
        light: '#fffbeb',
        main: '#f59e0b',
        dark: '#d97706',
    },

    // Info
    info: {
        light: '#eff6ff',
        main: '#3b82f6',
        dark: '#2563eb',
    },

    // Neutral
    gray: {
        50: '#fafafa',
        100: '#f4f4f5',
        200: '#e4e4e7',
        300: '#d4d4d8',
        400: '#a1a1aa',
        500: '#71717a',
        600: '#52525b',
        700: '#3f3f46',
        800: '#27272a',
        900: '#18181b',
    },

    // Dark mode backgrounds
    dark: {
        bg: '#13131a',
        card: '#1c1c24',
        border: '#2e2e3a',
        hover: '#252530',
    },
} as const;

// ═══════════════════════════════════════════════════════════════════════════
// GRADIENTS
// ═══════════════════════════════════════════════════════════════════════════

export const gradients = {
    primary: 'from-violet-600 to-purple-600',
    primaryHover: 'from-violet-700 to-purple-700',
    success: 'from-green-500 to-emerald-600',
    danger: 'from-red-500 to-red-600',
    warning: 'from-amber-500 to-orange-500',
    info: 'from-blue-500 to-cyan-500',
    rainbow: 'from-violet-500 via-purple-500 to-pink-500',
    gold: 'from-yellow-400 via-amber-500 to-orange-500',
} as const;

// ═══════════════════════════════════════════════════════════════════════════
// BREAKPOINTS
// ═══════════════════════════════════════════════════════════════════════════

export const breakpoints = {
    sm: 640,
    md: 768,
    lg: 1024,
    xl: 1280,
    '2xl': 1536,
} as const;

// ═══════════════════════════════════════════════════════════════════════════
// SPACING
// ═══════════════════════════════════════════════════════════════════════════

export const spacing = {
    xs: '0.25rem',
    sm: '0.5rem',
    md: '1rem',
    lg: '1.5rem',
    xl: '2rem',
    '2xl': '3rem',
    '3xl': '4rem',
} as const;

// ═══════════════════════════════════════════════════════════════════════════
// BORDER RADIUS
// ═══════════════════════════════════════════════════════════════════════════

export const borderRadius = {
    sm: '0.375rem',
    md: '0.5rem',
    lg: '0.75rem',
    xl: '1rem',
    '2xl': '1.5rem',
    full: '9999px',
} as const;

// ═══════════════════════════════════════════════════════════════════════════
// SHADOWS
// ═══════════════════════════════════════════════════════════════════════════

export const shadows = {
    sm: '0 1px 2px 0 rgb(0 0 0 / 0.05)',
    md: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
    lg: '0 10px 15px -3px rgb(0 0 0 / 0.1)',
    xl: '0 20px 25px -5px rgb(0 0 0 / 0.1)',
    glow: {
        primary: '0 0 20px rgba(139, 92, 246, 0.3)',
        success: '0 0 20px rgba(16, 185, 129, 0.3)',
        error: '0 0 20px rgba(239, 68, 68, 0.3)',
    },
} as const;

// ═══════════════════════════════════════════════════════════════════════════
// ANIMATIONS
// ═══════════════════════════════════════════════════════════════════════════

export const transitions = {
    fast: '150ms ease',
    normal: '200ms ease',
    slow: '300ms ease',
    spring: { type: 'spring', stiffness: 300, damping: 20 },
} as const;

export const designAnimations = {
    fadeIn: {
        initial: { opacity: 0 },
        animate: { opacity: 1 },
        exit: { opacity: 0 },
    },
    slideUp: {
        initial: { opacity: 0, y: 20 },
        animate: { opacity: 1, y: 0 },
        exit: { opacity: 0, y: -20 },
    },
    slideDown: {
        initial: { opacity: 0, y: -20 },
        animate: { opacity: 1, y: 0 },
        exit: { opacity: 0, y: 20 },
    },
    scaleIn: {
        initial: { opacity: 0, scale: 0.9 },
        animate: { opacity: 1, scale: 1 },
        exit: { opacity: 0, scale: 0.9 },
    },
    slideRight: {
        initial: { opacity: 0, x: -20 },
        animate: { opacity: 1, x: 0 },
        exit: { opacity: 0, x: 20 },
    },
} as const;

// ═══════════════════════════════════════════════════════════════════════════
// Z-INDEX
// ═══════════════════════════════════════════════════════════════════════════

export const zIndex = {
    dropdown: 50,
    sticky: 100,
    fixed: 200,
    modal: 300,
    popover: 400,
    tooltip: 500,
    toast: 600,
} as const;

// ═══════════════════════════════════════════════════════════════════════════
// COMMON CLASS PATTERNS
// ═══════════════════════════════════════════════════════════════════════════

export const classNames = {
    // Cards
    card: 'bg-white dark:bg-[#1c1c24] rounded-2xl border border-gray-200 dark:border-[#2e2e3a] shadow-lg',
    cardGlass: 'bg-white/80 dark:bg-[#1c1c24]/80 backdrop-blur-xl rounded-2xl border border-gray-200/60 dark:border-[#2e2e3a]/60',

    // Inputs
    input: 'w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-[#2e2e3a] bg-white dark:bg-[#1c1c24] focus:outline-none focus:ring-2 focus:ring-violet-500 transition-all',
    inputGlass: 'w-full px-4 py-2.5 rounded-xl border border-gray-200/60 dark:border-[#2e2e3a]/60 bg-white/80 dark:bg-[#1c1c24]/80 backdrop-blur-sm focus:outline-none focus:ring-2 focus:ring-violet-500 transition-all',

    // Buttons
    btnBase: 'inline-flex items-center justify-center font-medium transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-60 disabled:cursor-not-allowed',
    btnPrimary: 'bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-700 hover:to-purple-700 text-white shadow-lg',
    btnSecondary: 'bg-gray-100 dark:bg-[#252530] hover:bg-gray-200 dark:hover:bg-[#353545] text-gray-700 dark:text-gray-300 border border-gray-200 dark:border-[#2e2e3a]',
    btnGhost: 'bg-transparent hover:bg-gray-100 dark:hover:bg-[#252530] text-gray-700 dark:text-gray-300',
    btnDanger: 'bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white',

    // Text
    textMuted: 'text-gray-500 dark:text-gray-400',
    textPrimary: 'text-gray-900 dark:text-gray-100',
    textSecondary: 'text-gray-600 dark:text-gray-300',

    // Layout
    container: 'max-w-7xl mx-auto px-4 sm:px-6 lg:px-8',
    flex: {
        center: 'flex items-center justify-center',
        between: 'flex items-center justify-between',
        start: 'flex items-center justify-start',
        end: 'flex items-center justify-end',
        col: 'flex flex-col',
        colCenter: 'flex flex-col items-center justify-center',
    },

    // Grid
    grid: {
        cols2: 'grid grid-cols-1 md:grid-cols-2 gap-4',
        cols3: 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4',
        cols4: 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4',
    },
} as const;

// ═══════════════════════════════════════════════════════════════════════════
// HELPER FUNCTIONS
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Combine class names conditionally
 */
export function clsx(...classes: (string | boolean | undefined | null)[]): string {
    return classes.filter(Boolean).join(' ');
}

/**
 * Get responsive value based on breakpoint
 */
export function getResponsiveValue<T>(values: { default: T; sm?: T; md?: T; lg?: T; xl?: T }, width: number): T {
    if (width >= breakpoints.xl && values.xl !== undefined) return values.xl;
    if (width >= breakpoints.lg && values.lg !== undefined) return values.lg;
    if (width >= breakpoints.md && values.md !== undefined) return values.md;
    if (width >= breakpoints.sm && values.sm !== undefined) return values.sm;
    return values.default;
}
