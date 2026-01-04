// =============================================
// Game User Types - أنواع المستخدم في اللعبة
// =============================================

import type { User } from '@supabase/supabase-js';

// Simplified user type for game context
export interface GameUser {
    id: string;
    email?: string;
    displayName: string;
    avatar?: string;
}

// Extract game user from Supabase User
export function extractGameUser(user: User | null): GameUser | null {
    if (!user) return null;

    return {
        id: user.id,
        email: user.email,
        displayName: user.user_metadata?.name || user.email?.split('@')[0] || 'لاعب',
        avatar: user.user_metadata?.avatar_url,
    };
}

// Score update from SSE events
export interface ScoreUpdate {
    odUserId: string;
    score: number;
    delta: number;
}
