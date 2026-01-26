# Database Schema Documentation

This document explicitly details the database schema, including columns, relationships (foreign keys), and Row Level Security (RLS) policies for all tables in the database.

## Tables

### `app_settings`
General application settings.

**Columns**
- `id` (uuid, PK): Unique identifier.
- `created_at` (timestamptz): Creation timestamp.
- `key` (text): Setting key.
- `value` (jsonb): Setting value.

**RLS Policies**
- **Admins can insert app_settings**: INSERT (Roles: authenticated) -> `(EXISTS ( SELECT 1 FROM profiles WHERE ((profiles.id = auth.uid()) AND (profiles.role = 'admin'::user_role))))`
- **Admins can update app_settings**: UPDATE (Roles: authenticated) -> `(EXISTS ( SELECT 1 FROM profiles WHERE ((profiles.id = auth.uid()) AND (profiles.role = 'admin'::user_role))))`
- **Anyone can read app_settings**: SELECT (Roles: authenticated) -> `true`

---

### `chat_messages`
Messages within support chats.

**Columns**
- `id` (uuid, PK): Unique identifier.
- `chat_id` (uuid, FK): Reference to `support_chats`.
- `sender_id` (uuid, FK): Reference to `profiles` (sender).
- `content` (text): Message content.
- `is_admin_reply` (boolean): Flag if message is from admin.
- `created_at` (timestamptz): Creation timestamp.

**RLS Policies**
- **chat_messages_admin_all**: ALL (Roles: public)
- **chat_messages_create**: INSERT (Roles: public)
- **chat_messages_read**: SELECT (Roles: public)
- **chat_messages_user_own**: ALL (Roles: public)

---

### `comprehensive_exam_attempts`
Student attempts at comprehensive exams.

**Columns**
- `id` (uuid, PK): Unique identifier.
- `exam_id` (uuid, FK): Reference to `comprehensive_exams`.
- `student_id` (uuid, FK): Reference to `profiles`.
- `score` (integer): Score obtained.
- `started_at` (timestamptz): Start time.
- `completed_at` (timestamptz): Completion time.
- `answers` (jsonb): Student answers.

**RLS Policies**
- **Teachers and admins can delete attempts**: DELETE (Roles: authenticated)
- **Users can insert their own attempts**: INSERT (Roles: authenticated)
- **Users can update their own attempts**: UPDATE (Roles: authenticated)
- **Users can view their own attempts**: SELECT (Roles: authenticated)
- **comp_attempts_admin_read**: SELECT (Roles: public)
- **comp_attempts_user_all**: ALL (Roles: public)

---

### `comprehensive_exams`
Comprehensive exams created by teachers or admins.

**Columns**
- `id` (uuid, PK): Unique identifier.
- `title` (text): Exam title.
- `description` (text): Description.
- `stage_id` (uuid, FK): Reference to `educational_stages`.
- `subject_id` (uuid, FK): Reference to `subjects`.
- `semester` (semester_type): Semester (first, second, full_year).
- `duration_minutes` (integer): Duration in minutes.
- `passing_score` (integer): Passing score.
- `is_published` (boolean): Publication status.
- `created_by` (uuid, FK): Creator ID.
- `created_at` (timestamptz): Creation timestamp.
- `sections` (jsonb): Exam sections structure.
- `blocks` (jsonb): Block structure.
- `branch_tags` (text[]): Branch tags.
- `grading_mode` (text): Default 'automatic'.
- `usage_scope` (text): Default 'public'.

**RLS Policies**
- **Authenticated can view exams**: SELECT (Roles: authenticated)
- **Public can view published exams**: SELECT (Roles: anon)
- **Teachers can delete their own exams**: DELETE (Roles: authenticated)
- **Teachers can insert their own exams**: INSERT (Roles: authenticated)
- **Teachers can update their own exams**: UPDATE (Roles: authenticated)
- **comp_exams_admin_all**: ALL (Roles: public)
- **comp_exams_public_read**: SELECT (Roles: public)

---

### `educational_stages`
Educational stages (e.g., Primary, Secondary).

**Columns**
- `id` (uuid, PK): Unique identifier.
- `name` (text): English name.
- `arabic_name` (text): Arabic name.
- `slug` (text): URL-friendly slug.
- `order_index` (integer): Display order.
- `image_url` (text): Image URL.

**RLS Policies**
- **stages_admin_all**: ALL (Roles: public)
- **stages_public_read**: SELECT (Roles: public)

---

### `lessons`
Lessons content.

