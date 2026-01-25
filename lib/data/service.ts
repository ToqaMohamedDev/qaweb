/**
 * Unified Data Service
 * 
 * Single source of truth for all data fetching operations
 * - In-memory caching
 * - Parallel queries
 * - Type-safe API
 */

import { getClient } from './client';
import type {
    Subject,
    Lesson,
    Exam,
    AppSettings,
    SubjectWithLessons,
    PlatformStats,
    AdminStats,
    DashboardData,
    LessonFilters,
    ExamFilters,
    Stage,
} from './types';

// =============================================
// Cache Implementation
// =============================================

interface CacheEntry<T> {
    data: T;
    timestamp: number;
    expiresAt: number;
}

class DataCache {
    private cache = new Map<string, CacheEntry<unknown>>();

    get<T>(key: string): T | null {
        const entry = this.cache.get(key);
        if (!entry) return null;
        if (Date.now() > entry.expiresAt) {
            this.cache.delete(key);
            return null;
        }
        return entry.data as T;
    }

    set<T>(key: string, data: T, ttl: number): void {
        const now = Date.now();
        this.cache.set(key, {
            data,
            timestamp: now,
            expiresAt: now + ttl,
        });
    }

    invalidate(key: string): void {
        this.cache.delete(key);
    }

    invalidatePattern(pattern: string): void {
        for (const key of this.cache.keys()) {
            if (key.includes(pattern)) {
                this.cache.delete(key);
            }
        }
    }

    clear(): void {
        this.cache.clear();
    }
}

// Global cache instance
const cache = new DataCache();

// Cache TTL constants
const TTL = {
    SHORT: 60 * 1000,        // 1 minute
    MEDIUM: 5 * 60 * 1000,   // 5 minutes
    LONG: 30 * 60 * 1000,    // 30 minutes
    HOUR: 60 * 60 * 1000,    // 1 hour
};

// =============================================
// Data Service Class
// =============================================

class DataService {
    private static instance: DataService;

    private constructor() {}

    static getInstance(): DataService {
        if (!DataService.instance) {
            DataService.instance = new DataService();
        }
        return DataService.instance;
    }

    // =============================================
    // Stages
    // =============================================

    async getStages(options?: { active?: boolean }): Promise<Stage[]> {
        const cacheKey = `stages:${options?.active ?? 'all'}`;
        const cached = cache.get<Stage[]>(cacheKey);
        if (cached) return cached;

        const supabase = getClient();
        let query = supabase
            .from('educational_stages')
            .select('*')
            .order('order_index', { ascending: true });

        if (options?.active) {
            query = query.eq('is_active', true);
        }

        const { data, error } = await query;
        if (error) throw error;

        const result = data || [];
        cache.set(cacheKey, result, TTL.LONG);
        return result;
    }

    async getStageBySlug(slug: string): Promise<Stage | null> {
        const cacheKey = `stage:slug:${slug}`;
        const cached = cache.get<Stage | null>(cacheKey);
        if (cached !== null) return cached;

        const supabase = getClient();
        const { data, error } = await supabase
            .from('educational_stages')
            .select('*')
            .eq('slug', slug)
            .single();

        if (error) {
            if (error.code === 'PGRST116') return null;
            throw error;
        }

        cache.set(cacheKey, data, TTL.LONG);
        return data;
    }

    // =============================================
    // Subjects
    // =============================================

