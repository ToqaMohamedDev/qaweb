// =============================================
// Animation Variants - أنيميشن مركزية للمشروع
// =============================================

import type { Variants, Transition } from 'framer-motion';

// ============================================
// Common Transitions
// ============================================

export const springTransition: Transition = {
    type: 'spring',
    stiffness: 400,
    damping: 25,
};

export const smoothTransition: Transition = {
    type: 'tween',
    ease: 'easeInOut',
    duration: 0.3,
};

export const fastTransition: Transition = {
    type: 'tween',
    ease: 'easeOut',
    duration: 0.15,
};

// ============================================
// Fade Variants
// ============================================

export const fadeIn: Variants = {
    hidden: { opacity: 0 },
    visible: {
        opacity: 1,
        transition: smoothTransition,
    },
    exit: { opacity: 0 },
};

export const fadeInUp: Variants = {
    hidden: {
        opacity: 0,
        y: 20,
    },
    visible: {
        opacity: 1,
        y: 0,
        transition: springTransition,
    },
    exit: {
        opacity: 0,
        y: -10,
    },
};

export const fadeInDown: Variants = {
    hidden: {
        opacity: 0,
        y: -20,
    },
    visible: {
        opacity: 1,
        y: 0,
        transition: springTransition,
    },
    exit: {
        opacity: 0,
        y: 20,
    },
};

export const fadeInLeft: Variants = {
    hidden: {
        opacity: 0,
        x: -20,
    },
    visible: {
        opacity: 1,
        x: 0,
        transition: springTransition,
    },
    exit: {
        opacity: 0,
        x: 20,
    },
};

export const fadeInRight: Variants = {
    hidden: {
        opacity: 0,
        x: 20,
    },
    visible: {
        opacity: 1,
        x: 0,
        transition: springTransition,
    },
    exit: {
        opacity: 0,
        x: -20,
    },
};

// ============================================
// Scale Variants
// ============================================

export const scaleIn: Variants = {
    hidden: {
        opacity: 0,
        scale: 0.9,
    },
    visible: {
        opacity: 1,
        scale: 1,
        transition: springTransition,
    },
    exit: {
        opacity: 0,
        scale: 0.9,
    },
};

export const scaleInBounce: Variants = {
    hidden: {
        opacity: 0,
        scale: 0.3,
    },
    visible: {
        opacity: 1,
        scale: 1,
        transition: {
            type: 'spring',
            stiffness: 500,
            damping: 20,
        },
    },
    exit: {
        opacity: 0,
        scale: 0.3,
    },
};

// ============================================
// Container Variants (Stagger Children)
// ============================================

export const containerVariants: Variants = {
    hidden: { opacity: 0 },
    visible: {
        opacity: 1,
        transition: {
            staggerChildren: 0.1,
            delayChildren: 0.05,
        },
    },
    exit: {
        opacity: 0,
        transition: {
            staggerChildren: 0.05,
            staggerDirection: -1,
        },
    },
};

export const containerVariantsFast: Variants = {
    hidden: { opacity: 0 },
    visible: {
        opacity: 1,
        transition: {
            staggerChildren: 0.05,
            delayChildren: 0.02,
        },
    },
};

export const containerVariantsSlow: Variants = {
    hidden: { opacity: 0 },
    visible: {
        opacity: 1,
        transition: {
            staggerChildren: 0.15,
            delayChildren: 0.1,
        },
    },
};

// ============================================
// Item Variants (For use with containers)
// ============================================

export const itemVariants: Variants = {
    hidden: {
        opacity: 0,
        y: 20,
        scale: 0.95,
    },
    visible: {
        opacity: 1,
        y: 0,
        scale: 1,
        transition: springTransition,
    },
};

export const listItemVariants: Variants = {
    hidden: {
        opacity: 0,
        x: -20,
    },
    visible: {
        opacity: 1,
        x: 0,
        transition: springTransition,
    },
};

// ============================================
// Dropdown Variants
// ============================================

