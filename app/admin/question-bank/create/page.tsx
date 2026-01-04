"use client";

import { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
    Save,
    X,
    Loader2,
    CheckCircle2,
    AlertTriangle,
    Trash2,
    Plus,
    BookOpen,
    FileText,
    Feather,
    GraduationCap,
    Layers,
    ChevronDown,
    ChevronUp,
    Copy,
    List,
    MessageSquare,
    Underline,
    PenLine,
    Search,
    Type,
} from "lucide-react";
import { supabase } from "@/lib/supabase";
import { logger } from "@/lib/utils/logger";

// ═══════════════════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════════════════

type ContentType = 'none' | 'reading' | 'poetry';
type QuestionType = 'mcq' | 'essay' | 'true_false' | 'parsing' | 'fill_blank' | 'extraction';
type Lang = 'ar' | 'en';

interface Stage { id: string; name: string; }
interface Subject { id: string; name: string; }
interface Lesson { id: string; title: string; }

interface PoetryVerse {
    id: string;
    firstHalf: string;
    secondHalf: string;
}

interface QuestionOption {
    textAr: string;
    textEn: string;
    isCorrect: boolean;
}

interface Question {
    id: string;
    type: QuestionType;
    textAr: string;
    textEn: string;
    options: QuestionOption[];
    hintAr: string;
    hintEn: string;
    explanationAr: string;
    explanationEn: string;
    difficulty: 'easy' | 'medium' | 'hard';
    points: number;
    // For parsing questions - the word to be parsed
    underlinedWord?: string;
    // For fill_blank questions - text with blanks marked as ___
    blankTextAr?: string;
    blankTextEn?: string;
    correctAnswerAr?: string;
    correctAnswerEn?: string;
    // For extraction questions - what to extract (e.g., "فعل مضارع", "اسم فاعل")
    extractionTarget?: string;
}

interface QuestionSection {
    id: string;
    sectionType: QuestionType; // نوع الأسئلة في هذا القسم
    titleAr: string;
    titleEn: string;
    questions: Question[];
}

// ═══════════════════════════════════════════════════════════════════════════
// TRANSLATIONS
// ═══════════════════════════════════════════════════════════════════════════

const t = {
    ar: {
        pageTitle: 'إضافة أسئلة للبنك',
        questionsIn: 'سؤال في',
        sections: 'قسم',
        cancel: 'إلغاء',
        save: 'حفظ الأسئلة',
        classification: 'التصنيف',
        stage: 'المرحلة',
        subject: 'المادة',
        lesson: 'الدرس',
        selectStage: 'اختر المرحلة...',
        selectSubject: 'اختر المادة...',
        selectLesson: 'اختر الدرس...',
        contentType: 'نوع المحتوى (اختياري)',
        noText: 'بدون نص',
        reading: 'نص قراءة',
        poetry: 'شعر',
        readingText: 'نص القراءة',
        textTitle: 'عنوان النص (اختياري)',
        writeText: 'اكتب النص هنا...',
        poetrySection: 'الأبيات الشعرية',
        poemTitle: 'عنوان القصيدة (اختياري)',
        verses: 'الأبيات',
        addVerse: 'إضافة بيت',
        verse: 'بيت',
        firstHalf: 'الشطر الأول...',
        secondHalf: 'الشطر الثاني...',
        questionSections: 'أقسام الأسئلة',
        addSection: 'إضافة قسم',
        sectionTitle: 'عنوان القسم...',
        question: 'سؤال',
        questions: 'أسئلة',
        mcq: 'اختيار متعدد',
        trueFalse: 'صح/خطأ',
        essay: 'مقالي',
        parsing: 'إعراب',
        fillBlank: 'أكمل',
        extraction: 'استخراج',
        newQuestion: 'سؤال جديد...',
        questionText: 'نص السؤال...',
        options: 'الخيارات',
        addOption: 'إضافة خيار',
        option: 'خيار',
        essayNote: 'سؤال مقالي - الطالب سيكتب إجابة نصية',
        parsingNote: 'أعرب ما تحته خط',
        parsingWord: 'الكلمة المراد إعرابها',
        parsingWordPlaceholder: 'اكتب الكلمة...',
        parsingContext: 'الجملة التي تحتوي على الكلمة',
        parsingContextPlaceholder: 'اكتب الجملة كاملة...',
        fillBlankNote: 'أكمل الفراغ التالي',
        fillBlankText: 'النص مع الفراغ',
        fillBlankPlaceholder: 'اكتب النص واستخدم ___ للفراغ...',
        correctAnswer: 'الإجابة الصحيحة',
        correctAnswerPlaceholder: 'اكتب الإجابة الصحيحة...',
        extractionNote: 'استخرج من النص',
        extractionTarget: 'المطلوب استخراجه',
        extractionTargetPlaceholder: 'مثال: فعل مضارع، اسم فاعل، خبر...',
        difficulty: 'الصعوبة',
        easy: 'سهل',
        medium: 'متوسط',
        hard: 'صعب',
        points: 'النقاط',
        explanation: 'الشرح',
        explainAnswer: 'شرح الإجابة...',
        selectLessonError: 'الرجاء اختيار الدرس',
        writeSectionTitle: 'الرجاء كتابة عنوان القسم',
        writeQuestionText: 'الرجاء كتابة نص السؤال',
        selectCorrectAnswer: 'الرجاء تحديد الإجابة الصحيحة',
        successMessage: 'تم إضافة الأسئلة بنجاح!',
        errorSaving: 'حدث خطأ أثناء الحفظ',
    },
    en: {
        pageTitle: 'Add Questions to Bank',
        questionsIn: 'questions in',
        sections: 'section',
        cancel: 'Cancel',
        save: 'Save Questions',
        classification: 'Classification',
        stage: 'Stage',
        subject: 'Subject',
        lesson: 'Lesson',
        selectStage: 'Select stage...',
        selectSubject: 'Select subject...',
        selectLesson: 'Select lesson...',
        contentType: 'Content Type (optional)',
        noText: 'No Text',
        reading: 'Reading',
        poetry: 'Poetry',
        readingText: 'Reading Text',
        textTitle: 'Text title (optional)',
        writeText: 'Write the text here...',
        poetrySection: 'Poetry Lines',
        poemTitle: 'Poem title (optional)',
        verses: 'Lines',
        addVerse: 'Add Line',
        verse: 'Line',
        firstHalf: 'Enter line...',
        secondHalf: '',
        questionSections: 'Question Sections',
        addSection: 'Add Section',
        sectionTitle: 'Section title...',
        question: 'Question',
        questions: 'questions',
        mcq: 'Multiple Choice',
        trueFalse: 'True/False',
        essay: 'Essay',
        parsing: 'Parsing',
        fillBlank: 'Fill Blank',
        extraction: 'Extraction',
        newQuestion: 'New question...',
        questionText: 'Question text...',
        options: 'Options',
        addOption: 'Add Option',
        option: 'Option',
        essayNote: 'Essay question - Student will write a text response',
        parsingNote: 'Parse the underlined word',
        parsingWord: 'Word to parse',
        parsingWordPlaceholder: 'Write the word...',
        parsingContext: 'Sentence containing the word',
        parsingContextPlaceholder: 'Write the full sentence...',
        fillBlankNote: 'Complete the blank',
        fillBlankText: 'Text with blank',
        fillBlankPlaceholder: 'Write text and use ___ for blank...',
        correctAnswer: 'Correct Answer',
        correctAnswerPlaceholder: 'Write the correct answer...',
        extractionNote: 'Extract from text',
        extractionTarget: 'What to extract',
        extractionTargetPlaceholder: 'Example: present verb, subject noun...',
        difficulty: 'Difficulty',
        easy: 'Easy',
        medium: 'Medium',
        hard: 'Hard',
        points: 'Points',
        explanation: 'Explanation',
        explainAnswer: 'Explain the answer...',
        selectLessonError: 'Please select a lesson',
        writeSectionTitle: 'Please write section title',
        writeQuestionText: 'Please write question text',
        selectCorrectAnswer: 'Please select the correct answer',
        successMessage: 'Questions added successfully!',
        errorSaving: 'Error saving questions',
    },
};

