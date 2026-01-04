// =============================================
// Button Components - مكونات الأزرار المشتركة
// =============================================

'use client';

import { ButtonHTMLAttributes, forwardRef, ReactNode } from 'react';
import { Loader2 } from 'lucide-react';

// ═══════════════════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════════════════

type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger' | 'success' | 'outline';
type ButtonSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
    variant?: ButtonVariant;
    size?: ButtonSize;
    isLoading?: boolean;
    leftIcon?: ReactNode;
    rightIcon?: ReactNode;
    fullWidth?: boolean;
}

// ═══════════════════════════════════════════════════════════════════════════
// STYLES
// ═══════════════════════════════════════════════════════════════════════════

const getVariantClasses = (variant: ButtonVariant) => {
    const variants: Record<ButtonVariant, string> = {
        primary: `
            bg-gradient-to-r from-violet-600 to-purple-600 
            hover:from-violet-700 hover:to-purple-700 
            text-white font-medium
            shadow-lg shadow-violet-500/25
            hover:shadow-xl hover:shadow-violet-500/30
            active:shadow-md
        `,
        secondary: `
            bg-gray-100 dark:bg-[#252530] 
            hover:bg-gray-200 dark:hover:bg-[#353545]
            text-gray-700 dark:text-gray-300 font-medium
            border border-gray-200 dark:border-[#2e2e3a]
        `,
        ghost: `
            bg-transparent hover:bg-gray-100 dark:hover:bg-[#252530]
            text-gray-700 dark:text-gray-300 font-medium
        `,
        danger: `
            bg-gradient-to-r from-red-500 to-red-600 
            hover:from-red-600 hover:to-red-700 
            text-white font-medium
            shadow-lg shadow-red-500/25
        `,
        success: `
            bg-gradient-to-r from-green-500 to-emerald-600 
            hover:from-green-600 hover:to-emerald-700 
            text-white font-medium
            shadow-lg shadow-green-500/25
        `,
        outline: `
            bg-transparent border-2 border-violet-500 dark:border-violet-400
            text-violet-600 dark:text-violet-400 font-medium
            hover:bg-violet-50 dark:hover:bg-violet-900/20
        `,
    };
    return variants[variant];
};

const getSizeClasses = (size: ButtonSize) => {
    const sizes: Record<ButtonSize, string> = {
        xs: 'px-2.5 py-1 text-xs rounded-lg gap-1',
        sm: 'px-3 py-1.5 text-sm rounded-lg gap-1.5',
        md: 'px-4 py-2 text-sm rounded-xl gap-2',
        lg: 'px-5 py-2.5 text-base rounded-xl gap-2',
        xl: 'px-6 py-3 text-lg rounded-2xl gap-2.5',
    };
    return sizes[size];
};

// ═══════════════════════════════════════════════════════════════════════════
// BUTTON COMPONENT
// ═══════════════════════════════════════════════════════════════════════════

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(({
    variant = 'primary',
    size = 'md',
    isLoading = false,
    leftIcon,
    rightIcon,
    fullWidth = false,
    disabled,
    className = '',
    children,
    ...props
}, ref) => {
    const isDisabled = disabled || isLoading;

    return (
        <button
            ref={ref}
            disabled={isDisabled}
            className={`
                inline-flex items-center justify-center
                transition-all duration-200 ease-out
                focus:outline-none focus:ring-2 focus:ring-violet-500 focus:ring-offset-2 dark:focus:ring-offset-[#1c1c24]
                disabled:opacity-60 disabled:cursor-not-allowed disabled:shadow-none
                ${getVariantClasses(variant)}
                ${getSizeClasses(size)}
                ${fullWidth ? 'w-full' : ''}
                ${className}
            `}
            {...props}
        >
            {isLoading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
            ) : leftIcon ? (
                <span className="flex-shrink-0">{leftIcon}</span>
            ) : null}

            {children && <span>{children}</span>}

            {rightIcon && !isLoading && (
                <span className="flex-shrink-0">{rightIcon}</span>
            )}
        </button>
    );
});

