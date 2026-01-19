// =============================================
// Teacher Profile Components - مكونات الملف الشخصي للمعلم
// =============================================

'use client';

import React from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import {
    FileText, Clock, Play, Bell, BellOff, Share2,
    UserPlus, UserCheck, ChevronDown, CheckCircle2,
    BookOpen, GraduationCap, Globe, Phone, Sparkles, ClipboardList
} from 'lucide-react';
import { Avatar } from '@/components/common';
import { formatCount, formatRelativeDate } from '@/lib/utils/formatters';

// ═══════════════════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════════════════

export interface Teacher {
    id: string;
    name: string;
    specialty: string;
    bio: string;
    photoURL: string | null;
    coverImageURL: string | null;
    verified: boolean;
    subscriberCount: number;
    teacherTitle: string | null;
    stats: { exams: number; lessons: number; rating: number };
    yearsOfExperience: number;
    education: string | null;
    teachingStyle: string | null;
    subjects: string[];
    stages: string[];
    phone: string | null;
    website: string | null;
    socialLinks: {
        tiktok?: string;
        youtube?: string;
        facebook?: string;
        instagram?: string;
        whatsapp?: string;
    };
    totalViews: number;
    ratingAverage: number;
    ratingCount: number;
}

export interface Exam {
    id: string;
    title: string;
    description: string;
    duration: number;
    created_at: string;
    type?: string;
    isPublished?: boolean;
}

// ═══════════════════════════════════════════════════════════════════════════
// TAB BUTTON COMPONENT
// ═══════════════════════════════════════════════════════════════════════════

export interface TabButtonProps {
    active: boolean;
    onClick: () => void;
    label: string;
    icon?: React.ComponentType<{ className?: string }>;
}

export function TabButton({ active, onClick, label, icon: Icon }: TabButtonProps) {
    return (
        <button
            onClick={onClick}
            className={`relative flex items-center gap-2 px-5 py-3.5 text-sm font-medium transition-all duration-200 ${active
                ? "text-violet-600 dark:text-violet-400"
                : "text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
                }`}
        >
            {Icon && <Icon className={`h-4 w-4 ${active ? "text-violet-500" : ""}`} />}
            {label}
            {active && (
                <motion.div
                    layoutId="activeTab"
                    className="absolute bottom-0 left-0 right-0 h-0.5 bg-violet-500"
                    transition={{ type: "spring", stiffness: 300, damping: 30 }}
                />
            )}
        </button>
    );
}

// ═══════════════════════════════════════════════════════════════════════════
// TEACHER EXAM CARD COMPONENT
// ═══════════════════════════════════════════════════════════════════════════

export interface TeacherExamCardProps {
    exam: Exam;
    teacher: Teacher;
    index: number;
}

export function TeacherExamCard({ exam, index }: TeacherExamCardProps) {
    const getExamLink = () => {
        if (exam.type === 'english_comprehensive_exam') return `/english/teacher-exam/${exam.id}`;
        return `/arabic/teacher-exam/${exam.id}`;
    };

    const isArabic = exam.type !== 'english_comprehensive_exam';

    // Format date
    const formatDate = (dateString: string) => {
        const date = new Date(dateString);
        return date.toLocaleDateString('ar-EG', { month: 'short', day: 'numeric' });
    };

    return (
        <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.04, duration: 0.25 }}
            className="group"
        >
            <Link href={getExamLink()} className="block">
                {/* Modern Compact Card */}
                <div className="relative overflow-hidden rounded-xl transition-all duration-300 group-hover:scale-[1.02] group-hover:shadow-lg group-hover:shadow-violet-500/15">
                    {/* Gradient Border */}
                    <div className="absolute inset-0 bg-gradient-to-br from-violet-500 via-purple-500 to-fuchsia-500 rounded-xl p-[1px]" />

                    {/* Background */}
                    <div className="absolute inset-[1px] rounded-[11px] bg-white dark:bg-slate-900" />

                    {/* Card Content */}
                    <div className="relative p-4">
                        {/* Header - Badge & Icon */}
                        <div className="flex items-start justify-between mb-3">
                            <div className="flex items-center gap-2">
                                {/* Icon */}
                                <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-violet-500 to-purple-600 shadow-md shadow-violet-500/25 flex items-center justify-center">
                                    <ClipboardList className="h-4 w-4 text-white" />
                                </div>
                                {/* Badge */}
                                <span className="px-2 py-0.5 rounded-md bg-violet-100 dark:bg-violet-900/30 text-violet-600 dark:text-violet-400 text-xs font-semibold">
                                    {isArabic ? 'عربي' : 'English'}
                                </span>
                            </div>
                            {/* Arrow */}
                            <div className="w-7 h-7 rounded-full bg-gray-100 dark:bg-slate-800 flex items-center justify-center group-hover:bg-violet-100 dark:group-hover:bg-violet-900/30 transition-colors">
                                <Play className="h-3 w-3 text-gray-400 dark:text-gray-500 group-hover:text-violet-500 transition-colors" />
                            </div>
                        </div>

                        {/* Title */}
                        <h3 className="text-sm font-bold text-gray-800 dark:text-white mb-2 line-clamp-2 group-hover:text-violet-600 dark:group-hover:text-violet-300 transition-colors">
                            {exam.title || "امتحان"}
                        </h3>

                        {/* Stats Row */}
                        <div className="flex items-center gap-3 text-xs text-gray-500 dark:text-gray-400">
                            {exam.duration && (
                                <div className="flex items-center gap-1">
                                    <Clock className="h-3.5 w-3.5 text-violet-500" />
                                    <span>{exam.duration} د</span>
                                </div>
                            )}
                            <div className="flex items-center gap-1">
                                <GraduationCap className="h-3.5 w-3.5 text-emerald-500" />
                                <span>3 ث</span>
                            </div>
                            {exam.created_at && (
                                <div className="flex items-center gap-1 mr-auto">
                                    <span className="text-gray-400 dark:text-gray-500">{formatDate(exam.created_at)}</span>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </Link>
        </motion.div>
    );
}

