/**
 * GET /api/lexicon/stats
 * Get system statistics (admin only)
 */

import { NextResponse } from 'next/server';
import { lexiconService, ERRORS } from '@/lib/lexicon';
import { createClient } from '@/lib/supabase-server';

export async function GET() {
  try {
    // Check if user is admin
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      return NextResponse.json({ error: ERRORS.UNAUTHORIZED }, { status: 401 });
    }

    // Check admin role
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    if (profile?.role !== 'admin') {
      return NextResponse.json({ error: ERRORS.UNAUTHORIZED }, { status: 403 });
    }

    const result = await lexiconService.getStats();
    return NextResponse.json(result);

  } catch (error) {
    console.error('[Lexicon Stats Error]', error);
    return NextResponse.json(
      { success: false, error: ERRORS.INTERNAL_ERROR },
      { status: 500 }
    );
  }
}
