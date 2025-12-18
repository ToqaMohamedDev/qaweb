"use client";

import { forwardRef, ReactNode, MouseEvent } from "react";
import { motion, HTMLMotionProps } from "framer-motion";
import { cn } from "@/lib/utils";

interface ButtonProps extends Omit<HTMLMotionProps<"button">, "ref"> {
    variant?: "primary" | "secondary" | "outline" | "ghost";
    size?: "sm" | "md" | "lg";
    isLoading?: boolean;
    fullWidth?: boolean;
    leftIcon?: ReactNode;
    rightIcon?: ReactNode;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
    (
        {
            variant = "primary",
            size = "md",
            isLoading = false,
            fullWidth = false,
            leftIcon,
            rightIcon,
            className,
            children,
            disabled,
            ...props
        },
        ref
    ) => {
        const baseStyles = cn(
            "relative inline-flex items-center justify-center gap-2 font-semibold rounded-xl transition-all duration-200",
            "focus:outline-none focus:ring-4",
            fullWidth && "w-full"
        );

        const variants = {
            primary: cn(
                "bg-gradient-to-r from-primary-500 to-primary-600",
                "hover:from-primary-600 hover:to-primary-700",
                "text-white shadow-lg shadow-primary-500/25",
                "hover:shadow-xl hover:shadow-primary-500/30",
                "focus:ring-primary-500/30",
                "disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:shadow-lg"
            ),
            secondary: cn(
                "bg-gray-100 dark:bg-[#252530]",
                "hover:bg-gray-200 dark:hover:bg-[#2e2e3a]",
                "text-gray-900 dark:text-white",
                "border-2 border-gray-200/60 dark:border-[#2e2e3a]",
                "focus:ring-gray-500/20",
                "disabled:opacity-50 disabled:cursor-not-allowed"
            ),
            outline: cn(
                "bg-transparent border-2",
                "border-primary-500 dark:border-primary-400",
                "text-primary-600 dark:text-primary-400",
                "hover:bg-primary-50 dark:hover:bg-primary-900/20",
                "focus:ring-primary-500/30",
                "disabled:opacity-50 disabled:cursor-not-allowed"
            ),
            ghost: cn(
                "bg-transparent",
                "text-gray-700 dark:text-gray-300",
                "hover:bg-gray-100 dark:hover:bg-[#252530]",
                "focus:ring-gray-500/20",
                "disabled:opacity-50 disabled:cursor-not-allowed"
            ),
        };

        const sizes = {
            sm: "px-4 py-2 text-sm",
            md: "px-6 py-3 text-sm",
            lg: "px-8 py-4 text-base",
        };

        return (
            <motion.button
                ref={ref}
                whileHover={{ scale: disabled ? 1 : 1.01 }}
                whileTap={{ scale: disabled ? 1 : 0.98 }}
                className={cn(baseStyles, variants[variant], sizes[size], className)}
                disabled={disabled || isLoading}
                {...props}
            >
                {isLoading ? (
                    <>
                        <svg
                            className="animate-spin h-5 w-5"
                            xmlns="http://www.w3.org/2000/svg"
                            fill="none"
                            viewBox="0 0 24 24"
                        >
                            <circle
                                className="opacity-25"
                                cx="12"
                                cy="12"
                                r="10"
                                stroke="currentColor"
                                strokeWidth="4"
                            />
                            <path
                                className="opacity-75"
                                fill="currentColor"
                                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                            />
                        </svg>
                        <span>جاري التحميل...</span>
                    </>
                ) : (
                    <>
                        {leftIcon && <span>{leftIcon}</span>}
                        {children}
                        {rightIcon && <span>{rightIcon}</span>}
                    </>
                )}
            </motion.button>
        );
    }
);

Button.displayName = "Button";
