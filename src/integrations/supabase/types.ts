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
    PostgrestVersion: "14.18"
  }
  public: {
    Tables: {
      contact_message: {
        Row: {
          contact_person_id: string
          created_at: string
          id: string
          message: string
          reference: string
          status: Database["public"]["Enums"]["message_status"]
          submitted_name: string
          submitted_phone: string | null
          topic: Database["public"]["Enums"]["contact_topic"]
          updated_at: string
        }
        Insert: {
          contact_person_id: string
          created_at?: string
          id?: string
          message: string
          reference: string
          status?: Database["public"]["Enums"]["message_status"]
          submitted_name: string
          submitted_phone?: string | null
          topic: Database["public"]["Enums"]["contact_topic"]
          updated_at?: string
        }
        Update: {
          contact_person_id?: string
          created_at?: string
          id?: string
          message?: string
          reference?: string
          status?: Database["public"]["Enums"]["message_status"]
          submitted_name?: string
          submitted_phone?: string | null
          topic?: Database["public"]["Enums"]["contact_topic"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "contact_message_contact_person_id_fkey"
            columns: ["contact_person_id"]
            isOneToOne: false
            referencedRelation: "contact_person"
            referencedColumns: ["id"]
          },
        ]
      }
      contact_person: {
        Row: {
          country: string | null
          created_at: string
          email: string
          id: string
          marketing_opt_in: boolean
          name: string
          phone: string | null
          updated_at: string
        }
        Insert: {
          country?: string | null
          created_at?: string
          email: string
          id?: string
          marketing_opt_in?: boolean
          name: string
          phone?: string | null
          updated_at?: string
        }
        Update: {
          country?: string | null
          created_at?: string
          email?: string
          id?: string
          marketing_opt_in?: boolean
          name?: string
          phone?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      enquiry: {
        Row: {
          audience: Database["public"]["Enums"]["audience_type"]
          child_age: number | null
          child_first_name: string | null
          contact_person_id: string
          created_at: string
          guardian_declaration: boolean
          guardian_relationship: string | null
          id: string
          internal_notes: string | null
          message: string
          organization: string | null
          owner_id: string | null
          preferred_start: string | null
          program_slug: string | null
          reference: string
          status: Database["public"]["Enums"]["enquiry_status"]
          submitted_name: string
          submitted_phone: string
          updated_at: string
        }
        Insert: {
          audience: Database["public"]["Enums"]["audience_type"]
          child_age?: number | null
          child_first_name?: string | null
          contact_person_id: string
          created_at?: string
          guardian_declaration?: boolean
          guardian_relationship?: string | null
          id?: string
          internal_notes?: string | null
          message: string
          organization?: string | null
          owner_id?: string | null
          preferred_start?: string | null
          program_slug?: string | null
          reference: string
          status?: Database["public"]["Enums"]["enquiry_status"]
          submitted_name: string
          submitted_phone: string
          updated_at?: string
        }
        Update: {
          audience?: Database["public"]["Enums"]["audience_type"]
          child_age?: number | null
          child_first_name?: string | null
          contact_person_id?: string
          created_at?: string
          guardian_declaration?: boolean
          guardian_relationship?: string | null
          id?: string
          internal_notes?: string | null
          message?: string
          organization?: string | null
          owner_id?: string | null
          preferred_start?: string | null
          program_slug?: string | null
          reference?: string
          status?: Database["public"]["Enums"]["enquiry_status"]
          submitted_name?: string
          submitted_phone?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "enquiry_contact_person_id_fkey"
            columns: ["contact_person_id"]
            isOneToOne: false
            referencedRelation: "contact_person"
            referencedColumns: ["id"]
          },
        ]
      }
      equipment_pledge: {
        Row: {
          contact_person_id: string
          created_at: string
          expected_date: string | null
          id: string
          notes: string | null
          organization: string | null
          origin_country: string
          recognition_opt_in: boolean
          reference: string
          shipping_plan: Database["public"]["Enums"]["shipping_plan"]
          status: Database["public"]["Enums"]["pledge_status"]
          submitted_name: string
          submitted_phone: string | null
          updated_at: string
        }
        Insert: {
          contact_person_id: string
          created_at?: string
          expected_date?: string | null
          id?: string
          notes?: string | null
          organization?: string | null
          origin_country: string
          recognition_opt_in?: boolean
          reference: string
          shipping_plan: Database["public"]["Enums"]["shipping_plan"]
          status?: Database["public"]["Enums"]["pledge_status"]
          submitted_name: string
          submitted_phone?: string | null
          updated_at?: string
        }
        Update: {
          contact_person_id?: string
          created_at?: string
          expected_date?: string | null
          id?: string
          notes?: string | null
          organization?: string | null
          origin_country?: string
          recognition_opt_in?: boolean
          reference?: string
          shipping_plan?: Database["public"]["Enums"]["shipping_plan"]
          status?: Database["public"]["Enums"]["pledge_status"]
          submitted_name?: string
          submitted_phone?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "equipment_pledge_contact_person_id_fkey"
            columns: ["contact_person_id"]
            isOneToOne: false
            referencedRelation: "contact_person"
            referencedColumns: ["id"]
          },
        ]
      }
      equipment_pledge_item: {
        Row: {
          condition: Database["public"]["Enums"]["equipment_condition"]
          created_at: string
          description: string
          id: string
          need_id: string | null
          pledge_id: string
          quantity: number
          updated_at: string
        }
        Insert: {
          condition: Database["public"]["Enums"]["equipment_condition"]
          created_at?: string
          description: string
          id?: string
          need_id?: string | null
          pledge_id: string
          quantity: number
          updated_at?: string
        }
        Update: {
          condition?: Database["public"]["Enums"]["equipment_condition"]
          created_at?: string
          description?: string
          id?: string
          need_id?: string | null
          pledge_id?: string
          quantity?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "equipment_pledge_item_pledge_id_fkey"
            columns: ["pledge_id"]
            isOneToOne: false
            referencedRelation: "equipment_pledge"
            referencedColumns: ["id"]
          },
        ]
      }
      reference_counter: {
        Row: {
          kind: string
          last_value: number
          year: number
        }
        Insert: {
          kind: string
          last_value?: number
          year: number
        }
        Update: {
          kind?: string
          last_value?: number
          year?: number
        }
        Relationships: []
      }
      sponsor_enquiry: {
        Row: {
          contact_person_id: string
          created_at: string
          id: string
          interests: string[]
          message: string
          organization: string
          owner_id: string | null
          reference: string
          status: Database["public"]["Enums"]["sponsor_status"]
          submitted_name: string
          submitted_phone: string | null
          updated_at: string
        }
        Insert: {
          contact_person_id: string
          created_at?: string
          id?: string
          interests: string[]
          message: string
          organization: string
          owner_id?: string | null
          reference: string
          status?: Database["public"]["Enums"]["sponsor_status"]
          submitted_name: string
          submitted_phone?: string | null
          updated_at?: string
        }
        Update: {
          contact_person_id?: string
          created_at?: string
          id?: string
          interests?: string[]
          message?: string
          organization?: string
          owner_id?: string | null
          reference?: string
          status?: Database["public"]["Enums"]["sponsor_status"]
          submitted_name?: string
          submitted_phone?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "sponsor_enquiry_contact_person_id_fkey"
            columns: ["contact_person_id"]
            isOneToOne: false
            referencedRelation: "contact_person"
            referencedColumns: ["id"]
          },
        ]
      }
      submission_throttle: {
        Row: {
          created_at: string
          id: number
          key_hash: string
          key_kind: string
        }
        Insert: {
          created_at?: string
          id?: never
          key_hash: string
          key_kind: string
        }
        Update: {
          created_at?: string
          id?: never
          key_hash?: string
          key_kind?: string
        }
        Relationships: []
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
          role: Database["public"]["Enums"]["app_role"]
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
      check_and_record_throttle: {
        Args: { _email_hash: string; _ip_hash: string }
        Returns: boolean
      }
      ensure_contact: {
        Args: {
          _country: string
          _email: string
          _name: string
          _phone: string
        }
        Returns: string
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      is_ops_staff: { Args: { _user_id: string }; Returns: boolean }
      next_reference: { Args: { _kind: string }; Returns: string }
      submit_contact_message: { Args: { p: Json }; Returns: string }
      submit_enquiry: { Args: { p: Json }; Returns: string }
      submit_equipment_pledge: { Args: { p: Json }; Returns: string }
      submit_sponsor_enquiry: { Args: { p: Json }; Returns: string }
    }
    Enums: {
      app_role:
        | "super_admin"
        | "academy_admin"
        | "content_manager"
        | "safeguarding_lead"
      audience_type: "adult" | "corporate" | "junior"
      contact_topic:
        | "training"
        | "youth"
        | "donation"
        | "equipment"
        | "partnership"
        | "media"
        | "other"
        | "safeguarding"
      enquiry_status:
        | "new"
        | "contacted"
        | "confirmed"
        | "waitlisted"
        | "declined"
        | "closed"
      equipment_condition: "new" | "like-new" | "good" | "fair"
      message_status: "new" | "replied" | "closed"
      pledge_status:
        | "submitted"
        | "accepted"
        | "needs_changes"
        | "declined"
        | "in_transit"
        | "received"
        | "distributed"
      shipping_plan: "donor-ships" | "needs-help" | "undecided"
      sponsor_status: "new" | "in_discussion" | "agreed" | "not_proceeding"
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
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
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
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
      app_role: [
        "super_admin",
        "academy_admin",
        "content_manager",
        "safeguarding_lead",
      ],
      audience_type: ["adult", "corporate", "junior"],
      contact_topic: [
        "training",
        "youth",
        "donation",
        "equipment",
        "partnership",
        "media",
        "other",
        "safeguarding",
      ],
      enquiry_status: [
        "new",
        "contacted",
        "confirmed",
        "waitlisted",
        "declined",
        "closed",
      ],
      equipment_condition: ["new", "like-new", "good", "fair"],
      message_status: ["new", "replied", "closed"],
      pledge_status: [
        "submitted",
        "accepted",
        "needs_changes",
        "declined",
        "in_transit",
        "received",
        "distributed",
      ],
      shipping_plan: ["donor-ships", "needs-help", "undecided"],
      sponsor_status: ["new", "in_discussion", "agreed", "not_proceeding"],
    },
  },
} as const
