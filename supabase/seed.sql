-- Seed Data: CIP Formación + Categories + Oppositions
-- Run with: supabase db reset (applies migrations + seed)

-- ============================================
-- OPPOSITION CATEGORIES
-- ============================================
INSERT INTO opposition_categories (id, name, slug, description, icon) VALUES
  ('a0000000-0000-0000-0000-000000000001', 'Administración General', 'age', 'Oposiciones de la Administración General del Estado', '🏛️'),
  ('a0000000-0000-0000-0000-000000000002', 'Justicia', 'justicia', 'Oposiciones del cuerpo de Justicia', '⚖️'),
  ('a0000000-0000-0000-0000-000000000003', 'Hacienda y Finanzas', 'hacienda', 'Oposiciones de Hacienda del Estado', '💰'),
  ('a0000000-0000-0000-0000-000000000004', 'Comunidades Autónomas', 'ccaa', 'Oposiciones de las Comunidades Autónomas', '🗺️');

-- ============================================
-- OPPOSITIONS
-- ============================================
INSERT INTO oppositions (id, category_id, name, slug, description, difficulty_level) VALUES
  ('b0000000-0000-0000-0000-000000000001', 'a0000000-0000-0000-0000-000000000004', 'Cuerpo Superior - Xunta de Galicia (A1)', 'xunta-a1', 'Oposiciones al Cuerpo Superior de la Xunta de Galicia', 5),
  ('b0000000-0000-0000-0000-000000000002', 'a0000000-0000-0000-0000-000000000004', 'Cuerpo de Gestión - Xunta de Galicia (A2)', 'xunta-a2', 'Oposiciones al Cuerpo de Gestión de la Xunta de Galicia', 4),
  ('b0000000-0000-0000-0000-000000000003', 'a0000000-0000-0000-0000-000000000003', 'Técnicos de Hacienda del Estado', 'tecnicos-hacienda', 'Técnicos de Hacienda del Estado', 4),
  ('b0000000-0000-0000-0000-000000000004', 'a0000000-0000-0000-0000-000000000003', 'Inspectores de Hacienda del Estado', 'inspectores-hacienda', 'Inspectores de Hacienda del Estado', 5),
  ('b0000000-0000-0000-0000-000000000005', 'a0000000-0000-0000-0000-000000000001', 'Administración General del Estado (A1)', 'age-a1', 'Cuerpo Superior de Administradores Civiles del Estado', 5),
  ('b0000000-0000-0000-0000-000000000006', 'a0000000-0000-0000-0000-000000000002', 'Auxilio Judicial', 'justicia-auxilio', 'Cuerpo de Auxilio Judicial', 3);

-- ============================================
-- CIP FORMACIÓN (Organization)
-- ============================================
INSERT INTO organizations (id, name, slug, logo_url, description, status, commission_rate) VALUES
  ('c0000000-0000-0000-0000-000000000001', 'CIP Formación', 'cip-formacion', NULL, 'Centro de Iniciativas Profesionales. Referente en formación para oposiciones con más de 35 años de experiencia.', 'active', 20.00);

-- ============================================
-- LINK CIP WITH ALL 6 OPPOSITIONS
-- ============================================
INSERT INTO organization_oppositions (organization_id, opposition_id) VALUES
  ('c0000000-0000-0000-0000-000000000001', 'b0000000-0000-0000-0000-000000000001'),
  ('c0000000-0000-0000-0000-000000000001', 'b0000000-0000-0000-0000-000000000002'),
  ('c0000000-0000-0000-0000-000000000001', 'b0000000-0000-0000-0000-000000000003'),
  ('c0000000-0000-0000-0000-000000000001', 'b0000000-0000-0000-0000-000000000004'),
  ('c0000000-0000-0000-0000-000000000001', 'b0000000-0000-0000-0000-000000000005'),
  ('c0000000-0000-0000-0000-000000000001', 'b0000000-0000-0000-0000-000000000006');

-- ============================================
-- PLANS FOR XUNTA A1
-- ============================================
INSERT INTO plans (id, organization_id, opposition_id, name, description, type, price_cents, currency, includes_ai, is_active, features, trial_days) VALUES
  ('d0000000-0000-0000-0000-000000000001', 'c0000000-0000-0000-0000-000000000001', 'b0000000-0000-0000-0000-000000000001', 'Plan Mensual Xunta A1', 'Acceso completo mensual a la preparación de Xunta A1', 'monthly', 8900, 'eur', true, true, '["Tests ilimitados", "Tutor IA 24/7", "Clases en directo", "Material actualizado", "Simulacros de examen"]', 7),
  ('d0000000-0000-0000-0000-000000000002', 'c0000000-0000-0000-0000-000000000001', 'b0000000-0000-0000-0000-000000000001', 'Plan Trimestral Xunta A1', 'Acceso completo trimestral con descuento', 'quarterly', 22500, 'eur', true, true, '["Tests ilimitados", "Tutor IA 24/7", "Clases en directo", "Material actualizado", "Simulacros de examen", "Planificador personalizado"]', 14);

-- ============================================
-- TOPICS FOR XUNTA A1
-- ============================================
INSERT INTO topics (id, organization_id, opposition_id, title, description, sort_order) VALUES
  ('e0000000-0000-0000-0000-000000000001', 'c0000000-0000-0000-0000-000000000001', 'b0000000-0000-0000-0000-000000000001', 'La Constitución Española', 'Estructura, principios y derechos fundamentales de la CE 1978', 1),
  ('e0000000-0000-0000-0000-000000000002', 'c0000000-0000-0000-0000-000000000001', 'b0000000-0000-0000-0000-000000000001', 'La Corona', 'Funciones del Rey, sucesión, refrendo y Casa Real', 2),
  ('e0000000-0000-0000-0000-000000000003', 'c0000000-0000-0000-0000-000000000001', 'b0000000-0000-0000-0000-000000000001', 'El Gobierno y la Administración', 'Composición, funciones y responsabilidad del Gobierno', 3),
  ('e0000000-0000-0000-0000-000000000004', 'c0000000-0000-0000-0000-000000000001', 'b0000000-0000-0000-0000-000000000001', 'El Estatuto de Autonomía de Galicia', 'Instituciones, competencias y organización territorial', 4),
  ('e0000000-0000-0000-0000-000000000005', 'c0000000-0000-0000-0000-000000000001', 'b0000000-0000-0000-0000-000000000001', 'Administración de las CCAA', 'Organización y funcionamiento de las administraciones autonómicas', 5);

-- ============================================
-- TEST USERS
-- ============================================
-- Test users (create via Supabase Auth dashboard or API):
-- alumno@example.com / test1234 (role: student, org: CIP Formacion)
-- centro@example.com / test1234 (role: center_admin, org: CIP Formacion)
-- profesor@example.com / test1234 (role: teacher, org: CIP Formacion)
-- admin@example.com / test1234 (role: super_admin)
