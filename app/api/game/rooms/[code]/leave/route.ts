import { NextRequest, NextResponse } from 'next/server';
import { removePlayerFromRoom, getPlayer } from '@/lib/game/room-manager';
import { playerLeftEvent } from '@/lib/game/event-manager';
import { supabase } from '@/lib/supabase';
import { logger } from '@/lib/utils/logger';

// POST - Leave room
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

        // Get player info before leaving
        const player = await getPlayer(code, user.id);
        const displayName = player?.odDisplayName || 'لاعب';

        // Remove player
        await removePlayerFromRoom(code, user.id);

        // Publish player left event
        await playerLeftEvent(code, user.id, displayName);

        return NextResponse.json({ success: true });
    } catch (error) {
        logger.error('Error leaving room', { context: 'GameAPI', data: error });
        return NextResponse.json(
            { success: false, error: 'خطأ في مغادرة الغرفة' },
            { status: 500 }
        );
    }
}