    async getSubjects(options?: { stageId?: string; active?: boolean }): Promise<Subject[]> {
        const cacheKey = `subjects:${options?.stageId || 'all'}:${options?.active ?? 'all'}`;
        const cached = cache.get<Subject[]>(cacheKey);
        if (cached) return cached;

        const supabase = getClient();

        if (options?.stageId) {
            // Get subjects linked to stage via subject_stages
            // @ts-expect-error - subject_stages not in generated types
            const { data, error } = await supabase
                .from('subject_stages')
                .select(`
                    subject_id,
                    order_index,
                    subjects!inner (*)
                `)
                .eq('stage_id', options.stageId)
                .eq('is_active', true)
                .order('order_index', { ascending: true });

            if (error) throw error;

            // @ts-expect-error
            const result = (data || []).map((ss: { subjects: Subject }) => ss.subjects).filter(Boolean);
            
            cache.set(cacheKey, result, TTL.MEDIUM);
            return result;
        }

        let query = supabase
            .from('subjects')
            .select('*')
            .order('order_index', { ascending: true });

        if (options?.active) {
            query = query.eq('is_active', true);
        }

        const { data, error } = await query;
        if (error) throw error;

        const result = data || [];
        cache.set(cacheKey, result, TTL.MEDIUM);
        return result;
    }

    async getSubjectsWithLessonsCount(stageId: string, semester?: 'first' | 'second' | 'full_year'): Promise<SubjectWithLessons[]> {
        const cacheKey = `subjects-with-lessons:${stageId}:${semester || 'all'}`;
        const cached = cache.get<SubjectWithLessons[]>(cacheKey);
        if (cached) return cached;

        const supabase = getClient();

        // Parallel fetch: subjects and lessons
        // @ts-expect-error - subject_stages not in generated types
        const subjectsPromise = supabase
            .from('subject_stages')
            .select(`
                subject_id,
                order_index,
                subjects!inner (
                    id, name, slug, icon, color, description, image_url, is_active
                )
            `)
            .eq('stage_id', stageId)
            .eq('is_active', true)
            .order('order_index', { ascending: true });
        
        const lessonsPromise = supabase
            .from('lessons')
            .select('id, subject_id')
            .eq('is_published', true)
            .or(`stage_id.eq.${stageId},stage_id.is.null`);

        const [subjectsResult, lessonsResult] = await Promise.all([subjectsPromise, lessonsPromise]);

        if (subjectsResult.error) throw subjectsResult.error;
        if (lessonsResult.error) throw lessonsResult.error;

        // Count lessons per subject
        const lessonsCountMap = new Map<string, number>();
        (lessonsResult.data || []).forEach((lesson: { id: string; subject_id: string }) => {
            const count = lessonsCountMap.get(lesson.subject_id) || 0;
            lessonsCountMap.set(lesson.subject_id, count + 1);
        });

        // Build result
        // @ts-expect-error
        const result: SubjectWithLessons[] = (subjectsResult.data || [])
            .filter((ss: { subjects: { is_active: boolean } }) => ss.subjects && ss.subjects.is_active)
            .map((ss: { subjects: Subject }) => {
                const subject = ss.subjects;
                return {
                    ...subject,
                    lessonsCount: lessonsCountMap.get(subject.id) || 0,
                };
            });

        cache.set(cacheKey, result, TTL.SHORT);
        return result;
    }

    // =============================================
    // Lessons
    // =============================================

    async getLessons(filters: LessonFilters): Promise<Lesson[]> {
        const cacheKey = `lessons:${JSON.stringify(filters)}`;
        const cached = cache.get<Lesson[]>(cacheKey);
        if (cached) return cached;

        const supabase = getClient();
        let query = supabase
            .from('lessons')
            .select('*')
            .order('order_index', { ascending: true });

        if (filters.stageId) {
            query = query.or(`stage_id.eq.${filters.stageId},stage_id.is.null`);
        }
        if (filters.subjectId) {
            query = query.eq('subject_id', filters.subjectId);
        }
        if (filters.isPublished !== undefined) {
            query = query.eq('is_published', filters.isPublished);
        }
        if (filters.semester && filters.semester !== 'full_year') {
            query = query.or(`semester.eq.${filters.semester},semester.eq.full_year`);
        }

        const { data, error } = await query;
        if (error) throw error;

        const result = data || [];
        cache.set(cacheKey, result, TTL.SHORT);
        return result;
    }

