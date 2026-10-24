export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type UserRole = "user" | "admin" | "super_admin";
export type QuestionDifficulty = "easy" | "medium" | "hard";

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
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          email?: string | null;
          full_name?: string | null;
          avatar_url?: string | null;
          role?: UserRole;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          email?: string | null;
          full_name?: string | null;
          avatar_url?: string | null;
          role?: UserRole;
          created_at?: string;
          updated_at?: string;
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
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      is_admin: {
        Args: { p_user_id?: string };
        Returns: boolean;
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
