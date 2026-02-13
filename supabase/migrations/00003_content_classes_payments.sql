-- Migration: Content, Classes, Payments, and Study Schema
-- Created: 2026-02-13

-- ============================================
-- TOPICS
-- ============================================
CREATE TABLE topics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
  opposition_id UUID REFERENCES oppositions(id) ON DELETE CASCADE,
  parent_id UUID REFERENCES topics(id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  description TEXT,
  sort_order INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_topics_org ON topics(organization_id);
CREATE INDEX idx_topics_opposition ON topics(opposition_id);

-- ============================================
-- RESOURCES
-- ============================================
CREATE TABLE resources (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
  topic_id UUID REFERENCES topics(id) ON DELETE SET NULL,
  opposition_id UUID REFERENCES oppositions(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  type TEXT NOT NULL CHECK (type IN ('pdf', 'video', 'link', 'document', 'audio')),
  url TEXT,
  file_size BIGINT,
  mime_type TEXT,
  is_public BOOLEAN DEFAULT false,
  sort_order INT DEFAULT 0,
  uploaded_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_resources_org ON resources(organization_id);
CREATE INDEX idx_resources_topic ON resources(topic_id);

-- ============================================
-- CLASSES
-- ============================================
CREATE TABLE classes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
  opposition_id UUID REFERENCES oppositions(id) ON DELETE CASCADE,
  topic_id UUID REFERENCES topics(id) ON DELETE SET NULL,
  teacher_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  description TEXT,
  type TEXT NOT NULL CHECK (type IN ('live', 'recorded', 'hybrid')),
  starts_at TIMESTAMPTZ,
  ends_at TIMESTAMPTZ,
  timezone TEXT DEFAULT 'Europe/Madrid',
  meeting_url TEXT,
  meeting_provider TEXT CHECK (meeting_provider IN ('100ms', 'zoom', 'meet', 'jitsi')),
  meeting_id TEXT,
  recording_url TEXT,
  recurrence_rule TEXT,
  recurrence_parent_id UUID REFERENCES classes(id) ON DELETE SET NULL,
  status TEXT NOT NULL DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'live', 'completed', 'cancelled')),
  max_attendees INT,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_classes_org ON classes(organization_id);
CREATE INDEX idx_classes_starts ON classes(starts_at);
CREATE INDEX idx_classes_teacher ON classes(teacher_id);

-- ============================================
-- CLASS ATTENDEES
-- ============================================
CREATE TABLE class_attendees (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  class_id UUID REFERENCES classes(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'registered' CHECK (status IN ('registered', 'attended', 'absent', 'cancelled')),
  joined_at TIMESTAMPTZ,
  left_at TIMESTAMPTZ,
  UNIQUE(class_id, user_id)
);

CREATE INDEX idx_class_attendees_user ON class_attendees(user_id);

-- ============================================
-- PLANS
-- ============================================
CREATE TABLE plans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID REFERENCES organizations(id) ON DELETE SET NULL,
  opposition_id UUID REFERENCES oppositions(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  type TEXT NOT NULL CHECK (type IN ('monthly', 'quarterly', 'annual', 'one_time')),
  price_cents INT NOT NULL,
  currency TEXT DEFAULT 'eur',
  includes_ai BOOLEAN DEFAULT true,
  stripe_price_id TEXT,
  is_active BOOLEAN DEFAULT true,
  features JSONB DEFAULT '[]',
  trial_days INT DEFAULT 0,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_plans_org ON plans(organization_id);

-- ============================================
-- SUBSCRIPTIONS
-- ============================================
CREATE TABLE subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
  plan_id UUID REFERENCES plans(id) ON DELETE RESTRICT,
  stripe_subscription_id TEXT,
  stripe_customer_id TEXT,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'past_due', 'canceled', 'trialing', 'incomplete')),
  current_period_start TIMESTAMPTZ,
  current_period_end TIMESTAMPTZ,
  cancel_at_period_end BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_subscriptions_user ON subscriptions(user_id);
CREATE INDEX idx_subscriptions_org ON subscriptions(organization_id);

-- ============================================
-- PAYMENTS
-- ============================================
CREATE TABLE payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  organization_id UUID REFERENCES organizations(id) ON DELETE SET NULL,
  subscription_id UUID REFERENCES subscriptions(id) ON DELETE SET NULL,
  stripe_payment_intent_id TEXT,
  amount_cents INT NOT NULL,
  currency TEXT DEFAULT 'eur',
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('succeeded', 'pending', 'failed', 'refunded')),
  description TEXT,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_payments_user ON payments(user_id);
