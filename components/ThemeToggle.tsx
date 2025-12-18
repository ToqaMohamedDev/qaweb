"use client";

import { Moon, Sun } from "lucide-react";
import { useTheme } from "./ThemeProvider";
import { motion, AnimatePresence } from "framer-motion";
import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";

interface ThemeToggleProps {
    className?: string;
    fixed?: boolean;
}

export function ThemeToggle({ className, fixed = false }: ThemeToggleProps) {
    const { theme, toggleTheme } = useTheme();
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        // Use setTimeout to avoid synchronous setState in effect
        const timer = setTimeout(() => {
            setMounted(true);
        }, 0);
        return () => clearTimeout(timer);
    }, []);

    if (!mounted) {
        return (
            <div
                className={cn(
                    "flex h-10 w-10 items-center justify-center rounded-xl bg-gray-100/80 dark:bg-[#1c1c24]/80 border border-gray-200/50 dark:border-[#2e2e3a]/50",
                    fixed && "fixed top-6 left-6 z-50",
                    className
                )}
            />
        );
    }

    return (
        <motion.button
            onClick={toggleTheme}
            className={cn(
                "group relative flex h-10 w-10 items-center justify-center rounded-xl",
                "bg-white/90 dark:bg-[#1c1c24]/90 backdrop-blur-sm",
                "border border-gray-200/60 dark:border-[#2e2e3a]/60",
                "hover:border-gray-300 dark:hover:border-[#2e2e3a]",
                "shadow-md hover:shadow-lg",
                "transition-all duration-300",
                fixed && "fixed top-6 left-6 z-50",
                className
            )}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            aria-label={theme === "dark" ? "تفعيل الوضع الفاتح" : "تفعيل الوضع الداكن"}
        >
            {/* Background gradient effect */}
            <div className={cn(
                "absolute inset-0 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300",
                theme === "dark"
                    ? "bg-gradient-to-br from-amber-500/10 to-orange-500/10"
                    : "bg-gradient-to-br from-primary-500/10 to-primary-500/10"
            )} />

            <AnimatePresence mode="wait" initial={false}>
                <motion.div
                    key={theme}
                    initial={{ rotate: -180, opacity: 0, scale: 0.5 }}
                    animate={{ rotate: 0, opacity: 1, scale: 1 }}
                    exit={{ rotate: 180, opacity: 0, scale: 0.5 }}
                    transition={{
                        duration: 0.3,
                        type: "spring",
                        stiffness: 200,
                        damping: 15
                    }}
                    className="relative z-10"
                >
                    {theme === "dark" ? (
                        <Moon className="h-5 w-5 text-primary-600 dark:text-primary-400 drop-shadow-sm" />
                    ) : (
                        <Sun className="h-5 w-5 text-amber-500 dark:text-amber-400 drop-shadow-sm" />
                    )}
                </motion.div>
            </AnimatePresence>
        </motion.button>
    );
}
