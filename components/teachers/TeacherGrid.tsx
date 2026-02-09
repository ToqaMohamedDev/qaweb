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
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4 gap-4 sm:gap-5 lg:gap-6 [&>*]:min-w-[280px]"
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            layout // Enable layout animations for the grid itself
            style={{ 
                gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))'
            }}
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
