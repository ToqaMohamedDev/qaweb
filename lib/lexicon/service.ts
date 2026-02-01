/**
 * Lexicon Service
 * Business logic for semantic search and translation
 */

import { getLexiconClient, lexiconQuery } from './client';
import { normalizeText, extractLangCode } from './normalizer';
import { LEXICON_CONFIG, ERRORS } from './constants';
import type {
  SearchRequest,
  SearchResponse,
  TranslateRequest,
  TranslateResponse,
  RandomRequest,
  RandomResponse,
  LanguagesResponse,
  StatsResponse,
  MeaningResult,
  LexemeMatch,
  LexiconLanguage,
} from './types';

class LexiconService {
  /**
   * Semantic search - find meanings and translations
   */
  async search(request: SearchRequest): Promise<SearchResponse> {
    const startTime = Date.now();
    const client = getLexiconClient();
    const db = lexiconQuery(client);
    
    // Validate
    if (!request.query || request.query.trim() === '') {
      throw new Error(ERRORS.INVALID_QUERY);
    }
    if (!request.source_lang) {
      throw new Error(ERRORS.INVALID_SOURCE_LANG);
    }
    
    // Normalize query
    const langCode = extractLangCode(request.source_lang);
    const normalizedQuery = normalizeText(request.query.slice(0, LEXICON_CONFIG.MAX_QUERY_LENGTH), langCode);
    
    // Defaults
    const matchType = request.match_type || 'exact';
    const limit = Math.min(request.limit || LEXICON_CONFIG.DEFAULT_LIMIT, LEXICON_CONFIG.MAX_LIMIT);
    const offset = request.offset || 0;
    
    // Stage 1: Find source matches
    let sourceQuery = db.lexemes()
      .select('lexeme_id, meaning_id, txt, txt_norm, langvar_uid')
      .eq('langvar_uid', request.source_lang);
    
    if (matchType === 'exact') {
      sourceQuery = sourceQuery.eq('txt_norm', normalizedQuery);
    } else if (matchType === 'prefix') {
      sourceQuery = sourceQuery.ilike('txt_norm', `${normalizedQuery}%`);
    }
    
    if (request.single_words_only) {
      sourceQuery = sourceQuery.eq('is_single_word', true);
    }
    
    const { data: sourceMatches, error: sourceError } = await sourceQuery.limit(limit).range(offset, offset + limit - 1);
    
    if (sourceError) throw sourceError;
    if (!sourceMatches || sourceMatches.length === 0) {
      return {
        success: true,
        query: request.query,
        normalized_query: normalizedQuery,
        source_lang: request.source_lang,
        total_meanings: 0,
        results: [],
        meta: {
          execution_time_ms: Date.now() - startTime,
          cache_hit: false,
          total_source_matches: 0,
          total_translations: 0,
        },
      };
    }
    
    // Get unique meaning_ids
    const meaningIds = [...new Set(sourceMatches.map(m => m.meaning_id))];
    
    // Stage 2: Get translations for those meanings
    let translationQuery = db.lexemes()
      .select('lexeme_id, meaning_id, txt, txt_norm, langvar_uid')
      .in('meaning_id', meaningIds);
    
    if (request.target_langs && request.target_langs.length > 0) {
      translationQuery = translationQuery.in('langvar_uid', request.target_langs);
    } else {
      // Exclude source language from translations
      translationQuery = translationQuery.neq('langvar_uid', request.source_lang);
    }
    
    const { data: translations, error: transError } = await translationQuery;
    if (transError) throw transError;
    
    // Stage 3: Get synonyms if requested
    let synonyms: typeof sourceMatches = [];
    if (request.include_synonyms) {
      const { data: synData } = await db.lexemes()
        .select('lexeme_id, meaning_id, txt, txt_norm, langvar_uid')
        .in('meaning_id', meaningIds)
        .eq('langvar_uid', request.source_lang)
        .neq('txt_norm', normalizedQuery)
        .limit(100);
      
      synonyms = synData || [];
    }
    
    // Stage 4: Group by meaning
    const results: MeaningResult[] = meaningIds.map(meaningId => {
      const sourceForMeaning = sourceMatches
        .filter(m => m.meaning_id === meaningId)
        .map(m => ({
          lexeme_id: m.lexeme_id,
          txt: m.txt,
          txt_norm: m.txt_norm,
          langvar_uid: m.langvar_uid,
        }));
      
      const synonymsForMeaning = synonyms
        .filter(s => s.meaning_id === meaningId)
        .map(s => ({
          lexeme_id: s.lexeme_id,
          txt: s.txt,
          txt_norm: s.txt_norm,
          langvar_uid: s.langvar_uid,
        }));
      
      const translationsForMeaning = (translations || [])
        .filter(t => t.meaning_id === meaningId);
      
      // Group translations by language
      const translationsByLang: Record<string, LexemeMatch[]> = {};
      translationsForMeaning.forEach(t => {
        if (!translationsByLang[t.langvar_uid]) {
          translationsByLang[t.langvar_uid] = [];
        }
        translationsByLang[t.langvar_uid].push({
          lexeme_id: t.lexeme_id,
          txt: t.txt,
          txt_norm: t.txt_norm,
          langvar_uid: t.langvar_uid,
        });
      });
      
      return {
        meaning_id: meaningId,
        source_matches: sourceForMeaning,
        synonyms: request.include_synonyms ? synonymsForMeaning : undefined,
        translations: translationsByLang,
      };
    });
    
    // Filter out meanings with no translations if requested
    const filteredResults = request.only_translatable !== false
      ? results.filter(r => Object.keys(r.translations).length > 0)
      : results;
    
    return {
      success: true,
      query: request.query,
      normalized_query: normalizedQuery,
      source_lang: request.source_lang,
      total_meanings: filteredResults.length,
      results: filteredResults,
      meta: {
        execution_time_ms: Date.now() - startTime,
        cache_hit: false,
        total_source_matches: sourceMatches.length,
        total_translations: translations?.length || 0,
      },
    };
  }
  
