/**
 * Type definitions for questions and exams
 */

export interface MCQ {
  question: string;
  options: string[];
  correctAnswer: number;
}

export interface TranslationQuestion {
  originalText: string;
  translationDirection: "en-to-ar" | "ar-to-en";
  options: string[];
  correctAnswer: number;
}

export interface EssayQuestion {
  question: string;
  modelAnswer?: string;
}

export interface ExtractionQuestion {
  type: string;
  question: string;
  answer: string;
}

export interface ShortEssayQuestion {
  question: string;
  answer: string;
}

export interface GrammarQuestion {
  word: string;
  grammar: string;
  color: string;
}

export interface SubSection {
  arabicText?: string;
  essayRequirement?: string;
  multipleChoiceQuestions?: MCQ[];
  extractionQuestions?: ExtractionQuestion[];
  shortEssayQuestions?: ShortEssayQuestion[];
}

export interface QuestionData {
  arabicText?: string;
  essayRequirement?: string;
  mainQuestion?: string;
  readingPassage?: string;
  multipleChoiceQuestions?: MCQ[];
  extractionQuestions?: ExtractionQuestion[];
  shortEssayQuestions?: ShortEssayQuestion[];
  translationQuestions?: TranslationQuestion[];
  essayQuestions?: EssayQuestion[];
  grammarQuestions?: GrammarQuestion[];
  sections?: SubSection[];
}

export interface ExamSection {
  id: string;
  templateType: string;
  questionId: string;
  note?: string;
  questionData?: QuestionData;
}

export interface ExamData {
  examTitle?: string;
  examDescription?: string;
  durationMinutes?: number;
  passingScore?: number;
  sections?: ExamSection[];
}

export interface Question {
  id: string;
  lessonId: string;
  language: "arabic" | "english";
  type: string;
  questionTitle?: string;
  questionSubtitle?: string;
  arabicText?: string;
  essayRequirement?: string;
  mainQuestion?: string;
  readingPassage?: string;
  multipleChoiceQuestions?: MCQ[];
  extractionQuestions?: ExtractionQuestion[];
  shortEssayQuestions?: ShortEssayQuestion[];
  translationQuestions?: TranslationQuestion[];
  essayQuestions?: EssayQuestion[];
  grammarQuestions?: GrammarQuestion[];
  sections?: SubSection[];
}

/**
 * Type guards
 */
export function isMCQ(obj: unknown): obj is MCQ {
  return (
    typeof obj === "object" &&
    obj !== null &&
    "question" in obj &&
    "options" in obj &&
    "correctAnswer" in obj &&
    typeof (obj as MCQ).question === "string" &&
    Array.isArray((obj as MCQ).options) &&
    typeof (obj as MCQ).correctAnswer === "number"
  );
}

export function isTranslationQuestion(obj: unknown): obj is TranslationQuestion {
  return (
    typeof obj === "object" &&
    obj !== null &&
    "originalText" in obj &&
    "translationDirection" in obj &&
    "options" in obj &&
    "correctAnswer" in obj &&
    typeof (obj as TranslationQuestion).originalText === "string" &&
    ((obj as TranslationQuestion).translationDirection === "en-to-ar" ||
      (obj as TranslationQuestion).translationDirection === "ar-to-en") &&
    Array.isArray((obj as TranslationQuestion).options) &&
    typeof (obj as TranslationQuestion).correctAnswer === "number"
  );
}

export function isEssayQuestion(obj: unknown): obj is EssayQuestion {
  return (
    typeof obj === "object" &&
    obj !== null &&
    "question" in obj &&
    typeof (obj as EssayQuestion).question === "string"
  );
}

export function isExtractionQuestion(obj: unknown): obj is ExtractionQuestion {
  return (
    typeof obj === "object" &&
    obj !== null &&
    "question" in obj &&
    "answer" in obj &&
    typeof (obj as ExtractionQuestion).question === "string" &&
    typeof (obj as ExtractionQuestion).answer === "string"
  );
}

export function isShortEssayQuestion(obj: unknown): obj is ShortEssayQuestion {
  return (
    typeof obj === "object" &&
    obj !== null &&
    "question" in obj &&
    "answer" in obj &&
    typeof (obj as ShortEssayQuestion).question === "string" &&
    typeof (obj as ShortEssayQuestion).answer === "string"
  );
}

export function isQuestionData(obj: unknown): obj is QuestionData {
  return (
    typeof obj === "object" &&
    obj !== null &&
    ("arabicText" in obj ||
      "essayRequirement" in obj ||
      "mainQuestion" in obj ||
      "readingPassage" in obj ||
      "multipleChoiceQuestions" in obj ||
      "extractionQuestions" in obj ||
      "shortEssayQuestions" in obj ||
      "translationQuestions" in obj ||
      "essayQuestions" in obj ||
      "grammarQuestions" in obj ||
      "sections" in obj)
  );
}

