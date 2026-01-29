# أعمدة الجداول - Columns Schema

## profiles
| العمود | النوع | الافتراضي | NULL | الوصف |
|--------|-------|-----------|------|-------|
| id | uuid | - | ❌ | المفتاح الأساسي |
| email | text | - | ❌ | البريد الإلكتروني |
| name | text | - | ✅ | الاسم |
| role | user_role | 'student' | ✅ | الدور |
| avatar_url | text | - | ✅ | صورة الملف |
| bio | text | - | ✅ | نبذة |
| phone | text | - | ✅ | الهاتف |
| educational_stage_id | uuid | - | ✅ | المرحلة |
| exam_count | integer | 0 | ✅ | عدد الامتحانات |
| subscriber_count | integer | 0 | ✅ | عدد المشتركين |
| education | text | - | ✅ | المؤهل العلمي |
| website | text | - | ✅ | الموقع |
| teaching_style | text | - | ✅ | أسلوب التدريس |
| subjects | text[] | '{}' | ✅ | المواد |
| stages | text[] | '{}' | ✅ | المراحل |
| is_teacher_profile_public | boolean | false | ✅ | ظاهر للعامة |
| social_links | jsonb | '{}' | ✅ | روابط التواصل |
| created_at | timestamptz | now() | ✅ | تاريخ الإنشاء |
| updated_at | timestamptz | now() | ✅ | تاريخ التحديث |

---

## comprehensive_exams
| العمود | النوع | الافتراضي | NULL | الوصف |
|--------|-------|-----------|------|-------|
| id | uuid | gen_random_uuid() | ❌ | المفتاح الأساسي |
| exam_title | text | - | ❌ | العنوان |
| exam_description | text | - | ✅ | الوصف |
| stage_id | uuid | - | ✅ | المرحلة |
| subject_id | uuid | - | ✅ | المادة |
| sections | jsonb | - | ❌ | الأقسام |
| total_marks | integer | - | ✅ | مجموع الدرجات |
| duration_minutes | integer | 60 | ✅ | المدة |
| passing_score | integer | 60 | ✅ | درجة النجاح |
| is_published | boolean | false | ✅ | منشور |
| semester | semester_type | 'full_year' | ✅ | الفصل |
| created_by | uuid | - | ✅ | المنشئ |
| created_at | timestamptz | now() | ✅ | تاريخ الإنشاء |
| updated_at | timestamptz | now() | ✅ | تاريخ التحديث |

---

## comprehensive_exam_attempts
| العمود | النوع | الافتراضي | NULL | الوصف |
|--------|-------|-----------|------|-------|
| id | uuid | gen_random_uuid() | ❌ | المفتاح الأساسي |
| exam_id | uuid | - | ❌ | معرف الامتحان |
| student_id | uuid | - | ❌ | معرف الطالب |
| answers | jsonb | '{}' | ✅ | الإجابات |
| status | text | 'in_progress' | ✅ | الحالة |
| total_score | numeric | - | ✅ | الدرجة |
| max_score | numeric | - | ✅ | أقصى درجة |
| percentage | numeric | - | ✅ | النسبة |
| answered_count | integer | 0 | ✅ | المجاب |
| started_at | timestamptz | now() | ✅ | وقت البدء |
| completed_at | timestamptz | - | ✅ | وقت الإنهاء |
| created_at | timestamptz | now() | ✅ | تاريخ الإنشاء |
| updated_at | timestamptz | now() | ✅ | تاريخ التحديث |

---