Button.displayName = 'Button';

// ═══════════════════════════════════════════════════════════════════════════
// ICON BUTTON
// ═══════════════════════════════════════════════════════════════════════════

interface IconButtonProps extends Omit<ButtonProps, 'leftIcon' | 'rightIcon' | 'children'> {
    icon: ReactNode;
    'aria-label': string;
}

export const IconButton = forwardRef<HTMLButtonElement, IconButtonProps>(({
    variant = 'ghost',
    size = 'md',
    isLoading = false,
    icon,
    disabled,
    className = '',
    ...props
}, ref) => {
    const isDisabled = disabled || isLoading;

    const sizeClasses: Record<ButtonSize, string> = {
        xs: 'p-1 rounded-md',
        sm: 'p-1.5 rounded-lg',
        md: 'p-2 rounded-xl',
        lg: 'p-2.5 rounded-xl',
        xl: 'p-3 rounded-2xl',
    };

    return (
        <button
            ref={ref}
            disabled={isDisabled}
            className={`
                inline-flex items-center justify-center
                transition-all duration-200 ease-out
                focus:outline-none focus:ring-2 focus:ring-violet-500 focus:ring-offset-2 dark:focus:ring-offset-[#1c1c24]
                disabled:opacity-60 disabled:cursor-not-allowed
                ${getVariantClasses(variant)}
                ${sizeClasses[size]}
                ${className}
            `}
            {...props}
        >
            {isLoading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
                icon
            )}
        </button>
    );
});

IconButton.displayName = 'IconButton';

// ═══════════════════════════════════════════════════════════════════════════
// BUTTON GROUP
// ═══════════════════════════════════════════════════════════════════════════

interface ButtonGroupProps {
    children: ReactNode;
    className?: string;
    attached?: boolean;
}

export function ButtonGroup({ children, className = '', attached = false }: ButtonGroupProps) {
    return (
        <div
            className={`
                inline-flex 
                ${attached ? '[&>*:not(:first-child)]:rounded-r-none [&>*:not(:last-child)]:rounded-l-none [&>*:not(:first-child)]:-mr-px' : 'gap-2'}
                ${className}
            `}
        >
            {children}
        </div>
    );
}

// ═══════════════════════════════════════════════════════════════════════════
// LINK BUTTON
// ═══════════════════════════════════════════════════════════════════════════

import Link from 'next/link';

interface LinkButtonProps extends Omit<ButtonProps, 'onClick'> {
    href: string;
    external?: boolean;
}

export function LinkButton({
    href,
    external = false,
    variant = 'primary',
    size = 'md',
    leftIcon,
    rightIcon,
    fullWidth = false,
    disabled,
    className = '',
    children,
}: LinkButtonProps) {
    const classes = `
        inline-flex items-center justify-center
        transition-all duration-200 ease-out
        ${disabled ? 'opacity-60 cursor-not-allowed pointer-events-none' : ''}
        ${getVariantClasses(variant)}
        ${getSizeClasses(size)}
        ${fullWidth ? 'w-full' : ''}
        ${className}
    `;

    if (external) {
        return (
            <a
                href={href}
                target="_blank"
                rel="noopener noreferrer"
                className={classes}
            >
                {leftIcon && <span className="flex-shrink-0">{leftIcon}</span>}
                {children && <span>{children}</span>}
                {rightIcon && <span className="flex-shrink-0">{rightIcon}</span>}
            </a>
        );
    }

    return (
        <Link href={href} className={classes}>
            {leftIcon && <span className="flex-shrink-0">{leftIcon}</span>}
            {children && <span>{children}</span>}
            {rightIcon && <span className="flex-shrink-0">{rightIcon}</span>}
        </Link>
    );
}

// ═══════════════════════════════════════════════════════════════════════════
// EXPORTS
// ═══════════════════════════════════════════════════════════════════════════

export const Buttons = {
    Button,
    IconButton,
    ButtonGroup,
    LinkButton,
};

export type { ButtonProps, IconButtonProps, ButtonGroupProps, LinkButtonProps };
