"use client";

import { forwardRef, InputHTMLAttributes, useId } from "react";
import { cn } from "@/lib/utils";

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  icon?: React.ReactNode;
  helperText?: string;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, icon, helperText, className, id: providedId, required, ...props }, ref) => {
    // Generate unique IDs for accessibility
    const generatedId = useId();
    const inputId = providedId || `input-${generatedId}`;
    const errorId = `${inputId}-error`;
    const helperId = `${inputId}-helper`;

    // Determine which IDs to include in aria-describedby
    const describedByIds = [
      error ? errorId : null,
      helperText ? helperId : null,
    ].filter(Boolean).join(" ") || undefined;

    return (
      <div className="w-full">
        {label && (
          <label
            htmlFor={inputId}
            className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
            dir="rtl"
          >
            {label}
            {required && (
              <span className="text-red-500 mr-1" aria-hidden="true">*</span>
            )}
          </label>
        )}
        <div className="relative">
          {icon && (
            <div
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none"
              aria-hidden="true"
            >
              {icon}
            </div>
          )}
          <input
            ref={ref}
            id={inputId}
            aria-invalid={error ? "true" : undefined}
            aria-describedby={describedByIds}
            aria-required={required}
            className={cn(
              "w-full px-4 py-3 rounded-xl",
              "bg-white dark:bg-[#1c1c24]",
              "border-2 transition-all duration-200",
              error
                ? "border-red-300 dark:border-red-700 focus:border-red-500 focus:ring-red-500/20"
                : "border-gray-200 dark:border-[#2e2e3a] focus:border-primary-500 dark:focus:border-primary-400",
              "text-gray-900 dark:text-gray-100",
              "placeholder:text-gray-400 dark:placeholder:text-gray-500",
              "focus:outline-none focus:ring-2 focus:ring-primary-500/20",
              "disabled:opacity-50 disabled:cursor-not-allowed",
              icon && "pr-12",
              className
            )}
            {...props}
          />
        </div>
        {error && (
          <p
            id={errorId}
            role="alert"
            aria-live="polite"
            className="mt-1.5 text-sm text-red-500 dark:text-red-400 flex items-center gap-1.5"
            dir="rtl"
          >
            <svg
              className="h-4 w-4 flex-shrink-0"
              fill="currentColor"
              viewBox="0 0 20 20"
              aria-hidden="true"
            >
              <path
                fillRule="evenodd"
                d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z"
                clipRule="evenodd"
              />
            </svg>
            {error}
          </p>
        )}
        {helperText && !error && (
          <p
            id={helperId}
            className="mt-1.5 text-sm text-gray-500 dark:text-gray-400"
            dir="rtl"
          >
            {helperText}
          </p>
        )}
      </div>
    );
  }
);

Input.displayName = "Input";