## teacher_exams
| العمود | النوع | الافتراضي | NULL | الوصف |
|--------|-------|-----------|------|-------|
| id | uuid | gen_random_uuid() | ❌ | المفتاح الأساسي |
| exam_title | text | - | ❌ | العنوان |
| exam_description | text | - | ✅ | الوصف |
| created_by | uuid | - | ❌ | المعلم |
| stage_id | uuid | - | ✅ | المرحلة |
| sections | jsonb | - | ❌ | الأقسام |
| total_marks | integer | - | ✅ | مجموع الدرجات |
| duration_minutes | integer | 60 | ✅ | المدة |
| is_published | boolean | false | ✅ | منشور |
| available_from | timestamptz | - | ✅ | متاح من |
| available_until | timestamptz | - | ✅ | متاح حتى |
| semester | semester_type | 'full_year' | ✅ | الفصل |
| created_at | timestamptz | now() | ✅ | تاريخ الإنشاء |
| updated_at | timestamptz | now() | ✅ | تاريخ التحديث |

---

## teacher_exam_attempts
| العمود | النوع | الافتراضي | NULL | الوصف |
|--------|-------|-----------|------|-------|
| id | uuid | gen_random_uuid() | ❌ | المفتاح الأساسي |
| exam_id | uuid | - | ❌ | معرف الامتحان |
| student_id | uuid | - | ❌ | معرف الطالب |
| answers | jsonb | '{}' | ✅ | الإجابات |
| status | text | 'in_progress' | ✅ | الحالة |
| total_score | numeric | - | ✅ | الدرجة |
| max_score | numeric | - | ✅ | أقصى درجة |
| percentage | numeric | - | ✅ | النسبة |
| answered_count | integer | 0 | ✅ | المجاب |
| started_at | timestamptz | now() | ✅ | وقت البدء |
| completed_at | timestamptz | - | ✅ | وقت الإنهاء |

---

## question_banks
| العمود | النوع | الافتراضي | NULL | الوصف |
|--------|-------|-----------|------|-------|
| id | uuid | gen_random_uuid() | ❌ | المفتاح الأساسي |
| lesson_id | uuid | - | ❌ | معرف الدرس |
| stage_id | uuid | - | ✅ | المرحلة |
| title | jsonb | - | ❌ | العنوان {ar, en} |
| questions | jsonb | - | ❌ | الأسئلة |
| total_questions | integer | - | ✅ | عدد الأسئلة |
| total_marks | integer | - | ✅ | مجموع الدرجات |
| is_published | boolean | false | ✅ | منشور |
| created_at | timestamptz | now() | ✅ | تاريخ الإنشاء |
| updated_at | timestamptz | now() | ✅ | تاريخ التحديث |

---

## question_bank_attempts
| العمود | النوع | الافتراضي | NULL | الوصف |
|--------|-------|-----------|------|-------|
| id | uuid | gen_random_uuid() | ❌ | المفتاح الأساسي |
| question_bank_id | uuid | - | ❌ | معرف البنك |
| student_id | uuid | - | ❌ | معرف الطالب |
| answers | jsonb | '{}' | ✅ | الإجابات |
| status | text | 'in_progress' | ✅ | الحالة |
| answered_count | integer | 0 | ✅ | المجاب |
| correct_count | integer | 0 | ✅ | الصحيح |
| total_questions | integer | - | ✅ | الإجمالي |
| total_score | numeric | 0 | ✅ | الدرجة |
| max_score | numeric | 0 | ✅ | أقصى درجة |
| score_percentage | numeric | 0 | ✅ | النسبة |
| first_answered_at | timestamptz | - | ✅ | أول إجابة |
| last_answered_at | timestamptz | - | ✅ | آخر إجابة |
| completed_at | timestamptz | - | ✅ | وقت الإنهاء |

---

## lessons
| العمود | النوع | الافتراضي | NULL | الوصف |
|--------|-------|-----------|------|-------|
| id | uuid | gen_random_uuid() | ❌ | المفتاح الأساسي |
| title | text | - | ❌ | العنوان |
| description | text | - | ✅ | الوصف |
| content | text | - | ✅ | محتوى الدرس |
| image_url | text | - | ✅ | صورة الدرس |
| subject_id | uuid | - | ✅ | المادة |
| stage_id | uuid | - | ✅ | المرحلة |
| created_by | uuid | - | ✅ | المنشئ |
| order_index | integer | 0 | ✅ | الترتيب |
| is_published | boolean | false | ✅ | منشور |
| is_free | boolean | false | ✅ | مجاني |
| semester | semester_type | 'full_year' | ✅ | الفصل |
| created_at | timestamptz | now() | ✅ | تاريخ الإنشاء |
| updated_at | timestamptz | now() | ✅ | تاريخ التحديث |

