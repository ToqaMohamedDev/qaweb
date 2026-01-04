// =============================================
// Components Exports - نقطة تصدير واحدة للمكونات
// =============================================

// UI Components
export { Button } from './Button';
export { Input } from './Input';
export { ThemeToggle } from './ThemeToggle';
export { ThemeProvider } from './ThemeProvider';

// Layout Components
export { Navbar } from './Navbar';
export { Footer } from './Footer';
export { NotificationDropdown } from './NotificationDropdown';
export { default as ChatWidget } from './ChatWidget';
export { VisitorTracker } from './VisitorTracker';
export { StructuredData } from './StructuredData';

// Re-export from subdirectories
// Note: We export from 'common' first, then specific exports from 'shared' to avoid conflicts
export * from './common';
export * from './home';
export * from './teachers';
export * from './admin';

// Export from shared with specific names to avoid conflicts with common
export {
    SubjectPage,
    LessonPageComponent,
    LoadingSpinner,
    PageLoading,
    // Skeleton already exported from common, so we rename it
    Skeleton as SharedSkeleton,
    CardSkeleton,
    TableSkeleton,
    // EmptyState already exported from common
    NoExamsFound,
    NoQuestionsFound,
    NoResultsFound,
    // ErrorBoundary already exported from common
    withErrorBoundary,
    ToastContainer,
    ConfirmDialog,
    // Form components
    FormInput,
    FormSelect,
    FormTextarea,
    FormWrapper,
    // Data components
    DataTable,
    DataCard,
    // Layout components
    PageHeader,
    PageContainer,
} from './shared';

// Exam Components
export * from './exam';

// Question Components
export * from './question';
