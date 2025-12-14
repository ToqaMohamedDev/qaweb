/**
 * Question Card Component
 * Enhanced design with exciting visuals and smooth animations
 */

'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface QuestionOption {
    id: string;
    text: string;
}

interface Question {
    id: string;
    orderIndex: number;
    totalQuestions: number;
    articleHtml?: string;
    questionText: string;
    options: QuestionOption[];
    timeLimitMs: number;
}

interface QuestionCardProps {
    question: Question;
    onAnswer: (optionId: string) => void;
    hasAnswered: boolean;
    selectedAnswer?: string;
    correctAnswer?: string;
    showResults?: boolean;
    disabled?: boolean;
}

const optionColors = [
    { bg: 'from-rose-500/20 to-pink-600/20', border: 'border-rose-400/50', hover: 'hover:from-rose-500/30 hover:to-pink-600/30', icon: '🔴' },
    { bg: 'from-blue-500/20 to-cyan-600/20', border: 'border-blue-400/50', hover: 'hover:from-blue-500/30 hover:to-cyan-600/30', icon: '🔵' },
    { bg: 'from-amber-500/20 to-orange-600/20', border: 'border-amber-400/50', hover: 'hover:from-amber-500/30 hover:to-orange-600/30', icon: '🟡' },
    { bg: 'from-emerald-500/20 to-teal-600/20', border: 'border-emerald-400/50', hover: 'hover:from-emerald-500/30 hover:to-teal-600/30', icon: '🟢' },
];

