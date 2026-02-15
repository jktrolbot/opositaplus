-- Migration: Roles/Auth hardening + canonical 4-role model
-- Created: 2026-02-15

-- ============================================================================
-- Canonical role model
-- ============================================================================
CREATE OR REPLACE FUNCTION normalize_app_role(value TEXT)
RETURNS TEXT
LANGUAGE sql
IMMUTABLE
AS $$
  SELECT CASE lower(trim(coalesce(value, '')))
    WHEN 'super_admin' THEN 'super_admin'
    WHEN 'center_admin' THEN 'centro_admin'
    WHEN 'centro_admin' THEN 'centro_admin'
    WHEN 'teacher' THEN 'profesor'
    WHEN 'profesor' THEN 'profesor'
    WHEN 'student' THEN 'alumno'
    WHEN 'alumno' THEN 'alumno'
    ELSE NULL
  END;
$$;

CREATE OR REPLACE FUNCTION infer_user_role_from_memberships(target_user_id UUID)
RETURNS TEXT
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  WITH ranked AS (
    SELECT normalize_app_role(om.role) AS role
    FROM organization_members om
    WHERE om.user_id = target_user_id
      AND om.status = 'active'
  )
  SELECT role
  FROM ranked
  WHERE role IS NOT NULL
  ORDER BY CASE role
    WHEN 'centro_admin' THEN 1
    WHEN 'profesor' THEN 2
    WHEN 'alumno' THEN 3
    ELSE 4
  END
  LIMIT 1;
$$;

ALTER TABLE user_profiles
  ADD COLUMN IF NOT EXISTS role TEXT;

ALTER TABLE user_profiles
  ALTER COLUMN role SET DEFAULT 'alumno';

ALTER TABLE organization_members
  DROP CONSTRAINT IF EXISTS organization_members_role_check;

ALTER TABLE organization_members
  ADD CONSTRAINT organization_members_role_check
  CHECK (role IN ('center_admin', 'teacher', 'student', 'centro_admin', 'profesor', 'alumno'));

UPDATE user_profiles up
SET role = CASE
  WHEN up.is_super_admin THEN 'super_admin'
  ELSE COALESCE(infer_user_role_from_memberships(up.id), 'alumno')
END;

ALTER TABLE user_profiles
  DROP CONSTRAINT IF EXISTS user_profiles_role_check;

ALTER TABLE user_profiles
  ADD CONSTRAINT user_profiles_role_check
  CHECK (role IN ('super_admin', 'centro_admin', 'profesor', 'alumno'));

ALTER TABLE user_profiles
  ALTER COLUMN role SET NOT NULL;

CREATE OR REPLACE FUNCTION refresh_user_profile_role(target_user_id UUID)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  IF target_user_id IS NULL THEN
    RETURN;
  END IF;

  UPDATE user_profiles up
  SET role = CASE
    WHEN up.is_super_admin THEN 'super_admin'
    ELSE COALESCE(infer_user_role_from_memberships(up.id), 'alumno')
  END
  WHERE up.id = target_user_id;
END;
$$;

CREATE OR REPLACE FUNCTION sync_user_profile_role()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  IF NEW.is_super_admin THEN
    NEW.role := 'super_admin';
  ELSE
    NEW.role := COALESCE(infer_user_role_from_memberships(NEW.id), 'alumno');
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_user_profiles_sync_role ON user_profiles;

CREATE TRIGGER trg_user_profiles_sync_role
  BEFORE INSERT OR UPDATE
  ON user_profiles
  FOR EACH ROW
  EXECUTE FUNCTION sync_user_profile_role();

CREATE OR REPLACE FUNCTION sync_profile_role_on_org_member_change()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  IF TG_OP = 'UPDATE' AND OLD.user_id IS DISTINCT FROM NEW.user_id THEN
    PERFORM refresh_user_profile_role(OLD.user_id);
  END IF;

  PERFORM refresh_user_profile_role(COALESCE(NEW.user_id, OLD.user_id));
  RETURN COALESCE(NEW, OLD);
END;
$$;

DROP TRIGGER IF EXISTS trg_org_members_sync_profile_role ON organization_members;

CREATE TRIGGER trg_org_members_sync_profile_role
  AFTER INSERT OR UPDATE OR DELETE ON organization_members
  FOR EACH ROW
  EXECUTE FUNCTION sync_profile_role_on_org_member_change();

-- ============================================================================
-- Auth helper functions used by RLS
-- ============================================================================
CREATE OR REPLACE FUNCTION get_user_roles(org_id UUID)
RETURNS TEXT[]
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  WITH role_rows AS (
    SELECT role
    FROM organization_members
    WHERE user_id = auth.uid()
      AND organization_id = org_id
      AND status = 'active'
  ),
  normalized AS (
    SELECT normalize_app_role(role) AS role
    FROM role_rows
  ),
  all_roles AS (
    SELECT role FROM role_rows
    UNION
    SELECT role FROM normalized
    UNION
    SELECT CASE role
      WHEN 'centro_admin' THEN 'center_admin'
      WHEN 'profesor' THEN 'teacher'
      WHEN 'alumno' THEN 'student'
      ELSE role
    END
    FROM normalized
  )
  SELECT COALESCE(array_agg(DISTINCT role), '{}')::TEXT[]
  FROM all_roles
  WHERE role IS NOT NULL;
