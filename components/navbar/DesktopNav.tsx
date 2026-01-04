'use client';

// =============================================
// DesktopNav - شريط التنقل للديسكتوب
// =============================================

import { NavItem } from './NavItem';
import { navItems } from './constants';

import { Shield } from 'lucide-react';

interface DesktopNavProps {
    activePaths: Set<string>;
    isUserAdmin?: boolean;
}

export function DesktopNav({ activePaths, isUserAdmin = false }: DesktopNavProps) {
    return (
        <div className="hidden md:flex items-center flex-1 justify-center">
            <div className="flex items-center gap-1 bg-white/90 dark:bg-[#1c1c24]/90 rounded-full px-2 py-1.5 border border-gray-200/80 dark:border-[#2e2e3a]/80 shadow-sm">
                {navItems.map((item) => (
                    <NavItem
                        key={item.href}
                        item={item}
                        isActive={activePaths.has(item.href)}
                    />
                ))}

                {isUserAdmin && (
                    <NavItem
                        key="/admin"
                        item={{ href: '/admin', label: 'لوحة التحكم', icon: Shield }}
                        isActive={activePaths.has('/admin')}
                    />
                )}
            </div>
        </div>
    );
}