CREATE INDEX idx_payments_org ON payments(organization_id);

-- ============================================
-- CENTER SETTLEMENTS
-- ============================================
CREATE TABLE center_settlements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
  period_start DATE NOT NULL,
  period_end DATE NOT NULL,
  total_revenue_cents INT NOT NULL DEFAULT 0,
  commission_cents INT NOT NULL DEFAULT 0,
  net_amount_cents INT NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'paid', 'disputed')),
  paid_at TIMESTAMPTZ,
  invoice_url TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_settlements_org ON center_settlements(organization_id);

-- ============================================
-- QUESTIONS
-- ============================================
CREATE TABLE questions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID REFERENCES organizations(id) ON DELETE SET NULL,
  opposition_id UUID REFERENCES oppositions(id) ON DELETE CASCADE,
  topic_id UUID REFERENCES topics(id) ON DELETE SET NULL,
  question_text TEXT NOT NULL,
  options JSONB NOT NULL DEFAULT '[]',
  correct_answer TEXT NOT NULL,
  explanation TEXT,
  difficulty INT NOT NULL DEFAULT 3 CHECK (difficulty >= 1 AND difficulty <= 5),
  source TEXT NOT NULL DEFAULT 'manual' CHECK (source IN ('manual', 'ai_generated', 'imported')),
  ai_validated BOOLEAN DEFAULT false,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_questions_org ON questions(organization_id);
CREATE INDEX idx_questions_opposition ON questions(opposition_id);
CREATE INDEX idx_questions_topic ON questions(topic_id);

-- ============================================
-- TEST SESSIONS
-- ============================================
CREATE TABLE test_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  organization_id UUID REFERENCES organizations(id) ON DELETE SET NULL,
  opposition_id UUID REFERENCES oppositions(id) ON DELETE CASCADE,
  type TEXT NOT NULL DEFAULT 'practice' CHECK (type IN ('practice', 'exam', 'review')),
  questions JSONB DEFAULT '[]',
  answers JSONB DEFAULT '[]',
  score NUMERIC,
  started_at TIMESTAMPTZ DEFAULT now(),
  completed_at TIMESTAMPTZ,
  time_limit_seconds INT,
  metadata JSONB DEFAULT '{}'
);

CREATE INDEX idx_test_sessions_user ON test_sessions(user_id);
CREATE INDEX idx_test_sessions_org ON test_sessions(organization_id);

-- ============================================
-- STUDY PROGRESS
-- ============================================
CREATE TABLE study_progress (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  organization_id UUID REFERENCES organizations(id) ON DELETE SET NULL,
  opposition_id UUID REFERENCES oppositions(id) ON DELETE CASCADE,
  topic_id UUID REFERENCES topics(id) ON DELETE SET NULL,
  mastery_level NUMERIC DEFAULT 0,
  questions_answered INT DEFAULT 0,
  correct_answers INT DEFAULT 0,
  last_studied_at TIMESTAMPTZ,
  streak_days INT DEFAULT 0,
  metadata JSONB DEFAULT '{}',
  UNIQUE(user_id, organization_id, opposition_id, topic_id)
);

CREATE INDEX idx_study_progress_user ON study_progress(user_id);

