// =============================================
// CTASection Component - قسم الدعوة للعمل
// =============================================

'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import { Rocket, ArrowLeft } from 'lucide-react';

export function CTASection() {
    return (
        <section className="py-14 sm:py-20">
            <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-3xl">
                <motion.div
                    initial={{ opacity: 0, y: 25 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6 }}
                    className="relative text-center bg-gradient-to-br from-primary-600 via-primary-500 to-primary-600 dark:from-primary-800 dark:via-primary-700 dark:to-primary-800 rounded-2xl p-8 sm:p-12 overflow-hidden"
                >
                    {/* Background Elements */}
                    <div className="absolute inset-0 opacity-20">
                        <div className="absolute top-0 right-0 w-48 h-48 bg-white rounded-full blur-3xl" />
                        <div className="absolute bottom-0 left-0 w-56 h-56 bg-white rounded-full blur-3xl" />
                    </div>

                    <div className="relative z-10">
                        <div className="inline-flex items-center justify-center w-14 h-14 mb-5 rounded-xl bg-white/20 backdrop-blur-sm">
                            <Rocket className="h-7 w-7 text-white" />
                        </div>

                        <h2 className="text-2xl sm:text-3xl md:text-4xl font-extrabold text-white mb-3">
                            جاهز تبدأ رحلتك؟
                        </h2>
                        <p className="text-sm sm:text-base text-white/90 max-w-md mx-auto mb-6">
                            انضم لآلاف الطلاب الذين يتعلمون معنا يومياً
                        </p>

                        <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
                            <Link
                                href="/signup"
                                className="group flex items-center gap-2 px-6 py-3 rounded-xl bg-white text-primary-600 font-bold shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-0.5"
                            >
                                <span>إنشاء حساب مجاني</span>
                                <ArrowLeft className="h-4 w-4 group-hover:-translate-x-1 transition-transform" />
                            </Link>
                            <Link
                                href="/arabic"
                                className="flex items-center gap-2 px-6 py-3 rounded-xl bg-white/20 backdrop-blur-sm text-white font-bold border border-white/30 hover:bg-white/30 transition-all duration-300"
                            >
                                <span>استكشف الدروس</span>
                            </Link>
                        </div>
                    </div>
                </motion.div>
            </div>
        </section>
    );
}

export default CTASection;
