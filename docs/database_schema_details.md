# 📚 Database Schema Documentation

> **🤖 Auto-generated Report**  
> **📅 Date**: 2026-01-04 02:35  
> **📊 Database**: PostgreSQL (Supabase)

---

## 📖 Table of Contents

1. [📊 Summary](#-summary)
2. [🔌 Extensions](#-extensions)
3. [📋 ENUM Types](#-enum-types)
4. [⚡ Functions](#-functions)
5. [🔗 Relationship Overview](#-relationship-overview)
6. [📂 Tables](#-tables)
   - [👤 User & Profile Management](#-user--profile-management)
   - [📚 Educational Content](#-educational-content)
   - [📝 Exams & Assessments](#-exams--assessments)
   - [💬 Communication & Support](#-communication--support)
   - [🔔 Notifications](#-notifications)
   - [📱 Device Tracking](#-device-tracking)
   - [⚙️ System Settings](#️-system-settings)

---

## 📊 Summary

| Metric | Count |
|--------|-------|
| **Total Tables** | 20 |
| **Total Functions** | 14 |
| **Total ENUMs** | 9 |
| **Total Extensions** | 6 |
| **Total Triggers** | 7 |
| **Total RLS Policies** | 61 |

### 🔗 Key Relationships

```
┌─────────────────────────────────────────────────────────────────────┐
│                        📊 RELATIONSHIP MAP                          │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│   ┌──────────────┐                                                  │
│   │   profiles   │ ◄──────────────────────────────────────────┐     │
│   │   (CENTER)   │                                            │     │
│   │  21 connections                                           │     │
│   └──────┬───────┘                                            │     │
│          │                                                    │     │
│    ┌─────┴─────┬─────────────┬─────────────┬─────────────┐   │     │
│    ▼           ▼             ▼             ▼             ▼   │     │
│ ┌──────┐  ┌────────┐   ┌──────────┐  ┌──────────┐  ┌────────┐│     │
│ │lessons│  │subjects│   │teacher   │  │teacher   │  │support ││     │
│ │  (6)  │  │  (4)   │   │_exams(4) │  │_ratings  │  │_chats  ││     │
│ └───┬───┘  └────┬───┘   └────┬─────┘  │  (2)     │  │  (3)   ││     │
│     │          │             │        └──────────┘  └────┬───┘│     │
│     ▼          │             ▼                           │    │     │
│ ┌────────────┐ │        ┌──────────────┐            ┌────▼───┐│     │
│ │lesson      │ │        │teacher_exam  │            │chat    ││     │
│ │_questions  │ │        │_attempts (2) │            │messages││     │
│ │   (2)      │ │        └──────────────┘            │  (2)   ││     │
│ └────────────┘ │                                    └────────┘│     │
│                ▼                                              │     │
│         ┌─────────────────┐                                   │     │
│         │educational      │                                   │     │
│         │_stages (4)      │                                   │     │
│         └─────────────────┘                                   │     │
│                                                               │     │
│   🔵 Isolated Tables: site_settings, visitor_devices          │     │
└─────────────────────────────────────────────────────────────────────┘
```

---

## 🔌 Extensions

| Extension | Version | Schema | Description |
|-----------|---------|--------|-------------|
| `pg_graphql` | 1.5.11 | graphql | GraphQL support |
| `pg_stat_statements` | 1.10 | extensions | Track execution statistics |
| `pgcrypto` | 1.3 | extensions | Cryptographic functions |
| `pgjwt` | 0.2.0 | extensions | JSON Web Token functions |
| `supabase_vault` | 0.2.8 | vault | Secure secrets storage |
| `uuid-ossp` | 1.1 | extensions | UUID generation |

---

## 📋 ENUM Types

| ENUM Name | Schema | Values | Count |
|-----------|--------|--------|-------|
| `chat_sender_type` | public | user, admin, ai | 3 |
| `chat_status` | public | open, closed, resolved, pending | 4 |
| `device_type` | public | desktop, mobile, tablet, unknown | 4 |
| `message_status` | public | pending, replied, archived | 3 |
| `notification_channel` | public | email, push, in_app, sms | 4 |
| `notification_status` | public | pending, sent, read, failed | 4 |
| `notification_type` | public | system, exam, lesson, subscription, message | 5 |
| `subscription_status` | public | active, cancelled, expired | 3 |
| `user_role` | public | student, teacher, admin, guest | 4 |

---

## ⚡ Functions

### 📊 Function List

| Function | Language | Security | Return Type | Description |
|----------|----------|----------|-------------|-------------|
| `get_user_role()` | SQL | DEFINER | user_role | Get current user's role |
| `get_user_role_safe()` | SQL | DEFINER | text | Safe version of get_user_role |
| `is_admin()` | SQL | DEFINER | boolean | Check if user is admin |
| `handle_new_user()` | PL/pgSQL | DEFINER | trigger | Handle new user registration |
| `prevent_role_change()` | PL/pgSQL | INVOKER | trigger | Prevent role changes |
| `increment_subscriber_count()` | PL/pgSQL | DEFINER | trigger | Increment teacher subscribers |
| `decrement_subscriber_count()` | PL/pgSQL | DEFINER | trigger | Decrement teacher subscribers |
| `increment_exam_count()` | PL/pgSQL | DEFINER | trigger | Increment exam count |
| `decrement_exam_count()` | PL/pgSQL | DEFINER | trigger | Decrement exam count |
| `increment_teacher_subscribers()` | PL/pgSQL | INVOKER | trigger | Legacy subscriber increment |
| `decrement_teacher_subscribers()` | PL/pgSQL | INVOKER | trigger | Legacy subscriber decrement |
| `get_unread_notification_count()` | SQL | INVOKER | integer | Count unread notifications |
| `upsert_user_device(...)` | PL/pgSQL | DEFINER | text | Upsert user device info |
| `upsert_visitor_device(...)` | PL/pgSQL | DEFINER | uuid | Upsert visitor device info |

### 🔐 Function Privileges

| Function | PUBLIC | anon | authenticated | postgres |
|----------|--------|------|---------------|----------|
| `get_user_role` | ✅ | ✅ | ✅ | ✅ |
| `is_admin` | ✅ | ❌ | ❌ | ✅ |
| `upsert_user_device` | ✅ | ❌ | ✅ | ✅ |
| `upsert_visitor_device` | ✅ | ✅ | ✅ | ✅ |
| `get_unread_notification_count` | ✅ | ❌ | ✅ | ✅ |

---

## 🔗 Relationship Overview

### 📊 Connection Summary

| Table | Outgoing FKs | Incoming FKs | Total | Status |
|-------|--------------|--------------|-------|--------|
| `profiles` | 1 | 20 | 21 | 🔵 Central Hub |
| `lessons` | 3 | 3 | 6 | 🟢 Connected |
| `comprehensive_exams` | 4 | 1 | 5 | 🟢 Connected |
| `educational_stages` | 0 | 4 | 4 | 🟢 Referenced |
| `subjects` | 1 | 3 | 4 | 🟢 Connected |
| `teacher_exams` | 3 | 1 | 4 | 🟢 Connected |
| `support_chats` | 2 | 1 | 3 | 🟢 Connected |
| `teacher_exam_attempts` | 2 | 0 | 2 | 🟡 Leaf |
| `comprehensive_exam_attempts` | 2 | 0 | 2 | 🟡 Leaf |
| `teacher_ratings` | 2 | 0 | 2 | 🟡 Leaf |
| `teacher_subscriptions` | 2 | 0 | 2 | 🟡 Leaf |
| `lesson_questions` | 2 | 0 | 2 | 🟡 Leaf |
| `chat_messages` | 2 | 0 | 2 | 🟡 Leaf |
| `messages` | 2 | 0 | 2 | 🟡 Leaf |
| `notifications` | 2 | 0 | 2 | 🟡 Leaf |
| `user_lesson_progress` | 2 | 0 | 2 | 🟡 Leaf |
| `notification_preferences` | 1 | 0 | 1 | 🟡 Leaf |
| `user_devices` | 1 | 0 | 1 | 🟡 Leaf |
| `site_settings` | 0 | 0 | 0 | 📦 Isolated |
| `visitor_devices` | 0 | 0 | 0 | 📦 Isolated |

---

## 📂 Tables

### 👤 User & Profile Management

---

#### 📋 Table: `profiles`

> 🔵 Central Hub | Outgoing FKs: 1 | Incoming FKs: 20 | Total: 21

##### 📊 Metadata

| Property | Value |
|----------|-------|
| **Owner** | postgres |
| **Total Size** | 128 kB |
| **Table Size** | 8192 bytes |
| **Index Size** | 112 kB |
| **Live Rows** | 5 |
| **Dead Rows** | 7 |
| **RLS Enabled** | ✅ |
| **Bloat %** | 58.33% |
| **Inserts** | 5 |
| **Updates** | 72 |
| **Deletes** | 0 |

##### 📝 Columns

| # | Column | Type | Nullable | Default | Description |
|---|--------|------|----------|---------|-------------|
| 1 | `id` | uuid | ❌ | - |  |
| 2 | `email` | text | ❌ | - |  |
| 3 | `name` | text | ✅ | - |  |
| 4 | `avatar_url` | text | ✅ | - |  |
| 5 | `role` | USER-DEFINED | ✅ | 'student'::user_role |  |
| 6 | `role_selected` | boolean | ✅ | false |  |
| 7 | `bio` | text | ✅ | - |  |
| 8 | `phone` | text | ✅ | - |  |
| 9 | `is_teacher_approved` | boolean | ✅ | false |  |
| 10 | `subscriber_count` | integer | ✅ | 0 |  |
| 11 | `rating_average` | numeric | ✅ | 0 |  |
| 12 | `rating_count` | integer | ✅ | 0 |  |
| 13 | `created_at` | timestamp with time zone | ✅ | now() |  |
| 14 | `updated_at` | timestamp with time zone | ✅ | now() |  |
| 15 | `is_verified` | boolean | ✅ | false | هل المعلم موثق |
| 16 | `cover_image_url` | text | ✅ | - | صورة الغلاف للمعلم |
| 17 | `specialization` | text | ✅ | - | تخصص المعلم |
| 18 | `teacher_title` | text | ✅ | - | اللقب المهني للمعلم |
| 19 | `years_of_experience` | integer | ✅ | 0 | سنوات الخبرة |
| 20 | `education` | text | ✅ | - | المؤهل العلمي |
| 21 | `website` | text | ✅ | - | الموقع الإلكتروني |
| 22 | `teaching_style` | text | ✅ | - | أسلوب التدريس |
| 23 | `subjects` | ARRAY | ✅ | '{}'::text[] | المواد التي يدرسها المعلم |
| 24 | `stages` | ARRAY | ✅ | '{}'::text[] | المراحل الدراسية |
| 25 | `is_teacher_profile_public` | boolean | ✅ | false | هل الملف الشخصي ظاهر للعامة |
| 26 | `social_links` | jsonb | ✅ | '{}'::jsonb | روابط التواصل الاجتماعي |
| 27 | `total_views` | integer | ✅ | 0 | إجمالي مشاهدات الملف الشخصي |
| 28 | `exam_count` | integer | ✅ | 0 |  |

##### 🔑 Constraints

| Name | Type | Columns |
|------|------|---------|
| `profiles_email_key` | UNIQUE | ['email'] |
| `profiles_pkey` | PRIMARY KEY | ['id'] |

##### 📥 Referenced By (Incoming FKs)

| From Table | FK Name | On Delete |
|------------|---------|------------|
| `chat_messages` | `chat_messages_sender_id_fkey` | SET NULL |
| `comprehensive_exam_attempts` | `comprehensive_exam_attempts_student_id_fkey` | CASCADE ⚠️ |
| `comprehensive_exams` | `comprehensive_exams_created_by_fkey` | SET NULL |
| `lesson_questions` | `lesson_questions_created_by_fkey` | SET NULL |
| `lessons` | `lessons_created_by_fkey` | SET NULL |
| `messages` | `messages_from_user_id_fkey` | SET NULL |
| `messages` | `messages_replied_by_fkey` | SET NULL |
| `notification_preferences` | `notification_preferences_user_id_fkey` | CASCADE ⚠️ |
| `notifications` | `notifications_created_by_fkey` | SET NULL |
| `notifications` | `notifications_user_id_fkey` | CASCADE ⚠️ |
| `support_chats` | `support_chats_assigned_to_fkey` | SET NULL |
| `support_chats` | `support_chats_user_id_fkey` | CASCADE ⚠️ |
| `teacher_exam_attempts` | `teacher_exam_attempts_student_id_fkey` | CASCADE ⚠️ |
| `teacher_exams` | `teacher_exams_created_by_fkey` | CASCADE ⚠️ |
| `teacher_ratings` | `teacher_ratings_teacher_id_fkey` | CASCADE ⚠️ |
| `teacher_ratings` | `teacher_ratings_user_id_fkey` | CASCADE ⚠️ |
| `teacher_subscriptions` | `teacher_subscriptions_teacher_id_fkey` | CASCADE ⚠️ |
| `teacher_subscriptions` | `teacher_subscriptions_user_id_fkey` | CASCADE ⚠️ |
| `user_devices` | `user_devices_user_id_fkey` | CASCADE ⚠️ |
| `user_lesson_progress` | `user_lesson_progress_user_id_fkey` | CASCADE ⚠️ |

<details><summary><strong>🔎 Indexes</strong></summary>

| Index Name | Method | Unique | Size | Scans |
|------------|--------|--------|------|-------|
| `idx_profiles_email` | btree | ❌ | 16 kB | 11 |
| `idx_profiles_is_teacher_approved` | btree | ❌ | 16 kB | 0 |
| `idx_profiles_is_teacher_profile_public` | btree | ❌ | 16 kB | 0 |
| `idx_profiles_is_verified` | btree | ❌ | 16 kB | 0 |
| `idx_profiles_role` | btree | ❌ | 16 kB | 118 |
| `profiles_email_key` | btree | ✅ | 16 kB | 0 |
| `profiles_pkey` | btree | ✅ | 16 kB | 1361 |

</details>

##### 🛡️ RLS Policies

| Policy Name | Command | Roles | Permissive |
|-------------|---------|-------|------------|
| `profiles_admin_all` | ALL | authenticated | ✅ |
| `profiles_admin_read_all` | SELECT | authenticated | ✅ |
| `profiles_admin_update` | UPDATE | authenticated | ✅ |
| `profiles_insert_own` | INSERT | public | ✅ |
| `profiles_read_all` | SELECT | public | ✅ |
| `profiles_update_own` | UPDATE | public | ✅ |

> **Security Status**: ✅ Security configured

[⬆️ Back to Top](#-table-of-contents)

---

#### 📋 Table: `teacher_subscriptions`

> 🟡 Leaf | Outgoing FKs: 2 | Incoming FKs: 0 | Total: 2

##### 📊 Metadata

| Property | Value |
|----------|-------|
| **Owner** | postgres |
| **Total Size** | 72 kB |
| **Table Size** | 8192 bytes |
| **Index Size** | 64 kB |
| **Live Rows** | 2 |
| **Dead Rows** | 17 |
| **RLS Enabled** | ✅ |
| **Bloat %** | 89.47% |
| **Inserts** | 19 |
| **Updates** | 0 |
| **Deletes** | 17 |

##### 📝 Columns

| # | Column | Type | Nullable | Default | Description |
|---|--------|------|----------|---------|-------------|
| 1 | `id` | uuid | ❌ | gen_random_uuid() |  |
| 2 | `user_id` | uuid | ❌ | - |  |
| 3 | `teacher_id` | uuid | ❌ | - |  |
| 4 | `created_at` | timestamp with time zone | ✅ | now() |  |

##### 🔑 Constraints

| Name | Type | Columns |
|------|------|---------|
| `teacher_subscriptions_pkey` | PRIMARY KEY | ['id'] |
| `teacher_subscriptions_user_id_teacher_id_key` | UNIQUE | ['user_id', 'teacher_id'] |

##### 🔗 Foreign Keys (Outgoing)

| FK Name | Source Column | → Target Table | On Delete |
|---------|---------------|----------------|------------|
| `teacher_subscriptions_teacher_id_fkey` | ['teacher_id'] | `profiles(['id'])` | CASCADE ⚠️ |
| `teacher_subscriptions_user_id_fkey` | ['user_id'] | `profiles(['id'])` | CASCADE ⚠️ |

<details><summary><strong>🔎 Indexes</strong></summary>

| Index Name | Method | Unique | Size | Scans |
|------------|--------|--------|------|-------|
| `idx_teacher_subscriptions_teacher` | btree | ❌ | 16 kB | 73 |
| `idx_teacher_subscriptions_user` | btree | ❌ | 16 kB | 194 |
| `teacher_subscriptions_pkey` | btree | ✅ | 16 kB | 13 |
| `teacher_subscriptions_user_id_teacher_id_key` | btree | ✅ | 16 kB | 88 |

</details>

##### 🛡️ RLS Policies

| Policy Name | Command | Roles | Permissive |
|-------------|---------|-------|------------|
| `subs_delete_own` | DELETE | public | ✅ |
| `subs_insert_own` | INSERT | public | ✅ |
| `subs_read_all` | SELECT | public | ✅ |

> **Security Status**: ✅ Security configured

[⬆️ Back to Top](#-table-of-contents)

---

#### 📋 Table: `teacher_ratings`

> 🟡 Leaf | Outgoing FKs: 2 | Incoming FKs: 0 | Total: 2

##### 📊 Metadata

| Property | Value |
|----------|-------|
| **Owner** | postgres |
| **Total Size** | 48 kB |
| **Table Size** | 8192 bytes |
| **Index Size** | 32 kB |
| **Live Rows** | 2 |
| **Dead Rows** | 5 |
| **RLS Enabled** | ✅ |
| **Bloat %** | 71.43% |
| **Inserts** | 2 |
| **Updates** | 5 |
| **Deletes** | 0 |

##### 📝 Columns

| # | Column | Type | Nullable | Default | Description |
|---|--------|------|----------|---------|-------------|
| 1 | `id` | uuid | ❌ | gen_random_uuid() |  |
| 2 | `user_id` | uuid | ❌ | - |  |
| 3 | `teacher_id` | uuid | ❌ | - |  |
| 4 | `rating` | integer | ❌ | - |  |
| 5 | `review` | text | ✅ | - |  |
| 6 | `created_at` | timestamp with time zone | ✅ | now() |  |
| 7 | `updated_at` | timestamp with time zone | ✅ | now() |  |

##### 🔑 Constraints

| Name | Type | Columns |
|------|------|---------|
| `teacher_ratings_pkey` | PRIMARY KEY | ['id'] |
| `teacher_ratings_user_id_teacher_id_key` | UNIQUE | ['user_id', 'teacher_id'] |

##### 🔗 Foreign Keys (Outgoing)

| FK Name | Source Column | → Target Table | On Delete |
|---------|---------------|----------------|------------|
| `teacher_ratings_teacher_id_fkey` | ['teacher_id'] | `profiles(['id'])` | CASCADE ⚠️ |
| `teacher_ratings_user_id_fkey` | ['user_id'] | `profiles(['id'])` | CASCADE ⚠️ |

<details><summary><strong>🔎 Indexes</strong></summary>

| Index Name | Method | Unique | Size | Scans |
|------------|--------|--------|------|-------|
| `teacher_ratings_pkey` | btree | ✅ | 16 kB | 10 |
| `teacher_ratings_user_id_teacher_id_key` | btree | ✅ | 16 kB | 41 |

</details>

##### 🛡️ RLS Policies

| Policy Name | Command | Roles | Permissive |
|-------------|---------|-------|------------|
| `teacher_ratings_delete_own` | DELETE | authenticated | ✅ |
| `teacher_ratings_insert_own` | INSERT | authenticated | ✅ |
| `teacher_ratings_select_all` | SELECT | public | ✅ |
| `teacher_ratings_update_own` | UPDATE | authenticated | ✅ |

> **Security Status**: ✅ Security configured

[⬆️ Back to Top](#-table-of-contents)

---

### 📚 Educational Content

---

#### 📋 Table: `educational_stages`

> 🟢 Referenced | Outgoing FKs: 0 | Incoming FKs: 4 | Total: 4

##### 📊 Metadata

| Property | Value |
|----------|-------|
| **Owner** | postgres |
| **Total Size** | 48 kB |
| **Table Size** | 8192 bytes |
| **Index Size** | 32 kB |
| **Live Rows** | 12 |
| **Dead Rows** | 0 |
| **RLS Enabled** | ✅ |
| **Bloat %** | N/A% |
| **Inserts** | 12 |
| **Updates** | 0 |
| **Deletes** | 0 |

##### 📝 Columns

| # | Column | Type | Nullable | Default | Description |
|---|--------|------|----------|---------|-------------|
| 1 | `id` | uuid | ❌ | gen_random_uuid() |  |
| 2 | `name` | text | ❌ | - |  |
| 3 | `slug` | text | ❌ | - |  |
| 4 | `description` | text | ✅ | - |  |
| 5 | `image_url` | text | ✅ | - |  |
| 6 | `order_index` | integer | ✅ | 0 |  |
| 7 | `is_active` | boolean | ✅ | true |  |
| 8 | `created_at` | timestamp with time zone | ✅ | now() |  |
| 9 | `updated_at` | timestamp with time zone | ✅ | now() |  |

##### 🔑 Constraints

| Name | Type | Columns |
|------|------|---------|
| `educational_stages_pkey` | PRIMARY KEY | ['id'] |
| `educational_stages_slug_key` | UNIQUE | ['slug'] |

##### 📥 Referenced By (Incoming FKs)

| From Table | FK Name | On Delete |
|------------|---------|------------|
| `comprehensive_exams` | `comprehensive_exams_stage_id_fkey` | SET NULL |
| `lessons` | `lessons_stage_id_fkey` | SET NULL |
| `subjects` | `subjects_stage_id_fkey` | SET NULL |
| `teacher_exams` | `teacher_exams_stage_id_fkey` | SET NULL |

<details><summary><strong>🔎 Indexes</strong></summary>

| Index Name | Method | Unique | Size | Scans |
|------------|--------|--------|------|-------|
| `educational_stages_pkey` | btree | ✅ | 16 kB | 460 |
| `educational_stages_slug_key` | btree | ✅ | 16 kB | 169 |

</details>

##### 🛡️ RLS Policies

| Policy Name | Command | Roles | Permissive |
|-------------|---------|-------|------------|
| `stages_admin_all` | ALL | public | ✅ |
| `stages_public_read` | SELECT | public | ✅ |

> **Security Status**: ✅ Security configured

[⬆️ Back to Top](#-table-of-contents)

---

#### 📋 Table: `subjects`

> 🟢 Connected | Outgoing FKs: 1 | Incoming FKs: 3 | Total: 4

##### 📊 Metadata

| Property | Value |
|----------|-------|
| **Owner** | postgres |
| **Total Size** | 64 kB |
| **Table Size** | 8192 bytes |
| **Index Size** | 48 kB |
| **Live Rows** | 27 |
| **Dead Rows** | 1 |
| **RLS Enabled** | ✅ |
| **Bloat %** | 3.57% |
| **Inserts** | 28 |
| **Updates** | 0 |
| **Deletes** | 1 |

##### 📝 Columns

| # | Column | Type | Nullable | Default | Description |
|---|--------|------|----------|---------|-------------|
| 1 | `id` | uuid | ❌ | gen_random_uuid() |  |
| 2 | `name` | text | ❌ | - |  |
| 3 | `slug` | text | ❌ | - |  |
| 4 | `description` | text | ✅ | - |  |
| 5 | `image_url` | text | ✅ | - |  |
| 6 | `icon` | text | ✅ | - |  |
| 7 | `color` | text | ✅ | - |  |
| 8 | `stage_id` | uuid | ✅ | - |  |
| 9 | `order_index` | integer | ✅ | 0 |  |
| 10 | `is_active` | boolean | ✅ | true |  |
| 11 | `created_at` | timestamp with time zone | ✅ | now() |  |
| 12 | `updated_at` | timestamp with time zone | ✅ | now() |  |

##### 🔑 Constraints

| Name | Type | Columns |
|------|------|---------|
| `subjects_pkey` | PRIMARY KEY | ['id'] |
| `subjects_slug_key` | UNIQUE | ['slug'] |

##### 🔗 Foreign Keys (Outgoing)

| FK Name | Source Column | → Target Table | On Delete |
|---------|---------------|----------------|------------|
| `subjects_stage_id_fkey` | ['stage_id'] | `educational_stages(['id'])` | SET NULL |

##### 📥 Referenced By (Incoming FKs)

| From Table | FK Name | On Delete |
|------------|---------|------------|
| `comprehensive_exams` | `comprehensive_exams_subject_id_fkey` | SET NULL |
| `lessons` | `lessons_subject_id_fkey` | CASCADE ⚠️ |
| `teacher_exams` | `teacher_exams_subject_id_fkey` | SET NULL |

<details><summary><strong>🔎 Indexes</strong></summary>

| Index Name | Method | Unique | Size | Scans |
|------------|--------|--------|------|-------|
| `idx_subjects_stage_id` | btree | ❌ | 16 kB | 0 |
| `subjects_pkey` | btree | ✅ | 16 kB | 137 |
| `subjects_slug_key` | btree | ✅ | 16 kB | 327 |

</details>

##### 🛡️ RLS Policies

| Policy Name | Command | Roles | Permissive |
|-------------|---------|-------|------------|
| `subjects_admin_all` | ALL | public | ✅ |
| `subjects_public_read` | SELECT | public | ✅ |

> **Security Status**: ✅ Security configured

[⬆️ Back to Top](#-table-of-contents)

---

#### 📋 Table: `lessons`

> 🟢 Connected | Outgoing FKs: 3 | Incoming FKs: 3 | Total: 6

##### 📊 Metadata

| Property | Value |
|----------|-------|
| **Owner** | postgres |
| **Total Size** | 112 kB |
| **Table Size** | 16 kB |
| **Index Size** | 64 kB |
| **Live Rows** | 84 |
| **Dead Rows** | 0 |
| **RLS Enabled** | ✅ |
| **Bloat %** | N/A% |
| **Inserts** | 84 |
| **Updates** | 0 |
| **Deletes** | 0 |

##### 📝 Columns

| # | Column | Type | Nullable | Default | Description |
|---|--------|------|----------|---------|-------------|
| 1 | `id` | uuid | ❌ | gen_random_uuid() |  |
| 2 | `title` | text | ❌ | - |  |
| 3 | `description` | text | ✅ | - |  |
| 4 | `content` | text | ✅ | - |  |
| 5 | `image_url` | text | ✅ | - |  |
| 6 | `subject_id` | uuid | ❌ | - |  |
| 7 | `stage_id` | uuid | ✅ | - |  |
| 8 | `created_by` | uuid | ✅ | - |  |
| 9 | `order_index` | integer | ✅ | 0 |  |
| 10 | `is_published` | boolean | ✅ | false |  |
| 11 | `is_free` | boolean | ✅ | false |  |
| 12 | `views_count` | integer | ✅ | 0 |  |
| 13 | `likes_count` | integer | ✅ | 0 |  |
| 14 | `created_at` | timestamp with time zone | ✅ | now() |  |
| 15 | `updated_at` | timestamp with time zone | ✅ | now() |  |

##### 🔑 Constraints

| Name | Type | Columns |
|------|------|---------|
| `lessons_pkey` | PRIMARY KEY | ['id'] |

##### 🔗 Foreign Keys (Outgoing)

| FK Name | Source Column | → Target Table | On Delete |
|---------|---------------|----------------|------------|
| `lessons_created_by_fkey` | ['created_by'] | `profiles(['id'])` | SET NULL |
| `lessons_stage_id_fkey` | ['stage_id'] | `educational_stages(['id'])` | SET NULL |
| `lessons_subject_id_fkey` | ['subject_id'] | `subjects(['id'])` | CASCADE ⚠️ |

##### 📥 Referenced By (Incoming FKs)

| From Table | FK Name | On Delete |
|------------|---------|------------|
| `comprehensive_exams` | `comprehensive_exams_lesson_id_fkey` | SET NULL |
| `lesson_questions` | `lesson_questions_lesson_id_fkey` | CASCADE ⚠️ |
| `user_lesson_progress` | `user_lesson_progress_lesson_id_fkey` | CASCADE ⚠️ |

<details><summary><strong>🔎 Indexes</strong></summary>

| Index Name | Method | Unique | Size | Scans |
|------------|--------|--------|------|-------|
| `idx_lessons_created_by` | btree | ❌ | 16 kB | 0 |
| `idx_lessons_stage_id` | btree | ❌ | 16 kB | 37 |
| `idx_lessons_subject_id` | btree | ❌ | 16 kB | 153 |
| `lessons_pkey` | btree | ✅ | 16 kB | 135 |

</details>

##### 🛡️ RLS Policies

| Policy Name | Command | Roles | Permissive |
|-------------|---------|-------|------------|
| `lessons_admin_manage` | ALL | public | ✅ |
| `lessons_read_published` | SELECT | public | ✅ |

> **Security Status**: ✅ Security configured

[⬆️ Back to Top](#-table-of-contents)

---

#### 📋 Table: `lesson_questions`

> 🟡 Leaf | Outgoing FKs: 2 | Incoming FKs: 0 | Total: 2

##### 📊 Metadata

| Property | Value |
|----------|-------|
| **Owner** | postgres |
| **Total Size** | 80 kB |
| **Table Size** | 16 kB |
| **Index Size** | 32 kB |
| **Live Rows** | 13 |
| **Dead Rows** | 14 |
| **RLS Enabled** | ✅ |
| **Bloat %** | 51.85% |
| **Inserts** | 27 |
| **Updates** | 0 |
| **Deletes** | 0 |

##### 📝 Columns

| # | Column | Type | Nullable | Default | Description |
|---|--------|------|----------|---------|-------------|
| 1 | `id` | uuid | ❌ | gen_random_uuid() |  |
| 2 | `lesson_id` | uuid | ❌ | - |  |
| 3 | `created_by` | uuid | ✅ | - |  |
| 4 | `text` | jsonb | ✅ | '{"ar": "", "en":... |  |
| 5 | `type` | text | ✅ | 'multiple_choice'... |  |
| 6 | `options` | jsonb | ✅ | '[]'::jsonb |  |
| 7 | `correct_option_id` | text | ✅ | - |  |
| 8 | `correct_answer` | jsonb | ✅ | - |  |
| 9 | `explanation` | jsonb | ✅ | - |  |
| 10 | `hint` | jsonb | ✅ | - |  |
| 11 | `media` | jsonb | ✅ | - |  |
| 12 | `difficulty` | text | ✅ | 'medium'::text |  |
| 13 | `points` | integer | ✅ | 1 |  |
| 14 | `order_index` | integer | ✅ | 0 |  |
| 15 | `is_active` | boolean | ✅ | true |  |
| 16 | `created_at` | timestamp with time zone | ✅ | now() |  |
| 17 | `updated_at` | timestamp with time zone | ✅ | now() |  |

##### 🔑 Constraints

| Name | Type | Columns |
|------|------|---------|
| `lesson_questions_pkey` | PRIMARY KEY | ['id'] |

##### 🔗 Foreign Keys (Outgoing)

| FK Name | Source Column | → Target Table | On Delete |
|---------|---------------|----------------|------------|
| `lesson_questions_created_by_fkey` | ['created_by'] | `profiles(['id'])` | SET NULL |
| `lesson_questions_lesson_id_fkey` | ['lesson_id'] | `lessons(['id'])` | CASCADE ⚠️ |

<details><summary><strong>🔎 Indexes</strong></summary>

| Index Name | Method | Unique | Size | Scans |
|------------|--------|--------|------|-------|
| `idx_lesson_questions_lesson_id` | btree | ❌ | 16 kB | 27 |
| `lesson_questions_pkey` | btree | ✅ | 16 kB | 5 |

</details>

##### 🛡️ RLS Policies

| Policy Name | Command | Roles | Permissive |
|-------------|---------|-------|------------|
| `questions_admin_manage` | ALL | public | ✅ |
| `questions_read_all` | SELECT | public | ✅ |

> **Security Status**: ✅ Security configured

[⬆️ Back to Top](#-table-of-contents)

---

#### 📋 Table: `user_lesson_progress`

> 🟡 Leaf | Outgoing FKs: 2 | Incoming FKs: 0 | Total: 2

##### 📊 Metadata

| Property | Value |
|----------|-------|
| **Owner** | postgres |
| **Total Size** | 16 kB |
| **Table Size** | 0 bytes |
| **Index Size** | 16 kB |
| **Live Rows** | 0 |
| **Dead Rows** | 0 |
| **RLS Enabled** | ✅ |
| **Bloat %** | N/A% |
| **Inserts** | 0 |
| **Updates** | 0 |
| **Deletes** | 0 |

##### 📝 Columns

| # | Column | Type | Nullable | Default | Description |
|---|--------|------|----------|---------|-------------|
| 1 | `id` | uuid | ❌ | gen_random_uuid() |  |
| 2 | `user_id` | uuid | ❌ | - |  |
| 3 | `lesson_id` | uuid | ❌ | - |  |
| 4 | `progress_percentage` | integer | ✅ | 0 |  |
| 5 | `is_completed` | boolean | ✅ | false |  |
| 6 | `last_position` | integer | ✅ | 0 |  |
| 7 | `created_at` | timestamp with time zone | ✅ | now() |  |
| 8 | `updated_at` | timestamp with time zone | ✅ | now() |  |

##### 🔑 Constraints

| Name | Type | Columns |
|------|------|---------|
| `user_lesson_progress_pkey` | PRIMARY KEY | ['id'] |
| `user_lesson_progress_user_id_lesson_id_key` | UNIQUE | ['user_id', 'lesson_id'] |

##### 🔗 Foreign Keys (Outgoing)

| FK Name | Source Column | → Target Table | On Delete |
|---------|---------------|----------------|------------|
| `user_lesson_progress_lesson_id_fkey` | ['lesson_id'] | `lessons(['id'])` | CASCADE ⚠️ |
| `user_lesson_progress_user_id_fkey` | ['user_id'] | `profiles(['id'])` | CASCADE ⚠️ |

<details><summary><strong>🔎 Indexes</strong></summary>

| Index Name | Method | Unique | Size | Scans |
|------------|--------|--------|------|-------|
| `user_lesson_progress_pkey` | btree | ✅ | 8192 bytes | 2 |
| `user_lesson_progress_user_id_lesson_id_key` | btree | ✅ | 8192 bytes | 0 |

</details>

##### 🛡️ RLS Policies

| Policy Name | Command | Roles | Permissive |
|-------------|---------|-------|------------|
| `progress_user_all` | ALL | public | ✅ |

> **Security Status**: ✅ Security configured

[⬆️ Back to Top](#-table-of-contents)

---

### 📝 Exams & Assessments

---

#### 📋 Table: `comprehensive_exams`

> 🟢 Connected | Outgoing FKs: 4 | Incoming FKs: 1 | Total: 5

##### 📊 Metadata

| Property | Value |
|----------|-------|
| **Owner** | postgres |
| **Total Size** | 96 kB |
| **Table Size** | 8192 bytes |
| **Index Size** | 64 kB |
| **Live Rows** | 0 |
| **Dead Rows** | 5 |
| **RLS Enabled** | ✅ |
| **Bloat %** | 100.0% |
| **Inserts** | 4 |
| **Updates** | 4 |
| **Deletes** | 4 |

##### 📝 Columns

| # | Column | Type | Nullable | Default | Description |
|---|--------|------|----------|---------|-------------|
| 1 | `id` | uuid | ❌ | gen_random_uuid() |  |
| 2 | `exam_title` | text | ❌ | - |  |
| 3 | `exam_description` | text | ✅ | - |  |
| 4 | `stage_id` | uuid | ✅ | - |  |
| 5 | `stage_name` | text | ✅ | - |  |
| 6 | `subject_id` | uuid | ✅ | - |  |
| 7 | `subject_name` | text | ✅ | - |  |
| 8 | `lesson_id` | uuid | ✅ | - |  |
| 9 | `created_by` | uuid | ✅ | - |  |
| 10 | `type` | text | ❌ | - |  |
| 11 | `language` | text | ❌ | 'ar'::text |  |
| 12 | `blocks` | jsonb | ✅ | '[]'::jsonb |  |
| 13 | `sections` | jsonb | ✅ | '[]'::jsonb |  |
| 14 | `branch_tags` | ARRAY | ✅ | - |  |
| 15 | `total_marks` | integer | ✅ | - |  |
| 16 | `passing_score` | integer | ✅ | - |  |
| 17 | `duration_minutes` | integer | ✅ | - |  |
| 18 | `grading_mode` | text | ✅ | 'automatic'::text |  |
| 19 | `usage_scope` | text | ✅ | 'public'::text |  |
| 20 | `is_published` | boolean | ✅ | false |  |
| 21 | `created_at` | timestamp with time zone | ✅ | now() |  |
| 22 | `updated_at` | timestamp with time zone | ✅ | now() |  |

##### 🔑 Constraints

| Name | Type | Columns |
|------|------|---------|
| `comprehensive_exams_pkey` | PRIMARY KEY | ['id'] |

##### 🔗 Foreign Keys (Outgoing)

| FK Name | Source Column | → Target Table | On Delete |
|---------|---------------|----------------|------------|
| `comprehensive_exams_created_by_fkey` | ['created_by'] | `profiles(['id'])` | SET NULL |
| `comprehensive_exams_lesson_id_fkey` | ['lesson_id'] | `lessons(['id'])` | SET NULL |
| `comprehensive_exams_stage_id_fkey` | ['stage_id'] | `educational_stages(['id'])` | SET NULL |
| `comprehensive_exams_subject_id_fkey` | ['subject_id'] | `subjects(['id'])` | SET NULL |

##### 📥 Referenced By (Incoming FKs)

| From Table | FK Name | On Delete |
|------------|---------|------------|
| `comprehensive_exam_attempts` | `comprehensive_exam_attempts_exam_id_fkey` | CASCADE ⚠️ |

<details><summary><strong>🔎 Indexes</strong></summary>

| Index Name | Method | Unique | Size | Scans |
|------------|--------|--------|------|-------|
| `comprehensive_exams_pkey` | btree | ✅ | 16 kB | 85 |
| `idx_comprehensive_exams_created_by` | btree | ❌ | 16 kB | 393 |
| `idx_comprehensive_exams_stage` | btree | ❌ | 16 kB | 97 |
| `idx_comprehensive_exams_subject` | btree | ❌ | 16 kB | 3 |

</details>

##### 🛡️ RLS Policies

| Policy Name | Command | Roles | Permissive |
|-------------|---------|-------|------------|
| `Authenticated can view exams` | SELECT | authenticated | ✅ |
| `Public can view published exams` | SELECT | anon | ✅ |
| `Teachers can delete their own exams` | DELETE | authenticated | ✅ |
| `Teachers can insert their own exams` | INSERT | authenticated | ✅ |
| `Teachers can update their own exams` | UPDATE | authenticated | ✅ |
| `comp_exams_admin_all` | ALL | public | ✅ |
| `comp_exams_public_read` | SELECT | public | ✅ |
| `exams_admin_all` | ALL | public | ✅ |
| `exams_public_read` | SELECT | public | ✅ |

> **Security Status**: ✅ Security configured

[⬆️ Back to Top](#-table-of-contents)

---

#### 📋 Table: `comprehensive_exam_attempts`

> 🟡 Leaf | Outgoing FKs: 2 | Incoming FKs: 0 | Total: 2

##### 📊 Metadata

| Property | Value |
|----------|-------|
| **Owner** | postgres |
| **Total Size** | 32 kB |
| **Table Size** | 0 bytes |
| **Index Size** | 24 kB |
| **Live Rows** | 0 |
| **Dead Rows** | 0 |
| **RLS Enabled** | ✅ |
| **Bloat %** | N/A% |
| **Inserts** | 0 |
| **Updates** | 0 |
| **Deletes** | 0 |

##### 📝 Columns

| # | Column | Type | Nullable | Default | Description |
|---|--------|------|----------|---------|-------------|
| 1 | `id` | uuid | ❌ | gen_random_uuid() |  |
| 2 | `exam_id` | uuid | ❌ | - |  |
| 3 | `student_id` | uuid | ❌ | - |  |
| 4 | `answers` | jsonb | ✅ | '{}'::jsonb |  |
| 5 | `status` | text | ✅ | 'in_progress'::text |  |
| 6 | `total_score` | integer | ✅ | - |  |
| 7 | `max_score` | integer | ✅ | - |  |
| 8 | `started_at` | timestamp with time zone | ✅ | now() |  |
| 9 | `completed_at` | timestamp with time zone | ✅ | - |  |
| 10 | `created_at` | timestamp with time zone | ✅ | now() |  |
| 11 | `updated_at` | timestamp with time zone | ✅ | now() |  |

##### 🔑 Constraints

| Name | Type | Columns |
|------|------|---------|
| `comprehensive_exam_attempts_pkey` | PRIMARY KEY | ['id'] |

##### 🔗 Foreign Keys (Outgoing)

| FK Name | Source Column | → Target Table | On Delete |
|---------|---------------|----------------|------------|
| `comprehensive_exam_attempts_exam_id_fkey` | ['exam_id'] | `comprehensive_exams(['id'])` | CASCADE ⚠️ |
| `comprehensive_exam_attempts_student_id_fkey` | ['student_id'] | `profiles(['id'])` | CASCADE ⚠️ |

<details><summary><strong>🔎 Indexes</strong></summary>

| Index Name | Method | Unique | Size | Scans |
|------------|--------|--------|------|-------|
| `comprehensive_exam_attempts_pkey` | btree | ✅ | 8192 bytes | 5 |
| `idx_comprehensive_exam_attempts_exam` | btree | ❌ | 8192 bytes | 4 |
| `idx_comprehensive_exam_attempts_student` | btree | ❌ | 8192 bytes | 0 |

</details>

##### 🛡️ RLS Policies

| Policy Name | Command | Roles | Permissive |
|-------------|---------|-------|------------|
| `Teachers and admins can delete attempts` | DELETE | authenticated | ✅ |
| `Users can insert their own attempts` | INSERT | authenticated | ✅ |
| `Users can update their own attempts` | UPDATE | authenticated | ✅ |
| `Users can view their own attempts` | SELECT | authenticated | ✅ |
| `comp_attempts_admin_read` | SELECT | public | ✅ |
| `comp_attempts_user_all` | ALL | public | ✅ |

> **Security Status**: ✅ Security configured

[⬆️ Back to Top](#-table-of-contents)

---

#### 📋 Table: `teacher_exams`

> 🟢 Connected | Outgoing FKs: 3 | Incoming FKs: 1 | Total: 4

##### 📊 Metadata

| Property | Value |
|----------|-------|
| **Owner** | postgres |
| **Total Size** | 56 kB |
| **Table Size** | 8192 bytes |
| **Index Size** | 40 kB |
| **Live Rows** | 1 |
| **Dead Rows** | 2 |
| **RLS Enabled** | ✅ |
| **Bloat %** | 66.67% |
| **Inserts** | 3 |
| **Updates** | 4 |
| **Deletes** | 2 |

##### 📝 Columns

| # | Column | Type | Nullable | Default | Description |
|---|--------|------|----------|---------|-------------|
| 1 | `id` | uuid | ❌ | gen_random_uuid() |  |
| 2 | `exam_title` | text | ❌ | - |  |
| 3 | `exam_description` | text | ✅ | - |  |
| 4 | `stage_id` | uuid | ✅ | - |  |
| 5 | `stage_name` | text | ✅ | - |  |
| 6 | `subject_id` | uuid | ✅ | - |  |
| 7 | `subject_name` | text | ✅ | - |  |
| 8 | `created_by` | uuid | ❌ | - |  |
| 9 | `type` | text | ❌ | 'quiz'::text |  |
| 10 | `language` | text | ❌ | 'ar'::text |  |
| 11 | `blocks` | jsonb | ✅ | '[]'::jsonb |  |
| 12 | `sections` | jsonb | ✅ | '[]'::jsonb |  |
| 13 | `total_marks` | integer | ✅ | - |  |
| 14 | `passing_score` | integer | ✅ | - |  |
| 15 | `duration_minutes` | integer | ✅ | - |  |
| 16 | `is_published` | boolean | ✅ | false |  |
| 17 | `created_at` | timestamp with time zone | ✅ | now() |  |
| 18 | `updated_at` | timestamp with time zone | ✅ | now() |  |
| 19 | `is_time_limited` | boolean | ✅ | false | هل الامتحان محدد بوقت للتوفر؟ |
| 20 | `available_from` | timestamp with time zone | ✅ | - | تاريخ ووقت بداية توفر الامتحان |
| 21 | `available_until` | timestamp with time zone | ✅ | - | تاريخ ووقت نهاية توفر الامتحان |

##### 🔑 Constraints

| Name | Type | Columns |
|------|------|---------|
| `teacher_exams_pkey` | PRIMARY KEY | ['id'] |

##### 🔗 Foreign Keys (Outgoing)

| FK Name | Source Column | → Target Table | On Delete |
|---------|---------------|----------------|------------|
| `teacher_exams_created_by_fkey` | ['created_by'] | `profiles(['id'])` | CASCADE ⚠️ |
| `teacher_exams_stage_id_fkey` | ['stage_id'] | `educational_stages(['id'])` | SET NULL |
| `teacher_exams_subject_id_fkey` | ['subject_id'] | `subjects(['id'])` | SET NULL |

##### 📥 Referenced By (Incoming FKs)

| From Table | FK Name | On Delete |
|------------|---------|------------|
| `teacher_exam_attempts` | `teacher_exam_attempts_exam_id_fkey` | CASCADE ⚠️ |

<details><summary><strong>🔎 Indexes</strong></summary>

| Index Name | Method | Unique | Size | Scans |
|------------|--------|--------|------|-------|
| `idx_teacher_exams_availability` | btree | ❌ | 8192 bytes | 0 |
| `idx_teacher_exams_created_by` | btree | ❌ | 16 kB | 118 |
| `teacher_exams_pkey` | btree | ✅ | 16 kB | 51 |

</details>

##### 🛡️ RLS Policies

| Policy Name | Command | Roles | Permissive |
|-------------|---------|-------|------------|
| `Allow public to view published exams` | SELECT | anon, authenticated | ✅ |
| `Teachers manage own exams` | ALL | authenticated | ✅ |
| `Teachers view own exams` | SELECT | authenticated | ✅ |

> **Security Status**: ✅ Security configured

[⬆️ Back to Top](#-table-of-contents)

---

#### 📋 Table: `teacher_exam_attempts`

> 🟡 Leaf | Outgoing FKs: 2 | Incoming FKs: 0 | Total: 2

##### 📊 Metadata

| Property | Value |
|----------|-------|
| **Owner** | postgres |
| **Total Size** | 64 kB |
| **Table Size** | 8192 bytes |
| **Index Size** | 48 kB |
| **Live Rows** | 2 |
| **Dead Rows** | 11 |
| **RLS Enabled** | ✅ |
| **Bloat %** | 84.62% |
| **Inserts** | 6 |
| **Updates** | 7 |
| **Deletes** | 4 |

##### 📝 Columns

| # | Column | Type | Nullable | Default | Description |
|---|--------|------|----------|---------|-------------|
| 1 | `id` | uuid | ❌ | gen_random_uuid() |  |
| 2 | `exam_id` | uuid | ❌ | - |  |
| 3 | `student_id` | uuid | ❌ | - |  |
| 4 | `answers` | jsonb | ✅ | '{}'::jsonb |  |
| 5 | `status` | text | ✅ | 'in_progress'::text |  |
| 6 | `total_score` | integer | ✅ | - |  |
| 7 | `max_score` | integer | ✅ | - |  |
| 8 | `started_at` | timestamp with time zone | ✅ | now() |  |
| 9 | `completed_at` | timestamp with time zone | ✅ | - |  |
| 10 | `created_at` | timestamp with time zone | ✅ | now() |  |
| 11 | `updated_at` | timestamp with time zone | ✅ | now() |  |

##### 🔑 Constraints

| Name | Type | Columns |
|------|------|---------|
| `teacher_exam_attempts_pkey` | PRIMARY KEY | ['id'] |

##### 🔗 Foreign Keys (Outgoing)

| FK Name | Source Column | → Target Table | On Delete |
|---------|---------------|----------------|------------|
| `teacher_exam_attempts_exam_id_fkey` | ['exam_id'] | `teacher_exams(['id'])` | CASCADE ⚠️ |
| `teacher_exam_attempts_student_id_fkey` | ['student_id'] | `profiles(['id'])` | CASCADE ⚠️ |

<details><summary><strong>🔎 Indexes</strong></summary>

| Index Name | Method | Unique | Size | Scans |
|------------|--------|--------|------|-------|
| `idx_teacher_exam_attempts_exam` | btree | ❌ | 16 kB | 22 |
| `idx_teacher_exam_attempts_student` | btree | ❌ | 16 kB | 26 |
| `teacher_exam_attempts_pkey` | btree | ✅ | 16 kB | 30 |

</details>

##### 🛡️ RLS Policies

| Policy Name | Command | Roles | Permissive |
|-------------|---------|-------|------------|
| `Teachers can view attempts on own exams` | SELECT | authenticated | ✅ |
| `Users can insert own attempts` | INSERT | authenticated | ✅ |
| `Users can update own attempts` | UPDATE | authenticated | ✅ |
| `Users can view own attempts` | SELECT | authenticated | ✅ |
| `teacher_attempts_admin_read` | SELECT | public | ✅ |
| `teacher_attempts_owner_read` | SELECT | public | ✅ |
| `teacher_attempts_user_all` | ALL | public | ✅ |

> **Security Status**: ✅ Security configured

[⬆️ Back to Top](#-table-of-contents)

---

### 💬 Communication & Support

---

#### 📋 Table: `support_chats`

> 🟢 Connected | Outgoing FKs: 2 | Incoming FKs: 1 | Total: 3

##### 📊 Metadata

| Property | Value |
|----------|-------|
| **Owner** | postgres |
| **Total Size** | 16 kB |
| **Table Size** | 0 bytes |
| **Index Size** | 8192 bytes |
| **Live Rows** | 0 |
| **Dead Rows** | 0 |
| **RLS Enabled** | ✅ |
| **Bloat %** | N/A% |
| **Inserts** | 0 |
| **Updates** | 0 |
| **Deletes** | 0 |

##### 📝 Columns

| # | Column | Type | Nullable | Default | Description |
|---|--------|------|----------|---------|-------------|
| 1 | `id` | uuid | ❌ | gen_random_uuid() |  |
| 2 | `user_id` | uuid | ✅ | - |  |
| 3 | `status` | text | ✅ | 'open'::text |  |
| 4 | `subject` | text | ✅ | - |  |
| 5 | `assigned_to` | uuid | ✅ | - |  |
| 6 | `created_at` | timestamp with time zone | ✅ | now() |  |
| 7 | `updated_at` | timestamp with time zone | ✅ | now() |  |

##### 🔑 Constraints

| Name | Type | Columns |
|------|------|---------|
| `support_chats_pkey` | PRIMARY KEY | ['id'] |

##### 🔗 Foreign Keys (Outgoing)

| FK Name | Source Column | → Target Table | On Delete |
|---------|---------------|----------------|------------|
| `support_chats_assigned_to_fkey` | ['assigned_to'] | `profiles(['id'])` | SET NULL |
| `support_chats_user_id_fkey` | ['user_id'] | `profiles(['id'])` | CASCADE ⚠️ |

##### 📥 Referenced By (Incoming FKs)

| From Table | FK Name | On Delete |
|------------|---------|------------|
| `chat_messages` | `chat_messages_chat_id_fkey` | CASCADE ⚠️ |

<details><summary><strong>🔎 Indexes</strong></summary>

| Index Name | Method | Unique | Size | Scans |
|------------|--------|--------|------|-------|
| `support_chats_pkey` | btree | ✅ | 8192 bytes | 4 |

</details>

##### 🛡️ RLS Policies

| Policy Name | Command | Roles | Permissive |
|-------------|---------|-------|------------|
| `support_chats_admin_all` | ALL | public | ✅ |
| `support_chats_user_create` | INSERT | public | ✅ |
| `support_chats_user_own` | ALL | public | ✅ |
| `support_chats_user_read` | SELECT | public | ✅ |

> **Security Status**: ✅ Security configured

[⬆️ Back to Top](#-table-of-contents)

---

#### 📋 Table: `chat_messages`

> 🟡 Leaf | Outgoing FKs: 2 | Incoming FKs: 0 | Total: 2

##### 📊 Metadata

| Property | Value |
|----------|-------|
| **Owner** | postgres |
| **Total Size** | 16 kB |
| **Table Size** | 0 bytes |
| **Index Size** | 8192 bytes |
| **Live Rows** | 0 |
| **Dead Rows** | 0 |
| **RLS Enabled** | ✅ |
| **Bloat %** | N/A% |
| **Inserts** | 0 |
| **Updates** | 0 |
| **Deletes** | 0 |

##### 📝 Columns

| # | Column | Type | Nullable | Default | Description |
|---|--------|------|----------|---------|-------------|
| 1 | `id` | uuid | ❌ | gen_random_uuid() |  |
| 2 | `chat_id` | uuid | ❌ | - |  |
| 3 | `sender_id` | uuid | ✅ | - |  |
| 4 | `sender_type` | USER-DEFINED | ❌ | - |  |
| 5 | `message` | text | ❌ | - |  |
| 6 | `is_ai_response` | boolean | ✅ | false |  |
| 7 | `created_at` | timestamp with time zone | ✅ | now() |  |

##### 🔑 Constraints

| Name | Type | Columns |
|------|------|---------|
| `chat_messages_pkey` | PRIMARY KEY | ['id'] |

##### 🔗 Foreign Keys (Outgoing)

| FK Name | Source Column | → Target Table | On Delete |
|---------|---------------|----------------|------------|
| `chat_messages_chat_id_fkey` | ['chat_id'] | `support_chats(['id'])` | CASCADE ⚠️ |
| `chat_messages_sender_id_fkey` | ['sender_id'] | `profiles(['id'])` | SET NULL |

<details><summary><strong>🔎 Indexes</strong></summary>

| Index Name | Method | Unique | Size | Scans |
|------------|--------|--------|------|-------|
| `chat_messages_pkey` | btree | ✅ | 8192 bytes | 5 |

</details>

##### 🛡️ RLS Policies

| Policy Name | Command | Roles | Permissive |
|-------------|---------|-------|------------|
| `chat_messages_admin_all` | ALL | public | ✅ |
| `chat_messages_create` | INSERT | public | ✅ |
| `chat_messages_read` | SELECT | public | ✅ |
| `chat_messages_user_own` | ALL | public | ✅ |

> **Security Status**: ✅ Security configured

[⬆️ Back to Top](#-table-of-contents)

---

#### 📋 Table: `messages`

> 🟡 Leaf | Outgoing FKs: 2 | Incoming FKs: 0 | Total: 2

##### 📊 Metadata

| Property | Value |
|----------|-------|
| **Owner** | postgres |
| **Total Size** | 16 kB |
| **Table Size** | 0 bytes |
| **Index Size** | 8192 bytes |
| **Live Rows** | 0 |
| **Dead Rows** | 0 |
| **RLS Enabled** | ✅ |
| **Bloat %** | N/A% |
| **Inserts** | 0 |
| **Updates** | 0 |
| **Deletes** | 0 |

##### 📝 Columns

| # | Column | Type | Nullable | Default | Description |
|---|--------|------|----------|---------|-------------|
| 1 | `id` | uuid | ❌ | gen_random_uuid() |  |
| 2 | `from_user_id` | uuid | ✅ | - |  |
| 3 | `from_name` | text | ❌ | - |  |
| 4 | `from_email` | text | ❌ | - |  |
| 5 | `subject` | text | ❌ | - |  |
| 6 | `message` | text | ❌ | - |  |
| 7 | `is_read` | boolean | ✅ | false |  |
| 8 | `is_replied` | boolean | ✅ | false |  |
| 9 | `is_starred` | boolean | ✅ | false |  |
| 10 | `is_archived` | boolean | ✅ | false |  |
| 11 | `replied_by` | uuid | ✅ | - |  |
| 12 | `replied_at` | timestamp with time zone | ✅ | - |  |
| 13 | `reply_text` | text | ✅ | - |  |
| 14 | `created_at` | timestamp with time zone | ✅ | now() |  |

##### 🔑 Constraints

| Name | Type | Columns |
|------|------|---------|
| `messages_pkey` | PRIMARY KEY | ['id'] |

##### 🔗 Foreign Keys (Outgoing)

| FK Name | Source Column | → Target Table | On Delete |
|---------|---------------|----------------|------------|
| `messages_from_user_id_fkey` | ['from_user_id'] | `profiles(['id'])` | SET NULL |
| `messages_replied_by_fkey` | ['replied_by'] | `profiles(['id'])` | SET NULL |

<details><summary><strong>🔎 Indexes</strong></summary>

| Index Name | Method | Unique | Size | Scans |
|------------|--------|--------|------|-------|
| `messages_pkey` | btree | ✅ | 8192 bytes | 2 |

</details>

##### 🛡️ RLS Policies

| Policy Name | Command | Roles | Permissive |
|-------------|---------|-------|------------|
| `messages_admin_all` | ALL | public | ✅ |
| `messages_insert` | INSERT | public | ✅ |

> **Security Status**: ✅ Security configured

[⬆️ Back to Top](#-table-of-contents)

---

### 🔔 Notifications

---

#### 📋 Table: `notifications`

> 🟡 Leaf | Outgoing FKs: 2 | Incoming FKs: 0 | Total: 2

##### 📊 Metadata

| Property | Value |
|----------|-------|
| **Owner** | postgres |
| **Total Size** | 32 kB |
| **Table Size** | 0 bytes |
| **Index Size** | 24 kB |
| **Live Rows** | 0 |
| **Dead Rows** | 0 |
| **RLS Enabled** | ✅ |
| **Bloat %** | N/A% |
| **Inserts** | 0 |
| **Updates** | 0 |
| **Deletes** | 0 |

##### 📝 Columns

| # | Column | Type | Nullable | Default | Description |
|---|--------|------|----------|---------|-------------|
| 1 | `id` | uuid | ❌ | gen_random_uuid() |  |
| 2 | `title` | text | ❌ | - |  |
| 3 | `message` | text | ❌ | - |  |
| 4 | `user_id` | uuid | ✅ | - |  |
| 5 | `created_by` | uuid | ✅ | - |  |
| 6 | `target_role` | USER-DEFINED | ✅ | 'all'::notificati... |  |
| 7 | `status` | USER-DEFINED | ✅ | 'pending'::notifi... |  |
| 8 | `is_read` | boolean | ✅ | false |  |
| 9 | `scheduled_for` | timestamp with time zone | ✅ | - |  |
| 10 | `sent_at` | timestamp with time zone | ✅ | - |  |
| 11 | `created_at` | timestamp with time zone | ✅ | now() |  |
| 12 | `updated_at` | timestamp with time zone | ✅ | now() |  |

##### 🔑 Constraints

| Name | Type | Columns |
|------|------|---------|
| `notifications_pkey` | PRIMARY KEY | ['id'] |

##### 🔗 Foreign Keys (Outgoing)

| FK Name | Source Column | → Target Table | On Delete |
|---------|---------------|----------------|------------|
| `notifications_created_by_fkey` | ['created_by'] | `profiles(['id'])` | SET NULL |
| `notifications_user_id_fkey` | ['user_id'] | `profiles(['id'])` | CASCADE ⚠️ |

<details><summary><strong>🔎 Indexes</strong></summary>

| Index Name | Method | Unique | Size | Scans |
|------------|--------|--------|------|-------|
| `idx_notifications_status` | btree | ❌ | 8192 bytes | 0 |
| `idx_notifications_user` | btree | ❌ | 8192 bytes | 0 |
| `notifications_pkey` | btree | ✅ | 8192 bytes | 5 |

</details>

##### 🛡️ RLS Policies

| Policy Name | Command | Roles | Permissive |
|-------------|---------|-------|------------|
| `notifications_admin_all` | ALL | public | ✅ |
| `notifications_user_delete` | DELETE | public | ✅ |
| `notifications_user_read` | SELECT | public | ✅ |
| `notifications_user_update` | UPDATE | public | ✅ |

> **Security Status**: ✅ Security configured

[⬆️ Back to Top](#-table-of-contents)

---

#### 📋 Table: `notification_preferences`

> 🟡 Leaf | Outgoing FKs: 1 | Incoming FKs: 0 | Total: 1

##### 📊 Metadata

| Property | Value |
|----------|-------|
| **Owner** | postgres |
| **Total Size** | 16 kB |
| **Table Size** | 0 bytes |
| **Index Size** | 16 kB |
| **Live Rows** | 0 |
| **Dead Rows** | 0 |
| **RLS Enabled** | ✅ |
| **Bloat %** | N/A% |
| **Inserts** | 0 |
| **Updates** | 0 |
| **Deletes** | 0 |

##### 📝 Columns

| # | Column | Type | Nullable | Default | Description |
|---|--------|------|----------|---------|-------------|
| 1 | `id` | uuid | ❌ | gen_random_uuid() |  |
| 2 | `user_id` | uuid | ❌ | - |  |
| 3 | `email_notifications` | boolean | ✅ | true |  |
| 4 | `push_notifications` | boolean | ✅ | true |  |
| 5 | `exam_reminders` | boolean | ✅ | true |  |
| 6 | `new_content_alerts` | boolean | ✅ | true |  |
| 7 | `created_at` | timestamp with time zone | ✅ | now() |  |
| 8 | `updated_at` | timestamp with time zone | ✅ | now() |  |

##### 🔑 Constraints

| Name | Type | Columns |
|------|------|---------|
| `notification_preferences_pkey` | PRIMARY KEY | ['id'] |
| `notification_preferences_user_id_key` | UNIQUE | ['user_id'] |

##### 🔗 Foreign Keys (Outgoing)

| FK Name | Source Column | → Target Table | On Delete |
|---------|---------------|----------------|------------|
| `notification_preferences_user_id_fkey` | ['user_id'] | `profiles(['id'])` | CASCADE ⚠️ |

<details><summary><strong>🔎 Indexes</strong></summary>

| Index Name | Method | Unique | Size | Scans |
|------------|--------|--------|------|-------|
| `notification_preferences_pkey` | btree | ✅ | 8192 bytes | 7 |
| `notification_preferences_user_id_key` | btree | ✅ | 8192 bytes | 0 |

</details>

##### 🛡️ RLS Policies

| Policy Name | Command | Roles | Permissive |
|-------------|---------|-------|------------|
| `notification_prefs_user_all` | ALL | public | ✅ |

> **Security Status**: ✅ Security configured

[⬆️ Back to Top](#-table-of-contents)

---

### 📱 Device Tracking

---

#### 📋 Table: `user_devices`

> 🟡 Leaf | Outgoing FKs: 1 | Incoming FKs: 0 | Total: 1

##### 📊 Metadata

| Property | Value |
|----------|-------|
| **Owner** | postgres |
| **Total Size** | 64 kB |
| **Table Size** | 8192 bytes |
| **Index Size** | 48 kB |
| **Live Rows** | 2 |
| **Dead Rows** | 13 |
| **RLS Enabled** | ✅ |
| **Bloat %** | 86.67% |
| **Inserts** | 6 |
| **Updates** | 9 |
| **Deletes** | 0 |

##### 📝 Columns

| # | Column | Type | Nullable | Default | Description |
|---|--------|------|----------|---------|-------------|
| 1 | `id` | uuid | ❌ | gen_random_uuid() |  |
| 2 | `user_id` | uuid | ❌ | - |  |
| 3 | `device_type` | USER-DEFINED | ✅ | 'unknown'::device... |  |
| 4 | `os_name` | text | ✅ | - |  |
| 5 | `os_version` | text | ✅ | - |  |
| 6 | `browser` | text | ✅ | - |  |
| 7 | `browser_version` | text | ✅ | - |  |
| 8 | `ip_address` | inet | ✅ | - |  |
| 9 | `user_agent` | text | ✅ | - |  |
| 10 | `country` | text | ✅ | - |  |
| 11 | `city` | text | ✅ | - |  |
| 12 | `first_seen_at` | timestamp with time zone | ✅ | now() |  |
| 13 | `last_seen_at` | timestamp with time zone | ✅ | now() |  |
| 14 | `login_count` | integer | ✅ | 1 |  |
| 15 | `is_current_device` | boolean | ✅ | false |  |

##### 🔑 Constraints

| Name | Type | Columns |
|------|------|---------|
| `user_devices_pkey` | PRIMARY KEY | ['id'] |

##### 🔗 Foreign Keys (Outgoing)

| FK Name | Source Column | → Target Table | On Delete |
|---------|---------------|----------------|------------|
| `user_devices_user_id_fkey` | ['user_id'] | `profiles(['id'])` | CASCADE ⚠️ |

<details><summary><strong>🔎 Indexes</strong></summary>

| Index Name | Method | Unique | Size | Scans |
|------------|--------|--------|------|-------|
| `idx_user_devices_last_seen` | btree | ❌ | 16 kB | 4 |
| `idx_user_devices_user` | btree | ❌ | 16 kB | 26 |
| `user_devices_pkey` | btree | ✅ | 16 kB | 11 |

</details>

##### 🛡️ RLS Policies

| Policy Name | Command | Roles | Permissive |
|-------------|---------|-------|------------|
| `user_devices_admin_all` | ALL | public | ✅ |
| `user_devices_self_delete` | DELETE | public | ✅ |
| `user_devices_self_read` | SELECT | public | ✅ |

> **Security Status**: ✅ Security configured

[⬆️ Back to Top](#-table-of-contents)

---

#### 📋 Table: `visitor_devices`

> 📦 Isolated | Outgoing FKs: 0 | Incoming FKs: 0 | Total: 0

##### 📊 Metadata

| Property | Value |
|----------|-------|
| **Owner** | postgres |
| **Total Size** | 96 kB |
| **Table Size** | 8192 bytes |
| **Index Size** | 48 kB |
| **Live Rows** | 10 |
| **Dead Rows** | 46 |
| **RLS Enabled** | ✅ |
| **Bloat %** | 82.14% |
| **Inserts** | 10 |
| **Updates** | 265 |
| **Deletes** | 0 |

##### 📝 Columns

| # | Column | Type | Nullable | Default | Description |
|---|--------|------|----------|---------|-------------|
| 1 | `id` | uuid | ❌ | gen_random_uuid() |  |
| 2 | `visitor_id` | text | ❌ | - |  |
| 3 | `device_type` | USER-DEFINED | ✅ | 'unknown'::device... |  |
| 4 | `os_name` | text | ✅ | - |  |
| 5 | `os_version` | text | ✅ | - |  |
| 6 | `browser` | text | ✅ | - |  |
| 7 | `browser_version` | text | ✅ | - |  |
| 8 | `ip_address` | inet | ✅ | - |  |
| 9 | `user_agent` | text | ✅ | - |  |
| 10 | `page_url` | text | ✅ | - |  |
| 11 | `referrer` | text | ✅ | - |  |
| 12 | `country` | text | ✅ | - |  |
| 13 | `city` | text | ✅ | - |  |
| 14 | `first_seen_at` | timestamp with time zone | ✅ | now() |  |
| 15 | `last_seen_at` | timestamp with time zone | ✅ | now() |  |

##### 🔑 Constraints

| Name | Type | Columns |
|------|------|---------|
| `visitor_devices_pkey` | PRIMARY KEY | ['id'] |

<details><summary><strong>🔎 Indexes</strong></summary>

| Index Name | Method | Unique | Size | Scans |
|------------|--------|--------|------|-------|
| `idx_visitor_devices_last_seen` | btree | ❌ | 16 kB | 0 |
| `idx_visitor_devices_visitor` | btree | ❌ | 16 kB | 55 |
| `visitor_devices_pkey` | btree | ✅ | 16 kB | 50 |

</details>

##### 🛡️ RLS Policies

| Policy Name | Command | Roles | Permissive |
|-------------|---------|-------|------------|
| `visitor_devices_admin_all` | ALL | public | ✅ |

> **Security Status**: ✅ Security configured

[⬆️ Back to Top](#-table-of-contents)

---

### ⚙️ System Settings

---

#### 📋 Table: `site_settings`

> 📦 Isolated | Outgoing FKs: 0 | Incoming FKs: 0 | Total: 0

##### 📊 Metadata

| Property | Value |
|----------|-------|
| **Owner** | postgres |
| **Total Size** | 48 kB |
| **Table Size** | 8192 bytes |
| **Index Size** | 32 kB |
| **Live Rows** | 4 |
| **Dead Rows** | 0 |
| **RLS Enabled** | ✅ |
| **Bloat %** | N/A% |
| **Inserts** | 4 |
| **Updates** | 0 |
| **Deletes** | 0 |

##### 📝 Columns

| # | Column | Type | Nullable | Default | Description |
|---|--------|------|----------|---------|-------------|
| 1 | `id` | uuid | ❌ | gen_random_uuid() |  |
| 2 | `key` | text | ❌ | - |  |
| 3 | `value` | jsonb | ✅ | - |  |
| 4 | `description` | text | ✅ | - |  |
| 5 | `created_at` | timestamp with time zone | ✅ | now() |  |
| 6 | `updated_at` | timestamp with time zone | ✅ | now() |  |

##### 🔑 Constraints

| Name | Type | Columns |
|------|------|---------|
| `site_settings_key_key` | UNIQUE | ['key'] |
| `site_settings_pkey` | PRIMARY KEY | ['id'] |

<details><summary><strong>🔎 Indexes</strong></summary>

| Index Name | Method | Unique | Size | Scans |
|------------|--------|--------|------|-------|
| `site_settings_key_key` | btree | ✅ | 16 kB | 0 |
| `site_settings_pkey` | btree | ✅ | 16 kB | 6 |

</details>

##### 🛡️ RLS Policies

| Policy Name | Command | Roles | Permissive |
|-------------|---------|-------|------------|
| `settings_admin_all` | ALL | public | ✅ |
| `settings_public_read` | SELECT | public | ✅ |

> **Security Status**: ✅ Security configured

[⬆️ Back to Top](#-table-of-contents)

---


## 📝 End of Report

> Generated on 2026-01-03 18:43:10

---

## 🔍 Database Schema Analysis & Gap Report

> **📅 Analysis Date**: 2026-01-04
> **🎯 Purpose**: This section documents discrepancies between the documentation and the actual database state, plus missing application features.

### 1. 🔌 Extensions & Configuration
- **Discrepancy**: Documentation lists `pgjwt`, but the scan detected `plpgsql`.
- **Version Update**: `pg_stat_statements` is version `1.11` in DB (Docs say `1.10`).

### 2. 📋 ENUM Types (Action Required)
The following ENUMs exist in the database but are missing from the documentation:
| Missing ENUM Name | Values |
|-------------------|--------|
| `exam_type` | `quiz`, `midterm`, `final`, `practice` |
| `notification_target_role` | `all`, `students`, `teachers`, `admins` |
| `sender_type` | `user`, `admin`, `system` |

**Note**: `support_chat_status` in DB maps to `chat_status` in Docs.

### 3. 🛡️ Security & Integrity (Verified)
- **RLS Policies**: ✅ **Content Matches**.
  - The database contains **68 active policies**.
  - The documentation includes all 68 policies details.
  - *Correction*: The summary table at the top of this document incorrectly states "61" policies.
- **Foreign Keys**: ✅ **Content Matches**.
  - All Foreign Key definitions and deletion rules (`CASCADE`, `SET NULL`) in the documentation match the database exactly.

### 4. ⚡ Triggers (Missing Documentation)
The documentation misses specific triggers found in the database:
- `comprehensive_exams` -> `update_comp_exam_count_on_delete`
- `comprehensive_exams` -> `update_comp_exam_count_on_insert`

### 5. 🌐 Application Feature Gaps
Comparing the database schema with the current application state, the following features are supported by the DB but missing in the Frontend:

#### A. Communication & Support (Critical)
- **Shared Tables**: `support_chats`, `chat_messages`
- **Missing UI**:
  - User-facing Support Dashboard (`/app/support`).
  - Contact Form (`/app/contact`).
  - Admin Message Management (`/app/admin/messages`).

#### B. Exam History & Subscriptions (High Priority)
- **Shared Tables**: `comprehensive_exam_attempts`, `teacher_subscriptions`
- **Missing UI**:
  - Student Exam History Page (`/app/profile/exam-history`).
  - Student Subscriptions List (`/app/profile/subscriptions`).

#### C. Notifications (Enhancement)
- **Shared Tables**: `notifications`
- **Gap**:
  - `scheduled_for` column exists but is unused (no scheduling logic).
  - `push_notifications` preference exists but Push logic is not implemented.

### 6. 📊 Storage & Performance Analysis (New)
The following tables have high bloat (>50%) and should be maintained (VACUUM FULL):
- `comprehensive_exams` (100%)
- `teacher_subscriptions` (89.5%)
- `user_devices` (86.7%)
- `teacher_exam_attempts` (84.6%)
- `visitor_devices` (82.1%)
- `teacher_ratings` (71.4%)
- `teacher_exams` (66.7%)
- `profiles` (58.3%)
- `lesson_questions` (51.9%)

### 7. 🔒 Constraints & Integrity
- **Missing Constraint**: `teacher_ratings.teacher_ratings_rating_check` (CHECK constraint) exists in DB but is not in Docs.

### 8. 🧬 Deep Integrity Audit (New)
A strict comparison of all column definitions, nullability, and foreign key rules was performed.
- **Columns**: ✅ **100% Match**. All columns in the database are present in the documentation with correct nullability settings.
- **Tables**: ✅ **100% Match**. No orphan tables found in either direction.
- **Views**: No custom views were detected in the `public` schema.

### 9. 📝 Recommended Next Steps
1.  **Doc Update**: Add the 3 missing ENUMs, 2 Triggers, and the 1 missing Check Constraint.
2.  **Maintenance**: Run `VACUUM FULL` on the high-bloat tables identified in Section 6.
3.  **Frontend Implementation**:
    *   **Support**: Create `/app/support` using `support_chats` tables.
    *   **History**: Create `/app/profile/exam-history` using `*_attempts` tables.
    *   **Contact**: Create `/app/contact` using `messages` table.
4.  **Cleanup**: Update the summary counts in existing documentation sections to reflect "7 Triggers" (not 11) and "68 RLS Policies" (not 61).
