// =============================================
// TeacherCard Component - كارت المعلم
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
    Award
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
            <div className="relative">
                {/* Thumbnail Container - نسبة 2.5:1 */}
                <Link href={`/teachers/${teacher.id}`}>
                    <div className="relative overflow-hidden rounded-xl bg-gray-100 dark:bg-[#1c1c24]" style={{ aspectRatio: '2.5/1' }}>
                        {/* Cover Image as Thumbnail */}
                        {teacher.coverImageURL ? (
                            <img
                                src={teacher.coverImageURL}
                                alt=""
                                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                            />
                        ) : (
                            <div className={`absolute inset-0 ${featured
                                ? "bg-gradient-to-br from-amber-400 via-orange-500 to-pink-500"
                                : "bg-gradient-to-br from-violet-500 via-purple-600 to-indigo-700"
                                }`}>
                                {/* Decorative Pattern */}
                                <div className="absolute inset-0 opacity-20">
                                    <div className="absolute top-0 left-0 w-32 h-32 bg-white/30 rounded-full -translate-x-1/2 -translate-y-1/2" />
                                    <div className="absolute bottom-0 right-0 w-24 h-24 bg-white/20 rounded-full translate-x-1/3 translate-y-1/3" />
                                </div>
                                {/* Center Initial */}
                                <div className="absolute inset-0 flex items-center justify-center">
                                    <span className="text-4xl sm:text-5xl font-bold text-white/95 drop-shadow-lg">
                                        {(teacher.displayName || teacher.name || '?').charAt(0)}
                                    </span>
                                </div>
                            </div>
                        )}

                        {/* Hover Overlay */}
                        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors duration-300" />

                        {/* Featured Badge */}
                        {featured && (
                            <div className="absolute top-2 right-2 z-10">
                                <div className="flex items-center gap-1 px-2 py-1 rounded-md bg-gradient-to-r from-amber-400 to-orange-500 text-[10px] sm:text-xs font-bold text-black shadow-lg">
                                    <Award className="h-3 w-3" />
                                    <span>مميز</span>
                                </div>
                            </div>
                        )}

                        {/* Exam Count Badge */}
                        <div className="absolute bottom-2 left-2 z-10">
                            <div className="flex items-center gap-1 px-2 py-1 rounded-md bg-black/70 text-white text-[10px] sm:text-xs font-medium backdrop-blur-sm">
                                <FileText className="h-3 w-3" />
                                <span>{teacher.examsCount ?? (teacher as any).exams_count ?? 0} اختبار</span>
                            </div>
                        </div>

                        {/* Verified Badge */}
                        {teacher.isVerified && (
                            <div className="absolute bottom-2 right-2 z-10">
                                <div className="flex items-center gap-1 px-2 py-1 rounded-md bg-violet-600 text-white text-[10px] sm:text-xs font-medium shadow-md">
                                    <CheckCircle2 className="h-3 w-3" />
                                    <span>موثق</span>
                                </div>
                            </div>
                        )}
                    </div>
                </Link>

                {/* Info Section */}
                <div className="flex gap-3 mt-3 px-1">
                    {/* Avatar */}
                    <Link href={`/teachers/${teacher.id}`} className="flex-shrink-0">
                        <div className="relative">
                            <Avatar
                                src={teacher.photoURL || teacher.avatar_url}
                                name={teacher.displayName || teacher.name || 'معلم'}
                                size="sm"
                                ring={featured}
                                ringColor={featured ? 'ring-amber-400 ring-offset-2 ring-offset-white dark:ring-offset-[#0f0f0f]' : ''}
                                customGradient={featured ? 'from-amber-400 to-orange-500' : 'from-violet-500 to-purple-600'}
                                containerClassName="transition-transform duration-200 group-hover:scale-105"
                            />
                        </div>
                    </Link>

                    {/* Title & Meta Info */}
                    <div className="flex-1 min-w-0">
                        {/* Title */}
                        <Link href={`/teachers/${teacher.id}`}>
                            <h3 className="text-sm font-semibold text-gray-900 dark:text-white line-clamp-2 leading-snug group-hover:text-violet-600 dark:group-hover:text-violet-400 transition-colors mb-1">
                                {teacher.displayName || teacher.name || 'معلم'}
                                {teacher.isVerified && (
                                    <CheckCircle2 className="inline-block h-3.5 w-3.5 text-violet-500 dark:text-violet-400 mr-1" />
                                )}
                            </h3>
                        </Link>

                        {/* Meta Info */}
                        <div className="flex flex-wrap items-center gap-1 text-xs text-gray-500 dark:text-gray-400">
                            <span className="hover:text-gray-900 dark:hover:text-white transition-colors">
                                {teacher.specialty || teacher.bio || 'معلم'}
                            </span>
                            <span className="text-gray-300 dark:text-gray-600">•</span>
                            <span>{formatCount(teacher.subscriberCount ?? (teacher as any).subscriber_count ?? 0)} مشترك</span>
                        </div>

                        {/* Subscribe Button or Own Profile Badge */}
                        {isOwnProfile ? (
                            <div className="mt-2 px-4 py-1.5 rounded-full font-semibold text-xs bg-gradient-to-r from-violet-100 to-purple-100 dark:from-violet-500/20 dark:to-purple-500/20 text-violet-700 dark:text-violet-300 flex items-center gap-1.5 w-fit">
                                <span>أنت</span>
                            </div>
                        ) : (
                            <motion.button
                                onClick={(e) => { e.preventDefault(); e.stopPropagation(); onSubscribe(); }}
                                whileHover={{ scale: isLoading ? 1 : 1.03 }}
                                whileTap={{ scale: isLoading ? 1 : 0.97 }}
                                disabled={isLoading}
                                className={`mt-2 px-4 py-1.5 rounded-full font-semibold text-xs transition-all duration-200 flex items-center gap-1.5 ${isLoading
                                    ? "bg-gray-100 dark:bg-[#2a2a30] text-gray-400 dark:text-gray-500 cursor-wait"
                                    : isSubscribed
                                        ? "bg-gray-100 dark:bg-[#2a2a30] text-gray-700 dark:text-gray-200 hover:bg-gray-200 dark:hover:bg-[#3a3a40]"
                                        : "bg-violet-600 dark:bg-violet-500 text-white hover:bg-violet-700 dark:hover:bg-violet-600 shadow-md shadow-violet-500/20"
                                    }`}
                            >
                                {isLoading ? (
                                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                                ) : isSubscribed ? (
                                    <>
                                        <UserCheck className="h-3.5 w-3.5" />
                                        <span>مُشترك</span>
                                        <ChevronDown className="h-3 w-3" />
                                    </>
                                ) : (
                                    <span>اشتراك</span>
                                )}
                            </motion.button>
                        )}
                    </div>
                </div>
            </div>
        </motion.div>
    );
}

export default TeacherCard;
