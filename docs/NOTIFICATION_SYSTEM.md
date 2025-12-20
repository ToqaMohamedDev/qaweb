# 🔔 Notification System Documentation

A comprehensive, production-ready notification system for Supabase with real-time updates and push notifications.

---

## 📋 Table of Contents

1. [Architecture Overview](#architecture-overview)
2. [Database Schema](#database-schema)
3. [Setup Instructions](#setup-instructions)
4. [Usage Guide](#usage-guide)
5. [Real-time Subscriptions](#real-time-subscriptions)
6. [Push Notifications](#push-notifications)
7. [Security](#security)
8. [API Reference](#api-reference)

---

## 🏗️ Architecture Overview

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                           NOTIFICATION SYSTEM FLOW                          │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  ┌──────────────┐    ┌─────────────────┐    ┌──────────────────────────┐   │
│  │   Backend    │───▶│  create_notify  │───▶│    notifications table   │   │
│  │   Service    │    │   (PL/pgSQL)    │    │    (with preferences)    │   │
│  └──────────────┘    └─────────────────┘    └────────────┬─────────────┘   │
│                                                          │                  │
│                              ┌───────────────────────────┼──────────────┐   │
│                              │                           │              │   │
│                              ▼                           ▼              │   │
│                     ┌────────────────┐          ┌────────────────┐      │   │
│                     │  DB Webhook /  │          │   Realtime     │      │   │
│                     │   pg_net       │          │   Channel      │      │   │
│                     └───────┬────────┘          └───────┬────────┘      │   │
│                             │                           │               │   │
│                             ▼                           ▼               │   │
│                     ┌────────────────┐          ┌────────────────┐      │   │
│                     │ push-dispatcher│          │  Client App    │      │   │
│                     │ Edge Function  │          │  (subscribe)   │      │   │
│                     └───────┬────────┘          └────────────────┘      │   │
│                             │                                           │   │
│                             ▼                                           │   │
│                     ┌────────────────┐                                  │   │
│                     │      FCM       │                                  │   │
│                     │   (Firebase)   │                                  │   │
│                     └───────┬────────┘                                  │   │
│                             │                                           │   │
│              ┌──────────────┼──────────────┐                            │   │
│              ▼              ▼              ▼                            │   │
│         ┌────────┐    ┌─────────┐    ┌─────────┐                        │   │
│         │  iOS   │    │ Android │    │   Web   │                        │   │
│         └────────┘    └─────────┘    └─────────┘                        │   │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

### Key Components

| Component | Description |
|-----------|-------------|
| **notifications** | Main table storing all notifications |
| **user_devices** | Stores FCM/APNs tokens for push |
| **notification_preferences** | User settings for each notification type |
| **create_notification()** | PL/pgSQL function respecting user preferences |
| **push-dispatcher** | Edge Function sending FCM push notifications |
| **NotificationClient** | TypeScript client for real-time subscriptions |

---

## 📊 Database Schema

### Tables

#### `notifications`
| Column | Type | Description |
|--------|------|-------------|
| id | UUID | Primary key |
| user_id | UUID | Reference to auth.users |
| type | notification_type | Category of notification |
| title | TEXT | Notification title |
| body | TEXT | Notification content |
| data | JSONB | Metadata (routes, action URLs, etc.) |
| is_read | BOOLEAN | Read status |
| is_pushed | BOOLEAN | Push sent status |
| push_sent_at | TIMESTAMPTZ | When push was sent |
| read_at | TIMESTAMPTZ | When marked as read |
| expires_at | TIMESTAMPTZ | Optional expiration |
| priority | INTEGER | 0-10 priority level |
| created_at | TIMESTAMPTZ | Creation timestamp |
| updated_at | TIMESTAMPTZ | Last update timestamp |

#### `user_devices`
| Column | Type | Description |
|--------|------|-------------|
| id | UUID | Primary key |
| user_id | UUID | Reference to auth.users |
| device_token | TEXT | FCM/APNs token |
| platform | device_platform | ios, android, web |
| device_name | TEXT | Human-readable device name |
| device_model | TEXT | Device model identifier |
| os_version | TEXT | Operating system version |
| app_version | TEXT | Your app version |
| is_active | BOOLEAN | Token validity status |
| last_used_at | TIMESTAMPTZ | Last activity |
| created_at | TIMESTAMPTZ | Registration time |

#### `notification_preferences`
| Column | Type | Description |
|--------|------|-------------|
| id | UUID | Primary key |
| user_id | UUID | Reference to auth.users |
| notification_type | notification_type | The notification category |
| email_enabled | BOOLEAN | Email notifications |
| push_enabled | BOOLEAN | Push notifications |
| in_app_enabled | BOOLEAN | In-app notifications |

### Notification Types

```sql
notification_type = (
  'system',        -- System announcements
  'achievement',   -- User achievements/badges
  'quiz_result',   -- Quiz completion results
  'new_content',   -- New courses/lessons
  'subscription',  -- Subscription updates
  'reminder',      -- Study reminders
  'social',        -- Social interactions
  'promotional',   -- Promotional content
  'security',      -- Security alerts
  'billing'        -- Billing notifications
)
```

---

## ⚙️ Setup Instructions

### 1. Run the Migration

```bash
# Apply the migration
supabase db push

# Or run locally
psql -h localhost -U postgres -d your_db -f supabase/migrations/20251220050210_notification_system.sql
```

### 2. Enable pg_net Extension (Optional, for triggers)

In Supabase Dashboard:
1. Go to **Database** → **Extensions**
2. Enable **pg_net**

### 3. Set Up Database Webhook (Recommended)

In Supabase Dashboard:
1. Go to **Database** → **Webhooks**
2. Create new webhook:
   - **Name**: `push-dispatcher`
   - **Table**: `notifications`
   - **Events**: `INSERT`
   - **URL**: `https://YOUR_PROJECT.supabase.co/functions/v1/push-dispatcher`
   - **Headers**:
     ```json
     {
       "Authorization": "Bearer YOUR_SERVICE_ROLE_KEY",
       "Content-Type": "application/json"
     }
     ```

### 4. Deploy Edge Function

```bash
# Deploy the push-dispatcher function
supabase functions deploy push-dispatcher

# Set environment variables
supabase secrets set FCM_PROJECT_ID=your-firebase-project-id
supabase secrets set GOOGLE_SERVICE_ACCOUNT=$(cat service-account.json | base64)
```

### 5. Configure Firebase

1. Create Firebase project at [console.firebase.google.com](https://console.firebase.google.com)
2. Enable Cloud Messaging
3. Generate service account key (Settings → Service accounts → Generate new private key)
4. Base64 encode the JSON and save as `GOOGLE_SERVICE_ACCOUNT` secret

---

## 📖 Usage Guide

### Creating Notifications (Backend)

```typescript
// Using Supabase client with service role
const { data, error } = await supabase.rpc('create_notification', {
  p_user_id: 'user-uuid',
  p_type: 'achievement',
  p_title: 'Achievement Unlocked! 🏆',
  p_body: 'You completed your first quiz!',
  p_data: { 
    route: '/achievements',
    badge_id: 'first-quiz',
    badge_name: 'Quiz Master'
  },
  p_priority: 5
});

if (data) {
  console.log('Notification created:', data);
} else if (data === null) {
  console.log('User has disabled this notification type');
}
```

### Creating Notifications (SQL)

```sql
-- From a trigger or stored procedure
SELECT create_notification(
  p_user_id := NEW.user_id,
  p_type := 'quiz_result',
  p_title := 'Quiz Completed!',
  p_body := format('You scored %s%% on %s', NEW.score, NEW.quiz_name),
  p_data := jsonb_build_object(
    'route', '/results/' || NEW.id,
    'quiz_id', NEW.quiz_id,
    'score', NEW.score
  )
);
```

### Fetching Notifications (Client)

```typescript
import NotificationClient from '@/lib/notifications';
import { createClient } from '@/lib/supabase/client';

const supabase = createClient();
const notifications = new NotificationClient(supabase);

// Get paginated notifications
const { notifications: items, total } = await notifications.getNotifications({
  page: 1,
  limit: 20,
  unreadOnly: false,
});

// Get unread count
const unreadCount = await notifications.getUnreadCount();
```

### Marking as Read

```typescript
// Single notification
await notifications.markAsRead('notification-uuid');

// Multiple notifications
await notifications.markMultipleAsRead(['uuid-1', 'uuid-2', 'uuid-3']);

// All notifications
await notifications.markAllAsRead();
```

---

## 📡 Real-time Subscriptions

### Using NotificationClient

```typescript
const client = new NotificationClient(supabase);

// Subscribe to real-time updates
await client.subscribe(
  // New notification callback
  (notification) => {
    console.log('New notification:', notification);
    // Show toast, update UI, play sound, etc.
    toast.success(notification.title, {
      description: notification.body
    });
  },
  // Notification update callback
  (notification) => {
    console.log('Notification updated:', notification);
    // Update local state
  }
);

// Later: unsubscribe
await client.unsubscribe();
```

### Using Supabase Directly

```typescript
const channel = supabase
  .channel('notifications')
  .on(
    'postgres_changes',
    {
      event: 'INSERT',
      schema: 'public',
      table: 'notifications',
      filter: `user_id=eq.${userId}`
    },
    (payload) => {
      console.log('New notification:', payload.new);
    }
  )
  .subscribe();

// Cleanup
supabase.removeChannel(channel);
```

### React Hook Example

```tsx
'use client';

import { useState, useEffect } from 'react';
import NotificationClient, { Notification } from '@/lib/notifications';
import { createClient } from '@/lib/supabase/client';

export function useNotifications() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const supabase = createClient();
    const client = new NotificationClient(supabase);

    // Fetch initial notifications
    const fetchData = async () => {
      const { notifications } = await client.getNotifications();
      const count = await client.getUnreadCount();
      setNotifications(notifications);
      setUnreadCount(count);
      setLoading(false);
    };

    fetchData();

    // Subscribe to real-time
    client.subscribe(
      (newNotification) => {
        setNotifications(prev => [newNotification, ...prev]);
        setUnreadCount(prev => prev + 1);
      },
      (updatedNotification) => {
        setNotifications(prev =>
          prev.map(n => n.id === updatedNotification.id ? updatedNotification : n)
        );
      }
    );

    return () => {
      client.unsubscribe();
    };
  }, []);

  return { notifications, unreadCount, loading };
}
```

---

## 📲 Push Notifications

### Device Registration

```typescript
// Register device token
await notifications.registerDevice({
  device_token: 'fcm-token-from-firebase',
  platform: 'web', // 'ios' | 'android' | 'web'
  device_name: 'Chrome on MacOS',
  app_version: '1.0.0'
});

// Unregister on logout
await notifications.unregisterDevice('fcm-token');
```

### Web Push Setup

```typescript
// Request permission and get token
import { getMessaging, getToken } from 'firebase/messaging';

async function setupWebPush() {
  const permission = await Notification.requestPermission();
  
  if (permission === 'granted') {
    const messaging = getMessaging();
    const token = await getToken(messaging, {
      vapidKey: 'YOUR_VAPID_KEY'
    });
    
    // Register with backend
    await notifications.registerDevice({
      device_token: token,
      platform: 'web',
      device_name: navigator.userAgent
    });
  }
}
```

### Push Notification Payload

The Edge Function sends this structure to FCM:

```json
{
  "message": {
    "token": "device-token",
    "notification": {
      "title": "Achievement Unlocked!",
      "body": "You completed your first quiz!"
    },
    "data": {
      "notification_id": "uuid",
      "type": "achievement",
      "route": "/achievements",
      "badge_id": "first-quiz"
    },
    "android": {
      "priority": "high",
      "notification": {
        "sound": "default",
        "channel_id": "high_importance_channel"
      }
    },
    "apns": {
      "payload": {
        "aps": {
          "sound": "default",
          "content-available": 1
        }
      }
    }
  }
}
```

---

## 🔒 Security

### Row Level Security (RLS)

All tables have strict RLS policies:

| Table | SELECT | INSERT | UPDATE | DELETE |
|-------|--------|--------|--------|--------|
| notifications | Own only | Via function | Own only | Own only |
| user_devices | Own only | Own only | Own only | Own only |
| notification_preferences | Own only | Own only | Own only | Own only |

### Security Functions

All database functions use `SECURITY DEFINER` to run with elevated privileges while maintaining user context through `auth.uid()`.

### Best Practices

1. **Never expose service role key** to client-side code
2. **Validate notification types** before creating
3. **Use Edge Function** for push instead of client-side FCM calls
4. **Clean up invalid tokens** automatically (handled by push-dispatcher)
5. **Set expiration dates** for time-sensitive notifications

---

## 📚 API Reference

### Database Functions

| Function | Parameters | Returns | Description |
|----------|------------|---------|-------------|
| `create_notification` | user_id, type, title, body, data, priority, expires_at | UUID | Creates notification respecting preferences |
| `mark_notification_read` | notification_id | BOOLEAN | Mark single as read |
| `mark_notifications_read_bulk` | notification_ids[], mark_all | INTEGER | Bulk mark as read |
| `get_unread_notification_count` | - | INTEGER | Get unread count |
| `register_device` | token, platform, name, model, os, app | UUID | Register device for push |
| `unregister_device` | token | BOOLEAN | Deactivate device |
| `update_notification_preferences` | type, email, push, in_app | UUID | Update preferences |
| `get_user_notification_preferences` | - | TABLE | Get all preferences |

### NotificationClient Methods

| Method | Description |
|--------|-------------|
| `subscribe(onNew, onUpdate)` | Subscribe to real-time notifications |
| `unsubscribe()` | Unsubscribe from real-time |
| `getNotifications(options)` | Fetch paginated notifications |
| `getUnreadCount()` | Get unread count |
| `markAsRead(id)` | Mark single as read |
| `markMultipleAsRead(ids)` | Mark multiple as read |
| `markAllAsRead()` | Mark all as read |
| `deleteNotification(id)` | Delete notification |
| `registerDevice(registration)` | Register for push |
| `unregisterDevice(token)` | Unregister device |
| `getPreferences()` | Get notification preferences |
| `updatePreference(type, options)` | Update preferences |

---

## 🧹 Maintenance

### Cleanup Old Notifications

```sql
-- Delete read notifications older than 30 days
SELECT delete_old_notifications(30);

-- Set up pg_cron for automatic cleanup
SELECT cron.schedule(
  'cleanup-old-notifications',
  '0 3 * * *', -- Daily at 3 AM
  $$SELECT delete_old_notifications(30)$$
);
```

### Monitor Invalid Tokens

The push-dispatcher automatically removes invalid tokens when FCM returns errors like:
- `UNREGISTERED`
- `INVALID_ARGUMENT`
- `NOT_FOUND`

---

## 🎨 UI Components

For notification UI components, check out these patterns:

```tsx
// Notification Bell with Badge
<button className="relative">
  <BellIcon />
  {unreadCount > 0 && (
    <span className="absolute -top-1 -right-1 bg-red-500 text-white 
                     text-xs rounded-full w-5 h-5 flex items-center justify-center">
      {unreadCount > 99 ? '99+' : unreadCount}
    </span>
  )}
</button>

// Notification Item
<div className={`p-4 border-b ${!notification.is_read ? 'bg-blue-50' : ''}`}>
  <div className="flex items-start gap-3">
    <span className="text-2xl">{getNotificationStyle(notification.type).icon}</span>
    <div className="flex-1">
      <h4 className="font-medium">{notification.title}</h4>
      <p className="text-gray-600 text-sm">{notification.body}</p>
      <span className="text-gray-400 text-xs">{formatNotificationTime(notification.created_at)}</span>
    </div>
  </div>
</div>
```

---

## 📝 License

MIT License - Feel free to use in your projects!
