# تقرير تحليل قاعدة البيانات (Database Analysis Report)

شرح تفصيلي ممل لهيكلية قاعدة البيانات.

## الجدول: `chat_messages`
| اسم العمود | النوع | Nullable | Default |
| :--- | :--- | :--- | :--- |
| `chat_id` | uuid | False | None |
| `created_at` | timestamp with time zone | True | now() |
| `id` | uuid | False | gen_random_uuid() |
| `is_ai_response` | boolean | True | false |
| `message` | text | False | None |
| `sender_id` | uuid | True | None |
| `sender_type` | USER-DEFINED | False | None |


## الجدول: `comprehensive_exam_attempts`
| اسم العمود | النوع | Nullable | Default |
| :--- | :--- | :--- | :--- |
| `answers` | jsonb | True | '{}'::jsonb |
| `completed_at` | timestamp with time zone | True | None |
| `created_at` | timestamp with time zone | True | now() |
| `exam_id` | uuid | False | None |
| `id` | uuid | False | gen_random_uuid() |
| `max_score` | integer | True | None |
| `started_at` | timestamp with time zone | True | now() |
| `status` | text | True | 'in_progress'::text |
| `student_id` | uuid | False | None |
| `total_score` | integer | True | None |
| `updated_at` | timestamp with time zone | True | now() |


## الجدول: `comprehensive_exams`
| اسم العمود | النوع | Nullable | Default |
| :--- | :--- | :--- | :--- |
| `blocks` | jsonb | True | '[]'::jsonb |
| `branch_tags` | ARRAY | True | None |
| `created_at` | timestamp with time zone | True | now() |
| `created_by` | uuid | True | None |
| `duration_minutes` | integer | True | None |
| `exam_description` | text | True | None |
| `exam_title` | text | False | None |
| `grading_mode` | text | True | 'automatic'::text |
| `id` | uuid | False | gen_random_uuid() |
| `is_published` | boolean | True | false |
| `language` | text | False | 'ar'::text |
| `lesson_id` | uuid | True | None |
| `passing_score` | integer | True | None |
| `sections` | jsonb | True | '[]'::jsonb |
| `stage_id` | uuid | True | None |
| `stage_name` | text | True | None |
| `subject_id` | uuid | True | None |
| `subject_name` | text | True | None |
| `total_marks` | integer | True | None |
| `type` | text | False | None |
| `updated_at` | timestamp with time zone | True | now() |
| `usage_scope` | text | True | 'public'::text |


## الجدول: `educational_stages`
| اسم العمود | النوع | Nullable | Default |
| :--- | :--- | :--- | :--- |
| `created_at` | timestamp with time zone | True | now() |
| `description` | text | True | None |
| `id` | uuid | False | gen_random_uuid() |
| `image_url` | text | True | None |
| `is_active` | boolean | True | true |
| `name` | text | False | None |
| `order_index` | integer | True | 0 |
| `slug` | text | False | None |
| `updated_at` | timestamp with time zone | True | now() |


## الجدول: `lesson_questions`
| اسم العمود | النوع | Nullable | Default |
| :--- | :--- | :--- | :--- |
| `correct_answer` | jsonb | True | None |
| `correct_option_id` | text | True | None |
| `created_at` | timestamp with time zone | True | now() |
| `created_by` | uuid | True | None |
| `difficulty` | text | True | 'medium'::text |
| `explanation` | jsonb | True | None |
| `hint` | jsonb | True | None |
| `id` | uuid | False | gen_random_uuid() |
| `is_active` | boolean | True | true |
| `lesson_id` | uuid | False | None |
| `media` | jsonb | True | None |
| `options` | jsonb | True | '[]'::jsonb |
| `order_index` | integer | True | 0 |
| `points` | integer | True | 1 |
| `text` | jsonb | True | '{"ar": "", "en": ""}'::jsonb |
| `type` | text | True | 'multiple_choice'::text |
| `updated_at` | timestamp with time zone | True | now() |


## الجدول: `lessons`
| اسم العمود | النوع | Nullable | Default |
| :--- | :--- | :--- | :--- |
| `content` | text | True | None |
| `created_at` | timestamp with time zone | True | now() |
| `created_by` | uuid | True | None |
| `description` | text | True | None |
| `id` | uuid | False | gen_random_uuid() |
| `image_url` | text | True | None |
| `is_free` | boolean | True | false |
| `is_published` | boolean | True | false |
| `likes_count` | integer | True | 0 |
| `order_index` | integer | True | 0 |
| `stage_id` | uuid | True | None |
| `subject_id` | uuid | False | None |
| `title` | text | False | None |
| `updated_at` | timestamp with time zone | True | now() |
| `views_count` | integer | True | 0 |