// ═══════════════════════════════════════════════════════════════════════════
// TEACHER HEADER COMPONENT
// ═══════════════════════════════════════════════════════════════════════════

export interface TeacherHeaderProps {
    teacher: Teacher;
    isSubscribed: boolean;
    notificationsEnabled: boolean;
    isOwnProfile: boolean;
    onSubscribe: () => void;
    onToggleNotifications: () => void;
    onShare: () => void;
}

export function TeacherHeader({
    teacher,
    isSubscribed,
    notificationsEnabled,
    isOwnProfile,
    onSubscribe,
    onToggleNotifications,
    onShare,
}: TeacherHeaderProps) {
    return (
        <div className="flex flex-col sm:flex-row gap-5 sm:gap-8">
            {/* Avatar Section */}
            <div className="shrink-0 -mt-12 sm:-mt-14 relative z-10">
                <div className="relative">
                    <Avatar
                        src={teacher.photoURL}
                        name={teacher.name}
                        size="2xl"
                        ring
                        ringColor="ring-white dark:ring-[#121218]"
                        className="shadow-xl border-4 border-white dark:border-[#121218]"
                        containerClassName="!w-24 !h-24 sm:!w-28 sm:!h-28"
                        customGradient="from-violet-500 via-purple-600 to-indigo-700"
                    />
                    {teacher.verified && (
                        <div className="absolute bottom-1 right-1 w-7 h-7 bg-violet-500 rounded-full flex items-center justify-center border-2 border-white dark:border-[#121218] shadow-lg">
                            <CheckCircle2 className="h-4 w-4 text-white" />
                        </div>
                    )}
                </div>
            </div>

            {/* Info Section */}
            <div className="flex-1 pt-0 sm:pt-1">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                    <div className="flex-1">
                        <div className="flex items-center gap-2 flex-wrap">
                            <h1 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white">{teacher.name}</h1>
                            {teacher.verified && <CheckCircle2 className="h-5 w-5 text-violet-500" />}
                        </div>
                        {teacher.teacherTitle && (
                            <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">{teacher.teacherTitle}</p>
                        )}
                        <TeacherStats teacher={teacher} />
                    </div>

                    {/* Action Buttons */}
                    <TeacherActions
                        isOwnProfile={isOwnProfile}
                        isSubscribed={isSubscribed}
                        notificationsEnabled={notificationsEnabled}
                        onSubscribe={onSubscribe}
                        onToggleNotifications={onToggleNotifications}
                        onShare={onShare}
                    />
                </div>
            </div>
        </div>
    );
}

// ═══════════════════════════════════════════════════════════════════════════
// TEACHER STATS COMPONENT
// ═══════════════════════════════════════════════════════════════════════════

function TeacherStats({ teacher }: { teacher: Teacher }) {
    return (
        <div className="flex items-center gap-3 sm:gap-4 mt-2 text-sm text-gray-600 dark:text-gray-400 flex-wrap">
            <span className="flex items-center gap-1">
                <FileText className="h-4 w-4 text-violet-500" />
                <strong className="text-gray-900 dark:text-white">{formatCount(teacher.subscriberCount)}</strong> مشارك
            </span>
            <span className="flex items-center gap-1">
                <FileText className="h-4 w-4 text-amber-500" />
                <strong className="text-gray-900 dark:text-white">{teacher.stats.exams}</strong> امتحان
            </span>
        </div>
    );
}

