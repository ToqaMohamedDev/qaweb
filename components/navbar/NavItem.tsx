'use client';

// =============================================
// NavItem - عنصر التنقل
// =============================================

import Link from 'next/link';
import { cn } from '@/lib/utils';
import type { NavItem as NavItemType } from './types';

interface NavItemProps {
    item: NavItemType;
    isActive: boolean;
}

export function NavItem({ item, isActive }: NavItemProps) {
    const Icon = item.icon;

    return (
        <Link
            href={item.href}
            aria-label={item.label}
            aria-current={isActive ? 'page' : undefined}
            className={cn(
                'flex items-center gap-2 px-4 py-2 rounded-full text-sm font-semibold transition-colors',
                isActive
                    ? 'bg-primary-500 text-white'
                    : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 hover:bg-gray-100 dark:hover:bg-[#252530]'
            )}
        >
            <Icon className={cn('h-4 w-4', isActive ? 'text-white' : '')} />
            <span>{item.label}</span>
        </Link>
    );
}