**Columns**
- `id` (uuid, PK): Unique identifier.
- `title` (text): Lesson title.
- `description` (text): content description.
- `subject_id` (uuid, FK): Reference to `subjects`.
- `stage_id` (uuid, FK): Reference to `educational_stages`.
- `semester` (semester_type): Semester.
- `content` (jsonb): Lesson content (rich text/blocks).
- `video_url` (text): Video link.
- `thumbnail_url` (text): Thumbnail image.
- `is_published` (boolean): Default false.
- `order_index` (integer): Ordering.
- `created_by` (uuid, FK): Creator ID.
- `created_at` (timestamptz): Creation timestamp.
- `views_count` (integer): Number of views.
- `likes_count` (integer): Number of likes.
- `updated_at` (timestamptz): Update timestamp.

**RLS Policies**
- **lessons_admin_manage**: ALL (Roles: public)
- **lessons_read_published**: SELECT (Roles: public)

---

### `messages`
General messages/contact.

**Columns**
- `id` (uuid, PK): Unique identifier.
- `name` (text): Sender name.
- `email` (text): Sender email.
- `subject` (text): Subject line.
- `message` (text): Message body.
- `created_at` (timestamptz): Creation timestamp.
- `is_read` (boolean): Read status.
- `reply_text` (text): Admin reply.
- `replied_at` (timestamptz): Reply timestamp.

**RLS Policies**
- **messages_admin_all**: ALL (Roles: public)
- **messages_insert**: INSERT (Roles: public)

---

### `notification_preferences`
User preferences for notifications.

**Columns**
- `id` (uuid, PK): Unique identifier.
- `user_id` (uuid, FK): Reference to `profiles`.
- `email_notifications` (boolean): Enable/disable email notifications.
- `push_notifications` (boolean): Enable/disable push notifications.

**RLS Policies**
- **notification_prefs_user_all**: ALL (Roles: public)

---

### `notifications`
System notifications.

**Columns**
- `id` (uuid, PK): Unique identifier.
- `user_id` (uuid, FK): Target user (nullable for broadcast).
- `title` (text): Notification title.
- `message` (text): Notification body.
- `type` (text): Notification type (info, warning, etc).
- `is_read` (boolean): Read status.
- `created_at` (timestamptz): Creation timestamp.
- `link` (text): Action link.
- `target_role` (text): Target role (e.g. 'student', 'teacher', 'all').
- `status` (text): Status.

**RLS Policies**
- **Admins can delete notifications**: DELETE (Roles: authenticated)
- **Admins can insert notifications**: INSERT (Roles: authenticated)
- **Admins can update all notifications**: UPDATE (Roles: authenticated)
- **Admins can view all notifications**: SELECT (Roles: authenticated)
- **System can insert notifications**: INSERT (Roles: service_role)
- **Users can update their own notifications**: UPDATE (Roles: authenticated)
- **Users can view role-targeted notifications**: SELECT (Roles: authenticated)
- **Users can view their own notifications**: SELECT (Roles: authenticated)

---

### `page_words`
Words extracted from pages for translation/highlighting.

**Columns**
- `id` (uuid, PK): Unique identifier.
- `page_id` (text): Page identifier/URL.
- `word_text` (text): The word itself.
- `language_code` (text): Language (e.g. 'en').
- `created_at` (timestamptz): Creation timestamp.
- `updated_at` (timestamptz): Update timestamp.

**RLS Policies**
- **page_words_admin_all**: ALL (Roles: public)
- **page_words_select_active**: SELECT (Roles: public)

---

### `profiles`
User profiles (Students, Teachers, Admins).

**Columns**
- `id` (uuid, PK): References `auth.users`.
- `email` (text): User email.
- `full_name` (text): Full name.
- `avatar_url` (text): Avatar image.
- `role` (user_role): Role (student, teacher, admin).
- `educational_stage_id` (uuid): FK to `educational_stages` (for students).
- `phone` (text): Phone number.
- `bio` (text): Biography.
- `created_at` (timestamptz): Creation timestamp.
- `updated_at` (timestamptz): Update timestamp.
- `is_teacher_approved` (boolean): Teacher approval status.
- `is_verified` (boolean): Verification status.
- `specialization` (text): Teacher specialization.
- `cover_image_url` (text): Profile cover.
- `rating_count` (integer): Number of ratings.
- `average_rating` (numeric): Average rating.
- `teacher_title` (text): Professional title.
- `years_of_experience` (integer): Years of experience.
- `teaching_style` (text): Description of style.
- `subjects` (text[]): Array of subjects taught.
- `stages` (text[]): Array of stages taught.
- `social_links` (jsonb): Social media links.
- `is_teacher_profile_public` (boolean): Visibility.

