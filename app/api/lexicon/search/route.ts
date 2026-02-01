/**
 * POST /api/lexicon/search
 * Semantic search endpoint
 */

import { NextRequest, NextResponse } from 'next/server';
import { lexiconService, INTERNAL_TOKEN_HEADER, ERRORS } from '@/lib/lexicon';
import type { SearchRequest } from '@/lib/lexicon';

export async function POST(request: NextRequest) {
  try {
    // Auth check: X-Lexicon-Token or same origin
    const token = request.headers.get(INTERNAL_TOKEN_HEADER);
    const expectedToken = process.env.LEXICON_INTERNAL_TOKEN;
    
    if (expectedToken && token !== expectedToken) {
      // Check origin as fallback
      const origin = request.headers.get('origin');
      const host = request.headers.get('host');
      if (origin && host && !origin.includes(host)) {
        return NextResponse.json({ error: ERRORS.UNAUTHORIZED }, { status: 403 });
      }
    }

    const body: SearchRequest = await request.json();

    // Validate required fields
    if (!body.query || body.query.trim() === '') {
      return NextResponse.json({ error: ERRORS.INVALID_QUERY }, { status: 400 });
    }
    if (!body.source_lang) {
      return NextResponse.json({ error: ERRORS.INVALID_SOURCE_LANG }, { status: 400 });
    }

    const result = await lexiconService.search(body);
    return NextResponse.json(result);

  } catch (error) {
    console.error('[Lexicon Search Error]', error);
    return NextResponse.json(
      { success: false, error: ERRORS.INTERNAL_ERROR },
      { status: 500 }
    );
  }
}
