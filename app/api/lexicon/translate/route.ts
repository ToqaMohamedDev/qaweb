/**
 * POST /api/lexicon/translate
 * Translate a word to target languages
 */

import { NextRequest, NextResponse } from 'next/server';
import { lexiconService, INTERNAL_TOKEN_HEADER, ERRORS } from '@/lib/lexicon';
import type { TranslateRequest } from '@/lib/lexicon';

export async function POST(request: NextRequest) {
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

    const body: TranslateRequest = await request.json();

    // Validate
    if (!body.word || body.word.trim() === '') {
      return NextResponse.json({ error: 'word is required' }, { status: 400 });
    }
    if (!body.from_lang) {
      return NextResponse.json({ error: 'from_lang is required' }, { status: 400 });
    }
    if (!body.to_langs || body.to_langs.length === 0) {
      return NextResponse.json({ error: 'to_langs is required' }, { status: 400 });
    }

    const result = await lexiconService.translate(body);
    return NextResponse.json(result);

  } catch (error) {
    console.error('[Lexicon Translate Error]', error);
    return NextResponse.json(
      { success: false, error: ERRORS.INTERNAL_ERROR },
      { status: 500 }
    );
  }
}
