/**
 * ╔══════════════════════════════════════════════════════════════════════════╗
 * ║                 DOMAIN REPOSITORIES - واجهات المستودعات                   ║
 * ╚══════════════════════════════════════════════════════════════════════════╝
 */

// Exam Repository
export type {
    IExamRepository,
    ExamFilters,
    ExamRepositoryStats,
    ExamRepositoryError
} from './IExamRepository';

// Question Repository
export type {
    IQuestionRepository,
    QuestionFilters,
    QuestionGroup,
    QuestionRepositoryStats,
    QuestionRepositoryError
} from './IQuestionRepository';
