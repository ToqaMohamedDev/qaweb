// =============================================
// TeacherCard Component - كارت المعلم (Light/Dark Mode)
// =============================================

'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import {
    FileText,
    CheckCircle2,
    UserCheck,
    ChevronDown,
    Loader2,
    Award,
    Users
} from 'lucide-react';
import { itemVariants } from '@/lib/animations';
import { formatCount } from '@/lib/utils/formatters';
import { Avatar } from '@/components/common';
import type { Teacher } from '@/lib/types';

export interface TeacherCardProps {
    teacher: Teacher;
    index?: number;
    isSubscribed: boolean;
    isLoading?: boolean;
    isFeatured?: boolean;
    isOwnProfile?: boolean;
    onSubscribe: () => void;
}

export function TeacherCard({
    teacher,
    isSubscribed,
    isLoading = false,
    isFeatured = false,
    isOwnProfile = false,
    onSubscribe,
}: TeacherCardProps) {
    const featured = isFeatured || teacher.isFeatured || false;

    return (
        <motion.div
            layout
            variants={itemVariants}
            initial="hidden"
            animate="visible"
            exit="hidden"
            className="group cursor-pointer"
        >
            {/* Premium Glassmorphism Card */}
            <div className={`relative overflow-hidden rounded-2xl transition-all duration-300 group-hover:scale-[1.02] group-hover:shadow-xl ${featured ? 'group-hover:shadow-amber-500/20' : 'group-hover:shadow-violet-500/20'}`}>
                {/* Gradient Border */}
                <div className={`absolute inset-0 bg-gradient-to-br p-[1.5px] rounded-2xl ${featured
                    ? "from-amber-400 via-orange-500 to-pink-500"
                    : "from-violet-500 via-purple-600 to-indigo-700"
                    }`} />

                {/* Glass Background */}
                <div className="absolute inset-[1.5px] rounded-[14px] bg-white/90 dark:bg-slate-900/90 backdrop-blur-xl" />

                {/* Cloud Glow Effect */}
                <div className={`absolute inset-0 rounded-2xl bg-gradient-to-br via-transparent ${featured
                    ? 'from-amber-500/10 to-orange-500/10 dark:from-amber-500/20 dark:to-orange-500/20'
                    : 'from-violet-500/10 to-purple-500/10 dark:from-violet-500/20 dark:to-purple-500/20'
                    }`} />
                <div className={`absolute -top-12 -right-12 w-32 h-32 rounded-full blur-3xl ${featured ? 'bg-amber-500/20 dark:bg-amber-500/30' : 'bg-violet-500/20 dark:bg-violet-500/30'}`} />
                <div className={`absolute -bottom-8 -left-8 w-24 h-24 rounded-full blur-2xl ${featured ? 'bg-orange-500/15 dark:bg-orange-500/25' : 'bg-purple-500/15 dark:bg-purple-500/25'}`} />

                {/* Card Content Container */}
                <div className="relative rounded-2xl overflow-hidden">
                    {/* Top Glow Line */}
                    <div className={`absolute top-0 left-8 right-8 h-[1px] bg-gradient-to-r from-transparent to-transparent z-10 ${featured ? "via-amber-400/40" : "via-violet-400/40"
                        }`} />

                    {/* Thumbnail Section */}
                    <div className="relative aspect-[21/9] overflow-hidden">
                        <Link href={`/teachers/${teacher.id}`} className="block w-full h-full">
                            {teacher.coverImageURL ? (
                                <img
                                    src={teacher.coverImageURL}
                                    alt=""
                                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                                    style={{ height: '100%' }}
                                />
                            ) : (
                                <div className={`w-full h-full ${featured
                                    ? "bg-gradient-to-br from-amber-400 via-orange-500 to-pink-500"
                                    : "bg-gradient-to-br from-violet-500 via-purple-600 to-indigo-700"
                                    }`}>
                                    {/* Decorative Pattern */}
                                    <div className="absolute inset-0 opacity-20">
                                        <div className="absolute top-0 left-0 w-40 h-40 bg-white/30 rounded-full -translate-x-1/2 -translate-y-1/2" />
                                        <div className="absolute bottom-0 right-0 w-32 h-32 bg-white/20 rounded-full translate-x-1/3 translate-y-1/3" />
                                        <div className="absolute top-1/2 left-1/2 w-24 h-24 bg-white/10 rounded-full -translate-x-1/2 -translate-y-1/2" />
                                    </div>
                                    {/* Center Initial */}
                                    <div className="absolute inset-0 flex items-center justify-center">
                                        <span className="text-6xl sm:text-7xl font-bold text-white/90 drop-shadow-lg">
                                            {(teacher.displayName || teacher.name || '?').charAt(0)}
                                        </span>
                                    </div>
                                </div>
                            )}

                            {/* Gradient Overlay at bottom for text readability */}
                            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />

                            {/* Featured Badge - Top Right */}
                            {featured && (
                                <div className="absolute top-3 right-3 z-10">
                                    <div className="flex items-center gap-1 px-2 py-1 rounded-md bg-gradient-to-r from-amber-400 to-orange-500 text-xs font-bold text-black shadow-lg">
                                        <Award className="h-3 w-3" />
                                        <span>مميز</span>
                                    </div>
                                </div>
                            )}

                            {/* Exam Count Badge - Bottom Right on Image */}
                            <div className="absolute bottom-3 right-3 z-10">
                                <div className="flex items-center gap-1 px-2 py-1 rounded-md bg-black/50 text-white text-xs font-medium backdrop-blur-sm">
                                    <FileText className="h-3 w-3" />
                                    <span>{teacher.examsCount ?? (teacher as any).exams_count ?? 0} اختبار</span>
                                </div>
                            </div>

                            {/* Subscribers Count - Bottom Left on Image */}
                            <div className="absolute bottom-3 left-3 z-10">
                                <div className="flex items-center gap-1 px-2 py-1 rounded-md bg-black/50 text-white text-xs font-medium backdrop-blur-sm">
                                    <Users className="h-3 w-3" />
                                    <span>{formatCount(teacher.subscriberCount ?? (teacher as any).subscriber_count ?? 0)} مشترك</span>
                                </div>
                            </div>
                        </Link>
                    </div>

                    {/* Info Section */}
                    <div className="px-3 py-2.5 bg-white dark:bg-slate-900 relative z-10">
                        <div className="flex items-center gap-3">
                            {/* Avatar */}
                            <Link href={`/teachers/${teacher.id}`} className="flex-shrink-0 relative -mt-7 z-10">
                                <Avatar
                                    src={teacher.photoURL || teacher.avatar_url}
                                    name={teacher.displayName || teacher.name || 'معلم'}
                                    size="md"
                                    ring={true}
                                    ringColor={featured ? 'ring-amber-500' : 'ring-violet-500'}
                                    className="!border-3 !border-white dark:!border-slate-900 shadow-xl"
                                    customGradient={featured ? 'from-amber-400 to-orange-500' : 'from-violet-500 to-purple-600'}
                                    containerClassName="transition-transform duration-200 group-hover:scale-105"
                                />
                            </Link>

                            {/* Name with Verified Icon and Specialty */}
                            <div className="flex-1 min-w-0 py-1">
                                <Link href={`/teachers/${teacher.id}`}>
                                    <h3 className="text-sm font-bold text-gray-900 dark:text-white line-clamp-1 group-hover:text-primary-600 dark:group-hover:text-primary-300 transition-colors flex items-center gap-1.5">
                                        {teacher.displayName || teacher.name || 'معلم'}
                                        {teacher.isVerified && (
                                            <CheckCircle2 className="h-4 w-4 text-blue-500 flex-shrink-0" />
                                        )}
                                    </h3>
                                </Link>
                                <p className="text-xs text-gray-500 dark:text-gray-400 truncate mt-0.5">
                                    {teacher.specialty || teacher.bio || 'معلم'}
                                </p>
                            </div>

                            {/* Subscribe Button */}
                            {isOwnProfile ? (
                                <div className="px-3 py-1.5 rounded-full font-medium text-xs bg-gray-100 dark:bg-slate-800 text-gray-600 dark:text-gray-400 flex-shrink-0">
                                    أنت
                                </div>
                            ) : (
                                <motion.button
                                    onClick={(e) => { e.preventDefault(); e.stopPropagation(); onSubscribe(); }}
                                    whileHover={{ scale: isLoading ? 1 : 1.05 }}
                                    whileTap={{ scale: isLoading ? 1 : 0.95 }}
                                    disabled={isLoading}
                                    className={`px-3.5 py-1.5 rounded-full font-medium text-xs transition-all duration-200 flex items-center gap-1.5 flex-shrink-0 ${isLoading
                                        ? "bg-gray-100 dark:bg-slate-800 text-gray-400 cursor-wait"
                                        : isSubscribed
                                            ? "bg-gray-100 dark:bg-slate-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-slate-700"
                                            : "bg-gradient-to-r from-violet-600 to-purple-600 text-white shadow-md shadow-violet-500/20"
                                        }`}
                                >
                                    {isLoading ? (
                                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                                    ) : isSubscribed ? (
                                        <>
                                            <UserCheck className="h-3.5 w-3.5" />
                                            <span>مُشترك</span>
                                        </>
                                    ) : (
                                        <span>اشتراك</span>
                                    )}
                                </motion.button>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </motion.div>
    );
}

export default TeacherCard;
