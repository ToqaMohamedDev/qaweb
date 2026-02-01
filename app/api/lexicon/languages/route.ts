/**
 * GET /api/lexicon/languages
 * Get available languages
 */

import { NextRequest, NextResponse } from 'next/server';
import { lexiconService, ERRORS } from '@/lib/lexicon';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const activeOnly = searchParams.get('active') !== 'false';

    const result = await lexiconService.getLanguages(activeOnly);
    return NextResponse.json(result);

  } catch (error) {
    console.error('[Lexicon Languages Error]', error);
    return NextResponse.json(
      { success: false, error: ERRORS.INTERNAL_ERROR },
      { status: 500 }
    );
  }
}