// ═══════════════════════════════════════════════════════════════════════════
// TEACHER ACTIONS COMPONENT
// ═══════════════════════════════════════════════════════════════════════════

interface TeacherActionsProps {
    isOwnProfile: boolean;
    isSubscribed: boolean;
    notificationsEnabled: boolean;
    onSubscribe: () => void;
    onToggleNotifications: () => void;
    onShare: () => void;
}

function TeacherActions({
    isOwnProfile,
    isSubscribed,
    notificationsEnabled,
    onSubscribe,
    onToggleNotifications,
    onShare,
}: TeacherActionsProps) {
    if (isOwnProfile) {
        return (
            <div className="flex items-center gap-2 px-4 py-2.5 bg-violet-100 dark:bg-violet-900/20 text-violet-700 dark:text-violet-300 rounded-full text-sm font-medium border border-violet-200 dark:border-violet-800/30">
                <CheckCircle2 className="h-4 w-4" />
                ملفك الشخصي
            </div>
        );
    }

    return (
        <div className="flex items-center gap-2 flex-wrap">
            {isSubscribed ? (
                <>
                    <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={onToggleNotifications}
                        className={`flex items-center justify-center w-11 h-11 rounded-full transition-all duration-200 border ${notificationsEnabled
                            ? "bg-violet-50 dark:bg-violet-900/20 border-violet-200 dark:border-violet-800/30 text-violet-600 dark:text-violet-400"
                            : "bg-gray-50 dark:bg-[#1c1c24] border-gray-200 dark:border-[#2e2e3a] text-gray-400 dark:text-gray-500"
                            }`}
                    >
                        {notificationsEnabled ? <Bell className="h-5 w-5" /> : <BellOff className="h-5 w-5" />}
                    </motion.button>
                    <motion.button
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={onSubscribe}
                        className="flex items-center gap-2 px-5 py-2.5 bg-gray-100 dark:bg-[#1c1c24] hover:bg-gray-200 dark:hover:bg-[#252530] text-gray-900 dark:text-white rounded-full text-sm font-medium transition-all duration-200 border border-gray-200 dark:border-[#2e2e3a]"
                    >
                        <UserCheck className="h-4 w-4 text-green-500" />
                        متابَع
                        <ChevronDown className="h-4 w-4 text-gray-400" />
                    </motion.button>
                </>
            ) : (
                <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={onSubscribe}
                    className="flex items-center gap-2 px-6 py-2.5 bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-500 hover:to-purple-500 text-white rounded-full text-sm font-semibold transition-all duration-200 shadow-lg shadow-violet-500/25"
                >
                    <UserPlus className="h-4 w-4" />
                    متابعة
                </motion.button>
            )}
            <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={onShare}
                className="flex items-center gap-2 px-4 py-2.5 bg-gray-100 dark:bg-[#1c1c24] hover:bg-gray-200 dark:hover:bg-[#252530] text-gray-700 dark:text-white rounded-full text-sm font-medium transition-all duration-200 border border-gray-200 dark:border-[#2e2e3a]"
            >
                <Share2 className="h-4 w-4" />
                مشاركة
            </motion.button>
        </div>
    );
}

// ═══════════════════════════════════════════════════════════════════════════
// ABOUT TAB COMPONENT
// ═══════════════════════════════════════════════════════════════════════════

export interface AboutTabProps {
    teacher: Teacher;
}

