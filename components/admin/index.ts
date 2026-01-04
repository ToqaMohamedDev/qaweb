// =============================================
// Admin Components Exports
// تصدير جميع مكونات لوحة التحكم
// =============================================

// ═══════════════════════════════════════════════════════════════════════════
// Device & Visitor Components
// ═══════════════════════════════════════════════════════════════════════════

export { default as UserDevicesList } from './UserDevicesList';
export { default as VisitorDevicesList } from './VisitorDevicesList';

// ═══════════════════════════════════════════════════════════════════════════
// Types
// ═══════════════════════════════════════════════════════════════════════════

export type {
    DashboardStats,
    RecentUser,
    RecentExam,
    ActivityItem,
    QuickAction,
    StatCardProps,
    MiniStatItem,
} from './types';

// ═══════════════════════════════════════════════════════════════════════════
// Dashboard Widgets
// ═══════════════════════════════════════════════════════════════════════════

export { MiniChart } from './MiniChart';
export { ProgressRing } from './ProgressRing';
export { StatCardAdvanced } from './StatCardAdvanced';
export { QuickActionCard } from './QuickActionCard';
export { RecentUsersTable } from './RecentUsersTable';
export { ActivityFeed } from './ActivityFeed';

// ═══════════════════════════════════════════════════════════════════════════
// Modal Components
// ═══════════════════════════════════════════════════════════════════════════

export { DeleteConfirmModal } from './DeleteConfirmModal';

// ═══════════════════════════════════════════════════════════════════════════
// Utility Functions
// ═══════════════════════════════════════════════════════════════════════════

export { getTimeAgo, getRoleBadge, formatNumber, calculatePercentage } from './utils';

// ═══════════════════════════════════════════════════════════════════════════
// Shared Admin Components - مكونات Admin المشتركة
// ═══════════════════════════════════════════════════════════════════════════

export {
    // Layout Components
    AdminPageHeader,
    AdminStatsGrid,

    // Filter & Search Components
    AdminFilters,

    // Table Components
    AdminTable,
    AdminPagination,

    // State Components
    AdminLoadingState,
    AdminErrorState,

    // Modal Components
    AdminModal,

    // Form Components
    FormField,
    CheckboxField,
    FormSection,

    // Action Components (Admin-specific)
    AdminActionButton,
    AdminTableActions,
    EditButton,
    DeleteButton,
    ViewButton,
    ApproveButton,
    RejectButton,
    AdminStatusBadge,
    AdminUserCell,
} from './shared';

export type {
    // Layout Types
    AdminPageHeaderProps,
    AdminPageHeaderAction,
    StatItem,
    AdminStatsGridProps,

    // Filter Types
    AdminFiltersProps,
    FilterOption,
    SelectFilter,

    // Table Types
    Column,
    AdminTableProps,
    AdminPaginationProps,

    // State Types
    AdminLoadingStateProps,
    AdminErrorStateProps,

    // Modal Types
    AdminModalProps,

    // Form Types
    FormFieldProps,
    CheckboxFieldProps,
    FormSectionProps,

    // Action Types
    AdminActionButtonProps,
    AdminTableActionsProps,
    AdminStatusBadgeProps,
    AdminUserCellProps,
} from './shared';
