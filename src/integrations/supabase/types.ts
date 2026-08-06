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
      function_rate_limits: {
        Row: {
          call_count: number
          function_name: string
          id: string
          user_id: string
          window_start: string
        }
        Insert: {
          call_count?: number
          function_name: string
          id?: string
          user_id: string
          window_start: string
        }
        Update: {
          call_count?: number
          function_name?: string
          id?: string
          user_id?: string
          window_start?: string
        }
        Relationships: []
      }
      saved_ideas: {
        Row: {
          created_at: string
          id: string
          idea_text: string
          script_body: string | null
          script_cta: string | null
          script_hook: string | null
          script_tone: string | null
          source: string | null
          type: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          idea_text: string
          script_body?: string | null
          script_cta?: string | null
          script_hook?: string | null
          script_tone?: string | null
          source?: string | null
          type: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          idea_text?: string
          script_body?: string | null
          script_cta?: string | null
          script_hook?: string | null
          script_tone?: string | null
          source?: string | null
          type?: string
          user_id?: string
        }
        Relationships: []
      }
      script_fingerprints: {
        Row: {
          biz_type: string | null
          content_hash: string
          created_at: string
          id: string
          idea_text: string | null
          normalized_text: string
          tone: string | null
          user_id: string
        }
        Insert: {
          biz_type?: string | null
          content_hash: string
          created_at?: string
          id?: string
          idea_text?: string | null
          normalized_text: string
          tone?: string | null
          user_id: string
        }
        Update: {
          biz_type?: string | null
          content_hash?: string
          created_at?: string
          id?: string
          idea_text?: string | null
          normalized_text?: string
          tone?: string | null
          user_id?: string
        }
        Relationships: []
      }
      voice_profiles: {
        Row: {
          anecdote_style: string
          audience_address: string
          catchphrases: string | null
          content_pillars: string | null
          created_at: string
          cta_style: string
          faith_lens: string
          funeral_home_name: string | null
          humor_comfort: string
          id: string
          origin_story: string | null
          pacing_style: string
          sample_script: string | null
          signature_opening: string | null
          specialties: string | null
          taboo_topics: string | null
          target_audience_age: string
          tone_descriptor: string
          updated_at: string
          user_id: string
          video_style: string
          vocabulary_level: string
          years_experience: string | null
        }
        Insert: {
          anecdote_style?: string
          audience_address?: string
          catchphrases?: string | null
          content_pillars?: string | null
          created_at?: string
          cta_style?: string
          faith_lens?: string
          funeral_home_name?: string | null
          humor_comfort?: string
          id?: string
          origin_story?: string | null
          pacing_style?: string
          sample_script?: string | null
          signature_opening?: string | null
          specialties?: string | null
          taboo_topics?: string | null
          target_audience_age?: string
          tone_descriptor?: string
          updated_at?: string
          user_id: string
          video_style?: string
          vocabulary_level?: string
          years_experience?: string | null
        }
        Update: {
          anecdote_style?: string
          audience_address?: string
          catchphrases?: string | null
          content_pillars?: string | null
          created_at?: string
          cta_style?: string
          faith_lens?: string
          funeral_home_name?: string | null
          humor_comfort?: string
          id?: string
          origin_story?: string | null
          pacing_style?: string
          sample_script?: string | null
          signature_opening?: string | null
          specialties?: string | null
          taboo_topics?: string | null
          target_audience_age?: string
          tone_descriptor?: string
          updated_at?: string
          user_id?: string
          video_style?: string
          vocabulary_level?: string
          years_experience?: string | null
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      increment_function_rate_limit: {
        Args: {
          p_function_name: string
          p_user_id: string
          p_window_start: string
        }
        Returns: number
      }
    }
    Enums: {
      [_ in never]: never
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
    Enums: {},
  },
} as const
