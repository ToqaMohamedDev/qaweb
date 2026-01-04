"use client";

import React from "react";
import { Lock, Eye, EyeOff } from "lucide-react";
import { Input } from "@/components/Input";

interface PasswordInputProps {
    label: string;
    value: string;
    onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
    error?: string;
    showPassword: boolean;
    onTogglePassword: () => void;
    placeholder?: string;
    autoComplete?: string;
}

/**
 * PasswordInput - Password input with visibility toggle
 * حقل كلمة المرور مع زر إظهار/إخفاء
 */
export function PasswordInput({
    label,
    value,
    onChange,
    error,
    showPassword,
    onTogglePassword,
    placeholder = "••••••••",
    autoComplete = "current-password",
}: PasswordInputProps) {
    return (
        <div className="relative">
            <Input
                type={showPassword ? "text" : "password"}
                label={label}
                placeholder={placeholder}
                value={value}
                onChange={onChange}
                error={error}
                icon={<Lock className="h-5 w-5" />}
                autoComplete={autoComplete}
            />
            <button
                type="button"
                onClick={onTogglePassword}
                className="absolute left-4 top-[2.75rem] p-1.5 text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 transition-colors"
                aria-label={showPassword ? "إخفاء كلمة المرور" : "إظهار كلمة المرور"}
            >
                {showPassword ? (
                    <EyeOff className="h-5 w-5" />
                ) : (
                    <Eye className="h-5 w-5" />
                )}
            </button>
        </div>
    );
}
