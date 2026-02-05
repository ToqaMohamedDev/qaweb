// ═══════════════════════════════════════════════════════════════════════════
// Dashboard Layout Types - أنواع Layout الموحد
// ═══════════════════════════════════════════════════════════════════════════

import { LucideIcon } from 'lucide-react';
import { ReactNode } from 'react';

export type DashboardRole = 'admin' | 'teacher';

export interface NavItem {
    href: string;
    label: string;
    icon: LucideIcon;
    badge?: number;
}

export interface NavSection {
    title: string;
    items: NavItem[];
}

export interface DashboardConfig {
    role: DashboardRole;
    title: string;
    subtitle: string;
    logo: LucideIcon;
    logoGradient: string;
    primaryColor: string;
    navItems: NavItem[] | NavSection[];
    homeHref: string;
    loginRedirect: string;
    allowedRoles: string[];
}

export interface DashboardLayoutProps {
    children: ReactNode;
    config: DashboardConfig;
}

export interface DashboardSidebarProps {
    config: DashboardConfig;
    isOpen: boolean;
    onClose: () => void;
}

export interface DashboardHeaderProps {
    config: DashboardConfig;
    onMenuClick: () => void;
}

export interface DashboardProtectionProps {
    children: ReactNode;
    config: DashboardConfig;
}

export interface UserInfo {
    id: string;
    email: string;
    name: string;
    role: string;
    avatar?: string;
}
