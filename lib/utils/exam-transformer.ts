// Raw data interfaces for exam transformation
interface RawPoetryVerse {
    firstHalf?: string;
    secondHalf?: string;
}

interface RawOption {
    textAr?: string;
    textEn?: string;
    text?: string;
    isCorrect?: boolean;
}

interface RawQuestion {
    id?: string;
    type?: string;
    stem?: string;
    textAr?: string;
    textEn?: string;
    question?: string;
    options?: (string | RawOption)[];
    correctIndex?: number;
    points?: number;
    correctAnswerAr?: string;
    correctAnswerEn?: string;
    correctAnswer?: string | number;
    underlinedWord?: string;
    blankTextAr?: string;
    blankTextEn?: string;
    extractionTarget?: string;
    explanationAr?: string;
    explanationEn?: string;
    explanation?: string;
    text?: string;
}

interface RawSubsection {
    questions?: RawQuestion[];
}

interface RawBlock {
    id?: string;
    type?: string;
    contentType?: string;
    order?: number;
    title?: string;
    titleAr?: string;
    readingTitle?: string;
    poetryTitle?: string;
    genre?: string;
    bodyText?: string;
    readingText?: string;
    poemTitle?: string;
    poet?: string;
    verses?: { shatrA: string; shatrB: string }[];
    poetryVerses?: RawPoetryVerse[];
    contextText?: string;
    prompt?: string;
    questions?: RawQuestion[];
    subsections?: RawSubsection[];
}

interface RawExamData {
    id: string;
    type?: string;
    language?: string;
    exam_title?: string;
    exam_description?: string;
    total_marks?: number;
    duration_minutes?: number;
    blocks?: RawBlock[];
    is_published?: boolean;
    title?: string | { ar?: string; en?: string };
    description?: string | { ar?: string; en?: string };
    questions?: RawQuestion[];
}

interface RawSection {
    id: string;
    title?: string;
    questions?: RawQuestion[];
}

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
    sections?: RawSection[];
    isPublished: boolean;
}

export function transformExamData(examData: RawExamData, source: 'comprehensive' | 'template' = 'comprehensive'): ExamRunnerData {
    if (source === 'comprehensive') {
        const rawBlocks = (examData.blocks || []) as RawBlock[];

        const blocks: ExamRunnerBlock[] = rawBlocks.map((block: RawBlock, blockIndex: number) => {
            let blockType: string = block.type || 'questions_only';
            if (!blockType && block.contentType) {
                if (block.contentType === 'reading') blockType = 'reading_passage';
                else if (block.contentType === 'poetry') blockType = 'poetry_text';
                else if (block.contentType === 'none') blockType = 'questions_only';
            }

            const hasReadingContent = block.readingText && block.readingText.trim().length > 0;
            const hasPoetryContent = block.poetryVerses && block.poetryVerses.some((v: RawPoetryVerse) => v.firstHalf?.trim() || v.secondHalf?.trim());
            const hasGrammarContent = block.contextText && block.contextText.trim().length > 0;
            const hasContent = !!(hasReadingContent || hasPoetryContent || hasGrammarContent);

            let verses = block.verses;
            if (!verses && block.poetryVerses) {
                verses = block.poetryVerses.map((v: RawPoetryVerse) => ({
                    shatrA: v.firstHalf || '',
                    shatrB: v.secondHalf || '',
                }));
            }

            let rawQuestions: RawQuestion[] = [...(block.questions || [])];
            if (block.subsections && Array.isArray(block.subsections)) {
                block.subsections.forEach((sub: RawSubsection) => {
                    if (sub.questions && Array.isArray(sub.questions)) {
                        rawQuestions = [...rawQuestions, ...sub.questions];
                    }
                });
            }

            const questions: ExamRunnerQuestion[] = rawQuestions.map((q: RawQuestion) => ({
                id: q.id || `q-${blockIndex}-${Math.random().toString(36).substr(2, 9)}`,
                type: q.type || 'mcq',
                stem: q.stem || q.textAr || q.textEn || q.question || '',
                options: (q.options || []).map((opt: string | RawOption, optIdx: number) => {
                    if (typeof opt === 'string') return opt;
                    return opt.textAr || opt.textEn || opt.text || `الخيار ${optIdx + 1}`;
                }),
                correctIndex: q.correctIndex ?? (q.options || []).findIndex((o: string | RawOption) => typeof o !== 'string' && o?.isCorrect) ?? 0,
                points: q.points || 1,
                correctAnswer: q.correctAnswerAr || q.correctAnswerEn || (typeof q.correctAnswer === 'string' ? q.correctAnswer : undefined),
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
            language: examData.language || 'arabic',
            examTitle: examData.exam_title || '',
            examDescription: examData.exam_description || '',
            totalMarks: examData.total_marks || 0,
            durationMinutes: examData.duration_minutes || 0,
            blocks: blocks,
            isPublished: examData.is_published ?? false,
        };
    } else {
        // Template support (legacy)
        const title = typeof examData.title === 'object'
            ? (examData.title as { ar?: string })?.ar || ''
            : examData.title || '';
        const description = typeof examData.description === 'object'
            ? (examData.description as { ar?: string })?.ar || ''
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
            questions: templateQuestions.map((q: RawQuestion, idx: number) => ({
                id: q.id || `q-${idx}`,
                type: 'mcq',
                stem: q.question || q.text || '',
                options: (q.options || []).map((opt: string | RawOption) => typeof opt === 'string' ? opt : opt.text || ''),
                correctIndex: typeof q.correctAnswer === 'number' ? q.correctAnswer : 0,
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
            durationMinutes: examData.duration_minutes || 0,
            blocks: blocks,
            isPublished: true,
        };
    }
}
