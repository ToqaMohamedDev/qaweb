/**
 * Admin Query API Route (Refactored & Secured)
 * =============================================
 * Centralized API route for all admin CRUD operations
 * Uses server-side authentication for Vercel compatibility
 */

import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';
import { isValidUUID, sanitizeInput } from '@/lib/security';

// =============================================
// Constants
// =============================================

const ALLOWED_TABLES = new Set([
    'profiles',
    'educational_stages',
    'subjects',
    'lessons',
    'comprehensive_exams',
    'lesson_questions',
    'user_progress',
    'notifications',
    'support_chats',
    'chat_messages',
    'devices',
    'question_banks',
    'site_settings',
    'messages',
    'comprehensive_exam_attempts'
]);

const MAX_LIMIT = 1000;
const DEFAULT_LIMIT = 100;

// =============================================
// Helpers
// =============================================

async function createSupabaseServerClient() {
    const cookieStore = await cookies();

    return createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
            cookies: {
                getAll() {
                    return cookieStore.getAll();
                },
                setAll() { /* Read-only in API routes */ },
            },
        }
    );
}

async function verifyAdmin(supabase: ReturnType<typeof createServerClient>) {
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        return { authorized: false, error: 'Unauthorized', status: 401 };
    }

    const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single();

    if (profile?.role !== 'admin') {
        return { authorized: false, error: 'Forbidden - Admin access required', status: 403 };
    }

    return { authorized: true, user, profile };
}

function validateTable(table: string | null): { valid: boolean; error?: string } {
    if (!table) {
        return { valid: false, error: 'Table parameter is required' };
    }

    const sanitized = sanitizeInput(table);

    if (!ALLOWED_TABLES.has(sanitized)) {
        return { valid: false, error: 'Table not allowed' };
    }

    return { valid: true };
}

function securityHeaders(): HeadersInit {
    return {
        'X-Content-Type-Options': 'nosniff',
        'Cache-Control': 'no-store, max-age=0',
    };
}

// =============================================
// GET - Query Data
// =============================================

export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const table = searchParams.get('table');
        const select = searchParams.get('select') || '*';
        const limitParam = parseInt(searchParams.get('limit') || String(DEFAULT_LIMIT));
        const limit = Math.min(Math.max(1, limitParam), MAX_LIMIT);
        const orderBy = sanitizeInput(searchParams.get('orderBy') || 'created_at');
        const ascending = searchParams.get('ascending') === 'true';
        const filterColumn = searchParams.get('filterColumn');
        const filterValue = searchParams.get('filterValue');

        // Validate table
        const tableValidation = validateTable(table);
        if (!tableValidation.valid) {
            return NextResponse.json(
                { error: tableValidation.error },
                { status: 400, headers: securityHeaders() }
            );
        }

        const supabase = await createSupabaseServerClient();

        // Verify admin access
        const authResult = await verifyAdmin(supabase);
        if (!authResult.authorized) {
            return NextResponse.json(
                { error: authResult.error },
                { status: authResult.status, headers: securityHeaders() }
            );
        }

        // Build query
        let query = supabase
            .from(table!)
            .select(select, { count: 'exact' })
            .order(orderBy, { ascending })
            .limit(limit);

        // Apply filter if provided (with validation)
        if (filterColumn && filterValue) {
            const sanitizedColumn = sanitizeInput(filterColumn);
            const sanitizedValue = sanitizeInput(filterValue);
            query = query.eq(sanitizedColumn, sanitizedValue);
        }

        const { data, error, count } = await query;

        if (error) {
            console.error(`[Admin API] Query Error (${table}):`, error.message);
            return NextResponse.json(
                { error: error.message },
                { status: 500, headers: securityHeaders() }
            );
        }

        return NextResponse.json(
            { data, count, success: true },
            { status: 200, headers: securityHeaders() }
        );

    } catch (error) {
        console.error('[Admin API] Unexpected Error:', error);
        return NextResponse.json(
            { error: 'Internal Server Error' },
            { status: 500, headers: securityHeaders() }
        );
    }
}

