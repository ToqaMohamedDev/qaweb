/**
 * API: Text-to-Speech Service
 * نطق الكلمات متعدد اللغات
 */

import { NextRequest, NextResponse } from 'next/server';
import { ttsService } from '@/lib/words/translation-service';

// GET - توليد صوت للنص
export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const text = searchParams.get('text');
        const lang = searchParams.get('lang') || 'en';

        if (!text) {
            return NextResponse.json(
                { success: false, error: 'text is required' },
                { status: 400 }
            );
        }

        // التحقق من دعم اللغة
        if (!ttsService.isLanguageSupported(lang)) {
            return NextResponse.json(
                { success: false, error: `Language '${lang}' is not supported for TTS` },
                { status: 400 }
            );
        }

        // محاولة توليد الصوت من الـ server
        const audioBuffer = await ttsService.generateAudio(text, lang);

        if (audioBuffer) {
            // إرجاع الصوت كـ MP3
            return new NextResponse(audioBuffer, {
                headers: {
                    'Content-Type': 'audio/mpeg',
                    'Content-Length': audioBuffer.length.toString(),
                    'Cache-Control': 'public, max-age=86400', // Cache for 24 hours
                },
            });
        }

        // إذا لم يكن هناك API key، نرجع معلومات للـ client ليستخدم Web Speech API
        return NextResponse.json({
            success: true,
            useClientTTS: true,
            text,
            lang,
            voice: ttsService.getVoiceForLanguage(lang),
        });
    } catch (error) {
        console.error('TTS error:', error);
        return NextResponse.json(
            { success: false, error: 'TTS generation failed' },
            { status: 500 }
        );
    }
}

// POST - توليد صوت لنص أطول
export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { text, lang } = body;

        if (!text || !lang) {
            return NextResponse.json(
                { success: false, error: 'text and lang are required' },
                { status: 400 }
            );
        }

        if (!ttsService.isLanguageSupported(lang)) {
            return NextResponse.json(
                { success: false, error: `Language '${lang}' is not supported for TTS` },
                { status: 400 }
            );
        }

        const audioBuffer = await ttsService.generateAudio(text, lang);

        if (audioBuffer) {
            return new NextResponse(audioBuffer, {
                headers: {
                    'Content-Type': 'audio/mpeg',
                    'Content-Length': audioBuffer.length.toString(),
                },
            });
        }

        return NextResponse.json({
            success: true,
            useClientTTS: true,
            text,
            lang,
            voice: ttsService.getVoiceForLanguage(lang),
        });
    } catch (error) {
        console.error('TTS error:', error);
        return NextResponse.json(
            { success: false, error: 'TTS generation failed' },
            { status: 500 }
        );
    }
}
