// Supabase Edge Function: send-scheduled-notifications
// يعمل تلقائياً لإرسال الإشعارات المجدولة

import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
    // Handle CORS
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders })
    }

    try {
        // إنشاء Supabase client
        const supabaseUrl = Deno.env.get('SUPABASE_URL')!
        const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
        const supabase = createClient(supabaseUrl, supabaseKey)

        const now = new Date().toISOString()

        console.log(`[${now}] Checking for scheduled notifications...`)

        // جلب الإشعارات المجدولة التي حان وقتها
        const { data: notifications, error: fetchError } = await supabase
            .from('notifications')
            .select('*')
            .eq('status', 'pending')
            .not('scheduled_for', 'is', null)
            .lte('scheduled_for', now)

        if (fetchError) {
            throw fetchError
        }

        if (!notifications || notifications.length === 0) {
            console.log('No scheduled notifications to send')
            return new Response(
                JSON.stringify({ success: true, sent: 0, message: 'No scheduled notifications' }),
                { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            )
        }

        console.log(`Found ${notifications.length} notifications to send`)

        // إرسال كل إشعار
        let sentCount = 0
        const errors = []

        for (const notif of notifications) {
            try {
                // جلب المستخدمين المستهدفين
                let targetUsers = []

                if (notif.target_role === 'all' || !notif.target_role) {
                    const { data: users } = await supabase
                        .from('profiles')
                        .select('id')
                    targetUsers = users || []
                } else {
                    const { data: users } = await supabase
                        .from('profiles')
                        .select('id')
                        .eq('role', notif.target_role)
                    targetUsers = users || []
                }

                if (targetUsers.length === 0) {
                    console.log(`No users found for notification ${notif.id}`)
                    continue
                }

                // إنشاء سجلات إشعارات للمستخدمين (إذا كان لديك جدول user_notifications)
                // أو يمكنك استخدام البث الفوري (Realtime) لإرسال الإشعار مباشرة

                // تحديث حالة الإشعار إلى "sent"
                const { error: updateError } = await supabase
                    .from('notifications')
                    .update({
                        status: 'sent',
                        sent_at: new Date().toISOString(),
                        updated_at: new Date().toISOString()
                    })
                    .eq('id', notif.id)

                if (updateError) {
                    throw updateError
                }

                console.log(`✅ Sent notification ${notif.id} to ${targetUsers.length} users`)
                sentCount++

            } catch (error) {
                console.error(`❌ Error sending notification ${notif.id}:`, error)
                errors.push({ id: notif.id, error: error.message })

                // تحديث الحالة إلى failed
                await supabase
                    .from('notifications')
                    .update({
                        status: 'failed',
                        updated_at: new Date().toISOString()
                    })
                    .eq('id', notif.id)
            }
        }

        return new Response(
            JSON.stringify({
                success: true,
                sent: sentCount,
                total: notifications.length,
                errors: errors.length > 0 ? errors : undefined
            }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )

    } catch (error) {
        console.error('Function error:', error)
        return new Response(
            JSON.stringify({ error: error.message }),
            {
                status: 500,
                headers: { ...corsHeaders, 'Content-Type': 'application/json' }
            }
        )
    }
})
