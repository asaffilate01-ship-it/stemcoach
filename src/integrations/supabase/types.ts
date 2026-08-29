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
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      active_sessions: {
        Row: {
          device_info: string | null
          id: string
          ip_address: string | null
          last_active: string
          session_token: string
          started_at: string
          user_id: string
        }
        Insert: {
          device_info?: string | null
          id?: string
          ip_address?: string | null
          last_active?: string
          session_token: string
          started_at?: string
          user_id: string
        }
        Update: {
          device_info?: string | null
          id?: string
          ip_address?: string | null
          last_active?: string
          session_token?: string
          started_at?: string
          user_id?: string
        }
        Relationships: []
      }
      app_config: {
        Row: {
          created_at: string
          key: string
          value: string
        }
        Insert: {
          created_at?: string
          key: string
          value: string
        }
        Update: {
          created_at?: string
          key?: string
          value?: string
        }
        Relationships: []
      }
      assignment_submissions: {
        Row: {
          assignment_id: string
          completed_at: string | null
          id: string
          score: number | null
          started_at: string
          student_id: string
          total: number | null
        }
        Insert: {
          assignment_id: string
          completed_at?: string | null
          id?: string
          score?: number | null
          started_at?: string
          student_id: string
          total?: number | null
        }
        Update: {
          assignment_id?: string
          completed_at?: string | null
          id?: string
          score?: number | null
          started_at?: string
          student_id?: string
          total?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "assignment_submissions_assignment_id_fkey"
            columns: ["assignment_id"]
            isOneToOne: false
            referencedRelation: "assignments"
            referencedColumns: ["id"]
          },
        ]
      }
      assignments: {
        Row: {
          class_id: string
          created_at: string
          curriculum: string
          description: string | null
          difficulty_max: number
          difficulty_min: number
          due_date: string | null
          id: string
          question_count: number
          subject: string
          teacher_id: string
          title: string
          topics: string[]
        }
        Insert: {
          class_id: string
          created_at?: string
          curriculum: string
          description?: string | null
          difficulty_max?: number
          difficulty_min?: number
          due_date?: string | null
          id?: string
          question_count?: number
          subject: string
          teacher_id: string
          title: string
          topics?: string[]
        }
        Update: {
          class_id?: string
          created_at?: string
          curriculum?: string
          description?: string | null
          difficulty_max?: number
          difficulty_min?: number
          due_date?: string | null
          id?: string
          question_count?: number
          subject?: string
          teacher_id?: string
          title?: string
          topics?: string[]
        }
        Relationships: [
          {
            foreignKeyName: "assignments_class_id_fkey"
            columns: ["class_id"]
            isOneToOne: false
            referencedRelation: "classes"
            referencedColumns: ["id"]
          },
        ]
      }
      attempts: {
        Row: {
          ai_feedback: string | null
          ai_score: number | null
          answer: string
          correct: boolean
          created_at: string
          id: string
          question_id: string
          time_taken_seconds: number | null
          user_id: string
        }
        Insert: {
          ai_feedback?: string | null
          ai_score?: number | null
          answer: string
          correct: boolean
          created_at?: string
          id?: string
          question_id: string
          time_taken_seconds?: number | null
          user_id: string
        }
        Update: {
          ai_feedback?: string | null
          ai_score?: number | null
          answer?: string
          correct?: boolean
          created_at?: string
          id?: string
          question_id?: string
          time_taken_seconds?: number | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "attempts_question_id_fkey"
            columns: ["question_id"]
            isOneToOne: false
            referencedRelation: "questions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "attempts_question_id_fkey"
            columns: ["question_id"]
            isOneToOne: false
            referencedRelation: "questions_safe"
            referencedColumns: ["id"]
          },
        ]
      }
      badges: {
        Row: {
          category: string
          created_at: string
          description: string
          icon: string
          id: string
          name: string
          requirement_subject: string | null
          requirement_type: string
          requirement_value: number
          xp_reward: number
        }
        Insert: {
          category?: string
          created_at?: string
          description: string
          icon?: string
          id?: string
          name: string
          requirement_subject?: string | null
          requirement_type: string
          requirement_value?: number
          xp_reward?: number
        }
        Update: {
          category?: string
          created_at?: string
          description?: string
          icon?: string
          id?: string
          name?: string
          requirement_subject?: string | null
          requirement_type?: string
          requirement_value?: number
          xp_reward?: number
        }
        Relationships: []
      }
      blog_posts: {
        Row: {
          author_name: string
          category: string
          content: string
          cover_image: string | null
          created_at: string
          excerpt: string
          id: string
          published: boolean
          published_at: string | null
          slug: string
          title: string
          updated_at: string
        }
        Insert: {
          author_name?: string
          category?: string
          content?: string
          cover_image?: string | null
          created_at?: string
          excerpt?: string
          id?: string
          published?: boolean
          published_at?: string | null
          slug: string
          title: string
          updated_at?: string
        }
        Update: {
          author_name?: string
          category?: string
          content?: string
          cover_image?: string | null
          created_at?: string
          excerpt?: string
          id?: string
          published?: boolean
          published_at?: string | null
          slug?: string
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      certificates: {
        Row: {
          achievement_type: string
          id: string
          issued_at: string
          score_percent: number | null
          subject: string | null
          title: string
          user_id: string
          verification_code: string
        }
        Insert: {
          achievement_type: string
          id?: string
          issued_at?: string
          score_percent?: number | null
          subject?: string | null
          title: string
          user_id: string
          verification_code?: string
        }
        Update: {
          achievement_type?: string
          id?: string
          issued_at?: string
          score_percent?: number | null
          subject?: string | null
          title?: string
          user_id?: string
          verification_code?: string
        }
        Relationships: []
      }
      class_members: {
        Row: {
          class_id: string
          id: string
          joined_at: string
          user_id: string
        }
        Insert: {
          class_id: string
          id?: string
          joined_at?: string
          user_id: string
        }
        Update: {
          class_id?: string
          id?: string
          joined_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "fk_class_members_class"
            columns: ["class_id"]
            isOneToOne: false
            referencedRelation: "classes"
            referencedColumns: ["id"]
          },
        ]
      }
      classes: {
        Row: {
          created_at: string
          curriculum: string
          id: string
          join_code: string | null
          name: string
          subject: string
          teacher_id: string
        }
        Insert: {
          created_at?: string
          curriculum: string
          id?: string
          join_code?: string | null
          name: string
          subject: string
          teacher_id: string
        }
        Update: {
          created_at?: string
          curriculum?: string
          id?: string
          join_code?: string | null
          name?: string
          subject?: string
          teacher_id?: string
        }
        Relationships: []
      }
      classroom_messages: {
        Row: {
          created_at: string
          display_name: string
          id: string
          message: string
          room_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          display_name?: string
          id?: string
          message: string
          room_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          display_name?: string
          id?: string
          message?: string
          room_id?: string
          user_id?: string
        }
        Relationships: []
      }
      coaching_cache: {
        Row: {
          action: string
          cache_key: string | null
          created_at: string
          hit_count: number
          id: string
          question_id: string | null
          response_text: string
        }
        Insert: {
          action?: string
          cache_key?: string | null
          created_at?: string
          hit_count?: number
          id?: string
          question_id?: string | null
          response_text: string
        }
        Update: {
          action?: string
          cache_key?: string | null
          created_at?: string
          hit_count?: number
          id?: string
          question_id?: string | null
          response_text?: string
        }
        Relationships: []
      }
      daily_challenge_attempts: {
        Row: {
          challenge_id: string
          completed_at: string
          id: string
          score: number
          time_taken_seconds: number | null
          total: number
          user_id: string
        }
        Insert: {
          challenge_id: string
          completed_at?: string
          id?: string
          score?: number
          time_taken_seconds?: number | null
          total?: number
          user_id: string
        }
        Update: {
          challenge_id?: string
          completed_at?: string
          id?: string
          score?: number
          time_taken_seconds?: number | null
          total?: number
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "daily_challenge_attempts_challenge_id_fkey"
            columns: ["challenge_id"]
            isOneToOne: false
            referencedRelation: "daily_challenges"
            referencedColumns: ["id"]
          },
        ]
      }
      daily_challenges: {
        Row: {
          created_at: string
          curriculum: string
          date: string
          id: string
          question_count: number
          subject: string
          time_limit_seconds: number
          xp_reward: number
        }
        Insert: {
          created_at?: string
          curriculum?: string
          date?: string
          id?: string
          question_count?: number
          subject: string
          time_limit_seconds?: number
          xp_reward?: number
        }
        Update: {
          created_at?: string
          curriculum?: string
          date?: string
          id?: string
          question_count?: number
          subject?: string
          time_limit_seconds?: number
          xp_reward?: number
        }
        Relationships: []
      }
      flashcards: {
        Row: {
          back: string
          created_at: string
          ease_factor: number
          front: string
          id: string
          interval_days: number
          next_review: string
          question_id: string | null
          repetitions: number
          subject: string | null
          topic: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          back: string
          created_at?: string
          ease_factor?: number
          front: string
          id?: string
          interval_days?: number
          next_review?: string
          question_id?: string | null
          repetitions?: number
          subject?: string | null
          topic?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          back?: string
          created_at?: string
          ease_factor?: number
          front?: string
          id?: string
          interval_days?: number
          next_review?: string
          question_id?: string | null
          repetitions?: number
          subject?: string | null
          topic?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "flashcards_question_id_fkey"
            columns: ["question_id"]
            isOneToOne: false
            referencedRelation: "questions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "flashcards_question_id_fkey"
            columns: ["question_id"]
            isOneToOne: false
            referencedRelation: "questions_safe"
            referencedColumns: ["id"]
          },
        ]
      }
      generation_queue: {
        Row: {
          boards: string[]
          completed_at: string | null
          count: number
          created_at: string
          curriculum: string
          difficulty: number
          id: string
          question_type: string
          status: string
          subject: string
          subtopic: string
          topic: string
        }
        Insert: {
          boards?: string[]
          completed_at?: string | null
          count?: number
          created_at?: string
          curriculum: string
          difficulty: number
          id?: string
          question_type: string
          status?: string
          subject: string
          subtopic: string
          topic: string
        }
        Update: {
          boards?: string[]
          completed_at?: string | null
          count?: number
          created_at?: string
          curriculum?: string
          difficulty?: number
          id?: string
          question_type?: string
          status?: string
          subject?: string
          subtopic?: string
          topic?: string
        }
        Relationships: []
      }
      notifications: {
        Row: {
          created_at: string
          id: string
          message: string
          metadata: Json | null
          read: boolean
          title: string
          type: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          message: string
          metadata?: Json | null
          read?: boolean
          title: string
          type?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          message?: string
          metadata?: Json | null
          read?: boolean
          title?: string
          type?: string
          user_id?: string
        }
        Relationships: []
      }
      parent_links: {
        Row: {
          child_id: string
          created_at: string
          id: string
          link_code: string
          parent_id: string
          status: string
        }
        Insert: {
          child_id: string
          created_at?: string
          id?: string
          link_code?: string
          parent_id: string
          status?: string
        }
        Update: {
          child_id?: string
          created_at?: string
          id?: string
          link_code?: string
          parent_id?: string
          status?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          display_name: string | null
          id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          display_name?: string | null
          id?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          display_name?: string | null
          id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      purchases: {
        Row: {
          amount_paid: number
          created_at: string
          currency: string
          id: string
          pack_type: string
          questions_granted: number
          region: string
          stripe_session_id: string | null
          user_id: string
        }
        Insert: {
          amount_paid?: number
          created_at?: string
          currency?: string
          id?: string
          pack_type?: string
          questions_granted?: number
          region?: string
          stripe_session_id?: string | null
          user_id: string
        }
        Update: {
          amount_paid?: number
          created_at?: string
          currency?: string
          id?: string
          pack_type?: string
          questions_granted?: number
          region?: string
          stripe_session_id?: string | null
          user_id?: string
        }
        Relationships: []
      }
      questions: {
        Row: {
          allow_multiple_answers: boolean
          boards: string[]
          command_word: string | null
          content_origin: string
          correct_answer: string
          correct_answers: string[] | null
          created_at: string
          curriculum: string
          difficulty: number
          exam_tip: string
          explanation: string
          formula: string | null
          id: string
          mark_scheme: string | null
          max_marks: number | null
          model_answer: string | null
          options: Json | null
          points: number
          quality_flags: Json
          question_text: string
          question_type: string
          review_status: string
          reviewed_at: string | null
          reviewed_by: string | null
          source_url: string | null
          specification_version: string | null
          subject: string
          subtopic: string
          topic: string
          tuition_tips: string[]
          worked_solution: string
        }
        Insert: {
          allow_multiple_answers?: boolean
          boards?: string[]
          command_word?: string | null
          content_origin?: string
          correct_answer?: string
          correct_answers?: string[] | null
          created_at?: string
          curriculum: string
          difficulty: number
          exam_tip?: string
          explanation?: string
          formula?: string | null
          id?: string
          mark_scheme?: string | null
          max_marks?: number | null
          model_answer?: string | null
          options?: Json | null
          points?: number
          quality_flags?: Json
          question_text: string
          question_type?: string
          review_status?: string
          reviewed_at?: string | null
          reviewed_by?: string | null
          source_url?: string | null
          specification_version?: string | null
          subject: string
          subtopic: string
          topic: string
          tuition_tips?: string[]
          worked_solution?: string
        }
        Update: {
          allow_multiple_answers?: boolean
          boards?: string[]
          command_word?: string | null
          content_origin?: string
          correct_answer?: string
          correct_answers?: string[] | null
          created_at?: string
          curriculum?: string
          difficulty?: number
          exam_tip?: string
          explanation?: string
          formula?: string | null
          id?: string
          mark_scheme?: string | null
          max_marks?: number | null
          model_answer?: string | null
          options?: Json | null
          points?: number
          quality_flags?: Json
          question_text?: string
          question_type?: string
          review_status?: string
          reviewed_at?: string | null
          reviewed_by?: string | null
          source_url?: string | null
          specification_version?: string | null
          subject?: string
          subtopic?: string
          topic?: string
          tuition_tips?: string[]
          worked_solution?: string
        }
        Relationships: []
      }
      study_goals: {
        Row: {
          completed_minutes: number
          completed_questions: number
          created_at: string
          date: string
          id: string
          subjects: string[]
          target_minutes: number
          target_questions: number
          updated_at: string
          user_id: string
        }
        Insert: {
          completed_minutes?: number
          completed_questions?: number
          created_at?: string
          date?: string
          id?: string
          subjects?: string[]
          target_minutes?: number
          target_questions?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          completed_minutes?: number
          completed_questions?: number
          created_at?: string
          date?: string
          id?: string
          subjects?: string[]
          target_minutes?: number
          target_questions?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      study_group_members: {
        Row: {
          group_id: string
          id: string
          joined_at: string
          user_id: string
        }
        Insert: {
          group_id: string
          id?: string
          joined_at?: string
          user_id: string
        }
        Update: {
          group_id?: string
          id?: string
          joined_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "study_group_members_group_id_fkey"
            columns: ["group_id"]
            isOneToOne: false
            referencedRelation: "study_groups"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "study_group_members_group_id_fkey"
            columns: ["group_id"]
            isOneToOne: false
            referencedRelation: "study_groups_public"
            referencedColumns: ["id"]
          },
        ]
      }
      study_groups: {
        Row: {
          created_at: string
          created_by: string
          description: string | null
          id: string
          join_code: string
          max_members: number
          name: string
          subject: string
        }
        Insert: {
          created_at?: string
          created_by: string
          description?: string | null
          id?: string
          join_code?: string
          max_members?: number
          name: string
          subject: string
        }
        Update: {
          created_at?: string
          created_by?: string
          description?: string | null
          id?: string
          join_code?: string
          max_members?: number
          name?: string
          subject?: string
        }
        Relationships: []
      }
      support_tickets: {
        Row: {
          category: string
          created_at: string
          email: string
          id: string
          message: string
          name: string
          status: string
          subject: string
          updated_at: string
          user_id: string | null
        }
        Insert: {
          category?: string
          created_at?: string
          email: string
          id?: string
          message: string
          name: string
          status?: string
          subject: string
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          category?: string
          created_at?: string
          email?: string
          id?: string
          message?: string
          name?: string
          status?: string
          subject?: string
          updated_at?: string
          user_id?: string | null
        }
        Relationships: []
      }
      tenant_members: {
        Row: {
          approved_at: string | null
          approved_by: string | null
          id: string
          joined_at: string
          role: string
          status: string
          tenant_id: string
          user_id: string
        }
        Insert: {
          approved_at?: string | null
          approved_by?: string | null
          id?: string
          joined_at?: string
          role?: string
          status?: string
          tenant_id: string
          user_id: string
        }
        Update: {
          approved_at?: string | null
          approved_by?: string | null
          id?: string
          joined_at?: string
          role?: string
          status?: string
          tenant_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "tenant_members_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      tenants: {
        Row: {
          created_at: string
          custom_domain: string | null
          id: string
          logo_url: string | null
          max_students: number | null
          name: string
          plan: string
          primary_color: string | null
          secondary_color: string | null
          slug: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          custom_domain?: string | null
          id?: string
          logo_url?: string | null
          max_students?: number | null
          name: string
          plan?: string
          primary_color?: string | null
          secondary_color?: string | null
          slug: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          custom_domain?: string | null
          id?: string
          logo_url?: string | null
          max_students?: number | null
          name?: string
          plan?: string
          primary_color?: string | null
          secondary_color?: string | null
          slug?: string
          updated_at?: string
        }
        Relationships: []
      }
      user_badges: {
        Row: {
          badge_id: string
          earned_at: string
          id: string
          user_id: string
        }
        Insert: {
          badge_id: string
          earned_at?: string
          id?: string
          user_id: string
        }
        Update: {
          badge_id?: string
          earned_at?: string
          id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_badges_badge_id_fkey"
            columns: ["badge_id"]
            isOneToOne: false
            referencedRelation: "badges"
            referencedColumns: ["id"]
          },
        ]
      }
      user_preferences: {
        Row: {
          created_at: string
          curriculum: string | null
          id: string
          notification_prefs: Json
          onboarding_complete: boolean
          subjects: string[]
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          curriculum?: string | null
          id?: string
          notification_prefs?: Json
          onboarding_complete?: boolean
          subjects?: string[]
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          curriculum?: string | null
          id?: string
          notification_prefs?: Json
          onboarding_complete?: boolean
          subjects?: string[]
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      user_quotas: {
        Row: {
          created_at: string
          id: string
          levels: string[]
          mock_exams_total: number
          mock_exams_used: number
          subjects: string[]
          total_questions: number
          updated_at: string
          used_questions: number
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          levels?: string[]
          mock_exams_total?: number
          mock_exams_used?: number
          subjects?: string[]
          total_questions?: number
          updated_at?: string
          used_questions?: number
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          levels?: string[]
          mock_exams_total?: number
          mock_exams_used?: number
          subjects?: string[]
          total_questions?: number
          updated_at?: string
          used_questions?: number
          user_id?: string
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
      user_stats: {
        Row: {
          correct_answers: number
          id: string
          last_active_date: string | null
          level: number
          longest_streak: number
          perfect_scores: number
          streak: number
          total_questions: number
          updated_at: string
          user_id: string
          xp: number
        }
        Insert: {
          correct_answers?: number
          id?: string
          last_active_date?: string | null
          level?: number
          longest_streak?: number
          perfect_scores?: number
          streak?: number
          total_questions?: number
          updated_at?: string
          user_id: string
          xp?: number
        }
        Update: {
          correct_answers?: number
          id?: string
          last_active_date?: string | null
          level?: number
          longest_streak?: number
          perfect_scores?: number
          streak?: number
          total_questions?: number
          updated_at?: string
          user_id?: string
          xp?: number
        }
        Relationships: []
      }
    }
    Views: {
      challenge_leaderboard: {
        Row: {
          challenge_id: string | null
          score: number | null
          time_taken_seconds: number | null
          total: number | null
          user_id: string | null
        }
        Insert: {
          challenge_id?: string | null
          score?: number | null
          time_taken_seconds?: number | null
          total?: number | null
          user_id?: string | null
        }
        Update: {
          challenge_id?: string | null
          score?: number | null
          time_taken_seconds?: number | null
          total?: number | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "daily_challenge_attempts_challenge_id_fkey"
            columns: ["challenge_id"]
            isOneToOne: false
            referencedRelation: "daily_challenges"
            referencedColumns: ["id"]
          },
        ]
      }
      leaderboard_stats: {
        Row: {
          level: number | null
          longest_streak: number | null
          streak: number | null
          user_id: string | null
          xp: number | null
        }
        Insert: {
          level?: number | null
          longest_streak?: number | null
          streak?: number | null
          user_id?: string | null
          xp?: number | null
        }
        Update: {
          level?: number | null
          longest_streak?: number | null
          streak?: number | null
          user_id?: string | null
          xp?: number | null
        }
        Relationships: []
      }
      questions_safe: {
        Row: {
          allow_multiple_answers: boolean | null
          boards: string[] | null
          command_word: string | null
          created_at: string | null
          curriculum: string | null
          difficulty: number | null
          formula: string | null
          id: string | null
          max_marks: number | null
          options: Json | null
          points: number | null
          question_text: string | null
          question_type: string | null
          subject: string | null
          subtopic: string | null
          topic: string | null
        }
        Insert: {
          allow_multiple_answers?: boolean | null
          boards?: string[] | null
          command_word?: string | null
          created_at?: string | null
          curriculum?: string | null
          difficulty?: number | null
          formula?: string | null
          id?: string | null
          max_marks?: number | null
          options?: Json | null
          points?: number | null
          question_text?: string | null
          question_type?: string | null
          subject?: string | null
          subtopic?: string | null
          topic?: string | null
        }
        Update: {
          allow_multiple_answers?: boolean | null
          boards?: string[] | null
          command_word?: string | null
          created_at?: string | null
          curriculum?: string | null
          difficulty?: number | null
          formula?: string | null
          id?: string | null
          max_marks?: number | null
          options?: Json | null
          points?: number | null
          question_text?: string | null
          question_type?: string | null
          subject?: string | null
          subtopic?: string | null
          topic?: string | null
        }
        Relationships: []
      }
      study_groups_public: {
        Row: {
          created_at: string | null
          created_by: string | null
          description: string | null
          id: string | null
          max_members: number | null
          name: string | null
          subject: string | null
        }
        Insert: {
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          id?: string | null
          max_members?: number | null
          name?: string | null
          subject?: string | null
        }
        Update: {
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          id?: string | null
          max_members?: number | null
          name?: string | null
          subject?: string | null
        }
        Relationships: []
      }
    }
    Functions: {
      assert_self: { Args: { _user_id: string }; Returns: undefined }
      award_badge: {
        Args: { _badge_id: string; _user_id: string }
        Returns: boolean
      }
      confirm_subject_selection: {
        Args: { _levels: string[]; _subjects: string[]; _user_id: string }
        Returns: Json
      }
      create_flashcards_from_mistakes: {
        Args: { _limit?: number }
        Returns: number
      }
      get_daily_challenge_leaderboard: {
        Args: { _challenge_id: string }
        Returns: {
          display_name: string
          score: number
          time_taken_seconds: number
          total: number
          user_id: string
        }[]
      }
      get_display_names: {
        Args: { _user_ids: string[] }
        Returns: {
          avatar_url: string
          display_name: string
          user_id: string
        }[]
      }
      get_free_usage: {
        Args: { _user_id: string }
        Returns: {
          attempt_count: number
          subject: string
        }[]
      }
      get_mock_exam_questions: {
        Args: {
          _board?: string
          _count: number
          _curriculum: string
          _subject: string
        }
        Returns: {
          difficulty: number
          id: string
          options: Json
          points: number
          question_text: string
          subject: string
          topic: string
        }[]
      }
      get_my_challenge_summary: {
        Args: never
        Returns: {
          best_score: number
          completed: number
          total_xp: number
        }[]
      }
      get_or_create_daily_challenge: {
        Args: { _curriculum?: string; _subject: string }
        Returns: {
          curriculum: string
          date: string
          id: string
          question_count: number
          subject: string
          time_limit_seconds: number
          xp_reward: number
        }[]
      }
      get_subject_question_counts: {
        Args: never
        Returns: {
          question_count: number
          subject: string
        }[]
      }
      grant_dev_quota: { Args: { _user_id: string }; Returns: undefined }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      increment_mock_exams_used: {
        Args: { _user_id: string }
        Returns: undefined
      }
      increment_used_questions: {
        Args: { _user_id: string }
        Returns: undefined
      }
      is_tenant_admin: {
        Args: { _tenant_id: string; _user_id: string }
        Returns: boolean
      }
      is_tenant_teacher: {
        Args: { _tenant_id: string; _user_id: string }
        Returns: boolean
      }
      issue_certificate: {
        Args: {
          _achievement_type: string
          _score_percent: number
          _subject: string
          _title: string
          _user_id: string
        }
        Returns: string
      }
      lookup_tenant_by_slug: {
        Args: { _slug: string }
        Returns: {
          id: string
          logo_url: string
          name: string
        }[]
      }
      publish_question: { Args: { _question_id: string }; Returns: Json }
      question_quality_flags: { Args: { _question_id: string }; Returns: Json }
      record_answer_stats: {
        Args: { _correct: boolean; _user_id: string; _xp_gain: number }
        Returns: Json
      }
      record_daily_challenge_attempt: {
        Args: {
          _challenge_id: string
          _score: number
          _time_taken_seconds: number
          _total: number
        }
        Returns: Json
      }
      record_perfect_score: { Args: { _user_id: string }; Returns: undefined }
      register_session: {
        Args: {
          _device_info?: string
          _session_token: string
          _user_id: string
        }
        Returns: Json
      }
      validate_session: {
        Args: { _session_token: string; _user_id: string }
        Returns: boolean
      }
      verify_certificate: {
        Args: { _code: string }
        Returns: {
          achievement_type: string
          issued_at: string
          score_percent: number
          subject: string
          title: string
          verification_code: string
        }[]
      }
    }
    Enums: {
      app_role: "admin" | "teacher" | "student" | "parent"
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
      app_role: ["admin", "teacher", "student", "parent"],
    },
  },
} as const
