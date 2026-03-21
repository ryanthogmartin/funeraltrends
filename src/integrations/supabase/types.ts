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
      funeral_reddit_posts: {
        Row: {
          fetched_at: string
          id: string
          num_comments: number
          posted_at: string | null
          reddit_id: string
          score: number
          sentiment: string
          subreddit: string
          title: string
          url: string
        }
        Insert: {
          fetched_at?: string
          id?: string
          num_comments?: number
          posted_at?: string | null
          reddit_id: string
          score?: number
          sentiment?: string
          subreddit: string
          title: string
          url: string
        }
        Update: {
          fetched_at?: string
          id?: string
          num_comments?: number
          posted_at?: string | null
          reddit_id?: string
          score?: number
          sentiment?: string
          subreddit?: string
          title?: string
          url?: string
        }
        Relationships: []
      }
      funeral_trends: {
        Row: {
          category: string | null
          change_percent: number
          fetched_at: string
          id: string
          keyword: string
          sparkline: Json | null
          volume: number
        }
        Insert: {
          category?: string | null
          change_percent?: number
          fetched_at?: string
          id?: string
          keyword: string
          sparkline?: Json | null
          volume?: number
        }
        Update: {
          category?: string | null
          change_percent?: number
          fetched_at?: string
          id?: string
          keyword?: string
          sparkline?: Json | null
          volume?: number
        }
        Relationships: []
      }
      keyword_watchlist: {
        Row: {
          created_at: string
          id: string
          keyword: string
          last_change_percent: number | null
          last_volume: number | null
          spiked: boolean | null
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          keyword: string
          last_change_percent?: number | null
          last_volume?: number | null
          spiked?: boolean | null
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          keyword?: string
          last_change_percent?: number | null
          last_volume?: number | null
          spiked?: boolean | null
          user_id?: string
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
      trend_signals: {
        Row: {
          fetched_at: string
          id: string
          related_keywords: Json | null
          relevance_score: number
          signal_type: string
          source: string
          source_urls: Json | null
          summary: string
          title: string
        }
        Insert: {
          fetched_at?: string
          id?: string
          related_keywords?: Json | null
          relevance_score?: number
          signal_type?: string
          source?: string
          source_urls?: Json | null
          summary: string
          title: string
        }
        Update: {
          fetched_at?: string
          id?: string
          related_keywords?: Json | null
          relevance_score?: number
          signal_type?: string
          source?: string
          source_urls?: Json | null
          summary?: string
          title?: string
        }
        Relationships: []
      }
      user_keywords: {
        Row: {
          category: string | null
          created_at: string
          id: string
          is_public: boolean | null
          keyword: string
          user_id: string
        }
        Insert: {
          category?: string | null
          created_at?: string
          id?: string
          is_public?: boolean | null
          keyword: string
          user_id: string
        }
        Update: {
          category?: string | null
          created_at?: string
          id?: string
          is_public?: boolean | null
          keyword?: string
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
      [_ in never]: never
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