  /**
   * Translate a word to target languages
   */
  async translate(request: TranslateRequest): Promise<TranslateResponse> {
    const searchResult = await this.search({
      query: request.word,
      source_lang: request.from_lang,
      target_langs: request.to_langs,
      match_type: 'exact',
      include_synonyms: request.include_synonyms,
      only_translatable: true,
    });
    
    return {
      success: searchResult.success,
      word: request.word,
      from_lang: request.from_lang,
      meanings: searchResult.results,
    };
  }
  
  /**
   * Get random word pairs for games
   */
  async getRandomPairs(request: RandomRequest): Promise<RandomResponse> {
    const client = getLexiconClient();
    const db = lexiconQuery(client);
    
    const count = request.count || 10;
    
    // Get random translatable meanings
    const query = db.meanings()
      .select('id')
      .eq('has_arabic', request.source_lang.startsWith('arb') || request.target_lang.startsWith('arb'))
      .eq('has_english', request.source_lang.startsWith('eng') || request.target_lang.startsWith('eng'));
    
    const { data: meanings } = await query.limit(count * 3);
    
    if (!meanings || meanings.length === 0) {
      return { success: true, pairs: [] };
    }
    
    // Shuffle and take count
    const shuffled = meanings.sort(() => Math.random() - 0.5).slice(0, count);
    const meaningIds = shuffled.map(m => m.id);
    
    // Get lexemes for these meanings
    let lexemeQuery = db.lexemes()
      .select('lexeme_id, meaning_id, txt, txt_norm, langvar_uid')
      .in('meaning_id', meaningIds)
      .in('langvar_uid', [request.source_lang, request.target_lang]);
    
    if (request.single_words_only) {
      lexemeQuery = lexemeQuery.eq('is_single_word', true);
    }
    
    if (request.max_word_length) {
      lexemeQuery = lexemeQuery.lte('word_length', request.max_word_length);
    }
    
    const { data: lexemes } = await lexemeQuery;
    
    if (!lexemes) {
      return { success: true, pairs: [] };
    }
    
    // Build pairs
    const pairs = meaningIds.map(meaningId => {
      const source = lexemes.find(l => l.meaning_id === meaningId && l.langvar_uid === request.source_lang);
      const target = lexemes.find(l => l.meaning_id === meaningId && l.langvar_uid === request.target_lang);
      
      if (!source || !target) return null;
      
      return {
        meaning_id: meaningId,
        source: {
          lexeme_id: source.lexeme_id,
          txt: source.txt,
          txt_norm: source.txt_norm,
          langvar_uid: source.langvar_uid,
        },
        target: {
          lexeme_id: target.lexeme_id,
          txt: target.txt,
          txt_norm: target.txt_norm,
          langvar_uid: target.langvar_uid,
        },
      };
    }).filter(Boolean) as RandomResponse['pairs'];
    
    return { success: true, pairs };
  }
  
  /**
   * Get available languages
   */
  async getLanguages(activeOnly: boolean = true): Promise<LanguagesResponse> {
    const client = getLexiconClient();
    const db = lexiconQuery(client);
    
    let query = db.languages().select('*').order('lexeme_count', { ascending: false });
    
    if (activeOnly) {
      query = query.eq('is_active', true);
    }
    
    const { data, error } = await query;
    
    if (error) throw error;
    
    return {
      success: true,
      languages: (data || []) as LexiconLanguage[],
      total: data?.length || 0,
    };
  }
  
  /**
   * Get system statistics
   */
  async getStats(): Promise<StatsResponse> {
    const client = getLexiconClient();
    const db = lexiconQuery(client);
    
    // Get counts
    const [lexemesRes, meaningsRes, languagesRes, translatableRes, arabicRes, englishRes] = await Promise.all([
      db.lexemes().select('*', { count: 'exact', head: true }),
      db.meanings().select('*', { count: 'exact', head: true }),
      db.languages().select('*', { count: 'exact', head: true }),
      db.meanings().select('*', { count: 'exact', head: true }).eq('has_arabic', true).eq('has_english', true),
      db.lexemes().select('*', { count: 'exact', head: true }).like('langvar_uid', 'arb%'),
      db.lexemes().select('*', { count: 'exact', head: true }).like('langvar_uid', 'eng%'),
    ]);
    
    return {
      success: true,
      stats: {
        total_lexemes: lexemesRes.count || 0,
        total_meanings: meaningsRes.count || 0,
        total_languages: languagesRes.count || 0,
        translatable_meanings: translatableRes.count || 0,
        arabic_lexemes: arabicRes.count || 0,
        english_lexemes: englishRes.count || 0,
      },
    };
  }
}

// Singleton instance
export const lexiconService = new LexiconService();
