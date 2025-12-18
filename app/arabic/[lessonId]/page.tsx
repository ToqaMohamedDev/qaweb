"use client";

import { useState } from "react";
import { useParams } from "next/navigation";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import { FileText, ArrowRight, ArrowLeft, BookOpen, CheckCircle2, XCircle, RotateCcw, Trophy, Target, ChevronLeft } from "lucide-react";

const lessonsData: Record<string, { id: string; title: string; description: string; content: string; questions: Array<{ id: string; question: string; options: string[]; correctAnswer: number; explanation: string }> }> = {
    "arabic_nahw_01": { id: "arabic_nahw_01", title: "النحو", description: "تحليل قطع النحو", content: "<h2>مقدمة في النحو</h2><p>النحو علم أحوال أواخر الكلم.</p><h3>أقسام الكلام</h3><ul><li><b>الاسم:</b> ما دل على معنى غير مقترن بزمان</li><li><b>الفعل:</b> ما دل على معنى مقترن بزمان</li><li><b>الحرف:</b> ما دل على معنى في غيره</li></ul>", questions: [{ id: "q1", question: "ما تعريف النحو؟", options: ["علم أحوال أواخر الكلم", "علم بنية الكلمات", "علم البلاغة", "علم الشعر"], correctAnswer: 0, explanation: "النحو علم أحوال أواخر الكلم." }, { id: "q2", question: "كم أقسام الكلام؟", options: ["2", "3", "4", "5"], correctAnswer: 1, explanation: "الكلام: اسم وفعل وحرف." }] },
    "arabic_reading_02": { id: "arabic_reading_02", title: "القراءة", description: "تحليل النصوص", content: "<h2>فن القراءة</h2><p>القراءة عملية فهم وتحليل.</p>", questions: [{ id: "q1", question: "ما القراءة؟", options: ["عملية بصرية", "عملية فهم وتحليل", "حفظ", "كتابة"], correctAnswer: 1, explanation: "القراءة فهم وتحليل." }] },
    "arabic_poetry_03": { id: "arabic_poetry_03", title: "النصوص", description: "تحليل الشعر", content: "<h2>الشعر</h2><p>دراسة الشعر العربي.</p>", questions: [{ id: "q1", question: "ما البيت الشعري؟", options: ["نثر", "سطر شعري", "قصة", "مقال"], correctAnswer: 1, explanation: "البيت وحدة القصيدة." }] },
    "arabic_story_04": { id: "arabic_story_04", title: "القصة", description: "تحليل القصة", content: "<h2>القصة</h2><p>عناصر القصة.</p>", questions: [{ id: "q1", question: "عناصر القصة؟", options: ["الشخصيات والحبكة والمكان", "العنوان", "الكلمات", "الجمل"], correctAnswer: 0, explanation: "الشخصيات والحبكة والمكان والزمان." }] },
    "arabic_adab_05": { id: "arabic_adab_05", title: "الأدب", description: "تاريخ الأدب", content: "<h2>الأدب</h2><p>المدارس الأدبية.</p>", questions: [{ id: "q1", question: "المدرسة الكلاسيكية؟", options: ["التجديد", "حفظ التراث", "رفض الماضي", "الشعر الحر"], correctAnswer: 1, explanation: "تحافظ على التراث." }] },
    "arabic_balagha_06": { id: "arabic_balagha_06", title: "البلاغة", description: "علوم البلاغة", content: "<h2>البلاغة</h2><p>البيان والمعاني والبديع.</p>", questions: [{ id: "q1", question: "أقسام البلاغة؟", options: ["1", "البيان والمعاني والبديع", "النحو والصرف", "القراءة"], correctAnswer: 1, explanation: "ثلاثة: البيان والمعاني والبديع." }] },
    "arabic_expression_07": { id: "arabic_expression_07", title: "التعبير", description: "الكتابة الإبداعية", content: "<h2>التعبير</h2><p>إبداعي ووظيفي.</p>", questions: [{ id: "q1", question: "أنواع التعبير؟", options: ["1", "إبداعي ووظيفي", "شفهي", "كتابي"], correctAnswer: 1, explanation: "إبداعي ووظيفي." }] },
    "arabic_sarf_08": { id: "arabic_sarf_08", title: "الصرف", description: "أبنية الكلمات", content: "<h2>الصرف</h2><p>دراسة أبنية الكلمات.</p>", questions: [{ id: "q1", question: "ما الصرف؟", options: ["أواخر الكلمات", "أبنية الكلمات", "المعاني", "الجمل"], correctAnswer: 1, explanation: "دراسة أبنية الكلمات." }] }
};

