// =============================================
// TeacherGrid Component - شبكة عرض المعلمين
// =============================================

'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { containerVariants } from '@/lib/animations';
import { TeacherCard } from './TeacherCard';
import type { Teacher } from '@/lib/types';

export interface TeacherGridProps {
    teachers: Teacher[];
    subscriptions: Set<string>;
    subscribingTo: Set<string> | string | null;
    currentUserId: string | null;
    onSubscribe: (teacherId: string) => void;
    isFeatured?: boolean;
}

export function TeacherGrid({
    teachers,
    subscriptions,
    subscribingTo,
    currentUserId,
    onSubscribe,
    isFeatured = false,
}: TeacherGridProps) {
    if (teachers.length === 0) return null;

    return (
        <motion.div
            className="grid grid-cols-1 xs:grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-4 lg:gap-5"
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            layout // Enable layout animations for the grid itself
        >
            <AnimatePresence mode="popLayout">
                {teachers.map((teacher, index) => (
                    <TeacherCard
                        key={teacher.id}
                        teacher={teacher}
                        index={index}
                        isSubscribed={subscriptions.has(teacher.id)}
                        isLoading={subscribingTo instanceof Set ? subscribingTo.has(teacher.id) : subscribingTo === teacher.id}
                        isFeatured={isFeatured}
                        isOwnProfile={currentUserId === teacher.id}
                        onSubscribe={() => onSubscribe(teacher.id)}
                    />
                ))}
            </AnimatePresence>
        </motion.div>
    );
}

export default TeacherGrid;
