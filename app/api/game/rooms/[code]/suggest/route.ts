import { NextRequest, NextResponse } from 'next/server';
import { getRoom, getPlayer } from '@/lib/game/room-manager';
import { answerSuggestionEvent } from '@/lib/game/event-manager';
import { supabase } from '@/lib/supabase';
import { logger } from '@/lib/utils/logger';

// POST - Suggest Answer
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

        const body = await request.json();
        const { answer } = body;

        if (typeof answer !== 'number') {
            return NextResponse.json(
                { success: false, error: 'بيانات غير صالحة' },
                { status: 400 }
            );
        }

        const room = await getRoom(code);
        if (!room) {
            return NextResponse.json(
                { success: false, error: 'الغرفة غير موجودة' },
                { status: 404 }
            );
        }

        if (room.gameMode !== 'team') {
            return NextResponse.json(
                { success: false, error: 'الاقتراحات متاحة فقط في وضع الفريق' },
                { status: 400 }
            );
        }

        const player = await getPlayer(code, user.id);
        if (!player) {
            return NextResponse.json(
                { success: false, error: 'اللاعب غير موجود' },
                { status: 400 }
            );
        }

        if (!player.team) {
            return NextResponse.json(
                { success: false, error: 'لست في فريق' },
                { status: 400 }
            );
        }

        // Publish suggestion event
        await answerSuggestionEvent(
            code,
            player.team,
            user.id,
            player.odDisplayName,
            answer
        );

        return NextResponse.json({ success: true });
    } catch (error) {
        logger.error('Error suggesting answer', { context: 'GameAPI', data: error });
        return NextResponse.json(
            { success: false, error: 'خطأ في إرسال الاقتراح' },
            { status: 500 }
        );
    }
}
