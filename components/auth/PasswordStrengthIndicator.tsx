"use client";

import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { CheckCircle2 } from "lucide-react";
import type { PasswordRequirement, PasswordStrength } from "@/lib/utils/validation";
import { authMessages } from "@/lib/constants/messages";

interface PasswordStrengthIndicatorProps {
    password: string;
    requirements: PasswordRequirement[];
    strength: PasswordStrength;
}

/**
 * PasswordStrengthIndicator - Visual password strength indicator
 * مؤشر قوة كلمة المرور المرئي
 */
export function PasswordStrengthIndicator({
    password,
    requirements,
    strength,
}: PasswordStrengthIndicatorProps) {
    return (
        <AnimatePresence>
            {password && (
                <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    transition={{ duration: 0.3 }}
                    className="space-y-3 p-4 rounded-xl bg-gray-50 dark:bg-[#252530] border border-gray-200/60 dark:border-[#2e2e3a]"
                >
                    {/* Strength Bar */}
                    <div>
                        <div className="flex items-center justify-between mb-1.5">
                            <span className="text-xs font-medium text-gray-700 dark:text-gray-300">
                                {authMessages.passwordStrength.strengthLabel}
                            </span>
                            {strength.label && (
                                <span
                                    className={`text-xs font-semibold ${strength.color.replace(
                                        "bg-",
                                        "text-"
                                    )}`}
                                >
                                    {strength.label}
                                </span>
                            )}
                        </div>
                        <div className="w-full h-2 bg-gray-200 dark:bg-[#2e2e3a] rounded-full overflow-hidden">
                            <motion.div
                                initial={{ width: 0 }}
                                animate={{ width: `${strength.strength}%` }}
                                transition={{ duration: 0.3 }}
                                className={`h-full ${strength.color} transition-colors`}
                            />
                        </div>
                    </div>

                    {/* Requirements */}
                    <div className="grid grid-cols-2 gap-2">
                        {requirements.map((req) => (
                            <div
                                key={req.key}
                                className="flex items-center gap-2 text-sm"
                            >
                                <CheckCircle2
                                    className={`h-4 w-4 transition-colors ${req.met
                                            ? "text-green-500"
                                            : "text-gray-300 dark:text-gray-600"
                                        }`}
                                />
                                <span
                                    className={`transition-colors ${req.met
                                            ? "text-green-600 dark:text-green-400 font-medium"
                                            : "text-gray-500 dark:text-gray-400"
                                        }`}
                                >
                                    {req.text}
                                </span>
                            </div>
                        ))}
                    </div>
                </motion.div>
            )}
        </AnimatePresence>
    );
}
