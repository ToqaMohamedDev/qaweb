export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "13.0.5"
  }
  public: {
    Tables: {
      app_settings: {
        Row: {
          id: string
          show_first_semester: boolean
          show_second_semester: boolean
          updated_at: string | null
          updated_by: string | null
        }
        Insert: {
          id?: string
          show_first_semester?: boolean
          show_second_semester?: boolean
          updated_at?: string | null
          updated_by?: string | null
        }
        Update: {
          id?: string
          show_first_semester?: boolean
          show_second_semester?: boolean
          updated_at?: string | null
          updated_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "app_settings_updated_by_fkey"
            columns: ["updated_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          }
        ]
      }
      chat_messages: {
        Row: {
          chat_id: string
          created_at: string | null
          id: string
          is_ai_response: boolean | null
          message: string
          sender_id: string | null
          sender_type: Database["public"]["Enums"]["sender_type"]
        }
        Insert: {
          chat_id: string
          created_at?: string | null
          id?: string
          is_ai_response?: boolean | null
          message: string
          sender_id?: string | null
          sender_type: Database["public"]["Enums"]["sender_type"]
        }
        Update: {
          chat_id?: string
          created_at?: string | null
          id?: string
          is_ai_response?: boolean | null
          message?: string
          sender_id?: string | null
          sender_type?: Database["public"]["Enums"]["sender_type"]
        }
        Relationships: [
          {
            foreignKeyName: "chat_messages_chat_id_fkey"
            columns: ["chat_id"]
            isOneToOne: false
            referencedRelation: "support_chats"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "chat_messages_sender_id_fkey"
            columns: ["sender_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      comprehensive_exam_attempts: {
        Row: {
          answers: Json | null
          completed_at: string | null
          created_at: string | null
          exam_id: string
          id: string
          max_score: number | null
          started_at: string | null
          status: string | null
          student_id: string
          total_score: number | null
          updated_at: string | null
        }
        Insert: {
          answers?: Json | null
          completed_at?: string | null
          created_at?: string | null
          exam_id: string
          id?: string
          max_score?: number | null
          started_at?: string | null
          status?: string | null
          student_id: string
          total_score?: number | null
          updated_at?: string | null
        }
        Update: {
          answers?: Json | null
          completed_at?: string | null
          created_at?: string | null
          exam_id?: string
          id?: string
          max_score?: number | null
          started_at?: string | null
          status?: string | null
          student_id?: string
          total_score?: number | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "comprehensive_exam_attempts_exam_id_fkey"
            columns: ["exam_id"]
            isOneToOne: false
            referencedRelation: "comprehensive_exams"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "comprehensive_exam_attempts_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      comprehensive_exams: {
        Row: {
          blocks: Json | null
          branch_tags: string[] | null
          created_at: string | null
          created_by: string | null
          duration_minutes: number | null
          exam_description: string | null
          exam_title: string
          grading_mode: string | null
          id: string
          is_published: boolean | null
          language: string
          lesson_id: string | null
          passing_score: number | null
          sections: Json | null
          semester: Database["public"]["Enums"]["semester_type"] | null
          stage_id: string | null
          stage_name: string | null
          subject_id: string | null
          subject_name: string | null
          total_marks: number | null
          type: string
          updated_at: string | null
          usage_scope: string | null
        }
        Insert: {
          blocks?: Json | null
          branch_tags?: string[] | null
          created_at?: string | null
          created_by?: string | null
          duration_minutes?: number | null
          exam_description?: string | null
          exam_title: string
          grading_mode?: string | null
          id?: string
          is_published?: boolean | null
          language?: string
          lesson_id?: string | null
          passing_score?: number | null
          sections?: Json | null
          semester?: Database["public"]["Enums"]["semester_type"] | null
          stage_id?: string | null
          stage_name?: string | null
          subject_id?: string | null
          subject_name?: string | null
          total_marks?: number | null
          type: string
          updated_at?: string | null
          usage_scope?: string | null
        }
        Update: {
          blocks?: Json | null
          branch_tags?: string[] | null
          created_at?: string | null
          created_by?: string | null
          duration_minutes?: number | null
          exam_description?: string | null
          exam_title?: string
          grading_mode?: string | null
          id?: string
          is_published?: boolean | null
          language?: string
          lesson_id?: string | null
          passing_score?: number | null
          sections?: Json | null
          semester?: Database["public"]["Enums"]["semester_type"] | null
          stage_id?: string | null
          stage_name?: string | null
          subject_id?: string | null
          subject_name?: string | null
          total_marks?: number | null
          type?: string
          updated_at?: string | null
          usage_scope?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "comprehensive_exams_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "comprehensive_exams_lesson_id_fkey"
            columns: ["lesson_id"]
            isOneToOne: false
            referencedRelation: "lessons"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "comprehensive_exams_stage_id_fkey"
            columns: ["stage_id"]
            isOneToOne: false
            referencedRelation: "educational_stages"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "comprehensive_exams_subject_id_fkey"
            columns: ["subject_id"]
            isOneToOne: false
            referencedRelation: "subjects"
            referencedColumns: ["id"]
          },
        ]
      }
      educational_stages: {
        Row: {
          created_at: string | null
          description: string | null
          id: string
          image_url: string | null
          is_active: boolean | null
          name: string
          order_index: number | null
          slug: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          id?: string
          image_url?: string | null
          is_active?: boolean | null
          name: string
          order_index?: number | null
          slug: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          description?: string | null
          id?: string
          image_url?: string | null
          is_active?: boolean | null
          name?: string
          order_index?: number | null
          slug?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      question_banks: {
        Row: {
          id: string
          lesson_id: string
          stage_id: string | null
          subject_id: string | null
          title: Json | null
          description: Json | null
          content_type: string | null
          content_data: Json | null
          questions: Json | null
          total_questions: number | null
          total_points: number | null
          created_by: string | null
          is_active: boolean | null
          created_at: string | null
          updated_at: string | null
        }
        Insert: {
          id?: string
          lesson_id: string
          stage_id?: string | null
          subject_id?: string | null
          title?: Json | null
          description?: Json | null
          content_type?: string | null
          content_data?: Json | null
          questions?: Json | null
          total_questions?: number | null
          total_points?: number | null
          created_by?: string | null
          is_active?: boolean | null
          created_at?: string | null
          updated_at?: string | null
        }
        Update: {
          id?: string
          lesson_id?: string
          stage_id?: string | null
          subject_id?: string | null
          title?: Json | null
          description?: Json | null
          content_type?: string | null
          content_data?: Json | null
          questions?: Json | null
          total_questions?: number | null
          total_points?: number | null
          created_by?: string | null
          is_active?: boolean | null
          created_at?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "question_banks_lesson_id_fkey"
            columns: ["lesson_id"]
            isOneToOne: false
            referencedRelation: "lessons"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "question_banks_stage_id_fkey"
            columns: ["stage_id"]
            isOneToOne: false
            referencedRelation: "educational_stages"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "question_banks_subject_id_fkey"
            columns: ["subject_id"]
            isOneToOne: false
            referencedRelation: "subjects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "question_banks_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      quiz_questions: {
        Row: {
          correct_answer: Json | null
          correct_option_id: string | null
          created_at: string | null
          created_by: string | null
          difficulty: string | null
          explanation: Json | null
          hint: Json | null
          id: string
          is_active: boolean | null
          lesson_id: string | null
          category: string | null
          subject_id: string | null
          stage_id: string | null
          media: Json | null
          options: Json | null
          order_index: number | null
          points: number | null
          text: Json | null
          type: string | null
          updated_at: string | null
        }
        Insert: {
          correct_answer?: Json | null
          correct_option_id?: string | null
          created_at?: string | null
          created_by?: string | null
          difficulty?: string | null
          explanation?: Json | null
          hint?: Json | null
          id?: string
          is_active?: boolean | null
          lesson_id?: string | null
          category?: string | null
          subject_id?: string | null
          stage_id?: string | null
          media?: Json | null
          options?: Json | null
          order_index?: number | null
          points?: number | null
          text?: Json | null
          type?: string | null
          updated_at?: string | null
        }
        Update: {
          correct_answer?: Json | null
          correct_option_id?: string | null
          created_at?: string | null
          created_by?: string | null
          difficulty?: string | null
          explanation?: Json | null
          hint?: Json | null
          id?: string
          is_active?: boolean | null
          lesson_id?: string | null
          category?: string | null
          subject_id?: string | null
          stage_id?: string | null
          media?: Json | null
          options?: Json | null
          order_index?: number | null
          points?: number | null
          text?: Json | null
          type?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "quiz_questions_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "quiz_questions_lesson_id_fkey"
            columns: ["lesson_id"]
            isOneToOne: false
            referencedRelation: "lessons"
            referencedColumns: ["id"]
          },
        ]
      }
      lesson_questions: {
        Row: {
          correct_answer: Json | null
          correct_option_id: string | null
          created_at: string | null
          created_by: string | null
          difficulty: string | null
          explanation: Json | null
          hint: Json | null
          id: string
          is_active: boolean | null
          lesson_id: string | null
          category: string | null
          subject_id: string | null
          stage_id: string | null
          media: Json | null
          options: Json | null
          order_index: number | null
          points: number | null
          text: Json | null
          type: string | null
          updated_at: string | null
        }
        Insert: {
          correct_answer?: Json | null
          correct_option_id?: string | null
          created_at?: string | null
          created_by?: string | null
          difficulty?: string | null
          explanation?: Json | null
          hint?: Json | null
          id?: string
          is_active?: boolean | null
          lesson_id?: string | null
          category?: string | null
          subject_id?: string | null
          stage_id?: string | null
          media?: Json | null
          options?: Json | null
          order_index?: number | null
          points?: number | null
          text?: Json | null
          type?: string | null
          updated_at?: string | null
        }
        Update: {
          correct_answer?: Json | null
          correct_option_id?: string | null
          created_at?: string | null
          created_by?: string | null
          difficulty?: string | null
          explanation?: Json | null
          hint?: Json | null
          id?: string
          is_active?: boolean | null
          lesson_id?: string | null
          category?: string | null
          subject_id?: string | null
          stage_id?: string | null
          media?: Json | null
          options?: Json | null
          order_index?: number | null
          points?: number | null
          text?: Json | null
          type?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "quiz_questions_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "quiz_questions_lesson_id_fkey"
            columns: ["lesson_id"]
            isOneToOne: false
            referencedRelation: "lessons"
            referencedColumns: ["id"]
          },
        ]
      }
      lessons: {
        Row: {
          content: string | null
          created_at: string | null
          created_by: string | null
          description: string | null
          id: string
          image_url: string | null
          is_free: boolean | null
          is_published: boolean | null
          likes_count: number | null
          order_index: number | null
          semester: Database["public"]["Enums"]["semester_type"] | null
          stage_id: string | null
          subject_id: string
          title: string
          updated_at: string | null
          views_count: number | null
        }
        Insert: {
          content?: string | null
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          id?: string
          image_url?: string | null
          is_free?: boolean | null
          is_published?: boolean | null
          likes_count?: number | null
          order_index?: number | null
          semester?: Database["public"]["Enums"]["semester_type"] | null
          stage_id?: string | null
          subject_id: string
          title: string
          updated_at?: string | null
          views_count?: number | null
        }
        Update: {
          content?: string | null
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          id?: string
          image_url?: string | null
          is_free?: boolean | null
          is_published?: boolean | null
          likes_count?: number | null
          order_index?: number | null
          semester?: Database["public"]["Enums"]["semester_type"] | null
          stage_id?: string | null
          subject_id?: string
          title?: string
          updated_at?: string | null
          views_count?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "lessons_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lessons_stage_id_fkey"
            columns: ["stage_id"]
            isOneToOne: false
            referencedRelation: "educational_stages"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lessons_subject_id_fkey"
            columns: ["subject_id"]
            isOneToOne: false
            referencedRelation: "subjects"
            referencedColumns: ["id"]
          },
        ]
      }
      messages: {
        Row: {
          created_at: string | null
          from_email: string
          from_name: string
          from_user_id: string | null
          id: string
          is_archived: boolean | null
          is_read: boolean | null
          is_replied: boolean | null
          is_starred: boolean | null
          message: string
          replied_at: string | null
          replied_by: string | null
          reply_text: string | null
          subject: string
        }
        Insert: {
          created_at?: string | null
          from_email: string
          from_name: string
          from_user_id?: string | null
          id?: string
          is_archived?: boolean | null
          is_read?: boolean | null
          is_replied?: boolean | null
          is_starred?: boolean | null
          message: string
          replied_at?: string | null
          replied_by?: string | null
          reply_text?: string | null
          subject: string
        }
        Update: {
          created_at?: string | null
          from_email?: string
          from_name?: string
          from_user_id?: string | null
          id?: string
          is_archived?: boolean | null
          is_read?: boolean | null
          is_replied?: boolean | null
          is_starred?: boolean | null
          message?: string
          replied_at?: string | null
          replied_by?: string | null
          reply_text?: string | null
          subject?: string
        }
        Relationships: [
          {
            foreignKeyName: "messages_from_user_id_fkey"
            columns: ["from_user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "messages_replied_by_fkey"
            columns: ["replied_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      notification_preferences: {
        Row: {
          created_at: string | null
          email_notifications: boolean | null
          exam_reminders: boolean | null
          id: string
          new_content_alerts: boolean | null
          push_notifications: boolean | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          email_notifications?: boolean | null
          exam_reminders?: boolean | null
          id?: string
          new_content_alerts?: boolean | null
          push_notifications?: boolean | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          email_notifications?: boolean | null
          exam_reminders?: boolean | null
          id?: string
          new_content_alerts?: boolean | null
          push_notifications?: boolean | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "notification_preferences_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      notifications: {
        Row: {
          created_at: string | null
          created_by: string | null
          id: string
          is_read: boolean | null
          message: string
          scheduled_for: string | null
          sent_at: string | null
          status: Database["public"]["Enums"]["notification_status"] | null
          target_role:
          | Database["public"]["Enums"]["notification_target_role"]
          | null
          title: string
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          created_by?: string | null
          id?: string
          is_read?: boolean | null
          message: string
          scheduled_for?: string | null
          sent_at?: string | null
          status?: Database["public"]["Enums"]["notification_status"] | null
          target_role?:
          | Database["public"]["Enums"]["notification_target_role"]
          | null
          title: string
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          created_by?: string | null
          id?: string
          is_read?: boolean | null
          message?: string
          scheduled_for?: string | null
          sent_at?: string | null
          status?: Database["public"]["Enums"]["notification_status"] | null
          target_role?:
          | Database["public"]["Enums"]["notification_target_role"]
          | null
          title?: string
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "notifications_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "notifications_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      dictionary: {
        Row: {
          concept_id: string
          word_family_root: string
          definition: string | null
          part_of_speech: string | null
          domains: Json | null
          lexical_entries: Json | null
          relations: Json | null
          created_at: string | null
          updated_at: string | null
        }
        Insert: {
          concept_id: string
          word_family_root: string
          definition?: string | null
          part_of_speech?: string | null
          domains?: Json | null
          lexical_entries?: Json | null
          relations?: Json | null
          created_at?: string | null
          updated_at?: string | null
        }
        Update: {
          concept_id?: string
          word_family_root?: string
          definition?: string | null
          part_of_speech?: string | null
          domains?: Json | null
          lexical_entries?: Json | null
          relations?: Json | null
          created_at?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      my_words: {
        Row: {
          id: string
          user_id: string
          concept_id: string
          notes: string | null
          is_favorite: boolean | null
          created_at: string | null
          updated_at: string | null
        }
        Insert: {
          id?: string
          user_id: string
          concept_id: string
          notes?: string | null
          is_favorite?: boolean | null
          created_at?: string | null
          updated_at?: string | null
        }
        Update: {
          id?: string
          user_id?: string
          concept_id?: string
          notes?: string | null
          is_favorite?: boolean | null
          created_at?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "my_words_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "my_words_concept_id_fkey"
            columns: ["concept_id"]
            isOneToOne: false
            referencedRelation: "dictionary"
            referencedColumns: ["concept_id"]
          },
        ]
      }
      page_words: {
        Row: {
          created_at: string | null
          id: string
          is_active: boolean | null
          language_code: string
          page_id: string
          updated_at: string | null
          word_context: string | null
          word_id: string
          word_position: number | null
          word_text: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          language_code: string
          page_id: string
          updated_at?: string | null
          word_context?: string | null
          word_id: string
          word_position?: number | null
          word_text: string
        }
        Update: {
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          language_code?: string
          page_id?: string
          updated_at?: string | null
          word_context?: string | null
          word_id?: string
          word_position?: number | null
          word_text?: string
        }
        Relationships: [
          {
            foreignKeyName: "page_words_language_code_fkey"
            columns: ["language_code"]
            isOneToOne: false
            referencedRelation: "supported_languages"
            referencedColumns: ["code"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          bio: string | null
          created_at: string | null
          educational_stage_id: string | null
          email: string
          id: string
          is_teacher_approved: boolean | null
          name: string | null
          phone: string | null
          rating_average: number | null
          rating_count: number | null
          role: Database["public"]["Enums"]["user_role"] | null
          role_selected: boolean | null
          subscriber_count: number | null
          updated_at: string | null
        }
        Insert: {
          avatar_url?: string | null
          bio?: string | null
          created_at?: string | null
          educational_stage_id?: string | null
          email: string
          id: string
          is_teacher_approved?: boolean | null
          name?: string | null
          phone?: string | null
          rating_average?: number | null
          rating_count?: number | null
          role?: Database["public"]["Enums"]["user_role"] | null
          role_selected?: boolean | null
          subscriber_count?: number | null
          updated_at?: string | null
        }
        Update: {
          avatar_url?: string | null
          bio?: string | null
          created_at?: string | null
          educational_stage_id?: string | null
          email?: string
          id?: string
          is_teacher_approved?: boolean | null
          name?: string | null
          phone?: string | null
          rating_average?: number | null
          rating_count?: number | null
          role?: Database["public"]["Enums"]["user_role"] | null
          role_selected?: boolean | null
          subscriber_count?: number | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "profiles_educational_stage_id_fkey"
            columns: ["educational_stage_id"]
            isOneToOne: false
            referencedRelation: "educational_stages"
            referencedColumns: ["id"]
          }
        ]
      }
      site_settings: {
        Row: {
          created_at: string | null
          description: string | null
          id: string
          key: string
          updated_at: string | null
          value: Json | null
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          id?: string
          key: string
          updated_at?: string | null
          value?: Json | null
        }
        Update: {
          created_at?: string | null
          description?: string | null
          id?: string
          key?: string
          updated_at?: string | null
          value?: Json | null
        }
        Relationships: []
      }
      subjects: {
        Row: {
          color: string | null
          created_at: string | null
          description: string | null
          icon: string | null
          id: string
          image_url: string | null
          is_active: boolean | null
          name: string
          order_index: number | null
          slug: string
          stage_id: string | null
          updated_at: string | null
        }
        Insert: {
          color?: string | null
          created_at?: string | null
          description?: string | null
          icon?: string | null
          id?: string
          image_url?: string | null
          is_active?: boolean | null
          name: string
          order_index?: number | null
          slug: string
          stage_id?: string | null
          updated_at?: string | null
        }
        Update: {
          color?: string | null
          created_at?: string | null
          description?: string | null
          icon?: string | null
          id?: string
          image_url?: string | null
          is_active?: boolean | null
          name?: string
          order_index?: number | null
          slug?: string
          stage_id?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "subjects_stage_id_fkey"
            columns: ["stage_id"]
            isOneToOne: false
            referencedRelation: "educational_stages"
            referencedColumns: ["id"]
          },
        ]
      }
      support_chats: {
        Row: {
          assigned_to: string | null
          created_at: string | null
          id: string
          status: string | null
          subject: string | null
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          assigned_to?: string | null
          created_at?: string | null
          id?: string
          status?: string | null
          subject?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          assigned_to?: string | null
          created_at?: string | null
          id?: string
          status?: string | null
          subject?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "support_chats_assigned_to_fkey"
            columns: ["assigned_to"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "support_chats_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      supported_languages: {
        Row: {
          code: string
          created_at: string | null
          flag_emoji: string | null
          is_active: boolean | null
          name_ar: string | null
          name_en: string
          name_native: string
          sort_order: number | null
          text_direction: string
          tts_locale: string | null
          tts_voice_id: string | null
          updated_at: string | null
        }
        Insert: {
          code: string
          created_at?: string | null
          flag_emoji?: string | null
          is_active?: boolean | null
          name_ar?: string | null
          name_en: string
          name_native: string
          sort_order?: number | null
          text_direction?: string
          tts_locale?: string | null
          tts_voice_id?: string | null
          updated_at?: string | null
        }
        Update: {
          code?: string
          created_at?: string | null
          flag_emoji?: string | null
          is_active?: boolean | null
          name_ar?: string | null
          name_en?: string
          name_native?: string
          sort_order?: number | null
          text_direction?: string
          tts_locale?: string | null
          tts_voice_id?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      teacher_exam_attempts: {
        Row: {
          answers: Json | null
          completed_at: string | null
          created_at: string | null
          exam_id: string
          id: string
          max_score: number | null
          started_at: string | null
          status: string | null
          student_id: string
          total_score: number | null
          updated_at: string | null
        }
        Insert: {
          answers?: Json | null
          completed_at?: string | null
          created_at?: string | null
          exam_id: string
          id?: string
          max_score?: number | null
          started_at?: string | null
          status?: string | null
          student_id: string
          total_score?: number | null
          updated_at?: string | null
        }
        Update: {
          answers?: Json | null
          completed_at?: string | null
          created_at?: string | null
          exam_id?: string
          id?: string
          max_score?: number | null
          started_at?: string | null
          status?: string | null
          student_id?: string
          total_score?: number | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "teacher_exam_attempts_exam_id_fkey"
            columns: ["exam_id"]
            isOneToOne: false
            referencedRelation: "teacher_exams"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "teacher_exam_attempts_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      teacher_exams: {
        Row: {
          available_from: string | null
          available_until: string | null
          blocks: Json | null
          created_at: string | null
          created_by: string
          duration_minutes: number | null
          exam_description: string | null
          exam_title: string
          id: string
          is_published: boolean | null
          is_time_limited: boolean | null
          language: string
          passing_score: number | null
          sections: Json | null
          semester: Database["public"]["Enums"]["semester_type"] | null
          stage_id: string | null
          stage_name: string | null
          subject_id: string | null
          subject_name: string | null
          total_marks: number | null
          type: string
          updated_at: string | null
        }
        Insert: {
          available_from?: string | null
          available_until?: string | null
          blocks?: Json | null
          created_at?: string | null
          created_by: string
          duration_minutes?: number | null
          exam_description?: string | null
          exam_title: string
          id?: string
          is_published?: boolean | null
          is_time_limited?: boolean | null
          language?: string
          passing_score?: number | null
          sections?: Json | null
          semester?: Database["public"]["Enums"]["semester_type"] | null
          stage_id?: string | null
          stage_name?: string | null
          subject_id?: string | null
          subject_name?: string | null
          total_marks?: number | null
          type?: string
          updated_at?: string | null
        }
        Update: {
          available_from?: string | null
          available_until?: string | null
          blocks?: Json | null
          created_at?: string | null
          created_by?: string
          duration_minutes?: number | null
          exam_description?: string | null
          exam_title?: string
          id?: string
          is_published?: boolean | null
          is_time_limited?: boolean | null
          language?: string
          passing_score?: number | null
          sections?: Json | null
          semester?: Database["public"]["Enums"]["semester_type"] | null
          stage_id?: string | null
          stage_name?: string | null
          subject_id?: string | null
          subject_name?: string | null
          total_marks?: number | null
          type?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "teacher_exams_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "teacher_exams_stage_id_fkey"
            columns: ["stage_id"]
            isOneToOne: false
            referencedRelation: "educational_stages"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "teacher_exams_subject_id_fkey"
            columns: ["subject_id"]
            isOneToOne: false
            referencedRelation: "subjects"
            referencedColumns: ["id"]
          },
        ]
      }
      teacher_ratings: {
        Row: {
          created_at: string | null
          id: string
          rating: number
          review: string | null
          teacher_id: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          rating: number
          review?: string | null
          teacher_id: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          rating?: number
          review?: string | null
          teacher_id?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "teacher_ratings_teacher_id_fkey"
            columns: ["teacher_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "teacher_ratings_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      teacher_subscriptions: {
        Row: {
          created_at: string | null
          id: string
          teacher_id: string
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          teacher_id: string
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          teacher_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "teacher_subscriptions_teacher_id_fkey"
            columns: ["teacher_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "teacher_subscriptions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      user_devices: {
        Row: {
          browser: string | null
          browser_version: string | null
          city: string | null
          country: string | null
          device_type: Database["public"]["Enums"]["device_type"] | null
          first_seen_at: string | null
          id: string
          ip_address: unknown
          is_current_device: boolean | null
          last_seen_at: string | null
          login_count: number | null
          os_name: string | null
          os_version: string | null
          user_agent: string | null
          user_id: string
        }
        Insert: {
          browser?: string | null
          browser_version?: string | null
          city?: string | null
          country?: string | null
          device_type?: Database["public"]["Enums"]["device_type"] | null
          first_seen_at?: string | null
          id?: string
          ip_address?: unknown
          is_current_device?: boolean | null
          last_seen_at?: string | null
          login_count?: number | null
          os_name?: string | null
          os_version?: string | null
          user_agent?: string | null
          user_id: string
        }
        Update: {
          browser?: string | null
          browser_version?: string | null
          city?: string | null
          country?: string | null
          device_type?: Database["public"]["Enums"]["device_type"] | null
          first_seen_at?: string | null
          id?: string
          ip_address?: unknown
          is_current_device?: boolean | null
          last_seen_at?: string | null
          login_count?: number | null
          os_name?: string | null
          os_version?: string | null
          user_agent?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_devices_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      user_lesson_progress: {
        Row: {
          created_at: string | null
          id: string
          is_completed: boolean | null
          last_position: number | null
          lesson_id: string
          progress_percentage: number | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          is_completed?: boolean | null
          last_position?: number | null
          lesson_id: string
          progress_percentage?: number | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          is_completed?: boolean | null
          last_position?: number | null
          lesson_id?: string
          progress_percentage?: number | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_lesson_progress_lesson_id_fkey"
            columns: ["lesson_id"]
            isOneToOne: false
            referencedRelation: "lessons"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_lesson_progress_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      visitor_devices: {
        Row: {
          browser: string | null
          browser_version: string | null
          city: string | null
          country: string | null
          device_type: Database["public"]["Enums"]["device_type"] | null
          first_seen_at: string | null
          id: string
          ip_address: unknown
          last_seen_at: string | null
          os_name: string | null
          os_version: string | null
          page_url: string | null
          referrer: string | null
          user_agent: string | null
          visitor_id: string
        }
        Insert: {
          browser?: string | null
          browser_version?: string | null
          city?: string | null
          country?: string | null
          device_type?: Database["public"]["Enums"]["device_type"] | null
          first_seen_at?: string | null
          id?: string
          ip_address?: unknown
          last_seen_at?: string | null
          os_name?: string | null
          os_version?: string | null
          page_url?: string | null
          referrer?: string | null
          user_agent?: string | null
          visitor_id: string
        }
        Update: {
          browser?: string | null
          browser_version?: string | null
          city?: string | null
          country?: string | null
          device_type?: Database["public"]["Enums"]["device_type"] | null
          first_seen_at?: string | null
          id?: string
          ip_address?: unknown
          last_seen_at?: string | null
          os_name?: string | null
          os_version?: string | null
          page_url?: string | null
          referrer?: string | null
          user_agent?: string | null
          visitor_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      get_unread_notification_count: { Args: never; Returns: number }
      get_user_role: {
        Args: never
        Returns: Database["public"]["Enums"]["user_role"]
      }
      upsert_user_device: {
        Args: {
          p_browser: string
          p_browser_version: string
          p_city?: string
          p_country?: string
          p_device_type: string
          p_ip_address: string
          p_os_name: string
          p_os_version: string
          p_user_agent: string
          p_user_id: string
        }
        Returns: string
      }
      upsert_visitor_device: {
        Args: {
          p_browser: string
          p_browser_version: string
          p_city: string
          p_country: string
          p_device_type: string
          p_ip_address: string
          p_os_name: string
          p_os_version: string
          p_page_url: string
          p_referrer: string
          p_user_agent: string
          p_visitor_id: string
        }
        Returns: string
      }
    }
    Enums: {
      chat_sender_type: "user" | "admin" | "ai"
      device_type: "mobile" | "desktop" | "tablet" | "unknown"
      exam_type: "quiz" | "midterm" | "final" | "practice"
      notification_status: "pending" | "sent" | "failed"
      notification_target_role: "all" | "students" | "teachers" | "admins"
      notification_type:
      | "system"
      | "exam"
      | "lesson"
      | "message"
      | "subscription"
      sender_type: "user" | "admin" | "system"
      support_chat_status: "open" | "closed" | "pending"
      user_role: "student" | "teacher" | "admin"
      semester_type: "first" | "second" | "full_year"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
  | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
  | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
  ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
    DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
  : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
    DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
  ? R
  : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
    DefaultSchema["Views"])
  ? (DefaultSchema["Tables"] &
    DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
      Row: infer R
    }
  ? R
  : never
  : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
  | keyof DefaultSchema["Tables"]
  | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
  ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
  : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
    Insert: infer I
  }
  ? I
  : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
  ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
    Insert: infer I
  }
  ? I
  : never
  : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
  | keyof DefaultSchema["Tables"]
  | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
  ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
  : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
    Update: infer U
  }
  ? U
  : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
  ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
    Update: infer U
  }
  ? U
  : never
  : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
  | keyof DefaultSchema["Enums"]
  | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
  ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
  : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
  ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
  : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
  | keyof DefaultSchema["CompositeTypes"]
  | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
  ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
  : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
  ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
  : never

export const Constants = {
  public: {
    Enums: {
      chat_sender_type: ["user", "admin", "ai"],
      device_type: ["mobile", "desktop", "tablet", "unknown"],
      exam_type: ["quiz", "midterm", "final", "practice"],
      notification_status: ["pending", "sent", "failed"],
      notification_target_role: ["all", "students", "teachers", "admins"],
      notification_type: [
        "system",
        "exam",
        "lesson",
        "message",
        "subscription",
      ],
      sender_type: ["user", "admin", "system"],
      support_chat_status: ["open", "closed", "pending"],
      user_role: ["student", "teacher", "admin"],
      semester_type: ["first", "second", "full_year"],
    },
  },
} as const

// Helper types for convenience
export type UserRole = Database['public']['Enums']['user_role'];
export type DeviceType = Database['public']['Enums']['device_type'];
export type ExamType = Database['public']['Enums']['exam_type'];
export type SenderType = Database['public']['Enums']['sender_type'];
export type NotificationStatus = Database['public']['Enums']['notification_status'];
export type NotificationTargetRole = Database['public']['Enums']['notification_target_role'];
export type SemesterType = Database['public']['Enums']['semester_type'];

// Table types
export type Profile = Tables<'profiles'>;
export type EducationalStage = Tables<'educational_stages'>;
export type Subject = Tables<'subjects'>;
export type Lesson = Tables<'lessons'>;
export type QuizQuestion = Tables<'quiz_questions'>;
export type LessonQuestion = Tables<'lesson_questions'>; // Alias for backward compatibility
export type ComprehensiveExam = Tables<'comprehensive_exams'>;
export type TeacherExam = Tables<'teacher_exams'>;
export type ComprehensiveExamAttempt = Tables<'comprehensive_exam_attempts'>;
export type TeacherExamAttempt = Tables<'teacher_exam_attempts'>;
export type TeacherSubscription = Tables<'teacher_subscriptions'>;
export type TeacherRating = Tables<'teacher_ratings'>;
export type UserLessonProgress = Tables<'user_lesson_progress'>;
export type Notification = Tables<'notifications'>;
export type NotificationPreference = Tables<'notification_preferences'>;
export type Message = Tables<'messages'>;
export type SupportChat = Tables<'support_chats'>;
export type ChatMessage = Tables<'chat_messages'>;
export type UserDevice = Tables<'user_devices'>;
export type VisitorDevice = Tables<'visitor_devices'>;
export type SiteSetting = Tables<'site_settings'>;
