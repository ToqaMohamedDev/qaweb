// =============================================
// HowItWorksSection Component - كيف يعمل (Premium Glassmorphism - Purple Theme)
// =============================================

'use client';

import { motion } from 'framer-motion';
import { Target, MousePointer, ClipboardCheck, Trophy, Sparkles } from 'lucide-react';
import { containerVariants, itemVariants } from '@/lib/animations';

const steps = [
    {
        icon: MousePointer,
        title: 'اختر الموضوع',
        description: 'تصفح الدروس المتاحة واختر ما تريد دراسته'
    },
    {
        icon: ClipboardCheck,
        title: 'أجب على الأسئلة',
        description: 'حل الأسئلة التفاعلية واختبر معلوماتك'
    },
    {
        icon: Trophy,
        title: 'تابع تقدمك',
        description: 'شاهد نتائجك وتحسّن مستواك باستمرار'
    }
];

export function HowItWorksSection() {
    return (
        <section className="py-14 sm:py-20 bg-white dark:bg-[#0a0a0f]">
            <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-5xl">
                {/* Section Header */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5 }}
                    className="text-center mb-10 sm:mb-12"
                >
                    <div className="inline-flex items-center gap-2 px-3 py-1.5 mb-4 rounded-full bg-violet-500/10 backdrop-blur-sm border border-violet-400/30">
                        <Target className="h-3.5 w-3.5 text-violet-600 dark:text-violet-400" />
                        <span className="text-xs font-semibold text-violet-700 dark:text-violet-300">كيف يعمل</span>
                    </div>
                    <h2 className="text-2xl sm:text-3xl md:text-4xl font-extrabold text-gray-800 dark:text-white mb-3">
                        ثلاث خطوات فقط
                    </h2>
                </motion.div>

                {/* Steps Grid */}
                <motion.div
                    className="grid grid-cols-1 md:grid-cols-3 gap-5 sm:gap-6"
                    variants={containerVariants}
                    initial="hidden"
                    animate="visible"
                >
                    {steps.map((step, index) => (
                        <motion.div key={index} variants={itemVariants} className="group">
                            {/* Premium Glassmorphism Card - Purple Theme */}
                            <div className="relative overflow-hidden rounded-2xl transition-all duration-300 group-hover:scale-[1.02] group-hover:shadow-xl group-hover:shadow-violet-500/20">
                                {/* Gradient Border - Purple only */}
                                <div className="absolute inset-0 bg-gradient-to-br from-violet-500 via-purple-500 to-indigo-500 rounded-2xl p-[1.5px]" />

                                {/* Glass Background */}
                                <div className="absolute inset-[1.5px] rounded-[14px] bg-white/90 dark:bg-slate-900/90 backdrop-blur-xl" />

                                {/* Purple Cloud Glow Effect */}
                                <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-violet-500/8 via-transparent to-purple-500/8 dark:from-violet-500/15 dark:via-transparent dark:to-purple-500/15" />
                                <div className="absolute -top-10 -right-10 w-24 h-24 bg-violet-500/15 dark:bg-violet-500/25 rounded-full blur-2xl" />
                                <div className="absolute -bottom-6 -left-6 w-20 h-20 bg-purple-500/10 dark:bg-purple-500/20 rounded-full blur-xl" />

                                {/* Card Content */}
                                <div className="relative rounded-2xl p-6 text-center">
                                    {/* Top Glow Line */}
                                    <div className="absolute top-0 left-8 right-8 h-[1px] bg-gradient-to-r from-transparent via-violet-400/30 to-transparent" />

                                    {/* Icon with Number - Purple gradient */}
                                    <div className="relative inline-block mb-4">
                                        <div className="w-16 h-16 rounded-xl bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center shadow-lg shadow-violet-500/25">
                                            <step.icon className="h-8 w-8 text-white" />
                                        </div>
                                        <div className="absolute -top-2 -right-2 w-7 h-7 rounded-full bg-gradient-to-br from-purple-600 to-indigo-600 flex items-center justify-center text-white font-bold text-xs border-2 border-white dark:border-slate-800 shadow-md">
                                            {index + 1}
                                        </div>
                                    </div>

                                    {/* Title */}
                                    <h3 className="text-base sm:text-lg font-bold text-gray-800 dark:text-white mb-2 group-hover:text-violet-600 dark:group-hover:text-violet-300 transition-colors">
                                        {step.title}
                                    </h3>

                                    {/* Description */}
                                    <p className="text-sm text-gray-600 dark:text-gray-400">{step.description}</p>

                                    {/* Corner Sparkle */}
                                    <div className="absolute bottom-3 right-3">
                                        <Sparkles className="h-4 w-4 text-violet-400/50 group-hover:text-violet-500 transition-colors" />
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    ))}
                </motion.div>
            </div>
        </section>
    );
}

export default HowItWorksSection;
