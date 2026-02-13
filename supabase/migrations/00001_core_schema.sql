-- Core schema for Oposita+ B2B platform

-- Updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Organizations
CREATE TABLE organizations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  description TEXT,
  logo_url TEXT,
  brand_color TEXT DEFAULT '#6366f1',
  website TEXT,
  phone TEXT,
  email TEXT,
  address JSONB,
  settings JSONB DEFAULT '{}',
  commission_rate NUMERIC(4,2) DEFAULT 20.00,
  plan TEXT DEFAULT 'standard',
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending','active','suspended','archived')),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_organizations_slug ON organizations(slug);

CREATE TRIGGER trg_organizations_updated_at
  BEFORE UPDATE ON organizations
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- User profiles
CREATE TABLE user_profiles (
  id UUID PRIMARY KEY REFERENCES auth.users ON DELETE CASCADE,
  full_name TEXT,
  avatar_url TEXT,
  phone TEXT,
  dni TEXT,
  address JSONB,
  bio TEXT,
  is_super_admin BOOLEAN DEFAULT false,
  preferences JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TRIGGER trg_user_profiles_updated_at
  BEFORE UPDATE ON user_profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- Organization members
CREATE TABLE organization_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('center_admin','teacher','student')),
  status TEXT DEFAULT 'active' CHECK (status IN ('active','invited','suspended')),
  invited_at TIMESTAMPTZ,
  joined_at TIMESTAMPTZ DEFAULT now(),
  metadata JSONB,
  UNIQUE(organization_id, user_id, role)
);

CREATE INDEX idx_organization_members_org_id ON organization_members(organization_id);
CREATE INDEX idx_organization_members_user_id ON organization_members(user_id);

-- Opposition categories
CREATE TABLE opposition_categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  parent_id UUID REFERENCES opposition_categories(id),
  description TEXT,
  icon TEXT,
  sort_order INT DEFAULT 0
);

CREATE INDEX idx_opposition_categories_slug ON opposition_categories(slug);

-- Oppositions
CREATE TABLE oppositions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  category_id UUID REFERENCES opposition_categories(id),
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  description TEXT,
  official_body TEXT,
  exam_type TEXT,
  status TEXT DEFAULT 'active',
  metadata JSONB,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_oppositions_slug ON oppositions(slug);

-- Organization oppositions (many-to-many)
CREATE TABLE organization_oppositions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  opposition_id UUID NOT NULL REFERENCES oppositions(id) ON DELETE CASCADE,
  is_featured BOOLEAN DEFAULT false,
  UNIQUE(organization_id, opposition_id)
);

CREATE INDEX idx_organization_oppositions_org_id ON organization_oppositions(organization_id);