---

## user_lesson_progress
| العمود | النوع | الافتراضي | NULL | الوصف |
|--------|-------|-----------|------|-------|
| id | uuid | gen_random_uuid() | ❌ | المفتاح الأساسي |
| user_id | uuid | - | ❌ | معرف المستخدم |
| lesson_id | uuid | - | ❌ | معرف الدرس |
| progress_percentage | integer | 0 | ✅ | نسبة التقدم |
| is_completed | boolean | false | ✅ | مكتمل |
| last_accessed_at | timestamptz | - | ✅ | آخر وصول |
| created_at | timestamptz | now() | ✅ | تاريخ الإنشاء |
| updated_at | timestamptz | now() | ✅ | تاريخ التحديث |

---

## app_settings
| العمود | النوع | الافتراضي | NULL | الوصف |
|--------|-------|-----------|------|-------|
| id | text | 'global' | ❌ | المفتاح الأساسي |
| show_first_semester | boolean | true | ✅ | عرض محتوى الترم الأول |
| show_second_semester | boolean | true | ✅ | عرض محتوى الترم الثاني |
| updated_at | timestamptz | now() | ✅ | تاريخ التحديث |
| updated_by | uuid | - | ✅ | المحدث |

---

## chat_messages
| العمود | النوع | الافتراضي | NULL | الوصف |
|--------|-------|-----------|------|-------|
| id | uuid | gen_random_uuid() | ❌ | المفتاح الأساسي |
| chat_id | uuid | - | ❌ | معرف المحادثة |
| sender_id | uuid | - | ✅ | معرف المرسل |
| sender_type | sender_type | - | ❌ | نوع المرسل |
| message | text | - | ❌ | نص الرسالة |
| is_read | boolean | false | ✅ | مقروءة |
| created_at | timestamptz | now() | ✅ | تاريخ الإنشاء |

---

## educational_stages
| العمود | النوع | الافتراضي | NULL | الوصف |
|--------|-------|-----------|------|-------|
| id | uuid | gen_random_uuid() | ❌ | المفتاح الأساسي |
| name | text | - | ❌ | الاسم |
| slug | text | - | ❌ | المعرف النصي |
| description | text | - | ✅ | الوصف |
| image_url | text | - | ✅ | الصورة |
| order_index | integer | 0 | ✅ | الترتيب |
| is_active | boolean | true | ✅ | نشط |
| created_at | timestamptz | now() | ✅ | تاريخ الإنشاء |
| updated_at | timestamptz | now() | ✅ | تاريخ التحديث |

---

## messages
| العمود | النوع | الافتراضي | NULL | الوصف |
|--------|-------|-----------|------|-------|
| id | uuid | gen_random_uuid() | ❌ | المفتاح الأساسي |
| from_user_id | uuid | - | ✅ | معرف المرسل |
| from_name | text | - | ❌ | اسم المرسل |
| from_email | text | - | ❌ | بريد المرسل |
| subject | text | - | ❌ | الموضوع |
| message | text | - | ❌ | الرسالة |
| is_read | boolean | false | ✅ | مقروءة |
| is_replied | boolean | false | ✅ | تم الرد |
| replied_at | timestamptz | - | ✅ | وقت الرد |
| is_archived | boolean | false | ✅ | مؤرشفة |
| replied_by | uuid | - | ✅ | المرد عليه |
| created_at | timestamptz | now() | ✅ | تاريخ الإنشاء |

---

