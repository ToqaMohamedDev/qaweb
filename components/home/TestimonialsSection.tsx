// =============================================
// TestimonialsSection Component - قسم آراء الطلاب (Premium Glassmorphism)
// =============================================

'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { MessageSquare, Star } from 'lucide-react';
import { itemVariants } from '@/lib/animations';

// =============================================
// Types
// =============================================

interface TestimonialProfile {
    id: string;
    name: string;
    avatar_url: string | null;
    role: string;
}

interface Testimonial {
    id: string;
    content: string;
    rating: number;
    created_at: string;
    profiles: TestimonialProfile;
}


const getRoleLabel = (role: string) => {
    switch (role) {
        case 'student': return 'طالب';
        case 'teacher': return 'معلم';
        case 'admin': return 'مدير';
        default: return 'مستخدم';
    }
};

export function TestimonialsSection() {
    const [testimonials, setTestimonials] = useState<Testimonial[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    const fetchTestimonials = useCallback(async () => {
        try {
            setIsLoading(true);
            const res = await fetch('/api/testimonials?limit=6');
            if (res.ok) {
                const result = await res.json();
                console.log('[TestimonialsSection] API Response:', result);
                console.log('[TestimonialsSection] Testimonials data:', result.data);
                setTestimonials(result.data || []);
            } else {
                console.error('[TestimonialsSection] API Error:', res.status, res.statusText);
            }
        } catch (error) {
            console.error('[TestimonialsSection] Fetch Error:', error);
            setTestimonials([]);
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchTestimonials();
    }, [fetchTestimonials]);

    // Debug logging
    console.log('[TestimonialsSection] Render - isLoading:', isLoading, 'testimonials count:', testimonials.length);
    console.log('[TestimonialsSection] Testimonials:', testimonials);

    // Don't render section if no testimonials and not loading
    if (!isLoading && testimonials.length === 0) {
        console.log('[TestimonialsSection] Not rendering - no testimonials');
        return null;
    }

    return (
        <section className="py-16 sm:py-20">
            <div className="container mx-auto px-4 sm:px-6 max-w-5xl">
                {/* Section Header */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5 }}
                    className="text-center mb-10"
                >
                    <div className="inline-flex items-center gap-2 px-3 py-1.5 mb-4 rounded-full bg-primary-500/10 border border-primary-500/20">
                        <MessageSquare className="h-3.5 w-3.5 text-primary-500" />
                        <span className="text-xs font-semibold text-primary-600 dark:text-primary-400">آراء الطلاب</span>
                    </div>
                    <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white mb-2">
                        ماذا يقول طلابنا؟
                    </h2>
                </motion.div>

                {/* Debug Info */}
                {isLoading && (
                    <div className="text-center text-gray-600 dark:text-gray-400">
                        جاري التحميل...
                    </div>
                )}
                
                {!isLoading && testimonials.length === 0 && (
                    <div className="text-center text-gray-600 dark:text-gray-400">
                        لا توجد آراء حالياً
                    </div>
                )}

                {/* Testimonials Grid */}
                {!isLoading && testimonials.length > 0 && (
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        {testimonials.slice(0, 3).map((testimonial) => (
                        <motion.div
                            key={testimonial.id}
                            variants={itemVariants}
                            className="group"
                        >
                            {/* Clean Card Design */}
                            <div className="h-full p-5 rounded-2xl bg-white dark:bg-white/5 border border-gray-100 dark:border-white/10 hover:border-primary-200 dark:hover:border-primary-800 hover:shadow-lg hover:shadow-gray-100 dark:hover:shadow-none transition-all duration-200">
                                {/* Stars */}
                                <div className="flex gap-0.5 mb-3">
                                    {Array.from({ length: testimonial.rating }).map((_, i) => (
                                        <Star key={i} className="h-4 w-4 fill-primary-400 text-primary-400" />
                                    ))}
                                </div>

                                {/* Content */}
                                <p className="text-sm text-gray-600 dark:text-gray-300 leading-relaxed mb-4">
                                    &quot;{testimonial.content}&quot;
                                </p>

                                {/* Author */}
                                <div className="flex items-center gap-3 pt-3 border-t border-gray-100 dark:border-white/10">
                                    <div className="w-9 h-9 rounded-full bg-primary-500 flex items-center justify-center text-white font-semibold text-sm">
                                        {testimonial.profiles?.name?.charAt(0) || '؟'}
                                    </div>
                                    <div>
                                        <p className="font-semibold text-sm text-gray-900 dark:text-white">{testimonial.profiles?.name || 'مستخدم'}</p>
                                        <p className="text-xs text-gray-500 dark:text-gray-400">{getRoleLabel(testimonial.profiles?.role)}</p>
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    ))}
                    </div>
                )}
            </div>
        </section>
    );
}

export default TestimonialsSection;
