import { NextRequest, NextResponse } from 'next/server';
import { joinRoom } from '@/lib/game/room-manager';
import { playerJoinedEvent } from '@/lib/game/event-manager';
import { supabase } from '@/lib/supabase';
import { logger } from '@/lib/utils/logger';

// POST - Join room
export async function POST(
    request: NextRequest,
    { params }: { params: Promise<{ code: string }> }
) {
    try {
        const { code } = await params;

        // Get authenticated user
        const authHeader = request.headers.get('authorization');
        if (!authHeader) {
            return NextResponse.json(
                { success: false, error: 'غير مصرح' },
                { status: 401 }
            );
        }

        const token = authHeader.replace('Bearer ', '');
        const { data: { user }, error: authError } = await supabase.auth.getUser(token);

        if (authError || !user) {
            return NextResponse.json(
                { success: false, error: 'غير مصرح' },
                { status: 401 }
            );
        }

        const body = await request.json().catch(() => ({}));
        const password = body?.password;

        const displayName = user.user_metadata?.name || user.email?.split('@')[0] || 'لاعب';
        const avatar = user.user_metadata?.avatar_url;

        const result = await joinRoom(code, user.id, displayName, avatar, password);

        if (!result.success) {
            return NextResponse.json(
                { success: false, error: result.error },
                { status: 400 }
            );
        }

        // Publish player joined event
        if (result.player) {
            await playerJoinedEvent(code, result.player);
        }

        return NextResponse.json({ success: true, player: result.player });
    } catch (error) {
        logger.error('Error joining room', { context: 'GameAPI', data: error });
        return NextResponse.json(
            { success: false, error: 'خطأ في الانضمام للغرفة' },
            { status: 500 }
        );
    }
}