## notification_preferences
| العمود | النوع | الافتراضي | NULL | الوصف |
|--------|-------|-----------|------|-------|
| id | uuid | gen_random_uuid() | ❌ | المفتاح الأساسي |
| user_id | uuid | - | ❌ | معرف المستخدم |
| email_notifications | boolean | true | ✅ | إشعارات البريد |
| push_notifications | boolean | true | ✅ | إشعارات الدفع |
| exam_reminders | boolean | true | ✅ | تذكيرات الامتحانات |
| lesson_updates | boolean | true | ✅ | تحديثات الدروس |
| created_at | timestamptz | now() | ✅ | تاريخ الإنشاء |
| updated_at | timestamptz | now() | ✅ | تاريخ التحديث |

---

## notifications
| العمود | النوع | الافتراضي | NULL | الوصف |
|--------|-------|-----------|------|-------|
| id | uuid | gen_random_uuid() | ❌ | المفتاح الأساسي |
| title | text | - | ❌ | العنوان |
| message | text | - | ❌ | الرسالة |
| user_id | uuid | - | ✅ | معرف المستخدم |
| created_by | uuid | - | ✅ | المنشئ |
| type | notification_type | - | ✅ | النوع |
| status | notification_status | 'pending' | ✅ | الحالة |
| is_read | boolean | false | ✅ | مقروءة |
| target_role | notification_target_role | - | ✅ | الفئة المستهدفة |
| sent_at | timestamptz | - | ✅ | وقت الإرسال |
| created_at | timestamptz | now() | ✅ | تاريخ الإنشاء |

---

## page_words
| العمود | النوع | الافتراضي | NULL | الوصف |
|--------|-------|-----------|------|-------|
| id | uuid | gen_random_uuid() | ❌ | المفتاح الأساسي |
| word_id | varchar(20) | - | ❌ | معرف الكلمة |
| page_id | varchar(100) | - | ❌ | معرف الصفحة |
| language_code | varchar(10) | - | ❌ | كود اللغة |
| word_text | text | - | ❌ | نص الكلمة |
| word_position | integer | - | ✅ | موقع الكلمة |
| word_context | text | - | ✅ | سياق الكلمة |
| is_active | boolean | true | ✅ | نشط |
| created_at | timestamptz | now() | ✅ | تاريخ الإنشاء |
| updated_at | timestamptz | now() | ✅ | تاريخ التحديث |

---

## quiz_questions
| العمود | النوع | الافتراضي | NULL | الوصف |
|--------|-------|-----------|------|-------|
| id | uuid | gen_random_uuid() | ❌ | المفتاح الأساسي |
| lesson_id | uuid | - | ✅ | معرف الدرس (اختياري للأسئلة المستقلة) |
| created_by | uuid | - | ✅ | المنشئ |
| text | jsonb | '{"ar": "", "en": ""}' | ✅ | نص السؤال |
| type | text | - | ✅ | نوع السؤال |
| options | jsonb | - | ✅ | الخيارات |
| correct_option_id | text | - | ✅ | معرف الإجابة الصحيحة |
| correct_answer | jsonb | - | ✅ | الإجابة الصحيحة |
| explanation | jsonb | - | ✅ | الشرح |
| hint | jsonb | - | ✅ | تلميح |
| media | jsonb | - | ✅ | الوسائط |
| points | integer | 1 | ✅ | النقاط |
| difficulty | text | 'medium' | ✅ | الصعوبة |
| is_published | boolean | false | ✅ | منشور |
| order_index | integer | 0 | ✅ | الترتيب |
| category | text | 'general' | ✅ | الفئة |
| language | text | 'ar' | ✅ | اللغة |
| stage_id | uuid | - | ✅ | المرحلة |
| subject_id | uuid | - | ✅ | المادة |
| metadata | jsonb | '{}' | ✅ | بيانات إضافية |
| created_at | timestamptz | now() | ✅ | تاريخ الإنشاء |
| updated_at | timestamptz | now() | ✅ | تاريخ التحديث |

---

