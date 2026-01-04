# تقرير تحليل واجهة المستخدم (UI Analysis Report)

يوضح هذا التقرير الفجوات بين قاعدة البيانات وكود الواجهة (Frontend/Backend).

**طريقة التحليل**: يتم البحث عن اسم الجدول، ثم البحث عن أعمدته داخل الملفات التي ذكرت الجدول (سياق مرتبط)، أو البحث عنها عالميًا إذا كانت مميزة.

## ✅ الجدول: `chat_messages`
| اسم العمود | الحالة | التكرار التقريبي |
| :--- | :--- | :--- |
| `chat_id` | ✅ مستخدم | 5 |
| `created_at` | ✅ مستخدم | 5 |
| `id` | ✅ مستخدم | 5 |
| `is_ai_response` | ✅ مستخدم | 4 |
| `message` | ✅ مستخدم | 5 |
| `sender_id` | ✅ مستخدم | 4 |
| `sender_type` | ✅ مستخدم | 5 |


## ✅ الجدول: `comprehensive_exam_attempts`
| اسم العمود | الحالة | التكرار التقريبي |
| :--- | :--- | :--- |
| `answers` | ✅ مستخدم | 6 |
| `completed_at` | ✅ مستخدم | 5 |
| `created_at` | ✅ مستخدم | 6 |
| `exam_id` | ✅ مستخدم | 8 |
| `id` | ✅ مستخدم | 10 |
| `max_score` | ✅ مستخدم | 7 |
| `started_at` | ✅ مستخدم | 7 |
| `status` | ✅ مستخدم | 10 |
| `student_id` | ✅ مستخدم | 7 |
| `total_score` | ✅ مستخدم | 8 |
| `updated_at` | ✅ مستخدم | 5 |


## ✅ الجدول: `comprehensive_exams`
| اسم العمود | الحالة | التكرار التقريبي |
| :--- | :--- | :--- |
| `blocks` | ✅ مستخدم | 9 |
| `branch_tags` | ✅ مستخدم | 2 |
| `created_at` | ✅ مستخدم | 14 |
| `created_by` | ✅ مستخدم | 9 |
| `duration_minutes` | ✅ مستخدم | 9 |
| `exam_description` | ✅ مستخدم | 9 |
| `exam_title` | ✅ مستخدم | 15 |
| `grading_mode` | ✅ مستخدم | 2 |
| `id` | ✅ مستخدم | 20 |
| `is_published` | ✅ مستخدم | 13 |
| `language` | ✅ مستخدم | 12 |
| `lesson_id` | ✅ مستخدم | 4 |
| `passing_score` | ✅ مستخدم | 4 |
| `sections` | ✅ مستخدم | 9 |
| `stage_id` | ✅ مستخدم | 9 |
| `stage_name` | ✅ مستخدم | 2 |
| `subject_id` | ✅ مستخدم | 9 |
| `subject_name` | ✅ مستخدم | 2 |
| `total_marks` | ✅ مستخدم | 9 |
| `type` | ✅ مستخدم | 19 |
| `updated_at` | ✅ مستخدم | 10 |
| `usage_scope` | ✅ مستخدم | 2 |


## ✅ الجدول: `educational_stages`
| اسم العمود | الحالة | التكرار التقريبي |
| :--- | :--- | :--- |
| `created_at` | ✅ مستخدم | 8 |
| `description` | ✅ مستخدم | 8 |
| `id` | ✅ مستخدم | 17 |
| `image_url` | ✅ مستخدم | 7 |
| `is_active` | ✅ مستخدم | 8 |
| `name` | ✅ مستخدم | 14 |
| `order_index` | ✅ مستخدم | 12 |
| `slug` | ✅ مستخدم | 6 |
| `updated_at` | ✅ مستخدم | 8 |


