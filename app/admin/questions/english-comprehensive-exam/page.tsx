"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
    BookOpen,
    Plus,
    X,
    Trash2,
    Save,
    CheckCircle2,
    AlertTriangle,
    Loader2,
    ChevronDown,
    ChevronUp,
    FileText,
    Languages,
    PenTool,
    BookMarked,
} from "lucide-react";
import { supabase } from "@/lib/supabase";
import type {
    EnglishSectionType,
    EnglishComprehensiveExam,
    EnglishExamSection,
    EnglishMCQ,
    ChooseTwoOutOfFive,
    ReadingPassage,
    TranslationQuestion,
    EnglishEssayQuestion,
    UsageScope,
    GradingMode,
} from "@/lib/types/exam-templates";

// Types for database entities
interface EducationalStage {
    id: string;
    name: string;
    description: string | null;
    image_url: string | null;
    slug: string;
    created_at: string;
    updated_at: string;
}

interface Subject {
    id: string;
    name: string;
    description: string | null;
    is_active: boolean;
    order_index?: number;
}

interface Lesson {
    id: string;
    subject_id: string;
    title: string;
    description: string | null;
    is_published: boolean;
    order_index?: number;
}

const sectionTypes = [
    {
        value: "vocabulary_grammar",
        label: "Vocabulary & Grammar",
        icon: BookOpen,
        description: "MCQ questions",
    },
    {
        value: "advanced_writing",
        label: "Advanced Writing Skills",
        icon: PenTool,
        description: "Choose 2/5 + Writing Mechanics",
    },
    {
        value: "reading",
        label: "Reading Comprehension",
        icon: BookMarked,
        description: "Reading passages",
    },
    {
        value: "translation",
        label: "Translation",
        icon: Languages,
        description: "MCQ Translation",
    },
    {
        value: "essay",
        label: "Essay Questions",
        icon: FileText,
        description: "Essay + Story Questions",
    },
] as const;