**RLS Policies**
- **profiles_admin_all**: ALL (Roles: authenticated)
- **profiles_admin_read_all**: SELECT (Roles: authenticated)
- **profiles_admin_update**: UPDATE (Roles: authenticated)
- **profiles_insert_own**: INSERT (Roles: public)
- **profiles_read_all**: SELECT (Roles: public)
- **profiles_update_own**: UPDATE (Roles: public)

---

### `question_banks`
Repository of questions.

**Columns**
- `id` (uuid, PK): Unique identifier.
- `question_text` (text): Question body.
- `question_type` (text): Type (mcq, true_false, etc).
- `options` (jsonb): Answer options.
- `correct_answer` (text): Correct answer key/text.
- `explanation` (text): Answer explanation.
- `subject_id` (uuid, FK):FK to `subjects`.
- `stage_id` (uuid, FK): FK to `educational_stages`.
- `semester` (semester_type): Semester.
- `difficulty` (text): Difficulty level.
- `created_by` (uuid): Creator ID.
- `is_active` (boolean): Active status.
- `created_at` (timestamptz): Creation timestamp.
- `updated_at` (timestamptz): Update timestamp.

**RLS Policies**
- **Enable delete for authenticated users**: DELETE
- **Enable insert for authenticated users**: INSERT
- **Enable read for all users**: SELECT
- **Enable update for authenticated users**: UPDATE

---

### `quiz_questions`
Questions specifically for quizzes/lessons.

**Columns**
- `id` (uuid, PK): Unique identifier.
- `quiz_id` (uuid): (Note: might be linked via lesson or separate quiz table).
- `lesson_id` (uuid, FK): FK to `lessons` (optional).
- `question_text` (text): Question body.
- `type` (text): Question type.
- `options` (jsonb): Options.
- `correct_answer` (text): Correct answer.
- `points` (integer): Points for the question.
- `order_index` (integer): Order in quiz.
- `is_active` (boolean): Active status.
- `created_at` (timestamptz): Creation timestamp.
- `updated_at` (timestamptz): Update timestamp.
- `difficulty` (text): Difficulty.
- `group_id` (text): Grouping ID.
- `section_title` (jsonb): Section info.
- `stage_id` (uuid): Extracted stage.
- `subject_id` (uuid): Extracted subject.
- `language` (text): Content language.
- `category` (text): Category.
- `metadata` (jsonb): Extra metadata.

**RLS Policies**
- **questions_admin_manage**: ALL (Roles: public)
- **questions_read_all**: SELECT (Roles: public)
- **quiz_questions_delete_policy**: DELETE (Roles: public)
- **quiz_questions_insert_policy**: INSERT (Roles: public)
- **quiz_questions_select_policy**: SELECT (Roles: public)
- **quiz_questions_update_policy**: UPDATE (Roles: public)

---

### `site_settings`
Global site configuration.

**Columns**
- `id` (uuid, PK): Unique.
- `key` (text): Unique key.
- `value` (jsonb): Value.
- `description` (text): Description.

**RLS Policies**
- **Allow admins to delete/insert/update**: authenticated (admin only).
- **Allow public to read**: SELECT (Roles: public).

---

### `subject_stages`
Junction table (many-to-many) for subjects and stages.

**Columns**
- `id` (uuid, PK): Unique.
- `subject_id` (uuid, FK): FK to `subjects`.
- `stage_id` (uuid, FK): FK to `educational_stages`.
- `is_active` (boolean): Status.

**RLS Policies**
- **subject_stages_manage**: Admin only (delete, insert, update).
- **subject_stages_select**: Public read.

---

### `subjects`
Academic subjects.

**Columns**
- `id` (uuid, PK): Unique.
- `name` (text): English name.
- `arabic_name` (text): Arabic name.
- `slug` (text): Slug.
- `code` (text): Subject code.
- `image_url` (text): Icon/Image.
- `stage_id` (uuid, FK): Default stage (optional).
- `updated_at` (timestamptz): Update time.

**RLS Policies**
- **subjects_admin_all**: ALL (Roles: public)
- **subjects_public_read**: SELECT (Roles: public)

---

### `support_chats`
Support chat sessions.

**Columns**
- `id` (uuid, PK): Unique.
- `user_id` (uuid, FK): FK to `profiles`.
- `status` (text): Status (open, closed).
- `created_at` (timestamptz): Creation time.
- `updated_at` (timestamptz): Update time.

**RLS Policies**
- **support_chats_admin_all**: ALL (Roles: public)
- **support_chats_user_create**: INSERT (Roles: public)
- **support_chats_user_own**: ALL (Roles: public)

---

### `supported_languages`
Languages supported by the platform.

