-- 00002_rls_policies.sql
-- RLS policies and auth helper functions for Oposita+ B2B

-- ============================================================================
-- 1. Enable RLS on all tables
-- ============================================================================
ALTER TABLE organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE organization_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE opposition_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE oppositions ENABLE ROW LEVEL SECURITY;
ALTER TABLE organization_oppositions ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- 2. Helper functions
-- ============================================================================
CREATE OR REPLACE FUNCTION get_user_org_ids() RETURNS UUID[] AS $$
  SELECT COALESCE(array_agg(organization_id), '{}')
  FROM organization_members
  WHERE user_id = auth.uid() AND status = 'active'
$$ LANGUAGE sql SECURITY DEFINER STABLE;

CREATE OR REPLACE FUNCTION get_user_roles(org_id UUID) RETURNS TEXT[] AS $$
  SELECT COALESCE(array_agg(role), '{}')
  FROM organization_members
  WHERE user_id = auth.uid() AND organization_id = org_id AND status = 'active'
$$ LANGUAGE sql SECURITY DEFINER STABLE;

CREATE OR REPLACE FUNCTION is_super_admin() RETURNS BOOLEAN AS $$
  SELECT COALESCE(
    (SELECT is_super_admin FROM user_profiles WHERE id = auth.uid()),
    false
  )
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- ============================================================================
-- 3. Organizations policies
-- ============================================================================
CREATE POLICY "organizations_select" ON organizations FOR SELECT
  USING (
    status = 'active'
    OR id = ANY(get_user_org_ids())
    OR is_super_admin()
  );

CREATE POLICY "organizations_insert" ON organizations FOR INSERT
  WITH CHECK (is_super_admin());

CREATE POLICY "organizations_update" ON organizations FOR UPDATE
  USING (
    is_super_admin()
    OR 'center_admin' = ANY(get_user_roles(id))
  );

CREATE POLICY "organizations_delete" ON organizations FOR DELETE
  USING (is_super_admin());

-- ============================================================================
-- 4. Organization members policies
-- ============================================================================
CREATE POLICY "org_members_select" ON organization_members FOR SELECT
  USING (
    organization_id = ANY(get_user_org_ids())
    OR is_super_admin()
  );

CREATE POLICY "org_members_insert" ON organization_members FOR INSERT
  WITH CHECK (
    'center_admin' = ANY(get_user_roles(organization_id))
    OR is_super_admin()
  );

CREATE POLICY "org_members_update" ON organization_members FOR UPDATE
  USING (
    'center_admin' = ANY(get_user_roles(organization_id))
    OR is_super_admin()
  );

CREATE POLICY "org_members_delete" ON organization_members FOR DELETE
  USING (
    'center_admin' = ANY(get_user_roles(organization_id))
    OR is_super_admin()
  );

-- ============================================================================
-- 5. User profiles policies
-- ============================================================================
CREATE POLICY "profiles_select" ON user_profiles FOR SELECT
  USING (
    id = auth.uid()
    OR is_super_admin()
    OR id IN (
      SELECT om.user_id FROM organization_members om
      WHERE om.organization_id = ANY(get_user_org_ids()) AND om.status = 'active'
    )
  );

CREATE POLICY "profiles_insert" ON user_profiles FOR INSERT
  WITH CHECK (id = auth.uid());

CREATE POLICY "profiles_update" ON user_profiles FOR UPDATE
  USING (id = auth.uid() OR is_super_admin());

CREATE POLICY "profiles_delete" ON user_profiles FOR DELETE
  USING (is_super_admin());

-- ============================================================================
-- 6. Opposition categories policies (public read)
-- ============================================================================
CREATE POLICY "categories_select" ON opposition_categories FOR SELECT
  USING (true);

CREATE POLICY "categories_insert" ON opposition_categories FOR INSERT
  WITH CHECK (is_super_admin());

CREATE POLICY "categories_update" ON opposition_categories FOR UPDATE
  USING (is_super_admin());

CREATE POLICY "categories_delete" ON opposition_categories FOR DELETE
  USING (is_super_admin());

-- ============================================================================
-- 6b. Oppositions policies (public read)
-- ============================================================================
CREATE POLICY "oppositions_select" ON oppositions FOR SELECT
  USING (true);

CREATE POLICY "oppositions_insert" ON oppositions FOR INSERT
  WITH CHECK (is_super_admin());

CREATE POLICY "oppositions_update" ON oppositions FOR UPDATE
  USING (is_super_admin());

CREATE POLICY "oppositions_delete" ON oppositions FOR DELETE
  USING (is_super_admin());

-- ============================================================================
-- 7. Organization oppositions policies
-- ============================================================================
CREATE POLICY "org_oppositions_select" ON organization_oppositions FOR SELECT
  USING (true);

CREATE POLICY "org_oppositions_insert" ON organization_oppositions FOR INSERT
  WITH CHECK (
    'center_admin' = ANY(get_user_roles(organization_id))
    OR is_super_admin()
  );

CREATE POLICY "org_oppositions_update" ON organization_oppositions FOR UPDATE
  USING (
    'center_admin' = ANY(get_user_roles(organization_id))
    OR is_super_admin()
  );

CREATE POLICY "org_oppositions_delete" ON organization_oppositions FOR DELETE
  USING (
    'center_admin' = ANY(get_user_roles(organization_id))
    OR is_super_admin()
  );

-- ============================================================================
-- 8. Auto-create user profile on signup
-- ============================================================================
CREATE OR REPLACE FUNCTION handle_new_user() RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.user_profiles (id, full_name)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'full_name', ''));
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();
