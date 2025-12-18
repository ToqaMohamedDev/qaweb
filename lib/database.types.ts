Initialising login role...
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
  graphql_public: {
    Tables: {
      [_ in never]: never
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      graphql: {
        Args: {
          extensions?: Json
          operationName?: string
          query?: string
          variables?: Json
        }
        Returns: Json
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
  public: {
    Tables: {
      chat_messages: {
        Row: {
          chat_id: string
          created_at: string
          id: string
          is_ai_response: boolean
          message: string
          sender_id: string | null
          sender_type: Database["public"]["Enums"]["sender_type"]
        }
        Insert: {
          chat_id: string
          created_at?: string
          id?: string
          is_ai_response?: boolean
          message: string
          sender_id?: string | null
          sender_type: Database["public"]["Enums"]["sender_type"]
        }
        Update: {
          chat_id?: string
          created_at?: string
          id?: string
          is_ai_response?: boolean
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
          answers: Json
          completed_at: string | null
          created_at: string
          exam_id: string
          id: string
          max_score: number | null
          started_at: string
          status: string
          student_id: string
          total_score: number | null
          updated_at: string
        }
        Insert: {
          answers?: Json
          completed_at?: string | null
          created_at?: string
          exam_id: string
          id?: string
          max_score?: number | null
          started_at?: string
          status?: string
          student_id: string
          total_score?: number | null
          updated_at?: string
        }
        Update: {
          answers?: Json
          completed_at?: string | null
          created_at?: string
          exam_id?: string
          id?: string
          max_score?: number | null
          started_at?: string
          status?: string
          student_id?: string
          total_score?: number | null
          updated_at?: string
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
          blocks: Json
          branch_tags: string[] | null
          created_at: string
          created_by: string | null
          duration_minutes: number | null
          exam_description: string | null
          exam_title: string
          grading_mode: string
          id: string
          is_published: boolean
          language: string
          lesson_id: string | null
          passing_score: number | null
          sections: Json
          stage_id: string | null
          stage_name: string | null
          subject_id: string | null
          subject_name: string | null
          total_marks: number | null
          type: string
          updated_at: string
          usage_scope: string
        }
        Insert: {
          blocks?: Json
          branch_tags?: string[] | null
          created_at?: string
          created_by?: string | null
          duration_minutes?: number | null
          exam_description?: string | null
          exam_title: string
          grading_mode?: string
          id?: string
          is_published?: boolean
          language: string
          lesson_id?: string | null
          passing_score?: number | null
          sections?: Json
          stage_id?: string | null
          stage_name?: string | null
          subject_id?: string | null
          subject_name?: string | null
          total_marks?: number | null
          type: string
          updated_at?: string
          usage_scope?: string
        }
        Update: {
          blocks?: Json
          branch_tags?: string[] | null
          created_at?: string
          created_by?: string | null
          duration_minutes?: number | null
          exam_description?: string | null
          exam_title?: string
          grading_mode?: string
          id?: string
          is_published?: boolean
          language?: string
          lesson_id?: string | null
          passing_score?: number | null
          sections?: Json
          stage_id?: string | null
          stage_name?: string | null
          subject_id?: string | null
          subject_name?: string | null
          total_marks?: number | null
          type?: string
          updated_at?: string
          usage_scope?: string
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
          created_at: string
          description: string | null
          id: string
          image_url: string | null
          is_active: boolean
          name: string
          order_index: number
          slug: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          image_url?: string | null
          is_active?: boolean
          name: string
          order_index?: number
          slug: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          image_url?: string | null
          is_active?: boolean
          name?: string
          order_index?: number
          slug?: string
          updated_at?: string
        }
        Relationships: []
      }
      exam_attempts: {
        Row: {
          answers: Json
          expires_at: string | null
          graded_at: string | null
          id: string
          passed: boolean
          percentage: number
          question_results: Json
          questions_answered: number
          score: number
          started_at: string
          status: string
          student_id: string
          submitted_at: string | null
          template_id: string
          time_spent_seconds: number
          total_points: number
        }
        Insert: {
          answers?: Json
          expires_at?: string | null
          graded_at?: string | null
          id?: string
          passed?: boolean
          percentage?: number
          question_results?: Json
          questions_answered?: number
          score?: number
          started_at?: string
          status?: string
          student_id: string
          submitted_at?: string | null
          template_id: string
          time_spent_seconds?: number
          total_points?: number
        }
        Update: {
          answers?: Json
          expires_at?: string | null
          graded_at?: string | null
          id?: string
          passed?: boolean
          percentage?: number
          question_results?: Json
          questions_answered?: number
          score?: number
          started_at?: string
          status?: string
          student_id?: string
          submitted_at?: string | null
          template_id?: string
          time_spent_seconds?: number
          total_points?: number
        }
        Relationships: [
          {
            foreignKeyName: "exam_attempts_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "exam_attempts_template_id_fkey"
            columns: ["template_id"]
            isOneToOne: false
            referencedRelation: "exam_templates"
            referencedColumns: ["id"]
          },
        ]
      }
      exam_results: {
        Row: {
          answers: Json | null
          completed_at: string | null
          correct_answers: number
          created_at: string
          exam_id: string
          id: string
          score: number
          started_at: string
          time_taken_seconds: number | null
          total_questions: number
          user_id: string
        }
        Insert: {
          answers?: Json | null
          completed_at?: string | null
          correct_answers?: number
          created_at?: string
          exam_id: string
          id?: string
          score?: number
          started_at: string
          time_taken_seconds?: number | null
          total_questions: number
          user_id: string
        }
        Update: {
          answers?: Json | null
          completed_at?: string | null
          correct_answers?: number
          created_at?: string
          exam_id?: string
          id?: string
          score?: number
          started_at?: string
          time_taken_seconds?: number | null
          total_questions?: number
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "exam_results_exam_id_fkey"
            columns: ["exam_id"]
            isOneToOne: false
            referencedRelation: "exams"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "exam_results_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      exam_templates: {
        Row: {
          attempts_count: number
          average_score: number
          created_at: string
          created_by: string
          description: Json | null
          duration_minutes: number
          grade: string | null
          id: string
          is_published: boolean
          language: string
          questions_count: number
          settings: Json
          stage_id: string | null
          subject_id: string | null
          subject_name: string | null
          title: Json
          total_points: number
          updated_at: string
        }
        Insert: {
          attempts_count?: number
          average_score?: number
          created_at?: string
          created_by: string
          description?: Json | null
          duration_minutes?: number
          grade?: string | null
          id?: string
          is_published?: boolean
          language?: string
          questions_count?: number
          settings?: Json
          stage_id?: string | null
          subject_id?: string | null
          subject_name?: string | null
          title?: Json
          total_points?: number
          updated_at?: string
        }
        Update: {
          attempts_count?: number
          average_score?: number
          created_at?: string
          created_by?: string
          description?: Json | null
          duration_minutes?: number
          grade?: string | null
          id?: string
          is_published?: boolean
          language?: string
          questions_count?: number
          settings?: Json
          stage_id?: string | null
          subject_id?: string | null
          subject_name?: string | null
          title?: Json
          total_points?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "exam_templates_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "exam_templates_stage_id_fkey"
            columns: ["stage_id"]
            isOneToOne: false
            referencedRelation: "educational_stages"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "exam_templates_subject_id_fkey"
            columns: ["subject_id"]
            isOneToOne: false
            referencedRelation: "subjects"
            referencedColumns: ["id"]
          },
        ]
      }
      exams: {
        Row: {
          created_at: string
          description: string | null
          duration_minutes: number
          ends_at: string | null
          exam_type: Database["public"]["Enums"]["exam_type"]
          id: string
          is_published: boolean
          lesson_id: string | null
          max_attempts: number
          passing_score: number
          show_answers_after: boolean
          shuffle_questions: boolean
          starts_at: string | null
          subject_id: string
          title: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          duration_minutes?: number
          ends_at?: string | null
          exam_type?: Database["public"]["Enums"]["exam_type"]
          id?: string
          is_published?: boolean
          lesson_id?: string | null
          max_attempts?: number
          passing_score?: number
          show_answers_after?: boolean
          shuffle_questions?: boolean
          starts_at?: string | null
          subject_id: string
          title: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          duration_minutes?: number
          ends_at?: string | null
          exam_type?: Database["public"]["Enums"]["exam_type"]
          id?: string
          is_published?: boolean
          lesson_id?: string | null
          max_attempts?: number
          passing_score?: number
          show_answers_after?: boolean
          shuffle_questions?: boolean
          starts_at?: string | null
          subject_id?: string
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "exams_lesson_id_fkey"
            columns: ["lesson_id"]
            isOneToOne: false
            referencedRelation: "lessons"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "exams_subject_id_fkey"
            columns: ["subject_id"]
            isOneToOne: false
            referencedRelation: "subjects"
            referencedColumns: ["id"]
          },
        ]
      }
      lesson_questions: {
        Row: {
          correct_answer: Json | null
          correct_option_id: string | null
          created_at: string
          created_by: string | null
          difficulty: string
          explanation: Json | null
          hint: Json | null
          id: string
          is_active: boolean
          lesson_id: string
          media: Json | null
          options: Json
          order_index: number
          points: number
          text: Json
          type: string
          updated_at: string
        }
        Insert: {
          correct_answer?: Json | null
          correct_option_id?: string | null
          created_at?: string
          created_by?: string | null
          difficulty?: string
          explanation?: Json | null
          hint?: Json | null
          id?: string
          is_active?: boolean
          lesson_id: string
          media?: Json | null
          options?: Json
          order_index?: number
          points?: number
          text?: Json
          type?: string
          updated_at?: string
        }
        Update: {
          correct_answer?: Json | null
          correct_option_id?: string | null
          created_at?: string
          created_by?: string | null
          difficulty?: string
          explanation?: Json | null
          hint?: Json | null
          id?: string
          is_active?: boolean
          lesson_id?: string
          media?: Json | null
          options?: Json
          order_index?: number
          points?: number
          text?: Json
          type?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "lesson_questions_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lesson_questions_lesson_id_fkey"
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
          created_at: string
          created_by: string | null
          description: string | null
          id: string
          image_url: string | null
          is_free: boolean
          is_published: boolean
          likes_count: number
          order_index: number
          stage_id: string | null
          subject_id: string
          title: string
          updated_at: string
          views_count: number
        }
        Insert: {
          content?: string | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          id?: string
          image_url?: string | null
          is_free?: boolean
          is_published?: boolean
          likes_count?: number
          order_index?: number
          stage_id?: string | null
          subject_id: string
          title: string
          updated_at?: string
          views_count?: number
        }
        Update: {
          content?: string | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          id?: string
          image_url?: string | null
          is_free?: boolean
          is_published?: boolean
          likes_count?: number
          order_index?: number
          stage_id?: string | null
          subject_id?: string
          title?: string
          updated_at?: string
          views_count?: number
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
          created_at: string
          from_email: string
          from_name: string
          from_user_id: string | null
          id: string
          is_archived: boolean
          is_read: boolean
          is_replied: boolean
          is_starred: boolean
          message: string
          replied_at: string | null
          replied_by: string | null
          reply_text: string | null
          subject: string
        }
        Insert: {
          created_at?: string
          from_email: string
          from_name: string
          from_user_id?: string | null
          id?: string
          is_archived?: boolean
          is_read?: boolean
          is_replied?: boolean
          is_starred?: boolean
          message: string
          replied_at?: string | null
          replied_by?: string | null
          reply_text?: string | null
          subject: string
        }
        Update: {
          created_at?: string
          from_email?: string
          from_name?: string
          from_user_id?: string | null
          id?: string
          is_archived?: boolean
          is_read?: boolean
          is_replied?: boolean
          is_starred?: boolean
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
      notifications: {
        Row: {
          created_at: string
          created_by: string | null
          id: string
          message: string
          scheduled_for: string | null
          sent_at: string | null
          status: Database["public"]["Enums"]["notification_status"]
          target_role: Database["public"]["Enums"]["notification_target_role"]
          title: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          id?: string
          message: string
          scheduled_for?: string | null
          sent_at?: string | null
          status?: Database["public"]["Enums"]["notification_status"]
          target_role?: Database["public"]["Enums"]["notification_target_role"]
          title: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          id?: string
          message?: string
          scheduled_for?: string | null
          sent_at?: string | null
          status?: Database["public"]["Enums"]["notification_status"]
          target_role?: Database["public"]["Enums"]["notification_target_role"]
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "notifications_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          bio: string | null
          cover_image_url: string | null
          created_at: string
          education: string | null
          email: string
          featured_until: string | null
          id: string
          is_featured: boolean
          is_teacher_profile_public: boolean
          is_verified: boolean
          name: string
          phone: string | null
          rating_average: number
          rating_count: number
          role: Database["public"]["Enums"]["user_role"]
          social_links: Json | null
          specialization: string | null
          stages: string[] | null
          subjects: string[] | null
          subscriber_count: number
          teacher_title: string | null
          teaching_style: string | null
          total_views: number
          updated_at: string
          website: string | null
          years_of_experience: number
        }
        Insert: {
          avatar_url?: string | null
          bio?: string | null
          cover_image_url?: string | null
          created_at?: string
          education?: string | null
          email: string
          featured_until?: string | null
          id: string
          is_featured?: boolean
          is_teacher_profile_public?: boolean
          is_verified?: boolean
          name: string
          phone?: string | null
          rating_average?: number
          rating_count?: number
          role?: Database["public"]["Enums"]["user_role"]
          social_links?: Json | null
          specialization?: string | null
          stages?: string[] | null
          subjects?: string[] | null
          subscriber_count?: number
          teacher_title?: string | null
          teaching_style?: string | null
          total_views?: number
          updated_at?: string
          website?: string | null
          years_of_experience?: number
        }
        Update: {
          avatar_url?: string | null
          bio?: string | null
          cover_image_url?: string | null
          created_at?: string
          education?: string | null
          email?: string
          featured_until?: string | null
          id?: string
          is_featured?: boolean
          is_teacher_profile_public?: boolean
          is_verified?: boolean
          name?: string
          phone?: string | null
          rating_average?: number
          rating_count?: number
          role?: Database["public"]["Enums"]["user_role"]
          social_links?: Json | null
          specialization?: string | null
          stages?: string[] | null
          subjects?: string[] | null
          subscriber_count?: number
          teacher_title?: string | null
          teaching_style?: string | null
          total_views?: number
          updated_at?: string
          website?: string | null
          years_of_experience?: number
        }
        Relationships: []
      }
      questions: {
        Row: {
          correct_answer: string
          created_at: string
          difficulty: Database["public"]["Enums"]["difficulty_level"]
          exam_id: string | null
          explanation: string | null
          id: string
          is_active: boolean
          lesson_id: string | null
          options: Json | null
          order_index: number
          points: number
          question_text: string
          question_type: Database["public"]["Enums"]["question_type"]
          updated_at: string
        }
        Insert: {
          correct_answer: string
          created_at?: string
          difficulty?: Database["public"]["Enums"]["difficulty_level"]
          exam_id?: string | null
          explanation?: string | null
          id?: string
          is_active?: boolean
          lesson_id?: string | null
          options?: Json | null
          order_index?: number
          points?: number
          question_text: string
          question_type?: Database["public"]["Enums"]["question_type"]
          updated_at?: string
        }
        Update: {
          correct_answer?: string
          created_at?: string
          difficulty?: Database["public"]["Enums"]["difficulty_level"]
          exam_id?: string | null
          explanation?: string | null
          id?: string
          is_active?: boolean
          lesson_id?: string | null
          options?: Json | null
          order_index?: number
          points?: number
          question_text?: string
          question_type?: Database["public"]["Enums"]["question_type"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "questions_exam_id_fkey"
            columns: ["exam_id"]
            isOneToOne: false
            referencedRelation: "exams"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "questions_lesson_id_fkey"
            columns: ["lesson_id"]
            isOneToOne: false
            referencedRelation: "lessons"
            referencedColumns: ["id"]
          },
        ]
      }
      site_settings: {
        Row: {
          created_at: string
          description: string | null
          id: string
          key: string
          updated_at: string
          updated_by: string | null
          value: Json
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          key: string
          updated_at?: string
          updated_by?: string | null
          value?: Json
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          key?: string
          updated_at?: string
          updated_by?: string | null
          value?: Json
        }
        Relationships: [
          {
            foreignKeyName: "site_settings_updated_by_fkey"
            columns: ["updated_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      subjects: {
        Row: {
          created_at: string
          description: string | null
          id: string
          image_url: string | null
          is_active: boolean
          name: string
          order_index: number
          slug: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          image_url?: string | null
          is_active?: boolean
          name: string
          order_index?: number
          slug: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          image_url?: string | null
          is_active?: boolean
          name?: string
          order_index?: number
          slug?: string
          updated_at?: string
        }
        Relationships: []
      }
      support_chats: {
        Row: {
          created_at: string
          id: string
          status: Database["public"]["Enums"]["support_chat_status"]
          updated_at: string
          user_email: string
          user_id: string | null
          user_name: string
        }
        Insert: {
          created_at?: string
          id?: string
          status?: Database["public"]["Enums"]["support_chat_status"]
          updated_at?: string
          user_email: string
          user_id?: string | null
          user_name: string
        }
        Update: {
          created_at?: string
          id?: string
          status?: Database["public"]["Enums"]["support_chat_status"]
          updated_at?: string
          user_email?: string
          user_id?: string | null
          user_name?: string
        }
        Relationships: [
          {
            foreignKeyName: "support_chats_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      teacher_ratings: {
        Row: {
          created_at: string
          id: string
          rating: number
          review: string | null
          teacher_id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          rating: number
          review?: string | null
          teacher_id: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          rating?: number
          review?: string | null
          teacher_id?: string
          updated_at?: string
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
          created_at: string
          id: string
          notifications_enabled: boolean
          teacher_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          notifications_enabled?: boolean
          teacher_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          notifications_enabled?: boolean
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
      template_questions: {
        Row: {
          correct_answer: Json | null
          correct_option_id: string | null
          created_at: string
          explanation: Json | null
          hint: Json | null
          id: string
          media: Json | null
          options: Json
          order_index: number
          points: number
          template_id: string
          text: Json
          type: string
          updated_at: string
        }
        Insert: {
          correct_answer?: Json | null
          correct_option_id?: string | null
          created_at?: string
          explanation?: Json | null
          hint?: Json | null
          id?: string
          media?: Json | null
          options?: Json
          order_index?: number
          points?: number
          template_id: string
          text?: Json
          type?: string
          updated_at?: string
        }
        Update: {
          correct_answer?: Json | null
          correct_option_id?: string | null
          created_at?: string
          explanation?: Json | null
          hint?: Json | null
          id?: string
          media?: Json | null
          options?: Json
          order_index?: number
          points?: number
          template_id?: string
          text?: Json
          type?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "template_questions_template_id_fkey"
            columns: ["template_id"]
            isOneToOne: false
            referencedRelation: "exam_templates"
            referencedColumns: ["id"]
          },
        ]
      }
      user_lesson_progress: {
        Row: {
          completed_at: string | null
          created_at: string
          id: string
          is_completed: boolean
          last_accessed_at: string
          lesson_id: string
          progress_percentage: number
          updated_at: string
          user_id: string
        }
        Insert: {
          completed_at?: string | null
          created_at?: string
          id?: string
          is_completed?: boolean
          last_accessed_at?: string
          lesson_id: string
          progress_percentage?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          completed_at?: string | null
          created_at?: string
          id?: string
          is_completed?: boolean
          last_accessed_at?: string
          lesson_id?: string
          progress_percentage?: number
          updated_at?: string
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
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      cleanup_old_data: { Args: never; Returns: undefined }
      get_dashboard_stats: {
        Args: never
        Returns: {
          new_students_this_week: number
          new_teachers_this_week: number
          published_exams: number
          published_lessons: number
          total_exams: number
          total_lessons: number
          total_questions: number
          total_students: number
          total_teachers: number
        }[]
      }
      get_exam_statistics: {
        Args: { p_exam_id: string }
        Returns: {
          average_score: number
          highest_score: number
          lowest_score: number
          pass_rate: number
          total_attempts: number
        }[]
      }
      get_featured_teachers: {
        Args: { limit_count?: number }
        Returns: {
          avatar_url: string
          bio: string
          id: string
          name: string
          rating_average: number
          rating_count: number
          specialization: string
          subscriber_count: number
        }[]
      }
      get_site_setting: { Args: { setting_key: string }; Returns: Json }
      get_student_rank: {
        Args: { p_exam_id: string; p_user_id: string }
        Returns: number
      }
      get_subject_progress: {
        Args: { p_subject_id: string; p_user_id: string }
        Returns: {
          completed_lessons: number
          progress_percentage: number
          total_lessons: number
        }[]
      }
      get_unread_messages_count: { Args: never; Returns: number }
      increment_lesson_views: {
        Args: { lesson_id: string }
        Returns: undefined
      }
      is_subscribed_to_teacher: {
        Args: { p_teacher_id: string; p_user_id: string }
        Returns: boolean
      }
      process_scheduled_notifications: { Args: never; Returns: number }
      search_content: {
        Args: { result_limit?: number; search_query: string }
        Returns: {
          content_id: string
          content_type: string
          description: string
          relevance: number
          title: string
        }[]
      }
      set_site_setting: {
        Args: { setting_key: string; setting_value: Json; user_id: string }
        Returns: boolean
      }
      show_limit: { Args: never; Returns: number }
      show_trgm: { Args: { "": string }; Returns: string[] }
      toggle_lesson_like: {
        Args: { increment: boolean; lesson_id: string }
        Returns: undefined
      }
    }
    Enums: {
      comprehensive_exam_type:
        | "arabic_comprehensive_exam"
        | "english_comprehensive_exam"
      difficulty_level: "easy" | "medium" | "hard"
      exam_attempt_status: "in_progress" | "completed" | "graded"
      exam_type: "quiz" | "midterm" | "final" | "practice"
      exam_usage_scope: "exam" | "lesson"
      grading_mode: "manual" | "hybrid" | "auto"
      lesson_question_type:
        | "mcq"
        | "truefalse"
        | "essay"
        | "fill_blank"
        | "matching"
      notification_status: "draft" | "sent" | "scheduled"
      notification_target_role: "all" | "students" | "teachers" | "admins"
      question_type: "multiple_choice" | "true_false" | "fill_blank"
      sender_type: "user" | "ai" | "admin"
      support_chat_status: "open" | "resolved" | "pending"
      user_role: "admin" | "teacher" | "student"
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
  graphql_public: {
    Enums: {},
  },
  public: {
    Enums: {
      comprehensive_exam_type: [
        "arabic_comprehensive_exam",
        "english_comprehensive_exam",
      ],
      difficulty_level: ["easy", "medium", "hard"],
      exam_attempt_status: ["in_progress", "completed", "graded"],
      exam_type: ["quiz", "midterm", "final", "practice"],
      exam_usage_scope: ["exam", "lesson"],
      grading_mode: ["manual", "hybrid", "auto"],
      lesson_question_type: [
        "mcq",
        "truefalse",
        "essay",
        "fill_blank",
        "matching",
      ],
      notification_status: ["draft", "sent", "scheduled"],
      notification_target_role: ["all", "students", "teachers", "admins"],
      question_type: ["multiple_choice", "true_false", "fill_blank"],
      sender_type: ["user", "ai", "admin"],
      support_chat_status: ["open", "resolved", "pending"],
      user_role: ["admin", "teacher", "student"],
    },
  },
} as const
