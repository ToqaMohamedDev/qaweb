'use server';

export async function testEnvVars() {
    console.log('[testEnvVars] NEXT_PUBLIC_SUPABASE_URL:', !!process.env.NEXT_PUBLIC_SUPABASE_URL);
    console.log('[testEnvVars] SUPABASE_SERVICE_ROLE_KEY:', !!process.env.SUPABASE_SERVICE_ROLE_KEY);
    console.log('[testEnvVars] Service key first 20 chars:', process.env.SUPABASE_SERVICE_ROLE_KEY?.substring(0, 20));

    return {
        hasUrl: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
        hasKey: !!process.env.SUPABASE_SERVICE_ROLE_KEY,
        keyStart: process.env.SUPABASE_SERVICE_ROLE_KEY?.substring(0, 20)
    };
}
