/**
 * ╔══════════════════════════════════════════════════════════════════════════╗
 * ║                    EXAM COMPONENTS - مكونات الامتحانات                    ║
 * ║                                                                          ║
 * ║  تصدير موحد لجميع مكونات الامتحانات                                      ║
 * ╚══════════════════════════════════════════════════════════════════════════╝
 */

export { ExamCard, type ExamCardProps } from './ExamCard';
export { ExamList, type ExamListProps, type ExamData } from './ExamList';
export { UnifiedExamPlayer, type UnifiedExamPlayerProps, type ExamResults, type ExamBlock, type ExamQuestion } from './UnifiedExamPlayer';
export { ExamPlayerWithGrading } from './ExamPlayerWithGrading';
export { QuestionBankPlayer } from './QuestionBankPlayer';

// UI Components
export {
    ExamUI,
    ExamLoadingScreen,
    ExamErrorScreen,
    ExamEmptyScreen,
    ExamHeader,
    ExamPageNavigation,
    MCQOptions,
    TextAnswer,
    ExamFooter,
} from './ExamUI';

