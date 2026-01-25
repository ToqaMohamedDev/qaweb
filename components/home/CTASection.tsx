// =============================================
// CTASection Component - قسم الدعوة للعمل (Clean Design)
// =============================================

'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import { Rocket, ArrowLeft, Sparkles, Users, BookOpen, Trophy, Star } from 'lucide-react';
import { useDashboard } from '@/hooks/useDashboard';
import { CountUp } from '@/components/ui/CountUp';

export function CTASection() {
    const { stats } = useDashboard();

    return (
        <section className="py-16 sm:py-20">
            <div className="container mx-auto px-4 sm:px-6 max-w-6xl">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.5 }}
                    className="relative rounded-2xl overflow-hidden bg-primary-600"
                >
                    {/* Subtle Background */}
                    <div className="absolute top-0 right-0 w-72 h-72 bg-white/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/4" />
                    <div className="absolute bottom-0 left-0 w-60 h-60 bg-primary-400/20 rounded-full blur-3xl translate-y-1/2 -translate-x-1/4" />

                    {/* Content */}
                    <div className="relative px-6 py-10 sm:px-10 sm:py-12 lg:px-16 lg:py-14">
                        <div className="grid lg:grid-cols-2 gap-8 lg:gap-12 items-center">
                            {/* Text Content */}
                            <div className="text-center lg:text-right">
                                <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/20 mb-5">
                                    <Sparkles className="w-3.5 h-3.5 text-white" />
                                    <span className="text-xs font-semibold text-white">ابدأ مجانًا اليوم</span>
                                </div>

                                <h2 className="text-2xl sm:text-3xl font-bold text-white mb-3">
                                    جاهز تبدأ رحلة التفوق؟
                                </h2>

                                <p className="text-white/80 mb-6 max-w-md mx-auto lg:mx-0">
                                    انضم لآلاف الطلاب المتفوقين وابدأ رحلتك نحو النجاح الآن
                                </p>

                                <div className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-3">
                                    <Link
                                        href="/signup"
                                        className="group w-full sm:w-auto flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-white text-primary-600 font-semibold hover:bg-gray-50 transition-colors"
                                    >
                                        <Rocket className="w-5 h-5" />
                                        <span>إنشاء حساب مجاني</span>
                                        <ArrowLeft className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform rtl:rotate-180" />
                                    </Link>
                                    <Link
                                        href="/arabic"
                                        className="w-full sm:w-auto flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-white/10 text-white font-semibold border border-white/20 hover:bg-white/20 transition-colors"
                                    >
                                        <BookOpen className="w-5 h-5" />
                                        <span>استكشف الدروس</span>
                                    </Link>
                                </div>
                            </div>

                            {/* Stats - Compact Bar */}
                            <div className="hidden lg:block">
                                <div className="bg-white/10 rounded-xl border border-white/20 overflow-hidden">
                                    <div className="grid grid-cols-2 divide-x divide-y divide-white/10 rtl:divide-x-reverse">
                                        {[
                                            { icon: Users, value: stats.totalUsers, label: "طالب نشط" },
                                            { icon: BookOpen, value: stats.totalLessons, label: "درس متاح" },
                                            { icon: Trophy, value: stats.successRate, label: "نسبة النجاح", suffix: "%" },
                                            { icon: Star, value: stats.averageRating, label: "التقييم", decimals: 1 },
                                        ].map((stat, i) => {
                                            let displayValue = stat.value;
                                            let suffix = stat.suffix || "";
                                            let decimals = stat.decimals || 0;
                                            if (!stat.suffix && stat.value >= 1000) {
                                                displayValue = stat.value / 1000;
                                                suffix = "K+";
                                                decimals = 1;
                                            }
                                            return (
                                                <div key={i} className="p-4 flex items-center gap-3">
                                                    <div className="w-10 h-10 rounded-lg bg-white/10 flex items-center justify-center shrink-0">
                                                        <stat.icon className="w-5 h-5 text-white/80" />
                                                    </div>
                                                    <div>
                                                        <div className="text-lg font-bold text-white">
                                                            <CountUp value={displayValue} suffix={suffix} decimals={decimals} duration={2} />
                                                        </div>
                                                        <p className="text-xs text-white/60">{stat.label}</p>
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </motion.div>
            </div>
        </section>
    );
}

export default CTASection;
