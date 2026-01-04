import { ComprehensiveExam, ExamBlock, ExamQuestion } from '@/lib/types/exam';

export interface ExamRunnerBlock {
    id: string;
    type: string;
    order: number;
    hasContent: boolean;
    title: string;
    genre?: string;
    bodyText?: string; // For reading
    poemTitle?: string;
    poet?: string;
    verses?: { shatrA: string, shatrB: string }[];
    contextText?: string; // For grammar
    prompt?: string;
    questions: ExamRunnerQuestion[];
}

export interface ExamRunnerQuestion {
    id: string;
    type: string;
    stem: string;
    options: string[];
    correctIndex: number;
    points: number;
    correctAnswer?: string;
    underlinedWord?: string;
    blankText?: string;
    extractionTarget?: string;
    explanation?: string;
}

export interface ExamRunnerData {
    id: string;
    type: string;
    language: string;
    examTitle: string;
    examDescription: string;
    totalMarks: number;
    durationMinutes: number;
    blocks: ExamRunnerBlock[];
    /** For English exams that use sections instead of blocks */
    sections?: any[];
    isPublished: boolean;
}

export function transformExamData(examData: any, source: 'comprehensive' | 'template' = 'comprehensive'): ExamRunnerData {
    if (source === 'comprehensive') {
        const rawBlocks = (examData.blocks || []) as any[];

        const blocks: ExamRunnerBlock[] = rawBlocks.map((block: any, blockIndex: number) => {
            let blockType = block.type;
            if (!blockType && block.contentType) {
                if (block.contentType === 'reading') blockType = 'reading_passage';
                else if (block.contentType === 'poetry') blockType = 'poetry_text';
                else if (block.contentType === 'none') blockType = 'questions_only';
            }

            const hasReadingContent = block.readingText && block.readingText.trim().length > 0;
            const hasPoetryContent = block.poetryVerses && block.poetryVerses.some((v: any) => v.firstHalf?.trim() || v.secondHalf?.trim());
            const hasGrammarContent = block.contextText && block.contextText.trim().length > 0;
            const hasContent = !!(hasReadingContent || hasPoetryContent || hasGrammarContent);

            let verses = block.verses;
            if (!verses && block.poetryVerses) {
                verses = block.poetryVerses.map((v: any) => ({
                    shatrA: v.firstHalf || '',
                    shatrB: v.secondHalf || '',
                }));
            }

            let rawQuestions = [...(block.questions || [])];
            if (block.subsections && Array.isArray(block.subsections)) {
                block.subsections.forEach((sub: any) => {
                    if (sub.questions && Array.isArray(sub.questions)) {
                        rawQuestions = [...rawQuestions, ...sub.questions];
                    }
                });
            }

            const questions: ExamRunnerQuestion[] = rawQuestions.map((q: any) => ({
                id: q.id || `q-${blockIndex}-${Math.random().toString(36).substr(2, 9)}`,
                type: q.type || 'mcq',
                stem: q.stem || q.textAr || q.textEn || q.question || '',
                options: (q.options || []).map((opt: any, optIdx: number) => {
                    if (typeof opt === 'string') return opt;
                    return opt.textAr || opt.textEn || opt.text || `الخيار ${optIdx + 1}`;
                }),
                correctIndex: q.correctIndex ?? (q.options || []).findIndex((o: any) => o?.isCorrect) ?? 0,
                points: q.points || 1,
                correctAnswer: q.correctAnswerAr || q.correctAnswerEn || q.correctAnswer,
                underlinedWord: q.underlinedWord,
                blankText: q.blankTextAr || q.blankTextEn,
                extractionTarget: q.extractionTarget,
                explanation: q.explanationAr || q.explanationEn || q.explanation
            }));

            return {
                id: block.id || `block-${blockIndex}`,
                type: blockType,
                order: block.order ?? blockIndex,
                hasContent,
                title: block.title || block.titleAr || block.readingTitle || block.poetryTitle || '',
                genre: block.genre || 'Literary',
                bodyText: block.bodyText || block.readingText || '',
                poemTitle: block.poemTitle || block.poetryTitle || '',
                poet: block.poet || '',
                verses: verses || [],
                contextText: block.contextText || '',
                prompt: block.prompt || '',
                questions: questions,
            };
        });

        return {
            id: examData.id,
            type: examData.type || 'comprehensive',
            language: examData.language,
            examTitle: examData.exam_title,
            examDescription: examData.exam_description,
            totalMarks: examData.total_marks,
            durationMinutes: examData.duration_minutes,
            blocks: blocks,
            isPublished: examData.is_published,
        };
    } else {
        // Template support (legacy)
        const title = typeof examData.title === 'object'
            ? (examData.title as any)?.ar || ''
            : examData.title || '';
        const description = typeof examData.description === 'object'
            ? (examData.description as any)?.ar || ''
            : examData.description || '';

        const templateQuestions = examData.questions || [];
        const blocks: ExamRunnerBlock[] = templateQuestions.length > 0 ? [{
            id: 'main-block',
            type: 'reading_passage', // Default fallback
            hasContent: !!description,
            title: title,
            genre: 'Literary',
            bodyText: description || '',
            order: 0,
            questions: templateQuestions.map((q: any, idx: number) => ({
                id: q.id || `q-${idx}`,
                type: 'mcq',
                stem: q.question || q.text || '',
                options: q.options || [],
                correctIndex: q.correctAnswer || 0,
                points: q.points || 1,
            }))
        } as ExamRunnerBlock] : [];

        return {
            id: examData.id,
            type: 'template',
            language: 'arabic', // Default
            examTitle: title,
            examDescription: description,
            totalMarks: templateQuestions.length,
            durationMinutes: examData.duration_minutes,
            blocks: blocks,
            isPublished: true,
        };
    }
}
