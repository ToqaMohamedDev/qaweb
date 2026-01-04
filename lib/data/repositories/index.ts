/**
 * ╔══════════════════════════════════════════════════════════════════════════╗
 * ║                    DATA REPOSITORIES - مستودعات البيانات                 ║
 * ║                                                                          ║
 * ║  Data Layer - تصدير موحد لجميع المستودعات                               ║
 * ╚══════════════════════════════════════════════════════════════════════════╝
 */

// ═══════════════════════════════════════════════════════════════════════════
// REPOSITORY EXPORTS
// ═══════════════════════════════════════════════════════════════════════════

export {
    SupabaseExamRepository,
    examRepository
} from './SupabaseExamRepository';

export {
    SupabaseQuestionRepository,
    questionRepository
} from './SupabaseQuestionRepository';