## site_settings
| العمود | النوع | الافتراضي | NULL | الوصف |
|--------|-------|-----------|------|-------|
| id | uuid | gen_random_uuid() | ❌ | المفتاح الأساسي |
| key | text | - | ❌ | المفتاح |
| value | jsonb | - | ✅ | القيمة |
| description | text | - | ✅ | الوصف |
| created_at | timestamptz | now() | ✅ | تاريخ الإنشاء |
| updated_at | timestamptz | now() | ✅ | تاريخ التحديث |

---

## subject_stages
| العمود | النوع | الافتراضي | NULL | الوصف |
|--------|-------|-----------|------|-------|
| id | uuid | gen_random_uuid() | ❌ | المفتاح الأساسي |
| subject_id | uuid | - | ❌ | معرف المادة |
| stage_id | uuid | - | ❌ | معرف المرحلة |
| is_active | boolean | true | ✅ | نشط |

---

## subjects
| العمود | النوع | الافتراضي | NULL | الوصف |
|--------|-------|-----------|------|-------|
| id | uuid | gen_random_uuid() | ❌ | المفتاح الأساسي |
| name | text | - | ❌ | الاسم |
| slug | text | - | ❌ | المعرف النصي |
| description | text | - | ✅ | الوصف |
| icon | text | - | ✅ | الأيقونة |
| image_url | text | - | ✅ | الصورة |
| color | text | - | ✅ | اللون |
| stage_id | uuid | - | ✅ | المرحلة (قديم) |
| language | text | 'ar' | ✅ | اللغة |
| is_active | boolean | true | ✅ | نشط |
| created_at | timestamptz | now() | ✅ | تاريخ الإنشاء |
| updated_at | timestamptz | now() | ✅ | تاريخ التحديث |

---

## support_chats
| العمود | النوع | الافتراضي | NULL | الوصف |
|--------|-------|-----------|------|-------|
| id | uuid | gen_random_uuid() | ❌ | المفتاح الأساسي |
| user_id | uuid | - | ✅ | معرف المستخدم |
| status | text | 'open' | ✅ | الحالة |
| subject | text | - | ✅ | الموضوع |
| assigned_to | uuid | - | ✅ | المسند إليه |
| created_at | timestamptz | now() | ✅ | تاريخ الإنشاء |
| updated_at | timestamptz | now() | ✅ | تاريخ التحديث |

---

## supported_languages
| العمود | النوع | الافتراضي | NULL | الوصف |
|--------|-------|-----------|------|-------|
| code | varchar(10) | - | ❌ | كود اللغة (المفتاح الأساسي) |
| name_en | text | - | ❌ | الاسم بالإنجليزية |
| name_native | text | - | ❌ | الاسم الأصلي |
| name_ar | text | - | ✅ | الاسم بالعربية |
| text_direction | varchar | 'ltr' | ✅ | اتجاه النص |
| is_active | boolean | true | ✅ | نشط |
| tts_voice_id | text | - | ✅ | معرف صوت TTS |
| tts_locale | text | - | ✅ | لغة TTS |
| flag_emoji | text | - | ✅ | رمز العلم |
| sort_order | integer | 0 | ✅ | الترتيب |
| created_at | timestamptz | now() | ✅ | تاريخ الإنشاء |
| updated_at | timestamptz | now() | ✅ | تاريخ التحديث |

---

## teacher_ratings
| العمود | النوع | الافتراضي | NULL | الوصف |
|--------|-------|-----------|------|-------|
| id | uuid | gen_random_uuid() | ❌ | المفتاح الأساسي |
| user_id | uuid | - | ❌ | معرف المقيّم |
| teacher_id | uuid | - | ❌ | معرف المعلم |
| rating | integer | - | ❌ | التقييم (1-5) |
| comment | text | - | ✅ | التعليق |
| created_at | timestamptz | now() | ✅ | تاريخ الإنشاء |
| updated_at | timestamptz | now() | ✅ | تاريخ التحديث |

---

