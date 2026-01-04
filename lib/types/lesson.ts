import { Database } from '@/lib/database.types';

export interface Lesson {
    id: string;
    title: string;
    description: string | null;
    subjectId: string;
    stageId: string | null;
}

export type LessonDBRow = Database['public']['Tables']['lessons']['Row'];