// ═══════════════════════════════════════════════════════════════════════════
// HELPERS
// ═══════════════════════════════════════════════════════════════════════════

const createEmptyQuestion = (type: QuestionType = 'mcq'): Question => ({
    id: `q-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
    type,
    textAr: '',
    textEn: '',
    options: type === 'mcq' ? [
        { textAr: '', textEn: '', isCorrect: true },
        { textAr: '', textEn: '', isCorrect: false },
        { textAr: '', textEn: '', isCorrect: false },
        { textAr: '', textEn: '', isCorrect: false },
    ] : type === 'true_false' ? [
        { textAr: 'صح', textEn: 'True', isCorrect: true },
        { textAr: 'خطأ', textEn: 'False', isCorrect: false },
    ] : [],
    hintAr: '',
    hintEn: '',
    explanationAr: '',
    explanationEn: '',
    difficulty: 'medium',
    points: 1,
    // New question type fields
    underlinedWord: '',
    blankTextAr: '',
    blankTextEn: '',
    correctAnswerAr: '',
    correctAnswerEn: '',
    extractionTarget: '',
});

// Map question types to section titles
const sectionTitles: Record<QuestionType, { ar: string; en: string }> = {
    mcq: { ar: 'أسئلة اختيار متعدد', en: 'Multiple Choice Questions' },
    true_false: { ar: 'أسئلة صح وخطأ', en: 'True/False Questions' },
    essay: { ar: 'أسئلة مقالية', en: 'Essay Questions' },
    parsing: { ar: 'أسئلة الإعراب', en: 'Parsing Questions' },
    fill_blank: { ar: 'أسئلة أكمل الفراغ', en: 'Fill in the Blank Questions' },
    extraction: { ar: 'أسئلة الاستخراج', en: 'Extraction Questions' },
};

const createEmptySection = (type: QuestionType): QuestionSection => ({
    id: `sec-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
    sectionType: type,
    titleAr: sectionTitles[type].ar,
    titleEn: sectionTitles[type].en,
    questions: [createEmptyQuestion(type)],
});

