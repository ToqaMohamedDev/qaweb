// =============================================
// Admin Shared Components Exports
// تصدير المكونات المشتركة لصفحات الإدارة
// =============================================

// ═══════════════════════════════════════════════════════════════════════════
// Layout Components
// ═══════════════════════════════════════════════════════════════════════════

export { AdminPageHeader } from './AdminPageHeader';
export type { AdminPageHeaderProps, AdminPageHeaderAction } from './AdminPageHeader';

export { AdminStatsGrid } from './AdminStatsGrid';
export type { StatItem, AdminStatsGridProps } from './AdminStatsGrid';

// ═══════════════════════════════════════════════════════════════════════════
// Filter & Search Components
// ═══════════════════════════════════════════════════════════════════════════

export { AdminFilters } from './AdminFilters';
export type { AdminFiltersProps, FilterOption, SelectFilter } from './AdminFilters';

// ═══════════════════════════════════════════════════════════════════════════
// Table Components
// ═══════════════════════════════════════════════════════════════════════════

export { AdminTable } from './AdminTable';
export type { Column, AdminTableProps } from './AdminTable';

export { AdminPagination } from './AdminPagination';
export type { AdminPaginationProps } from './AdminPagination';

// ═══════════════════════════════════════════════════════════════════════════
// State Components
// ═══════════════════════════════════════════════════════════════════════════

export { AdminLoadingState } from './AdminLoadingState';
export type { AdminLoadingStateProps } from './AdminLoadingState';

export { AdminErrorState } from './AdminErrorState';
export type { AdminErrorStateProps } from './AdminErrorState';

// ═══════════════════════════════════════════════════════════════════════════
// Modal Components
// ═══════════════════════════════════════════════════════════════════════════

export { AdminModal } from './AdminModal';
export type { AdminModalProps } from './AdminModal';

// ═══════════════════════════════════════════════════════════════════════════
// Form Components
// ═══════════════════════════════════════════════════════════════════════════

export { FormField, CheckboxField, FormSection } from './FormField';
export type { FormFieldProps, CheckboxFieldProps, FormSectionProps } from './FormField';

// ═══════════════════════════════════════════════════════════════════════════
// Action Components (Admin-specific, prefixed to avoid conflicts with common)
// ═══════════════════════════════════════════════════════════════════════════

export {
    AdminActionButton,
    AdminTableActions,
    EditButton,
    DeleteButton,
    ViewButton,
    ApproveButton,
    RejectButton,
    AdminStatusBadge,
    AdminUserCell,
} from './ActionButtons';

export type {
    AdminActionButtonProps,
    AdminTableActionsProps,
    AdminStatusBadgeProps,
    AdminUserCellProps,
} from './ActionButtons';