export const dropdownVariants: Variants = {
    hidden: {
        opacity: 0,
        y: -15,
        scale: 0.92,
        filter: 'blur(8px)',
    },
    visible: {
        opacity: 1,
        y: 0,
        scale: 1,
        filter: 'blur(0px)',
        transition: {
            type: 'spring',
            stiffness: 400,
            damping: 25,
        },
    },
    exit: {
        opacity: 0,
        y: -10,
        scale: 0.95,
        filter: 'blur(4px)',
        transition: {
            duration: 0.15,
        },
    },
};

export const dropdownItemVariants: Variants = {
    hidden: {
        opacity: 0,
        x: -10,
    },
    visible: {
        opacity: 1,
        x: 0,
        transition: {
            type: 'spring',
            stiffness: 400,
            damping: 25,
        },
    },
};

// ============================================
// Mobile Menu Variants
// ============================================

export const mobileMenuVariants: Variants = {
    closed: {
        opacity: 0,
        height: 0,
        transition: {
            duration: 0.3,
            ease: [0.4, 0, 0.2, 1],
        },
    },
    open: {
        opacity: 1,
        height: 'auto',
        transition: {
            duration: 0.4,
            ease: [0, 0, 0.2, 1],
        },
    },
};

export const mobileItemVariants: Variants = {
    hidden: {
        opacity: 0,
        x: -20,
        scale: 0.9,
    },
    visible: {
        opacity: 1,
        x: 0,
        scale: 1,
        transition: springTransition,
    },
};

// ============================================
// Card Variants
// ============================================

export const cardVariants: Variants = {
    hidden: {
        opacity: 0,
        y: 30,
        scale: 0.95,
    },
    visible: {
        opacity: 1,
        y: 0,
        scale: 1,
        transition: {
            type: 'spring',
            stiffness: 300,
            damping: 24,
        },
    },
    hover: {
        y: -4,
        scale: 1.02,
        transition: {
            type: 'spring',
            stiffness: 400,
            damping: 25,
        },
    },
    tap: {
        scale: 0.98,
    },
};

export const cardHover = {
    y: -4,
    transition: { duration: 0.2 },
};

// ============================================
// Modal / Overlay Variants
// ============================================

export const overlayVariants: Variants = {
    hidden: { opacity: 0 },
    visible: {
        opacity: 1,
        transition: { duration: 0.2 },
    },
    exit: {
        opacity: 0,
        transition: { duration: 0.15 },
    },
};

export const modalVariants: Variants = {
    hidden: {
        opacity: 0,
        scale: 0.95,
        y: 20,
    },
    visible: {
        opacity: 1,
        scale: 1,
        y: 0,
        transition: {
            type: 'spring',
            stiffness: 400,
            damping: 30,
        },
    },
    exit: {
        opacity: 0,
        scale: 0.95,
        y: 20,
        transition: { duration: 0.15 },
    },
};

// ============================================
// Slide Variants
// ============================================

export const slideInFromRight: Variants = {
    hidden: {
        x: '100%',
        opacity: 0,
    },
    visible: {
        x: 0,
        opacity: 1,
        transition: {
            type: 'spring',
            stiffness: 300,
            damping: 30,
        },
    },
    exit: {
        x: '100%',
        opacity: 0,
    },
};

export const slideInFromLeft: Variants = {
    hidden: {
        x: '-100%',
        opacity: 0,
    },
    visible: {
        x: 0,
        opacity: 1,
        transition: {
            type: 'spring',
            stiffness: 300,
            damping: 30,
        },
    },
    exit: {
        x: '-100%',
        opacity: 0,
    },
};

export const slideInFromTop: Variants = {
    hidden: {
        y: '-100%',
        opacity: 0,
    },
    visible: {
        y: 0,
        opacity: 1,
        transition: {
            type: 'spring',
            stiffness: 300,
            damping: 30,
        },
    },
    exit: {
        y: '-100%',
        opacity: 0,
    },
};

export const slideInFromBottom: Variants = {
    hidden: {
        y: '100%',
        opacity: 0,
    },
    visible: {
        y: 0,
        opacity: 1,
        transition: {
            type: 'spring',
            stiffness: 300,
            damping: 30,
        },
    },
    exit: {
        y: '100%',
        opacity: 0,
    },
};

