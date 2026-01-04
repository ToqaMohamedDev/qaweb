// =============================================
// API: Upload Teacher Image - رفع صور المدرس
// Simple version using AWS SDK directly
// =============================================

import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { S3Client, PutObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

// R2 Configuration
const R2_ACCOUNT_ID = process.env.R2_ACCOUNT_ID;
const BUCKET_NAME = process.env.R2_BUCKET_NAME || 'teachers-assets';
const PUBLIC_URL = process.env.R2_PUBLIC_URL || 'https://pub-b30cd2ae70694993a15aa1ad9a5f84db.r2.dev';

// Create simple R2 Client
function getR2Client() {
    const accessKeyId = process.env.R2_ACCESS_KEY_ID;
    const secretAccessKey = process.env.R2_SECRET_ACCESS_KEY;

    if (!accessKeyId || !secretAccessKey) {
        throw new Error('R2 credentials not configured');
    }

    if (!R2_ACCOUNT_ID) {
        throw new Error('R2_ACCOUNT_ID not configured');
    }

    return new S3Client({
        region: 'auto',
        endpoint: `https://${R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
        credentials: {
            accessKeyId,
            secretAccessKey,
        },
        forcePathStyle: true,
    });
}

// Helper to get authenticated user
async function getAuthenticatedUser(supabase: any) {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return null;

    const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single();

    return { user, profile };
}

// Helper to create Supabase client
async function createSupabaseClient() {
    const cookieStore = await cookies();
    return createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
            cookies: {
                get(name: string) {
                    return cookieStore.get(name)?.value;
                },
                set() { },
                remove() { },
            },
        }
    );
}

// Helper to delete old image from R2
async function deleteOldImage(oldUrl: string | null | undefined) {
    if (!oldUrl) return;

    try {
        // Extract key from URL
        // URL format: https://pub-xxx.r2.dev/teachers-avatars/user_id_timestamp.jpg
        const urlParts = oldUrl.split('/');
        const folder = urlParts[urlParts.length - 2];
        const fileName = urlParts[urlParts.length - 1];

        if (!folder || !fileName) return;
        if (!folder.startsWith('teachers-')) return; // Safety check

        const key = `${folder}/${fileName}`;
        console.log('Deleting old image:', key);

        const r2Client = getR2Client();
        const deleteCommand = new DeleteObjectCommand({
            Bucket: BUCKET_NAME,
            Key: key,
        });

        await r2Client.send(deleteCommand);
        console.log('Old image deleted successfully');
    } catch (error) {
        // Don't fail if delete fails - just log it
        console.error('Failed to delete old image:', error);
    }
}

// GET: Generate presigned URL for upload
export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const type = searchParams.get('type') || 'avatar';
        const contentType = searchParams.get('contentType') || 'image/jpeg';
        const fileName = searchParams.get('fileName') || 'image.jpg';

        const supabase = await createSupabaseClient();
        const auth = await getAuthenticatedUser(supabase);

        if (!auth) {
            return NextResponse.json({ error: 'غير مصرح' }, { status: 401 });
        }

        if (auth.profile?.role !== 'teacher') {
            return NextResponse.json(
                { error: 'متاح للمدرسين فقط' },
                { status: 403 }
            );
        }

        // Generate key
        const folder = type === 'cover' ? 'teachers-covers' : 'teachers-avatars';
        const fileExtension = fileName.split('.').pop() || 'jpg';
        const timestamp = Date.now();
        const key = `${folder}/${auth.user.id}_${timestamp}.${fileExtension}`;

        const r2Client = getR2Client();
        const command = new PutObjectCommand({
            Bucket: BUCKET_NAME,
            Key: key,
            ContentType: contentType,
            CacheControl: 'public, max-age=31536000',
        });

        const presignedUrl = await getSignedUrl(r2Client, command, {
            expiresIn: 300, // 5 minutes
        });

        const publicUrl = `${PUBLIC_URL}/${key}`;

        return NextResponse.json({
            presignedUrl,
            publicUrl,
            key,
        });

    } catch (error: any) {
        console.error('Presign error:', error);
        return NextResponse.json(
            { error: 'فشل في إنشاء رابط الرفع' },
            { status: 500 }
        );
    }
}

// PUT: Server-side upload to R2
export async function PUT(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const type = searchParams.get('type') || 'avatar';
        const contentType = request.headers.get('content-type') || 'image/jpeg';
        const fileName = searchParams.get('fileName') || 'image.jpg';

        console.log('=== R2 Upload Started ===');
        console.log('Type:', type);
        console.log('ContentType:', contentType);
        console.log('FileName:', fileName);

        // Verify R2 credentials
        if (!process.env.R2_ACCESS_KEY_ID || !process.env.R2_SECRET_ACCESS_KEY) {
            console.error('Missing R2 credentials');
            return NextResponse.json(
                { error: 'خدمة رفع الصور غير مُهيأة - missing credentials' },
                { status: 500 }
            );
        }

        if (!R2_ACCOUNT_ID) {
            console.error('Missing R2_ACCOUNT_ID');
            return NextResponse.json(
                { error: 'خدمة رفع الصور غير مُهيأة - missing account ID' },
                { status: 500 }
            );
        }

        console.log('R2 Account ID:', R2_ACCOUNT_ID);
        console.log('R2 Bucket:', BUCKET_NAME);

        // Verify user
        const supabase = await createSupabaseClient();
        const auth = await getAuthenticatedUser(supabase);

        if (!auth) {
            return NextResponse.json({ error: 'غير مصرح' }, { status: 401 });
        }

        if (auth.profile?.role !== 'teacher') {
            return NextResponse.json(
                { error: 'متاح للمدرسين فقط' },
                { status: 403 }
            );
        }

        // Get current profile to find old image URL
        const { data: currentProfile } = await supabase
            .from('profiles')
            .select('avatar_url, cover_image_url')
            .eq('id', auth.user.id)
            .single();

        const oldImageUrl = type === 'cover'
            ? currentProfile?.cover_image_url
            : currentProfile?.avatar_url;

        // Delete old image if exists
        if (oldImageUrl) {
            console.log('Deleting old image before upload...');
            await deleteOldImage(oldImageUrl);
        }

        // Generate key
        const folder = type === 'cover' ? 'teachers-covers' : 'teachers-avatars';
        const fileExtension = fileName.split('.').pop() || 'jpg';
        const timestamp = Date.now();
        const key = `${folder}/${auth.user.id}_${timestamp}.${fileExtension}`;

        console.log('Upload Key:', key);

        // Get file buffer from request body
        const arrayBuffer = await request.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);

        console.log('File size:', buffer.length, 'bytes');

        // Upload to R2
        const r2Client = getR2Client();
        const uploadCommand = new PutObjectCommand({
            Bucket: BUCKET_NAME,
            Key: key,
            Body: buffer,
            ContentType: contentType,
            CacheControl: 'public, max-age=31536000',
        });

        console.log('Uploading to R2...');
        await r2Client.send(uploadCommand);
        console.log('Upload successful!');

        const publicUrl = `${PUBLIC_URL}/${key}`;
        console.log('Public URL:', publicUrl);

        // Update profile with new URL
        const updateField = type === 'cover' ? 'cover_image_url' : 'avatar_url';
        const { error: updateError } = await supabase
            .from('profiles')
            .update({
                [updateField]: publicUrl,
                updated_at: new Date().toISOString(),
            })
            .eq('id', auth.user.id);

        if (updateError) {
            console.error('Profile update error:', updateError);
            return NextResponse.json(
                { error: 'فشل في تحديث الملف الشخصي' },
                { status: 500 }
            );
        }

        return NextResponse.json({
            success: true,
            url: publicUrl,
        });

    } catch (error: any) {
        console.error('=== R2 Upload Error ===');
        console.error('Error name:', error.name);
        console.error('Error message:', error.message);
        console.error('Error code:', error.code);
        console.error('Full error:', error);

        return NextResponse.json(
            { error: `فشل في رفع الصورة: ${error.message}` },
            { status: 500 }
        );
    }
}

// POST: Update profile with uploaded image URL (for client-side uploads)
export async function POST(request: NextRequest) {
    try {
        const supabase = await createSupabaseClient();
        const auth = await getAuthenticatedUser(supabase);

        if (!auth) {
            return NextResponse.json({ error: 'غير مصرح' }, { status: 401 });
        }

        const body = await request.json();
        const { url, type } = body;

        if (!url) {
            return NextResponse.json({ error: 'لم يتم تحديد الرابط' }, { status: 400 });
        }

        // Update profile
        const updateField = type === 'cover' ? 'cover_image_url' : 'avatar_url';
        const { error: updateError } = await supabase
            .from('profiles')
            .update({
                [updateField]: url,
                updated_at: new Date().toISOString(),
            })
            .eq('id', auth.user.id);

        if (updateError) {
            console.error('Profile update error:', updateError);
            return NextResponse.json(
                { error: 'فشل في تحديث الملف الشخصي' },
                { status: 500 }
            );
        }

        return NextResponse.json({ success: true, url });

    } catch (error: any) {
        console.error('Update error:', error);
        return NextResponse.json(
            { error: 'فشل في التحديث' },
            { status: 500 }
        );
    }
}
