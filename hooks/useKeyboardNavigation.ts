"use client";

import { useEffect, useCallback } from "react";

/**
 * Hook for keyboard navigation support
 * Improves accessibility by handling keyboard shortcuts
 */
export function useKeyboardNavigation() {
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      // Skip if user is typing in an input/textarea
      const target = event.target as HTMLElement;
      if (
        target.tagName === "INPUT" ||
        target.tagName === "TEXTAREA" ||
        target.isContentEditable
      ) {
        return;
      }

      // Escape key - close modals/dropdowns
      if (event.key === "Escape") {
        const modals = document.querySelectorAll('[role="dialog"]');
        modals.forEach((modal) => {
          if (modal instanceof HTMLElement && modal.style.display !== "none") {
            const closeButton = modal.querySelector('[aria-label*="إغلاق"], [aria-label*="Close"]');
            if (closeButton instanceof HTMLElement) {
              closeButton.click();
            }
          }
        });
      }

      // Ctrl/Cmd + K - Open search (if implemented)
      if ((event.ctrlKey || event.metaKey) && event.key === "k") {
        event.preventDefault();
        // Trigger search modal if exists
        const searchButton = document.querySelector('[aria-label*="بحث"], [aria-label*="Search"]');
        if (searchButton instanceof HTMLElement) {
          searchButton.click();
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);
}

/**
 * Hook for focus management
 * Helps with accessibility by managing focus states
 */
export function useFocusManagement() {
  const trapFocus = useCallback((container: HTMLElement) => {
    const focusableElements = container.querySelectorAll(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    );
    const firstElement = focusableElements[0] as HTMLElement;
    const lastElement = focusableElements[focusableElements.length - 1] as HTMLElement;

    const handleTab = (e: KeyboardEvent) => {
      if (e.key !== "Tab") return;

      if (e.shiftKey) {
        if (document.activeElement === firstElement) {
          e.preventDefault();
          lastElement?.focus();
        }
      } else {
        if (document.activeElement === lastElement) {
          e.preventDefault();
          firstElement?.focus();
        }
      }
    };

    container.addEventListener("keydown", handleTab);
    return () => container.removeEventListener("keydown", handleTab);
  }, []);

  return { trapFocus };
}