-- ============================================
-- AI CHAT MESSAGES
-- ============================================
CREATE TABLE ai_chat_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  organization_id UUID REFERENCES organizations(id) ON DELETE SET NULL,
  opposition_id UUID REFERENCES oppositions(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('user', 'assistant', 'system')),
  content TEXT NOT NULL,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_ai_chat_user ON ai_chat_messages(user_id);
CREATE INDEX idx_ai_chat_org ON ai_chat_messages(organization_id);

-- ============================================
-- RLS POLICIES FOR ALL NEW TABLES
-- ============================================

-- Topics
ALTER TABLE topics ENABLE ROW LEVEL SECURITY;
CREATE POLICY "topics_select" ON topics FOR SELECT USING (
  organization_id IN (SELECT get_user_org_ids()) OR is_super_admin()
);
CREATE POLICY "topics_insert" ON topics FOR INSERT WITH CHECK (
  organization_id IN (SELECT get_user_org_ids())
);
CREATE POLICY "topics_update" ON topics FOR UPDATE USING (
  organization_id IN (SELECT get_user_org_ids())
);
CREATE POLICY "topics_delete" ON topics FOR DELETE USING (
  organization_id IN (SELECT get_user_org_ids()) AND
  'center_admin' = ANY(get_user_roles(organization_id))
);

-- Resources
ALTER TABLE resources ENABLE ROW LEVEL SECURITY;
CREATE POLICY "resources_select" ON resources FOR SELECT USING (
  is_public OR organization_id IN (SELECT get_user_org_ids()) OR is_super_admin()
);
CREATE POLICY "resources_insert" ON resources FOR INSERT WITH CHECK (
  organization_id IN (SELECT get_user_org_ids())
);
CREATE POLICY "resources_update" ON resources FOR UPDATE USING (
  organization_id IN (SELECT get_user_org_ids())
);
CREATE POLICY "resources_delete" ON resources FOR DELETE USING (
  organization_id IN (SELECT get_user_org_ids())
);

-- Classes
ALTER TABLE classes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "classes_select" ON classes FOR SELECT USING (
  organization_id IN (SELECT get_user_org_ids()) OR is_super_admin()
);
CREATE POLICY "classes_insert" ON classes FOR INSERT WITH CHECK (
  organization_id IN (SELECT get_user_org_ids())
);
CREATE POLICY "classes_update" ON classes FOR UPDATE USING (
  organization_id IN (SELECT get_user_org_ids())
);
CREATE POLICY "classes_delete" ON classes FOR DELETE USING (
  organization_id IN (SELECT get_user_org_ids()) AND
  'center_admin' = ANY(get_user_roles(organization_id))
);

-- Class Attendees
ALTER TABLE class_attendees ENABLE ROW LEVEL SECURITY;
CREATE POLICY "class_attendees_select" ON class_attendees FOR SELECT USING (
  user_id = auth.uid() OR
  class_id IN (SELECT id FROM classes WHERE organization_id IN (SELECT get_user_org_ids())) OR
  is_super_admin()
);
CREATE POLICY "class_attendees_insert" ON class_attendees FOR INSERT WITH CHECK (
  user_id = auth.uid() OR
  class_id IN (SELECT id FROM classes WHERE organization_id IN (SELECT get_user_org_ids()))
);
CREATE POLICY "class_attendees_update" ON class_attendees FOR UPDATE USING (
  user_id = auth.uid() OR
  class_id IN (SELECT id FROM classes WHERE organization_id IN (SELECT get_user_org_ids()))
);

-- Plans
ALTER TABLE plans ENABLE ROW LEVEL SECURITY;
CREATE POLICY "plans_select" ON plans FOR SELECT USING (
  is_active OR organization_id IN (SELECT get_user_org_ids()) OR is_super_admin()
);
CREATE POLICY "plans_insert" ON plans FOR INSERT WITH CHECK (
  organization_id IN (SELECT get_user_org_ids()) OR is_super_admin()
);
CREATE POLICY "plans_update" ON plans FOR UPDATE USING (
  organization_id IN (SELECT get_user_org_ids()) OR is_super_admin()
);

