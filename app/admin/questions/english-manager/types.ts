// Type definitions for English Question Manager

export type QuestionType = 
  | 'english_comprehensive' 
  | 'english_reading' 
  | 'english_translation' 
  | 'english_literature' 
  | 'english_essay';

// Common Interface for MCQs
export interface MCQ {
  id: string;
  question: string;
  options: string[]; // 4 strings
  correctAnswer: number; // 0-3
}

// 1. Comprehensive Data
export interface ComprehensiveData {
  multipleChoiceQuestions: MCQ[];
}

// 2. Reading Data
export interface ReadingData {
  readingPassage: string;
  multipleChoiceQuestions: MCQ[];
}

// 3. Translation Data
export interface TranslationItem {
  id: string;
  originalText: string;
  translationDirection: 'en-to-ar' | 'ar-to-en';
  options: string[];
  correctAnswer: number;
}

export interface TranslationData {
  translationQuestions: TranslationItem[];
}

// 4. Literature & Essay Data (Shared structure)
export interface EssayItem {
  id: string;
  question: string;
  modelAnswer?: string;
}

export interface EssayData {
  essayQuestions: EssayItem[];
}

// Union type for all specific data types
export type SpecificData = 
  | ComprehensiveData 
  | ReadingData 
  | TranslationData 
  | EssayData;

// Base data interface
export interface BaseData {
  lessonId: string;
  questionTitle: string;
  questionSubtitle: string;
}

