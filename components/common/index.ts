// =============================================
// Common Components Exports
// =============================================

export { SearchBar } from './SearchBar';
export { CategoryDropdown } from './CategoryDropdown';
export {
    Skeleton,
    TeacherCardSkeleton,
    TeacherGridSkeleton,
    TextSkeleton,
    AvatarSkeleton,
    ButtonSkeleton
} from './LoadingSkeleton';
export { EmptyState } from './EmptyState';
export { SectionHeader } from './SectionHeader';
export { ErrorBoundary, ErrorFallback, PageErrorBoundary, useErrorHandler } from './ErrorBoundary';
export { Avatar, AvatarGroup } from './Avatar';
export { ImageCropper } from './ImageCropper';
export { LikeButton } from './LikeButton';

// UI Patterns - أنماط الواجهة الشائعة
export {
    Badge,
    UserCell,
    StatusIndicator,
    IconStat,
    ActionButton,
    ActionButtonGroup,
} from './UIPatterns';
export type {
    BadgeProps,
    BadgeVariant,
    UserCellProps,
    StatusIndicatorProps,
    IconStatProps,
    ActionButtonProps,
    ActionButtonGroupProps,
} from './UIPatterns';

// Export types
export type { SearchBarProps } from './SearchBar';
export type { CategoryDropdownProps, CategoryOption } from './CategoryDropdown';
export type { SkeletonProps, TeacherGridSkeletonProps } from './LoadingSkeleton';
export type { EmptyStateProps } from './EmptyState';
export type { SectionHeaderProps } from './SectionHeader';
export type { AvatarProps, AvatarGroupProps, AvatarSize } from './Avatar';
export type { ImageCropperProps } from './ImageCropper';