## ✅ الجدول: `lesson_questions`
| اسم العمود | الحالة | التكرار التقريبي |
| :--- | :--- | :--- |
| `correct_answer` | ✅ مستخدم | 9 |
| `correct_option_id` | ✅ مستخدم | 8 |
| `created_at` | ✅ مستخدم | 9 |
| `created_by` | ✅ مستخدم | 2 |
| `difficulty` | ✅ مستخدم | 10 |
| `explanation` | ✅ مستخدم | 7 |
| `hint` | ✅ مستخدم | 6 |
| `id` | ✅ مستخدم | 12 |
| `is_active` | ✅ مستخدم | 8 |
| `lesson_id` | ✅ مستخدم | 10 |
| `media` | ✅ مستخدم | 6 |
| `options` | ✅ مستخدم | 10 |
| `order_index` | ✅ مستخدم | 10 |
| `points` | ✅ مستخدم | 8 |
| `text` | ✅ مستخدم | 10 |
| `type` | ✅ مستخدم | 12 |
| `updated_at` | ✅ مستخدم | 6 |


## ✅ الجدول: `lessons`
| اسم العمود | الحالة | التكرار التقريبي |
| :--- | :--- | :--- |
| `content` | ✅ مستخدم | 8 |
| `created_at` | ✅ مستخدم | 15 |
| `created_by` | ✅ مستخدم | 3 |
| `description` | ✅ مستخدم | 16 |
| `id` | ✅ مستخدم | 30 |
| `image_url` | ✅ مستخدم | 4 |
| `is_free` | ✅ مستخدم | 2 |
| `is_published` | ✅ مستخدم | 11 |
| `likes_count` | ✅ مستخدم | 3 |
| `order_index` | ✅ مستخدم | 11 |
| `stage_id` | ✅ مستخدم | 10 |
| `subject_id` | ✅ مستخدم | 11 |
| `title` | ✅ مستخدم | 22 |
| `updated_at` | ✅ مستخدم | 6 |
| `views_count` | ✅ مستخدم | 2 |


## ✅ الجدول: `messages`
| اسم العمود | الحالة | التكرار التقريبي |
| :--- | :--- | :--- |
| `created_at` | ✅ مستخدم | 8 |
| `from_email` | ✅ مستخدم | 3 |
| `from_name` | ✅ مستخدم | 3 |
| `from_user_id` | ✅ مستخدم | 2 |
| `id` | ✅ مستخدم | 16 |
| `is_archived` | ✅ مستخدم | 3 |
| `is_read` | ✅ مستخدم | 3 |
| `is_replied` | ✅ مستخدم | 3 |
| `is_starred` | ✅ مستخدم | 3 |
| `message` | ✅ مستخدم | 17 |
| `replied_at` | ✅ مستخدم | 3 |
| `replied_by` | ✅ مستخدم | 2 |
| `reply_text` | ✅ مستخدم | 3 |
| `subject` | ✅ مستخدم | 8 |


## ✅ الجدول: `notification_preferences`
| اسم العمود | الحالة | التكرار التقريبي |
| :--- | :--- | :--- |
| `created_at` | ✅ مستخدم | 3 |
| `email_notifications` | ✅ مستخدم | 2 |
| `exam_reminders` | ✅ مستخدم | 2 |
| `id` | ✅ مستخدم | 4 |
| `new_content_alerts` | ✅ مستخدم | 2 |
| `push_notifications` | ✅ مستخدم | 2 |
| `updated_at` | ✅ مستخدم | 4 |
| `user_id` | ✅ مستخدم | 4 |


## ✅ الجدول: `notifications`
| اسم العمود | الحالة | التكرار التقريبي |
| :--- | :--- | :--- |
| `created_at` | ✅ مستخدم | 10 |
| `created_by` | ✅ مستخدم | 4 |
| `id` | ✅ مستخدم | 16 |
| `is_read` | ✅ مستخدم | 6 |
| `message` | ✅ مستخدم | 8 |
| `scheduled_for` | ✅ مستخدم | 2 |
| `sent_at` | ✅ مستخدم | 3 |
| `status` | ✅ مستخدم | 7 |
| `target_role` | ✅ مستخدم | 2 |
| `title` | ✅ مستخدم | 13 |
| `updated_at` | ✅ مستخدم | 6 |
| `user_id` | ✅ مستخدم | 6 |