export default function LessonPage() {
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
        return (<div className="min-h-screen bg-gray-50 dark:bg-[#0a0a0f]" dir="rtl"><Navbar /><main className="container mx-auto px-4 py-20 text-center"><h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">الدرس غير موجود</h1><Link href="/arabic" className="text-primary-600 hover:underline">العودة</Link></main><Footer /></div>);
    }

    const questions = lesson.questions;
    const currentQ = questions[currentQuestion];
    const handleAnswerSelect = (i: number) => { if (!showResult) setSelectedAnswer(i); };
    const handleSubmit = () => { if (selectedAnswer === null) return; setShowResult(true); if (selectedAnswer === currentQ.correctAnswer && !answeredQuestions.has(currentQuestion)) setScore(s => s + 1); setAnsweredQuestions(p => new Set(p).add(currentQuestion)); };
    const handleNext = () => { if (currentQuestion < questions.length - 1) { setCurrentQuestion(c => c + 1); setSelectedAnswer(null); setShowResult(false); } else setIsQuizComplete(true); };
    const handleRestart = () => { setCurrentQuestion(0); setSelectedAnswer(null); setShowResult(false); setScore(0); setAnsweredQuestions(new Set()); setIsQuizComplete(false); };
    const pct = Math.round((score / questions.length) * 100);

    return (
        <div className="min-h-screen bg-gradient-to-b from-gray-50 via-white to-gray-50 dark:from-[#0a0a0f] dark:via-[#121218] dark:to-[#0a0a0f]" dir="rtl">
            <Navbar />
            <main className="relative z-10">
                <section className="container mx-auto px-4 sm:px-6 lg:px-8 pt-4 pb-8 max-w-4xl">
                    <motion.div initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }}><Link href="/arabic" className="inline-flex items-center gap-2 text-gray-500 hover:text-gray-900 dark:hover:text-white text-sm mb-6"><ArrowRight className="h-4 w-4" />العودة للدروس</Link></motion.div>
                    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
                        <div className="flex items-center gap-4 mb-4"><div className="p-3 rounded-xl bg-gradient-to-br from-primary-500 to-primary-600 shadow-lg shadow-primary-500/30"><FileText className="h-6 w-6 text-white" /></div><div><h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900 dark:text-white">{lesson.title}</h1><p className="text-gray-600 dark:text-gray-400 text-sm">{lesson.description}</p></div></div>
                        <div className="flex bg-gray-100 dark:bg-[#1c1c24] rounded-xl p-1.5 border border-gray-200/60 dark:border-[#2e2e3a]">
                            <button onClick={() => setActiveTab("content")} className={`flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg text-sm font-semibold transition-all ${activeTab === "content" ? "bg-white dark:bg-[#2e2e3a] text-gray-900 dark:text-white shadow-sm" : "text-gray-600 dark:text-gray-400"}`}><BookOpen className="h-4 w-4" />الشرح</button>
                            <button onClick={() => setActiveTab("quiz")} className={`flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg text-sm font-semibold transition-all ${activeTab === "quiz" ? "bg-white dark:bg-[#2e2e3a] text-gray-900 dark:text-white shadow-sm" : "text-gray-600 dark:text-gray-400"}`}><Target className="h-4 w-4" />اختبر نفسك<span className="px-2 py-0.5 rounded-full bg-primary-100 dark:bg-primary-900/30 text-primary-600 dark:text-primary-400 text-xs">{questions.length}</span></button>
                        </div>
                    </motion.div>
                </section>
                <section className="container mx-auto px-4 sm:px-6 lg:px-8 pb-16 max-w-4xl">
                    <AnimatePresence mode="wait">
                        {activeTab === "content" ? (
                            <motion.div key="content" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} className="bg-white dark:bg-[#1c1c24] rounded-2xl p-6 sm:p-8 border border-gray-200/60 dark:border-[#2e2e3a] shadow-sm">
                                <div className="prose prose-lg dark:prose-invert max-w-none" dangerouslySetInnerHTML={{ __html: lesson.content }} />
                                <div className="mt-8 pt-6 border-t border-gray-200 dark:border-gray-700"><button onClick={() => setActiveTab("quiz")} className="w-full flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-primary-500 to-primary-600 text-white font-semibold shadow-lg hover:-translate-y-0.5 transition-all"><Target className="h-5 w-5" />اختبر فهمك<ArrowLeft className="h-4 w-4" /></button></div>
                            </motion.div>
                        ) : (
                            <motion.div key="quiz" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}>
                                {!isQuizComplete ? (
                                    <div className="bg-white dark:bg-[#1c1c24] rounded-2xl p-6 sm:p-8 border border-gray-200/60 dark:border-[#2e2e3a] shadow-sm">
                                        <div className="flex justify-between mb-6"><span className="text-sm text-gray-500">السؤال {currentQuestion + 1} من {questions.length}</span><span className="text-sm font-semibold text-primary-600">النتيجة: {score}/{answeredQuestions.size}</span></div>
                                        <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded-full mb-8 overflow-hidden"><motion.div className="h-full bg-gradient-to-r from-primary-500 to-primary-600" initial={{ width: 0 }} animate={{ width: `${((currentQuestion + 1) / questions.length) * 100}%` }} /></div>
                                        <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-6">{currentQ.question}</h2>
                                        <div className="space-y-3 mb-8">{currentQ.options.map((opt, i) => { let cls = "border-gray-200 dark:border-gray-700 hover:border-primary-400"; if (showResult) { if (i === currentQ.correctAnswer) cls = "border-green-500 bg-green-50 dark:bg-green-900/20"; else if (i === selectedAnswer) cls = "border-red-500 bg-red-50 dark:bg-red-900/20"; } else if (selectedAnswer === i) cls = "border-primary-500 bg-primary-50 dark:bg-primary-900/20"; return (<button key={i} onClick={() => handleAnswerSelect(i)} disabled={showResult} className={`w-full text-right p-4 rounded-xl border-2 transition-all ${cls}`}><div className="flex items-center gap-3"><span className="w-8 h-8 rounded-lg bg-gray-100 dark:bg-gray-800 flex items-center justify-center text-sm font-bold">{String.fromCharCode(65 + i)}</span><span className="flex-1 text-gray-900 dark:text-white">{opt}</span>{showResult && i === currentQ.correctAnswer && <CheckCircle2 className="h-5 w-5 text-green-500" />}{showResult && i === selectedAnswer && i !== currentQ.correctAnswer && <XCircle className="h-5 w-5 text-red-500" />}</div></button>); })}</div>
                                        <AnimatePresence>{showResult && <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} className="mb-6 p-4 rounded-xl bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800"><p className="text-sm text-blue-800 dark:text-blue-200"><b>التوضيح:</b> {currentQ.explanation}</p></motion.div>}</AnimatePresence>
                                        <div className="flex gap-3">{!showResult ? <button onClick={handleSubmit} disabled={selectedAnswer === null} className="flex-1 flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-primary-500 to-primary-600 text-white font-semibold disabled:opacity-50">تأكيد</button> : <button onClick={handleNext} className="flex-1 flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-primary-500 to-primary-600 text-white font-semibold">{currentQuestion < questions.length - 1 ? <>التالي<ChevronLeft className="h-4 w-4" /></> : <><Trophy className="h-4 w-4" />النتيجة</>}</button>}</div>
                                    </div>
                                ) : (
                                    <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="bg-white dark:bg-[#1c1c24] rounded-2xl p-8 border border-gray-200/60 dark:border-[#2e2e3a] text-center">
                                        <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-gradient-to-br from-primary-500 to-primary-600 flex items-center justify-center"><Trophy className="h-10 w-10 text-white" /></div>
                                        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">أحسنت!</h2>
                                        <div className="text-5xl font-extrabold text-primary-600 mb-2">{pct}%</div>
                                        <p className="text-gray-500 mb-8">{score} من {questions.length} صحيحة</p>
                                        <div className="flex gap-3"><button onClick={handleRestart} className="flex-1 flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 font-semibold"><RotateCcw className="h-4 w-4" />إعادة</button><Link href="/arabic" className="flex-1 flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-primary-500 to-primary-600 text-white font-semibold">دروس أخرى<ArrowLeft className="h-4 w-4" /></Link></div>
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
