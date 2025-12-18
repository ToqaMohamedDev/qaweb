import { createBrowserClient } from '@supabase/ssr';
import { Database } from './database.types';
import { UserRole, UserProfile } from './definitions';

// تصدير الأنواع لتكون متاحة للاستخدام في ملفات أخرى
export type { UserRole, UserProfile };

// 1. إنشاء Client للمتصفح (يستخدم Cookies)
export function createClient() {
    return createBrowserClient<Database>(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );
}

// إنشاء نسخة client global للاستخدام المباشر
export const supabase = createClient();

/**
 * تسجيل حساب جديد بالبريد الإلكتروني
 */
export async function signUpWithEmail(
    email: string,
    password: string,
    name: string,
    role: UserRole
) {
    const supabaseClient = createClient();

    // 1. التسجيل في Auth
    const { data, error } = await supabaseClient.auth.signUp({
        email,
        password,
        options: {
            data: {
                name,
                role, // هذا سيذهب للـ Trigger لإنشاء الـ Profile
            },
        },
    });

    if (error) throw error;
    return data;
}

/**
 * تسجيل الدخول بالبريد الإلكتروني
 */
export async function signInWithEmail(email: string, password: string) {
    const supabaseClient = createClient();
    const { data, error } = await supabaseClient.auth.signInWithPassword({
        email,
        password,
    });

    if (error) throw error;
    return data;
}

/**
 * تسجيل الدخول بـ Google
 */
export async function signInWithGoogle() {
    const supabaseClient = createClient();

    // تحديد عنوان الموقع بشكل ديناميكي وآمن
    let origin = '';
    if (typeof window !== 'undefined') {
        origin = window.location.origin;
    } else if (process.env.NEXT_PUBLIC_SITE_URL) {
        origin = process.env.NEXT_PUBLIC_SITE_URL;
    } else {
        origin = 'http://localhost:3000'; // Default fallback
    }

    const { data, error } = await supabaseClient.auth.signInWithOAuth({
        provider: 'google',
        options: {
            // توجيه المستخدم لصفحة الـ callback لضبط الـ cookies
            redirectTo: `${origin}/auth/callback`,
            queryParams: {
                access_type: 'offline',
                prompt: 'consent',
            },
        },
    });

    if (error) throw error;
    return data;
}

/**
 * تسجيل الخروج
 */
export async function signOut() {
    const supabaseClient = createClient();
    const { error } = await supabaseClient.auth.signOut();
    if (error) throw error;
}

/**
 * جلب الملف الشخصي
 */
export async function getUserProfile(userId: string): Promise<UserProfile | null> {
    const supabaseClient = createClient();
    const { data, error } = await supabaseClient
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

    if (error) {
        // PGRST116: JSON object requested, multiple (or no) rows returned
        // This effectively means "Not Found" when using .single()
        if (error.code !== 'PGRST116') {
            console.error('Error fetching profile:', JSON.stringify(error, null, 2));
        }
        return null;
    }

    return data as UserProfile;
}

/**
 * تحديث الملف الشخصي
 */
export async function updateUserProfile(userId: string, updates: Partial<UserProfile>) {
    const supabaseClient = createClient();
    const { data, error } = await supabaseClient
        .from('profiles')
        .update({
            ...updates,
            updated_at: new Date().toISOString(),
        })
        .eq('id', userId)
        .select()
        .single();

    if (error) {
        throw error;
    }

    return data as UserProfile;
}

// دوال التحقق من الدور
export async function isAdmin(userId: string): Promise<boolean> {
    const profile = await getUserProfile(userId);
    return profile?.role === 'admin';
}

export async function isTeacher(userId: string): Promise<boolean> {
    const profile = await getUserProfile(userId);
    return profile?.role === 'teacher';
}

export async function isStudent(userId: string): Promise<boolean> {
    const profile = await getUserProfile(userId);
    return profile?.role === 'student';
}

// دالة لاختبار وتحديث الجلسة (مفيدة لل debugging)
export async function refreshSession() {
    const supabaseClient = createClient();
    const { data, error } = await supabaseClient.auth.refreshSession();
    if (error) throw error;
    return data;
}
