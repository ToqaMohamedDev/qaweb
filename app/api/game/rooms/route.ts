import { NextRequest, NextResponse } from 'next/server';
import { createRoom, getPublicRooms } from '@/lib/game/room-manager';
import { supabase } from '@/lib/supabase';
import { CreateRoomRequest } from '@/lib/game/types';

// GET - List public rooms
export async function GET() {
    try {
        const rooms = await getPublicRooms();
        return NextResponse.json({ success: true, rooms });
    } catch (error) {
        console.error('Error listing rooms:', error);
        return NextResponse.json(
            { success: false, error: 'خطأ في جلب الغرف' },
            { status: 500 }
        );
    }
}

// POST - Create a new room
export async function POST(request: NextRequest) {
    try {
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

        const body: CreateRoomRequest = await request.json();

        // Validate required fields
        if (!body.name || !body.gameMode) {
            return NextResponse.json(
                { success: false, error: 'اسم الغرفة ووضع اللعب مطلوبان' },
                { status: 400 }
            );
        }

        // Validate game mode
        if (!['ffa', 'team'].includes(body.gameMode)) {
            return NextResponse.json(
                { success: false, error: 'وضع اللعب غير صالح' },
                { status: 400 }
            );
        }

        // Get user display name
        const displayName = user.user_metadata?.name || user.email?.split('@')[0] || 'لاعب';

        // Create room
        const room = await createRoom(user.id, displayName, body);

        return NextResponse.json({ success: true, room });
    } catch (error) {
        console.error('Error creating room:', error);
        const errorMessage = error instanceof Error ? error.message : 'خطأ في إنشاء الغرفة';
        return NextResponse.json(
            { success: false, error: errorMessage },
            { status: 500 }
        );
    }
}
