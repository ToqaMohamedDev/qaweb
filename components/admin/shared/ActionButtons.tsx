// =============================================
// Admin Action Buttons Component - أزرار الإجراءات للـ Admin
// =============================================

"use client";

import React from "react";
import { motion } from "framer-motion";
import {
    Edit2,
    Trash2,
    Eye,
    MoreVertical,
    CheckCircle2,
    XCircle,
    Download,
    Copy,
    ExternalLink,
    Settings,
    LucideIcon,
} from "lucide-react";

// ═══════════════════════════════════════════════════════════════════════════
// Types
// ═══════════════════════════════════════════════════════════════════════════

export interface AdminActionButtonProps {
    icon?: LucideIcon;
    label?: string;
    onClick: () => void;
    variant?: "default" | "primary" | "danger" | "success" | "warning";
    size?: "sm" | "md" | "lg";
    disabled?: boolean;
    loading?: boolean;
    tooltip?: string;
    className?: string;
}

export interface AdminTableActionsProps {
    actions: AdminActionButtonProps[];
    compact?: boolean;
    direction?: "row" | "column";
}

// ═══════════════════════════════════════════════════════════════════════════
// Variant Styles
// ═══════════════════════════════════════════════════════════════════════════

const VARIANT_STYLES = {
    default: "text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800",
    primary: "text-primary-500 hover:bg-primary-50 dark:hover:bg-primary-900/20",
    danger: "text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20",
    success: "text-green-500 hover:bg-green-50 dark:hover:bg-green-900/20",
    warning: "text-amber-500 hover:bg-amber-50 dark:hover:bg-amber-900/20",
};

const SIZE_STYLES = {
    sm: "p-1.5",
    md: "p-2",
    lg: "p-2.5",
};

const ICON_SIZES = {
    sm: "h-3.5 w-3.5",
    md: "h-4 w-4",
    lg: "h-5 w-5",
};

// ═══════════════════════════════════════════════════════════════════════════
// AdminActionButton Component
// ═══════════════════════════════════════════════════════════════════════════

export function AdminActionButton({
    icon: Icon,
    label,
    onClick,
    variant = "default",
    size = "md",
    disabled = false,
    loading = false,
    tooltip,
    className = "",
}: AdminActionButtonProps) {
    return (
        <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={(e) => {
                e.stopPropagation();
                onClick();
            }}
            disabled={disabled || loading}
            title={tooltip}
            className={`
                rounded-lg transition-colors
                ${SIZE_STYLES[size]}
                ${VARIANT_STYLES[variant]}
                ${disabled || loading ? "opacity-50 cursor-not-allowed" : ""}
                ${className}
            `}
        >
            {loading ? (
                <div className={`${ICON_SIZES[size]} animate-spin rounded-full border-2 border-current border-t-transparent`} />
            ) : (
                <div className="flex items-center gap-1.5">
                    {Icon && <Icon className={ICON_SIZES[size]} />}
                    {label && <span className="text-sm">{label}</span>}
                </div>
            )}
        </motion.button>
    );
}

// ═══════════════════════════════════════════════════════════════════════════
// AdminTableActions Component - للاستخدام في جداول Admin
// ═══════════════════════════════════════════════════════════════════════════

export function AdminTableActions({ actions, compact = false, direction = "row" }: AdminTableActionsProps) {
    return (
        <div className={`flex ${direction === "column" ? "flex-col" : ""} gap-1`}>
            {actions.map((action, index) => (
                <AdminActionButton
                    key={index}
                    {...action}
                    size={compact ? "sm" : "md"}
                />
            ))}
        </div>
    );
}

// ═══════════════════════════════════════════════════════════════════════════
// Preset Action Buttons - أزرار جاهزة للاستخدام المباشر
// ═══════════════════════════════════════════════════════════════════════════

export function EditButton({ onClick, disabled }: { onClick: () => void; disabled?: boolean }) {
    return (
        <AdminActionButton
            icon={Edit2}
            onClick={onClick}
            variant="default"
            tooltip="تعديل"
            disabled={disabled}
        />
    );
}

export function DeleteButton({ onClick, disabled }: { onClick: () => void; disabled?: boolean }) {
    return (
        <AdminActionButton
            icon={Trash2}
            onClick={onClick}
            variant="danger"
            tooltip="حذف"
            disabled={disabled}
        />
    );
}

export function ViewButton({ onClick, disabled }: { onClick: () => void; disabled?: boolean }) {
    return (
        <AdminActionButton
            icon={Eye}
            onClick={onClick}
            variant="primary"
            tooltip="عرض"
            disabled={disabled}
        />
    );
}

export function ApproveButton({ onClick, disabled }: { onClick: () => void; disabled?: boolean }) {
    return (
        <AdminActionButton
            icon={CheckCircle2}
            onClick={onClick}
            variant="success"
            tooltip="موافقة"
            disabled={disabled}
        />
    );
}

export function RejectButton({ onClick, disabled }: { onClick: () => void; disabled?: boolean }) {
    return (
        <AdminActionButton
            icon={XCircle}
            onClick={onClick}
            variant="danger"
            tooltip="رفض"
            disabled={disabled}
        />
    );
}

// ═══════════════════════════════════════════════════════════════════════════
// Status Badge Component
// ═══════════════════════════════════════════════════════════════════════════

export interface AdminStatusBadgeProps {
    status: "success" | "warning" | "danger" | "info" | "neutral";
    label: string;
    icon?: LucideIcon;
    size?: "sm" | "md";
}

const STATUS_BADGE_STYLES = {
    success: "bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400",
    warning: "bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400",
    danger: "bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400",
    info: "bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400",
    neutral: "bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400",
};

export function AdminStatusBadge({ status, label, icon: Icon, size = "md" }: AdminStatusBadgeProps) {
    const sizeClass = size === "sm" ? "px-2 py-0.5 text-[10px]" : "px-2.5 py-1 text-xs";

    return (
        <span className={`inline-flex items-center gap-1 rounded-lg font-medium ${sizeClass} ${STATUS_BADGE_STYLES[status]}`}>
            {Icon && <Icon className={size === "sm" ? "h-3 w-3" : "h-3.5 w-3.5"} />}
            {label}
        </span>
    );
}

// ═══════════════════════════════════════════════════════════════════════════
// Admin User Cell Component
// ═══════════════════════════════════════════════════════════════════════════

export interface AdminUserCellProps {
    name: string;
    email?: string;
    avatarUrl?: string | null;
    verified?: boolean;
}

export function AdminUserCell({ name, email, avatarUrl, verified }: AdminUserCellProps) {
    return (
        <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary-400 to-primary-600 flex items-center justify-center text-white font-bold overflow-hidden">
                {avatarUrl ? (
                    <img src={avatarUrl} alt={name} className="w-full h-full object-cover" />
                ) : (
                    name?.charAt(0) || "?"
                )}
            </div>
            <div>
                <div className="flex items-center gap-1.5">
                    <p className="text-sm font-medium text-gray-900 dark:text-white">{name}</p>
                    {verified && <CheckCircle2 className="h-4 w-4 text-blue-500" />}
                </div>
                {email && <p className="text-xs text-gray-500">{email}</p>}
            </div>
        </div>
    );
}

export default AdminActionButton;

