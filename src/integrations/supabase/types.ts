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
      bookmarks: {
        Row: {
          created_at: string
          id: string
          list_id: string | null
          problem_id: string | null
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          list_id?: string | null
          problem_id?: string | null
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          list_id?: string | null
          problem_id?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "bookmarks_list_id_fkey"
            columns: ["list_id"]
            isOneToOne: false
            referencedRelation: "problem_lists"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bookmarks_problem_id_fkey"
            columns: ["problem_id"]
            isOneToOne: false
            referencedRelation: "problems"
            referencedColumns: ["id"]
          },
        ]
      }
      comment_likes: {
        Row: {
          comment_id: string
          created_at: string
          id: string
          user_id: string
        }
        Insert: {
          comment_id: string
          created_at?: string
          id?: string
          user_id: string
        }
        Update: {
          comment_id?: string
          created_at?: string
          id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "comment_likes_comment_id_fkey"
            columns: ["comment_id"]
            isOneToOne: false
            referencedRelation: "comments"
            referencedColumns: ["id"]
          },
        ]
      }
      comments: {
        Row: {
          content: string
          created_at: string
          id: string
          likes: number | null
          parent_id: string | null
          problem_id: string
          user_avatar: string | null
          user_id: string
          user_name: string
        }
        Insert: {
          content: string
          created_at?: string
          id?: string
          likes?: number | null
          parent_id?: string | null
          problem_id: string
          user_avatar?: string | null
          user_id: string
          user_name: string
        }
        Update: {
          content?: string
          created_at?: string
          id?: string
          likes?: number | null
          parent_id?: string | null
          problem_id?: string
          user_avatar?: string | null
          user_id?: string
          user_name?: string
        }
        Relationships: [
          {
            foreignKeyName: "comments_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "comments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "comments_problem_id_fkey"
            columns: ["problem_id"]
            isOneToOne: false
            referencedRelation: "problems"
            referencedColumns: ["id"]
          },
        ]
      }
      custom_themes: {
        Row: {
          colors: Json
          created_at: string
          id: string
          is_dark: boolean | null
          name: string
          updated_at: string
          user_id: string
        }
        Insert: {
          colors?: Json
          created_at?: string
          id?: string
          is_dark?: boolean | null
          name: string
          updated_at?: string
          user_id: string
        }
        Update: {
          colors?: Json
          created_at?: string
          id?: string
          is_dark?: boolean | null
          name?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      list_followers: {
        Row: {
          created_at: string
          id: string
          list_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          list_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          list_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "list_followers_list_id_fkey"
            columns: ["list_id"]
            isOneToOne: false
            referencedRelation: "problem_lists"
            referencedColumns: ["id"]
          },
        ]
      }
      notes: {
        Row: {
          content: string
          id: string
          problem_id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          content?: string
          id?: string
          problem_id: string
          updated_at?: string
          user_id: string
        }
        Update: {
          content?: string
          id?: string
          problem_id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "notes_problem_id_fkey"
            columns: ["problem_id"]
            isOneToOne: false
            referencedRelation: "problems"
            referencedColumns: ["id"]
          },
        ]
      }
      problem_likes: {
        Row: {
          created_at: string
          id: string
          problem_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          problem_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          problem_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "problem_likes_problem_id_fkey"
            columns: ["problem_id"]
            isOneToOne: false
            referencedRelation: "problems"
            referencedColumns: ["id"]
          },
        ]
      }
      problem_lists: {
        Row: {
          created_at: string
          creator_id: string
          creator_name: string
          description: string | null
          followers: number | null
          id: string
          is_sequential: boolean | null
          sections: Json | null
          share_code: string
          title: string
          updated_at: string
          visibility: string
        }
        Insert: {
          created_at?: string
          creator_id: string
          creator_name: string
          description?: string | null
          followers?: number | null
          id?: string
          is_sequential?: boolean | null
          sections?: Json | null
          share_code: string
          title: string
          updated_at?: string
          visibility?: string
        }
        Update: {
          created_at?: string
          creator_id?: string
          creator_name?: string
          description?: string | null
          followers?: number | null
          id?: string
          is_sequential?: boolean | null
          sections?: Json | null
          share_code?: string
          title?: string
          updated_at?: string
          visibility?: string
        }
        Relationships: []
      }
      problems: {
        Row: {
          acceptance_rate: number | null
          constraints: Json | null
          content: string
          created_at: string
          creator_id: string
          creator_name: string
          description: string
          difficulty: string
          examples: Json | null
          id: string
          input_format: string | null
          likes: number | null
          output_format: string | null
          share_code: string
          slug: string
          starter_code: Json | null
          submissions_count: number | null
          tags: string[] | null
          test_cases: Json | null
          time_limit: number | null
          title: string
          updated_at: string
          visibility: string
        }
        Insert: {
          acceptance_rate?: number | null
          constraints?: Json | null
          content: string
          created_at?: string
          creator_id: string
          creator_name: string
          description?: string
          difficulty: string
          examples?: Json | null
          id?: string
          input_format?: string | null
          likes?: number | null
          output_format?: string | null
          share_code: string
          slug: string
          starter_code?: Json | null
          submissions_count?: number | null
          tags?: string[] | null
          test_cases?: Json | null
          time_limit?: number | null
          title: string
          updated_at?: string
          visibility?: string
        }
        Update: {
          acceptance_rate?: number | null
          constraints?: Json | null
          content?: string
          created_at?: string
          creator_id?: string
          creator_name?: string
          description?: string
          difficulty?: string
          examples?: Json | null
          id?: string
          input_format?: string | null
          likes?: number | null
          output_format?: string | null
          share_code?: string
          slug?: string
          starter_code?: Json | null
          submissions_count?: number | null
          tags?: string[] | null
          test_cases?: Json | null
          time_limit?: number | null
          title?: string
          updated_at?: string
          visibility?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_url: string | null
          bio: string | null
          created_at: string
          id: string
          stats: Json | null
          updated_at: string
          user_id: string
          username: string
        }
        Insert: {
          avatar_url?: string | null
          bio?: string | null
          created_at?: string
          id?: string
          stats?: Json | null
          updated_at?: string
          user_id: string
          username: string
        }
        Update: {
          avatar_url?: string | null
          bio?: string | null
          created_at?: string
          id?: string
          stats?: Json | null
          updated_at?: string
          user_id?: string
          username?: string
        }
        Relationships: []
      }
      submissions: {
        Row: {
          code: string
          created_at: string
          error_message: string | null
          id: string
          language: string
          memory: number | null
          problem_id: string
          runtime: number | null
          status: string
          test_cases_passed: number | null
          total_test_cases: number | null
          user_id: string
        }
        Insert: {
          code: string
          created_at?: string
          error_message?: string | null
          id?: string
          language: string
          memory?: number | null
          problem_id: string
          runtime?: number | null
          status: string
          test_cases_passed?: number | null
          total_test_cases?: number | null
          user_id: string
        }
        Update: {
          code?: string
          created_at?: string
          error_message?: string | null
          id?: string
          language?: string
          memory?: number | null
          problem_id?: string
          runtime?: number | null
          status?: string
          test_cases_passed?: number | null
          total_test_cases?: number | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "submissions_problem_id_fkey"
            columns: ["problem_id"]
            isOneToOne: false
            referencedRelation: "problems"
            referencedColumns: ["id"]
          },
        ]
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