export function isExamData(obj: unknown): obj is ExamData {
  return (
    typeof obj === "object" &&
    obj !== null &&
    ("examTitle" in obj || "sections" in obj)
  );
}

export function isQuestion(obj: unknown): obj is Question {
  return (
    typeof obj === "object" &&
    obj !== null &&
    "id" in obj &&
    "lessonId" in obj &&
    "language" in obj &&
    "type" in obj &&
    typeof (obj as Question).id === "string" &&
    typeof (obj as Question).lessonId === "string" &&
    ((obj as Question).language === "arabic" ||
      (obj as Question).language === "english") &&
    typeof (obj as Question).type === "string"
  );
}

/**
 * Arabic Comprehensive Exam Types
 */
export type BlockType = "reading_passage" | "poetry_text" | "grammar_block" | "expression_block";
export type QuestionType = "mcq" | "maqali" | "comparison_story" | "rhetoric" | "grammar_extraction";
export type BranchTag = "Naho" | "Adab" | "Balagha" | "Qiraa" | "Qesaa" | "Taraaib" | "TafkirNaqdi";

export interface Verse {
  shatrA: string;
  shatrB: string;
}

export interface BlockConstraints {
  maxLines?: number;
  minWords?: number;
  maxWords?: number;
}

export interface BaseExamQuestion {
  id: string;
  type: QuestionType;
  weight: number;
  branchTag?: BranchTag;
}

export interface MCQExamQuestion extends BaseExamQuestion {
  type: "mcq";
  stem: string;
  options: string[];
  correctIndex: number;
}

export interface MaqaliExamQuestion extends BaseExamQuestion {
  type: "maqali";
  prompt: string;
  modelAnswerKeywords?: string[];
}

export interface ComparisonStoryExamQuestion extends BaseExamQuestion {
  type: "comparison_story";
  prompt: string;
  externalSnippet: string;
  modelAnswerKeywords?: string[];
}

export interface RhetoricExamQuestion extends BaseExamQuestion {
  type: "rhetoric";
  prompt: string;
  correctAnswer?: string;
}

export interface GrammarExtractionExamQuestion extends BaseExamQuestion {
  type: "grammar_extraction";
  prompt: string;
  correctAnswer?: string;
}

export type ExamQuestion =
  | MCQExamQuestion
  | MaqaliExamQuestion
  | ComparisonStoryExamQuestion
  | RhetoricExamQuestion
  | GrammarExtractionExamQuestion;

export interface BaseExamBlock {
  id: string;
  type: BlockType;
  order: number;
  branchTag?: BranchTag;
  title?: string;
  questions?: ExamQuestion[];
}

export interface ReadingExamBlock extends BaseExamBlock {
  type: "reading_passage";
  genre: "Scientific" | "Literary";
  bodyText: string;
}

export interface PoetryExamBlock extends BaseExamBlock {
  type: "poetry_text";
  poemTitle?: string;
  poet?: string;
  verses: Verse[];
}

export interface GrammarExamBlock extends BaseExamBlock {
  type: "grammar_block";
  contextText?: string;
}

export interface ExpressionExamBlock extends BaseExamBlock {
  type: "expression_block";
  variant: "functional" | "creative";
  prompt: string;
  constraints?: BlockConstraints;
}

export type ExamBlock = ReadingExamBlock | PoetryExamBlock | GrammarExamBlock | ExpressionExamBlock;

/**
 * Extended ExamData with blocks support
 */
export interface ComprehensiveExamData extends ExamData {
  type?: "arabic_comprehensive_exam" | "english_comprehensive_exam" | "multi_template_exam";
  blocks?: ExamBlock[];
  sections?: ExamSection[];
}

/**
 * Section with question data for admin pages
 */
export interface SectionWithQuestionData {
  id: string;
  templateType?: string;
  questionId?: string;
  note?: string;
  questionData?: QuestionData;
  sections?: SubSection[];
}

/**
 * Extended QuestionWithId for admin pages with exam properties
 */
export interface QuestionWithExamProperties extends Omit<QuestionData, 'sections'> {
  id: string;
  examTitle?: string;
  examDescription?: string;
  durationMinutes?: number;
  passingScore?: number;
  sections?: SectionWithQuestionData[];
  mainQuestion?: string;
  questionTitle?: string;
  questionSubtitle?: string;
  readingPassage?: string;
  multipleChoiceQuestions?: MCQ[];
  extractionQuestions?: ExtractionQuestion[];
  shortEssayQuestions?: ShortEssayQuestion[];
  translationQuestions?: TranslationQuestion[];
  essayQuestions?: EssayQuestion[];
  grammarQuestions?: GrammarQuestion[];
}

