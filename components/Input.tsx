"use client";

import { forwardRef, InputHTMLAttributes, ReactNode } from "react";
import { cn } from "@/lib/utils";

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
    label?: string;
    error?: string;
    icon?: ReactNode;
    helperText?: string;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
    ({ label, error, icon, helperText, className, ...props }, ref) => {
        return (
            <div className="w-full">
                {label && (
                    <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                        {label}
                    </label>
                )}
                <div className="relative">
                    {icon && (
                        <div className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 dark:text-gray-500 pointer-events-none">
                            {icon}
                        </div>
                    )}
                    <input
                        ref={ref}
                        className={cn(
                            "w-full px-4 py-3.5 rounded-xl text-gray-900 dark:text-white",
                            "bg-gray-50 dark:bg-[#252530]",
                            "border-2 border-gray-200/60 dark:border-[#2e2e3a]",
                            "focus:border-primary-500 dark:focus:border-primary-500",
                            "focus:ring-4 focus:ring-primary-500/10 dark:focus:ring-primary-500/20",
                            "placeholder:text-gray-400 dark:placeholder:text-gray-500",
                            "outline-none transition-all duration-200",
                            icon && "pr-12",
                            error && "border-red-400 dark:border-red-500 focus:border-red-500 focus:ring-red-500/10",
                            className
                        )}
                        {...props}
                    />
                </div>
                {error && (
                    <p className="mt-2 text-sm text-red-600 dark:text-red-400">{error}</p>
                )}
                {helperText && !error && (
                    <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">{helperText}</p>
                )}
            </div>
        );
    }
);

Input.displayName = "Input";
