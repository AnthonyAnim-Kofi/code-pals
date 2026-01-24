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
    PostgrestVersion: "14.1"
  }
  public: {
    Tables: {
      achievements: {
        Row: {
          created_at: string
          description: string
          icon: string
          id: string
          name: string
          requirement_type: string
          requirement_value: number
        }
        Insert: {
          created_at?: string
          description: string
          icon: string
          id?: string
          name: string
          requirement_type: string
          requirement_value: number
        }
        Update: {
          created_at?: string
          description?: string
          icon?: string
          id?: string
          name?: string
          requirement_type?: string
          requirement_value?: number
        }
        Relationships: []
      }
      challenges: {
        Row: {
          challenged_id: string
          challenged_score: number | null
          challenger_id: string
          challenger_score: number | null
          completed_at: string | null
          created_at: string
          id: string
          lesson_id: number
          status: string
        }
        Insert: {
          challenged_id: string
          challenged_score?: number | null
          challenger_id: string
          challenger_score?: number | null
          completed_at?: string | null
          created_at?: string
          id?: string
          lesson_id: number
          status?: string
        }
        Update: {
          challenged_id?: string
          challenged_score?: number | null
          challenger_id?: string
          challenger_score?: number | null
          completed_at?: string | null
          created_at?: string
          id?: string
          lesson_id?: number
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "challenges_challenged_id_fkey"
            columns: ["challenged_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "challenges_challenger_id_fkey"
            columns: ["challenger_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["user_id"]
          },
        ]
      }
      daily_quests: {
        Row: {
          created_at: string
          description: string
          gem_reward: number
          id: string
          is_weekly: boolean
          quest_type: string
          target_value: number
          title: string
        }
        Insert: {
          created_at?: string
          description: string
          gem_reward?: number
          id?: string
          is_weekly?: boolean
          quest_type: string
          target_value: number
          title: string
        }
        Update: {
          created_at?: string
          description?: string
          gem_reward?: number
          id?: string
          is_weekly?: boolean
          quest_type?: string
          target_value?: number
          title?: string
        }
        Relationships: []
      }
      languages: {
        Row: {
          created_at: string
          description: string | null
          icon: string
          id: string
          is_active: boolean
          name: string
          slug: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          icon?: string
          id?: string
          is_active?: boolean
          name: string
          slug: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          icon?: string
          id?: string
          is_active?: boolean
          name?: string
          slug?: string
          updated_at?: string
        }
        Relationships: []
      }
      league_history: {
        Row: {
          action: string
          created_at: string
          from_league: string
          id: string
          rank_in_league: number
          to_league: string
          user_id: string
          week_ending: string
          weekly_xp: number
        }
        Insert: {
          action: string
          created_at?: string
          from_league: string
          id?: string
          rank_in_league: number
          to_league: string
          user_id: string
          week_ending: string
          weekly_xp: number
        }
        Update: {
          action?: string
          created_at?: string
          from_league?: string
          id?: string
          rank_in_league?: number
          to_league?: string
          user_id?: string
          week_ending?: string
          weekly_xp?: number
        }
        Relationships: [
          {
            foreignKeyName: "league_history_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["user_id"]
          },
        ]
      }
      lesson_progress: {
        Row: {
          accuracy: number
          completed: boolean
          completed_at: string | null
          created_at: string
          id: string
          lesson_id: number
          user_id: string
          xp_earned: number
        }
        Insert: {
          accuracy?: number
          completed?: boolean
          completed_at?: string | null
          created_at?: string
          id?: string
          lesson_id: number
          user_id: string
          xp_earned?: number
        }
        Update: {
          accuracy?: number
          completed?: boolean
          completed_at?: string | null
          created_at?: string
          id?: string
          lesson_id?: number
          user_id?: string
          xp_earned?: number
        }
        Relationships: []
      }
      lessons: {
        Row: {
          created_at: string
          id: string
          is_active: boolean
          order_index: number
          title: string
          unit_id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_active?: boolean
          order_index?: number
          title: string
          unit_id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          is_active?: boolean
          order_index?: number
          title?: string
          unit_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "lessons_unit_id_fkey"
            columns: ["unit_id"]
            isOneToOne: false
            referencedRelation: "units"
            referencedColumns: ["id"]
          },
        ]
      }
      partial_lesson_progress: {
        Row: {
          answered_questions: Json
          correct_answers: number
          created_at: string
          current_question_index: number
          id: string
          lesson_id: string
          updated_at: string
          user_id: string
          xp_earned: number
        }
        Insert: {
          answered_questions?: Json
          correct_answers?: number
          created_at?: string
          current_question_index?: number
          id?: string
          lesson_id: string
          updated_at?: string
          user_id: string
          xp_earned?: number
        }
        Update: {
          answered_questions?: Json
          correct_answers?: number
          created_at?: string
          current_question_index?: number
          id?: string
          lesson_id?: string
          updated_at?: string
          user_id?: string
          xp_earned?: number
        }
        Relationships: [
          {
            foreignKeyName: "partial_lesson_progress_lesson_id_fkey"
            columns: ["lesson_id"]
            isOneToOne: false
            referencedRelation: "lessons"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          active_language_id: string | null
          avatar_url: string | null
          created_at: string
          display_name: string | null
          double_xp_until: string | null
          gems: number
          heart_regeneration_started_at: string | null
          hearts: number
          id: string
          last_practice_date: string | null
          league: string
          streak_count: number
          streak_freeze_count: number
          updated_at: string
          user_id: string
          username: string | null
          weekly_xp: number
          xp: number
        }
        Insert: {
          active_language_id?: string | null
          avatar_url?: string | null
          created_at?: string
          display_name?: string | null
          double_xp_until?: string | null
          gems?: number
          heart_regeneration_started_at?: string | null
          hearts?: number
          id?: string
          last_practice_date?: string | null
          league?: string
          streak_count?: number
          streak_freeze_count?: number
          updated_at?: string
          user_id: string
          username?: string | null
          weekly_xp?: number
          xp?: number
        }
        Update: {
          active_language_id?: string | null
          avatar_url?: string | null
          created_at?: string
          display_name?: string | null
          double_xp_until?: string | null
          gems?: number
          heart_regeneration_started_at?: string | null
          hearts?: number
          id?: string
          last_practice_date?: string | null
          league?: string
          streak_count?: number
          streak_freeze_count?: number
          updated_at?: string
          user_id?: string
          username?: string | null
          weekly_xp?: number
          xp?: number
        }
        Relationships: [
          {
            foreignKeyName: "profiles_active_language_id_fkey"
            columns: ["active_language_id"]
            isOneToOne: false
            referencedRelation: "languages"
            referencedColumns: ["id"]
          },
        ]
      }
      questions: {
        Row: {
          answer: string | null
          blocks: Json | null
          code: string | null
          correct_order: Json | null
          created_at: string
          expected_output: string | null
          hint: string | null
          id: string
          initial_code: string | null
          instruction: string
          lesson_id: string
          options: Json | null
          order_index: number
          type: string
          updated_at: string
          xp_reward: number
        }
        Insert: {
          answer?: string | null
          blocks?: Json | null
          code?: string | null
          correct_order?: Json | null
          created_at?: string
          expected_output?: string | null
          hint?: string | null
          id?: string
          initial_code?: string | null
          instruction: string
          lesson_id: string
          options?: Json | null
          order_index?: number
          type: string
          updated_at?: string
          xp_reward?: number
        }
        Update: {
          answer?: string | null
          blocks?: Json | null
          code?: string | null
          correct_order?: Json | null
          created_at?: string
          expected_output?: string | null
          hint?: string | null
          id?: string
          initial_code?: string | null
          instruction?: string
          lesson_id?: string
          options?: Json | null
          order_index?: number
          type?: string
          updated_at?: string
          xp_reward?: number
        }
        Relationships: [
          {
            foreignKeyName: "questions_lesson_id_fkey"
            columns: ["lesson_id"]
            isOneToOne: false
            referencedRelation: "lessons"
            referencedColumns: ["id"]
          },
        ]
      }
      unit_notes: {
        Row: {
          content: string
          created_at: string
          id: string
          order_index: number
          title: string
          unit_id: string
          updated_at: string
        }
        Insert: {
          content: string
          created_at?: string
          id?: string
          order_index?: number
          title: string
          unit_id: string
          updated_at?: string
        }
        Update: {
          content?: string
          created_at?: string
          id?: string
          order_index?: number
          title?: string
          unit_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "unit_notes_unit_id_fkey"
            columns: ["unit_id"]
            isOneToOne: false
            referencedRelation: "units"
            referencedColumns: ["id"]
          },
        ]
      }
      units: {
        Row: {
          color: string
          created_at: string
          description: string | null
          id: string
          is_active: boolean
          language_id: string
          order_index: number
          title: string
          updated_at: string
        }
        Insert: {
          color?: string
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean
          language_id: string
          order_index?: number
          title: string
          updated_at?: string
        }
        Update: {
          color?: string
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean
          language_id?: string
          order_index?: number
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "units_language_id_fkey"
            columns: ["language_id"]
            isOneToOne: false
            referencedRelation: "languages"
            referencedColumns: ["id"]
          },
        ]
      }
      user_achievements: {
        Row: {
          achievement_id: string
          earned_at: string
          id: string
          user_id: string
        }
        Insert: {
          achievement_id: string
          earned_at?: string
          id?: string
          user_id: string
        }
        Update: {
          achievement_id?: string
          earned_at?: string
          id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_achievements_achievement_id_fkey"
            columns: ["achievement_id"]
            isOneToOne: false
            referencedRelation: "achievements"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_achievements_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["user_id"]
          },
        ]
      }
      user_follows: {
        Row: {
          created_at: string
          follower_id: string
          following_id: string
          id: string
        }
        Insert: {
          created_at?: string
          follower_id: string
          following_id: string
          id?: string
        }
        Update: {
          created_at?: string
          follower_id?: string
          following_id?: string
          id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_follows_follower_id_fkey"
            columns: ["follower_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "user_follows_following_id_fkey"
            columns: ["following_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["user_id"]
          },
        ]
      }
      user_quest_progress: {
        Row: {
          claimed: boolean
          claimed_at: string | null
          completed: boolean
          completed_at: string | null
          created_at: string
          current_value: number
          id: string
          quest_date: string
          quest_id: string
          user_id: string
        }
        Insert: {
          claimed?: boolean
          claimed_at?: string | null
          completed?: boolean
          completed_at?: string | null
          created_at?: string
          current_value?: number
          id?: string
          quest_date?: string
          quest_id: string
          user_id: string
        }
        Update: {
          claimed?: boolean
          claimed_at?: string | null
          completed?: boolean
          completed_at?: string | null
          created_at?: string
          current_value?: number
          id?: string
          quest_date?: string
          quest_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_quest_progress_quest_id_fkey"
            columns: ["quest_id"]
            isOneToOne: false
            referencedRelation: "daily_quests"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      process_weekly_leagues: { Args: never; Returns: undefined }
    }
    Enums: {
      app_role: "admin" | "moderator" | "user"
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
      app_role: ["admin", "moderator", "user"],
    },
  },
} as const
