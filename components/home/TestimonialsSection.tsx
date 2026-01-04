// =============================================
// TestimonialsSection Component - قسم آراء الطلاب
// =============================================

'use client';

import { motion } from 'framer-motion';
import { MessageSquare, Star } from 'lucide-react';
import { containerVariants, itemVariants } from '@/lib/animations';

const testimonials = [
    {
        name: 'أحمد محمد',
        role: 'طالب ثانوي',
        content: 'المنصة سهّلت علييا فهم قواعد اللغة العربية بطريقة ممتعة. الأسئلة التفاعلية ساعدتني كتير!',
        rating: 5,
    },
    {
        name: 'سارة أحمد',
        role: 'طالبة جامعية',
        content: 'أفضل منصة تعليمية استخدمتها. المحتوى متنوع والامتحانات شاملة. أنصح الكل بتجربتها!',
        rating: 5,
    },
    {
        name: 'محمود علي',
        role: 'معلم لغة',
        content: 'استخدمت المنصة مع طلابي ولاحظت تحسن كبير في مستواهم. محتوى قيّم جداً.',
        rating: 5,
    },
];

export function TestimonialsSection() {
    return (
        <section className="py-14 sm:py-20 bg-gray-50/50 dark:bg-[#0d0d12]">
            <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-5xl">
                {/* Section Header */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5 }}
                    className="text-center mb-10 sm:mb-12"
                >
                    <div className="inline-flex items-center gap-2 px-3 py-1.5 mb-4 rounded-full bg-primary-100/60 dark:bg-primary-900/20 border border-primary-200/50 dark:border-primary-700/30">
                        <MessageSquare className="h-3.5 w-3.5 text-primary-600 dark:text-primary-400" />
                        <span className="text-xs font-semibold text-primary-700 dark:text-primary-300">آراء الطلاب</span>
                    </div>
                    <h2 className="text-2xl sm:text-3xl md:text-4xl font-extrabold text-gray-900 dark:text-white mb-3">
                        ماذا يقول طلابنا؟
                    </h2>
                </motion.div>

                {/* Testimonials Grid */}
                <motion.div
                    className="grid grid-cols-1 md:grid-cols-3 gap-5 sm:gap-6"
                    variants={containerVariants}
                    initial="hidden"
                    animate="visible"
                >
                    {testimonials.map((testimonial, index) => (
                        <motion.div
                            key={index}
                            variants={itemVariants}
                            className="bg-white dark:bg-[#1c1c24] rounded-xl p-5 sm:p-6 border border-gray-200/60 dark:border-[#2e2e3a] shadow-sm"
                        >
                            {/* Stars */}
                            <div className="flex gap-0.5 mb-3">
                                {Array.from({ length: testimonial.rating }).map((_, i) => (
                                    <Star key={i} className="h-4 w-4 fill-amber-400 text-amber-400" />
                                ))}
                            </div>

                            {/* Content */}
                            <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed mb-4">
                                &quot;{testimonial.content}&quot;
                            </p>

                            {/* Author */}
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary-400 to-primary-600 flex items-center justify-center text-white font-bold text-sm">
                                    {testimonial.name.charAt(0)}
                                </div>
                                <div>
                                    <p className="font-bold text-sm text-gray-900 dark:text-white">{testimonial.name}</p>
                                    <p className="text-xs text-gray-500 dark:text-gray-400">{testimonial.role}</p>
                                </div>
                            </div>
                        </motion.div>
                    ))}
                </motion.div>
            </div>
        </section>
    );
}

export default TestimonialsSection;
