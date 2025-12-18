"use client";

import { useState } from "react";
import { useParams } from "next/navigation";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import { BookOpen, ArrowRight, ArrowLeft, CheckCircle2, XCircle, RotateCcw, Trophy, Target, ChevronLeft, ChevronRight } from "lucide-react";

const lessonsData: Record<string, { id: string; title: string; subtitle: string; content: string; questions: Array<{ id: string; question: string; options: string[]; correctAnswer: number; explanation: string }> }> = {
    "eng_lesson1_voc_gram_001": { id: "eng_lesson1_voc_gram_001", title: "Vocabulary & Grammar", subtitle: "Lesson 1", content: "<h2>Introduction to Grammar</h2><p>Grammar is the system and structure of a language.</p><h3>Parts of Speech</h3><ul><li><b>Nouns:</b> Words that name people, places, things</li><li><b>Verbs:</b> Words that show action or state</li><li><b>Adjectives:</b> Words that describe nouns</li></ul>", questions: [{ id: "q1", question: "Which word is a noun?", options: ["Run", "Beautiful", "Cat", "Quickly"], correctAnswer: 2, explanation: "Cat is a noun - it names a thing." }, { id: "q2", question: "Which word is a verb?", options: ["Happy", "Book", "Write", "The"], correctAnswer: 2, explanation: "Write is a verb - it shows action." }] },
    "eng_lesson2_vocab_002": { id: "eng_lesson2_vocab_002", title: "Vocabulary", subtitle: "Lesson 2", content: "<h2>Building Vocabulary</h2><p>Learn new words to improve your English.</p>", questions: [{ id: "q1", question: "What is the synonym of 'happy'?", options: ["Sad", "Joyful", "Angry", "Tired"], correctAnswer: 1, explanation: "Joyful means the same as happy." }] },
    "eng_lesson3_reading_003": { id: "eng_lesson3_reading_003", title: "Reading", subtitle: "Lesson 3", content: "<h2>Reading Comprehension</h2><p>Learn to understand texts effectively.</p>", questions: [{ id: "q1", question: "What is the main purpose of reading comprehension?", options: ["Speed reading", "Understanding the text", "Memorizing words", "Writing essays"], correctAnswer: 1, explanation: "Reading comprehension focuses on understanding." }] },
    "eng_lesson4_translation_004": { id: "eng_lesson4_translation_004", title: "Translation", subtitle: "Lesson 4", content: "<h2>Translation Skills</h2><p>Convert meaning between languages accurately.</p>", questions: [{ id: "q1", question: "What makes a good translation?", options: ["Word-for-word accuracy", "Conveying meaning accurately", "Using simple words", "Being brief"], correctAnswer: 1, explanation: "Good translation conveys meaning, not just words." }] },
    "eng_lesson5_literature_005": { id: "eng_lesson5_literature_005", title: "Literature", subtitle: "Lesson 5", content: "<h2>English Literature</h2><p>Explore classic and modern literary works.</p>", questions: [{ id: "q1", question: "Who wrote Romeo and Juliet?", options: ["Charles Dickens", "William Shakespeare", "Jane Austen", "Mark Twain"], correctAnswer: 1, explanation: "Shakespeare wrote Romeo and Juliet." }] },
    "eng_lesson6_essay_006": { id: "eng_lesson6_essay_006", title: "Essay Writing", subtitle: "Lesson 6", content: "<h2>Essay Writing</h2><p>Learn to write structured, coherent essays.</p>", questions: [{ id: "q1", question: "What are the three main parts of an essay?", options: ["Title, Body, End", "Introduction, Body, Conclusion", "Start, Middle, Finish", "Beginning, Story, Moral"], correctAnswer: 1, explanation: "Essays have Introduction, Body, and Conclusion." }] }
};

