/* eslint-disable @typescript-eslint/ban-ts-comment */

/**
 * ============================================================================
 * PUSH DISPATCHER - SUPABASE EDGE FUNCTION
 * ============================================================================
 * 
 * Description: Handles sending push notifications via Firebase Cloud Messaging (FCM)
 * Trigger: Database Webhook on notifications table OR direct HTTP call
 * 
 * Environment Variables Required:
 * - SUPABASE_URL: Your Supabase project URL
 * - SUPABASE_SERVICE_ROLE_KEY: Service role key for database access
 * - FCM_SERVER_KEY: Firebase Cloud Messaging server key (Legacy API)
 * - FCM_PROJECT_ID: Firebase project ID (for FCM v1 API)
 * - GOOGLE_SERVICE_ACCOUNT: Base64 encoded service account JSON (for FCM v1)
 * 
 * ============================================================================
 */

// Deno global declaration for TypeScript
declare const Deno: {
    env: {
        get(key: string): string | undefined;
    };
};

// @ts-ignore: Deno URL import - types are available at runtime
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
// @ts-ignore: Deno URL import - types are available at runtime
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.0";

// ============================================================================
// TYPES
// ============================================================================

interface NotificationPayload {
    notification_id: string;
    user_id: string;
    type: string;
    title: string;
    body: string;
    data: Record<string, unknown>;
}

interface DeviceToken {
    id: string;
    device_token: string;
    platform: "ios" | "android" | "web";
    is_active: boolean;
}

interface FCMMessage {
    message: {
        token: string;
        notification: {
            title: string;
            body: string;
        };
        data: Record<string, string>;
        android?: {
            priority: string;
            notification: {
                sound: string;
                click_action: string;
                channel_id: string;
            };
        };
        apns?: {
            payload: {
                aps: {
                    sound: string;
                    badge?: number;
                    "content-available": number;
                };
            };
        };
        webpush?: {
            headers: {
                Urgency: string;
            };
            notification: {
                icon: string;
                badge: string;
            };
        };
    };
}

interface FCMResponse {
    success?: boolean;
    error?: {
        code: string;
        message: string;
        status: string;
    };
    name?: string;
}

// ============================================================================
// GOOGLE AUTH - Get OAuth2 token for FCM v1 API
// ============================================================================

