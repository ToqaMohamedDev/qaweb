/**
 * ╔══════════════════════════════════════════════════════════════════════════╗
 * ║                    DOMAIN USE CASES - حالات الاستخدام                     ║
 * ╚══════════════════════════════════════════════════════════════════════════╝
 */

// Create Exam
export { CreateExamUseCase } from './CreateExam';
export type {
    CreateExamInput,
    CreateExamOutput,
    CreateExamError
} from './CreateExam';

// Submit Answer
export { SubmitAnswerUseCase } from './SubmitAnswer';
export type {
    SubmitAnswerInput,
    SubmitAnswerOutput,
    SubmitAnswerError
} from './SubmitAnswer';

// Calculate Score
export { CalculateScoreUseCase, formatScore, formatTime, getResultMessage } from './CalculateScore';
export type {
    CalculateScoreInput,
    CalculateScoreOutput,
    CalculateScoreError,
    QuestionAnswer,
    QuestionResult
} from './CalculateScore';
