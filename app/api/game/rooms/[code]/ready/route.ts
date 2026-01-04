import { NextRequest, NextResponse } from 'next/server';
import { setPlayerReady, areAllPlayersReady, getPlayer } from '@/lib/game/room-manager';
import { playerReadyEvent } from '@/lib/game/event-manager';
import { supabase } from '@/lib/supabase';
import { logger } from '@/lib/utils/logger';

// POST - Toggle ready status
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

        // Get current ready status
        const player = await getPlayer(code, user.id);
        if (!player) {
            return NextResponse.json(
                { success: false, error: 'اللاعب غير موجود في الغرفة' },
                { status: 400 }
            );
        }

        const newReadyStatus = !player.isReady;

        // Update ready status
        await setPlayerReady(code, user.id, newReadyStatus);

        // Publish ready event
        await playerReadyEvent(code, user.id, newReadyStatus);

        // Check if all players are ready
        const allReady = await areAllPlayersReady(code);

        return NextResponse.json({
            success: true,
            isReady: newReadyStatus,
            allReady,
        });
    } catch (error) {
        logger.error('Error updating ready status', { context: 'GameAPI', data: error });
        return NextResponse.json(
            { success: false, error: 'خطأ في تحديث الحالة' },
            { status: 500 }
        );
    }
}
