/**
 * Translation & TTS Service
 * خدمة الترجمة والنطق متعددة اللغات
 * استخدام MyMemory API المجاني + Web Speech API للنطق
 */

import { TranslateResponse } from './types';

// ============================================================================
// خريطة أصوات TTS للغات (Web Speech API)
// ============================================================================

const TTS_VOICES: Record<string, string> = {
    'ar': 'ar-SA',
    'en': 'en-US',
    'fr': 'fr-FR',
    'de': 'de-DE',
    'es': 'es-ES',
    'it': 'it-IT',
    'pt': 'pt-BR',
    'ru': 'ru-RU',
    'zh': 'zh-CN',
    'ja': 'ja-JP',
    'ko': 'ko-KR',
    'tr': 'tr-TR',
    'nl': 'nl-NL',
    'pl': 'pl-PL',
    'sv': 'sv-SE',
    'da': 'da-DK',
    'fi': 'fi-FI',
    'no': 'nb-NO',
    'el': 'el-GR',
    'he': 'he-IL',
    'hi': 'hi-IN',
    'th': 'th-TH',
    'vi': 'vi-VN',
    'id': 'id-ID',
    'ms': 'ms-MY',
};

// الحد الأقصى للنص (لتجنب طلبات كبيرة)
const MAX_TEXT_LENGTH = 500;

// ============================================================================
// Translation Providers
// ============================================================================

interface TranslationProvider {
    translate(text: string, from: string, to: string): Promise<string>;
}

/**
 * MyMemory Translation API (مجاني 100%)
 * https://mymemory.translated.net/doc/spec.php
 * - 1000 كلمة/يوم بدون تسجيل
 * - 10000 كلمة/يوم مع email
 */
class MyMemoryProvider implements TranslationProvider {
    private email?: string;

    constructor() {
        this.email = process.env.MYMEMORY_EMAIL;
    }

    async translate(text: string, from: string, to: string): Promise<string> {
        // قص النص إذا كان طويلاً جداً
        const trimmedText = text.slice(0, MAX_TEXT_LENGTH);
        
        const url = new URL('https://api.mymemory.translated.net/get');
        url.searchParams.append('q', trimmedText);
        url.searchParams.append('langpair', `${from}|${to}`);
        
        // إضافة email لزيادة الحد اليومي
        if (this.email) {
            url.searchParams.append('de', this.email);
        }

        try {
            const response = await fetch(url.toString(), {
                method: 'GET',
                headers: {
                    'Accept': 'application/json',
                },
            });

            if (!response.ok) {
                throw new Error(`MyMemory API error: ${response.status}`);
            }

            const data = await response.json();
            
            // التحقق من نجاح الترجمة
            if (data.responseStatus !== 200) {
                throw new Error(data.responseDetails || 'Translation failed');
            }

            return data.responseData.translatedText;
        } catch (error) {
            console.error('MyMemory error:', error);
            throw error;
        }
    }
}

/**
 * Fallback Provider - إرجاع النص الأصلي مع علامة
 */
class FallbackProvider implements TranslationProvider {
    async translate(text: string, _from: string, _to: string): Promise<string> {
        return text; // إرجاع النص الأصلي
    }
}

// ============================================================================
// Main Translation Service
// ============================================================================

export class TranslationService {
    private primaryProvider: TranslationProvider;
    private fallbackProvider: TranslationProvider;
    private cache: Map<string, { translation: string; timestamp: number }> = new Map();
    private cacheTTL = 24 * 60 * 60 * 1000; // 24 ساعة

    constructor() {
        // استخدام MyMemory كـ Provider الأساسي (مجاني 100%)
        this.primaryProvider = new MyMemoryProvider();
        this.fallbackProvider = new FallbackProvider();
    }

    private getCacheKey(text: string, from: string, to: string): string {
        return `${from}:${to}:${text.toLowerCase().trim()}`;
    }

    async translate(text: string, from: string, to: string): Promise<TranslateResponse> {
        // نفس اللغة
        if (from === to) {
            return {
                success: true,
                translation: text,
                from_language: from,
                to_language: to,
            };
        }

        const cacheKey = this.getCacheKey(text, from, to);

        // تحقق من الـ Cache
        const cached = this.cache.get(cacheKey);
        if (cached && Date.now() - cached.timestamp < this.cacheTTL) {
            return {
                success: true,
                translation: cached.translation,
                pronunciation_url: `/api/words/tts?text=${encodeURIComponent(text)}&lang=${from}`,
                from_language: from,
                to_language: to,
            };
        }

        try {
            // محاولة الترجمة
            const translation = await this.primaryProvider.translate(text, from, to);

            // تخزين في Cache
            this.cache.set(cacheKey, {
                translation,
                timestamp: Date.now(),
            });

            return {
                success: true,
                translation,
                pronunciation_url: `/api/words/tts?text=${encodeURIComponent(text)}&lang=${from}`,
                from_language: from,
                to_language: to,
            };
        } catch {
            // Fallback
            try {
                const translation = await this.fallbackProvider.translate(text, from, to);
                return {
                    success: true,
                    translation,
                    from_language: from,
                    to_language: to,
                };
            } catch {
                return {
                    success: false,
                    translation: text,
                    from_language: from,
                    to_language: to,
                };
            }
        }
    }

    /**
     * ترجمة ثنائية الاتجاه
     */
    async translateBidirectional(
        text: string,
        lang1: string,
        lang2: string
    ): Promise<{
        forward: TranslateResponse;
        backward: TranslateResponse;
    }> {
        const [forward, backward] = await Promise.all([
            this.translate(text, lang1, lang2),
            this.translate(text, lang2, lang1),
        ]);

        return { forward, backward };
    }

    clearCache(): void {
        this.cache.clear();
    }
}

// ============================================================================
// TTS Service
// ============================================================================

export class TTSService {
    /**
     * توليد رابط صوت للنص
     * يستخدم Web Speech API على الـ client أو Google Cloud TTS على الـ server
     */
    getVoiceForLanguage(languageCode: string): string {
        return TTS_VOICES[languageCode] || 'en-US';
    }

    /**
     * توليد صوت باستخدام Google Cloud TTS (يتطلب API Key)
     */
    async generateAudio(text: string, languageCode: string): Promise<Buffer | null> {
        const apiKey = process.env.GOOGLE_TTS_API_KEY;

        if (!apiKey) {
            // بدون API key، سنستخدم Web Speech API على الـ client
            return null;
        }

        try {
            const voice = this.getVoiceForLanguage(languageCode);
            const response = await fetch(
                `https://texttospeech.googleapis.com/v1/text:synthesize?key=${apiKey}`,
                {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        input: { text },
                        voice: {
                            languageCode: voice,
                            ssmlGender: 'NEUTRAL',
                        },
                        audioConfig: {
                            audioEncoding: 'MP3',
                        },
                    }),
                }
            );

            if (!response.ok) {
                throw new Error(`TTS API error: ${response.status}`);
            }

            const data = await response.json();
            return Buffer.from(data.audioContent, 'base64');
        } catch (error) {
            console.error('TTS error:', error);
            return null;
        }
    }

    /**
     * تحقق من دعم اللغة
     */
    isLanguageSupported(languageCode: string): boolean {
        return languageCode in TTS_VOICES;
    }

    /**
     * قائمة اللغات المدعومة للـ TTS
     */
    getSupportedLanguages(): string[] {
        return Object.keys(TTS_VOICES);
    }
}

// Singleton instances
export const translationService = new TranslationService();
export const ttsService = new TTSService();