$$;

CREATE OR REPLACE FUNCTION get_user_role(target_user_id UUID DEFAULT auth.uid())
RETURNS TEXT
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT CASE
    WHEN target_user_id IS NULL THEN NULL
    ELSE COALESCE(
      (
        SELECT CASE
          WHEN up.is_super_admin THEN 'super_admin'
          ELSE normalize_app_role(up.role)
        END
        FROM user_profiles up
        WHERE up.id = target_user_id
      ),
      infer_user_role_from_memberships(target_user_id),
      'alumno'
    )
  END;
$$;

CREATE OR REPLACE FUNCTION is_super_admin()
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT COALESCE(get_user_role(auth.uid()) = 'super_admin', false);
$$;

CREATE OR REPLACE FUNCTION is_admin(target_user_id UUID DEFAULT auth.uid())
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT COALESCE(get_user_role(target_user_id) IN ('super_admin', 'centro_admin'), false);
$$;

-- ============================================================================
-- Permission helpers for center/KB scope
-- ============================================================================
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
        AND normalize_app_role(om.role) IN ('centro_admin', 'profesor')
    ),
    false
  );
$$;

CREATE OR REPLACE FUNCTION can_access_center_kb(org_id UUID, oposicion_id UUID)
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
      JOIN organization_oppositions oo
        ON oo.organization_id = om.organization_id
       AND oo.opposition_id = oposicion_id
      WHERE om.organization_id = org_id
        AND om.user_id = auth.uid()
        AND om.status = 'active'
        AND normalize_app_role(om.role) IN ('centro_admin', 'profesor')
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
      JOIN organization_oppositions oo
        ON oo.organization_id = om.organization_id
       AND oo.opposition_id = oposicion_id
      WHERE om.organization_id = org_id
        AND om.user_id = auth.uid()
        AND om.status = 'active'
        AND normalize_app_role(om.role) IN ('centro_admin', 'profesor', 'alumno')
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
        AND normalize_app_role(om.role) IN ('centro_admin', 'profesor')
    )
    OR (auth.uid() = progress_student_id AND can_access_center_oposition(org_id, oposicion_id)),
    false
  );
$$;

-- ============================================================================
-- Knowledge base RLS hardening (alumno: no raw KB/chunks)
-- ============================================================================
DROP POLICY IF EXISTS "content_uploads_select" ON content_uploads;
DROP POLICY IF EXISTS "content_uploads_insert" ON content_uploads;
DROP POLICY IF EXISTS "content_uploads_update" ON content_uploads;
DROP POLICY IF EXISTS "content_uploads_delete" ON content_uploads;

CREATE POLICY "content_uploads_select" ON content_uploads FOR SELECT USING (
  can_access_center_kb(center_id, oposicion_id)
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

DROP POLICY IF EXISTS "processed_content_select" ON processed_content;
DROP POLICY IF EXISTS "processed_content_insert" ON processed_content;
DROP POLICY IF EXISTS "processed_content_update" ON processed_content;

CREATE POLICY "processed_content_select" ON processed_content FOR SELECT USING (
  EXISTS (
    SELECT 1
    FROM content_uploads cu
    WHERE cu.id = processed_content.upload_id
      AND can_access_center_kb(cu.center_id, cu.oposicion_id)
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

DROP POLICY IF EXISTS "knowledge_chunks_select" ON knowledge_chunks;
DROP POLICY IF EXISTS "knowledge_chunks_insert" ON knowledge_chunks;
DROP POLICY IF EXISTS "knowledge_chunks_update" ON knowledge_chunks;

CREATE POLICY "knowledge_chunks_select" ON knowledge_chunks FOR SELECT USING (
  EXISTS (
    SELECT 1
    FROM processed_content pc
    JOIN content_uploads cu ON cu.id = pc.upload_id
    WHERE pc.id = knowledge_chunks.content_id
      AND can_access_center_kb(cu.center_id, knowledge_chunks.oposicion_id)
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

DROP POLICY IF EXISTS "generated_questions_select" ON generated_questions;
DROP POLICY IF EXISTS "generated_questions_insert" ON generated_questions;
DROP POLICY IF EXISTS "generated_questions_update" ON generated_questions;

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

DROP POLICY IF EXISTS "flashcards_select" ON flashcards;
DROP POLICY IF EXISTS "flashcards_insert" ON flashcards;
DROP POLICY IF EXISTS "flashcards_update" ON flashcards;

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

DROP POLICY IF EXISTS "student_progress_select" ON student_progress;
DROP POLICY IF EXISTS "student_progress_insert" ON student_progress;
DROP POLICY IF EXISTS "student_progress_update" ON student_progress;
DROP POLICY IF EXISTS "student_progress_delete" ON student_progress;

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

DROP POLICY IF EXISTS "content_uploads_storage_select" ON storage.objects;

CREATE POLICY "content_uploads_storage_select"
ON storage.objects FOR SELECT
TO authenticated
USING (
  bucket_id = 'content-uploads'
  AND can_access_center_kb(
    safe_uuid(split_part(name, '/', 1)),
    safe_uuid(split_part(name, '/', 2))
  )
);
