// =============================================
// Question Bank UI Components - مكونات واجهة بنك الأسئلة
// =============================================

'use client';

import { motion, AnimatePresence } from 'framer-motion';
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
} from 'lucide-react';
import type { UseQuestionBankCreateReturn, QuestionType, ContentType, Question, QuestionSection, PoetryVerse, QuestionOption } from '@/hooks/useQuestionBankCreate';

// ═══════════════════════════════════════════════════════════════════════════
// PAGE HEADER
// ═══════════════════════════════════════════════════════════════════════════

interface PageHeaderProps {
    labels: UseQuestionBankCreateReturn['labels'];
    totalQuestions: number;
    sectionsCount: number;
    lang: 'ar' | 'en';
    setLang: (lang: 'ar' | 'en') => void;
    isLoading: boolean;
    onSave: () => void;
    onCancel: () => void;
}

export function PageHeader({ labels, totalQuestions, sectionsCount, lang, setLang, isLoading, onSave, onCancel }: PageHeaderProps) {
    return (
        <div className="flex items-center justify-between sticky top-0 z-20 bg-gray-50/90 dark:bg-[#13131a]/90 backdrop-blur-md py-4 -mx-4 px-4 border-b border-gray-200 dark:border-gray-800">
            <div className="flex items-center gap-3">
                <div className="p-3 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 shadow-lg">
                    <Layers className="h-6 w-6 text-white" />
                </div>
                <div>
                    <h1 className="text-xl font-bold text-gray-900 dark:text-gray-100">{labels.pageTitle}</h1>
                    <p className="text-sm text-gray-500">{totalQuestions} {labels.questionsIn} {sectionsCount} {labels.sections}</p>
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
                    onClick={onCancel}
                    className="flex items-center gap-2 px-4 py-2 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-[#1c1c24] hover:bg-gray-50 text-sm font-medium"
                >
                    <X className="h-4 w-4" />
                    {labels.cancel}
                </button>
                <button
                    onClick={onSave}
                    disabled={isLoading}
                    className="flex items-center gap-2 px-6 py-2 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white shadow-lg disabled:opacity-70 text-sm font-semibold"
                >
                    {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                    {labels.save}
                </button>
            </div>
        </div>
    );
}

// ═══════════════════════════════════════════════════════════════════════════
// NOTIFICATIONS
// ═══════════════════════════════════════════════════════════════════════════

interface NotificationsProps {
    error: string;
    successMessage: string;
    onClearError: () => void;
}

export function Notifications({ error, successMessage, onClearError }: NotificationsProps) {
    return (
        <AnimatePresence>
            {error && (
                <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                    className="p-4 rounded-xl bg-red-50 dark:bg-red-900/20 border border-red-200 flex items-center gap-3 text-red-600">
                    <AlertTriangle className="h-5 w-5 flex-shrink-0" />
                    <span className="font-medium flex-1">{error}</span>
                    <button onClick={onClearError}><X className="h-4 w-4" /></button>
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
    );
}

// ═══════════════════════════════════════════════════════════════════════════
// CLASSIFICATION SELECTOR
// ═══════════════════════════════════════════════════════════════════════════

interface ClassificationSelectorProps {
    labels: UseQuestionBankCreateReturn['labels'];
    stages: { id: string; name: string }[];
    subjects: { id: string; name: string }[];
    lessons: { id: string; title: string }[];
    selectedStage: string;
    setSelectedStage: (id: string) => void;
    selectedSubject: string;
    setSelectedSubject: (id: string) => void;
    selectedLesson: string;
    setSelectedLesson: (id: string) => void;
}

export function ClassificationSelector({
    labels,
    stages,
    subjects,
    lessons,
    selectedStage,
    setSelectedStage,
    selectedSubject,
    setSelectedSubject,
    selectedLesson,
    setSelectedLesson,
}: ClassificationSelectorProps) {
    return (
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
    );
}

// ═══════════════════════════════════════════════════════════════════════════
// CONTENT TYPE SELECTOR
// ═══════════════════════════════════════════════════════════════════════════

interface ContentTypeSelectorProps {
    labels: UseQuestionBankCreateReturn['labels'];
    contentType: ContentType;
    setContentType: (type: ContentType) => void;
}

export function ContentTypeSelector({ labels, contentType, setContentType }: ContentTypeSelectorProps) {
    const types = [
        { value: 'none' as const, label: labels.noContent, icon: List },
        { value: 'reading' as const, label: labels.readingPassage, icon: FileText },
        { value: 'poetry' as const, label: labels.poetryText, icon: Feather },
    ];

    return (
        <div className="bg-white dark:bg-[#1c1c24] rounded-2xl shadow-lg border border-gray-200 dark:border-gray-800 p-6">
            <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                <BookOpen className="h-5 w-5 text-blue-500" />
                {labels.contentType}
            </h2>
            <div className="grid grid-cols-3 gap-4">
                {types.map(type => (
                    <button
                        key={type.value}
                        onClick={() => setContentType(type.value)}
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
    );
}

// ═══════════════════════════════════════════════════════════════════════════
// READING CONTENT EDITOR
// ═══════════════════════════════════════════════════════════════════════════

interface ReadingContentEditorProps {
    labels: UseQuestionBankCreateReturn['labels'];
    readingTitle: string;
    setReadingTitle: (title: string) => void;
    readingText: string;
    setReadingText: (text: string) => void;
}

export function ReadingContentEditor({ labels, readingTitle, setReadingTitle, readingText, setReadingText }: ReadingContentEditorProps) {
    return (
        <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="bg-white dark:bg-[#1c1c24] rounded-2xl shadow-lg border border-blue-200 dark:border-blue-800 p-6"
        >
            <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                <FileText className="h-5 w-5 text-blue-500" />
                {labels.passageBody}
            </h2>
            <div className="space-y-4">
                <input
                    type="text"
                    value={readingTitle}
                    onChange={(e) => setReadingTitle(e.target.value)}
                    placeholder={labels.passageTitle}
                    className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800"
                />
                <textarea
                    value={readingText}
                    onChange={(e) => setReadingText(e.target.value)}
                    placeholder={labels.passageBodyPlaceholder}
                    rows={6}
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 resize-none leading-relaxed"
                />
            </div>
        </motion.div>
    );
}

// ═══════════════════════════════════════════════════════════════════════════
// POETRY CONTENT EDITOR
// ═══════════════════════════════════════════════════════════════════════════

interface PoetryContentEditorProps {
    labels: UseQuestionBankCreateReturn['labels'];
    poetryTitle: string;
    setPoetryTitle: (title: string) => void;
    poetryVerses: PoetryVerse[];
    addVerse: () => void;
    removeVerse: (id: string) => void;
    updateVerse: (id: string, field: 'firstHalf' | 'secondHalf', value: string) => void;
}

export function PoetryContentEditor({
    labels,
    poetryTitle,
    setPoetryTitle,
    poetryVerses,
    addVerse,
    removeVerse,
    updateVerse
}: PoetryContentEditorProps) {
    return (
        <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="bg-white dark:bg-[#1c1c24] rounded-2xl shadow-lg border border-purple-200 dark:border-purple-800 p-6"
        >
            <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                <Feather className="h-5 w-5 text-purple-500" />
                {labels.verses}
            </h2>
            <div className="space-y-4">
                <input
                    type="text"
                    value={poetryTitle}
                    onChange={(e) => setPoetryTitle(e.target.value)}
                    placeholder={labels.poemTitle}
                    className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800"
                />

                {poetryVerses.map((verse, idx) => (
                    <div key={verse.id} className="flex items-center gap-3">
                        <span className="text-sm text-gray-500 w-8">{idx + 1}.</span>
                        <input
                            type="text"
                            value={verse.firstHalf}
                            onChange={(e) => updateVerse(verse.id, 'firstHalf', e.target.value)}
                            placeholder="الشطر الأول..."
                            className="flex-1 px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800"
                        />
                        <span className="text-purple-400 font-bold">⁂</span>
                        <input
                            type="text"
                            value={verse.secondHalf}
                            onChange={(e) => updateVerse(verse.id, 'secondHalf', e.target.value)}
                            placeholder="الشطر الثاني..."
                            className="flex-1 px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800"
                        />
                        <button
                            onClick={() => removeVerse(verse.id)}
                            className="p-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg"
                        >
                            <Trash2 className="h-4 w-4" />
                        </button>
                    </div>
                ))}

                <button
                    onClick={addVerse}
                    className="flex items-center gap-2 px-4 py-2 text-purple-600 hover:bg-purple-50 dark:hover:bg-purple-900/20 rounded-xl font-medium"
                >
                    <Plus className="h-4 w-4" />
                    {labels.addVerse}
                </button>
            </div>
        </motion.div>
    );
}

// ═══════════════════════════════════════════════════════════════════════════
// ADD SECTION BUTTONS
// ═══════════════════════════════════════════════════════════════════════════

interface AddSectionButtonsProps {
    labels: UseQuestionBankCreateReturn['labels'];
    onAddSection: (type: QuestionType) => void;
}

export function AddSectionButtons({ labels, onAddSection }: AddSectionButtonsProps) {
    const questionTypes: { type: QuestionType; label: string; icon: typeof MessageSquare }[] = [
        { type: 'mcq', label: labels.mcq, icon: List },
        { type: 'true_false', label: labels.trueFalse, icon: CheckCircle2 },
        { type: 'essay', label: labels.essay, icon: MessageSquare },
        { type: 'parsing', label: labels.parsing, icon: Underline },
        { type: 'fill_blank', label: labels.fillBlank, icon: PenLine },
        { type: 'extraction', label: labels.extraction, icon: Search },
    ];

    return (
        <div className="bg-white dark:bg-[#1c1c24] rounded-2xl shadow-lg border border-gray-200 dark:border-gray-800 p-6">
            <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                <Layers className="h-5 w-5 text-indigo-500" />
                {labels.questionSections}
            </h2>
            <div className="flex flex-wrap gap-2">
                {questionTypes.map(qt => (
                    <button
                        key={qt.type}
                        onClick={() => onAddSection(qt.type)}
                        className="flex items-center gap-2 px-4 py-2 rounded-xl border border-indigo-200 dark:border-indigo-800 bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 hover:bg-indigo-100 dark:hover:bg-indigo-900/40 font-medium text-sm transition-all"
                    >
                        <qt.icon className="h-4 w-4" />
                        <Plus className="h-3 w-3" />
                        {qt.label}
                    </button>
                ))}
            </div>
        </div>
    );
}

// ═══════════════════════════════════════════════════════════════════════════
// EXPORTS
// ═══════════════════════════════════════════════════════════════════════════

export const QuestionBankUI = {
    PageHeader,
    Notifications,
    ClassificationSelector,
    ContentTypeSelector,
    ReadingContentEditor,
    PoetryContentEditor,
    AddSectionButtons,
};