export default function EnglishLessonPage() {
    const params = useParams();
    const lessonId = params.lessonId as string;
    const lesson = lessonsData[lessonId];
    const [activeTab, setActiveTab] = useState<"content" | "quiz">("content");
    const [currentQuestion, setCurrentQuestion] = useState(0);
    const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
    const [showResult, setShowResult] = useState(false);
    const [score, setScore] = useState(0);
    const [answeredQuestions, setAnsweredQuestions] = useState<Set<number>>(new Set());
    const [isQuizComplete, setIsQuizComplete] = useState(false);

    if (!lesson) {
        return (<div className="min-h-screen bg-gray-50 dark:bg-[#0a0a0f]" dir="ltr"><Navbar /><main className="container mx-auto px-4 py-20 text-center"><h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">Lesson not found</h1><Link href="/english" className="text-primary-600 hover:underline">Go back</Link></main><Footer /></div>);
    }

    const questions = lesson.questions;
    const currentQ = questions[currentQuestion];
    const handleAnswerSelect = (i: number) => { if (!showResult) setSelectedAnswer(i); };
    const handleSubmit = () => { if (selectedAnswer === null) return; setShowResult(true); if (selectedAnswer === currentQ.correctAnswer && !answeredQuestions.has(currentQuestion)) setScore(s => s + 1); setAnsweredQuestions(p => new Set(p).add(currentQuestion)); };
    const handleNext = () => { if (currentQuestion < questions.length - 1) { setCurrentQuestion(c => c + 1); setSelectedAnswer(null); setShowResult(false); } else setIsQuizComplete(true); };
    const handleRestart = () => { setCurrentQuestion(0); setSelectedAnswer(null); setShowResult(false); setScore(0); setAnsweredQuestions(new Set()); setIsQuizComplete(false); };
    const pct = Math.round((score / questions.length) * 100);

    return (
        <div className="min-h-screen bg-gradient-to-b from-gray-50 via-white to-gray-50 dark:from-[#0a0a0f] dark:via-[#121218] dark:to-[#0a0a0f]" dir="ltr">
            <Navbar />
            <main className="relative z-10">
                <section className="container mx-auto px-4 sm:px-6 lg:px-8 pt-4 pb-8 max-w-4xl">
                    <motion.div initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }}><Link href="/english" className="inline-flex items-center gap-2 text-gray-500 hover:text-gray-900 dark:hover:text-white text-sm mb-6"><ArrowLeft className="h-4 w-4" />Back to Lessons</Link></motion.div>
                    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
                        <div className="flex items-center gap-4 mb-4"><div className="p-3 rounded-xl bg-gradient-to-br from-primary-500 to-primary-600 shadow-lg shadow-primary-500/30"><BookOpen className="h-6 w-6 text-white" /></div><div><p className="text-primary-600 dark:text-primary-400 text-sm font-semibold">{lesson.subtitle}</p><h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900 dark:text-white">{lesson.title}</h1></div></div>
                        <div className="flex bg-gray-100 dark:bg-[#1c1c24] rounded-xl p-1.5 border border-gray-200/60 dark:border-[#2e2e3a]">
                            <button onClick={() => setActiveTab("content")} className={`flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg text-sm font-semibold transition-all ${activeTab === "content" ? "bg-white dark:bg-[#2e2e3a] text-gray-900 dark:text-white shadow-sm" : "text-gray-600 dark:text-gray-400"}`}><BookOpen className="h-4 w-4" />Lesson</button>
                            <button onClick={() => setActiveTab("quiz")} className={`flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg text-sm font-semibold transition-all ${activeTab === "quiz" ? "bg-white dark:bg-[#2e2e3a] text-gray-900 dark:text-white shadow-sm" : "text-gray-600 dark:text-gray-400"}`}><Target className="h-4 w-4" />Quiz<span className="px-2 py-0.5 rounded-full bg-primary-100 dark:bg-primary-900/30 text-primary-600 dark:text-primary-400 text-xs">{questions.length}</span></button>
                        </div>
                    </motion.div>
                </section>
                <section className="container mx-auto px-4 sm:px-6 lg:px-8 pb-16 max-w-4xl">
                    <AnimatePresence mode="wait">
                        {activeTab === "content" ? (
                            <motion.div key="content" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} className="bg-white dark:bg-[#1c1c24] rounded-2xl p-6 sm:p-8 border border-gray-200/60 dark:border-[#2e2e3a] shadow-sm">
                                <div className="prose prose-lg dark:prose-invert max-w-none" dangerouslySetInnerHTML={{ __html: lesson.content }} />
                                <div className="mt-8 pt-6 border-t border-gray-200 dark:border-gray-700"><button onClick={() => setActiveTab("quiz")} className="w-full flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-primary-500 to-primary-600 text-white font-semibold shadow-lg hover:-translate-y-0.5 transition-all"><Target className="h-5 w-5" />Test Your Knowledge<ArrowRight className="h-4 w-4" /></button></div>
                            </motion.div>
                        ) : (
                            <motion.div key="quiz" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}>
                                {!isQuizComplete ? (
                                    <div className="bg-white dark:bg-[#1c1c24] rounded-2xl p-6 sm:p-8 border border-gray-200/60 dark:border-[#2e2e3a] shadow-sm">
                                        <div className="flex justify-between mb-6"><span className="text-sm text-gray-500">Question {currentQuestion + 1} of {questions.length}</span><span className="text-sm font-semibold text-primary-600">Score: {score}/{answeredQuestions.size}</span></div>
                                        <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded-full mb-8 overflow-hidden"><motion.div className="h-full bg-gradient-to-r from-primary-500 to-primary-600" initial={{ width: 0 }} animate={{ width: `${((currentQuestion + 1) / questions.length) * 100}%` }} /></div>
                                        <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-6">{currentQ.question}</h2>
                                        <div className="space-y-3 mb-8">{currentQ.options.map((opt, i) => { let cls = "border-gray-200 dark:border-gray-700 hover:border-primary-400"; if (showResult) { if (i === currentQ.correctAnswer) cls = "border-green-500 bg-green-50 dark:bg-green-900/20"; else if (i === selectedAnswer) cls = "border-red-500 bg-red-50 dark:bg-red-900/20"; } else if (selectedAnswer === i) cls = "border-primary-500 bg-primary-50 dark:bg-primary-900/20"; return (<button key={i} onClick={() => handleAnswerSelect(i)} disabled={showResult} className={`w-full text-left p-4 rounded-xl border-2 transition-all ${cls}`}><div className="flex items-center gap-3"><span className="w-8 h-8 rounded-lg bg-gray-100 dark:bg-gray-800 flex items-center justify-center text-sm font-bold">{String.fromCharCode(65 + i)}</span><span className="flex-1 text-gray-900 dark:text-white">{opt}</span>{showResult && i === currentQ.correctAnswer && <CheckCircle2 className="h-5 w-5 text-green-500" />}{showResult && i === selectedAnswer && i !== currentQ.correctAnswer && <XCircle className="h-5 w-5 text-red-500" />}</div></button>); })}</div>
                                        <AnimatePresence>{showResult && <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} className="mb-6 p-4 rounded-xl bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800"><p className="text-sm text-blue-800 dark:text-blue-200"><b>Explanation:</b> {currentQ.explanation}</p></motion.div>}</AnimatePresence>
                                        <div className="flex gap-3">{!showResult ? <button onClick={handleSubmit} disabled={selectedAnswer === null} className="flex-1 flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-primary-500 to-primary-600 text-white font-semibold disabled:opacity-50">Submit</button> : <button onClick={handleNext} className="flex-1 flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-primary-500 to-primary-600 text-white font-semibold">{currentQuestion < questions.length - 1 ? <>Next<ChevronRight className="h-4 w-4" /></> : <><Trophy className="h-4 w-4" />See Results</>}</button>}</div>
                                    </div>
                                ) : (
                                    <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="bg-white dark:bg-[#1c1c24] rounded-2xl p-8 border border-gray-200/60 dark:border-[#2e2e3a] text-center">
                                        <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-gradient-to-br from-primary-500 to-primary-600 flex items-center justify-center"><Trophy className="h-10 w-10 text-white" /></div>
                                        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Great Job!</h2>
                                        <div className="text-5xl font-extrabold text-primary-600 mb-2">{pct}%</div>
                                        <p className="text-gray-500 mb-8">{score} correct out of {questions.length}</p>
                                        <div className="flex gap-3"><button onClick={handleRestart} className="flex-1 flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 font-semibold"><RotateCcw className="h-4 w-4" />Retry</button><Link href="/english" className="flex-1 flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-primary-500 to-primary-600 text-white font-semibold">More Lessons<ArrowRight className="h-4 w-4" /></Link></div>
                                    </motion.div>
                                )}
                            </motion.div>
                        )}
                    </AnimatePresence>
                </section>
            </main>
            <Footer />
        </div>
    );
}
