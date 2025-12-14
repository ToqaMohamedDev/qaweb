"use client";

import { useEffect, useRef } from "react";
import { usePathname } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";

/**
 * Grid Overlay Strategy Template Component
 * 
 * This component solves the "mechanical" flickering issue during page transitions
 * by using CSS Grid to overlay exiting and entering pages in the same grid cell.
 * 
 * Key Features:
 * 1. Grid Stacking: Both pages occupy grid-area: 1/1 (same cell)
 * 2. Viewport Stability: min-height: 100dvh prevents layout jumps
 * 3. Scroll Handling: Preserves scroll position during transitions
 * 4. Hardware Acceleration: Uses transform for smooth animations
 * 
 * IMPORTANT: Test in Production Build!
 * React Strict Mode in dev causes double-rendering which can create artificial flickering.
 * Always test with: npm run build && npm start
 */

interface TemplateProps {
  children: React.ReactNode;
}

export default function Template({ children }: TemplateProps) {
  const pathname = usePathname();
  const containerRef = useRef<HTMLDivElement>(null);
  const scrollPositionRef = useRef<number>(0);
  const isInitialMount = useRef(true);

  // Save scroll position before route change
  useEffect(() => {
    const handleRouteChange = () => {
      scrollPositionRef.current = window.scrollY;
    };

    // Save scroll position on any navigation
    window.addEventListener("scroll", () => {
      scrollPositionRef.current = window.scrollY;
    }, { passive: true });

    return () => {
      window.removeEventListener("scroll", handleRouteChange);
    };
  }, []);

  // Handle scroll restoration after route change
  useEffect(() => {
    // For initial mount, don't restore scroll (let Next.js handle it)
    if (isInitialMount.current) {
      isInitialMount.current = false;
      // Reset scroll to top on initial mount
      requestAnimationFrame(() => {
        window.scrollTo({ top: 0, behavior: "instant" as ScrollBehavior });
      });
      return;
    }

    // For subsequent navigations, reset scroll to top
    // This ensures consistent behavior - new pages always start at top
    // You can customize this to preserve scroll if needed
    const timeoutId = setTimeout(() => {
      window.scrollTo({
        top: 0,
        behavior: "instant" as ScrollBehavior // Use instant to avoid animation conflicts
      });
    }, 10); // Reduced delay for faster response

    return () => clearTimeout(timeoutId);
  }, [pathname]);

  return (
    <div
      ref={containerRef}
      className="page-transition-wrapper"
      suppressHydrationWarning
      // Fallback for browsers without dvh support (handled via CSS)
      style={{
        display: "grid",
        gridTemplateColumns: "1fr",
        gridTemplateRows: "1fr",
        // Use CSS custom property for fallback support
        minHeight: "100dvh",
        position: "relative",
        // Force hardware acceleration
        transform: "translate3d(0, 0, 0)",
        willChange: "contents",
        // Prevent layout shifts
        contain: "layout style paint",
      } as React.CSSProperties & { minHeight: string }}
    >
      <AnimatePresence mode="wait" initial={false}>
        <motion.div
          key={pathname}
          suppressHydrationWarning
          // Grid overlay: both pages occupy the same grid cell
          style={{
            gridColumn: "1 / -1",
            gridRow: "1 / -1",
            // Ensure full width and height
            width: "100%",
            minHeight: "100%",
            // Hardware acceleration
            transform: "translate3d(0, 0, 0)",
            willChange: "transform, opacity",
            backfaceVisibility: "hidden",
            WebkitBackfaceVisibility: "hidden",
          }}
          initial={{
            opacity: 0,
            // Subtle transform for smoother feel (optional - can be removed if causing issues)
            transform: "translate3d(0, 4px, 0)",
          }}
          animate={{
            opacity: 1,
            transform: "translate3d(0, 0, 0)",
            transition: {
              duration: 0.2,
              ease: [0.25, 0.46, 0.45, 0.94], // Custom easing for smooth transition
            }
          }}
          exit={{
            opacity: 0,
            transform: "translate3d(0, -4px, 0)",
            transition: {
              duration: 0.15,
              ease: [0.25, 0.46, 0.45, 0.94],
            }
          }}
        >
          {children}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
