-- Migration: Intelligent Onboarding + Knowledge Base
-- Created: 2026-02-14

-- Ensure pgvector is enabled
CREATE EXTENSION IF NOT EXISTS vector;

-- ============================================================================
-- Helper functions for content permissions
-- ============================================================================
CREATE OR REPLACE FUNCTION safe_uuid(value TEXT)
RETURNS UUID
LANGUAGE plpgsql
IMMUTABLE
AS $$
BEGIN
  RETURN value::uuid;
EXCEPTION
  WHEN others THEN
    RETURN NULL;
END;
$$;

CREATE OR REPLACE FUNCTION can_manage_center_content(org_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT COALESCE(
    is_super_admin()
    OR EXISTS (
      SELECT 1
      FROM organization_members om
      WHERE om.organization_id = org_id
        AND om.user_id = auth.uid()
        AND om.status = 'active'
        AND om.role IN ('center_admin', 'teacher')
    ),
    false
  );
$$;

CREATE OR REPLACE FUNCTION can_access_center_oposition(org_id UUID, oposicion_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT COALESCE(
    is_super_admin()
    OR EXISTS (
      SELECT 1
      FROM organization_members om
      WHERE om.organization_id = org_id
        AND om.user_id = auth.uid()
        AND om.status = 'active'
        AND om.role IN ('center_admin', 'teacher')
    )
    OR EXISTS (
      SELECT 1
      FROM organization_members om
      JOIN organization_oppositions oo
        ON oo.organization_id = om.organization_id
       AND oo.opposition_id = oposicion_id
      WHERE om.organization_id = org_id
        AND om.user_id = auth.uid()
        AND om.status = 'active'
        AND om.role = 'student'
    ),
    false
  );
$$;

CREATE OR REPLACE FUNCTION can_access_progress_row(progress_student_id UUID, org_id UUID, oposicion_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT COALESCE(
    is_super_admin()
    OR EXISTS (
      SELECT 1
      FROM organization_members om
      WHERE om.organization_id = org_id
        AND om.user_id = auth.uid()
        AND om.status = 'active'
        AND om.role IN ('center_admin', 'teacher')
    )
    OR (auth.uid() = progress_student_id AND can_access_center_oposition(org_id, oposicion_id)),
    false
  );
$$;

-- ============================================================================
-- Knowledge base tables
-- ============================================================================
CREATE TABLE content_uploads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  center_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  oposicion_id UUID NOT NULL REFERENCES oppositions(id) ON DELETE CASCADE,
  file_name TEXT NOT NULL,
  file_type TEXT NOT NULL,
  mime_type TEXT NOT NULL,
  storage_path TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed')),
  progress INT NOT NULL DEFAULT 0 CHECK (progress >= 0 AND progress <= 100),
  error_message TEXT,
  metadata JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_content_uploads_center ON content_uploads(center_id);
CREATE INDEX idx_content_uploads_oposicion ON content_uploads(oposicion_id);
CREATE INDEX idx_content_uploads_status ON content_uploads(status);
CREATE INDEX idx_content_uploads_created ON content_uploads(created_at DESC);

CREATE TRIGGER trg_content_uploads_updated_at
  BEFORE UPDATE ON content_uploads
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TABLE processed_content (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  upload_id UUID NOT NULL REFERENCES content_uploads(id) ON DELETE CASCADE,
  content_type TEXT NOT NULL CHECK (content_type IN ('text', 'transcript', 'ocr')),
  raw_text TEXT NOT NULL,
  chunks JSONB NOT NULL DEFAULT '[]',
  metadata JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_processed_content_upload ON processed_content(upload_id);

CREATE TABLE knowledge_chunks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  content_id UUID NOT NULL REFERENCES processed_content(id) ON DELETE CASCADE,
  oposicion_id UUID NOT NULL REFERENCES oppositions(id) ON DELETE CASCADE,
  tema TEXT,
  subtema TEXT,
  chunk_text TEXT NOT NULL,
  embedding vector(1536),
  difficulty TEXT,
  tags TEXT[] NOT NULL DEFAULT '{}',
  source_ref TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_knowledge_chunks_content ON knowledge_chunks(content_id);
CREATE INDEX idx_knowledge_chunks_oposicion ON knowledge_chunks(oposicion_id);
CREATE INDEX idx_knowledge_chunks_tags ON knowledge_chunks USING GIN (tags);
CREATE INDEX idx_knowledge_chunks_embedding ON knowledge_chunks
  USING hnsw (embedding vector_cosine_ops)
  WITH (m = 16, ef_construction = 64);

CREATE TABLE generated_questions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  chunk_id UUID NOT NULL REFERENCES knowledge_chunks(id) ON DELETE CASCADE,
  oposicion_id UUID NOT NULL REFERENCES oppositions(id) ON DELETE CASCADE,
  question_text TEXT NOT NULL,
  options JSONB NOT NULL DEFAULT '[]',
  correct_answer TEXT NOT NULL,
  explanation TEXT,
  difficulty INT NOT NULL DEFAULT 3 CHECK (difficulty >= 1 AND difficulty <= 5),
  validated BOOLEAN NOT NULL DEFAULT false,
  quality_score FLOAT,
  metadata JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_generated_questions_chunk ON generated_questions(chunk_id);
CREATE INDEX idx_generated_questions_oposicion ON generated_questions(oposicion_id);
CREATE INDEX idx_generated_questions_validated ON generated_questions(validated);

CREATE TABLE flashcards (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  chunk_id UUID NOT NULL REFERENCES knowledge_chunks(id) ON DELETE CASCADE,
  oposicion_id UUID NOT NULL REFERENCES oppositions(id) ON DELETE CASCADE,
  front TEXT NOT NULL,
  back TEXT NOT NULL,
  tags TEXT[] NOT NULL DEFAULT '{}',
  difficulty INT NOT NULL DEFAULT 3 CHECK (difficulty >= 1 AND difficulty <= 5),
  metadata JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_flashcards_chunk ON flashcards(chunk_id);
CREATE INDEX idx_flashcards_oposicion ON flashcards(oposicion_id);
CREATE INDEX idx_flashcards_tags ON flashcards USING GIN (tags);

CREATE TABLE student_progress (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  item_id UUID NOT NULL,
  item_type TEXT NOT NULL CHECK (item_type IN ('question', 'flashcard')),
  fsrs_state JSONB NOT NULL DEFAULT '{}',
  next_review TIMESTAMPTZ,
  easiness FLOAT NOT NULL DEFAULT 2.5,
  interval INT NOT NULL DEFAULT 0,
  repetitions INT NOT NULL DEFAULT 0,
  center_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  oposicion_id UUID NOT NULL REFERENCES oppositions(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(student_id, item_id, item_type)
);

CREATE INDEX idx_student_progress_student ON student_progress(student_id);
CREATE INDEX idx_student_progress_due ON student_progress(student_id, next_review);
CREATE INDEX idx_student_progress_oposicion ON student_progress(oposicion_id);

CREATE TRIGGER trg_student_progress_updated_at
  BEFORE UPDATE ON student_progress
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ============================================================================
-- Semantic search RPC
-- ============================================================================
CREATE OR REPLACE FUNCTION match_knowledge_chunks(
  query_embedding vector(1536),
  filter_oposicion_id UUID,
  match_threshold FLOAT DEFAULT 0.65,
  match_count INT DEFAULT 12
)
RETURNS TABLE (
  id UUID,
  content_id UUID,
  oposicion_id UUID,
  tema TEXT,
  subtema TEXT,
  chunk_text TEXT,
  tags TEXT[],
  similarity FLOAT
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT
    kc.id,
    kc.content_id,
    kc.oposicion_id,
    kc.tema,
    kc.subtema,
    kc.chunk_text,
    kc.tags,
    1 - (kc.embedding <=> query_embedding) AS similarity
  FROM knowledge_chunks kc
  WHERE kc.oposicion_id = filter_oposicion_id
    AND kc.embedding IS NOT NULL
    AND (1 - (kc.embedding <=> query_embedding)) >= match_threshold
  ORDER BY kc.embedding <=> query_embedding
  LIMIT match_count;
END;
$$;

-- ============================================================================
-- RLS policies
-- ============================================================================
ALTER TABLE content_uploads ENABLE ROW LEVEL SECURITY;
ALTER TABLE processed_content ENABLE ROW LEVEL SECURITY;
ALTER TABLE knowledge_chunks ENABLE ROW LEVEL SECURITY;
ALTER TABLE generated_questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE flashcards ENABLE ROW LEVEL SECURITY;
ALTER TABLE student_progress ENABLE ROW LEVEL SECURITY;

-- content_uploads
CREATE POLICY "content_uploads_select" ON content_uploads FOR SELECT USING (
  can_access_center_oposition(center_id, oposicion_id)
);

CREATE POLICY "content_uploads_insert" ON content_uploads FOR INSERT WITH CHECK (
  can_manage_center_content(center_id)
);

CREATE POLICY "content_uploads_update" ON content_uploads FOR UPDATE USING (
  can_manage_center_content(center_id)
);

CREATE POLICY "content_uploads_delete" ON content_uploads FOR DELETE USING (
  can_manage_center_content(center_id)
);

-- processed_content
CREATE POLICY "processed_content_select" ON processed_content FOR SELECT USING (
  EXISTS (
    SELECT 1
    FROM content_uploads cu
    WHERE cu.id = processed_content.upload_id
      AND can_access_center_oposition(cu.center_id, cu.oposicion_id)
  )
);

CREATE POLICY "processed_content_insert" ON processed_content FOR INSERT WITH CHECK (
  EXISTS (
    SELECT 1
    FROM content_uploads cu
    WHERE cu.id = processed_content.upload_id
      AND can_manage_center_content(cu.center_id)
  )
);

CREATE POLICY "processed_content_update" ON processed_content FOR UPDATE USING (
  EXISTS (
    SELECT 1
    FROM content_uploads cu
    WHERE cu.id = processed_content.upload_id
      AND can_manage_center_content(cu.center_id)
  )
);

-- knowledge_chunks
CREATE POLICY "knowledge_chunks_select" ON knowledge_chunks FOR SELECT USING (
  EXISTS (
    SELECT 1
    FROM processed_content pc
    JOIN content_uploads cu ON cu.id = pc.upload_id
    WHERE pc.id = knowledge_chunks.content_id
      AND can_access_center_oposition(cu.center_id, knowledge_chunks.oposicion_id)
  )
);

CREATE POLICY "knowledge_chunks_insert" ON knowledge_chunks FOR INSERT WITH CHECK (
  EXISTS (
    SELECT 1
    FROM processed_content pc
    JOIN content_uploads cu ON cu.id = pc.upload_id
    WHERE pc.id = knowledge_chunks.content_id
      AND can_manage_center_content(cu.center_id)
  )
);

CREATE POLICY "knowledge_chunks_update" ON knowledge_chunks FOR UPDATE USING (
  EXISTS (
    SELECT 1
    FROM processed_content pc
    JOIN content_uploads cu ON cu.id = pc.upload_id
    WHERE pc.id = knowledge_chunks.content_id
      AND can_manage_center_content(cu.center_id)
  )
);

-- generated_questions
CREATE POLICY "generated_questions_select" ON generated_questions FOR SELECT USING (
  EXISTS (
    SELECT 1
    FROM knowledge_chunks kc
    JOIN processed_content pc ON pc.id = kc.content_id
    JOIN content_uploads cu ON cu.id = pc.upload_id
    WHERE kc.id = generated_questions.chunk_id
      AND can_access_center_oposition(cu.center_id, generated_questions.oposicion_id)
  )
);

CREATE POLICY "generated_questions_insert" ON generated_questions FOR INSERT WITH CHECK (
  EXISTS (
    SELECT 1
    FROM knowledge_chunks kc
    JOIN processed_content pc ON pc.id = kc.content_id
    JOIN content_uploads cu ON cu.id = pc.upload_id
    WHERE kc.id = generated_questions.chunk_id
      AND can_manage_center_content(cu.center_id)
  )
);

CREATE POLICY "generated_questions_update" ON generated_questions FOR UPDATE USING (
  EXISTS (
    SELECT 1
    FROM knowledge_chunks kc
    JOIN processed_content pc ON pc.id = kc.content_id
    JOIN content_uploads cu ON cu.id = pc.upload_id
    WHERE kc.id = generated_questions.chunk_id
      AND can_manage_center_content(cu.center_id)
  )
);

-- flashcards
CREATE POLICY "flashcards_select" ON flashcards FOR SELECT USING (
  EXISTS (
    SELECT 1
    FROM knowledge_chunks kc
    JOIN processed_content pc ON pc.id = kc.content_id
    JOIN content_uploads cu ON cu.id = pc.upload_id
    WHERE kc.id = flashcards.chunk_id
      AND can_access_center_oposition(cu.center_id, flashcards.oposicion_id)
  )
);

CREATE POLICY "flashcards_insert" ON flashcards FOR INSERT WITH CHECK (
  EXISTS (
    SELECT 1
    FROM knowledge_chunks kc
    JOIN processed_content pc ON pc.id = kc.content_id
    JOIN content_uploads cu ON cu.id = pc.upload_id
    WHERE kc.id = flashcards.chunk_id
      AND can_manage_center_content(cu.center_id)
  )
);

CREATE POLICY "flashcards_update" ON flashcards FOR UPDATE USING (
  EXISTS (
    SELECT 1
    FROM knowledge_chunks kc
    JOIN processed_content pc ON pc.id = kc.content_id
    JOIN content_uploads cu ON cu.id = pc.upload_id
    WHERE kc.id = flashcards.chunk_id
      AND can_manage_center_content(cu.center_id)
  )
);

-- student_progress
CREATE POLICY "student_progress_select" ON student_progress FOR SELECT USING (
  can_access_progress_row(student_id, center_id, oposicion_id)
);

CREATE POLICY "student_progress_insert" ON student_progress FOR INSERT WITH CHECK (
  can_access_progress_row(student_id, center_id, oposicion_id)
);

CREATE POLICY "student_progress_update" ON student_progress FOR UPDATE USING (
  can_access_progress_row(student_id, center_id, oposicion_id)
);

CREATE POLICY "student_progress_delete" ON student_progress FOR DELETE USING (
  can_manage_center_content(center_id) OR is_super_admin()
);

-- ============================================================================
-- Storage bucket and object policies
-- ============================================================================
INSERT INTO storage.buckets (id, name, public)
VALUES ('content-uploads', 'content-uploads', false)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "content_uploads_storage_select"
ON storage.objects FOR SELECT
TO authenticated
USING (
  bucket_id = 'content-uploads'
  AND can_access_center_oposition(
    safe_uuid(split_part(name, '/', 1)),
    safe_uuid(split_part(name, '/', 2))
  )
);

CREATE POLICY "content_uploads_storage_insert"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'content-uploads'
  AND can_manage_center_content(safe_uuid(split_part(name, '/', 1)))
);

CREATE POLICY "content_uploads_storage_update"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'content-uploads'
  AND can_manage_center_content(safe_uuid(split_part(name, '/', 1)))
)
WITH CHECK (
  bucket_id = 'content-uploads'
  AND can_manage_center_content(safe_uuid(split_part(name, '/', 1)))
);

CREATE POLICY "content_uploads_storage_delete"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'content-uploads'
  AND can_manage_center_content(safe_uuid(split_part(name, '/', 1)))
);
