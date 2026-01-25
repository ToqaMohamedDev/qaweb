// =============================================
// HowItWorksSection Component - كيف يعمل (Clean Design)
// =============================================

'use client';

import { motion } from 'framer-motion';
import { Target, MousePointer, ClipboardCheck, Trophy } from 'lucide-react';

const steps = [
    {
        icon: MousePointer,
        title: 'اختر المادة',
        description: 'تصفح المواد الدراسية واختر ما تريد مراجعته',
        step: 1
    },
    {
        icon: ClipboardCheck,
        title: 'حل الأسئلة',
        description: 'أجب على الأسئلة التفاعلية واختبر فهمك للمادة',
        step: 2
    },
    {
        icon: Trophy,
        title: 'تابع تقدمك',
        description: 'راقب نتائجك وتحسّن مستواك بشكل مستمر',
        step: 3
    }
];

const fadeInUp = {
    hidden: { opacity: 0, y: 16 },
    visible: { 
        opacity: 1, 
        y: 0,
        transition: { duration: 0.4 }
    }
};

const staggerContainer = {
    hidden: { opacity: 0 },
    visible: {
        opacity: 1,
        transition: { staggerChildren: 0.1 }
    }
};

export function HowItWorksSection() {
    return (
        <section className="py-16 sm:py-20 bg-gray-50/50 dark:bg-white/[0.02]">
            <div className="container mx-auto px-4 sm:px-6 max-w-6xl">
                {/* Section Header */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.5 }}
                    className="text-center mb-10 sm:mb-12"
                >
                    <div className="inline-flex items-center gap-2 px-3 py-1.5 mb-4 rounded-full bg-primary-500/10 border border-primary-500/20">
                        <Target className="h-3.5 w-3.5 text-primary-500" />
                        <span className="text-xs font-semibold text-primary-600 dark:text-primary-400">خطوات بسيطة</span>
                    </div>
                    <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white mb-3">
                        ابدأ في <span className="text-primary-600 dark:text-primary-400">3 خطوات</span>
                    </h2>
                    <p className="text-gray-500 dark:text-gray-400 max-w-lg mx-auto">
                        طريقة سهلة ومبسطة للتعلم والمراجعة
                    </p>
                </motion.div>

                {/* Steps */}
                <motion.div
                    className="grid grid-cols-1 md:grid-cols-3 gap-4"
                    variants={staggerContainer}
                    initial="hidden"
                    whileInView="visible"
                    viewport={{ once: true }}
                >
                    {steps.map((step, index) => (
                        <motion.div 
                            key={index} 
                            variants={fadeInUp}
                            className="group"
                        >
                            <div className="h-full p-6 rounded-2xl bg-white dark:bg-white/5 border border-gray-100 dark:border-white/10 hover:border-primary-200 dark:hover:border-primary-800 hover:shadow-lg hover:shadow-gray-100 dark:hover:shadow-none transition-all duration-200">
                                {/* Step Number */}
                                <div className="flex items-center justify-between mb-4">
                                    <div className="w-12 h-12 rounded-xl bg-primary-500/10 dark:bg-primary-500/20 flex items-center justify-center group-hover:scale-105 transition-transform duration-200">
                                        <step.icon className="w-6 h-6 text-primary-600 dark:text-primary-400" />
                                    </div>
                                    <span className="w-8 h-8 rounded-full bg-gray-100 dark:bg-white/10 flex items-center justify-center text-sm font-bold text-gray-500 dark:text-gray-400">
                                        {step.step}
                                    </span>
                                </div>

                                {/* Content */}
                                <h3 className="text-base font-bold text-gray-900 dark:text-white mb-2">
                                    {step.title}
                                </h3>
                                <p className="text-sm text-gray-500 dark:text-gray-400 leading-relaxed">
                                    {step.description}
                                </p>
                            </div>
                        </motion.div>
                    ))}
                </motion.div>
            </div>
        </section>
    );
}

export default HowItWorksSection;