export function AboutTab({ teacher }: AboutTabProps) {
    const hasSocials = teacher.phone || teacher.website ||
        Object.values(teacher.socialLinks || {}).some(v => v);

    const CardWrapper = ({ children, title, icon: Icon, colorClass }: any) => (
        <div className="relative overflow-hidden rounded-2xl group">
            <div className={`absolute inset-0 bg-gradient-to-br from-${colorClass}-500/20 via-${colorClass}-500/10 to-${colorClass}-500/5 rounded-2xl p-[1px]`}>
                <div className="absolute inset-[1px] rounded-[15px] bg-white dark:bg-gradient-to-br dark:from-slate-900 dark:via-slate-800 dark:to-slate-900" />
            </div>

            <div className="relative rounded-2xl bg-white dark:bg-gradient-to-br dark:from-slate-900/90 dark:via-slate-800/80 dark:to-slate-900/90 backdrop-blur-xl p-6 shadow-lg dark:shadow-xl border border-gray-100 dark:border-transparent">
                <div className={`absolute top-0 left-8 right-8 h-[1px] bg-gradient-to-r from-transparent via-${colorClass}-400/40 to-transparent hidden dark:block`} />

                <h2 className="text-gray-900 dark:text-white font-semibold mb-4 flex items-center gap-2">
                    <Icon className={`h-5 w-5 text-${colorClass}-600 dark:text-${colorClass}-400`} />
                    {title}
                </h2>
                {children}
            </div>
        </div>
    );

    return (
        <div className="max-w-4xl space-y-6">
            {/* Description Card */}
            <CardWrapper title="الوصف" icon={BookOpen} colorClass="violet">
                <p className="text-gray-600 dark:text-gray-300 whitespace-pre-wrap leading-relaxed">
                    {teacher.bio || "لا يوجد وصف متاح."}
                </p>
            </CardWrapper>

            {/* Professional Info Card */}
            <CardWrapper title="المعلومات المهنية" icon={GraduationCap} colorClass="blue">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {teacher.teacherTitle && (
                        <InfoCard label="اللقب" value={teacher.teacherTitle} />
                    )}
                    {teacher.yearsOfExperience > 0 && (
                        <InfoCard label="الخبرة" value={`${teacher.yearsOfExperience} سنة`} />
                    )}
                    {teacher.education && (
                        <InfoCard label="المؤهل" value={teacher.education} fullWidth />
                    )}
                    {teacher.teachingStyle && (
                        <InfoCard label="أسلوب التدريس" value={teacher.teachingStyle} fullWidth />
                    )}
                </div>
            </CardWrapper>

            {/* Contacts Card */}
            {hasSocials && (
                <CardWrapper title="التواصل" icon={Globe} colorClass="cyan">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        {teacher.phone && (
                            <a
                                href={`tel:${teacher.phone}`}
                                className="flex items-center gap-3 p-4 bg-gray-50 dark:bg-slate-800/50 rounded-xl hover:bg-gray-100 dark:hover:bg-slate-800 transition-colors border border-gray-200 dark:border-slate-700/50"
                            >
                                <Phone className="h-5 w-5 text-green-600 dark:text-green-500" />
                                <span className="text-gray-700 dark:text-gray-300">{teacher.phone}</span>
                            </a>
                        )}
                        {teacher.website && (
                            <a
                                href={teacher.website}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex items-center gap-3 p-4 bg-gray-50 dark:bg-slate-800/50 rounded-xl hover:bg-gray-100 dark:hover:bg-slate-800 transition-colors border border-gray-200 dark:border-slate-700/50"
                            >
                                <Globe className="h-5 w-5 text-blue-600 dark:text-blue-500" />
                                <span className="text-gray-700 dark:text-gray-300 truncate">الموقع الإلكتروني</span>
                            </a>
                        )}
                    </div>
                </CardWrapper>
            )}
        </div>
    );
}

// ═══════════════════════════════════════════════════════════════════════════
// INFO CARD HELPER
// ═══════════════════════════════════════════════════════════════════════════

function InfoCard({ label, value, fullWidth = false }: { label: string; value: string; fullWidth?: boolean }) {
    return (
        <div className={`p-4 bg-gray-50 dark:bg-slate-800/50 rounded-xl border border-gray-200 dark:border-slate-700/50 hover:border-gray-300 dark:hover:border-slate-600/50 transition-colors ${fullWidth ? 'col-span-full' : ''}`}>
            <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">{label}</p>
            <p className="font-medium text-gray-900 dark:text-white">{value}</p>
        </div>
    );
}

// ═══════════════════════════════════════════════════════════════════════════
// EXAMS TAB COMPONENT
// ═══════════════════════════════════════════════════════════════════════════

export interface ExamsTabProps {
    exams: Exam[];
    teacher: Teacher;
}

export function ExamsTab({ exams, teacher }: ExamsTabProps) {
    if (exams.length === 0) {
        return (
            <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="text-center py-20"
            >
                <div className="w-32 h-32 mx-auto mb-6 rounded-full bg-gradient-to-br from-gray-100 to-gray-200 dark:from-[#1c1c24] dark:to-[#252530] flex items-center justify-center shadow-inner">
                    <FileText className="h-14 w-14 text-gray-400 dark:text-gray-500" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">لا توجد امتحانات</h3>
                <p className="text-gray-500 dark:text-gray-400">لم يتم نشر أي امتحانات بعد</p>
            </motion.div>
        );
    }

    return (
        <>
            <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                    <div className="p-2.5 rounded-xl bg-gray-100 dark:bg-[#1c1c24]">
                        <FileText className="h-5 w-5 text-amber-500" />
                    </div>
                    <h2 className="text-xl font-bold text-gray-900 dark:text-white">جميع الامتحانات</h2>
                    <span className="px-2.5 py-1 bg-gray-100 dark:bg-[#1c1c24] rounded-full text-xs font-semibold text-gray-600 dark:text-gray-300">
                        {exams.length}
                    </span>
                </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
                {exams.map((exam, i) => (
                    <TeacherExamCard key={exam.id} exam={exam} teacher={teacher} index={i} />
                ))}
            </div>
        </>
    );
}
