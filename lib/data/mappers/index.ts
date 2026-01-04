/**
 * ╔══════════════════════════════════════════════════════════════════════════╗
 * ║                        DATA MAPPERS - محولات البيانات                    ║
 * ╚══════════════════════════════════════════════════════════════════════════╝
 */

// Exam Mapper
export {
    mapDbRowToExam,
    mapExamToDbRow,
    mapDbRowsToExams
} from './ExamMapper';
export type { ExamDBRow } from './ExamMapper';

// Question Mapper
export {
    mapDbRowToQuestion,
    mapQuestionToDbRow,
    mapDbRowsToQuestions
} from './QuestionMapper';
export type { QuestionDBRow } from './QuestionMapper';
