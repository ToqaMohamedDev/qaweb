/**
 * Design Tokens for Words Page - Premium Dark Theme
 * Purple accent with high contrast for word visibility
 */

export const wordsDesignTokens = {
  // Colors
  colors: {
    // Background layers (darkest to lightest)
    bg: {
      base: '#09090b',      // zinc-950
      elevated: '#18181b',   // zinc-900
      card: '#1f1f23',       // slightly lighter
      cardHover: '#27272a',  // zinc-800
    },
    
    // Purple accent spectrum
    accent: {
      50: '#faf5ff',
      100: '#f3e8ff',
      200: '#e9d5ff',
      300: '#d8b4fe',
      400: '#c084fc',
      500: '#a855f7',  // Primary accent
      600: '#9333ea',
      700: '#7c3aed',
      800: '#6b21a8',
      900: '#581c87',
      glow: 'rgba(168, 85, 247, 0.15)',
      glowStrong: 'rgba(168, 85, 247, 0.25)',
    },
    
    // Text hierarchy
    text: {
      primary: '#fafafa',    // zinc-50
      secondary: '#a1a1aa',  // zinc-400
      muted: '#71717a',      // zinc-500
      accent: '#c084fc',     // purple-400
    },
    
    // Borders
    border: {
      subtle: 'rgba(255,255,255,0.06)',
      default: 'rgba(255,255,255,0.1)',
      hover: 'rgba(168, 85, 247, 0.5)',
      active: '#a855f7',
    },
    
    // Status colors
    status: {
      success: '#22c55e',
      warning: '#eab308',
      error: '#ef4444',
    },
    
    // Level badges
    levels: {
      A1: { bg: '#166534', text: '#86efac' },
      A2: { bg: '#15803d', text: '#bbf7d0' },
      B1: { bg: '#ca8a04', text: '#fef08a' },
      B2: { bg: '#b45309', text: '#fed7aa' },
      C1: { bg: '#dc2626', text: '#fecaca' },
      C2: { bg: '#9f1239', text: '#fecdd3' },
    },
  },
  
  // Typography
  typography: {
    // Font families
    fontFamily: {
      word: "'Inter', system-ui, sans-serif",
      arabic: "'Noto Sans Arabic', 'Inter', sans-serif",
    },
    
    // Word card sizes
    wordCard: {
      word: {
        size: '1.25rem',      // 20px - hero element
        weight: '700',
        lineHeight: '1.3',
      },
      translation: {
        size: '0.8125rem',    // 13px
        weight: '500',
        lineHeight: '1.4',
      },
      category: {
        size: '0.625rem',     // 10px
        weight: '600',
      },
    },
    
    // Toolbar
    toolbar: {
      title: {
        size: '1rem',
        weight: '600',
      },
    },
  },
  
  // Spacing (4px base)
  spacing: {
    0: '0',
    1: '0.25rem',   // 4px
    2: '0.5rem',    // 8px
    3: '0.75rem',   // 12px
    4: '1rem',      // 16px
    5: '1.25rem',   // 20px
    6: '1.5rem',    // 24px
  },
  
  // Card dimensions
  card: {
    minWidth: '140px',
    maxWidth: '200px',
    padding: '0.75rem',       // 12px - compact
    gap: '0.5rem',            // 8px between cards
    borderRadius: '0.75rem',  // 12px
  },
  
  // Toolbar
  toolbar: {
    height: '56px',
    padding: '0 1rem',
  },
  
  // Grid
  grid: {
    desktop: {
      columns: 'repeat(auto-fill, minmax(160px, 1fr))',
      gap: '0.5rem',
    },
    tablet: {
      columns: 'repeat(auto-fill, minmax(150px, 1fr))',
      gap: '0.5rem',
    },
    mobile: {
      columns: 'repeat(2, 1fr)',
      gap: '0.5rem',
    },
  },
  
  // Transitions
  transition: {
    fast: '150ms ease',
    normal: '200ms ease',
    slow: '300ms ease',
  },
  
  // Shadows (minimal for performance)
  shadow: {
    card: 'none',
    cardHover: '0 4px 20px rgba(0,0,0,0.3)',
    drawer: '-4px 0 24px rgba(0,0,0,0.5)',
  },
  
  // Z-index layers
  zIndex: {
    base: 1,
    toolbar: 50,
    drawer: 100,
    modal: 200,
  },
};

// Tailwind class mappings for easy use
export const tw = {
  // Card base
  cardBase: 'bg-[#1f1f23] border border-white/[0.06] rounded-xl p-3 transition-all duration-150',
  cardHover: 'hover:bg-[#27272a] hover:border-purple-500/50 hover:shadow-lg hover:shadow-purple-500/10',
  
  // Word text
  wordText: 'text-xl font-bold text-white leading-tight',
  translationText: 'text-[13px] font-medium text-zinc-400 leading-snug',
  
  // Accent button
  accentBtn: 'bg-purple-600 hover:bg-purple-500 text-white font-medium rounded-lg transition-colors duration-150',
  ghostBtn: 'bg-transparent hover:bg-white/10 text-zinc-400 hover:text-white rounded-lg transition-all duration-150',
  
  // Chips
  chip: 'px-3 py-1.5 rounded-full text-xs font-semibold transition-all duration-150',
  chipActive: 'bg-purple-600 text-white',
  chipInactive: 'bg-white/5 text-zinc-400 hover:bg-white/10 hover:text-white',
  
  // Level badges
  levelBadge: 'px-1.5 py-0.5 rounded text-[10px] font-bold uppercase',
};
