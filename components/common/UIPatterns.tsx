// =============================================
// Common UI Patterns - أنماط واجهة المستخدم الشائعة
// =============================================

import React from 'react';
import { LucideIcon } from 'lucide-react';

// ═══════════════════════════════════════════════════════════════════════════
// BADGE COMPONENT
// ═══════════════════════════════════════════════════════════════════════════

export type BadgeVariant = 'success' | 'error' | 'warning' | 'info' | 'default' | 'primary';

const badgeClasses: Record<BadgeVariant, string> = {
    success: 'bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400',
    error: 'bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400',
    warning: 'bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400',
    info: 'bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400',
    primary: 'bg-primary-100 dark:bg-primary-900/30 text-primary-600 dark:text-primary-400',
    default: 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400',
};

export interface BadgeProps {
    children: React.ReactNode;
    variant?: BadgeVariant;
    icon?: LucideIcon;
    size?: 'sm' | 'md';
}

export function Badge({ children, variant = 'default', icon: Icon, size = 'sm' }: BadgeProps) {
    const sizeClasses = size === 'sm'
        ? 'px-2 py-0.5 text-xs'
        : 'px-2.5 py-1 text-xs';

    return (
        <span className={`inline-flex items-center gap-1 rounded-lg font-medium ${badgeClasses[variant]} ${sizeClasses}`}>
            {Icon && <Icon className="h-3.5 w-3.5" />}
            {children}
        </span>
    );
}

// ═══════════════════════════════════════════════════════════════════════════
// AVATAR COMPONENT
// ═══════════════════════════════════════════════════════════════════════════

export interface AvatarProps {
    name?: string;
    imageUrl?: string;
    size?: 'sm' | 'md' | 'lg';
    gradient?: string;
}

export function Avatar({
    name,
    imageUrl,
    size = 'md',
    gradient = 'from-primary-400 to-primary-600'
}: AvatarProps) {
    const sizeClasses = {
        sm: 'w-8 h-8 text-xs',
        md: 'w-10 h-10 text-sm',
        lg: 'w-12 h-12 text-base',
    };

    if (imageUrl) {
        return (
            <img
                src={imageUrl}
                alt={name || 'Avatar'}
                className={`${sizeClasses[size]} rounded-full object-cover`}
            />
        );
    }

    return (
        <div className={`${sizeClasses[size]} rounded-full bg-gradient-to-br ${gradient} flex items-center justify-center text-white font-bold`}>
            {name?.charAt(0) || '?'}
        </div>
    );
}

// ═══════════════════════════════════════════════════════════════════════════
// USER CELL COMPONENT
// ═══════════════════════════════════════════════════════════════════════════

export interface UserCellProps {
    name?: string;
    email?: string;
    imageUrl?: string;
    subtitle?: string;
}

export function UserCell({ name, email, imageUrl, subtitle }: UserCellProps) {
    return (
        <div className="flex items-center gap-3">
            <Avatar name={name} imageUrl={imageUrl} />
            <div>
                <p className="text-sm font-medium text-gray-900 dark:text-white">
                    {name || 'غير محدد'}
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                    {subtitle || email}
                </p>
            </div>
        </div>
    );
}

// ═══════════════════════════════════════════════════════════════════════════
// STATUS INDICATOR
// ═══════════════════════════════════════════════════════════════════════════

export interface StatusIndicatorProps {
    status: 'online' | 'offline' | 'busy' | 'away';
    size?: 'sm' | 'md';
    showLabel?: boolean;
}

const statusLabels = {
    online: 'متصل',
    offline: 'غير متصل',
    busy: 'مشغول',
    away: 'بعيد',
};

const statusColors = {
    online: 'bg-green-500',
    offline: 'bg-gray-400',
    busy: 'bg-red-500',
    away: 'bg-yellow-500',
};

export function StatusIndicator({ status, size = 'sm', showLabel = false }: StatusIndicatorProps) {
    const sizeClasses = size === 'sm' ? 'w-2 h-2' : 'w-3 h-3';

    return (
        <div className="flex items-center gap-1.5">
            <div className={`${sizeClasses} rounded-full ${statusColors[status]}`} />
            {showLabel && (
                <span className="text-xs text-gray-500 dark:text-gray-400">
                    {statusLabels[status]}
                </span>
            )}
        </div>
    );
}

// ═══════════════════════════════════════════════════════════════════════════
// ICON STAT
// ═══════════════════════════════════════════════════════════════════════════

export interface IconStatProps {
    icon: LucideIcon;
    value: number | string;
    label?: string;
}

export function IconStat({ icon: Icon, value, label }: IconStatProps) {
    return (
        <div className="flex items-center gap-1.5">
            <Icon className="h-4 w-4 text-gray-400" />
            <span className="text-sm font-medium text-gray-900 dark:text-white">
                {value}
            </span>
            {label && (
                <span className="text-xs text-gray-500 dark:text-gray-400">
                    {label}
                </span>
            )}
        </div>
    );
}

// ═══════════════════════════════════════════════════════════════════════════
// ACTION BUTTONS
// ═══════════════════════════════════════════════════════════════════════════

export interface ActionButtonProps {
    onClick: () => void;
    icon: LucideIcon;
    variant?: 'default' | 'danger' | 'success';
    disabled?: boolean;
    title?: string;
}

export function ActionButton({
    onClick,
    icon: Icon,
    variant = 'default',
    disabled = false,
    title
}: ActionButtonProps) {
    const variantClasses = {
        default: 'hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-500',
        danger: 'hover:bg-red-50 dark:hover:bg-red-900/20 text-red-500',
        success: 'hover:bg-green-50 dark:hover:bg-green-900/20 text-green-500',
    };

    return (
        <button
            onClick={onClick}
            disabled={disabled}
            title={title}
            className={`p-2 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${variantClasses[variant]}`}
        >
            <Icon className="h-4 w-4" />
        </button>
    );
}

export interface ActionButtonGroupProps {
    children: React.ReactNode;
}

export function ActionButtonGroup({ children }: ActionButtonGroupProps) {
    return <div className="flex gap-1">{children}</div>;
}