## ✅ الجدول: `profiles`
| اسم العمود | الحالة | التكرار التقريبي |
| :--- | :--- | :--- |
| `avatar_url` | ✅ مستخدم | 19 |
| `bio` | ✅ مستخدم | 11 |
| `cover_image_url` | ✅ مستخدم | 8 |
| `created_at` | ✅ مستخدم | 18 |
| `education` | ✅ مستخدم | 13 |
| `email` | ✅ مستخدم | 22 |
| `exam_count` | ✅ مستخدم | 4 |
| `id` | ✅ مستخدم | 35 |
| `is_teacher_approved` | ✅ مستخدم | 11 |
| `is_teacher_profile_public` | ✅ مستخدم | 5 |
| `is_verified` | ✅ مستخدم | 12 |
| `name` | ✅ مستخدم | 30 |
| `phone` | ✅ مستخدم | 13 |
| `rating_average` | ✅ مستخدم | 10 |
| `rating_count` | ✅ مستخدم | 10 |
| `role` | ✅ مستخدم | 26 |
| `role_selected` | ✅ مستخدم | 6 |
| `social_links` | ✅ مستخدم | 6 |
| `specialization` | ✅ مستخدم | 11 |
| `stages` | ✅ مستخدم | 12 |
| `subjects` | ✅ مستخدم | 13 |
| `subscriber_count` | ✅ مستخدم | 10 |
| `teacher_title` | ✅ مستخدم | 9 |
| `teaching_style` | ✅ مستخدم | 9 |
| `total_views` | ✅ مستخدم | 4 |
| `updated_at` | ✅ مستخدم | 17 |
| `website` | ✅ مستخدم | 8 |
| `years_of_experience` | ✅ مستخدم | 9 |


## ✅ الجدول: `site_settings`
| اسم العمود | الحالة | التكرار التقريبي |
| :--- | :--- | :--- |
| `created_at` | ✅ مستخدم | 1 |
| `description` | ✅ مستخدم | 3 |
| `id` | ✅ مستخدم | 3 |
| `key` | ✅ مستخدم | 3 |
| `updated_at` | ✅ مستخدم | 3 |
| `value` | ✅ مستخدم | 3 |


## ✅ الجدول: `subjects`
| اسم العمود | الحالة | التكرار التقريبي |
| :--- | :--- | :--- |
| `color` | ✅ مستخدم | 18 |
| `created_at` | ✅ مستخدم | 16 |
| `description` | ✅ مستخدم | 15 |
| `icon` | ✅ مستخدم | 16 |
| `id` | ✅ مستخدم | 33 |
| `image_url` | ✅ مستخدم | 11 |
| `is_active` | ✅ مستخدم | 9 |
| `name` | ✅ مستخدم | 27 |
| `order_index` | ✅ مستخدم | 13 |
| `slug` | ✅ مستخدم | 8 |
| `stage_id` | ✅ مستخدم | 13 |
| `updated_at` | ✅ مستخدم | 9 |


## ✅ الجدول: `support_chats`
| اسم العمود | الحالة | التكرار التقريبي |
| :--- | :--- | :--- |
| `assigned_to` | ✅ مستخدم | 3 |
| `created_at` | ✅ مستخدم | 5 |
| `id` | ✅ مستخدم | 5 |
| `status` | ✅ مستخدم | 5 |
| `subject` | ✅ مستخدم | 4 |
| `updated_at` | ✅ مستخدم | 5 |
| `user_id` | ✅ مستخدم | 5 |


## ✅ الجدول: `teacher_exam_attempts`
| اسم العمود | الحالة | التكرار التقريبي |
| :--- | :--- | :--- |
| `answers` | ✅ مستخدم | 5 |
| `completed_at` | ✅ مستخدم | 6 |
| `created_at` | ✅ مستخدم | 3 |
| `exam_id` | ✅ مستخدم | 7 |
| `id` | ✅ مستخدم | 9 |
| `max_score` | ✅ مستخدم | 6 |
| `started_at` | ✅ مستخدم | 6 |
| `status` | ✅ مستخدم | 8 |
| `student_id` | ✅ مستخدم | 6 |
| `total_score` | ✅ مستخدم | 8 |
| `updated_at` | ✅ مستخدم | 3 |