// =============================================
// POST - Insert Data
// =============================================

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { table, data: insertData } = body;

        // Validate inputs
        const tableValidation = validateTable(table);
        if (!tableValidation.valid) {
            return NextResponse.json(
                { error: tableValidation.error },
                { status: 400, headers: securityHeaders() }
            );
        }

        if (!insertData || typeof insertData !== 'object') {
            return NextResponse.json(
                { error: 'Data object is required' },
                { status: 400, headers: securityHeaders() }
            );
        }

        const supabase = await createSupabaseServerClient();

        // Verify admin access
        const authResult = await verifyAdmin(supabase);
        if (!authResult.authorized) {
            return NextResponse.json(
                { error: authResult.error },
                { status: authResult.status, headers: securityHeaders() }
            );
        }

        const { data, error } = await supabase
            .from(table)
            .insert(insertData)
            .select()
            .single();

        if (error) {
            console.error(`[Admin API] Insert Error (${table}):`, error.message);
            return NextResponse.json(
                { error: error.message },
                { status: 500, headers: securityHeaders() }
            );
        }

        return NextResponse.json(
            { data, success: true },
            { status: 201, headers: securityHeaders() }
        );

    } catch (error) {
        console.error('[Admin API] Insert Error:', error);
        return NextResponse.json(
            { error: 'Internal Server Error' },
            { status: 500, headers: securityHeaders() }
        );
    }
}

// =============================================
// PATCH - Update Data
// =============================================

export async function PATCH(request: NextRequest) {
    try {
        const body = await request.json();
        const { table, id, updates } = body;

        // Validate inputs
        const tableValidation = validateTable(table);
        if (!tableValidation.valid) {
            return NextResponse.json(
                { error: tableValidation.error },
                { status: 400, headers: securityHeaders() }
            );
        }

        if (!id || !isValidUUID(id)) {
            return NextResponse.json(
                { error: 'Valid ID is required' },
                { status: 400, headers: securityHeaders() }
            );
        }

        if (!updates || typeof updates !== 'object') {
            return NextResponse.json(
                { error: 'Updates object is required' },
                { status: 400, headers: securityHeaders() }
            );
        }

        const supabase = await createSupabaseServerClient();

        // Verify admin access
        const authResult = await verifyAdmin(supabase);
        if (!authResult.authorized) {
            return NextResponse.json(
                { error: authResult.error },
                { status: authResult.status, headers: securityHeaders() }
            );
        }

        const { data, error } = await supabase
            .from(table)
            .update(updates)
            .eq('id', id)
            .select()
            .single();

        if (error) {
            console.error(`[Admin API] Update Error (${table}):`, error.message);
            return NextResponse.json(
                { error: error.message },
                { status: 500, headers: securityHeaders() }
            );
        }

        return NextResponse.json(
            { data, success: true },
            { status: 200, headers: securityHeaders() }
        );

    } catch (error) {
        console.error('[Admin API] Update Error:', error);
        return NextResponse.json(
            { error: 'Internal Server Error' },
            { status: 500, headers: securityHeaders() }
        );
    }
}

// =============================================
// DELETE - Remove Data
// =============================================

export async function DELETE(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const table = searchParams.get('table');
        const id = searchParams.get('id');

        // Validate inputs
        const tableValidation = validateTable(table);
        if (!tableValidation.valid) {
            return NextResponse.json(
                { error: tableValidation.error },
                { status: 400, headers: securityHeaders() }
            );
        }

        if (!id || !isValidUUID(id)) {
            return NextResponse.json(
                { error: 'Valid ID is required' },
                { status: 400, headers: securityHeaders() }
            );
        }

        const supabase = await createSupabaseServerClient();

        // Verify admin access
        const authResult = await verifyAdmin(supabase);
        if (!authResult.authorized) {
            return NextResponse.json(
                { error: authResult.error },
                { status: authResult.status, headers: securityHeaders() }
            );
        }

        const { error } = await supabase
            .from(table!)
            .delete()
            .eq('id', id);

        if (error) {
            console.error(`[Admin API] Delete Error (${table}):`, error.message);
            return NextResponse.json(
                { error: error.message },
                { status: 500, headers: securityHeaders() }
            );
        }

        return NextResponse.json(
            { success: true },
            { status: 200, headers: securityHeaders() }
        );

    } catch (error) {
        console.error('[Admin API] Delete Error:', error);
        return NextResponse.json(
            { error: 'Internal Server Error' },
            { status: 500, headers: securityHeaders() }
        );
    }
}
