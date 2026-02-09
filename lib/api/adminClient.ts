/**
 * Admin API Client
 * Helper functions for admin data operations using server-side API
 * Works with HttpOnly cookies on Vercel
 */

interface QueryOptions {
    table: string;
    select?: string;
    limit?: number;
    orderBy?: string;
    ascending?: boolean;
    filterColumn?: string;
    filterValue?: string;
}

interface QueryResult<T> {
    data: T[];
    count: number | null;
    error: string | null;
}

/**
 * Fetch data from admin API
 */
export async function adminQuery<T>(options: QueryOptions): Promise<QueryResult<T>> {
    try {
        const params = new URLSearchParams({
            table: options.table,
            select: options.select || '*',
            limit: String(options.limit || 100),
            orderBy: options.orderBy || 'created_at',
            ascending: String(options.ascending || false),
        });

        if (options.filterColumn && options.filterValue) {
            params.set('filterColumn', options.filterColumn);
            params.set('filterValue', options.filterValue);
        }

        console.log(`[adminQuery] Fetching table: ${options.table}`);
        
        const res = await fetch(`/api/admin/query?${params}`, {
            cache: 'no-store',
            credentials: 'include',
        });

        console.log(`[adminQuery] Response status: ${res.status}`);

        if (!res.ok) {
            const errorData = await res.json().catch(() => ({}));
            const errorMsg = errorData.error || `HTTP ${res.status}`;
            console.error(`[adminQuery] Error for ${options.table}:`, errorMsg);
            
            // إذا كان الخطأ Unauthorized، أضف رسالة واضحة
            if (res.status === 401 || res.status === 403) {
                return { data: [], count: null, error: 'غير مصرح لك بالوصول. يرجى تسجيل الدخول مرة أخرى.' };
            }
            
            throw new Error(errorMsg);
        }

        const result = await res.json();
        console.log(`[adminQuery] Success for ${options.table}, count:`, result.data?.length || 0);
        return { data: result.data || [], count: result.count, error: null };
    } catch (err) {
        const message = err instanceof Error ? err.message : 'Query failed';
        console.error('[adminQuery] Error:', message);
        return { data: [], count: null, error: message };
    }
}

/**
 * Insert data via admin API
 */
export async function adminInsert<T>(table: string, data: Partial<T>): Promise<{ data: T | null; error: string | null }> {
    try {
        const res = await fetch('/api/admin/query', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include',
            body: JSON.stringify({ table, data }),
        });

        if (!res.ok) {
            const errorData = await res.json().catch(() => ({}));
            throw new Error(errorData.error || `HTTP ${res.status}`);
        }

        const result = await res.json();
        return { data: result.data, error: null };
    } catch (err) {
        const message = err instanceof Error ? err.message : 'Insert failed';
        return { data: null, error: message };
    }
}

/**
 * Update data via admin API
 */
export async function adminUpdate<T>(table: string, id: string, updates: Partial<T>): Promise<{ data: T | null; error: string | null }> {
    try {
        const res = await fetch('/api/admin/query', {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include',
            body: JSON.stringify({ table, id, updates }),
        });

        if (!res.ok) {
            const errorData = await res.json().catch(() => ({}));
            throw new Error(errorData.error || `HTTP ${res.status}`);
        }

        const result = await res.json();
        return { data: result.data, error: null };
    } catch (err) {
        const message = err instanceof Error ? err.message : 'Update failed';
        return { data: null, error: message };
    }
}

/**
 * Delete data via admin API
 */
export async function adminDelete(table: string, id: string): Promise<{ success: boolean; error: string | null }> {
    try {
        const params = new URLSearchParams({ table, id });
        const res = await fetch(`/api/admin/query?${params}`, { method: 'DELETE', credentials: 'include' });

        if (!res.ok) {
            const errorData = await res.json().catch(() => ({}));
            throw new Error(errorData.error || `HTTP ${res.status}`);
        }

        return { success: true, error: null };
    } catch (err) {
        const message = err instanceof Error ? err.message : 'Delete failed';
        return { success: false, error: message };
    }
}