## teacher_subscriptions
| العمود | النوع | الافتراضي | NULL | الوصف |
|--------|-------|-----------|------|-------|
| id | uuid | gen_random_uuid() | ❌ | المفتاح الأساسي |
| user_id | uuid | - | ❌ | معرف الطالب |
| teacher_id | uuid | - | ❌ | معرف المعلم |
| created_at | timestamptz | now() | ✅ | تاريخ الاشتراك |

---

## testimonials
| العمود | النوع | الافتراضي | NULL | الوصف |
|--------|-------|-----------|------|-------|
| id | uuid | gen_random_uuid() | ❌ | المفتاح الأساسي |
| user_id | uuid | - | ❌ | معرف المستخدم |
| content | text | - | ❌ | المحتوى |
| rating | integer | 5 | ❌ | التقييم (1-5) |
| status | text | 'pending' | ✅ | الحالة |
| is_featured | boolean | false | ✅ | مميز |
| reviewed_by | uuid | - | ✅ | المراجع |
| reviewed_at | timestamptz | - | ✅ | وقت المراجعة |
| created_at | timestamptz | now() | ❌ | تاريخ الإنشاء |
| updated_at | timestamptz | now() | ❌ | تاريخ التحديث |

---

## translation_cache
| العمود | النوع | الافتراضي | NULL | الوصف |
|--------|-------|-----------|------|-------|
| id | uuid | gen_random_uuid() | ❌ | المفتاح الأساسي |
| source_text | text | - | ❌ | النص الأصلي |
| source_lang | varchar(10) | - | ❌ | لغة المصدر |
| target_lang | varchar(10) | - | ❌ | لغة الهدف |
| translated_text | text | - | ❌ | النص المترجم |
| provider | text | - | ✅ | مزود الترجمة |
| created_at | timestamptz | now() | ✅ | تاريخ الإنشاء |

---

## user_devices
| العمود | النوع | الافتراضي | NULL | الوصف |
|--------|-------|-----------|------|-------|
| id | uuid | gen_random_uuid() | ❌ | المفتاح الأساسي |
| user_id | uuid | - | ❌ | معرف المستخدم |
| device_type | device_type | 'unknown' | ✅ | نوع الجهاز |
| os_name | text | - | ✅ | نظام التشغيل |
| os_version | text | - | ✅ | إصدار النظام |
| browser_name | text | - | ✅ | المتصفح |
| browser_version | text | - | ✅ | إصدار المتصفح |
| ip_address | inet | - | ✅ | عنوان IP |
| user_agent | text | - | ✅ | User Agent |
| country | text | - | ✅ | البلد |
| city | text | - | ✅ | المدينة |
| last_active_at | timestamptz | now() | ✅ | آخر نشاط |
| created_at | timestamptz | now() | ✅ | تاريخ الإنشاء |

---

## user_lesson_likes
| العمود | النوع | الافتراضي | NULL | الوصف |
|--------|-------|-----------|------|-------|
| id | uuid | gen_random_uuid() | ❌ | المفتاح الأساسي |
| user_id | uuid | - | ❌ | معرف المستخدم |
| lesson_id | uuid | - | ❌ | معرف الدرس |
| created_at | timestamptz | now() | ✅ | تاريخ الإعجاب |

---

## user_word_highlights
| العمود | النوع | الافتراضي | NULL | الوصف |
|--------|-------|-----------|------|-------|
| id | uuid | gen_random_uuid() | ❌ | المفتاح الأساسي |
| user_id | uuid | - | ❌ | معرف المستخدم |
| highlighted_words | jsonb | '{}' | ✅ | الكلمات المحددة |
| updated_at | timestamptz | now() | ✅ | تاريخ التحديث |

---