    // =============================================
    // Exams
    // =============================================

    async getExams(filters: ExamFilters): Promise<Exam[]> {
        const cacheKey = `exams:${JSON.stringify(filters)}`;
        const cached = cache.get<Exam[]>(cacheKey);
        if (cached) return cached;

        const supabase = getClient();
        let query = supabase
            .from('comprehensive_exams')
            .select('*')
            .order('created_at', { ascending: false });

        if (filters.stageId) query = query.eq('stage_id', filters.stageId);
        if (filters.subjectId) query = query.eq('subject_id', filters.subjectId);
        if (filters.isPublished !== undefined) query = query.eq('is_published', filters.isPublished);
        if (filters.createdBy) query = query.eq('created_by', filters.createdBy);
        if (filters.type) query = query.eq('type', filters.type);

        const { data, error } = await query;
        if (error) throw error;

        const result = data || [];
        cache.set(cacheKey, result, TTL.SHORT);
        return result;
    }

    // =============================================
    // App Settings
    // =============================================

    async getAppSettings(): Promise<AppSettings | null> {
        const cacheKey = 'app-settings';
        const cached = cache.get<AppSettings | null>(cacheKey);
        if (cached !== null) return cached;

        const supabase = getClient();
        const { data, error } = await supabase
            .from('app_settings')
            .select('*')
            .eq('id', 'global')
            .single();

        if (error) {
            if (error.code === 'PGRST116') return null;
            throw error;
        }

        cache.set(cacheKey, data, TTL.MEDIUM);
        return data;
    }

    // =============================================
    // Stats
    // =============================================

    async getPlatformStats(stageId?: string): Promise<PlatformStats> {
        const cacheKey = `platform-stats:${stageId || 'all'}`;
        const cached = cache.get<PlatformStats>(cacheKey);
        if (cached) return cached;

        const supabase = getClient();

        const [usersResult, lessonsResult, ratingsResult] = await Promise.all([
            supabase.from('profiles').select('*', { count: 'exact', head: true }).eq('role', 'student'),
            supabase.from('lessons').select('*', { count: 'exact', head: true }).eq('is_published', true),
            supabase.from('teacher_ratings').select('rating').limit(100),
        ]);

        let averageRating = 4.8;
        if (ratingsResult.data && ratingsResult.data.length > 0) {
            const sum = ratingsResult.data.reduce((acc, r) => acc + (r.rating || 0), 0);
            averageRating = Math.round((sum / ratingsResult.data.length) * 10) / 10;
        }

        const result: PlatformStats = {
            totalUsers: usersResult.count || 0,
            totalLessons: lessonsResult.count || 0,
            averageRating,
            successRate: 85,
        };

        cache.set(cacheKey, result, TTL.MEDIUM);
        return result;
    }

    async getAdminStats(): Promise<AdminStats> {
        const cacheKey = 'admin-stats';
        const cached = cache.get<AdminStats>(cacheKey);
        if (cached) return cached;

        const supabase = getClient();

        const [
            usersResult,
            teachersResult,
            studentsResult,
            examsResult,
            publishedExamsResult,
            lessonsResult,
            stagesResult,
            subjectsResult,
            questionsResult,
        ] = await Promise.all([
            supabase.from('profiles').select('*', { count: 'exact', head: true }),
            supabase.from('profiles').select('*', { count: 'exact', head: true }).eq('role', 'teacher'),
            supabase.from('profiles').select('*', { count: 'exact', head: true }).eq('role', 'student'),
            supabase.from('comprehensive_exams').select('*', { count: 'exact', head: true }),
            supabase.from('comprehensive_exams').select('*', { count: 'exact', head: true }).eq('is_published', true),
            supabase.from('lessons').select('*', { count: 'exact', head: true }),
            supabase.from('educational_stages').select('*', { count: 'exact', head: true }).eq('is_active', true),
            supabase.from('subjects').select('*', { count: 'exact', head: true }).eq('is_active', true),
            supabase.from('lesson_questions').select('*', { count: 'exact', head: true }).eq('is_active', true),
        ]);

        const result: AdminStats = {
            totalUsers: usersResult.count || 0,
            totalTeachers: teachersResult.count || 0,
            totalStudents: studentsResult.count || 0,
            totalExams: examsResult.count || 0,
            publishedExams: publishedExamsResult.count || 0,
            totalLessons: lessonsResult.count || 0,
            totalStages: stagesResult.count || 0,
            totalSubjects: subjectsResult.count || 0,
            totalQuestions: questionsResult.count || 0,
            averageRating: 4.8,
            successRate: 85,
        };

        cache.set(cacheKey, result, TTL.MEDIUM);
        return result;
    }