async function getGoogleAccessToken(): Promise<string> {
    const serviceAccountB64 = Deno.env.get("GOOGLE_SERVICE_ACCOUNT");

    if (!serviceAccountB64) {
        throw new Error("GOOGLE_SERVICE_ACCOUNT environment variable not set");
    }

    // Decode base64 service account
    const serviceAccount = JSON.parse(atob(serviceAccountB64));

    // Create JWT header
    const header = {
        alg: "RS256",
        typ: "JWT",
    };

    // Create JWT claims
    const now = Math.floor(Date.now() / 1000);
    const claims = {
        iss: serviceAccount.client_email,
        scope: "https://www.googleapis.com/auth/firebase.messaging",
        aud: "https://oauth2.googleapis.com/token",
        iat: now,
        exp: now + 3600, // 1 hour
    };

    // Encode header and claims
    const encodedHeader = btoa(JSON.stringify(header))
        .replace(/\+/g, "-")
        .replace(/\//g, "_")
        .replace(/=/g, "");
    const encodedClaims = btoa(JSON.stringify(claims))
        .replace(/\+/g, "-")
        .replace(/\//g, "_")
        .replace(/=/g, "");

    // Create signature input
    const signInput = `${encodedHeader}.${encodedClaims}`;

    // Import private key
    const privateKeyPem = serviceAccount.private_key;
    const pemContents = privateKeyPem
        .replace("-----BEGIN PRIVATE KEY-----", "")
        .replace("-----END PRIVATE KEY-----", "")
        .replace(/\n/g, "");
    const binaryKey = Uint8Array.from(atob(pemContents), (c) => c.charCodeAt(0));

    const cryptoKey = await crypto.subtle.importKey(
        "pkcs8",
        binaryKey,
        {
            name: "RSASSA-PKCS1-v1_5",
            hash: "SHA-256",
        },
        false,
        ["sign"]
    );

    // Sign the JWT
    const signature = await crypto.subtle.sign(
        "RSASSA-PKCS1-v1_5",
        cryptoKey,
        new TextEncoder().encode(signInput)
    );

    const encodedSignature = btoa(String.fromCharCode(...new Uint8Array(signature)))
        .replace(/\+/g, "-")
        .replace(/\//g, "_")
        .replace(/=/g, "");

    const jwt = `${signInput}.${encodedSignature}`;

    // Exchange JWT for access token
    const tokenResponse = await fetch("https://oauth2.googleapis.com/token", {
        method: "POST",
        headers: {
            "Content-Type": "application/x-www-form-urlencoded",
        },
        body: `grant_type=urn:ietf:params:oauth:grant-type:jwt-bearer&assertion=${jwt}`,
    });

    const tokenData = await tokenResponse.json();

    if (!tokenData.access_token) {
        throw new Error(`Failed to get access token: ${JSON.stringify(tokenData)}`);
    }

    return tokenData.access_token;
}

// ============================================================================
// FCM SENDER - Send push notification via FCM v1 API
// ============================================================================

async function sendFCMNotification(
    token: string,
    title: string,
    body: string,
    data: Record<string, unknown>,
    platform: "ios" | "android" | "web"
): Promise<{ success: boolean; error?: string; shouldRemoveToken?: boolean }> {
    try {
        const projectId = Deno.env.get("FCM_PROJECT_ID");

        if (!projectId) {
            throw new Error("FCM_PROJECT_ID environment variable not set");
        }

        const accessToken = await getGoogleAccessToken();

        // Convert all data values to strings (FCM requirement)
        const stringData: Record<string, string> = {};
        for (const [key, value] of Object.entries(data)) {
            stringData[key] = typeof value === "string" ? value : JSON.stringify(value);
        }

        // Build platform-specific message
        const message: FCMMessage = {
            message: {
                token,
                notification: {
                    title,
                    body,
                },
                data: stringData,
            },
        };

        // Add platform-specific options
        if (platform === "android") {
            message.message.android = {
                priority: "high",
                notification: {
                    sound: "default",
                    click_action: "FLUTTER_NOTIFICATION_CLICK",
                    channel_id: "high_importance_channel",
                },
            };
        } else if (platform === "ios") {
            message.message.apns = {
                payload: {
                    aps: {
                        sound: "default",
                        "content-available": 1,
                    },
                },
            };
        } else if (platform === "web") {
            message.message.webpush = {
                headers: {
                    Urgency: "high",
                },
                notification: {
                    icon: "/icons/notification-icon.png",
                    badge: "/icons/badge-icon.png",
                },
            };
        }

        // Send to FCM
        const response = await fetch(
            `https://fcm.googleapis.com/v1/projects/${projectId}/messages:send`,
            {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${accessToken}`,
                },
                body: JSON.stringify(message),
            }
        );

        const result: FCMResponse = await response.json();

        if (!response.ok) {
            console.error("FCM Error:", result);

            // Check for invalid token errors
            const invalidTokenCodes = [
                "UNREGISTERED",
                "INVALID_ARGUMENT",
                "NOT_FOUND",
            ];

            const shouldRemove = result.error?.code
                ? invalidTokenCodes.some(code =>
                    result.error!.message?.includes(code) ||
                    result.error!.status === code
                )
                : false;

            return {
                success: false,
                error: result.error?.message || "Unknown FCM error",
                shouldRemoveToken: shouldRemove,
            };
        }

        console.log("FCM Success:", result.name);
        return { success: true };
    } catch (error) {
        console.error("FCM Send Error:", error);
        return {
            success: false,
            error: error instanceof Error ? error.message : "Unknown error",
        };
    }
}

// ============================================================================
// LEGACY FCM API (Alternative - uses server key)
// Reserved for fallback if FCM v1 API fails
// ============================================================================

// @ts-ignore: Reserved for future use
async function _sendFCMLegacy(
    tokens: string[],
    title: string,
    body: string,
    data: Record<string, unknown>
): Promise<{ success: boolean; results?: unknown[] }> {
    const serverKey = Deno.env.get("FCM_SERVER_KEY");

    if (!serverKey) {
        throw new Error("FCM_SERVER_KEY not set");
    }

    const response = await fetch("https://fcm.googleapis.com/fcm/send", {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            Authorization: `key=${serverKey}`,
        },
        body: JSON.stringify({
            registration_ids: tokens,
            notification: {
                title,
                body,
                sound: "default",
            },
            data,
            priority: "high",
        }),
    });

    return response.json();
}

// ============================================================================
// MAIN HANDLER
// ============================================================================

serve(async (req: Request): Promise<Response> => {
    // Handle CORS preflight
    if (req.method === "OPTIONS") {
        return new Response(null, {
            status: 204,
            headers: {
                "Access-Control-Allow-Origin": "*",
                "Access-Control-Allow-Methods": "POST, OPTIONS",
                "Access-Control-Allow-Headers": "Content-Type, Authorization",
            },
        });
    }

    // Only accept POST
    if (req.method !== "POST") {
        return new Response(
            JSON.stringify({ error: "Method not allowed" }),
            {
                status: 405,
                headers: { "Content-Type": "application/json" }
            }
        );
    }

    try {
        // Parse request body
        const payload: NotificationPayload = await req.json();

        console.log("Received notification request:", {
            notification_id: payload.notification_id,
            user_id: payload.user_id,
            type: payload.type,
        });

        // Validate payload
        if (!payload.user_id || !payload.notification_id) {
            return new Response(
                JSON.stringify({ error: "Missing required fields" }),
                {
                    status: 400,
                    headers: { "Content-Type": "application/json" }
                }
            );
        }

        // Initialize Supabase client with service role
        const supabaseUrl = Deno.env.get("SUPABASE_URL");
        const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

        if (!supabaseUrl || !supabaseKey) {
            throw new Error("Supabase credentials not configured");
        }

        const supabase = createClient(supabaseUrl, supabaseKey);

        // Check if user has push notifications enabled for this type
        const { data: preferences } = await supabase
            .from("notification_preferences")
            .select("push_enabled")
            .eq("user_id", payload.user_id)
            .eq("notification_type", payload.type)
            .single();

        // Default to enabled if no preference exists
        if (preferences && preferences.push_enabled === false) {
            console.log("User has disabled push for this notification type");
            return new Response(
                JSON.stringify({
                    success: true,
                    message: "Push disabled by user preference",
                    sent: 0
                }),
                {
                    status: 200,
                    headers: { "Content-Type": "application/json" }
                }
            );
        }

        // Fetch user's active device tokens
        const { data: devices, error: devicesError } = await supabase
            .from("user_devices")
            .select("id, device_token, platform, is_active")
            .eq("user_id", payload.user_id)
            .eq("is_active", true);

        if (devicesError) {
            console.error("Error fetching devices:", devicesError);
            throw devicesError;
        }

        if (!devices || devices.length === 0) {
            console.log("No active devices for user");
            return new Response(
                JSON.stringify({
                    success: true,
                    message: "No active devices",
                    sent: 0
                }),
                {
                    status: 200,
                    headers: { "Content-Type": "application/json" }
                }
            );
        }

        console.log(`Found ${devices.length} active devices`);

        // Send to each device
        const results = await Promise.all(
            (devices as DeviceToken[]).map(async (device) => {
                const result = await sendFCMNotification(
                    device.device_token,
                    payload.title,
                    payload.body,
                    {
                        ...payload.data,
                        notification_id: payload.notification_id,
                        type: payload.type,
                    },
                    device.platform
                );

                // Remove invalid tokens
                if (result.shouldRemoveToken) {
                    console.log(`Removing invalid token: ${device.device_token.substring(0, 20)}...`);
                    await supabase
                        .from("user_devices")
                        .delete()
                        .eq("id", device.id);
                }

                return {
                    device_id: device.id,
                    platform: device.platform,
                    ...result,
                };
            })
        );

        // Update notification as pushed
        await supabase
            .from("notifications")
            .update({
                is_pushed: true,
                push_sent_at: new Date().toISOString(),
            })
            .eq("id", payload.notification_id);

        const successCount = results.filter((r) => r.success).length;
        const failedCount = results.filter((r) => !r.success).length;

        console.log(`Push sent: ${successCount} success, ${failedCount} failed`);

        return new Response(
            JSON.stringify({
                success: true,
                sent: successCount,
                failed: failedCount,
                results,
            }),
            {
                status: 200,
                headers: { "Content-Type": "application/json" }
            }
        );
    } catch (error) {
        console.error("Push dispatcher error:", error);

        return new Response(
            JSON.stringify({
                success: false,
                error: error instanceof Error ? error.message : "Unknown error",
            }),
            {
                status: 500,
                headers: { "Content-Type": "application/json" }
            }
        );
    }
});

/**
 * ============================================================================
 * USAGE EXAMPLES
 * ============================================================================
 * 
 * 1. Call from SQL trigger (using pg_net):
 * 
 *    PERFORM net.http_post(
 *      url := 'https://your-project.supabase.co/functions/v1/push-dispatcher',
 *      headers := '{"Content-Type": "application/json", "Authorization": "Bearer YOUR_SERVICE_KEY"}',
 *      body := format('{"notification_id": "%s", "user_id": "%s", ...}', NEW.id, NEW.user_id)
 *    );
 * 
 * 2. Call from client/server:
 * 
 *    const response = await supabase.functions.invoke('push-dispatcher', {
 *      body: {
 *        notification_id: 'uuid',
 *        user_id: 'uuid',
 *        type: 'achievement',
 *        title: 'Achievement Unlocked!',
 *        body: 'You completed your first quiz!',
 *        data: { route: '/achievements', badge_id: '123' }
 *      }
 *    });
 * 
 * 3. Database Webhook (recommended):
 *    - Go to Supabase Dashboard > Database > Webhooks
 *    - Create webhook on notifications table INSERT
 *    - Set URL to: https://your-project.supabase.co/functions/v1/push-dispatcher
 *    - Add Authorization header with service key
 * 
 * ============================================================================
 */
