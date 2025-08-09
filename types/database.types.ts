export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  __InternalSupabase: {
    PostgrestVersion: "13.0.4"
  }
  public: {
    Tables: {
      activity_log: {
        Row: {
          action: string
          created_at: string | null
          id: string
          metadata: Json | null
          resource_id: string | null
          resource_type: string | null
          user_id: string
        }
        Insert: {
          action: string
          created_at?: string | null
          id?: string
          metadata?: Json | null
          resource_id?: string | null
          resource_type?: string | null
          user_id: string
        }
        Update: {
          action?: string
          created_at?: string | null
          id?: string
          metadata?: Json | null
          resource_id?: string | null
          resource_type?: string | null
          user_id?: string
        }
        Relationships: []
      }
      api_keys: {
        Row: {
          created_at: string | null
          encrypted_key: string
          expires_at: string | null
          id: string
          key_name: string
          last_used_at: string | null
          permissions: Json | null
          service: string
          user_id: string
        }
        Insert: {
          created_at?: string | null
          encrypted_key: string
          expires_at?: string | null
          id?: string
          key_name: string
          last_used_at?: string | null
          permissions?: Json | null
          service: string
          user_id: string
        }
        Update: {
          created_at?: string | null
          encrypted_key?: string
          expires_at?: string | null
          id?: string
          key_name?: string
          last_used_at?: string | null
          permissions?: Json | null
          service?: string
          user_id?: string
        }
        Relationships: []
      }
      dashboard_templates: {
        Row: {
          canvas_items: Json
          category: string | null
          created_at: string | null
          description: string | null
          id: string
          is_featured: boolean | null
          name: string
          required_data_schema: Json | null
          thumbnail_url: string | null
          use_count: number | null
        }
        Insert: {
          canvas_items: Json
          category?: string | null
          created_at?: string | null
          description?: string | null
          id?: string
          is_featured?: boolean | null
          name: string
          required_data_schema?: Json | null
          thumbnail_url?: string | null
          use_count?: number | null
        }
        Update: {
          canvas_items?: Json
          category?: string | null
          created_at?: string | null
          description?: string | null
          id?: string
          is_featured?: boolean | null
          name?: string
          required_data_schema?: Json | null
          thumbnail_url?: string | null
          use_count?: number | null
        }
        Relationships: []
      }
      dashboards: {
        Row: {
          allow_comments: boolean
          allow_downloads: boolean
          canvas_background: Json | null
          canvas_items: Json
           canvas_elements: Json
          canvas_mode: string | null
          connections: Json | null
          created_at: string | null
          data_tables: Json | null
          description: string | null
          id: string
          is_public: boolean | null
          is_unlisted: boolean
          name: string
          share_slug: string | null
          slug: string | null
          state: Json | null
          state_json: Json
          theme: string | null
          thumbnail_url: string | null
          updated_at: string | null
          user_id: string
          view_count: number | null
        }
        Insert: {
          allow_comments?: boolean
          allow_downloads?: boolean
          canvas_background?: Json | null
          canvas_items: Json
           canvas_elements?: Json
          canvas_mode?: string | null
          connections?: Json | null
          created_at?: string | null
          data_tables?: Json | null
          description?: string | null
          id?: string
          is_public?: boolean | null
          is_unlisted?: boolean
          name: string
          share_slug?: string | null
          slug?: string | null
          state?: Json | null
          state_json?: Json
          theme?: string | null
          thumbnail_url?: string | null
          updated_at?: string | null
          user_id: string
          view_count?: number | null
        }
        Update: {
          allow_comments?: boolean
          allow_downloads?: boolean
          canvas_background?: Json | null
          canvas_items?: Json
           canvas_elements?: Json
          canvas_mode?: string | null
          connections?: Json | null
          created_at?: string | null
          data_tables?: Json | null
          description?: string | null
          id?: string
          is_public?: boolean | null
          is_unlisted?: boolean
          name?: string
          share_slug?: string | null
          slug?: string | null
          state?: Json | null
          state_json?: Json
          theme?: string | null
          thumbnail_url?: string | null
          updated_at?: string | null
          user_id?: string
          view_count?: number | null
        }
        Relationships: []
      }
      data_transformations: {
        Row: {
          cache_expires_at: string | null
          created_at: string | null
          id: string
          is_cached: boolean | null
          name: string
          result_data: Json | null
          result_schema: Json | null
          source_table_ids: string[]
          transform_config: Json
          transform_type: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          cache_expires_at?: string | null
          created_at?: string | null
          id?: string
          is_cached?: boolean | null
          name: string
          result_data?: Json | null
          result_schema?: Json | null
          source_table_ids: string[]
          transform_config: Json
          transform_type: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          cache_expires_at?: string | null
          created_at?: string | null
          id?: string
          is_cached?: boolean | null
          name?: string
          result_data?: Json | null
          result_schema?: Json | null
          source_table_ids?: string[]
          transform_config?: Json
          transform_type?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_url: string | null
          company: string | null
          created_at: string | null
          email: string
          full_name: string | null
          id: string
          role: string | null
          updated_at: string | null
        }
        Insert: {
          avatar_url?: string | null
          company?: string | null
          created_at?: string | null
          email: string
          full_name?: string | null
          id: string
          role?: string | null
          updated_at?: string | null
        }
        Update: {
          avatar_url?: string | null
          company?: string | null
          created_at?: string | null
          email?: string
          full_name?: string | null
          id?: string
          role?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      saved_charts: {
        Row: {
          chart_library: string
          chart_type: string
          config: Json
          created_at: string | null
          dashboard_id: string | null
          data_source_id: string | null
          id: string
          name: string
          position: Json | null
          transform_id: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          chart_library: string
          chart_type: string
          config: Json
          created_at?: string | null
          dashboard_id?: string | null
          data_source_id?: string | null
          id?: string
          name: string
          position?: Json | null
          transform_id?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          chart_library?: string
          chart_type?: string
          config?: Json
          created_at?: string | null
          dashboard_id?: string | null
          data_source_id?: string | null
          id?: string
          name?: string
          position?: Json | null
          transform_id?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "saved_charts_dashboard_id_fkey",
            columns: ["dashboard_id"],
            isOneToOne: false,
            referencedRelation: "dashboards",
            referencedColumns: ["id"],
          },
          {
            foreignKeyName: "saved_charts_data_source_id_fkey",
            columns: ["data_source_id"],
            isOneToOne: false,
            referencedRelation: "user_data_tables",
            referencedColumns: ["id"],
          },
          {
            foreignKeyName: "saved_charts_transform_id_fkey",
            columns: ["transform_id"],
            isOneToOne: false,
            referencedRelation: "data_transformations",
            referencedColumns: ["id"],
          },
        ]
      }
      user_data_tables: {
        Row: {
          created_at: string | null
          data: Json
          description: string | null
          id: string
          last_synced_at: string | null
          name: string
          row_count: number | null
          schema: Json | null
          source: string
          source_config: Json | null
          sync_frequency: string | null
          sync_status: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          data: Json
          description?: string | null
          id?: string
          last_synced_at?: string | null
          name: string
          row_count?: number | null
          schema?: Json | null
          source: string
          source_config?: Json | null
          sync_frequency?: string | null
          sync_status?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          data?: Json
          description?: string | null
          id?: string
          last_synced_at?: string | null
          name?: string
          row_count?: number | null
          schema?: Json | null
          source?: string
          source_config?: Json | null
          sync_frequency?: string | null
          sync_status?: string | null
          updated_at?: string | null
          user_id?: string
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
    : never = never
> = DefaultSchemaTableNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] & DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends { Row: infer R }
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
    : never = never
> = DefaultSchemaTableNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends { Insert: infer I }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends { Insert: infer I }
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
    : never = never
> = DefaultSchemaTableNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends { Update: infer U }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends { Update: infer U }
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
    : never = never
> = DefaultSchemaEnumNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
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
    : never = never
> = PublicCompositeTypeNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {},
  },
} as const

