/**
 * GET /api/lexicon/random
 * Get random word pairs for games
 */

import { NextRequest, NextResponse } from 'next/server';
import { lexiconService, INTERNAL_TOKEN_HEADER, ERRORS } from '@/lib/lexicon';

export async function GET(request: NextRequest) {
  try {
    // Auth check
    const token = request.headers.get(INTERNAL_TOKEN_HEADER);
    const expectedToken = process.env.LEXICON_INTERNAL_TOKEN;
    
    if (expectedToken && token !== expectedToken) {
      const origin = request.headers.get('origin');
      const host = request.headers.get('host');
      if (origin && host && !origin.includes(host)) {
        return NextResponse.json({ error: ERRORS.UNAUTHORIZED }, { status: 403 });
      }
    }

    const { searchParams } = new URL(request.url);
    
    const source_lang = searchParams.get('source_lang');
    const target_lang = searchParams.get('target_lang');
    
    if (!source_lang || !target_lang) {
      return NextResponse.json(
        { error: 'source_lang and target_lang are required' },
        { status: 400 }
      );
    }

    const result = await lexiconService.getRandomPairs({
      source_lang,
      target_lang,
      count: parseInt(searchParams.get('count') || '10'),
      single_words_only: searchParams.get('single_words_only') === 'true',
      max_word_length: searchParams.get('max_length') 
        ? parseInt(searchParams.get('max_length')!) 
        : undefined,
    });

    return NextResponse.json(result);

  } catch (error) {
    console.error('[Lexicon Random Error]', error);
    return NextResponse.json(
      { success: false, error: ERRORS.INTERNAL_ERROR },
      { status: 500 }
    );
  }
}
