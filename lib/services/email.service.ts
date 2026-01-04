/**
 * Email Service - خدمة البريد الإلكتروني
 * باستخدام Resend
 */

import { Resend } from 'resend';

// تهيئة Resend
const resend = new Resend(process.env.RESEND_API_KEY);

/**
 * إرسال بريد إلكتروني
 */
export async function sendEmail({
    to,
    subject,
    html,
    from = 'Qaalaa <notifications@qaalaa.com>',
}: {
    to: string | string[];
    subject: string;
    html: string;
    from?: string;
}) {
    try {
        const { data, error } = await resend.emails.send({
            from,
            to,
            subject,
            html,
        });

        if (error) {
            console.error('Email sending error:', error);
            throw error;
        }

        return data;
    } catch (error) {
        console.error('Failed to send email:', error);
        throw error;
    }
}

/**
 * إرسال إشعار بالبريد الإلكتروني
 */
export async function sendEmailNotification({
    userId,
    title,
    message,
    actionUrl,
    actionText = 'عرض التفاصيل',
}: {
    userId: string;
    title: string;
    message: string;
    actionUrl?: string;
    actionText?: string;
}) {
    try {
        // جلب بريد المستخدم وتفضيلاته
        const { createClient } = await import('@/lib/supabase');
        const supabase = createClient();

        const { data: profile } = await supabase
            .from('profiles')
            .select('email, notification_preferences(email_notifications)')
            .eq('id', userId)
            .single();

        if (!profile?.email) {
            console.log('No email found for user:', userId);
            return null;
        }

        // التحقق من تفعيل إشعارات البريد
        const emailEnabled = profile.notification_preferences?.email_notifications !== false;

        if (!emailEnabled) {
            console.log('Email notifications disabled for user:', userId);
            return null;
        }

        // إنشاء HTML للبريد
        const html = createEmailTemplate({
            title,
            message,
            actionUrl,
            actionText,
        });

        // إرسال البريد
        return await sendEmail({
            to: profile.email,
            subject: title,
            html,
        });
    } catch (error) {
        console.error('Failed to send email notification:', error);
        throw error;
    }
}

/**
 * قالب البريد الإلكتروني
 */
function createEmailTemplate({
    title,
    message,
    actionUrl,
    actionText,
}: {
    title: string;
    message: string;
    actionUrl?: string;
    actionText?: string;
}) {
    return `
<!DOCTYPE html>
<html dir="rtl" lang="ar">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title}</title>
</head>
<body style="margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f5f5f5;">
  <table role="presentation" style="width: 100%; border-collapse: collapse;">
    <tr>
      <td align="center" style="padding: 40px 0;">
        <table role="presentation" style="width: 600px; border-collapse: collapse; background-color: #ffffff; border-radius: 12px; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
          <!-- Header -->
          <tr>
            <td style="padding: 40px 30px 30px; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); border-radius: 12px 12px 0 0;">
              <h1 style="margin: 0; color: #ffffff; font-size: 28px; font-weight: bold; text-align: center;">
                Qaalaa
              </h1>
              <p style="margin: 10px 0 0; color: #ffffff; font-size: 14px; text-align: center; opacity: 0.9;">
                منصة التعليم التفاعلية
              </p>
            </td>
          </tr>

          <!-- Content -->
          <tr>
            <td style="padding: 40px 30px;">
              <h2 style="margin: 0 0 20px; color: #333333; font-size: 24px; font-weight: bold;">
                ${title}
              </h2>
              <div style="color: #666666; font-size: 16px; line-height: 1.6; white-space: pre-wrap;">
                ${message}
              </div>

              ${actionUrl ? `
              <table role="presentation" style="margin: 30px auto 0; border-collapse: collapse;">
                <tr>
                  <td style="border-radius: 8px; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);">
                    <a href="${actionUrl}" style="display: inline-block; padding: 14px 40px; color: #ffffff; text-decoration: none; font-weight: bold; font-size: 16px;">
                      ${actionText}
                    </a>
                  </td>
                </tr>
              </table>
              ` : ''}
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding: 30px; background-color: #f8f9fa; border-radius: 0 0 12px 12px; border-top: 1px solid #e9ecef;">
              <p style="margin: 0 0 10px; color: #666666; font-size: 14px; text-align: center;">
                تلقيت هذا البريد لأنك مشترك في إشعارات Qaalaa
              </p>
              <p style="margin: 0; color: #999999; font-size: 12px; text-align: center;">
                © ${new Date().getFullYear()} Qaalaa. جميع الحقوق محفوظة.
              </p>
              <p style="margin: 10px 0 0; text-align: center;">
                <a href="https://qaalaa.com/profile/notification-settings" style="color: #667eea; font-size: 12px; text-decoration: none;">
                  إدارة تفضيلات الإشعارات
                </a>
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `.trim();
}

// قوالب بريد محددة

/**
 * قالب بريد نشر امتحان جديد
 */
export function createExamPublishedEmail({
    teacherName,
    examTitle,
    examUrl,
}: {
    teacherName: string;
    examTitle: string;
    examUrl: string;
}) {
    return createEmailTemplate({
        title: 'امتحان جديد متاح!',
        message: `نشر المعلم ${teacherName} امتحاناً جديداً:\n\n"${examTitle}"\n\nابدأ الآن واختبر معلوماتك!`,
        actionUrl: examUrl,
        actionText: 'عرض الامتحان',
    });
}

/**
 * قالب بريد رد على رسالة
 */
export function createMessageReplyEmail({
    subject,
    reply,
    messageUrl,
}: {
    subject: string;
    reply: string;
    messageUrl: string;
}) {
    return createEmailTemplate({
        title: 'رد جديد على رسالتك',
        message: `تلقيت رداً على رسالتك "${subject}":\n\n${reply}`,
        actionUrl: messageUrl,
        actionText: 'عرض الرسالة',
    });
}

/**
 * قالب بريد رد على دعم فني
 */
export function createSupportReplyEmail({
    chatSubject,
    reply,
    chatUrl,
}: {
    chatSubject: string;
    reply: string;
    chatUrl: string;
}) {
    return createEmailTemplate({
        title: 'رد من فريق الدعم',
        message: `تلقيت رداً على محادثة الدعم "${chatSubject}":\n\n${reply}`,
        actionUrl: chatUrl,
        actionText: 'عرض الدردشة',
    });
}

/**
 * قالب بريد إشعار عام
 */
export function createGeneralNotificationEmail({
    title,
    message,
    url,
}: {
    title: string;
    message: string;
    url?: string;
}) {
    return createEmailTemplate({
        title,
        message,
        actionUrl: url,
        actionText: 'عرض التفاصيل',
    });
}
