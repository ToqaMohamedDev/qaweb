// =============================================
// TestimonialsSection Component - قسم آراء الطلاب (Premium Glassmorphism)
// =============================================

'use client';

import { motion } from 'framer-motion';
import { MessageSquare, Star, Sparkles } from 'lucide-react';
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
                    <div className="inline-flex items-center gap-2 px-3 py-1.5 mb-4 rounded-full bg-amber-500/10 backdrop-blur-sm border border-amber-400/30">
                        <MessageSquare className="h-3.5 w-3.5 text-amber-600 dark:text-amber-400" />
                        <span className="text-xs font-semibold text-amber-700 dark:text-amber-300">آراء الطلاب</span>
                    </div>
                    <h2 className="text-2xl sm:text-3xl md:text-4xl font-extrabold text-gray-800 dark:text-white mb-3">
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
                            className="group"
                        >
                            {/* Premium Glassmorphism Card */}
                            <div className="relative overflow-hidden rounded-2xl transition-all duration-300 group-hover:scale-[1.02] group-hover:shadow-xl group-hover:shadow-amber-500/20">
                                {/* Gradient Border */}
                                <div className="absolute inset-0 bg-gradient-to-br from-amber-500 via-orange-500 to-pink-500 rounded-2xl p-[1.5px]" />

                                {/* Glass Background */}
                                <div className="absolute inset-[1.5px] rounded-[14px] bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl" />

                                {/* Amber Cloud Glow Effect */}
                                <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-amber-500/10 via-transparent to-orange-500/10 dark:from-amber-500/20 dark:via-transparent dark:to-orange-500/20" />
                                <div className="absolute -top-12 -right-12 w-32 h-32 bg-amber-500/20 dark:bg-amber-500/30 rounded-full blur-3xl" />
                                <div className="absolute -bottom-8 -left-8 w-24 h-24 bg-orange-500/15 dark:bg-orange-500/25 rounded-full blur-2xl" />

                                {/* Card Content */}
                                <div className="relative rounded-2xl p-5 sm:p-6">
                                    {/* Top Glow Line */}
                                    <div className="absolute top-0 left-8 right-8 h-[1px] bg-gradient-to-r from-transparent via-amber-400/40 to-transparent" />

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
                                    <div className="flex items-center gap-3 pt-3 border-t border-amber-200/50 dark:border-amber-500/20">
                                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center text-white font-bold text-sm shadow-lg shadow-amber-500/30">
                                            {testimonial.name.charAt(0)}
                                        </div>
                                        <div>
                                            <p className="font-bold text-sm text-gray-800 dark:text-white">{testimonial.name}</p>
                                            <p className="text-xs text-amber-600 dark:text-amber-300/70">{testimonial.role}</p>
                                        </div>
                                    </div>

                                    {/* Corner Sparkle */}
                                    <div className="absolute bottom-3 right-3">
                                        <Sparkles className="h-4 w-4 text-amber-400/60 group-hover:text-amber-500 transition-colors" />
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

export default TestimonialsSection;