## الجدول: `messages`
| اسم العمود | النوع | Nullable | Default |
| :--- | :--- | :--- | :--- |
| `created_at` | timestamp with time zone | True | now() |
| `from_email` | text | False | None |
| `from_name` | text | False | None |
| `from_user_id` | uuid | True | None |
| `id` | uuid | False | gen_random_uuid() |
| `is_archived` | boolean | True | false |
| `is_read` | boolean | True | false |
| `is_replied` | boolean | True | false |
| `is_starred` | boolean | True | false |
| `message` | text | False | None |
| `replied_at` | timestamp with time zone | True | None |
| `replied_by` | uuid | True | None |
| `reply_text` | text | True | None |
| `subject` | text | False | None |


## الجدول: `notification_preferences`
| اسم العمود | النوع | Nullable | Default |
| :--- | :--- | :--- | :--- |
| `created_at` | timestamp with time zone | True | now() |
| `email_notifications` | boolean | True | true |
| `exam_reminders` | boolean | True | true |
| `id` | uuid | False | gen_random_uuid() |
| `new_content_alerts` | boolean | True | true |
| `push_notifications` | boolean | True | true |
| `updated_at` | timestamp with time zone | True | now() |
| `user_id` | uuid | False | None |


## الجدول: `notifications`
| اسم العمود | النوع | Nullable | Default |
| :--- | :--- | :--- | :--- |
| `created_at` | timestamp with time zone | True | now() |
| `created_by` | uuid | True | None |
| `id` | uuid | False | gen_random_uuid() |
| `is_read` | boolean | True | false |
| `message` | text | False | None |
| `scheduled_for` | timestamp with time zone | True | None |
| `sent_at` | timestamp with time zone | True | None |
| `status` | USER-DEFINED | True | 'pending'::notification_status |
| `target_role` | USER-DEFINED | True | 'all'::notification_target_role |
| `title` | text | False | None |
| `updated_at` | timestamp with time zone | True | now() |
| `user_id` | uuid | True | None |


## الجدول: `profiles`
| اسم العمود | النوع | Nullable | Default |
| :--- | :--- | :--- | :--- |
| `avatar_url` | text | True | None |
| `bio` | text | True | None |
| `cover_image_url` | text | True | None |
| `created_at` | timestamp with time zone | True | now() |
| `education` | text | True | None |
| `email` | text | False | None |
| `exam_count` | integer | True | 0 |
| `id` | uuid | False | None |
| `is_teacher_approved` | boolean | True | false |
| `is_teacher_profile_public` | boolean | True | false |
| `is_verified` | boolean | True | false |
| `name` | text | True | None |
| `phone` | text | True | None |
| `rating_average` | numeric | True | 0 |
| `rating_count` | integer | True | 0 |
| `role` | USER-DEFINED | True | 'student'::user_role |
| `role_selected` | boolean | True | false |
| `social_links` | jsonb | True | '{}'::jsonb |
| `specialization` | text | True | None |
| `stages` | ARRAY | True | '{}'::text[] |
| `subjects` | ARRAY | True | '{}'::text[] |
| `subscriber_count` | integer | True | 0 |
| `teacher_title` | text | True | None |
| `teaching_style` | text | True | None |
| `total_views` | integer | True | 0 |
| `updated_at` | timestamp with time zone | True | now() |
| `website` | text | True | None |
| `years_of_experience` | integer | True | 0 |


## الجدول: `site_settings`
| اسم العمود | النوع | Nullable | Default |
| :--- | :--- | :--- | :--- |
| `created_at` | timestamp with time zone | True | now() |
| `description` | text | True | None |
| `id` | uuid | False | gen_random_uuid() |
| `key` | text | False | None |
| `updated_at` | timestamp with time zone | True | now() |
| `value` | jsonb | True | None |


## الجدول: `subjects`
| اسم العمود | النوع | Nullable | Default |
| :--- | :--- | :--- | :--- |
| `color` | text | True | None |
| `created_at` | timestamp with time zone | True | now() |
| `description` | text | True | None |
| `icon` | text | True | None |
| `id` | uuid | False | gen_random_uuid() |
| `image_url` | text | True | None |
| `is_active` | boolean | True | true |
| `name` | text | False | None |
| `order_index` | integer | True | 0 |
| `slug` | text | False | None |
| `stage_id` | uuid | True | None |
| `updated_at` | timestamp with time zone | True | now() |


## الجدول: `support_chats`
| اسم العمود | النوع | Nullable | Default |
| :--- | :--- | :--- | :--- |
| `assigned_to` | uuid | True | None |
| `created_at` | timestamp with time zone | True | now() |
| `id` | uuid | False | gen_random_uuid() |
| `status` | text | True | 'open'::text |
| `subject` | text | True | None |
| `updated_at` | timestamp with time zone | True | now() |
| `user_id` | uuid | True | None |