**Columns**
- `code` (text, PK): 'ar', 'en', etc.
- `name` (text): Native name.
- `english_name` (text): English name.
- `is_active` (boolean): Status.
- `direction` (text): 'ltr' or 'rtl'.
- `updated_at` (timestamptz): Update time.

**RLS Policies**
- **languages_admin_all**: ALL (Roles: public)
- **languages_select_all**: SELECT (Roles: public)

---

### `teacher_exams`
Exams created by teachers.

**Columns**
- `id` (uuid, PK).
- `title` (text).
- `description` (text).
- `subject_id` (uuid, FK).
- `stage_id` (uuid, FK).
- `semester` (semester_type).
- `created_by` (uuid, FK): Teacher ID.
- `duration_minutes` (integer).
- `passing_score` (integer).
- `is_published` (boolean).
- `is_time_limited` (boolean).
- `available_from` (timestamptz).
- `available_until` (timestamptz).
- `questions` (jsonb, or link to table).
- `sections` (jsonb).
- `total_marks` (integer).
- `created_at` (timestamptz).
- `updated_at` (timestamptz).

**RLS Policies**
- **Teachers view/manage own exams**: authenticated.
- **Public view published**: anon/authenticated.

---

### `teacher_exam_attempts`
Attempts on teacher exams.

**Columns**
- `id` (uuid, PK).
- `exam_id` (uuid, FK).
- `student_id` (uuid, FK).
- `score` (integer).
- `answers` (jsonb).
- `started_at` (timestamptz).
- `submitted_at` (timestamptz).

**RLS Policies**
- **Teachers view attempts on own exams**.
- **Users manage own attempts**.

---

### `teacher_ratings`
Ratings for teachers.

**Columns**
- `id` (uuid, PK).
- `teacher_id` (uuid, FK).
- `user_id` (uuid, FK).
- `rating` (integer).
- `comment` (text).
- `created_at` (timestamptz).

**RLS Policies**
- **Manage own ratings**: authenticated.
- **View all**: public.

---

### `teacher_subscriptions`
Subscriptions to teachers.

**Columns**
- `id` (uuid, PK).
- `teacher_id` (uuid, FK).
- `user_id` (uuid, FK).
- `created_at` (timestamptz).

**RLS Policies**
- **Manage own subscriptions**: public/authenticated.
- **Read all**: public.

---

### `testimonials`
User testimonials.

**Columns**
- `id` (uuid, PK).
- `user_id` (uuid, FK).
- `content` (text).
- `rating` (integer).
- `status` (text): 'pending', 'approved', 'rejected'.
- `created_at` (timestamptz).

**RLS Policies**
- **Admins manage all**.
- **Users manage own**.
- **Public view approved**.

---

### `translation_cache`
Cache for translations.

**Columns**
- `id` (uuid, PK).
- `source_text` (text).
- `translated_text` (text).
- `source_lang` (text).
- `target_lang` (text).
- `provider` (text).
- `created_at` (timestamptz).

---

### `user_devices`
Track logged-in devices.

**Columns**
- `id` (uuid, PK).
- `user_id` (uuid, FK).
- `device_type` (text).
- `browser` (text).
- `os` (text).
- `ip_address` (text).
- `last_seen_at` (timestamptz).
- `is_current_device` (boolean).
- `login_count` (integer).
- `first_seen_at` (timestamptz).

**RLS Policies**
- **Admin all**.
- **User self manage**.

---

### `user_lesson_likes`
Likes on lessons.

**Columns**
- `id` (uuid, PK).
- `user_id` (uuid, FK).
- `lesson_id` (uuid, FK).
- `created_at` (timestamptz).

**RLS Policies**
- **Admins manage**.
- **Users manage own**.

---

### `user_lesson_progress`
Tracking lesson progress.

**Columns**
- `id` (uuid, PK).
- `user_id` (uuid, FK).
- `lesson_id` (uuid, FK).
- `progress` (integer): percentage.
- `completed` (boolean).
- `last_position` (integer): video timestamp etc.
- `updated_at` (timestamptz).

**RLS Policies**
- **progress_user_all**.

---

### `user_word_highlights`
Usage of highlighting words.

**Columns**
- `id` (uuid, PK).
- `user_id` (uuid, FK).
- `page_id` (text).
- `word_text` (text).
- `color` (text).
- `created_at` (timestamptz).
- `highlighted_words` (jsonb?).

---

### `visitor_devices`
Anonymous visitor tracking.

**Columns**
- `id` (uuid, PK).
- `visitor_id` (text).
- `device_info` (jsonb/columns).
- `last_seen_at` (timestamptz).
- `first_seen_at` (timestamptz).
- `country` (text).
- `city` (text).

---

### `word_bank` & `word_bank_translations` & `word_categories`
Vocabulary management.