-- Subscriptions
ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "subscriptions_select" ON subscriptions FOR SELECT USING (
  user_id = auth.uid() OR
  organization_id IN (SELECT get_user_org_ids()) OR
  is_super_admin()
);
CREATE POLICY "subscriptions_insert" ON subscriptions FOR INSERT WITH CHECK (
  user_id = auth.uid() OR is_super_admin()
);
CREATE POLICY "subscriptions_update" ON subscriptions FOR UPDATE USING (
  user_id = auth.uid() OR
  organization_id IN (SELECT get_user_org_ids()) OR
  is_super_admin()
);

-- Payments
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "payments_select" ON payments FOR SELECT USING (
  user_id = auth.uid() OR
  organization_id IN (SELECT get_user_org_ids()) OR
  is_super_admin()
);
CREATE POLICY "payments_insert" ON payments FOR INSERT WITH CHECK (
  is_super_admin()
);

-- Center Settlements
ALTER TABLE center_settlements ENABLE ROW LEVEL SECURITY;
CREATE POLICY "settlements_select" ON center_settlements FOR SELECT USING (
  organization_id IN (SELECT get_user_org_ids()) OR is_super_admin()
);
CREATE POLICY "settlements_insert" ON center_settlements FOR INSERT WITH CHECK (
  is_super_admin()
);
CREATE POLICY "settlements_update" ON center_settlements FOR UPDATE USING (
  is_super_admin()
);

-- Questions
ALTER TABLE questions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "questions_select" ON questions FOR SELECT USING (
  organization_id IN (SELECT get_user_org_ids()) OR
  organization_id IS NULL OR
  is_super_admin()
);
CREATE POLICY "questions_insert" ON questions FOR INSERT WITH CHECK (
  organization_id IN (SELECT get_user_org_ids()) OR is_super_admin()
);
CREATE POLICY "questions_update" ON questions FOR UPDATE USING (
  organization_id IN (SELECT get_user_org_ids()) OR is_super_admin()
);
CREATE POLICY "questions_delete" ON questions FOR DELETE USING (
  organization_id IN (SELECT get_user_org_ids()) OR is_super_admin()
);

-- Test Sessions
ALTER TABLE test_sessions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "test_sessions_select" ON test_sessions FOR SELECT USING (
  user_id = auth.uid() OR
  organization_id IN (SELECT get_user_org_ids()) OR
  is_super_admin()
);
CREATE POLICY "test_sessions_insert" ON test_sessions FOR INSERT WITH CHECK (
  user_id = auth.uid()
);
CREATE POLICY "test_sessions_update" ON test_sessions FOR UPDATE USING (
  user_id = auth.uid()
);

-- Study Progress
ALTER TABLE study_progress ENABLE ROW LEVEL SECURITY;
CREATE POLICY "study_progress_select" ON study_progress FOR SELECT USING (
  user_id = auth.uid() OR
  organization_id IN (SELECT get_user_org_ids()) OR
  is_super_admin()
);
CREATE POLICY "study_progress_insert" ON study_progress FOR INSERT WITH CHECK (
  user_id = auth.uid()
);
CREATE POLICY "study_progress_update" ON study_progress FOR UPDATE USING (
  user_id = auth.uid()
);

-- AI Chat Messages
ALTER TABLE ai_chat_messages ENABLE ROW LEVEL SECURITY;
CREATE POLICY "ai_chat_select" ON ai_chat_messages FOR SELECT USING (
  user_id = auth.uid() OR is_super_admin()
);
CREATE POLICY "ai_chat_insert" ON ai_chat_messages FOR INSERT WITH CHECK (
  user_id = auth.uid()
);