## visitor_devices
| العمود | النوع | الافتراضي | NULL | الوصف |
|--------|-------|-----------|------|-------|
| id | uuid | gen_random_uuid() | ❌ | المفتاح الأساسي |
| visitor_id | text | - | ❌ | معرف الزائر |
| device_type | device_type | 'unknown' | ✅ | نوع الجهاز |
| os_name | text | - | ✅ | نظام التشغيل |
| os_version | text | - | ✅ | إصدار النظام |
| browser_name | text | - | ✅ | المتصفح |
| browser_version | text | - | ✅ | إصدار المتصفح |
| ip_address | inet | - | ✅ | عنوان IP |
| user_agent | text | - | ✅ | User Agent |
| page_url | text | - | ✅ | رابط الصفحة |
| referrer | text | - | ✅ | المصدر |
| created_at | timestamptz | now() | ✅ | تاريخ الإنشاء |
| updated_at | timestamptz | now() | ✅ | تاريخ التحديث |

---

## word_bank
| العمود | النوع | الافتراضي | NULL | الوصف |
|--------|-------|-----------|------|-------|
| id | uuid | gen_random_uuid() | ❌ | المفتاح الأساسي |
| language_code | varchar(10) | - | ❌ | كود اللغة |
| word_text | text | - | ❌ | نص الكلمة |
| word_definition | text | - | ✅ | التعريف |
| category_slug | text | - | ✅ | فئة الكلمة |
| difficulty_level | integer | 1 | ✅ | مستوى الصعوبة (1-5) |
| example_sentence | text | - | ✅ | جملة مثال |
| phonetic_text | text | - | ✅ | النطق |
| audio_url | text | - | ✅ | رابط الصوت |
| is_active | boolean | true | ✅ | نشط |
| created_at | timestamptz | now() | ✅ | تاريخ الإنشاء |
| updated_at | timestamptz | now() | ✅ | تاريخ التحديث |

---

## word_bank_translations
| العمود | النوع | الافتراضي | NULL | الوصف |
|--------|-------|-----------|------|-------|
| id | uuid | gen_random_uuid() | ❌ | المفتاح الأساسي |
| word_bank_id | uuid | - | ❌ | معرف الكلمة |
| target_language | varchar(10) | - | ❌ | لغة الهدف |
| translated_text | text | - | ❌ | النص المترجم |
| translated_definition | text | - | ✅ | التعريف المترجم |
| translated_example | text | - | ✅ | المثال المترجم |
| created_at | timestamptz | now() | ✅ | تاريخ الإنشاء |
| updated_at | timestamptz | now() | ✅ | تاريخ التحديث |

---

## word_categories
| العمود | النوع | الافتراضي | NULL | الوصف |
|--------|-------|-----------|------|-------|
| id | uuid | gen_random_uuid() | ❌ | المفتاح الأساسي |
| name_en | text | - | ❌ | الاسم بالإنجليزية |
| name_ar | text | - | ❌ | الاسم بالعربية |
| slug | text | - | ❌ | المعرف النصي |
| icon | text | - | ✅ | الأيقونة |
| color | text | - | ✅ | اللون |
| sort_order | integer | 0 | ✅ | الترتيب |
| is_active | boolean | true | ✅ | نشط |
| created_at | timestamptz | now() | ✅ | تاريخ الإنشاء |
| updated_at | timestamptz | now() | ✅ | تاريخ التحديث |

---

## هيكل JSONB للإجابات

```jsonb
// answers في جداول المحاولات
{
  "question_id_1": {
    "answer": "الإجابة",
    "answered_at": "2026-01-28T10:00:00Z",
    "time_spent_seconds": 30,
    "flagged": false,
    "auto": {
      "is_correct": true,
      "points_earned": 2,
      "max_points": 2
    },
    "manual": null
  }
}
```

```jsonb
// sections في جداول الامتحانات
{
  "sections": [
    {
      "id": "section-1",
      "title": {"ar": "القسم الأول", "en": "Section 1"},
      "questions": [
        {
          "id": "q-1",
          "type": "mcq",
          "text": {"ar": "السؤال", "en": "Question"},
          "options": [...],
          "correct_answer": "option-1",
          "points": 2
        }
      ]
    }
  ]
}
```