## الجدول: `teacher_exam_attempts`
| اسم العمود | النوع | Nullable | Default |
| :--- | :--- | :--- | :--- |
| `answers` | jsonb | True | '{}'::jsonb |
| `completed_at` | timestamp with time zone | True | None |
| `created_at` | timestamp with time zone | True | now() |
| `exam_id` | uuid | False | None |
| `id` | uuid | False | gen_random_uuid() |
| `max_score` | integer | True | None |
| `started_at` | timestamp with time zone | True | now() |
| `status` | text | True | 'in_progress'::text |
| `student_id` | uuid | False | None |
| `total_score` | integer | True | None |
| `updated_at` | timestamp with time zone | True | now() |


## الجدول: `teacher_exams`
| اسم العمود | النوع | Nullable | Default |
| :--- | :--- | :--- | :--- |
| `available_from` | timestamp with time zone | True | None |
| `available_until` | timestamp with time zone | True | None |
| `blocks` | jsonb | True | '[]'::jsonb |
| `created_at` | timestamp with time zone | True | now() |
| `created_by` | uuid | False | None |
| `duration_minutes` | integer | True | None |
| `exam_description` | text | True | None |
| `exam_title` | text | False | None |
| `id` | uuid | False | gen_random_uuid() |
| `is_published` | boolean | True | false |
| `is_time_limited` | boolean | True | false |
| `language` | text | False | 'ar'::text |
| `passing_score` | integer | True | None |
| `sections` | jsonb | True | '[]'::jsonb |
| `stage_id` | uuid | True | None |
| `stage_name` | text | True | None |
| `subject_id` | uuid | True | None |
| `subject_name` | text | True | None |
| `total_marks` | integer | True | None |
| `type` | text | False | 'quiz'::text |
| `updated_at` | timestamp with time zone | True | now() |


## الجدول: `teacher_ratings`
| اسم العمود | النوع | Nullable | Default |
| :--- | :--- | :--- | :--- |
| `created_at` | timestamp with time zone | True | now() |
| `id` | uuid | False | gen_random_uuid() |
| `rating` | integer | False | None |
| `review` | text | True | None |
| `teacher_id` | uuid | False | None |
| `updated_at` | timestamp with time zone | True | now() |
| `user_id` | uuid | False | None |


## الجدول: `teacher_subscriptions`
| اسم العمود | النوع | Nullable | Default |
| :--- | :--- | :--- | :--- |
| `created_at` | timestamp with time zone | True | now() |
| `id` | uuid | False | gen_random_uuid() |
| `teacher_id` | uuid | False | None |
| `user_id` | uuid | False | None |


## الجدول: `user_devices`
| اسم العمود | النوع | Nullable | Default |
| :--- | :--- | :--- | :--- |
| `browser` | text | True | None |
| `browser_version` | text | True | None |
| `city` | text | True | None |
| `country` | text | True | None |
| `device_type` | USER-DEFINED | True | 'unknown'::device_type |
| `first_seen_at` | timestamp with time zone | True | now() |
| `id` | uuid | False | gen_random_uuid() |
| `ip_address` | inet | True | None |
| `is_current_device` | boolean | True | false |
| `last_seen_at` | timestamp with time zone | True | now() |
| `login_count` | integer | True | 1 |
| `os_name` | text | True | None |
| `os_version` | text | True | None |
| `user_agent` | text | True | None |
| `user_id` | uuid | False | None |


## الجدول: `user_lesson_progress`
| اسم العمود | النوع | Nullable | Default |
| :--- | :--- | :--- | :--- |
| `created_at` | timestamp with time zone | True | now() |
| `id` | uuid | False | gen_random_uuid() |
| `is_completed` | boolean | True | false |
| `last_position` | integer | True | 0 |
| `lesson_id` | uuid | False | None |
| `progress_percentage` | integer | True | 0 |
| `updated_at` | timestamp with time zone | True | now() |
| `user_id` | uuid | False | None |


## الجدول: `visitor_devices`
| اسم العمود | النوع | Nullable | Default |
| :--- | :--- | :--- | :--- |
| `browser` | text | True | None |
| `browser_version` | text | True | None |
| `city` | text | True | None |
| `country` | text | True | None |
| `device_type` | USER-DEFINED | True | 'unknown'::device_type |
| `first_seen_at` | timestamp with time zone | True | now() |
| `id` | uuid | False | gen_random_uuid() |
| `ip_address` | inet | True | None |
| `last_seen_at` | timestamp with time zone | True | now() |
| `os_name` | text | True | None |
| `os_version` | text | True | None |
| `page_url` | text | True | None |
| `referrer` | text | True | None |
| `user_agent` | text | True | None |
| `visitor_id` | text | False | None |

