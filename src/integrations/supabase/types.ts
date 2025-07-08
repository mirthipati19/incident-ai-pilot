export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instanciate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "12.2.3 (519615d)"
  }
  public: {
    Tables: {
      admin_mfa_tokens: {
        Row: {
          admin_user_id: string
          created_at: string | null
          expires_at: string
          id: string
          is_used: boolean | null
          token: string
          token_type: string
        }
        Insert: {
          admin_user_id: string
          created_at?: string | null
          expires_at: string
          id?: string
          is_used?: boolean | null
          token: string
          token_type?: string
        }
        Update: {
          admin_user_id?: string
          created_at?: string | null
          expires_at?: string
          id?: string
          is_used?: boolean | null
          token?: string
          token_type?: string
        }
        Relationships: [
          {
            foreignKeyName: "admin_mfa_tokens_admin_user_id_fkey"
            columns: ["admin_user_id"]
            isOneToOne: false
            referencedRelation: "admin_users"
            referencedColumns: ["user_id"]
          },
        ]
      }
      admin_sessions: {
        Row: {
          admin_user_id: string
          created_at: string | null
          expires_at: string
          id: string
          is_active: boolean | null
          last_used_at: string | null
          session_token: string
        }
        Insert: {
          admin_user_id: string
          created_at?: string | null
          expires_at: string
          id?: string
          is_active?: boolean | null
          last_used_at?: string | null
          session_token: string
        }
        Update: {
          admin_user_id?: string
          created_at?: string | null
          expires_at?: string
          id?: string
          is_active?: boolean | null
          last_used_at?: string | null
          session_token?: string
        }
        Relationships: [
          {
            foreignKeyName: "admin_sessions_admin_user_id_fkey"
            columns: ["admin_user_id"]
            isOneToOne: false
            referencedRelation: "admin_users"
            referencedColumns: ["user_id"]
          },
        ]
      }
      admin_users: {
        Row: {
          created_at: string
          email_verification_token: string | null
          id: string
          is_email_verified: boolean | null
          organization_id: string | null
          permissions: string[] | null
          role: string
          user_id: string
        }
        Insert: {
          created_at?: string
          email_verification_token?: string | null
          id?: string
          is_email_verified?: boolean | null
          organization_id?: string | null
          permissions?: string[] | null
          role?: string
          user_id: string
        }
        Update: {
          created_at?: string
          email_verification_token?: string | null
          id?: string
          is_email_verified?: boolean | null
          organization_id?: string | null
          permissions?: string[] | null
          role?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "admin_users_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      ai_resolution_stats: {
        Row: {
          ai_confidence_score: number | null
          category: string | null
          created_at: string
          id: string
          incident_id: string | null
          resolution_method: string
          resolution_time_minutes: number | null
          resolved_at: string | null
          response_time_minutes: number | null
          user_satisfaction_score: number | null
        }
        Insert: {
          ai_confidence_score?: number | null
          category?: string | null
          created_at?: string
          id?: string
          incident_id?: string | null
          resolution_method: string
          resolution_time_minutes?: number | null
          resolved_at?: string | null
          response_time_minutes?: number | null
          user_satisfaction_score?: number | null
        }
        Update: {
          ai_confidence_score?: number | null
          category?: string | null
          created_at?: string
          id?: string
          incident_id?: string | null
          resolution_method?: string
          resolution_time_minutes?: number | null
          resolved_at?: string | null
          response_time_minutes?: number | null
          user_satisfaction_score?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "ai_resolution_stats_incident_id_fkey"
            columns: ["incident_id"]
            isOneToOne: false
            referencedRelation: "incidents"
            referencedColumns: ["id"]
          },
        ]
      }
      approval_workflows: {
        Row: {
          created_at: string
          description: string | null
          id: string
          is_active: boolean | null
          name: string
          updated_at: string
          workflow_steps: Json
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean | null
          name: string
          updated_at?: string
          workflow_steps?: Json
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean | null
          name?: string
          updated_at?: string
          workflow_steps?: Json
        }
        Relationships: []
      }
      article_feedback: {
        Row: {
          article_id: string
          created_at: string
          feedback_text: string | null
          id: string
          is_helpful: boolean
          user_id: string
        }
        Insert: {
          article_id: string
          created_at?: string
          feedback_text?: string | null
          id?: string
          is_helpful: boolean
          user_id: string
        }
        Update: {
          article_id?: string
          created_at?: string
          feedback_text?: string | null
          id?: string
          is_helpful?: boolean
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "article_feedback_article_id_fkey"
            columns: ["article_id"]
            isOneToOne: false
            referencedRelation: "knowledge_articles"
            referencedColumns: ["id"]
          },
        ]
      }
      asset_license_assignments: {
        Row: {
          asset_id: string
          assigned_at: string
          assigned_by: string
          id: string
          license_id: string
        }
        Insert: {
          asset_id: string
          assigned_at?: string
          assigned_by: string
          id?: string
          license_id: string
        }
        Update: {
          asset_id?: string
          assigned_at?: string
          assigned_by?: string
          id?: string
          license_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "asset_license_assignments_asset_id_fkey"
            columns: ["asset_id"]
            isOneToOne: false
            referencedRelation: "assets"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "asset_license_assignments_license_id_fkey"
            columns: ["license_id"]
            isOneToOne: false
            referencedRelation: "software_licenses"
            referencedColumns: ["id"]
          },
        ]
      }
      asset_relationships: {
        Row: {
          child_asset_id: string
          created_at: string
          description: string | null
          id: string
          parent_asset_id: string
          relationship_type: string
        }
        Insert: {
          child_asset_id: string
          created_at?: string
          description?: string | null
          id?: string
          parent_asset_id: string
          relationship_type: string
        }
        Update: {
          child_asset_id?: string
          created_at?: string
          description?: string | null
          id?: string
          parent_asset_id?: string
          relationship_type?: string
        }
        Relationships: [
          {
            foreignKeyName: "asset_relationships_child_asset_id_fkey"
            columns: ["child_asset_id"]
            isOneToOne: false
            referencedRelation: "assets"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "asset_relationships_parent_asset_id_fkey"
            columns: ["parent_asset_id"]
            isOneToOne: false
            referencedRelation: "assets"
            referencedColumns: ["id"]
          },
        ]
      }
      assets: {
        Row: {
          asset_tag: string
          asset_type: string
          assigned_to: string | null
          category: string
          cost: number | null
          created_at: string
          current_value: number | null
          depreciation_rate: number | null
          id: string
          location: string | null
          manufacturer: string | null
          model: string | null
          name: string
          purchase_date: string | null
          serial_number: string | null
          specifications: Json | null
          status: string
          updated_at: string
          warranty_expiry: string | null
        }
        Insert: {
          asset_tag: string
          asset_type: string
          assigned_to?: string | null
          category: string
          cost?: number | null
          created_at?: string
          current_value?: number | null
          depreciation_rate?: number | null
          id?: string
          location?: string | null
          manufacturer?: string | null
          model?: string | null
          name: string
          purchase_date?: string | null
          serial_number?: string | null
          specifications?: Json | null
          status?: string
          updated_at?: string
          warranty_expiry?: string | null
        }
        Update: {
          asset_tag?: string
          asset_type?: string
          assigned_to?: string | null
          category?: string
          cost?: number | null
          created_at?: string
          current_value?: number | null
          depreciation_rate?: number | null
          id?: string
          location?: string | null
          manufacturer?: string | null
          model?: string | null
          name?: string
          purchase_date?: string | null
          serial_number?: string | null
          specifications?: Json | null
          status?: string
          updated_at?: string
          warranty_expiry?: string | null
        }
        Relationships: []
      }
      captcha_verifications: {
        Row: {
          attempts: number | null
          challenge: string
          created_at: string
          expires_at: string
          id: string
          session_id: string
          solution: string
          verified: boolean | null
        }
        Insert: {
          attempts?: number | null
          challenge: string
          created_at?: string
          expires_at?: string
          id?: string
          session_id: string
          solution: string
          verified?: boolean | null
        }
        Update: {
          attempts?: number | null
          challenge?: string
          created_at?: string
          expires_at?: string
          id?: string
          session_id?: string
          solution?: string
          verified?: boolean | null
        }
        Relationships: []
      }
      community_answers: {
        Row: {
          author_id: string
          content: string
          created_at: string
          downvotes: number | null
          id: string
          is_accepted: boolean | null
          question_id: string
          updated_at: string
          upvotes: number | null
        }
        Insert: {
          author_id: string
          content: string
          created_at?: string
          downvotes?: number | null
          id?: string
          is_accepted?: boolean | null
          question_id: string
          updated_at?: string
          upvotes?: number | null
        }
        Update: {
          author_id?: string
          content?: string
          created_at?: string
          downvotes?: number | null
          id?: string
          is_accepted?: boolean | null
          question_id?: string
          updated_at?: string
          upvotes?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "community_answers_question_id_fkey"
            columns: ["question_id"]
            isOneToOne: false
            referencedRelation: "community_questions"
            referencedColumns: ["id"]
          },
        ]
      }
      community_questions: {
        Row: {
          accepted_answer_id: string | null
          author_id: string
          content: string
          created_at: string
          downvotes: number | null
          id: string
          status: string
          tags: string[] | null
          title: string
          updated_at: string
          upvotes: number | null
          view_count: number | null
        }
        Insert: {
          accepted_answer_id?: string | null
          author_id: string
          content: string
          created_at?: string
          downvotes?: number | null
          id?: string
          status?: string
          tags?: string[] | null
          title: string
          updated_at?: string
          upvotes?: number | null
          view_count?: number | null
        }
        Update: {
          accepted_answer_id?: string | null
          author_id?: string
          content?: string
          created_at?: string
          downvotes?: number | null
          id?: string
          status?: string
          tags?: string[] | null
          title?: string
          updated_at?: string
          upvotes?: number | null
          view_count?: number | null
        }
        Relationships: []
      }
      incidents: {
        Row: {
          assignee: string | null
          category: string
          created_at: string
          description: string
          first_response_at: string | null
          id: string
          organization_id: string | null
          priority: string
          resolution_time_minutes: number | null
          resolved_at: string | null
          response_time_minutes: number | null
          status: string
          title: string
          updated_at: string
          user_id: string
        }
        Insert: {
          assignee?: string | null
          category?: string
          created_at?: string
          description: string
          first_response_at?: string | null
          id?: string
          organization_id?: string | null
          priority?: string
          resolution_time_minutes?: number | null
          resolved_at?: string | null
          response_time_minutes?: number | null
          status?: string
          title: string
          updated_at?: string
          user_id: string
        }
        Update: {
          assignee?: string | null
          category?: string
          created_at?: string
          description?: string
          first_response_at?: string | null
          id?: string
          organization_id?: string | null
          priority?: string
          resolution_time_minutes?: number | null
          resolved_at?: string | null
          response_time_minutes?: number | null
          status?: string
          title?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "incidents_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "incidents_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      knowledge_articles: {
        Row: {
          author_id: string
          category: string
          content: string
          created_at: string
          helpful_votes: number | null
          id: string
          is_auto_generated: boolean | null
          search_vector: unknown | null
          source_incident_id: string | null
          status: string
          summary: string | null
          tags: string[] | null
          title: string
          unhelpful_votes: number | null
          updated_at: string
          version: number | null
          view_count: number | null
        }
        Insert: {
          author_id: string
          category: string
          content: string
          created_at?: string
          helpful_votes?: number | null
          id?: string
          is_auto_generated?: boolean | null
          search_vector?: unknown | null
          source_incident_id?: string | null
          status?: string
          summary?: string | null
          tags?: string[] | null
          title: string
          unhelpful_votes?: number | null
          updated_at?: string
          version?: number | null
          view_count?: number | null
        }
        Update: {
          author_id?: string
          category?: string
          content?: string
          created_at?: string
          helpful_votes?: number | null
          id?: string
          is_auto_generated?: boolean | null
          search_vector?: unknown | null
          source_incident_id?: string | null
          status?: string
          summary?: string | null
          tags?: string[] | null
          title?: string
          unhelpful_votes?: number | null
          updated_at?: string
          version?: number | null
          view_count?: number | null
        }
        Relationships: []
      }
      mfa_tokens: {
        Row: {
          created_at: string
          email: string
          expires_at: string
          id: string
          token: string
        }
        Insert: {
          created_at?: string
          email: string
          expires_at: string
          id?: string
          token: string
        }
        Update: {
          created_at?: string
          email?: string
          expires_at?: string
          id?: string
          token?: string
        }
        Relationships: []
      }
      organizations: {
        Row: {
          created_at: string
          created_by: string | null
          domain: string | null
          id: string
          logo_url: string | null
          name: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          domain?: string | null
          id?: string
          logo_url?: string | null
          name: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          domain?: string | null
          id?: string
          logo_url?: string | null
          name?: string
          updated_at?: string
        }
        Relationships: []
      }
      service_catalog: {
        Row: {
          approval_workflow_id: string | null
          category: string
          created_at: string
          created_by: string
          description: string | null
          estimated_fulfillment_hours: number | null
          icon: string | null
          id: string
          is_active: boolean
          name: string
          requires_approval: boolean | null
          updated_at: string
        }
        Insert: {
          approval_workflow_id?: string | null
          category: string
          created_at?: string
          created_by: string
          description?: string | null
          estimated_fulfillment_hours?: number | null
          icon?: string | null
          id?: string
          is_active?: boolean
          name: string
          requires_approval?: boolean | null
          updated_at?: string
        }
        Update: {
          approval_workflow_id?: string | null
          category?: string
          created_at?: string
          created_by?: string
          description?: string | null
          estimated_fulfillment_hours?: number | null
          icon?: string | null
          id?: string
          is_active?: boolean
          name?: string
          requires_approval?: boolean | null
          updated_at?: string
        }
        Relationships: []
      }
      service_requests: {
        Row: {
          approval_status: string | null
          approved_at: string | null
          approver_id: string | null
          created_at: string
          description: string | null
          fulfilled_at: string | null
          id: string
          priority: string
          requested_data: Json | null
          service_catalog_id: string
          sla_due_date: string | null
          status: string
          title: string
          updated_at: string
          user_id: string
        }
        Insert: {
          approval_status?: string | null
          approved_at?: string | null
          approver_id?: string | null
          created_at?: string
          description?: string | null
          fulfilled_at?: string | null
          id?: string
          priority?: string
          requested_data?: Json | null
          service_catalog_id: string
          sla_due_date?: string | null
          status?: string
          title: string
          updated_at?: string
          user_id: string
        }
        Update: {
          approval_status?: string | null
          approved_at?: string | null
          approver_id?: string | null
          created_at?: string
          description?: string | null
          fulfilled_at?: string | null
          id?: string
          priority?: string
          requested_data?: Json | null
          service_catalog_id?: string
          sla_due_date?: string | null
          status?: string
          title?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "service_requests_service_catalog_id_fkey"
            columns: ["service_catalog_id"]
            isOneToOne: false
            referencedRelation: "service_catalog"
            referencedColumns: ["id"]
          },
        ]
      }
      sla_policies: {
        Row: {
          created_at: string
          description: string | null
          escalation_rules: Json | null
          id: string
          is_active: boolean | null
          name: string
          priority: string
          resolution_time_hours: number
          response_time_hours: number
          service_category: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          escalation_rules?: Json | null
          id?: string
          is_active?: boolean | null
          name: string
          priority: string
          resolution_time_hours: number
          response_time_hours: number
          service_category: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          escalation_rules?: Json | null
          id?: string
          is_active?: boolean | null
          name?: string
          priority?: string
          resolution_time_hours?: number
          response_time_hours?: number
          service_category?: string
          updated_at?: string
        }
        Relationships: []
      }
      software_licenses: {
        Row: {
          compliance_status: string | null
          cost: number | null
          created_at: string
          expiry_date: string | null
          id: string
          license_key: string | null
          license_type: string
          maintenance_expiry: string | null
          purchase_date: string | null
          software_name: string
          total_licenses: number
          updated_at: string
          used_licenses: number | null
          vendor: string | null
        }
        Insert: {
          compliance_status?: string | null
          cost?: number | null
          created_at?: string
          expiry_date?: string | null
          id?: string
          license_key?: string | null
          license_type: string
          maintenance_expiry?: string | null
          purchase_date?: string | null
          software_name: string
          total_licenses: number
          updated_at?: string
          used_licenses?: number | null
          vendor?: string | null
        }
        Update: {
          compliance_status?: string | null
          cost?: number | null
          created_at?: string
          expiry_date?: string | null
          id?: string
          license_key?: string | null
          license_type?: string
          maintenance_expiry?: string | null
          purchase_date?: string | null
          software_name?: string
          total_licenses?: number
          updated_at?: string
          used_licenses?: number | null
          vendor?: string | null
        }
        Relationships: []
      }
      system_metrics: {
        Row: {
          id: string
          metadata: Json | null
          metric_name: string
          metric_unit: string
          metric_value: number
          recorded_at: string
        }
        Insert: {
          id?: string
          metadata?: Json | null
          metric_name: string
          metric_unit?: string
          metric_value: number
          recorded_at?: string
        }
        Update: {
          id?: string
          metadata?: Json | null
          metric_name?: string
          metric_unit?: string
          metric_value?: number
          recorded_at?: string
        }
        Relationships: []
      }
      user_feedback: {
        Row: {
          created_at: string
          feedback_text: string | null
          id: string
          incident_id: string
          satisfaction_rating: number
          user_id: string
        }
        Insert: {
          created_at?: string
          feedback_text?: string | null
          id?: string
          incident_id: string
          satisfaction_rating: number
          user_id: string
        }
        Update: {
          created_at?: string
          feedback_text?: string | null
          id?: string
          incident_id?: string
          satisfaction_rating?: number
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_feedback_incident_id_fkey"
            columns: ["incident_id"]
            isOneToOne: false
            referencedRelation: "incidents"
            referencedColumns: ["id"]
          },
        ]
      }
      user_sessions: {
        Row: {
          created_at: string
          ended_at: string | null
          id: string
          is_active: boolean
          session_token: string
          user_id: string
        }
        Insert: {
          created_at?: string
          ended_at?: string | null
          id?: string
          is_active?: boolean
          session_token: string
          user_id: string
        }
        Update: {
          created_at?: string
          ended_at?: string | null
          id?: string
          is_active?: boolean
          session_token?: string
          user_id?: string
        }
        Relationships: []
      }
      users: {
        Row: {
          created_at: string
          email: string
          id: string
          name: string
          organization_id: string | null
          password_hash: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          email: string
          id?: string
          name: string
          organization_id?: string | null
          password_hash: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          email?: string
          id?: string
          name?: string
          organization_id?: string | null
          password_hash?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "users_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      cleanup_expired_admin_tokens: {
        Args: Record<PropertyKey, never>
        Returns: undefined
      }
      generate_unique_user_id: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
      verify_mfa_token_bypass: {
        Args: { email_arg: string; token_arg: string }
        Returns: {
          id: string
          email: string
          token: string
          expires_at: string
          created_at: string
        }[]
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