export function QuestionCard({
    question,
    onAnswer,
    hasAnswered,
    selectedAnswer,
    correctAnswer,
    showResults = false,
    disabled = false,
}: QuestionCardProps) {
    const [localSelected, setLocalSelected] = useState<string | null>(null);
    const [showConfetti, setShowConfetti] = useState(false);

    // Reset when question changes
    useEffect(() => {
        setLocalSelected(null);
        setShowConfetti(false);
    }, [question.id]);

    // Show confetti on correct answer
    useEffect(() => {
        if (showResults && selectedAnswer === correctAnswer) {
            setShowConfetti(true);
        }
    }, [showResults, selectedAnswer, correctAnswer]);

    const handleSelect = (optionId: string) => {
        if (hasAnswered || disabled) return;
        setLocalSelected(optionId);
        onAnswer(optionId);
    };

    const getOptionStatus = (optionId: string) => {
        if (!showResults) {
            if (optionId === (selectedAnswer || localSelected)) {
                return 'selected';
            }
            return 'default';
        }
        if (optionId === correctAnswer) {
            return 'correct';
        }
        if (optionId === selectedAnswer && optionId !== correctAnswer) {
            return 'incorrect';
        }
        return 'default';
    };

    return (
        <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="w-full"
        >
            {/* Confetti Effect */}
            <AnimatePresence>
                {showConfetti && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 pointer-events-none z-50 flex items-center justify-center"
                    >
                        {[...Array(20)].map((_, i) => (
                            <motion.div
                                key={i}
                                initial={{
                                    x: 0,
                                    y: 0,
                                    scale: 0,
                                    rotate: 0
                                }}
                                animate={{
                                    x: (Math.random() - 0.5) * 400,
                                    y: (Math.random() - 0.5) * 400,
                                    scale: [0, 1, 0],
                                    rotate: Math.random() * 360
                                }}
                                transition={{ duration: 1.5, delay: i * 0.02 }}
                                className="absolute text-2xl"
                            >
                                {['🎉', '⭐', '✨', '🏆', '💫'][i % 5]}
                            </motion.div>
                        ))}
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Question Header with Progress */}
            <div className="mb-6">
                <div className="flex items-center justify-between mb-3">
                    <motion.div
                        initial={{ x: -20, opacity: 0 }}
                        animate={{ x: 0, opacity: 1 }}
                        className="flex items-center gap-3"
                    >
                        <span className="text-4xl">❓</span>
                        <div>
                            <h3 className="text-lg font-bold text-white">
                                السؤال {question.orderIndex + 1}
                            </h3>
                            <p className="text-sm text-white/50">
                                من {question.totalQuestions} أسئلة
                            </p>
                        </div>
                    </motion.div>

                    {/* Progress Dots */}
                    <div className="flex gap-1.5">
                        {Array.from({ length: Math.min(question.totalQuestions, 10) }).map((_, i) => (
                            <motion.div
                                key={i}
                                initial={{ scale: 0 }}
                                animate={{ scale: 1 }}
                                transition={{ delay: i * 0.05 }}
                                className={`w-3 h-3 rounded-full transition-all ${i === question.orderIndex
                                        ? 'bg-gradient-to-r from-indigo-400 to-purple-400 ring-2 ring-white/30'
                                        : i < question.orderIndex
                                            ? 'bg-emerald-400/80'
                                            : 'bg-white/20'
                                    }`}
                            />
                        ))}
                        {question.totalQuestions > 10 && (
                            <span className="text-white/40 text-sm ml-1">+{question.totalQuestions - 10}</span>
                        )}
                    </div>
                </div>
            </div>

            {/* Article/Passage */}
            {question.articleHtml && (
                <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mb-6 p-6 rounded-2xl bg-gradient-to-br from-slate-800/80 to-slate-900/80 
                               border border-white/10 backdrop-blur-xl shadow-xl"
                >
                    <div className="flex items-center gap-2 mb-3 text-white/60">
                        <span>📖</span>
                        <span className="text-sm font-medium">اقرأ النص التالي:</span>
                    </div>
                    <div
                        className="prose prose-invert prose-sm max-w-none leading-relaxed
                                   prose-headings:text-white/90 prose-p:text-white/80"
                        dangerouslySetInnerHTML={{ __html: question.articleHtml }}
                    />
                </motion.div>
            )}

            {/* Question Box */}
            <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="mb-8 relative"
            >
                {/* Gradient border effect */}
                <div className="absolute -inset-[1px] bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 rounded-2xl blur-sm opacity-50" />
                <div className="relative p-6 rounded-2xl bg-gradient-to-br from-indigo-900/90 to-purple-900/80 
                               backdrop-blur-xl border border-white/10">
                    <h2 className="text-xl md:text-2xl font-bold text-white leading-relaxed text-center">
                        {question.questionText}
                    </h2>
                </div>
            </motion.div>

            {/* Options Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <AnimatePresence>
                    {question.options.map((option, index) => {
                        const status = getOptionStatus(option.id);
                        const isClickable = !hasAnswered && !disabled;
                        const colorStyle = optionColors[index % optionColors.length];

                        return (
                            <motion.button
                                key={option.id}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -20 }}
                                transition={{ delay: index * 0.1 }}
                                whileHover={isClickable ? { scale: 1.02, y: -2 } : {}}
                                whileTap={isClickable ? { scale: 0.98 } : {}}
                                onClick={() => handleSelect(option.id)}
                                disabled={!isClickable}
                                className={`
                                    relative p-5 rounded-2xl text-right transition-all duration-300
                                    ${isClickable ? 'cursor-pointer' : 'cursor-default'}
                                    ${status === 'selected'
                                        ? 'bg-gradient-to-br from-indigo-500/40 to-purple-600/40 border-2 border-indigo-400 ring-4 ring-indigo-400/30'
                                        : status === 'correct'
                                            ? 'bg-gradient-to-br from-emerald-500/40 to-green-600/40 border-2 border-emerald-400 ring-4 ring-emerald-400/30'
                                            : status === 'incorrect'
                                                ? 'bg-gradient-to-br from-red-500/40 to-rose-600/40 border-2 border-red-400 ring-4 ring-red-400/30'
                                                : `bg-gradient-to-br ${colorStyle.bg} border ${colorStyle.border} ${isClickable ? colorStyle.hover : ''}`
                                    }
                                `}
                            >
                                {/* Option Letter Badge */}
                                <div className="absolute top-3 left-3">
                                    <span className={`
                                        inline-flex items-center justify-center w-8 h-8 rounded-lg
                                        text-lg font-bold shadow-lg
                                        ${status === 'correct'
                                            ? 'bg-emerald-500 text-white'
                                            : status === 'incorrect'
                                                ? 'bg-red-500 text-white'
                                                : status === 'selected'
                                                    ? 'bg-indigo-500 text-white'
                                                    : 'bg-white/20 text-white/80'
                                        }
                                    `}>
                                        {option.id}
                                    </span>
                                </div>

                                {/* Option Text */}
                                <div className="pr-2 pl-12">
                                    <span className="text-white/90 text-lg leading-relaxed">
                                        {option.text}
                                    </span>
                                </div>

                                {/* Result Icon */}
                                {showResults && (
                                    <motion.div
                                        initial={{ scale: 0 }}
                                        animate={{ scale: 1 }}
                                        className="absolute top-3 right-3"
                                    >
                                        {status === 'correct' && (
                                            <span className="text-2xl">✅</span>
                                        )}
                                        {status === 'incorrect' && (
                                            <span className="text-2xl">❌</span>
                                        )}
                                    </motion.div>
                                )}

                                {/* Selection Animation */}
                                {status === 'selected' && !showResults && (
                                    <motion.div
                                        className="absolute inset-0 rounded-2xl border-2 border-indigo-400"
                                        animate={{
                                            boxShadow: ['0 0 0 0 rgba(99, 102, 241, 0.4)', '0 0 0 10px rgba(99, 102, 241, 0)']
                                        }}
                                        transition={{ duration: 1, repeat: Infinity }}
                                    />
                                )}
                            </motion.button>
                        );
                    })}
                </AnimatePresence>
            </div>

            {/* Answer Status */}
            <AnimatePresence>
                {(hasAnswered || showResults) && (
                    <motion.div
                        initial={{ opacity: 0, y: 20, scale: 0.9 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: -20, scale: 0.9 }}
                        className={`
                            mt-8 p-6 rounded-2xl text-center relative overflow-hidden
                            ${showResults
                                ? selectedAnswer === correctAnswer
                                    ? 'bg-gradient-to-br from-emerald-500/30 to-green-600/20 border-2 border-emerald-400/50'
                                    : 'bg-gradient-to-br from-red-500/30 to-rose-600/20 border-2 border-red-400/50'
                                : 'bg-gradient-to-br from-indigo-500/30 to-purple-600/20 border-2 border-indigo-400/50'
                            }
                        `}
                    >
                        {/* Animated background */}
                        <motion.div
                            className="absolute inset-0 opacity-30"
                            animate={{
                                background: [
                                    'radial-gradient(circle at 0% 0%, rgba(255,255,255,0.1) 0%, transparent 50%)',
                                    'radial-gradient(circle at 100% 100%, rgba(255,255,255,0.1) 0%, transparent 50%)',
                                    'radial-gradient(circle at 0% 0%, rgba(255,255,255,0.1) 0%, transparent 50%)',
                                ]
                            }}
                            transition={{ duration: 3, repeat: Infinity }}
                        />

                        <div className="relative z-10">
                            {showResults ? (
                                <div className="space-y-2">
                                    <div className="text-4xl mb-3">
                                        {selectedAnswer === correctAnswer ? '🎉' : selectedAnswer ? '😔' : '⏭️'}
                                    </div>
                                    <h3 className={`text-xl font-bold ${selectedAnswer === correctAnswer ? 'text-emerald-300' : 'text-red-300'
                                        }`}>
                                        {selectedAnswer === correctAnswer
                                            ? 'إجابة صحيحة! أحسنت! 🏆'
                                            : selectedAnswer
                                                ? 'إجابة خاطئة'
                                                : 'تم تخطي السؤال'
                                        }
                                    </h3>
                                    {selectedAnswer !== correctAnswer && (
                                        <p className="text-white/60">
                                            الإجابة الصحيحة: <span className="text-emerald-400 font-bold">{correctAnswer}</span>
                                        </p>
                                    )}
                                </div>
                            ) : (
                                <div className="flex items-center justify-center gap-3">
                                    <motion.div
                                        className="w-5 h-5 border-3 border-indigo-400 border-t-transparent rounded-full"
                                        animate={{ rotate: 360 }}
                                        transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                                    />
                                    <span className="text-indigo-300 font-medium text-lg">
                                        تم إرسال إجابتك... في انتظار النتائج
                                    </span>
                                </div>
                            )}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </motion.div>
    );
}
