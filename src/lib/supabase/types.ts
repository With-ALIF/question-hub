export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type UserRole = "user" | "admin" | "super_admin";
export type QuestionDifficulty = "easy" | "medium" | "hard";
export type PaymentMethod = "bkash" | "nagad";
export type OrderStatus = "pending" | "approved" | "rejected" | "cancelled";
export type SubscriptionStatus = "active" | "expired" | "cancelled";
export type SubscriptionSource = "payment" | "custom";
export type UsageFeature = "mcq" | "model_test";

export type QuestionOption = {
  n: number;
  h?: string | null;
  t?: string | null;
  c?: number | null;
};

export type Database = {
  public: {
    Tables: {
      qb_profiles: {
        Row: {
          id: string;
          email: string | null;
          full_name: string | null;
          avatar_url: string | null;
          role: UserRole;
          selected_subjects: string[] | null;
          selected_databases: string[] | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          email?: string | null;
          full_name?: string | null;
          avatar_url?: string | null;
          role?: UserRole;
          selected_subjects?: string[] | null;
          selected_databases?: string[] | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          email?: string | null;
          full_name?: string | null;
          avatar_url?: string | null;
          role?: UserRole;
          selected_subjects?: string[] | null;
          selected_databases?: string[] | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      qb_plans: {
        Row: {
          plan_id: string;
          name: string;
          audience: "student" | "teacher";
          duration_days: number | null;
          daily_mcq_limit: number | null;
          daily_model_test_limit: number | null;
          saved_questions_limit: number | null;
          allow_answer: boolean;
          allow_explanation: boolean;
          allowed_subjects: string[] | null;
          allowed_chapters: string[] | null;
          allowed_databases: string[] | null;
          subject_selection_limit: number;
          database_selection_limit: number;
          total_model_test_limit: number | null;
          exam_paper_limit: number | null;
          is_active: boolean;
          sort_order: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          plan_id: string;
          name: string;
          audience?: "student" | "teacher";
          duration_days?: number | null;
          daily_mcq_limit?: number | null;
          daily_model_test_limit?: number | null;
          saved_questions_limit?: number | null;
          allow_answer?: boolean;
          allow_explanation?: boolean;
          allowed_subjects?: string[] | null;
          allowed_chapters?: string[] | null;
          allowed_databases?: string[] | null;
          subject_selection_limit?: number;
          database_selection_limit?: number;
          total_model_test_limit?: number | null;
          exam_paper_limit?: number | null;
          is_active?: boolean;
          sort_order?: number;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          plan_id?: string;
          name?: string;
          audience?: "student" | "teacher";
          duration_days?: number | null;
          daily_mcq_limit?: number | null;
          daily_model_test_limit?: number | null;
          saved_questions_limit?: number | null;
          allow_answer?: boolean;
          allow_explanation?: boolean;
          allowed_subjects?: string[] | null;
          allowed_chapters?: string[] | null;
          allowed_databases?: string[] | null;
          subject_selection_limit?: number;
          database_selection_limit?: number;
          total_model_test_limit?: number | null;
          exam_paper_limit?: number | null;
          is_active?: boolean;
          sort_order?: number;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      qb_usage_events: {
        Row: {
          id: number;
          user_id: string;
          usage_date: string;
          feature: UsageFeature;
          event_key: string;
          created_at: string;
        };
        Insert: {
          id?: number;
          user_id: string;
          usage_date?: string;
          feature: UsageFeature;
          event_key: string;
          created_at?: string;
        };
        Update: {
          id?: number;
          user_id?: string;
          usage_date?: string;
          feature?: UsageFeature;
          event_key?: string;
          created_at?: string;
        };
        Relationships: [];
      };
      qb_databases: {
        Row: {
          id: string;
          slug: string;
          name: string;
          name_bn: string | null;
          description: string | null;
          source_codes: string[];
          sort_order: number;
          is_active: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          slug: string;
          name: string;
          name_bn?: string | null;
          description?: string | null;
          source_codes?: string[];
          sort_order?: number;
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          slug?: string;
          name?: string;
          name_bn?: string | null;
          description?: string | null;
          source_codes?: string[];
          sort_order?: number;
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      qb_exam_paper_events: {
        Row: {
          id: number;
          user_id: string;
          event_key: string;
          created_at: string;
        };
        Insert: {
          id?: number;
          user_id: string;
          event_key: string;
          created_at?: string;
        };
        Update: {
          id?: number;
          user_id?: string;
          event_key?: string;
          created_at?: string;
        };
        Relationships: [];
      };
      qb_subjects: {
        Row: {
          id: string;
          slug: string;
          name: string;
          tagline: string | null;
          icon: string | null;
          accent: string | null;
          sort_order: number;
          is_active: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          slug: string;
          name: string;
          tagline?: string | null;
          icon?: string | null;
          accent?: string | null;
          sort_order?: number;
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          slug?: string;
          name?: string;
          tagline?: string | null;
          icon?: string | null;
          accent?: string | null;
          sort_order?: number;
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      qb_chapters: {
        Row: {
          id: string;
          subject_id: string;
          slug: string;
          name: string;
          description: string | null;
          sort_order: number;
          is_active: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          subject_id: string;
          slug: string;
          name: string;
          description?: string | null;
          sort_order?: number;
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          subject_id?: string;
          slug?: string;
          name?: string;
          description?: string | null;
          sort_order?: number;
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "qb_chapters_subject_id_fkey";
            columns: ["subject_id"];
            isOneToOne: false;
            referencedRelation: "qb_subjects";
            referencedColumns: ["id"];
          },
        ];
      };
      qb_questions: {
        Row: {
          id: string;
          chapter_id: string | null;
          external_id: number | null;
          question_text: string;
          question_html: string | null;
          options: QuestionOption[];
          correct_option: number | null;
          answer: string | null;
          explanation: string | null;
          explanation_html: string | null;
          source_db: string | null;
          institution: string | null;
          unit: string | null;
          year: string | null;
          short_name: string | null;
          paper: string | null;
          topic_code: string | null;
          keyword: string | null;
          raw_data: Json | null;
          source_file: string | null;
          is_mcq: boolean;
          difficulty: QuestionDifficulty;
          marks: number | null;
          is_published: boolean;
          created_by: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          chapter_id?: string | null;
          external_id?: number | null;
          question_text: string;
          question_html?: string | null;
          options?: QuestionOption[];
          correct_option?: number | null;
          answer?: string | null;
          explanation?: string | null;
          explanation_html?: string | null;
          source_db?: string | null;
          institution?: string | null;
          unit?: string | null;
          year?: string | null;
          short_name?: string | null;
          paper?: string | null;
          topic_code?: string | null;
          keyword?: string | null;
          raw_data?: Json | null;
          source_file?: string | null;
          is_mcq?: boolean;
          difficulty?: QuestionDifficulty;
          marks?: number | null;
          is_published?: boolean;
          created_by?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          chapter_id?: string | null;
          external_id?: number | null;
          question_text?: string;
          question_html?: string | null;
          options?: QuestionOption[];
          correct_option?: number | null;
          answer?: string | null;
          explanation?: string | null;
          explanation_html?: string | null;
          source_db?: string | null;
          institution?: string | null;
          unit?: string | null;
          year?: string | null;
          short_name?: string | null;
          paper?: string | null;
          topic_code?: string | null;
          keyword?: string | null;
          raw_data?: Json | null;
          source_file?: string | null;
          is_mcq?: boolean;
          difficulty?: QuestionDifficulty;
          marks?: number | null;
          is_published?: boolean;
          created_by?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "qb_questions_chapter_id_fkey";
            columns: ["chapter_id"];
            isOneToOne: false;
            referencedRelation: "qb_chapters";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "qb_questions_created_by_fkey";
            columns: ["created_by"];
            isOneToOne: false;
            referencedRelation: "qb_profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      qb_features: {
        Row: {
          id: string;
          key: string;
          name: string;
          description: string | null;
          is_active: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          key: string;
          name: string;
          description?: string | null;
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          key?: string;
          name?: string;
          description?: string | null;
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      qb_report: {
        Row: {
          id: string;
          question_id: string;
          user_id: string | null;
          report_type: string;
          message: string;
          status: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          question_id: string;
          user_id?: string | null;
          report_type: string;
          message: string;
          status?: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          question_id?: string;
          user_id?: string | null;
          report_type?: string;
          message?: string;
          status?: string;
          created_at?: string;
        };
        Relationships: [];
      };
      qb_orders: {
        Row: {
          id: string;
          order_code: string;
          user_id: string;
          plan_id: string;
          plan_name: string;
          audience: "student" | "teacher";
          amount_bdt: number;
          duration_days: number;
          payment_method: PaymentMethod;
          sender_number: string | null;
          trx_id: string;
          status: OrderStatus;
          admin_note: string | null;
          reviewed_by: string | null;
          reviewed_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          order_code: string;
          user_id: string;
          plan_id: string;
          plan_name: string;
          audience: "student" | "teacher";
          amount_bdt: number;
          duration_days: number;
          payment_method: PaymentMethod;
          sender_number?: string | null;
          trx_id: string;
          status?: OrderStatus;
          admin_note?: string | null;
          reviewed_by?: string | null;
          reviewed_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          order_code?: string;
          user_id?: string;
          plan_id?: string;
          plan_name?: string;
          audience?: "student" | "teacher";
          amount_bdt?: number;
          duration_days?: number;
          payment_method?: PaymentMethod;
          sender_number?: string | null;
          trx_id?: string;
          status?: OrderStatus;
          admin_note?: string | null;
          reviewed_by?: string | null;
          reviewed_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      qb_subscriptions: {
        Row: {
          id: string;
          user_id: string;
          order_id: string | null;
          plan_id: string;
          plan_name: string;
          audience: "student" | "teacher";
          status: SubscriptionStatus;
          starts_at: string;
          expires_at: string;
          source: SubscriptionSource;
          granted_by: string | null;
          notes: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          order_id?: string | null;
          plan_id: string;
          plan_name: string;
          audience: "student" | "teacher";
          status?: SubscriptionStatus;
          starts_at?: string;
          expires_at: string;
          source?: SubscriptionSource;
          granted_by?: string | null;
          notes?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          order_id?: string | null;
          plan_id?: string;
          plan_name?: string;
          audience?: "student" | "teacher";
          status?: SubscriptionStatus;
          starts_at?: string;
          expires_at?: string;
          source?: SubscriptionSource;
          granted_by?: string | null;
          notes?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      settings: {
        Row: {
          id: string;
          key: string;
          value: Json;
          updated_at: string;
        };
        Insert: {
          id?: string;
          key: string;
          value: Json;
          updated_at?: string;
        };
        Update: {
          id?: string;
          key?: string;
          value?: Json;
          updated_at?: string;
        };
        Relationships: [];
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      is_admin: {
        Args: { p_user_id?: string };
        Returns: boolean;
      };
      qb_approve_order: {
        Args: { p_order_id: string; p_admin_id?: string };
        Returns: Json;
      };
      qb_reject_order: {
        Args: { p_order_id: string; p_admin_id?: string; p_note?: string };
        Returns: boolean;
      };
      qb_get_entitlement: {
        Args: { p_user_id: string };
        Returns: Json;
      };
      qb_consume_usage: {
        Args: { p_user_id: string; p_feature: UsageFeature; p_event_keys: string[] };
        Returns: Json;
      };
      qb_consume_exam_paper: {
        Args: { p_user_id: string; p_event_key: string };
        Returns: Json;
      };
      qb_claim_saved_question: {
        Args: { p_user_id: string; p_question_id: string; p_subject?: string };
        Returns: Json;
      };
      qb_release_saved_question: {
        Args: { p_user_id: string; p_question_id: string };
        Returns: boolean;
      };
      qb_grant_custom_access: {
        Args: {
          p_user_id: string;
          p_plan_id: string;
          p_days: number;
          p_note?: string | null;
          p_admin_id?: string | null;
        };
        Returns: Json;
      };
      qb_expire_subscriptions: {
        Args: Record<PropertyKey, never>;
        Returns: number;
      };
    };
    Enums: {
      question_difficulty: QuestionDifficulty;
      user_role: UserRole;
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
};

export type Profile = Database["public"]["Tables"]["qb_profiles"]["Row"];
export type Subject = Database["public"]["Tables"]["qb_subjects"]["Row"];
export type Chapter = Database["public"]["Tables"]["qb_chapters"]["Row"];
export type Question = Database["public"]["Tables"]["qb_questions"]["Row"];
export type Feature = Database["public"]["Tables"]["qb_features"]["Row"];
export type Order = Database["public"]["Tables"]["qb_orders"]["Row"];
export type Subscription = Database["public"]["Tables"]["qb_subscriptions"]["Row"];
export type PlanConfig = Database["public"]["Tables"]["qb_plans"]["Row"];
export type UsageEvent = Database["public"]["Tables"]["qb_usage_events"]["Row"];
