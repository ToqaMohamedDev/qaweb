import { NextRequest, NextResponse } from 'next/server';
import { switchTeam, getPlayer } from '@/lib/game/room-manager';
import { supabase } from '@/lib/supabase';

// POST - Switch Team
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
        const { team } = body;

        if (team !== 'A' && team !== 'B') {
            return NextResponse.json(
                { success: false, error: 'فريق غير صالح' },
                { status: 400 }
            );
        }

        // Check if player exists
        const player = await getPlayer(code, user.id);
        if (!player) {
            return NextResponse.json(
                { success: false, error: 'اللاعب غير موجود في الغرفة' },
                { status: 400 }
            );
        }

        const result = await switchTeam(code, user.id, team);

        if (!result.success) {
            return NextResponse.json(
                { success: false, error: result.error },
                { status: 400 }
            );
        }

        // We could publish an event here, but the frontend polling will catch the change

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Error switching team:', error);
        return NextResponse.json(
            { success: false, error: 'خطأ في تغيير الفريق' },
            { status: 500 }
        );
    }
}
