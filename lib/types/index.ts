// Domain types for Oposita+ B2B

export type PlatformRole = 'super_admin' | 'centro_admin' | 'profesor' | 'alumno';
export type LegacyUserRole = 'center_admin' | 'teacher' | 'student';
export type UserRole = PlatformRole | LegacyUserRole;
export type OrgStatus = 'pending' | 'active' | 'suspended';
export type SubscriptionStatus = 'active' | 'past_due' | 'canceled' | 'trialing' | 'incomplete';
export type PaymentStatus = 'succeeded' | 'pending' | 'failed' | 'refunded';
export type SettlementStatus = 'pending' | 'paid' | 'disputed';
export type ResourceType = 'pdf' | 'video' | 'link' | 'document' | 'audio';
export type ClassType = 'live' | 'recorded' | 'hybrid';
export type ClassStatus = 'scheduled' | 'live' | 'completed' | 'cancelled';
export type MeetingProvider = '100ms' | 'zoom' | 'meet' | 'jitsi';
export type AttendeeStatus = 'registered' | 'attended' | 'absent' | 'cancelled';
export type PlanType = 'monthly' | 'quarterly' | 'annual' | 'one_time';
export type TestSessionType = 'practice' | 'exam' | 'review';
export type QuestionSource = 'manual' | 'ai_generated' | 'imported';
export type ChatRole = 'user' | 'assistant' | 'system';

export interface Organization {
  id: string;
  name: string;
  slug: string;
  logo_url: string | null;
  description: string | null;
  website: string | null;
  contact_email: string | null;
  contact_phone: string | null;
  status: OrgStatus;
  commission_rate: number;
  settings: Record<string, unknown>;
  created_at: string;
}

export interface OrganizationMember {
  id: string;
  organization_id: string;
  user_id: string;
  role: UserRole;
  joined_at: string;
}

export interface UserProfile {
  id: string;
  full_name: string | null;
  avatar_url: string | null;
  phone: string | null;
  role: PlatformRole;
  is_super_admin: boolean;
  metadata: Record<string, unknown>;
  created_at: string;
}

export interface OppositionCategory {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  icon: string | null;
  created_at: string;
}

export interface Opposition {
  id: string;
  category_id: string;
  name: string;
  slug: string;
  description: string | null;
  difficulty_level: number;
  metadata: Record<string, unknown>;
  created_at: string;
}

export interface Topic {
  id: string;
  organization_id: string;
  opposition_id: string;
  parent_id: string | null;
  title: string;
  description: string | null;
  sort_order: number;
  created_at: string;
}

export interface Resource {
  id: string;
  organization_id: string;
  topic_id: string | null;
  opposition_id: string;
  title: string;
  description: string | null;
  type: ResourceType;
  url: string | null;
  file_size: number | null;
  mime_type: string | null;
  is_public: boolean;
  sort_order: number;
  uploaded_by: string | null;
  created_at: string;
}

export interface Class {
  id: string;
  organization_id: string;
  opposition_id: string;
  topic_id: string | null;
  teacher_id: string | null;
  title: string;
  description: string | null;
  type: ClassType;
  starts_at: string | null;
  ends_at: string | null;
  timezone: string;
  meeting_url: string | null;
  meeting_provider: MeetingProvider | null;
  meeting_id: string | null;
  recording_url: string | null;
  recurrence_rule: string | null;
  recurrence_parent_id: string | null;
  status: ClassStatus;
  max_attendees: number | null;
  metadata: Record<string, unknown>;
  created_at: string;
}

export interface Plan {
  id: string;
  organization_id: string | null;
  opposition_id: string;
  name: string;
  description: string | null;
  type: PlanType;
  price_cents: number;
  currency: string;
  includes_ai: boolean;
  stripe_price_id: string | null;
  is_active: boolean;
  features: string[];
  trial_days: number;
  metadata: Record<string, unknown>;
  created_at: string;
}

export interface Subscription {
  id: string;
  user_id: string;
  organization_id: string;
  plan_id: string;
  stripe_subscription_id: string | null;
  stripe_customer_id: string | null;
  status: SubscriptionStatus;
  current_period_start: string | null;
  current_period_end: string | null;
  cancel_at_period_end: boolean;
  created_at: string;
  updated_at: string;
}

export interface Payment {
  id: string;
  user_id: string | null;
  organization_id: string | null;
  subscription_id: string | null;
  stripe_payment_intent_id: string | null;
  amount_cents: number;
  currency: string;
  status: PaymentStatus;
  description: string | null;
  metadata: Record<string, unknown>;
  created_at: string;
}

export interface Question {
  id: string;
  organization_id: string | null;
  opposition_id: string;
  topic_id: string | null;
  question_text: string;
  options: { text: string; key: string }[];
  correct_answer: string;
  explanation: string | null;
  difficulty: number;
  source: QuestionSource;
  ai_validated: boolean;
  metadata: Record<string, unknown>;
  created_at: string;
}

export interface TestSession {
  id: string;
  user_id: string;
  organization_id: string | null;
  opposition_id: string;
  type: TestSessionType;
  questions: unknown[];
  answers: unknown[];
  score: number | null;
  started_at: string;
  completed_at: string | null;
  time_limit_seconds: number | null;
  metadata: Record<string, unknown>;
}

export interface StudyProgress {
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
  metadata: Record<string, unknown>;
}

export interface CenterSettlement {
  id: string;
  organization_id: string;
  period_start: string;
  period_end: string;
  total_revenue_cents: number;
  commission_cents: number;
  net_amount_cents: number;
  status: SettlementStatus;
  paid_at: string | null;
  invoice_url: string | null;
  created_at: string;
}