// ============================================
// Special Effects
// ============================================

export const floatingVariants: Variants = {
    animate: {
        y: [-2, 2, -2],
        rotate: [-2, 2, -2],
        transition: {
            duration: 4,
            ease: 'easeInOut',
            repeat: Infinity,
            repeatType: 'loop',
        },
    },
};

export const pulseVariants: Variants = {
    animate: {
        scale: [1, 1.05, 1],
        opacity: [1, 0.8, 1],
        transition: {
            duration: 2,
            ease: 'easeInOut',
            repeat: Infinity,
        },
    },
};

export const glowVariants: Variants = {
    initial: {
        opacity: 0.5,
        scale: 1,
    },
    animate: {
        opacity: [0.5, 0.8, 0.5],
        scale: [1, 1.05, 1],
        transition: {
            duration: 2.5,
            ease: 'easeInOut',
            repeat: Infinity,
        },
    },
};

export const shimmerVariants: Variants = {
    animate: {
        backgroundPosition: ['200% 0', '-200% 0'],
        transition: {
            duration: 1.5,
            ease: 'linear',
            repeat: Infinity,
        },
    },
};

// ============================================
// Button Variants
// ============================================

export const buttonVariants: Variants = {
    idle: { scale: 1 },
    hover: {
        scale: 1.05,
        transition: { duration: 0.2 },
    },
    tap: {
        scale: 0.95,
        transition: { duration: 0.1 },
    },
};

export const iconButtonVariants: Variants = {
    idle: { rotate: 0 },
    hover: {
        rotate: 15,
        scale: 1.1,
        transition: { duration: 0.2 },
    },
    tap: {
        scale: 0.9,
    },
};

// ============================================
// Page Transition Variants
// ============================================

export const pageVariants: Variants = {
    initial: {
        opacity: 0,
        y: 20,
    },
    animate: {
        opacity: 1,
        y: 0,
        transition: {
            duration: 0.4,
            ease: [0.25, 0.1, 0.25, 1],
        },
    },
    exit: {
        opacity: 0,
        y: -20,
        transition: {
            duration: 0.3,
        },
    },
};

// ============================================
// Notification / Toast Variants
// ============================================

export const toastVariants: Variants = {
    hidden: {
        opacity: 0,
        y: -20,
        x: 20,
        scale: 0.9,
    },
    visible: {
        opacity: 1,
        y: 0,
        x: 0,
        scale: 1,
        transition: springTransition,
    },
    exit: {
        opacity: 0,
        x: 100,
        transition: { duration: 0.2 },
    },
};

// ============================================
// Skeleton Loading Variants
// ============================================

export const skeletonVariants: Variants = {
    animate: {
        opacity: [0.5, 1, 0.5],
        transition: {
            duration: 1.5,
            ease: 'easeInOut',
            repeat: Infinity,
        },
    },
};

// ============================================
// Export all as default object for convenience
// ============================================

const animations = {
    // Transitions
    springTransition,
    smoothTransition,
    fastTransition,

    // Fade
    fadeIn,
    fadeInUp,
    fadeInDown,
    fadeInLeft,
    fadeInRight,

    // Scale
    scaleIn,
    scaleInBounce,

    // Container
    containerVariants,
    containerVariantsFast,
    containerVariantsSlow,

    // Items
    itemVariants,
    listItemVariants,

    // Dropdown
    dropdownVariants,
    dropdownItemVariants,

    // Mobile
    mobileMenuVariants,
    mobileItemVariants,

    // Card
    cardVariants,
    cardHover,

    // Modal
    overlayVariants,
    modalVariants,

    // Slide
    slideInFromRight,
    slideInFromLeft,
    slideInFromTop,
    slideInFromBottom,

    // Special
    floatingVariants,
    pulseVariants,
    glowVariants,
    shimmerVariants,

    // Button
    buttonVariants,
    iconButtonVariants,

    // Page
    pageVariants,

    // Toast
    toastVariants,

    // Skeleton
    skeletonVariants,
};

export default animations;
