// =============================================
// Teachers Components Exports
// تصدير جميع مكونات المعلمين
// =============================================

// ═══════════════════════════════════════════════════════════════════════════
// Grid & Card Components
// ═══════════════════════════════════════════════════════════════════════════

export { TeacherCard } from './TeacherCard';
export type { TeacherCardProps } from './TeacherCard';

export { TeacherGrid } from './TeacherGrid';
export type { TeacherGridProps } from './TeacherGrid';

// ═══════════════════════════════════════════════════════════════════════════
// Sidebar Components
// ═══════════════════════════════════════════════════════════════════════════

export { TeacherSidebar, SidebarLink } from './TeacherSidebar';
export type { TeacherSidebarProps, SidebarLinkProps } from './TeacherSidebar';

// ═══════════════════════════════════════════════════════════════════════════
// Teacher Profile Components
// ═══════════════════════════════════════════════════════════════════════════

export {
    TabButton,
    TeacherExamCard,
    TeacherHeader,
    AboutTab,
    ExamsTab,
} from './TeacherProfileComponents';

export type {
    Teacher as TeacherProfile,
    Exam as TeacherExam,
    TabButtonProps,
    TeacherExamCardProps,
    TeacherHeaderProps,
    AboutTabProps,
    ExamsTabProps,
} from './TeacherProfileComponents';

// ═══════════════════════════════════════════════════════════════════════════
// Teacher Analytics Components
// ═══════════════════════════════════════════════════════════════════════════

export { TeacherAnalytics } from './TeacherAnalytics';