const createEmptyVerse = (): PoetryVerse => ({
    id: `verse-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
    firstHalf: '',
    secondHalf: '',
});

// ═══════════════════════════════════════════════════════════════════════════
// MAIN COMPONENT
// ═══════════════════════════════════════════════════════════════════════════

export default function CreateQuestionsPage() {
    const router = useRouter();

    // ─── Language State ───
    const [lang, setLang] = useState<Lang>('ar');
    const labels = useMemo(() => t[lang], [lang]);
    const isRTL = lang === 'ar';

    // ─── Context State ───
    const [stages, setStages] = useState<Stage[]>([]);
    const [subjects, setSubjects] = useState<Subject[]>([]);
    const [lessons, setLessons] = useState<Lesson[]>([]);
    const [selectedStage, setSelectedStage] = useState('');
    const [selectedSubject, setSelectedSubject] = useState('');
    const [selectedLesson, setSelectedLesson] = useState('');

    // ─── Content State ───
    const [contentType, setContentType] = useState<ContentType>('none');
    const [readingTitle, setReadingTitle] = useState('');
    const [readingText, setReadingText] = useState('');
    const [poetryTitle, setPoetryTitle] = useState('');
    const [poetryVerses, setPoetryVerses] = useState<PoetryVerse[]>([createEmptyVerse(), createEmptyVerse()]);

    // ─── Sections State ───
    const [sections, setSections] = useState<QuestionSection[]>([]);
    const [expandedSectionId, setExpandedSectionId] = useState<string | null>(null);
    const [expandedQuestionId, setExpandedQuestionId] = useState<string | null>(null);

    // ─── UI State ───
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');
    const [successMessage, setSuccessMessage] = useState('');

    // ═══════════════════════════════════════════════════════════════════════
    // DATA FETCHING
    // ═══════════════════════════════════════════════════════════════════════

    useEffect(() => { fetchStages(); }, []);
    useEffect(() => {
        if (selectedStage) fetchSubjects();
        else { setSubjects([]); setSelectedSubject(''); }
    }, [selectedStage]);
    useEffect(() => {
        if (selectedStage && selectedSubject) fetchLessons();
        else { setLessons([]); setSelectedLesson(''); }
    }, [selectedStage, selectedSubject]);

    const fetchStages = async () => {
        const { data } = await supabase.from('educational_stages').select('id, name').order('created_at');
        setStages(data || []);
    };

    const fetchSubjects = async () => {
        const { data } = await supabase.from('subjects').select('id, name').eq('is_active', true).order('order_index');
        setSubjects(data || []);
    };

    const fetchLessons = async () => {
        const { data } = await supabase.from('lessons').select('id, title')
            .eq('subject_id', selectedSubject).eq('stage_id', selectedStage).order('order_index');
        setLessons(data || []);
    };

    // ═══════════════════════════════════════════════════════════════════════
    // HANDLERS
    // ═══════════════════════════════════════════════════════════════════════

    const addVerse = () => setPoetryVerses([...poetryVerses, createEmptyVerse()]);
    const removeVerse = (id: string) => {
        if (poetryVerses.length <= 1) return;
        setPoetryVerses(poetryVerses.filter(v => v.id !== id));
    };
    const updateVerse = (id: string, field: 'firstHalf' | 'secondHalf', value: string) => {
        setPoetryVerses(poetryVerses.map(v => v.id === id ? { ...v, [field]: value } : v));
    };

    const addSection = (type: QuestionType) => {
        const newSection = createEmptySection(type);
        setSections([...sections, newSection]);
        setExpandedSectionId(newSection.id);
    };

    const removeSection = (id: string) => {
        if (sections.length <= 1) return;
        setSections(sections.filter(s => s.id !== id));
    };

    const updateSectionTitle = (id: string, value: string) => {
        const field = lang === 'ar' ? 'titleAr' : 'titleEn';
        setSections(sections.map(s => s.id === id ? { ...s, [field]: value } : s));
    };

    const addQuestion = (sectionId: string, type: QuestionType = 'mcq') => {
        const newQ = createEmptyQuestion(type);
        setSections(sections.map(s =>
            s.id === sectionId ? { ...s, questions: [...s.questions, newQ] } : s
        ));
        setExpandedQuestionId(newQ.id);
    };

    const removeQuestion = (sectionId: string, questionId: string) => {
        setSections(sections.map(s => {
            if (s.id !== sectionId || s.questions.length <= 1) return s;
            return { ...s, questions: s.questions.filter(q => q.id !== questionId) };
        }));
    };

    const duplicateQuestion = (sectionId: string, questionId: string) => {
        setSections(sections.map(s => {
            if (s.id !== sectionId) return s;
            const qIndex = s.questions.findIndex(q => q.id === questionId);
            if (qIndex === -1) return s;
            const newQ = { ...s.questions[qIndex], id: `q-${Date.now()}` };
            const updated = [...s.questions];
            updated.splice(qIndex + 1, 0, newQ);
            return { ...s, questions: updated };
        }));
    };

    const updateQuestionText = (sectionId: string, questionId: string, value: string) => {
        const field = lang === 'ar' ? 'textAr' : 'textEn';
        setSections(sections.map(s => {
            if (s.id !== sectionId) return s;
            return {
                ...s,
                questions: s.questions.map(q => q.id === questionId ? { ...q, [field]: value } : q)
            };
        }));
    };

    const updateQuestionField = (sectionId: string, questionId: string, field: keyof Question, value: any) => {
        setSections(sections.map(s => {
            if (s.id !== sectionId) return s;
            return {
                ...s,
                questions: s.questions.map(q => q.id === questionId ? { ...q, [field]: value } : q)
            };
        }));
    };

    const updateQuestionExplanation = (sectionId: string, questionId: string, value: string) => {
        const field = lang === 'ar' ? 'explanationAr' : 'explanationEn';
        setSections(sections.map(s => {
            if (s.id !== sectionId) return s;
            return {
                ...s,
                questions: s.questions.map(q => q.id === questionId ? { ...q, [field]: value } : q)
            };
        }));
    };

    const updateQuestionOption = (sectionId: string, questionId: string, optionIndex: number, field: 'text' | 'isCorrect', value: string | boolean) => {
        const textField = lang === 'ar' ? 'textAr' : 'textEn';
        setSections(sections.map(s => {
            if (s.id !== sectionId) return s;
            return {
                ...s,
                questions: s.questions.map(q => {
                    if (q.id !== questionId) return q;
                    const updatedOptions = [...q.options];
                    if (field === 'isCorrect' && value === true) {
                        updatedOptions.forEach((o, i) => { o.isCorrect = i === optionIndex; });
                    } else if (field === 'text') {
                        updatedOptions[optionIndex] = { ...updatedOptions[optionIndex], [textField]: value };
                    }
                    return { ...q, options: updatedOptions };
                })
            };
        }));
    };

    const addOptionToQuestion = (sectionId: string, questionId: string) => {
        setSections(sections.map(s => {
            if (s.id !== sectionId) return s;
            return {
                ...s,
                questions: s.questions.map(q => {
                    if (q.id !== questionId || q.options.length >= 8) return q;
                    return { ...q, options: [...q.options, { textAr: '', textEn: '', isCorrect: false }] };
                })
            };
        }));
    };

    const removeOptionFromQuestion = (sectionId: string, questionId: string, optionIndex: number) => {
        setSections(sections.map(s => {
            if (s.id !== sectionId) return s;
            return {
                ...s,
                questions: s.questions.map(q => {
                    if (q.id !== questionId || q.options.length <= 2) return q;
                    return { ...q, options: q.options.filter((_, i) => i !== optionIndex) };
                })
            };
        }));
    };

    // ═══════════════════════════════════════════════════════════════════════
    // SAVE HANDLER
    // ═══════════════════════════════════════════════════════════════════════

    const handleSave = async () => {
        if (!selectedLesson) {
            setError(labels.selectLessonError);
            return;
        }

        for (let i = 0; i < sections.length; i++) {
            const section = sections[i];
            if (!section.titleAr.trim() && !section.titleEn.trim()) {
                setError(`${labels.writeSectionTitle} ${i + 1}`);
                return;
            }
            for (let j = 0; j < section.questions.length; j++) {
                const q = section.questions[j];
                if (!q.textAr.trim() && !q.textEn.trim()) {
                    setError(`${labels.writeQuestionText} ${i + 1}-${j + 1}`);
                    return;
                }
                if ((q.type === 'mcq' || q.type === 'true_false') && !q.options.some(o => o.isCorrect)) {
                    setError(`${labels.selectCorrectAnswer} ${i + 1}-${j + 1}`);
                    return;
                }
            }
        }

        setIsLoading(true);
        setError('');

        try {
            let contentMeta = null;
            if (contentType === 'reading') {
                contentMeta = { type: 'reading', title: readingTitle.trim(), text: readingText.trim() };
            } else if (contentType === 'poetry') {
                contentMeta = {
                    type: 'poetry',
                    title: poetryTitle.trim(),
                    verses: poetryVerses.filter(v => v.firstHalf.trim() || v.secondHalf.trim()).map(v => ({
                        first: v.firstHalf.trim(),
                        second: v.secondHalf.trim(),
                    })),
                };
            }

            // إنشاء معرف فريد لهذه المجموعة من الأسئلة
            const batchGroupId = `grp-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

            const allQuestions: any[] = [];
            let orderIndex = 0;

            sections.forEach(section => {
                section.questions.forEach(q => {
                    const correctIndex = q.options.findIndex(o => o.isCorrect);

                    // Determine if this question type has options
                    const hasOptions = q.type === 'mcq' || q.type === 'true_false';

                    const questionPayload: any = {
                        lesson_id: selectedLesson,
                        group_id: batchGroupId, // معرف فريد لهذه المجموعة
                        stage_id: selectedStage || null,
                        subject_id: selectedSubject || null,
                        section_title: { ar: section.titleAr.trim(), en: section.titleEn.trim() },
                        text: { ar: q.textAr.trim(), en: q.textEn.trim() },
                        type: q.type === 'true_false' ? 'truefalse' : q.type,
                        options: hasOptions ? q.options.map(o => ({
                            text: o.textAr || o.textEn,
                            textAr: o.textAr,
                            textEn: o.textEn,
                            isCorrect: o.isCorrect
                        })) : [],
                        correct_option_id: hasOptions ? String(correctIndex) : null,
                        correct_answer: hasOptions
                            ? { value: correctIndex }
                            : (q.type === 'fill_blank' || q.type === 'extraction' || q.type === 'parsing')
                                ? { ar: q.correctAnswerAr?.trim() || '', en: q.correctAnswerEn?.trim() || '' }
                                : null,
                        difficulty: q.difficulty,
                        points: q.points,
                        order_index: orderIndex++,
                        hint: { ar: q.hintAr.trim(), en: q.hintEn.trim() },
                        explanation: { ar: q.explanationAr.trim(), en: q.explanationEn.trim() },
                        media: contentMeta ? { content: contentMeta } : null,
                        is_active: true,
                        // New fields for special question types
                        metadata: {
                            ...(q.type === 'parsing' && { underlinedWord: q.underlinedWord?.trim() || '' }),
                            ...(q.type === 'fill_blank' && {
                                blankText: { ar: q.blankTextAr?.trim() || '', en: q.blankTextEn?.trim() || '' }
                            }),
                            ...(q.type === 'extraction' && { extractionTarget: q.extractionTarget?.trim() || '' }),
                        },
                    };
                    allQuestions.push(questionPayload);
                });
            });

            const { error: insertError } = await supabase.from('lesson_questions').insert(allQuestions);
            if (insertError) throw insertError;

            setSuccessMessage(labels.successMessage);
            setTimeout(() => router.push('/admin/question-bank'), 2000);
        } catch (err: any) {
            logger.error('Error saving questions', { context: 'CreateQuestions', data: err });
            setError(err?.message || labels.errorSaving);
        } finally {
            setIsLoading(false);
        }
    };

    const totalQuestions = sections.reduce((sum, s) => sum + s.questions.length, 0);
    const getQuestionText = (q: Question) => lang === 'ar' ? (q.textAr || q.textEn) : (q.textEn || q.textAr);
    const getSectionTitle = (s: QuestionSection) => lang === 'ar' ? (s.titleAr || s.titleEn) : (s.titleEn || s.titleAr);
    const getOptionText = (o: QuestionOption) => lang === 'ar' ? (o.textAr || o.textEn) : (o.textEn || o.textAr);

    // ═══════════════════════════════════════════════════════════════════════
    // RENDER
    // ═══════════════════════════════════════════════════════════════════════

    return (
        <div className="max-w-5xl mx-auto space-y-6 pb-20" dir={isRTL ? 'rtl' : 'ltr'}>
            {/* Header */}
            <div className="flex items-center justify-between sticky top-0 z-20 bg-gray-50/90 dark:bg-[#13131a]/90 backdrop-blur-md py-4 -mx-4 px-4 border-b border-gray-200 dark:border-gray-800">
                <div className="flex items-center gap-3">
                    <div className="p-3 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 shadow-lg">
                        <Layers className="h-6 w-6 text-white" />
                    </div>
                    <div>
                        <h1 className="text-xl font-bold text-gray-900 dark:text-gray-100">{labels.pageTitle}</h1>
                        <p className="text-sm text-gray-500">{totalQuestions} {labels.questionsIn} {sections.length} {labels.sections}</p>
                    </div>
                </div>

                <div className="flex items-center gap-2">
                    {/* Language Toggle */}
                    <div className="flex items-center bg-gray-100 dark:bg-gray-800 rounded-xl p-1">
                        <button
                            onClick={() => setLang('ar')}
                            className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all ${lang === 'ar'
                                ? 'bg-white dark:bg-gray-700 text-indigo-600 shadow-md'
                                : 'text-gray-500 hover:text-gray-700'
                                }`}
                        >
                            العربية
                        </button>
                        <button
                            onClick={() => setLang('en')}
                            className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all ${lang === 'en'
                                ? 'bg-white dark:bg-gray-700 text-indigo-600 shadow-md'
                                : 'text-gray-500 hover:text-gray-700'
                                }`}
                        >
                            English
                        </button>
                    </div>

                    <button
                        onClick={() => router.push('/admin/question-bank')}
                        className="flex items-center gap-2 px-4 py-2 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-[#1c1c24] hover:bg-gray-50 text-sm font-medium"
                    >
                        <X className="h-4 w-4" />
                        {labels.cancel}
                    </button>
                    <button
                        onClick={handleSave}
                        disabled={isLoading}
                        className="flex items-center gap-2 px-6 py-2 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white shadow-lg disabled:opacity-70 text-sm font-semibold"
                    >
                        {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                        {labels.save}
                    </button>
                </div>
            </div>

            {/* Notifications */}
            <AnimatePresence>
                {error && (
                    <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                        className="p-4 rounded-xl bg-red-50 dark:bg-red-900/20 border border-red-200 flex items-center gap-3 text-red-600">
                        <AlertTriangle className="h-5 w-5 flex-shrink-0" />
                        <span className="font-medium flex-1">{error}</span>
                        <button onClick={() => setError('')}><X className="h-4 w-4" /></button>
                    </motion.div>
                )}
                {successMessage && (
                    <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }}
                        className="p-4 rounded-xl bg-green-50 dark:bg-green-900/20 border border-green-200 flex items-center gap-3 text-green-600">
                        <CheckCircle2 className="h-5 w-5" />
                        <span className="font-medium">{successMessage}</span>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Context Selection */}
            <div className="bg-white dark:bg-[#1c1c24] rounded-2xl shadow-lg border border-gray-200 dark:border-gray-800 p-6">
                <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                    <GraduationCap className="h-5 w-5 text-indigo-500" />
                    {labels.classification}
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">{labels.stage}</label>
                        <select value={selectedStage} onChange={(e) => setSelectedStage(e.target.value)}
                            className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800">
                            <option value="">{labels.selectStage}</option>
                            {stages.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                        </select>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">{labels.subject}</label>
                        <select value={selectedSubject} onChange={(e) => setSelectedSubject(e.target.value)}
                            disabled={!selectedStage}
                            className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 disabled:opacity-50">
                            <option value="">{labels.selectSubject}</option>
                            {subjects.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                        </select>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">{labels.lesson} <span className="text-red-500">*</span></label>
                        <select value={selectedLesson} onChange={(e) => setSelectedLesson(e.target.value)}
                            disabled={!selectedSubject}
                            className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 disabled:opacity-50">
                            <option value="">{labels.selectLesson}</option>
                            {lessons.map(l => <option key={l.id} value={l.id}>{l.title}</option>)}
                        </select>
                    </div>
                </div>
            </div>

            {/* Content Type Selection */}
            <div className="bg-white dark:bg-[#1c1c24] rounded-2xl shadow-lg border border-gray-200 dark:border-gray-800 p-6">
                <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                    <BookOpen className="h-5 w-5 text-blue-500" />
                    {labels.contentType}
                </h2>
                <div className="grid grid-cols-3 gap-4">
                    {[
                        { value: 'none', label: labels.noText, icon: List },
                        { value: 'reading', label: labels.reading, icon: FileText },
                        { value: 'poetry', label: labels.poetry, icon: Feather },
                    ].map(type => (
                        <button
                            key={type.value}
                            onClick={() => setContentType(type.value as ContentType)}
                            className={`flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all ${contentType === type.value
                                ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-900/20 shadow-md'
                                : 'border-gray-200 dark:border-gray-700 hover:border-gray-300'
                                }`}
                        >
                            <type.icon className={`h-6 w-6 ${contentType === type.value ? 'text-indigo-500' : 'text-gray-400'}`} />
                            <span className={`font-medium ${contentType === type.value ? 'text-indigo-700' : 'text-gray-600'}`}>
                                {type.label}
                            </span>
                        </button>
                    ))}
                </div>
            </div>

            {/* Reading Content */}
            <AnimatePresence>
                {contentType === 'reading' && (
                    <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        className="bg-white dark:bg-[#1c1c24] rounded-2xl shadow-lg border border-blue-200 dark:border-blue-800 p-6"
                    >
                        <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                            <FileText className="h-5 w-5 text-blue-500" />
                            {labels.readingText}
                        </h2>
                        <div className="space-y-4">
                            <input
                                type="text"
                                value={readingTitle}
                                onChange={(e) => setReadingTitle(e.target.value)}
                                placeholder={labels.textTitle}
                                className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800"
                            />
                            <textarea
                                value={readingText}
                                onChange={(e) => setReadingText(e.target.value)}
                                placeholder={labels.writeText}
                                rows={6}
                                className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 resize-none leading-relaxed"
                            />
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Poetry Content */}
            <AnimatePresence>
                {contentType === 'poetry' && (
                    <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        className="bg-white dark:bg-[#1c1c24] rounded-2xl shadow-lg border border-purple-200 dark:border-purple-800 p-6"
                    >
                        <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                            <Feather className="h-5 w-5 text-purple-500" />
                            {labels.poetrySection}
                        </h2>
                        <div className="space-y-4">
                            <input
                                type="text"
                                value={poetryTitle}
                                onChange={(e) => setPoetryTitle(e.target.value)}
                                placeholder={labels.poemTitle}
                                className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800"
                            />

                            <div className="space-y-3">
                                <div className="flex items-center justify-between">
                                    <label className="text-sm font-medium text-gray-700 dark:text-gray-300">{labels.verses}</label>
                                    <button onClick={addVerse} className="text-sm text-purple-600 hover:text-purple-700 flex items-center gap-1">
                                        <Plus className="h-4 w-4" /> {labels.addVerse}
                                    </button>
                                </div>

                                {poetryVerses.map((verse, index) => (
                                    <div key={verse.id} className="flex items-center gap-2 bg-purple-50 dark:bg-purple-900/20 p-3 rounded-xl">
                                        <span className="text-sm text-purple-600 font-medium w-16 flex-shrink-0">{labels.verse} {index + 1}</span>
                                        {isRTL ? (
                                            <>
                                                <input
                                                    type="text"
                                                    value={verse.firstHalf}
                                                    onChange={(e) => updateVerse(verse.id, 'firstHalf', e.target.value)}
                                                    placeholder={labels.firstHalf}
                                                    className="flex-1 px-3 py-2 rounded-lg border border-purple-200 dark:border-purple-700 bg-white dark:bg-gray-800 text-center"
                                                />
                                                <span className="text-purple-400 font-bold text-xl flex-shrink-0">⁂</span>
                                                <input
                                                    type="text"
                                                    value={verse.secondHalf}
                                                    onChange={(e) => updateVerse(verse.id, 'secondHalf', e.target.value)}
                                                    placeholder={labels.secondHalf || labels.firstHalf}
                                                    className="flex-1 px-3 py-2 rounded-lg border border-purple-200 dark:border-purple-700 bg-white dark:bg-gray-800 text-center"
                                                />
                                            </>
                                        ) : (
                                            <input
                                                type="text"
                                                value={verse.firstHalf}
                                                onChange={(e) => updateVerse(verse.id, 'firstHalf', e.target.value)}
                                                placeholder={labels.firstHalf}
                                                className="flex-1 px-3 py-2 rounded-lg border border-purple-200 dark:border-purple-700 bg-white dark:bg-gray-800"
                                            />
                                        )}
                                        {poetryVerses.length > 1 && (
                                            <button onClick={() => removeVerse(verse.id)} className="p-2 text-red-500 hover:bg-red-50 rounded-lg flex-shrink-0">
                                                <Trash2 className="h-4 w-4" />
                                            </button>
                                        )}
                                    </div>
                                ))}
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Sections */}
            <div className="space-y-4">
                <div className="flex flex-col gap-4">
                    <h2 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
                        <Layers className="h-5 w-5 text-indigo-500" />
                        {labels.questionSections} ({sections.length})
                    </h2>
                    {/* Question Type Buttons - Creates new section for each type */}
                    <div className="flex gap-2 flex-wrap p-4 bg-gradient-to-r from-slate-50 to-gray-50 dark:from-slate-900/30 dark:to-gray-900/30 rounded-xl border border-slate-200 dark:border-slate-700">
                        <span className="w-full text-sm text-gray-600 dark:text-gray-400 mb-2 font-medium">اضغط لإنشاء قسم جديد:</span>
                        <button onClick={() => addSection('mcq')} className="flex items-center gap-2 px-4 py-2 rounded-xl bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300 hover:bg-indigo-200 text-sm font-medium transition-all hover:scale-105">
                            <Plus className="h-4 w-4" /> {labels.mcq}
                        </button>
                        <button onClick={() => addSection('true_false')} className="flex items-center gap-2 px-4 py-2 rounded-xl bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300 hover:bg-indigo-200 text-sm font-medium transition-all hover:scale-105">
                            <Plus className="h-4 w-4" /> {labels.trueFalse}
                        </button>
                        <button onClick={() => addSection('essay')} className="flex items-center gap-2 px-4 py-2 rounded-xl bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300 hover:bg-indigo-200 text-sm font-medium transition-all hover:scale-105">
                            <Plus className="h-4 w-4" /> {labels.essay}
                        </button>
                        <button onClick={() => addSection('parsing')} className="flex items-center gap-2 px-4 py-2 rounded-xl bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300 hover:bg-indigo-200 text-sm font-medium transition-all hover:scale-105">
                            <Underline className="h-4 w-4" /> {labels.parsing}
                        </button>
                        <button onClick={() => addSection('fill_blank')} className="flex items-center gap-2 px-4 py-2 rounded-xl bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300 hover:bg-indigo-200 text-sm font-medium transition-all hover:scale-105">
                            <Type className="h-4 w-4" /> {labels.fillBlank}
                        </button>
                        <button onClick={() => addSection('extraction')} className="flex items-center gap-2 px-4 py-2 rounded-xl bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300 hover:bg-indigo-200 text-sm font-medium transition-all hover:scale-105">
                            <Search className="h-4 w-4" /> {labels.extraction}
                        </button>
                    </div>
                </div>

                {sections.map((section, sIndex) => (
                    <motion.div
                        key={section.id}
                        layout
                        className="bg-white dark:bg-[#1c1c24] rounded-2xl shadow-lg border border-gray-200 dark:border-gray-800 overflow-hidden"
                    >
                        {/* Section Header */}
                        <div className="p-4 border-b border-gray-200 dark:border-gray-700 bg-gradient-to-r from-indigo-50 to-slate-50 dark:from-indigo-900/20 dark:to-slate-900/10">
                            <div className="flex items-center gap-3">
                                <div className="flex-shrink-0 w-10 h-10 rounded-full bg-indigo-600 text-white flex items-center justify-center font-bold">
                                    {sIndex + 1}
                                </div>
                                <div className="flex-1">
                                    <div className="flex items-center gap-2 mb-1">
                                        <span className="px-2 py-0.5 rounded text-xs font-bold bg-indigo-200 dark:bg-indigo-800 text-indigo-800 dark:text-indigo-200">
                                            {section.sectionType === 'mcq' ? labels.mcq :
                                                section.sectionType === 'true_false' ? labels.trueFalse :
                                                    section.sectionType === 'essay' ? labels.essay :
                                                        section.sectionType === 'parsing' ? labels.parsing :
                                                            section.sectionType === 'fill_blank' ? labels.fillBlank :
                                                                labels.extraction}
                                        </span>
                                        <span className="text-sm text-gray-500">{section.questions.length} {labels.question}</span>
                                    </div>
                                    <input
                                        type="text"
                                        value={getSectionTitle(section)}
                                        onChange={(e) => updateSectionTitle(section.id, e.target.value)}
                                        placeholder={labels.sectionTitle}
                                        className="w-full px-3 py-2 rounded-lg border-2 border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 font-semibold text-sm"
                                    />
                                </div>
                                {sections.length > 0 && (
                                    <button onClick={() => removeSection(section.id)} className="p-2 text-red-500 hover:bg-red-50 rounded-lg">
                                        <Trash2 className="h-4 w-4" />
                                    </button>
                                )}
                                <button onClick={() => setExpandedSectionId(expandedSectionId === section.id ? null : section.id)}>
                                    {expandedSectionId === section.id ? <ChevronUp className="h-5 w-5 text-gray-400" /> : <ChevronDown className="h-5 w-5 text-gray-400" />}
                                </button>
                            </div>
                        </div>

                        {/* Section Questions */}
                        <AnimatePresence>
                            {expandedSectionId === section.id && (
                                <motion.div
                                    initial={{ height: 0 }}
                                    animate={{ height: 'auto' }}
                                    exit={{ height: 0 }}
                                    className="overflow-hidden"
                                >
                                    <div className="p-4 space-y-4">
                                        {/* Add Question Button - Same type as section */}
                                        <button
                                            onClick={() => addQuestion(section.id, section.sectionType)}
                                            className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all hover:scale-105 bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300 hover:bg-indigo-200"
                                        >
                                            <Plus className="h-4 w-4" /> إضافة سؤال جديد
                                        </button>

                                        {/* Questions List */}
                                        {section.questions.map((question, qIndex) => (
                                            <div key={question.id} className="border border-gray-200 dark:border-gray-700 rounded-xl overflow-hidden">
                                                {/* Question Header */}
                                                <div
                                                    className={`flex items-center justify-between p-3 cursor-pointer ${expandedQuestionId === question.id ? 'bg-indigo-50 dark:bg-indigo-900/20' : 'bg-gray-50 dark:bg-gray-800'
                                                        }`}
                                                    onClick={() => setExpandedQuestionId(expandedQuestionId === question.id ? null : question.id)}
                                                >
                                                    <div className="flex items-center gap-3">
                                                        <span className="w-7 h-7 rounded-full bg-indigo-600 text-white flex items-center justify-center text-sm font-bold">
                                                            {qIndex + 1}
                                                        </span>
                                                        <span className="px-2 py-0.5 rounded text-xs font-medium bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300">
                                                            {question.type === 'mcq' ? labels.mcq :
                                                                question.type === 'true_false' ? labels.trueFalse :
                                                                    question.type === 'essay' ? labels.essay :
                                                                        question.type === 'parsing' ? labels.parsing :
                                                                            question.type === 'fill_blank' ? labels.fillBlank :
                                                                                labels.extraction}
                                                        </span>
                                                        <p className="text-gray-900 dark:text-white font-medium line-clamp-1 max-w-[300px]">
                                                            {getQuestionText(question) || labels.newQuestion}
                                                        </p>
                                                    </div>
                                                    <div className="flex items-center gap-2">
                                                        <button onClick={(e) => { e.stopPropagation(); duplicateQuestion(section.id, question.id); }} className="p-1.5 hover:bg-gray-200 rounded-lg">
                                                            <Copy className="h-3 w-3 text-gray-500" />
                                                        </button>
                                                        {section.questions.length > 1 && (
                                                            <button onClick={(e) => { e.stopPropagation(); removeQuestion(section.id, question.id); }} className="p-1.5 hover:bg-red-50 rounded-lg">
                                                                <Trash2 className="h-3 w-3 text-red-500" />
                                                            </button>
                                                        )}
                                                        {expandedQuestionId === question.id ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                                                    </div>
                                                </div>

                                                {/* Question Content */}
                                                <AnimatePresence>
                                                    {expandedQuestionId === question.id && (
                                                        <motion.div
                                                            initial={{ height: 0 }}
                                                            animate={{ height: 'auto' }}
                                                            exit={{ height: 0 }}
                                                            className="border-t border-gray-200 dark:border-gray-700"
                                                        >
                                                            <div className="p-4 space-y-4">
                                                                {/* Question Text */}
                                                                <div>
                                                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                                                        {labels.question} {qIndex + 1}
                                                                    </label>
                                                                    <textarea
                                                                        value={getQuestionText(question)}
                                                                        onChange={(e) => updateQuestionText(section.id, question.id, e.target.value)}
                                                                        placeholder={labels.questionText}
                                                                        rows={2}
                                                                        className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 resize-none"
                                                                    />
                                                                </div>

                                                                {/* Options for MCQ/TrueFalse */}
                                                                {(question.type === 'mcq' || question.type === 'true_false') && (
                                                                    <div className="space-y-3">
                                                                        <div className="flex items-center justify-between">
                                                                            <label className="text-sm font-medium text-gray-700">{labels.options}</label>
                                                                            {question.type === 'mcq' && (
                                                                                <button onClick={() => addOptionToQuestion(section.id, question.id)}
                                                                                    disabled={question.options.length >= 8}
                                                                                    className="text-xs text-blue-600 flex items-center gap-1 disabled:text-gray-400">
                                                                                    <Plus className="h-3 w-3" /> {labels.addOption}
                                                                                </button>
                                                                            )}
                                                                        </div>
                                                                        {question.options.map((opt, oIndex) => (
                                                                            <div key={oIndex} className="flex items-center gap-3">
                                                                                <input
                                                                                    type="radio"
                                                                                    checked={opt.isCorrect}
                                                                                    onChange={() => updateQuestionOption(section.id, question.id, oIndex, 'isCorrect', true)}
                                                                                    className="h-5 w-5 text-green-600"
                                                                                    name={`q-${question.id}`}
                                                                                />
                                                                                <input
                                                                                    type="text"
                                                                                    value={getOptionText(opt)}
                                                                                    onChange={(e) => updateQuestionOption(section.id, question.id, oIndex, 'text', e.target.value)}
                                                                                    placeholder={`${labels.option} ${oIndex + 1}`}
                                                                                    disabled={question.type === 'true_false'}
                                                                                    className={`flex-1 px-4 py-2.5 rounded-xl border transition-all ${opt.isCorrect
                                                                                        ? 'border-green-400 bg-green-50 dark:bg-green-900/20'
                                                                                        : 'border-gray-200 bg-gray-50 dark:bg-gray-800'
                                                                                        } disabled:bg-gray-100`}
                                                                                />
                                                                                {opt.isCorrect && <CheckCircle2 className="h-5 w-5 text-green-500 flex-shrink-0" />}
                                                                                {question.type === 'mcq' && question.options.length > 2 && (
                                                                                    <button onClick={() => removeOptionFromQuestion(section.id, question.id, oIndex)} className="p-2 text-red-500 hover:bg-red-50 rounded-lg">
                                                                                        <Trash2 className="h-4 w-4" />
                                                                                    </button>
                                                                                )}
                                                                            </div>
                                                                        ))}
                                                                    </div>
                                                                )}

                                                                {/* Essay placeholder */}
                                                                {question.type === 'essay' && (
                                                                    <div className="p-4 bg-purple-50 dark:bg-purple-900/20 rounded-xl text-center text-purple-600">
                                                                        <MessageSquare className="h-6 w-6 mx-auto mb-2" />
                                                                        {labels.essayNote}
                                                                    </div>
                                                                )}

                                                                {/* Parsing Question UI */}
                                                                {question.type === 'parsing' && (
                                                                    <div className="space-y-4 p-4 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-200 dark:border-slate-700">
                                                                        <div className="flex items-center gap-2 text-indigo-700 dark:text-indigo-400">
                                                                            <Underline className="h-5 w-5" />
                                                                            <span className="font-semibold">{labels.parsingNote}</span>
                                                                        </div>
                                                                        <div>
                                                                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                                                                {labels.parsingWord}
                                                                            </label>
                                                                            <input
                                                                                type="text"
                                                                                value={question.underlinedWord || ''}
                                                                                onChange={(e) => updateQuestionField(section.id, question.id, 'underlinedWord', e.target.value)}
                                                                                placeholder={labels.parsingWordPlaceholder}
                                                                                className="w-full px-4 py-2.5 rounded-xl border border-indigo-300 dark:border-indigo-600 bg-white dark:bg-gray-800 text-center font-bold text-lg"
                                                                                style={{ textDecoration: 'underline' }}
                                                                            />
                                                                        </div>
                                                                    </div>
                                                                )}

                                                                {/* Fill Blank Question UI */}
                                                                {question.type === 'fill_blank' && (
                                                                    <div className="space-y-4 p-4 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-200 dark:border-slate-700">
                                                                        <div className="flex items-center gap-2 text-indigo-700 dark:text-indigo-400">
                                                                            <Type className="h-5 w-5" />
                                                                            <span className="font-semibold">{labels.fillBlankNote}</span>
                                                                        </div>
                                                                        <div>
                                                                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                                                                {labels.fillBlankText}
                                                                            </label>
                                                                            <textarea
                                                                                value={lang === 'ar' ? (question.blankTextAr || '') : (question.blankTextEn || '')}
                                                                                onChange={(e) => updateQuestionField(section.id, question.id, lang === 'ar' ? 'blankTextAr' : 'blankTextEn', e.target.value)}
                                                                                placeholder={labels.fillBlankPlaceholder}
                                                                                rows={2}
                                                                                className="w-full px-4 py-3 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 resize-none"
                                                                            />
                                                                            <p className="text-xs text-gray-500 mt-1">استخدم ___ للفراغ</p>
                                                                        </div>
                                                                        <div>
                                                                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                                                                {labels.correctAnswer}
                                                                            </label>
                                                                            <input
                                                                                type="text"
                                                                                value={lang === 'ar' ? (question.correctAnswerAr || '') : (question.correctAnswerEn || '')}
                                                                                onChange={(e) => updateQuestionField(section.id, question.id, lang === 'ar' ? 'correctAnswerAr' : 'correctAnswerEn', e.target.value)}
                                                                                placeholder={labels.correctAnswerPlaceholder}
                                                                                className="w-full px-4 py-2.5 rounded-xl border border-indigo-300 dark:border-indigo-600 bg-indigo-50 dark:bg-indigo-900/20"
                                                                            />
                                                                        </div>
                                                                    </div>
                                                                )}

                                                                {/* Extraction Question UI */}
                                                                {question.type === 'extraction' && (
                                                                    <div className="space-y-4 p-4 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-200 dark:border-slate-700">
                                                                        <div className="flex items-center gap-2 text-indigo-700 dark:text-indigo-400">
                                                                            <Search className="h-5 w-5" />
                                                                            <span className="font-semibold">{labels.extractionNote}</span>
                                                                        </div>
                                                                        <div>
                                                                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                                                                {labels.extractionTarget}
                                                                            </label>
                                                                            <input
                                                                                type="text"
                                                                                value={question.extractionTarget || ''}
                                                                                onChange={(e) => updateQuestionField(section.id, question.id, 'extractionTarget', e.target.value)}
                                                                                placeholder={labels.extractionTargetPlaceholder}
                                                                                className="w-full px-4 py-2.5 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800"
                                                                            />
                                                                        </div>
                                                                        <div>
                                                                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                                                                {labels.correctAnswer}
                                                                            </label>
                                                                            <input
                                                                                type="text"
                                                                                value={lang === 'ar' ? (question.correctAnswerAr || '') : (question.correctAnswerEn || '')}
                                                                                onChange={(e) => updateQuestionField(section.id, question.id, lang === 'ar' ? 'correctAnswerAr' : 'correctAnswerEn', e.target.value)}
                                                                                placeholder={labels.correctAnswerPlaceholder}
                                                                                className="w-full px-4 py-2.5 rounded-xl border border-indigo-300 dark:border-indigo-600 bg-indigo-50 dark:bg-indigo-900/20"
                                                                            />
                                                                        </div>
                                                                    </div>
                                                                )}

                                                                {/* Settings */}
                                                                <div className="bg-gradient-to-r from-slate-50 to-gray-50 dark:from-slate-900/30 dark:to-gray-900/30 rounded-xl p-4 border border-slate-200 dark:border-slate-700">
                                                                    <div className="grid grid-cols-3 gap-4">
                                                                        {/* Difficulty */}
                                                                        <div>
                                                                            <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-2 flex items-center gap-1">
                                                                                <span className="w-2 h-2 rounded-full bg-amber-400"></span>
                                                                                {labels.difficulty}
                                                                            </label>
                                                                            <div className="flex gap-1">
                                                                                <button
                                                                                    onClick={() => updateQuestionField(section.id, question.id, 'difficulty', 'easy')}
                                                                                    className={`flex-1 py-2 rounded-lg text-xs font-bold transition-all ${question.difficulty === 'easy'
                                                                                        ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-200'
                                                                                        : 'bg-emerald-50 text-emerald-600 hover:bg-emerald-100 border border-emerald-200'
                                                                                        }`}
                                                                                >
                                                                                    {labels.easy}
                                                                                </button>
                                                                                <button
                                                                                    onClick={() => updateQuestionField(section.id, question.id, 'difficulty', 'medium')}
                                                                                    className={`flex-1 py-2 rounded-lg text-xs font-bold transition-all ${question.difficulty === 'medium'
                                                                                        ? 'bg-amber-500 text-white shadow-lg shadow-amber-200'
                                                                                        : 'bg-amber-50 text-amber-600 hover:bg-amber-100 border border-amber-200'
                                                                                        }`}
                                                                                >
                                                                                    {labels.medium}
                                                                                </button>
                                                                                <button
                                                                                    onClick={() => updateQuestionField(section.id, question.id, 'difficulty', 'hard')}
                                                                                    className={`flex-1 py-2 rounded-lg text-xs font-bold transition-all ${question.difficulty === 'hard'
                                                                                        ? 'bg-rose-500 text-white shadow-lg shadow-rose-200'
                                                                                        : 'bg-rose-50 text-rose-600 hover:bg-rose-100 border border-rose-200'
                                                                                        }`}
                                                                                >
                                                                                    {labels.hard}
                                                                                </button>
                                                                            </div>
                                                                        </div>

                                                                        {/* Points */}
                                                                        <div>
                                                                            <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-2 flex items-center gap-1">
                                                                                <span className="w-2 h-2 rounded-full bg-blue-400"></span>
                                                                                {labels.points}
                                                                            </label>
                                                                            <div className="relative">
                                                                                <input
                                                                                    type="number" min={1} max={100}
                                                                                    value={question.points}
                                                                                    onChange={(e) => updateQuestionField(section.id, question.id, 'points', Number(e.target.value))}
                                                                                    className="w-full px-3 py-2 rounded-lg border-2 border-blue-200 dark:border-blue-700 bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 font-bold text-center focus:ring-2 focus:ring-blue-400"
                                                                                />
                                                                                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-blue-400 text-xs font-medium">pts</span>
                                                                            </div>
                                                                        </div>

                                                                        {/* Explanation */}
                                                                        <div>
                                                                            <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-2 flex items-center gap-1">
                                                                                <span className="w-2 h-2 rounded-full bg-violet-400"></span>
                                                                                {labels.explanation}
                                                                            </label>
                                                                            <input
                                                                                type="text"
                                                                                value={lang === 'ar' ? question.explanationAr : question.explanationEn}
                                                                                onChange={(e) => updateQuestionExplanation(section.id, question.id, e.target.value)}
                                                                                placeholder={labels.explainAnswer}
                                                                                className="w-full px-3 py-2 rounded-lg border-2 border-violet-200 dark:border-violet-700 bg-violet-50 dark:bg-violet-900/30 text-violet-700 dark:text-violet-300 placeholder:text-violet-300 focus:ring-2 focus:ring-violet-400 text-sm"
                                                                            />
                                                                        </div>
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        </motion.div>
                                                    )}
                                                </AnimatePresence>
                                            </div>
                                        ))}
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </motion.div>
                ))}
            </div>
        </div>
    );
}
