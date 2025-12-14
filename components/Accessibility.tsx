"use client";

import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";

/**
 * Skip Links Component for Accessibility
 * Allows keyboard users to skip navigation and go directly to main content
 */
export function SkipLinks() {
    const [isFocused, setIsFocused] = useState(false);

    return (
        <div
            className={cn(
                "fixed top-0 left-0 right-0 z-[9999] flex justify-center transition-transform duration-200",
                isFocused ? "transform-none" : "-translate-y-full"
            )}
        >
            <a
                href="#main-content"
                onFocus={() => setIsFocused(true)}
                onBlur={() => setIsFocused(false)}
                className="
          bg-primary-600 text-white 
          px-6 py-3 rounded-b-lg 
          font-semibold text-sm
          focus:outline-none focus:ring-2 focus:ring-primary-400 focus:ring-offset-2
          shadow-lg
          transform transition-transform duration-200
        "
            >
                انتقال إلى المحتوى الرئيسي
            </a>
        </div>
    );
}

/**
 * Focus Trap Hook for modals and dialogs
 */
export function useFocusTrap(isActive: boolean) {
    useEffect(() => {
        if (!isActive) return;

        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key !== "Tab") return;

            const focusableElements = document.querySelectorAll(
                'a[href], button:not([disabled]), textarea:not([disabled]), input:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])'
            );

            const focusableArray = Array.from(focusableElements) as HTMLElement[];
            const firstElement = focusableArray[0];
            const lastElement = focusableArray[focusableArray.length - 1];

            if (e.shiftKey && document.activeElement === firstElement) {
                lastElement?.focus();
                e.preventDefault();
            } else if (!e.shiftKey && document.activeElement === lastElement) {
                firstElement?.focus();
                e.preventDefault();
            }
        };

        document.addEventListener("keydown", handleKeyDown);
        return () => document.removeEventListener("keydown", handleKeyDown);
    }, [isActive]);
}

/**
 * Announce to screen readers
 */
export function useAnnounce() {
    const [announcement, setAnnouncement] = useState("");

    const announce = (message: string, politeness: "polite" | "assertive" = "polite") => {
        setAnnouncement("");
        // Small delay to ensure the screen reader picks up the change
        setTimeout(() => setAnnouncement(message), 100);
    };

    const Announcer = () => (
        <div
            role="status"
            aria-live="polite"
            aria-atomic="true"
            className="sr-only"
        >
            {announcement}
        </div>
    );

    return { announce, Announcer };
}

/**
 * Reduce Motion Hook
 * Respects user's preference for reduced motion
 */
export function useReducedMotion(): boolean {
    const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);

    useEffect(() => {
        const mediaQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
        setPrefersReducedMotion(mediaQuery.matches);

        const handler = (event: MediaQueryListEvent) => {
            setPrefersReducedMotion(event.matches);
        };

        mediaQuery.addEventListener("change", handler);
        return () => mediaQuery.removeEventListener("change", handler);
    }, []);

    return prefersReducedMotion;
}
