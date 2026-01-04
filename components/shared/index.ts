// =============================================
// Shared Components - مكونات مشتركة
// =============================================

export { SubjectPage } from './SubjectPage';
export { LessonPageComponent } from './LessonPage';

// UI Components
export { LoadingSpinner, PageLoading, Skeleton, CardSkeleton, TableSkeleton } from './LoadingSpinner';
export { EmptyState, NoExamsFound, NoQuestionsFound, NoResultsFound } from './EmptyState';
export { ErrorBoundary, withErrorBoundary } from './ErrorBoundary';
export { ToastContainer } from './ToastContainer';
export { ConfirmDialog } from './ConfirmDialog';

// Button Components
export { Button, IconButton, ButtonGroup, LinkButton, Buttons } from './Button';
export type { ButtonProps, IconButtonProps, ButtonGroupProps, LinkButtonProps } from './Button';

// ═══════════════════════════════════════════════════════════════════════════
// NEW - Form Components - مكونات النماذج
// ═══════════════════════════════════════════════════════════════════════════
export { FormInput, FormSelect, FormTextarea, FormWrapper } from './forms';
export type { FormInputProps, FormSelectProps, SelectOption, FormTextareaProps, FormWrapperProps } from './forms';

// ═══════════════════════════════════════════════════════════════════════════
// NEW - Data Components - مكونات البيانات
// ═══════════════════════════════════════════════════════════════════════════
export { DataTable, DataCard } from './data';
export type { Column, DataTableProps, DataCardProps } from './data';

// ═══════════════════════════════════════════════════════════════════════════
// NEW - Layout Components - مكونات التخطيط
// ═══════════════════════════════════════════════════════════════════════════
export { PageHeader, PageContainer } from './layout';
export type { PageHeaderProps, Breadcrumb, PageContainerProps } from './layout';

// ═══════════════════════════════════════════════════════════════════════════
// NEW - Advanced Form Components - مكونات النماذج المتقدمة
// ═══════════════════════════════════════════════════════════════════════════
export {
    Form,
    FormInput as AdvancedFormInput,
    FormSelect as AdvancedFormSelect,
    FormTextarea as AdvancedFormTextarea,
    FormCheckbox,
    FormRadioGroup,
    FormSwitch,
    FormFieldGroup,
    FormSection,
} from './Form';