    // =============================================
    // Dashboard (Unified)
    // =============================================

    async getDashboardData(userId?: string): Promise<DashboardData> {
        const startTime = Date.now();

        // Get app settings and default stage in parallel
        const [settings, defaultStage] = await Promise.all([
            this.getAppSettings(),
            this.getStageBySlug('grade-3-secondary'),
        ]);

        const showFirst = settings?.show_first_semester ?? true;
        const showSecond = settings?.show_second_semester ?? true;
        
        let currentSemester: 'first' | 'second' | 'full_year' = 'full_year';
        if (showFirst && !showSecond) currentSemester = 'first';
        else if (!showFirst && showSecond) currentSemester = 'second';

        // Determine stage
        let stageId = defaultStage?.id || null;
        let stageName = defaultStage?.name || 'الصف الثالث الثانوي';

        if (userId) {
            const supabase = getClient();
            const { data: profile } = await supabase
                .from('profiles')
                .select('educational_stage_id, educational_stages!profiles_educational_stage_id_fkey(id, name)')
                .eq('id', userId)
                .single();

            if (profile?.educational_stage_id && profile.educational_stages) {
                const stage = profile.educational_stages as unknown as { id: string; name: string };
                stageId = stage.id;
                stageName = stage.name;
            }
        }

        if (!stageId) {
            return {
                subjects: [],
                stageName,
                stageId: null,
                currentSemester,
                stats: { totalUsers: 0, totalLessons: 0, averageRating: 4.8, successRate: 85 },
            };
        }

        // Get subjects with lessons count and stats in parallel
        const [subjects, stats] = await Promise.all([
            this.getSubjectsWithLessonsCount(stageId, currentSemester),
            this.getPlatformStats(stageId),
        ]);

        console.log(`[DataService] Dashboard fetched in ${Date.now() - startTime}ms`);

        return {
            subjects,
            stageName,
            stageId,
            currentSemester,
            stats,
        };
    }

    // =============================================
    // Cache Management
    // =============================================

    invalidateCache(pattern?: string): void {
        if (pattern) {
            cache.invalidatePattern(pattern);
        } else {
            cache.clear();
        }
    }
}

// =============================================
// Export singleton instance
// =============================================

export const dataService = DataService.getInstance();

// Export individual functions for convenience
export const getStages = dataService.getStages.bind(dataService);
export const getStageBySlug = dataService.getStageBySlug.bind(dataService);
export const getSubjects = dataService.getSubjects.bind(dataService);
export const getSubjectsWithLessonsCount = dataService.getSubjectsWithLessonsCount.bind(dataService);
export const getLessons = dataService.getLessons.bind(dataService);
export const getExams = dataService.getExams.bind(dataService);
export const getAppSettings = dataService.getAppSettings.bind(dataService);
export const getPlatformStats = dataService.getPlatformStats.bind(dataService);
export const getAdminStats = dataService.getAdminStats.bind(dataService);
export const getDashboardData = dataService.getDashboardData.bind(dataService);
export const invalidateCache = dataService.invalidateCache.bind(dataService);
