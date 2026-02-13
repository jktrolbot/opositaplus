// Auto-generated-style types for Supabase database
// Based on migrations 00001-00003

export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export interface Database {
  public: {
    Tables: {
      organizations: {
        Row: {
          id: string;
          name: string;
          slug: string;
          logo_url: string | null;
          description: string | null;
          website: string | null;
          contact_email: string | null;
          contact_phone: string | null;
          status: string;
          commission_rate: number;
          settings: Json;
          created_at: string;
        };
        Insert: Partial<Database['public']['Tables']['organizations']['Row']> & { name: string; slug: string };
        Update: Partial<Database['public']['Tables']['organizations']['Row']>;
      };
      organization_members: {
        Row: {
          id: string;
          organization_id: string;
          user_id: string;
          role: string;
          joined_at: string;
        };
        Insert: { organization_id: string; user_id: string; role: string };
        Update: Partial<Database['public']['Tables']['organization_members']['Row']>;
      };
      user_profiles: {
        Row: {
          id: string;
          user_id: string;
          full_name: string | null;
          avatar_url: string | null;
          phone: string | null;
          is_super_admin: boolean;
          metadata: Json;
          created_at: string;
        };
        Insert: { user_id: string } & Partial<Omit<Database['public']['Tables']['user_profiles']['Row'], 'id' | 'user_id'>>;
        Update: Partial<Database['public']['Tables']['user_profiles']['Row']>;
      };
      opposition_categories: {
        Row: {
          id: string;
          name: string;
          slug: string;
          description: string | null;
          icon: string | null;
          created_at: string;
        };
        Insert: { name: string; slug: string } & Partial<Omit<Database['public']['Tables']['opposition_categories']['Row'], 'name' | 'slug'>>;
        Update: Partial<Database['public']['Tables']['opposition_categories']['Row']>;
      };
      oppositions: {
        Row: {
          id: string;
          category_id: string;
          name: string;
          slug: string;
          description: string | null;
          difficulty_level: number;
          metadata: Json;
          created_at: string;
        };
        Insert: { category_id: string; name: string; slug: string } & Partial<Omit<Database['public']['Tables']['oppositions']['Row'], 'category_id' | 'name' | 'slug'>>;
        Update: Partial<Database['public']['Tables']['oppositions']['Row']>;
      };
      organization_oppositions: {
        Row: {
          organization_id: string;
          opposition_id: string;
        };
        Insert: { organization_id: string; opposition_id: string };
        Update: Partial<Database['public']['Tables']['organization_oppositions']['Row']>;
      };
      topics: {
        Row: {
          id: string;
          organization_id: string;
          opposition_id: string;
          parent_id: string | null;
          title: string;
          description: string | null;
          sort_order: number;
          created_at: string;
        };
        Insert: { organization_id: string; opposition_id: string; title: string } & Partial<Omit<Database['public']['Tables']['topics']['Row'], 'organization_id' | 'opposition_id' | 'title'>>;
        Update: Partial<Database['public']['Tables']['topics']['Row']>;
      };
      resources: {
        Row: {
          id: string;
          organization_id: string;
          topic_id: string | null;
          opposition_id: string;
          title: string;
          description: string | null;
          type: string;
          url: string | null;
          file_size: number | null;
          mime_type: string | null;
          is_public: boolean;
          sort_order: number;
          uploaded_by: string | null;
          created_at: string;
        };
        Insert: { organization_id: string; opposition_id: string; title: string; type: string } & Partial<Omit<Database['public']['Tables']['resources']['Row'], 'organization_id' | 'opposition_id' | 'title' | 'type'>>;
        Update: Partial<Database['public']['Tables']['resources']['Row']>;
      };
      classes: {
        Row: {
          id: string;
          organization_id: string;
          opposition_id: string;
          topic_id: string | null;
          teacher_id: string | null;
          title: string;
          description: string | null;
          type: string;
          starts_at: string | null;
          ends_at: string | null;
          timezone: string;
          meeting_url: string | null;
          meeting_provider: string | null;
          meeting_id: string | null;
          recording_url: string | null;
          recurrence_rule: string | null;
          recurrence_parent_id: string | null;
          status: string;
          max_attendees: number | null;
          metadata: Json;
          created_at: string;
        };
        Insert: { organization_id: string; opposition_id: string; title: string; type: string } & Partial<Omit<Database['public']['Tables']['classes']['Row'], 'organization_id' | 'opposition_id' | 'title' | 'type'>>;
        Update: Partial<Database['public']['Tables']['classes']['Row']>;
      };
      class_attendees: {
        Row: {
          id: string;
          class_id: string;
          user_id: string;
          status: string;
          joined_at: string | null;
          left_at: string | null;
        };
        Insert: { class_id: string; user_id: string } & Partial<Omit<Database['public']['Tables']['class_attendees']['Row'], 'class_id' | 'user_id'>>;
        Update: Partial<Database['public']['Tables']['class_attendees']['Row']>;
      };
      plans: {
        Row: {
          id: string;
          organization_id: string | null;
          opposition_id: string;
          name: string;
          description: string | null;
          type: string;
          price_cents: number;
          currency: string;
          includes_ai: boolean;
          stripe_price_id: string | null;
          is_active: boolean;
          features: Json;
          trial_days: number;
          metadata: Json;
          created_at: string;
        };
        Insert: { opposition_id: string; name: string; type: string; price_cents: number } & Partial<Omit<Database['public']['Tables']['plans']['Row'], 'opposition_id' | 'name' | 'type' | 'price_cents'>>;
        Update: Partial<Database['public']['Tables']['plans']['Row']>;
      };
      subscriptions: {
        Row: {
          id: string;
          user_id: string;
          organization_id: string;
          plan_id: string;
          stripe_subscription_id: string | null;
          stripe_customer_id: string | null;
          status: string;
          current_period_start: string | null;
          current_period_end: string | null;
          cancel_at_period_end: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: { user_id: string; organization_id: string; plan_id: string } & Partial<Omit<Database['public']['Tables']['subscriptions']['Row'], 'user_id' | 'organization_id' | 'plan_id'>>;
        Update: Partial<Database['public']['Tables']['subscriptions']['Row']>;
      };
      payments: {
        Row: {
          id: string;
          user_id: string | null;
          organization_id: string | null;
          subscription_id: string | null;
          stripe_payment_intent_id: string | null;
          amount_cents: number;
          currency: string;
          status: string;
          description: string | null;
          metadata: Json;
          created_at: string;
        };
        Insert: { amount_cents: number } & Partial<Omit<Database['public']['Tables']['payments']['Row'], 'amount_cents'>>;
        Update: Partial<Database['public']['Tables']['payments']['Row']>;
      };
      center_settlements: {
        Row: {
          id: string;
          organization_id: string;
          period_start: string;
          period_end: string;
          total_revenue_cents: number;
          commission_cents: number;
          net_amount_cents: number;
          status: string;
          paid_at: string | null;
          invoice_url: string | null;
          created_at: string;
        };
        Insert: { organization_id: string; period_start: string; period_end: string } & Partial<Omit<Database['public']['Tables']['center_settlements']['Row'], 'organization_id' | 'period_start' | 'period_end'>>;
        Update: Partial<Database['public']['Tables']['center_settlements']['Row']>;
      };
      questions: {
        Row: {
          id: string;
          organization_id: string | null;
          opposition_id: string;
          topic_id: string | null;
          question_text: string;
          options: Json;
          correct_answer: string;
          explanation: string | null;
          difficulty: number;
          source: string;
          ai_validated: boolean;
          metadata: Json;
          created_at: string;
        };
        Insert: { opposition_id: string; question_text: string; correct_answer: string } & Partial<Omit<Database['public']['Tables']['questions']['Row'], 'opposition_id' | 'question_text' | 'correct_answer'>>;
        Update: Partial<Database['public']['Tables']['questions']['Row']>;
      };
      test_sessions: {
        Row: {
          id: string;
          user_id: string;
          organization_id: string | null;
          opposition_id: string;
          type: string;
          questions: Json;
          answers: Json;
          score: number | null;
          started_at: string;
          completed_at: string | null;
          time_limit_seconds: number | null;
          metadata: Json;
        };
        Insert: { user_id: string; opposition_id: string } & Partial<Omit<Database['public']['Tables']['test_sessions']['Row'], 'user_id' | 'opposition_id'>>;
        Update: Partial<Database['public']['Tables']['test_sessions']['Row']>;
      };
      study_progress: {
        Row: {
          id: string;
          user_id: string;
          organization_id: string | null;
          opposition_id: string;
          topic_id: string | null;
          mastery_level: number;
          questions_answered: number;
          correct_answers: number;
          last_studied_at: string | null;
          streak_days: number;
          metadata: Json;
        };
        Insert: { user_id: string; opposition_id: string } & Partial<Omit<Database['public']['Tables']['study_progress']['Row'], 'user_id' | 'opposition_id'>>;
        Update: Partial<Database['public']['Tables']['study_progress']['Row']>;
      };
      ai_chat_messages: {
        Row: {
          id: string;
          user_id: string;
          organization_id: string | null;
          opposition_id: string;
          role: string;
          content: string;
          metadata: Json;
          created_at: string;
        };
        Insert: { user_id: string; opposition_id: string; role: string; content: string } & Partial<Omit<Database['public']['Tables']['ai_chat_messages']['Row'], 'user_id' | 'opposition_id' | 'role' | 'content'>>;
        Update: Partial<Database['public']['Tables']['ai_chat_messages']['Row']>;
      };
    };
    Views: Record<string, never>;
    Functions: {
      get_user_org_ids: { Args: Record<string, never>; Returns: string[] };
      get_user_roles: { Args: { org_id: string }; Returns: string[] };
      is_super_admin: { Args: Record<string, never>; Returns: boolean };
    };
    Enums: Record<string, never>;
  };
}
