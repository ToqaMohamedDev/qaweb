"use client";

import React from "react";
import { motion } from "framer-motion";
import { CheckCircle2, GraduationCap, BookOpen } from "lucide-react";
import type { UserRole } from "@/lib/database.types";
import { authMessages } from "@/lib/constants/messages";

interface RoleSelectorProps {
    selectedRole: UserRole;
    onRoleSelect: (role: UserRole) => void;
}

interface RoleOption {
    value: UserRole;
    label: string;
    icon: React.ReactNode;
    description: string;
}

/**
 * RoleSelector - Role selection component for signup
 * مكون اختيار الدور للتسجيل
 */
export function RoleSelector({ selectedRole, onRoleSelect }: RoleSelectorProps) {
    const roleOptions: RoleOption[] = [
        {
            value: "student",
            label: authMessages.roles.student.label,
            icon: <GraduationCap className="h-5 w-5" />,
            description: authMessages.roles.student.description,
        },
        {
            value: "teacher",
            label: authMessages.roles.teacher.label,
            icon: <BookOpen className="h-5 w-5" />,
            description: authMessages.roles.teacher.description,
        },
    ];

    return (
        <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                {authMessages.signup.accountType}
            </label>
            <div className="grid grid-cols-2 gap-3">
                {roleOptions.map((option) => (
                    <motion.button
                        key={option.value}
                        type="button"
                        onClick={() => onRoleSelect(option.value)}
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        className={`relative p-4 rounded-xl border-2 transition-all duration-200 text-right ${selectedRole === option.value
                            ? "border-primary-500 bg-primary-50 dark:bg-primary-900/20"
                            : "border-gray-200 dark:border-[#2e2e3a] bg-white dark:bg-[#1c1c24] hover:border-gray-300 dark:hover:border-[#3e3e4a]"
                            }`}
                    >
                        {selectedRole === option.value && (
                            <motion.div
                                initial={{ scale: 0 }}
                                animate={{ scale: 1 }}
                                className="absolute top-2 left-2"
                            >
                                <CheckCircle2 className="h-5 w-5 text-primary-500" />
                            </motion.div>
                        )}
                        <div
                            className={`inline-flex p-2 rounded-lg mb-2 ${selectedRole === option.value
                                ? "bg-primary-100 dark:bg-primary-800/30 text-primary-600 dark:text-primary-400"
                                : "bg-gray-100 dark:bg-[#252530] text-gray-600 dark:text-gray-400"
                                }`}
                        >
                            {option.icon}
                        </div>
                        <div>
                            <p
                                className={`font-semibold ${selectedRole === option.value
                                    ? "text-primary-700 dark:text-primary-300"
                                    : "text-gray-700 dark:text-gray-300"
                                    }`}
                            >
                                {option.label}
                            </p>
                            <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                                {option.description}
                            </p>
                        </div>
                    </motion.button>
                ))}
            </div>
        </div>
    );
}