export default function EnglishComprehensiveExam() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const examId = searchParams?.get("id") || null;

    // Educational hierarchy state
    const [stages, setStages] = useState<EducationalStage[]>([]);
    const [subjects, setSubjects] = useState<Subject[]>([]);
    const [lessons, setLessons] = useState<Lesson[]>([]);
    const [selectedStage, setSelectedStage] = useState<string>("");
    const [selectedSubject, setSelectedSubject] = useState<string>("");
    const [isLoadingStages, setIsLoadingStages] = useState(true);
    const [isLoadingSubjects, setIsLoadingSubjects] = useState(false);
    const [isLoadingLessons, setIsLoadingLessons] = useState(false);

    // Exam state
    const [examTitle, setExamTitle] = useState("");
    const [examDescription, setExamDescription] = useState("");
    const [durationMinutes, setDurationMinutes] = useState<number | "">("");
    const [passingScore, setPassingScore] = useState<number | "">("");
    const [gradingMode, setGradingMode] = useState<GradingMode>("hybrid");
    const [branchTags, setBranchTags] = useState<string[]>([]);
    const [usageScope, setUsageScope] = useState<UsageScope>("exam");
    const [selectedLesson, setSelectedLesson] = useState<string>("");
    const [sections, setSections] = useState<EnglishExamSection[]>([]);
    const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({});
    const [submitError, setSubmitError] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isLoadingExam, setIsLoadingExam] = useState(false);
    const [successNotification, setSuccessNotification] = useState<{ isOpen: boolean; message: string }>({
        isOpen: false,
        message: "",
    });

    // Fetch educational stages on mount
    useEffect(() => {
        const fetchStages = async () => {
            setIsLoadingStages(true);
            try {
                const { data, error } = await supabase
                    .from("educational_stages")
                    .select("*")
                    .order("created_at", { ascending: true });

                if (error) throw error;
                setStages(data || []);
            } catch (err) {
                console.error("Error fetching stages:", err);
            } finally {
                setIsLoadingStages(false);
            }
        };
        fetchStages();
    }, []);

    // Fetch subjects when stage is selected
    // Note: Subjects are now independent from stages, so we fetch all active subjects
    useEffect(() => {
        const fetchSubjects = async () => {
            if (!selectedStage) {
                setSubjects([]);
                setSelectedSubject("");
                return;
            }

            setIsLoadingSubjects(true);
            try {
                // Subjects are now independent - fetch all active subjects
                const { data, error } = await supabase
                    .from("subjects")
                    .select("*")
                    .eq("is_active", true)
                    .order("order_index", { ascending: true });

                if (error) throw error;
                setSubjects(data || []);
                setSelectedSubject("");
                setLessons([]);
                setSelectedLesson("");
            } catch (err) {
                console.error("Error fetching subjects:", err);
            } finally {
                setIsLoadingSubjects(false);
            }
        };
        fetchSubjects();
    }, [selectedStage]);

    // Fetch lessons when subject is selected (filtered by stage and subject)
    useEffect(() => {
        const fetchLessons = async () => {
            if (!selectedSubject || !selectedStage) {
                setLessons([]);
                setSelectedLesson("");
                return;
            }

            setIsLoadingLessons(true);
            try {
                // Fetch lessons filtered by both stage and subject
                const { data, error } = await supabase
                    .from("lessons")
                    .select("*")
                    .eq("subject_id", selectedSubject)
                    .eq("stage_id", selectedStage)
                    .order("order_index", { ascending: true });

                if (error) throw error;
                setLessons(data || []);
                setSelectedLesson("");
            } catch (err) {
                console.error("Error fetching lessons:", err);
            } finally {
                setIsLoadingLessons(false);
            }
        };
        fetchLessons();
    }, [selectedSubject, selectedStage]);

    // Load exam if editing
    useEffect(() => {
        const loadExam = async () => {
            if (!examId) return;
            setIsLoadingExam(true);
            try {
                const { data, error } = await supabase
                    .from("comprehensive_exams")
                    .select("*")
                    .eq("id", examId)
                    .single();

                if (error) throw error;

                if (data && data.type === "english_comprehensive_exam") {
                    setExamTitle(data.exam_title || "");
                    setExamDescription(data.exam_description || "");
                    setDurationMinutes(data.duration_minutes ?? "");
                    setPassingScore(data.passing_score ?? "");
                    setGradingMode((data.grading_mode as GradingMode) || "hybrid");
                    setBranchTags((data.branch_tags as string[]) || []);
                    setUsageScope((data.usage_scope as UsageScope) || "exam");
                    setSelectedLesson(data.lesson_id || "");
                    setSections((data.sections as unknown as EnglishExamSection[]) || []);

                    const sectionsData = data.sections as unknown as EnglishExamSection[];
                    if (sectionsData && sectionsData.length > 0) {
                        setExpandedSections({ [sectionsData[0].id]: true });
                    }
                }
            } catch (err) {
                console.error("Error loading exam", err);
                alert("An error occurred while loading the exam");
            } finally {
                setIsLoadingExam(false);
            }
        };
        loadExam();
    }, [examId]);

    const toggleSection = (sectionId: string) => {
        setExpandedSections((prev) => ({
            ...prev,
            [sectionId]: !prev[sectionId],
        }));
    };

    const addSection = (sectionType: EnglishSectionType) => {
        const sectionTypeInfo = sectionTypes.find((s) => s.value === sectionType);
        const newSection: EnglishExamSection = {
            id: `section-${Date.now()}`,
            sectionType,
            title: sectionTypeInfo?.label || sectionType,
            note: "",
        };

        // Initialize specific arrays based on type
        if (sectionType === "vocabulary_grammar") {
            newSection.vocabularyQuestions = [];
        } else if (sectionType === "advanced_writing") {
            newSection.chooseTwoQuestions = [];
            newSection.writingMechanicsQuestions = [];
        } else if (sectionType === "reading") {
            newSection.readingPassages = [];
        } else if (sectionType === "translation") {
            newSection.translationQuestions = [];
        } else if (sectionType === "essay") {
            newSection.essayQuestions = [];
        }

        setSections((prev) => [...prev, newSection]);
        setExpandedSections((prev) => ({ ...prev, [newSection.id]: true }));
    };

    const removeSection = (id: string) => {
        setSections((prev) => prev.filter((s) => s.id !== id));
    };

    const updateSection = (id: string, updater: (s: EnglishExamSection) => EnglishExamSection) => {
        setSections((prev) => prev.map((s) => (s.id === id ? updater(s) : s)));
    };

    // --- Question Management Helpers ---

    // Vocabulary
    const addVocabularyQuestion = (sectionId: string) => {
        updateSection(sectionId, (s) => ({
            ...s,
            vocabularyQuestions: [
                ...(s.vocabularyQuestions || []),
                {
                    id: `mcq-${Date.now()}`,
                    question: "",
                    options: ["", "", "", ""],
                    correctAnswer: 0,
                    points: 1,
                },
            ],
        }));
    };

    // Choose Two
    const addChooseTwoQuestion = (sectionId: string) => {
        updateSection(sectionId, (s) => ({
            ...s,
            chooseTwoQuestions: [
                ...(s.chooseTwoQuestions || []),
                {
                    id: `choose2-${Date.now()}`,
                    question: "",
                    options: ["", "", "", "", ""],
                    correctAnswers: [0, 1],
                    points: 2,
                },
            ],
        }));
    };

    // Writing Mechanics
    const addWritingMechanicsQuestion = (sectionId: string) => {
        updateSection(sectionId, (s) => ({
            ...s,
            writingMechanicsQuestions: [
                ...(s.writingMechanicsQuestions || []),
                {
                    id: `writing-${Date.now()}`,
                    question: "",
                    options: ["", "", "", ""],
                    correctAnswer: 0,
                    points: 1,
                },
            ],
        }));
    };

    // Reading Passage
    const addReadingPassage = (sectionId: string) => {
        updateSection(sectionId, (s) => ({
            ...s,
            readingPassages: [
                ...(s.readingPassages || []),
                {
                    id: `passage-${Date.now()}`,
                    passage: "",
                    questions: [],
                },
            ],
        }));
    };

    const addQuestionToPassage = (sectionId: string, passageId: string) => {
        updateSection(sectionId, (s) => ({
            ...s,
            readingPassages: (s.readingPassages || []).map((p) =>
                p.id === passageId
                    ? {
                        ...p,
                        questions: [
                            ...p.questions,
                            {
                                id: `mcq-${Date.now()}`,
                                question: "",
                                options: ["", "", "", ""],
                                correctAnswer: 0,
                                points: 1,
                            },
                        ],
                    }
                    : p
            ),
        }));
    };

    // Translation
    const addTranslationQuestion = (sectionId: string) => {
        updateSection(sectionId, (s) => ({
            ...s,
            translationQuestions: [
                ...(s.translationQuestions || []),
                {
                    id: `trans-${Date.now()}`,
                    originalText: "",
                    translationDirection: "en-to-ar",
                    options: ["", "", "", ""],
                    correctAnswer: 0,
                    points: 1,
                },
            ],
        }));
    };

    // Essay
    const addEssayQuestion = (sectionId: string, type: "essay" | "story") => {
        updateSection(sectionId, (s) => ({
            ...s,
            essayQuestions: [
                ...(s.essayQuestions || []),
                {
                    id: `essay-${Date.now()}`,
                    question: "",
                    modelAnswer: "",
                    points: type === "essay" ? 5 : 2,
                    type,
                    requiredLines: type === "essay" ? 6 : undefined,
                },
            ],
        }));
    };

    const validate = () => {
        if (!selectedStage) {
            setSubmitError("Please select an educational stage");
            return false;
        }
        if (!selectedSubject) {
            setSubmitError("Please select a subject");
            return false;
        }
        if (!examTitle.trim()) {
            setSubmitError("Please enter exam title");
            return false;
        }
        if (usageScope === "lesson" && !selectedLesson) {
            setSubmitError("Please select a lesson");
            return false;
        }
        if (!sections.length) {
            setSubmitError("Please add at least one section");
            return false;
        }
        setSubmitError("");
        return true;
    };

    const handleSubmit = async () => {
        if (!validate()) return;

        setIsSubmitting(true);
        setSuccessNotification({ isOpen: false, message: "" });

        try {
            const payload = {
                type: "english_comprehensive_exam",
                language: "english",
                usage_scope: usageScope,
                stage_id: selectedStage || null,
                subject_id: selectedSubject || null,
                lesson_id: usageScope === "lesson" && selectedLesson ? selectedLesson : null,
                exam_title: examTitle.trim(),
                exam_description: examDescription.trim() || null,
                duration_minutes: durationMinutes !== "" ? Number(durationMinutes) : null,
                passing_score: passingScore !== "" ? Number(passingScore) : null,
                grading_mode: gradingMode,
                branch_tags: branchTags,
                sections: sections.map((s) => ({ ...s, note: s.note?.trim() || "" })),
                is_published: false,
                updated_at: new Date().toISOString(),
            };

            if (examId) {
                const { error } = await supabase
                    .from("comprehensive_exams")
                    .update(payload as any)
                    .eq("id", examId);

                if (error) throw error;
                setSuccessNotification({ isOpen: true, message: "Exam updated successfully" });
            } else {
                const { error } = await supabase.from("comprehensive_exams").insert({
                    ...payload,
                    created_by: "admin", // Replace with real user ID logic if available in context
                    created_at: new Date().toISOString(),
                } as any);

                if (error) throw error;
                setSuccessNotification({ isOpen: true, message: "Exam created successfully" });
                setSections([]);
                setExamTitle("");
                setExamDescription("");
            }

            setTimeout(() => {
                setSuccessNotification({ isOpen: false, message: "" });
                router.push("/admin/questions");
            }, 1200);
        } catch (err) {
            console.error("Error saving exam", err);
            setSubmitError("An error occurred while saving the exam");
        } finally {
            setIsSubmitting(false);
        }
    };

    // --- Render Helpers ---

    return (
        <div className="space-y-6" dir="ltr">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <div className="p-3 rounded-xl bg-primary-100 dark:bg-primary-900/30 border border-primary-200 dark:border-primary-800/50">
                        <BookOpen className="h-6 w-6 text-primary-600 dark:text-primary-400" />
                    </div>
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                            {examId ? "Edit English Comprehensive Exam" : "Create English Comprehensive Exam"}
                        </h1>
                        <p className="text-gray-600 dark:text-gray-400 mt-1">
                            Comprehensive template with Vocab, Grammar, Reading, Translation, and Essay.
                        </p>
                    </div>
                </div>
                <button
                    onClick={() => router.push("/admin/questions")}
                    className="flex items-center gap-2 px-4 py-2 rounded-xl border border-gray-200 dark:border-[#2e2e3a] hover:bg-gray-50 dark:hover:bg-[#252530] transition-colors"
                >
                    <X className="h-4 w-4" />
                    Cancel
                </button>
            </div>

            {/* Exam Info */}
            <div className="bg-white dark:bg-[#1c1c24] rounded-2xl shadow-lg border border-gray-200 dark:border-[#2e2e3a] p-6 space-y-6">
                <h2 className="text-lg font-bold text-gray-900 dark:text-gray-100">Exam Details</h2>

                {/* Usage Scope */}
                <div>
                    <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                        Usage Scope *
                    </label>
                    <div className="flex gap-4">
                        <label className="flex items-center gap-2 cursor-pointer">
                            <input
                                type="radio"
                                name="usageScope"
                                value="exam"
                                checked={usageScope === "exam"}
                                onChange={() => setUsageScope("exam")}
                                className="h-4 w-4 text-primary-600"
                            />
                            <span className="text-gray-700 dark:text-gray-300">Comprehensive Exam</span>
                        </label>
                        <label className="flex items-center gap-2 cursor-pointer">
                            <input
                                type="radio"
                                name="usageScope"
                                value="lesson"
                                checked={usageScope === "lesson"}
                                onChange={() => setUsageScope("lesson")}
                                className="h-4 w-4 text-primary-600"
                            />
                            <span className="text-gray-700 dark:text-gray-300">Lesson Template</span>
                        </label>
                    </div>
                </div>

                {/* Educational Hierarchy Selection - Always show for both exam and lesson scopes */}
                <div className="space-y-4 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-xl border border-blue-200 dark:border-blue-800">
                    <h3 className="font-semibold text-blue-800 dark:text-blue-200">
                        {usageScope === "lesson" ? "Select Educational Context" : "Select Stage & Subject"}
                    </h3>

                    {/* Stage Selection */}
                    <div>
                        <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                            Educational Stage *
                        </label>
                        <select
                            value={selectedStage}
                            onChange={(e) => setSelectedStage(e.target.value)}
                            disabled={isLoadingStages}
                            className="w-full px-4 py-2 rounded-xl border border-gray-200 dark:border-[#2e2e3a] bg-white dark:bg-[#252530] focus:outline-none focus:ring-2 focus:ring-primary-500 disabled:opacity-50"
                        >
                            <option value="">
                                {isLoadingStages ? "Loading stages..." : "Select a stage..."}
                            </option>
                            {stages.map((stage) => (
                                <option key={stage.id} value={stage.id}>
                                    {stage.name}
                                </option>
                            ))}
                        </select>
                    </div>

                    {/* Subject Selection */}
                    {selectedStage && (
                        <div>
                            <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                                Subject *
                            </label>
                            <select
                                value={selectedSubject}
                                onChange={(e) => setSelectedSubject(e.target.value)}
                                disabled={isLoadingSubjects}
                                className="w-full px-4 py-2 rounded-xl border border-gray-200 dark:border-[#2e2e3a] bg-white dark:bg-[#252530] focus:outline-none focus:ring-2 focus:ring-primary-500 disabled:opacity-50"
                            >
                                <option value="">
                                    {isLoadingSubjects ? "Loading subjects..." : subjects.length === 0 ? "No subjects found" : "Select a subject..."}
                                </option>
                                {subjects.map((subject) => (
                                    <option key={subject.id} value={subject.id}>
                                        {subject.name}
                                    </option>
                                ))}
                            </select>
                        </div>
                    )}

                    {/* Lesson Selection - Only for lesson scope */}
                    {usageScope === "lesson" && selectedSubject && (
                        <div>
                            <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                                Lesson *
                            </label>
                            <select
                                value={selectedLesson}
                                onChange={(e) => setSelectedLesson(e.target.value)}
                                disabled={isLoadingLessons}
                                className="w-full px-4 py-2 rounded-xl border border-gray-200 dark:border-[#2e2e3a] bg-white dark:bg-[#252530] focus:outline-none focus:ring-2 focus:ring-primary-500 disabled:opacity-50"
                            >
                                <option value="">
                                    {isLoadingLessons ? "Loading lessons..." : lessons.length === 0 ? "No lessons found" : "Select a lesson..."}
                                </option>
                                {lessons.map((lesson) => (
                                    <option key={lesson.id} value={lesson.id}>
                                        {lesson.title}
                                    </option>
                                ))}
                            </select>
                        </div>
                    )}

                    {/* Selection Summary */}
                    {(usageScope === "exam" && selectedSubject) && (
                        <div className="mt-3 p-3 bg-green-100 dark:bg-green-900/30 rounded-lg border border-green-200 dark:border-green-800">
                            <p className="text-sm text-green-800 dark:text-green-200">
                                ✓ Selected: {stages.find(s => s.id === selectedStage)?.name} → {subjects.find(s => s.id === selectedSubject)?.name}
                            </p>
                        </div>
                    )}
                    {(usageScope === "lesson" && selectedLesson) && (
                        <div className="mt-3 p-3 bg-green-100 dark:bg-green-900/30 rounded-lg border border-green-200 dark:border-green-800">
                            <p className="text-sm text-green-800 dark:text-green-200">
                                ✓ Selected: {stages.find(s => s.id === selectedStage)?.name} → {subjects.find(s => s.id === selectedSubject)?.name} → {lessons.find(l => l.id === selectedLesson)?.title}
                            </p>
                        </div>
                    )}
                </div>

                {/* Title */}
                <div>
                    <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                        Exam Title *
                    </label>
                    <input
                        type="text"
                        value={examTitle}
                        onChange={(e) => setExamTitle(e.target.value)}
                        placeholder="e.g., Final English Exam - Term 1"
                        className="w-full px-4 py-2 rounded-xl border border-gray-200 dark:border-[#2e2e3a] bg-white dark:bg-[#252530] focus:outline-none focus:ring-2 focus:ring-primary-500"
                    />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {/* Duration */}
                    <div>
                        <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                            Duration (minutes)
                        </label>
                        <input
                            type="number"
                            value={durationMinutes}
                            onChange={(e) => setDurationMinutes(e.target.value ? Number(e.target.value) : "")}
                            placeholder="120"
                            className="w-full px-4 py-2 rounded-xl border border-gray-200 dark:border-[#2e2e3a] bg-white dark:bg-[#252530] focus:outline-none focus:ring-2 focus:ring-primary-500"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                            Passing Score
                        </label>
                        <input
                            type="number"
                            value={passingScore}
                            onChange={(e) => setPassingScore(e.target.value ? Number(e.target.value) : "")}
                            placeholder="25"
                            className="w-full px-4 py-2 rounded-xl border border-gray-200 dark:border-[#2e2e3a] bg-white dark:bg-[#252530] focus:outline-none focus:ring-2 focus:ring-primary-500"
                        />
                    </div>
                </div>
            </div>

            {/* Add Sections */}
            <div className="bg-white dark:bg-[#1c1c24] rounded-2xl shadow-lg border border-gray-200 dark:border-[#2e2e3a] p-6">
                <h2 className="text-lg font-bold text-gray-900 dark:text-gray-100 mb-4">Add Sections</h2>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
                    {sectionTypes.map((type) => (
                        <button
                            key={type.value}
                            onClick={() => addSection(type.value)}
                            className="flex flex-col items-center justify-center gap-2 p-4 rounded-xl border border-dashed border-gray-300 dark:border-[#2e2e3a] hover:border-primary-500 hover:bg-primary-50 dark:hover:bg-primary-900/10 transition-colors h-full"
                        >
                            <type.icon className="h-6 w-6 text-primary-600" />
                            <div className="text-center">
                                <span className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                                    {type.label}
                                </span>
                                <span className="block text-xs text-gray-500 dark:text-gray-400 mt-1">
                                    {type.description}
                                </span>
                            </div>
                        </button>
                    ))}
                </div>
            </div>

            {/* Sections */}
            <div className="space-y-4">
                {sections.map((section, index) => (
                    <motion.div
                        key={section.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="bg-white dark:bg-[#1c1c24] rounded-2xl shadow-lg border border-gray-200 dark:border-[#2e2e3a] overflow-hidden"
                    >
                        {/* Section Header */}
                        <div
                            onClick={() => toggleSection(section.id)}
                            className="p-4 flex items-center justify-between cursor-pointer hover:bg-gray-50 dark:hover:bg-[#252530] transition-colors"
                        >
                            <div className="flex items-center gap-3">
                                <div className="p-2 rounded-lg bg-primary-100 dark:bg-primary-900/30">
                                    <span className="text-sm font-bold text-primary-700 dark:text-primary-300">
                                        {index + 1}
                                    </span>
                                </div>
                                <div className="flex-1">
                                    <h3 className="font-bold text-gray-900 dark:text-gray-100">{section.title}</h3>
                                </div>
                            </div>
                            <div className="flex items-center gap-2">
                                <button
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        removeSection(section.id);
                                    }}
                                    className="p-2 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 text-red-600 transition-colors"
                                >
                                    <Trash2 className="h-4 w-4" />
                                </button>
                                {expandedSections[section.id] ? (
                                    <ChevronUp className="h-5 w-5 text-gray-500" />
                                ) : (
                                    <ChevronDown className="h-5 w-5 text-gray-500" />
                                )}
                            </div>
                        </div>

                        {/* Section Content */}
                        <AnimatePresence>
                            {expandedSections[section.id] && (
                                <motion.div
                                    initial={{ opacity: 0, height: 0 }}
                                    animate={{ opacity: 1, height: "auto" }}
                                    exit={{ opacity: 0, height: 0 }}
                                    className="px-4 pb-4 space-y-4"
                                >
                                    <div>
                                        <label className="text-xs text-gray-500 dark:text-gray-400">Section Note</label>
                                        <input
                                            type="text"
                                            value={section.note || ""}
                                            onChange={(e) =>
                                                updateSection(section.id, (s) => ({ ...s, note: e.target.value }))
                                            }
                                            placeholder="Add a note or instructions for this section..."
                                            className="w-full mt-1 px-3 py-2 rounded-lg border border-gray-200 dark:border-[#2e2e3a] bg-white dark:bg-[#252530]"
                                        />
                                    </div>

                                    {/* Vocabulary & Grammar UI */}
                                    {section.sectionType === "vocabulary_grammar" && (
                                        <div className="space-y-4">
                                            <button
                                                onClick={() => addVocabularyQuestion(section.id)}
                                                className="text-sm font-medium text-primary-600 hover:text-primary-700 flex items-center gap-1"
                                            >
                                                <Plus className="h-4 w-4" /> Add Question
                                            </button>
                                            {section.vocabularyQuestions?.map((q, qIndex) => (
                                                <div
                                                    key={q.id}
                                                    className="p-4 rounded-xl bg-gray-50 dark:bg-[#252530] border border-gray-200 dark:border-[#2e2e3a] space-y-3"
                                                >
                                                    <div className="flex justify-between">
                                                        <span className="text-sm font-bold text-gray-500">
                                                            Q{qIndex + 1}
                                                        </span>
                                                        <button
                                                            onClick={() => {
                                                                const qs = section.vocabularyQuestions?.filter(
                                                                    (x) => x.id !== q.id
                                                                );
                                                                updateSection(section.id, (s) => ({
                                                                    ...s,
                                                                    vocabularyQuestions: qs,
                                                                }));
                                                            }}
                                                            className="text-red-500 hover:text-red-600"
                                                        >
                                                            <Trash2 className="h-4 w-4" />
                                                        </button>
                                                    </div>
                                                    <textarea
                                                        rows={2}
                                                        value={q.question}
                                                        onChange={(e) => {
                                                            const qs = [...(section.vocabularyQuestions || [])];
                                                            qs[qIndex] = { ...qs[qIndex], question: e.target.value };
                                                            updateSection(section.id, (s) => ({
                                                                ...s,
                                                                vocabularyQuestions: qs,
                                                            }));
                                                        }}
                                                        placeholder="Question text..."
                                                        className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-[#2e2e3a] bg-white dark:bg-[#1c1c24] resize-none"
                                                    />
                                                    <div className="grid grid-cols-2 gap-2">
                                                        {q.options.map((opt, optIdx) => (
                                                            <div key={optIdx} className="flex items-center gap-2">
                                                                <input
                                                                    type="radio"
                                                                    checked={q.correctAnswer === optIdx}
                                                                    onChange={() => {
                                                                        const qs = [
                                                                            ...(section.vocabularyQuestions || []),
                                                                        ];
                                                                        qs[qIndex] = { ...qs[qIndex], correctAnswer: optIdx };
                                                                        updateSection(section.id, (s) => ({
                                                                            ...s,
                                                                            vocabularyQuestions: qs,
                                                                        }));
                                                                    }}
                                                                    className="text-primary-600"
                                                                />
                                                                <input
                                                                    type="text"
                                                                    value={opt}
                                                                    onChange={(e) => {
                                                                        const qs = [
                                                                            ...(section.vocabularyQuestions || []),
                                                                        ];
                                                                        qs[qIndex].options[optIdx] = e.target.value;
                                                                        updateSection(section.id, (s) => ({
                                                                            ...s,
                                                                            vocabularyQuestions: qs,
                                                                        }));
                                                                    }}
                                                                    placeholder={`Option ${optIdx + 1}`}
                                                                    className="w-full px-2 py-1 rounded border border-gray-200 dark:border-[#2e2e3a] bg-white dark:bg-[#1c1c24]"
                                                                />
                                                            </div>
                                                        ))}
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    )}

                                    {/* Advanced Writing UI */}
                                    {section.sectionType === "advanced_writing" && (
                                        <div className="space-y-6">
                                            {/* Choose 2/5 Questions */}
                                            <div>
                                                <div className="flex items-center justify-between mb-2">
                                                    <h4 className="font-semibold text-gray-700 dark:text-gray-300">
                                                        Choose Two (2/5) Questions
                                                    </h4>
                                                    <button
                                                        onClick={() => addChooseTwoQuestion(section.id)}
                                                        className="text-sm font-medium text-primary-600 flex items-center gap-1"
                                                    >
                                                        <Plus className="h-4 w-4" /> Add
                                                    </button>
                                                </div>
                                                <div className="space-y-3">
                                                    {section.chooseTwoQuestions?.map((q, qIndex) => (
                                                        <div
                                                            key={q.id}
                                                            className="p-4 rounded-xl bg-gray-50 dark:bg-[#252530] border border-gray-200 dark:border-[#2e2e3a]"
                                                        >
                                                            {/* Implement Choose 2 logic similar to MCQ but with multiple correct answers */}
                                                            <div className="flex justify-between mb-2">
                                                                <span className="text-sm font-bold">Q{qIndex + 1}</span>
                                                                <button
                                                                    onClick={() => {
                                                                        const qs = section.chooseTwoQuestions?.filter(
                                                                            (x) => x.id !== q.id
                                                                        );
                                                                        updateSection(section.id, (s) => ({
                                                                            ...s,
                                                                            chooseTwoQuestions: qs,
                                                                        }));
                                                                    }}
                                                                    className="text-red-500"
                                                                >
                                                                    <Trash2 className="h-4 w-4" />
                                                                </button>
                                                            </div>
                                                            <textarea
                                                                value={q.question}
                                                                onChange={(e) => {
                                                                    const qs = [...(section.chooseTwoQuestions || [])];
                                                                    qs[qIndex].question = e.target.value;
                                                                    updateSection(section.id, (s) => ({
                                                                        ...s,
                                                                        chooseTwoQuestions: qs,
                                                                    }));
                                                                }}
                                                                placeholder="Question text..."
                                                                className="w-full px-3 py-2 mb-2 rounded border resize-none bg-white dark:bg-[#1c1c24] dark:border-[#2e2e3a]"
                                                            />
                                                            <div className="grid grid-cols-1 gap-2">
                                                                {q.options.map((opt, optIdx) => (
                                                                    <div key={optIdx} className="flex items-center gap-2">
                                                                        <input
                                                                            type="checkbox"
                                                                            checked={q.correctAnswers.includes(optIdx)}
                                                                            onChange={() => {
                                                                                const qs = [
                                                                                    ...(section.chooseTwoQuestions || []),
                                                                                ];
                                                                                const current = qs[qIndex].correctAnswers;
                                                                                if (current.includes(optIdx)) {
                                                                                    qs[qIndex].correctAnswers = current.filter(
                                                                                        (i) => i !== optIdx
                                                                                    );
                                                                                } else if (current.length < 2) {
                                                                                    qs[qIndex].correctAnswers = [
                                                                                        ...current,
                                                                                        optIdx,
                                                                                    ];
                                                                                }
                                                                                updateSection(section.id, (s) => ({
                                                                                    ...s,
                                                                                    chooseTwoQuestions: qs,
                                                                                }));
                                                                            }}
                                                                        />
                                                                        <input
                                                                            value={opt}
                                                                            onChange={(e) => {
                                                                                const qs = [
                                                                                    ...(section.chooseTwoQuestions || []),
                                                                                ];
                                                                                qs[qIndex].options[optIdx] = e.target.value;
                                                                                updateSection(section.id, (s) => ({
                                                                                    ...s,
                                                                                    chooseTwoQuestions: qs,
                                                                                }));
                                                                            }}
                                                                            placeholder={`Option ${optIdx + 1}`}
                                                                            className="flex-1 px-2 py-1 rounded border border-gray-200 dark:border-[#2e2e3a] bg-white dark:bg-[#1c1c24]"
                                                                        />
                                                                    </div>
                                                                ))}
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>

                                            {/* Writing Mechanics */}
                                            <div>
                                                <div className="flex items-center justify-between mb-2">
                                                    <h4 className="font-semibold text-gray-700 dark:text-gray-300">
                                                        Writing Mechanics
                                                    </h4>
                                                    <button
                                                        onClick={() => addWritingMechanicsQuestion(section.id)}
                                                        className="text-sm font-medium text-primary-600 flex items-center gap-1"
                                                    >
                                                        <Plus className="h-4 w-4" /> Add
                                                    </button>
                                                </div>
                                                {/* Reusing vocabulary question UI logic for mechanics as they are similar MCQs */}
                                                <div className="space-y-3">
                                                    {section.writingMechanicsQuestions?.map((q, qIndex) => (
                                                        <div
                                                            key={q.id}
                                                            className="p-4 rounded-xl bg-gray-50 dark:bg-[#252530] border border-gray-200 dark:border-[#2e2e3a] space-y-3"
                                                        >
                                                            <div className="flex justify-between">
                                                                <span className="text-sm font-bold">Q{qIndex + 1}</span>
                                                                <button
                                                                    onClick={() => {
                                                                        const qs = section.writingMechanicsQuestions?.filter(
                                                                            (x) => x.id !== q.id
                                                                        );
                                                                        updateSection(section.id, (s) => ({
                                                                            ...s,
                                                                            writingMechanicsQuestions: qs,
                                                                        }));
                                                                    }}
                                                                    className="text-red-500"
                                                                >
                                                                    <Trash2 className="h-4 w-4" />
                                                                </button>
                                                            </div>
                                                            <textarea
                                                                value={q.question}
                                                                onChange={(e) => {
                                                                    const qs = [
                                                                        ...(section.writingMechanicsQuestions || []),
                                                                    ];
                                                                    qs[qIndex].question = e.target.value;
                                                                    updateSection(section.id, (s) => ({
                                                                        ...s,
                                                                        writingMechanicsQuestions: qs,
                                                                    }));
                                                                }}
                                                                placeholder="Question..."
                                                                className="w-full px-3 py-2 rounded border bg-white dark:bg-[#1c1c24] dark:border-[#2e2e3a]"
                                                            />
                                                            <div className="grid grid-cols-2 gap-2">
                                                                {q.options.map((opt, optIdx) => (
                                                                    <div key={optIdx} className="flex items-center gap-2">
                                                                        <input
                                                                            type="radio"
                                                                            checked={q.correctAnswer === optIdx}
                                                                            onChange={() => {
                                                                                const qs = [
                                                                                    ...(section.writingMechanicsQuestions || []),
                                                                                ];
                                                                                qs[qIndex].correctAnswer = optIdx;
                                                                                updateSection(section.id, (s) => ({
                                                                                    ...s,
                                                                                    writingMechanicsQuestions: qs,
                                                                                }));
                                                                            }}
                                                                        />
                                                                        <input
                                                                            value={opt}
                                                                            onChange={(e) => {
                                                                                const qs = [
                                                                                    ...(section.writingMechanicsQuestions || []),
                                                                                ];
                                                                                qs[qIndex].options[optIdx] = e.target.value;
                                                                                updateSection(section.id, (s) => ({
                                                                                    ...s,
                                                                                    writingMechanicsQuestions: qs,
                                                                                }));
                                                                            }}
                                                                            className="w-full px-2 py-1 rounded border bg-white dark:bg-[#1c1c24] dark:border-[#2e2e3a]"
                                                                        />
                                                                    </div>
                                                                ))}
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        </div>
                                    )}

                                    {/* Reading */}
                                    {section.sectionType === "reading" && (
                                        <div className="space-y-4">
                                            <button
                                                onClick={() => addReadingPassage(section.id)}
                                                className="text-sm font-medium text-primary-600 flex items-center gap-1"
                                            >
                                                <Plus className="h-4 w-4" /> Add Passage
                                            </button>
                                            {section.readingPassages?.map((passage, pIndex) => (
                                                <div
                                                    key={passage.id}
                                                    className="p-4 rounded-xl bg-gray-50 dark:bg-[#252530] border border-gray-200 dark:border-[#2e2e3a] space-y-4"
                                                >
                                                    <div className="flex justify-between">
                                                        <h4 className="font-bold">Passage {pIndex + 1}</h4>
                                                        <button
                                                            onClick={() => {
                                                                const ps = section.readingPassages?.filter(
                                                                    (x) => x.id !== passage.id
                                                                );
                                                                updateSection(section.id, (s) => ({
                                                                    ...s,
                                                                    readingPassages: ps,
                                                                }));
                                                            }}
                                                            className="text-red-500"
                                                        >
                                                            <Trash2 className="h-4 w-4" />
                                                        </button>
                                                    </div>
                                                    <textarea
                                                        rows={6}
                                                        value={passage.passage}
                                                        onChange={(e) => {
                                                            const ps = [...(section.readingPassages || [])];
                                                            ps[pIndex].passage = e.target.value;
                                                            updateSection(section.id, (s) => ({
                                                                ...s,
                                                                readingPassages: ps,
                                                            }));
                                                        }}
                                                        placeholder="Passage text..."
                                                        className="w-full px-3 py-2 rounded border bg-white dark:bg-[#1c1c24] dark:border-[#2e2e3a] resize-none"
                                                    />

                                                    {/* Questions for Passage */}
                                                    <div className="pl-4 border-l-2 border-primary-200 dark:border-primary-800">
                                                        <div className="flex justify-between mb-2">
                                                            <span className="text-sm font-semibold">Questions</span>
                                                            <button
                                                                onClick={() =>
                                                                    addQuestionToPassage(section.id, passage.id)
                                                                }
                                                                className="text-xs text-primary-600"
                                                            >
                                                                + Add Question
                                                            </button>
                                                        </div>
                                                        <div className="space-y-3">
                                                            {passage.questions.map((q, qIdx) => (
                                                                <div
                                                                    key={q.id}
                                                                    className="p-3 bg-white dark:bg-[#1c1c24] rounded border border-gray-200 dark:border-[#2e2e3a]"
                                                                >
                                                                    <div className="flex justify-between mb-2">
                                                                        <span className="text-xs font-bold">
                                                                            Q{qIdx + 1}
                                                                        </span>
                                                                        <button
                                                                            onClick={() => {
                                                                                const ps = [
                                                                                    ...(section.readingPassages || []),
                                                                                ];
                                                                                ps[pIndex].questions = ps[
                                                                                    pIndex
                                                                                ].questions.filter(
                                                                                    (x) => x.id !== q.id
                                                                                );
                                                                                updateSection(section.id, (s) => ({
                                                                                    ...s,
                                                                                    readingPassages: ps,
                                                                                }));
                                                                            }}
                                                                            className="text-red-500 text-xs"
                                                                        >
                                                                            Remove
                                                                        </button>
                                                                    </div>
                                                                    <input
                                                                        value={q.question}
                                                                        onChange={(e) => {
                                                                            const ps = [
                                                                                ...(section.readingPassages || []),
                                                                            ];
                                                                            ps[pIndex].questions[qIdx].question =
                                                                                e.target.value;
                                                                            updateSection(section.id, (s) => ({
                                                                                ...s,
                                                                                readingPassages: ps,
                                                                            }));
                                                                        }}
                                                                        placeholder="Question..."
                                                                        className="w-full px-2 py-1 mb-2 rounded border text-sm bg-white dark:bg-[#1c1c24] dark:border-[#2e2e3a]"
                                                                    />
                                                                    <div className="grid grid-cols-2 gap-2">
                                                                        {q.options.map((opt, optIdx) => (
                                                                            <div
                                                                                key={optIdx}
                                                                                className="flex items-center gap-1"
                                                                            >
                                                                                <input
                                                                                    type="radio"
                                                                                    checked={q.correctAnswer === optIdx}
                                                                                    onChange={() => {
                                                                                        const ps = [
                                                                                            ...(section.readingPassages ||
                                                                                                []),
                                                                                        ];
                                                                                        ps[pIndex].questions[
                                                                                            qIdx
                                                                                        ].correctAnswer = optIdx;
                                                                                        updateSection(section.id, (s) => ({
                                                                                            ...s,
                                                                                            readingPassages: ps,
                                                                                        }));
                                                                                    }}
                                                                                />
                                                                                <input
                                                                                    value={opt}
                                                                                    onChange={(e) => {
                                                                                        const ps = [
                                                                                            ...(section.readingPassages ||
                                                                                                []),
                                                                                        ];
                                                                                        ps[pIndex].questions[qIdx].options[
                                                                                            optIdx
                                                                                        ] = e.target.value;
                                                                                        updateSection(section.id, (s) => ({
                                                                                            ...s,
                                                                                            readingPassages: ps,
                                                                                        }));
                                                                                    }}
                                                                                    className="w-full px-2 py-1 rounded border text-xs bg-white dark:bg-[#1c1c24] dark:border-[#2e2e3a]"
                                                                                />
                                                                            </div>
                                                                        ))}
                                                                    </div>
                                                                </div>
                                                            ))}
                                                        </div>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    )}

                                    {/* Translation */}
                                    {section.sectionType === "translation" && (
                                        <div className="space-y-4">
                                            <button
                                                onClick={() => addTranslationQuestion(section.id)}
                                                className="text-sm font-medium text-primary-600 flex items-center gap-1"
                                            >
                                                <Plus className="h-4 w-4" /> Add Translation
                                            </button>
                                            {section.translationQuestions?.map((q, qIndex) => (
                                                <div
                                                    key={q.id}
                                                    className="p-4 rounded-xl bg-gray-50 dark:bg-[#252530] border border-gray-200 dark:border-[#2e2e3a] space-y-3"
                                                >
                                                    <div className="flex justify-between">
                                                        <span className="text-sm font-bold">Q{qIndex + 1}</span>
                                                        <button
                                                            onClick={() => {
                                                                const qs = section.translationQuestions?.filter(
                                                                    (x) => x.id !== q.id
                                                                );
                                                                updateSection(section.id, (s) => ({
                                                                    ...s,
                                                                    translationQuestions: qs,
                                                                }));
                                                            }}
                                                            className="text-red-500"
                                                        >
                                                            <Trash2 className="h-4 w-4" />
                                                        </button>
                                                    </div>
                                                    <div className="flex gap-4">
                                                        <label className="flex items-center gap-2">
                                                            <input
                                                                type="radio"
                                                                checked={q.translationDirection === "en-to-ar"}
                                                                onChange={() => {
                                                                    const qs = [
                                                                        ...(section.translationQuestions || []),
                                                                    ];
                                                                    qs[qIndex].translationDirection = "en-to-ar";
                                                                    updateSection(section.id, (s) => ({
                                                                        ...s,
                                                                        translationQuestions: qs,
                                                                    }));
                                                                }}
                                                            />
                                                            <span className="text-sm">English to Arabic</span>
                                                        </label>
                                                        <label className="flex items-center gap-2">
                                                            <input
                                                                type="radio"
                                                                checked={q.translationDirection === "ar-to-en"}
                                                                onChange={() => {
                                                                    const qs = [
                                                                        ...(section.translationQuestions || []),
                                                                    ];
                                                                    qs[qIndex].translationDirection = "ar-to-en";
                                                                    updateSection(section.id, (s) => ({
                                                                        ...s,
                                                                        translationQuestions: qs,
                                                                    }));
                                                                }}
                                                            />
                                                            <span className="text-sm">Arabic to English</span>
                                                        </label>
                                                    </div>
                                                    <textarea
                                                        value={q.originalText}
                                                        onChange={(e) => {
                                                            const qs = [...(section.translationQuestions || [])];
                                                            qs[qIndex].originalText = e.target.value;
                                                            updateSection(section.id, (s) => ({
                                                                ...s,
                                                                translationQuestions: qs,
                                                            }));
                                                        }}
                                                        placeholder="Original text..."
                                                        className="w-full px-3 py-2 rounded border bg-white dark:bg-[#1c1c24] dark:border-[#2e2e3a]"
                                                    />
                                                    <div className="space-y-2">
                                                        {q.options.map((opt, optIdx) => (
                                                            <div key={optIdx} className="flex items-center gap-2">
                                                                <input
                                                                    type="radio"
                                                                    checked={q.correctAnswer === optIdx}
                                                                    onChange={() => {
                                                                        const qs = [
                                                                            ...(section.translationQuestions || []),
                                                                        ];
                                                                        qs[qIndex].correctAnswer = optIdx;
                                                                        updateSection(section.id, (s) => ({
                                                                            ...s,
                                                                            translationQuestions: qs,
                                                                        }));
                                                                    }}
                                                                />
                                                                <input
                                                                    value={opt}
                                                                    onChange={(e) => {
                                                                        const qs = [
                                                                            ...(section.translationQuestions || []),
                                                                        ];
                                                                        qs[qIndex].options[optIdx] = e.target.value;
                                                                        updateSection(section.id, (s) => ({
                                                                            ...s,
                                                                            translationQuestions: qs,
                                                                        }));
                                                                    }}
                                                                    placeholder={`Translation Option ${optIdx + 1}`}
                                                                    className="w-full px-2 py-1 rounded border bg-white dark:bg-[#1c1c24] dark:border-[#2e2e3a]"
                                                                    dir={
                                                                        q.translationDirection === "en-to-ar"
                                                                            ? "rtl"
                                                                            : "ltr"
                                                                    }
                                                                />
                                                            </div>
                                                        ))}
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    )}

                                    {/* Essay */}
                                    {section.sectionType === "essay" && (
                                        <div className="space-y-4">
                                            <div className="flex gap-2">
                                                <button
                                                    onClick={() => addEssayQuestion(section.id, "essay")}
                                                    className="text-sm font-medium text-primary-600 flex items-center gap-1"
                                                >
                                                    <Plus className="h-4 w-4" /> Add Essay
                                                </button>
                                                <button
                                                    onClick={() => addEssayQuestion(section.id, "story")}
                                                    className="text-sm font-medium text-primary-600 flex items-center gap-1"
                                                >
                                                    <Plus className="h-4 w-4" /> Add Story Question
                                                </button>
                                            </div>
                                            {section.essayQuestions?.map((q, qIndex) => (
                                                <div
                                                    key={q.id}
                                                    className="p-4 rounded-xl bg-gray-50 dark:bg-[#252530] border border-gray-200 dark:border-[#2e2e3a] space-y-3"
                                                >
                                                    <div className="flex justify-between">
                                                        <span className="text-sm font-bold">
                                                            {q.type === "essay" ? "Essay" : "Story"} Q{qIndex + 1}
                                                        </span>
                                                        <button
                                                            onClick={() => {
                                                                const qs = section.essayQuestions?.filter(
                                                                    (x) => x.id !== q.id
                                                                );
                                                                updateSection(section.id, (s) => ({
                                                                    ...s,
                                                                    essayQuestions: qs,
                                                                }));
                                                            }}
                                                            className="text-red-500"
                                                        >
                                                            <Trash2 className="h-4 w-4" />
                                                        </button>
                                                    </div>
                                                    <textarea
                                                        value={q.question}
                                                        onChange={(e) => {
                                                            const qs = [...(section.essayQuestions || [])];
                                                            qs[qIndex].question = e.target.value;
                                                            updateSection(section.id, (s) => ({
                                                                ...s,
                                                                essayQuestions: qs,
                                                            }));
                                                        }}
                                                        placeholder="Question..."
                                                        className="w-full px-3 py-2 rounded border bg-white dark:bg-[#1c1c24] dark:border-[#2e2e3a]"
                                                    />
                                                    <div>
                                                        <label className="text-xs text-gray-500">Points</label>
                                                        <input
                                                            type="number"
                                                            value={q.points}
                                                            onChange={(e) => {
                                                                const qs = [...(section.essayQuestions || [])];
                                                                qs[qIndex].points = Number(e.target.value);
                                                                updateSection(section.id, (s) => ({
                                                                    ...s,
                                                                    essayQuestions: qs,
                                                                }));
                                                            }}
                                                            className="block w-20 px-2 py-1 rounded border bg-white dark:bg-[#1c1c24] dark:border-[#2e2e3a]"
                                                        />
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </motion.div>
                ))}
            </div>

            {/* Error & Submit */}
            {submitError && (
                <div className="p-4 rounded-xl bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800/50 flex items-center gap-3">
                    <AlertTriangle className="h-5 w-5 text-red-600" />
                    <span className="text-red-700 dark:text-red-300">{submitError}</span>
                </div>
            )}

            <div className="flex justify-end">
                <button
                    onClick={handleSubmit}
                    disabled={isSubmitting}
                    className="flex items-center gap-2 px-6 py-3 rounded-xl bg-primary-600 hover:bg-primary-700 text-white font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    {isSubmitting ? (
                        <Loader2 className="h-5 w-5 animate-spin" />
                    ) : (
                        <Save className="h-5 w-5" />
                    )}
                    {examId ? "Update Exam" : "Save Exam"}
                </button>
            </div>

            {/* Success Notification */}
            <AnimatePresence>
                {successNotification.isOpen && (
                    <motion.div
                        initial={{ opacity: 0, y: 50 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 50 }}
                        className="fixed bottom-6 right-6 z-50 flex items-center gap-3 px-5 py-3 rounded-xl bg-green-500 text-white shadow-lg"
                    >
                        <CheckCircle2 className="h-5 w-5" />
                        <span className="font-medium">{successNotification.message}</span>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