## ✅ الجدول: `teacher_exams`
| اسم العمود | الحالة | التكرار التقريبي |
| :--- | :--- | :--- |
| `available_from` | ✅ مستخدم | 3 |
| `available_until` | ✅ مستخدم | 3 |
| `blocks` | ✅ مستخدم | 8 |
| `created_at` | ✅ مستخدم | 9 |
| `created_by` | ✅ مستخدم | 10 |
| `duration_minutes` | ✅ مستخدم | 9 |
| `exam_description` | ✅ مستخدم | 9 |
| `exam_title` | ✅ مستخدم | 14 |
| `id` | ✅ مستخدم | 18 |
| `is_published` | ✅ مستخدم | 8 |
| `is_time_limited` | ✅ مستخدم | 3 |
| `language` | ✅ مستخدم | 10 |
| `passing_score` | ✅ مستخدم | 4 |
| `sections` | ✅ مستخدم | 9 |
| `stage_id` | ✅ مستخدم | 4 |
| `stage_name` | ✅ مستخدم | 1 |
| `subject_id` | ✅ مستخدم | 4 |
| `subject_name` | ✅ مستخدم | 1 |
| `total_marks` | ✅ مستخدم | 10 |
| `type` | ✅ مستخدم | 16 |
| `updated_at` | ✅ مستخدم | 8 |


## ✅ الجدول: `teacher_ratings`
| اسم العمود | الحالة | التكرار التقريبي |
| :--- | :--- | :--- |
| `created_at` | ✅ مستخدم | 4 |
| `id` | ✅ مستخدم | 4 |
| `rating` | ✅ مستخدم | 4 |
| `review` | ✅ مستخدم | 4 |
| `teacher_id` | ✅ مستخدم | 4 |
| `updated_at` | ✅ مستخدم | 4 |
| `user_id` | ✅ مستخدم | 4 |


## ✅ الجدول: `teacher_subscriptions`
| اسم العمود | الحالة | التكرار التقريبي |
| :--- | :--- | :--- |
| `created_at` | ✅ مستخدم | 4 |
| `id` | ✅ مستخدم | 6 |
| `teacher_id` | ✅ مستخدم | 6 |
| `user_id` | ✅ مستخدم | 6 |


## ✅ الجدول: `user_devices`
| اسم العمود | الحالة | التكرار التقريبي |
| :--- | :--- | :--- |
| `browser` | ✅ مستخدم | 3 |
| `browser_version` | ✅ مستخدم | 3 |
| `city` | ✅ مستخدم | 3 |
| `country` | ✅ مستخدم | 3 |
| `device_type` | ✅ مستخدم | 3 |
| `first_seen_at` | ✅ مستخدم | 1 |
| `id` | ✅ مستخدم | 4 |
| `ip_address` | ✅ مستخدم | 3 |
| `is_current_device` | ✅ مستخدم | 1 |
| `last_seen_at` | ✅ مستخدم | 3 |
| `login_count` | ✅ مستخدم | 1 |
| `os_name` | ✅ مستخدم | 3 |
| `os_version` | ✅ مستخدم | 4 |
| `user_agent` | ✅ مستخدم | 3 |
| `user_id` | ✅ مستخدم | 4 |


## ✅ الجدول: `user_lesson_progress`
| اسم العمود | الحالة | التكرار التقريبي |
| :--- | :--- | :--- |
| `created_at` | ✅ مستخدم | 2 |
| `id` | ✅ مستخدم | 4 |
| `is_completed` | ✅ مستخدم | 4 |
| `last_position` | ✅ مستخدم | 3 |
| `lesson_id` | ✅ مستخدم | 4 |
| `progress_percentage` | ✅ مستخدم | 3 |
| `updated_at` | ✅ مستخدم | 4 |
| `user_id` | ✅ مستخدم | 4 |


## ✅ الجدول: `visitor_devices`
| اسم العمود | الحالة | التكرار التقريبي |
| :--- | :--- | :--- |
| `browser` | ✅ مستخدم | 2 |
| `browser_version` | ✅ مستخدم | 2 |
| `city` | ✅ مستخدم | 2 |
| `country` | ✅ مستخدم | 2 |
| `device_type` | ✅ مستخدم | 2 |
| `first_seen_at` | ✅ مستخدم | 1 |
| `id` | ✅ مستخدم | 3 |
| `ip_address` | ✅ مستخدم | 2 |
| `last_seen_at` | ✅ مستخدم | 3 |
| `os_name` | ✅ مستخدم | 2 |
| `os_version` | ✅ مستخدم | 2 |
| `page_url` | ✅ مستخدم | 2 |
| `referrer` | ✅ مستخدم | 2 |
| `user_agent` | ✅ مستخدم | 2 |
| `visitor_id` | ✅ مستخدم | 2 |

