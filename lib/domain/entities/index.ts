/**
 * ╔══════════════════════════════════════════════════════════════════════════╗
 * ║                     DOMAIN ENTITIES - كيانات الأعمال                      ║
 * ╚══════════════════════════════════════════════════════════════════════════╝
 */

// Exam Entity
export { Exam, createExam } from './Exam';
export type { ExamStatus, ExamGrade, CreateExamParams } from './Exam';

// Question Entity
export { Question, createQuestion } from './Question';
export type {
    QuestionTypeName,
    QuestionMetadataType,
    AnswerResult,
    CreateQuestionParams
} from './Question';

// User Entity
export { User, createUser } from './User';
export type { UserRole, CreateUserParams } from './User';
