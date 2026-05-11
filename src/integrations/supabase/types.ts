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
      campaign_metrics: {
        Row: {
          campaign_id: string
          clicks: number
          created_at: string
          day: string
          id: string
          impressions: number
          user_id: string
        }
        Insert: {
          campaign_id: string
          clicks?: number
          created_at?: string
          day?: string
          id?: string
          impressions?: number
          user_id: string
        }
        Update: {
          campaign_id?: string
          clicks?: number
          created_at?: string
          day?: string
          id?: string
          impressions?: number
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "campaign_metrics_campaign_id_fkey"
            columns: ["campaign_id"]
            isOneToOne: false
            referencedRelation: "campaigns"
            referencedColumns: ["id"]
          },
        ]
      }
      campaigns: {
        Row: {
          button_label: string
          button_url: string
          clicks: number
          created_at: string
          description: string
          dm_sent: number
          dm_total: number
          id: string
          impressions: number
          media_url: string | null
          name: string
          niche: Database["public"]["Enums"]["campaign_niche"]
          objective: Database["public"]["Enums"]["campaign_objective"]
          status: Database["public"]["Enums"]["campaign_status"]
          text: string
          updated_at: string
          user_id: string
          video_url: string | null
        }
        Insert: {
          button_label?: string
          button_url?: string
          clicks?: number
          created_at?: string
          description?: string
          dm_sent?: number
          dm_total?: number
          id?: string
          impressions?: number
          media_url?: string | null
          name: string
          niche?: Database["public"]["Enums"]["campaign_niche"]
          objective?: Database["public"]["Enums"]["campaign_objective"]
          status?: Database["public"]["Enums"]["campaign_status"]
          text?: string
          updated_at?: string
          user_id: string
          video_url?: string | null
        }
        Update: {
          button_label?: string
          button_url?: string
          clicks?: number
          created_at?: string
          description?: string
          dm_sent?: number
          dm_total?: number
          id?: string
          impressions?: number
          media_url?: string | null
          name?: string
          niche?: Database["public"]["Enums"]["campaign_niche"]
          objective?: Database["public"]["Enums"]["campaign_objective"]
          status?: Database["public"]["Enums"]["campaign_status"]
          text?: string
          updated_at?: string
          user_id?: string
          video_url?: string | null
        }
        Relationships: []
      }
      dm_packages: {
        Row: {
          created_at: string
          featured: boolean
          id: string
          name: string
          price_brl: number
          quantity: number
          sort_order: number
        }
        Insert: {
          created_at?: string
          featured?: boolean
          id?: string
          name: string
          price_brl: number
          quantity: number
          sort_order?: number
        }
        Update: {
          created_at?: string
          featured?: boolean
          id?: string
          name?: string
          price_brl?: number
          quantity?: number
          sort_order?: number
        }
        Relationships: []
      }
      dm_purchases: {
        Row: {
          created_at: string
          id: string
          package_id: string | null
          package_name: string
          price_brl: number
          quantity: number
          status: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          package_id?: string | null
          package_name: string
          price_brl: number
          quantity: number
          status?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          package_id?: string | null
          package_name?: string
          price_brl?: number
          quantity?: number
          status?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "dm_purchases_package_id_fkey"
            columns: ["package_id"]
            isOneToOne: false
            referencedRelation: "dm_packages"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          created_at: string
          display_name: string | null
          dm_balance: number
          id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          display_name?: string | null
          dm_balance?: number
          id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          display_name?: string | null
          dm_balance?: number
          id?: string
          updated_at?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      consume_dms: {
        Args: { _campaign_id: string; _qty: number }
        Returns: Json
      }
      purchase_dm_package: { Args: { _package_id: string }; Returns: Json }
    }
    Enums: {
      campaign_niche:
        | "gaming"
        | "income"
        | "crypto"
        | "adult"
        | "news"
        | "tech"
        | "lifestyle"
      campaign_objective: "traffic" | "conversion" | "engagement"
      campaign_status: "draft" | "active" | "paused" | "completed"
      transaction_type: "deposit" | "spend" | "refund"
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
      campaign_niche: [
        "gaming",
        "income",
        "crypto",
        "adult",
        "news",
        "tech",
        "lifestyle",
      ],
      campaign_objective: ["traffic", "conversion", "engagement"],
      campaign_status: ["draft", "active", "paused", "completed"],
      transaction_type: ["deposit", "spend", "refund"],
    },
  },
} as const
