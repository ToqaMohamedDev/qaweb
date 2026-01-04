// =============================================
// HowItWorksSection Component - قسم كيف يعمل
// =============================================

'use client';

import { motion } from 'framer-motion';
import { Target, GraduationCap, BookOpen, Award } from 'lucide-react';
import { containerVariants, itemVariants } from '@/lib/animations';

const steps = [
    {
        icon: GraduationCap,
        title: 'اختر المادة',
        description: 'اختر بين اللغة العربية أو الإنجليزية',
    },
    {
        icon: BookOpen,
        title: 'تعلم واستكشف',
        description: 'استعرض الدروس والأسئلة التفاعلية',
    },
    {
        icon: Award,
        title: 'اختبر نفسك',
        description: 'قيّم مستواك من خلال امتحانات متنوعة',
    },
];

export function HowItWorksSection() {
    return (
        <section className="py-14 sm:py-20">
            <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-5xl">
                {/* Section Header */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5 }}
                    className="text-center mb-10 sm:mb-12"
                >
                    <div className="inline-flex items-center gap-2 px-3 py-1.5 mb-4 rounded-full bg-primary-100/60 dark:bg-primary-900/20 border border-primary-200/50 dark:border-primary-700/30">
                        <Target className="h-3.5 w-3.5 text-primary-600 dark:text-primary-400" />
                        <span className="text-xs font-semibold text-primary-700 dark:text-primary-300">كيف يعمل</span>
                    </div>
                    <h2 className="text-2xl sm:text-3xl md:text-4xl font-extrabold text-gray-900 dark:text-white mb-3">
                        ثلاث خطوات فقط
                    </h2>
                    <p className="text-sm sm:text-base text-gray-600 dark:text-gray-400 max-w-lg mx-auto">
                        ابدأ رحلتك التعليمية بخطوات بسيطة
                    </p>
                </motion.div>

                {/* Steps */}
                <motion.div
                    className="grid grid-cols-1 md:grid-cols-3 gap-6 sm:gap-8"
                    variants={containerVariants}
                    initial="hidden"
                    animate="visible"
                >
                    {steps.map((step, index) => (
                        <motion.div key={index} variants={itemVariants} className="relative text-center">
                            <div className="relative inline-block mb-4">
                                <div className="w-16 h-16 rounded-xl bg-gradient-to-br from-primary-500 to-primary-600 flex items-center justify-center shadow-lg shadow-primary-500/25">
                                    <step.icon className="h-8 w-8 text-white" />
                                </div>
                                <div className="absolute -top-2 -right-2 w-7 h-7 rounded-full bg-primary-100 dark:bg-primary-900 flex items-center justify-center text-primary-600 dark:text-primary-400 font-bold text-xs border-2 border-white dark:border-[#121218]">
                                    {index + 1}
                                </div>
                            </div>
                            <h3 className="text-base sm:text-lg font-bold text-gray-900 dark:text-white mb-2">
                                {step.title}
                            </h3>
                            <p className="text-sm text-gray-600 dark:text-gray-400">{step.description}</p>
                        </motion.div>
                    ))}
                </motion.div>
            </div>
        </section>
    );
}

export default HowItWorksSection;
