-- Seed Data: CIP Formación + Full Demo for Staging
-- Run with: supabase db reset (applies migrations + seed)
-- For production Supabase: run this SQL in the SQL Editor

-- ============================================
-- OPPOSITION CATEGORIES
-- ============================================
INSERT INTO opposition_categories (id, name, slug, description, icon) VALUES
  ('a0000000-0000-0000-0000-000000000001', 'Administración General', 'age', 'Oposiciones de la Administración General del Estado', '🏛️'),
  ('a0000000-0000-0000-0000-000000000002', 'Justicia', 'justicia', 'Oposiciones del cuerpo de Justicia', '⚖️'),
  ('a0000000-0000-0000-0000-000000000003', 'Hacienda y Finanzas', 'hacienda', 'Oposiciones de Hacienda del Estado', '💰'),
  ('a0000000-0000-0000-0000-000000000004', 'Comunidades Autónomas', 'ccaa', 'Oposiciones de las Comunidades Autónomas', '🗺️')
ON CONFLICT (id) DO NOTHING;

-- ============================================
-- OPPOSITIONS
-- ============================================
INSERT INTO oppositions (id, category_id, name, slug, description, difficulty_level) VALUES
  ('b0000000-0000-0000-0000-000000000001', 'a0000000-0000-0000-0000-000000000004', 'Cuerpo Superior - Xunta de Galicia (A1)', 'xunta-a1', 'Oposiciones al Cuerpo Superior de la Xunta de Galicia', 5),
  ('b0000000-0000-0000-0000-000000000002', 'a0000000-0000-0000-0000-000000000004', 'Cuerpo de Gestión - Xunta de Galicia (A2)', 'xunta-a2', 'Oposiciones al Cuerpo de Gestión de la Xunta de Galicia', 4),
  ('b0000000-0000-0000-0000-000000000003', 'a0000000-0000-0000-0000-000000000003', 'Técnicos de Hacienda del Estado', 'tecnicos-hacienda', 'Técnicos de Hacienda del Estado', 4),
  ('b0000000-0000-0000-0000-000000000004', 'a0000000-0000-0000-0000-000000000003', 'Inspectores de Hacienda del Estado', 'inspectores-hacienda', 'Inspectores de Hacienda del Estado', 5),
  ('b0000000-0000-0000-0000-000000000005', 'a0000000-0000-0000-0000-000000000001', 'Administración General del Estado (A1)', 'age-a1', 'Cuerpo Superior de Administradores Civiles del Estado', 5),
  ('b0000000-0000-0000-0000-000000000006', 'a0000000-0000-0000-0000-000000000002', 'Auxilio Judicial', 'justicia-auxilio', 'Cuerpo de Auxilio Judicial', 3)
ON CONFLICT (id) DO NOTHING;

-- ============================================
-- CIP FORMACIÓN (Organization)
-- ============================================
INSERT INTO organizations (id, name, slug, logo_url, description, status, commission_rate, website, email, phone) VALUES
  ('c0000000-0000-0000-0000-000000000001', 'CIP Formación', 'cip-formacion', NULL, 'Centro de Iniciativas Profesionales. Referente en formación para oposiciones con más de 35 años de experiencia en Galicia.', 'active', 20.00, 'https://cipformacion.com', 'info@cipformacion.com', '+34 981 123 456')
ON CONFLICT (id) DO UPDATE SET status = 'active';

-- ============================================
-- LINK CIP WITH ALL 6 OPPOSITIONS
-- ============================================
INSERT INTO organization_oppositions (organization_id, opposition_id) VALUES
  ('c0000000-0000-0000-0000-000000000001', 'b0000000-0000-0000-0000-000000000001'),
  ('c0000000-0000-0000-0000-000000000001', 'b0000000-0000-0000-0000-000000000002'),
  ('c0000000-0000-0000-0000-000000000001', 'b0000000-0000-0000-0000-000000000003'),
  ('c0000000-0000-0000-0000-000000000001', 'b0000000-0000-0000-0000-000000000004'),
  ('c0000000-0000-0000-0000-000000000001', 'b0000000-0000-0000-0000-000000000005'),
  ('c0000000-0000-0000-0000-000000000001', 'b0000000-0000-0000-0000-000000000006')
ON CONFLICT DO NOTHING;

-- ============================================
-- PLANS FOR CIP FORMACIÓN
-- ============================================
INSERT INTO plans (id, organization_id, opposition_id, name, description, type, price_cents, currency, includes_ai, is_active, features, trial_days) VALUES
  ('d0000000-0000-0000-0000-000000000001', 'c0000000-0000-0000-0000-000000000001', 'b0000000-0000-0000-0000-000000000001', 'Plan Mensual Xunta A1', 'Acceso completo mensual a la preparación de Xunta A1', 'monthly', 8900, 'eur', true, true, '["Tests ilimitados", "Tutor IA 24/7", "Clases en directo", "Material actualizado", "Simulacros de examen"]', 7),
  ('d0000000-0000-0000-0000-000000000002', 'c0000000-0000-0000-0000-000000000001', 'b0000000-0000-0000-0000-000000000001', 'Plan Trimestral Xunta A1', 'Acceso completo trimestral con descuento', 'quarterly', 22500, 'eur', true, true, '["Tests ilimitados", "Tutor IA 24/7", "Clases en directo", "Material actualizado", "Simulacros de examen", "Planificador personalizado"]', 14),
  ('d0000000-0000-0000-0000-000000000003', 'c0000000-0000-0000-0000-000000000001', 'b0000000-0000-0000-0000-000000000002', 'Plan Mensual Xunta A2', 'Preparación mensual Cuerpo de Gestión', 'monthly', 7900, 'eur', true, true, '["Tests ilimitados", "Tutor IA 24/7", "Clases en directo", "Material actualizado"]', 7),
  ('d0000000-0000-0000-0000-000000000004', 'c0000000-0000-0000-0000-000000000001', 'b0000000-0000-0000-0000-000000000006', 'Plan Mensual Auxilio Judicial', 'Preparación mensual Auxilio Judicial', 'monthly', 5900, 'eur', true, true, '["Tests ilimitados", "Tutor IA 24/7", "Material actualizado"]', 7),
  ('d0000000-0000-0000-0000-000000000005', 'c0000000-0000-0000-0000-000000000001', 'b0000000-0000-0000-0000-000000000001', 'Plan Anual Xunta A1', 'El plan más completo con máximo ahorro', 'annual', 79900, 'eur', true, true, '["Tests ilimitados", "Tutor IA 24/7", "Clases en directo", "Material actualizado", "Simulacros de examen", "Planificador personalizado", "Revisión por preparador", "Acceso prioritario"]', 30)
ON CONFLICT (id) DO NOTHING;

-- ============================================
-- TOPICS FOR XUNTA A1 (expanded)
-- ============================================
INSERT INTO topics (id, organization_id, opposition_id, title, description, sort_order) VALUES
  ('e0000000-0000-0000-0000-000000000001', 'c0000000-0000-0000-0000-000000000001', 'b0000000-0000-0000-0000-000000000001', 'La Constitución Española de 1978', 'Estructura, principios fundamentales, derechos y libertades, garantías constitucionales', 1),
  ('e0000000-0000-0000-0000-000000000002', 'c0000000-0000-0000-0000-000000000001', 'b0000000-0000-0000-0000-000000000001', 'La Corona', 'Funciones del Rey, sucesión, refrendo y Casa Real', 2),
  ('e0000000-0000-0000-0000-000000000003', 'c0000000-0000-0000-0000-000000000001', 'b0000000-0000-0000-0000-000000000001', 'El Gobierno y la Administración', 'Composición, funciones y responsabilidad del Gobierno. Administración General del Estado', 3),
  ('e0000000-0000-0000-0000-000000000004', 'c0000000-0000-0000-0000-000000000001', 'b0000000-0000-0000-0000-000000000001', 'El Estatuto de Autonomía de Galicia', 'Instituciones, competencias y organización territorial de la comunidad gallega', 4),
  ('e0000000-0000-0000-0000-000000000005', 'c0000000-0000-0000-0000-000000000001', 'b0000000-0000-0000-0000-000000000001', 'La Xunta de Galicia', 'Estructura organizativa, consejerías y funcionamiento de la Xunta', 5),
  ('e0000000-0000-0000-0000-000000000006', 'c0000000-0000-0000-0000-000000000001', 'b0000000-0000-0000-0000-000000000001', 'Derecho Administrativo General', 'Procedimiento administrativo común, actos administrativos, recursos', 6),
  ('e0000000-0000-0000-0000-000000000007', 'c0000000-0000-0000-0000-000000000001', 'b0000000-0000-0000-0000-000000000001', 'Función Pública', 'Clases de personal, derechos y deberes, régimen disciplinario', 7),
  ('e0000000-0000-0000-0000-000000000008', 'c0000000-0000-0000-0000-000000000001', 'b0000000-0000-0000-0000-000000000001', 'Contratación Pública', 'Ley de Contratos del Sector Público, tipos, procedimientos', 8),
  ('e0000000-0000-0000-0000-000000000009', 'c0000000-0000-0000-0000-000000000001', 'b0000000-0000-0000-0000-000000000001', 'Hacienda Pública', 'Presupuestos, gasto público, control financiero', 9),
  ('e0000000-0000-0000-0000-000000000010', 'c0000000-0000-0000-0000-000000000001', 'b0000000-0000-0000-0000-000000000001', 'Unión Europea', 'Instituciones, derecho comunitario, fondos europeos', 10)
ON CONFLICT (id) DO NOTHING;

-- Topics for Xunta A2
INSERT INTO topics (id, organization_id, opposition_id, title, description, sort_order) VALUES
  ('e1000000-0000-0000-0000-000000000001', 'c0000000-0000-0000-0000-000000000001', 'b0000000-0000-0000-0000-000000000002', 'Constitución Española: Principios', 'Principios constitucionales y derechos fundamentales', 1),
  ('e1000000-0000-0000-0000-000000000002', 'c0000000-0000-0000-0000-000000000001', 'b0000000-0000-0000-0000-000000000002', 'Organización del Estado', 'Poderes del Estado y división de competencias', 2),
  ('e1000000-0000-0000-0000-000000000003', 'c0000000-0000-0000-0000-000000000001', 'b0000000-0000-0000-0000-000000000002', 'Estatuto de Autonomía de Galicia', 'Marco jurídico de la autonomía gallega', 3),
  ('e1000000-0000-0000-0000-000000000004', 'c0000000-0000-0000-0000-000000000001', 'b0000000-0000-0000-0000-000000000002', 'Procedimiento Administrativo', 'Ley 39/2015 del Procedimiento Administrativo Común', 4),
  ('e1000000-0000-0000-0000-000000000005', 'c0000000-0000-0000-0000-000000000001', 'b0000000-0000-0000-0000-000000000002', 'Régimen Local', 'Organización municipal y provincial', 5)
ON CONFLICT (id) DO NOTHING;

-- ============================================
-- DEMO QUESTIONS FOR XUNTA A1 (realistic)
-- ============================================
INSERT INTO questions (id, organization_id, opposition_id, topic_id, question_text, options, correct_answer, explanation, difficulty, source) VALUES
-- Tema 1: Constitución Española
('f0000000-0000-0000-0000-000000000001', 'c0000000-0000-0000-0000-000000000001', 'b0000000-0000-0000-0000-000000000001', 'e0000000-0000-0000-0000-000000000001',
 '¿En qué fecha fue ratificada la Constitución Española por referéndum?',
 '[{"key":"a","text":"29 de diciembre de 1978"},{"key":"b","text":"6 de diciembre de 1978"},{"key":"c","text":"27 de diciembre de 1978"},{"key":"d","text":"31 de octubre de 1978"}]',
 'b', 'La Constitución Española fue ratificada por el pueblo español en referéndum el 6 de diciembre de 1978 y sancionada por el Rey el 27 de diciembre de 1978.', 2, 'manual'),

('f0000000-0000-0000-0000-000000000002', 'c0000000-0000-0000-0000-000000000001', 'b0000000-0000-0000-0000-000000000001', 'e0000000-0000-0000-0000-000000000001',
 '¿Cuántos títulos tiene la Constitución Española de 1978?',
 '[{"key":"a","text":"10 títulos"},{"key":"b","text":"11 títulos, incluido el Título Preliminar"},{"key":"c","text":"9 títulos"},{"key":"d","text":"12 títulos"}]',
 'b', 'La CE de 1978 consta de un Preámbulo, un Título Preliminar y 10 títulos numerados (I a X), lo que hace 11 títulos en total si se incluye el Preliminar.', 2, 'manual'),

('f0000000-0000-0000-0000-000000000003', 'c0000000-0000-0000-0000-000000000001', 'b0000000-0000-0000-0000-000000000001', 'e0000000-0000-0000-0000-000000000001',
 'Según el artículo 1.1 de la CE, España se constituye en un Estado social y democrático de Derecho que propugna como valores superiores:',
 '[{"key":"a","text":"La libertad, la justicia, la igualdad y la solidaridad"},{"key":"b","text":"La libertad, la justicia, la igualdad y el pluralismo político"},{"key":"c","text":"La libertad, la democracia, la igualdad y el pluralismo político"},{"key":"d","text":"La libertad, la justicia, la seguridad jurídica y el pluralismo político"}]',
 'b', 'El art. 1.1 CE establece textualmente: «España se constituye en un Estado social y democrático de Derecho, que propugna como valores superiores de su ordenamiento jurídico la libertad, la justicia, la igualdad y el pluralismo político».', 3, 'manual'),

('f0000000-0000-0000-0000-000000000004', 'c0000000-0000-0000-0000-000000000001', 'b0000000-0000-0000-0000-000000000001', 'e0000000-0000-0000-0000-000000000001',
 '¿Qué artículo de la CE reconoce el derecho a la educación?',
 '[{"key":"a","text":"Artículo 25"},{"key":"b","text":"Artículo 27"},{"key":"c","text":"Artículo 28"},{"key":"d","text":"Artículo 26"}]',
 'b', 'El artículo 27 CE reconoce el derecho a la educación y la libertad de enseñanza. Se encuentra en la Sección 1ª del Capítulo II del Título I.', 2, 'manual'),

('f0000000-0000-0000-0000-000000000005', 'c0000000-0000-0000-0000-000000000001', 'b0000000-0000-0000-0000-000000000001', 'e0000000-0000-0000-0000-000000000001',
 'La reforma agravada de la Constitución (art. 168) requiere:',
 '[{"key":"a","text":"Mayoría de 2/3 de cada Cámara y referéndum"},{"key":"b","text":"Mayoría de 3/5 de cada Cámara y referéndum facultativo"},{"key":"c","text":"Aprobación por 2/3 de cada Cámara, disolución, ratificación por 2/3 de las nuevas Cámaras y referéndum"},{"key":"d","text":"Aprobación por mayoría absoluta del Congreso y referéndum obligatorio"}]',
 'c', 'La reforma agravada (art. 168 CE) exige: 1) Aprobación del principio por 2/3 de cada Cámara; 2) Disolución inmediata de las Cortes; 3) Ratificación por las nuevas Cámaras por mayoría de 2/3; 4) Referéndum obligatorio.', 4, 'manual'),

-- Tema 2: La Corona
('f0000000-0000-0000-0000-000000000006', 'c0000000-0000-0000-0000-000000000001', 'b0000000-0000-0000-0000-000000000001', 'e0000000-0000-0000-0000-000000000002',
 '¿Quién refrenda los actos del Rey según la CE?',
 '[{"key":"a","text":"El Presidente del Gobierno exclusivamente"},{"key":"b","text":"El Presidente del Gobierno, los Ministros y el Presidente del Congreso en su caso"},{"key":"c","text":"El Presidente del Gobierno y el Presidente del Tribunal Constitucional"},{"key":"d","text":"El Presidente de las Cortes Generales"}]',
 'b', 'Según el art. 64 CE, los actos del Rey serán refrendados por el Presidente del Gobierno y, en su caso, por los Ministros competentes. La propuesta y nombramiento del Presidente del Gobierno serán refrendados por el Presidente del Congreso.', 3, 'manual'),

('f0000000-0000-0000-0000-000000000007', 'c0000000-0000-0000-0000-000000000001', 'b0000000-0000-0000-0000-000000000001', 'e0000000-0000-0000-0000-000000000002',
 'En materia de sucesión a la Corona (art. 57 CE), ¿qué criterio se aplica?',
 '[{"key":"a","text":"Primogenitura absoluta sin distinción de sexo"},{"key":"b","text":"Primogenitura con preferencia del varón en el mismo grado"},{"key":"c","text":"Elección por las Cortes Generales"},{"key":"d","text":"Designación por el Rey reinante"}]',
 'b', 'El art. 57.1 CE establece el orden de sucesión según «el orden regular de primogenitura y representación, siendo preferida siempre la línea anterior a las posteriores; en la misma línea, el grado más próximo al más remoto; en el mismo grado, el varón a la mujer, y en el mismo sexo, la persona de más edad a la de menos».', 3, 'manual'),

-- Tema 3: Gobierno y Administración
('f0000000-0000-0000-0000-000000000008', 'c0000000-0000-0000-0000-000000000001', 'b0000000-0000-0000-0000-000000000001', 'e0000000-0000-0000-0000-000000000003',
 '¿Qué órgano del Estado dirige la política interior y exterior, la Administración civil y militar y la defensa del Estado?',
 '[{"key":"a","text":"Las Cortes Generales"},{"key":"b","text":"El Rey"},{"key":"c","text":"El Gobierno"},{"key":"d","text":"El Tribunal Constitucional"}]',
 'c', 'Según el art. 97 CE: «El Gobierno dirige la política interior y exterior, la Administración civil y militar y la defensa del Estado. Ejerce la función ejecutiva y la potestad reglamentaria de acuerdo con la Constitución y las leyes».', 2, 'manual'),

('f0000000-0000-0000-0000-000000000009', 'c0000000-0000-0000-0000-000000000001', 'b0000000-0000-0000-0000-000000000001', 'e0000000-0000-0000-0000-000000000003',
 'La moción de censura regulada en el artículo 113 CE debe ser:',
 '[{"key":"a","text":"Presentada por al menos 1/10 de los Diputados"},{"key":"b","text":"Presentada por la mayoría absoluta del Congreso"},{"key":"c","text":"Constructiva, incluyendo un candidato alternativo a la Presidencia del Gobierno"},{"key":"d","text":"Aprobada por mayoría simple del Congreso"}]',
 'c', 'La moción de censura del art. 113 CE es constructiva: debe incluir un candidato alternativo a la Presidencia del Gobierno. Debe ser propuesta por al menos 1/10 de los Diputados y aprobada por mayoría absoluta.', 3, 'manual'),

-- Tema 4: Estatuto de Galicia
('f0000000-0000-0000-0000-000000000010', 'c0000000-0000-0000-0000-000000000001', 'b0000000-0000-0000-0000-000000000001', 'e0000000-0000-0000-0000-000000000004',
 '¿En qué año se aprobó el Estatuto de Autonomía de Galicia?',
 '[{"key":"a","text":"1979"},{"key":"b","text":"1980"},{"key":"c","text":"1981"},{"key":"d","text":"1982"}]',
 'c', 'El Estatuto de Autonomía de Galicia fue aprobado por Ley Orgánica 1/1981, de 6 de abril.', 2, 'manual'),

('f0000000-0000-0000-0000-000000000011', 'c0000000-0000-0000-0000-000000000001', 'b0000000-0000-0000-0000-000000000001', 'e0000000-0000-0000-0000-000000000004',
 'El Parlamento de Galicia está formado por:',
 '[{"key":"a","text":"Un número fijo de 75 diputados"},{"key":"b","text":"Un mínimo de 60 y un máximo de 80 diputados"},{"key":"c","text":"Un número variable según la población"},{"key":"d","text":"Un mínimo de 50 y un máximo de 75 diputados"}]',
 'a', 'El Parlamento de Galicia se compone de 75 diputados, elegidos por sufragio universal, libre, igual, directo y secreto.', 2, 'manual'),

('f0000000-0000-0000-0000-000000000012', 'c0000000-0000-0000-0000-000000000001', 'b0000000-0000-0000-0000-000000000001', 'e0000000-0000-0000-0000-000000000004',
 '¿Cuáles son las instituciones de la Comunidad Autónoma de Galicia?',
 '[{"key":"a","text":"El Parlamento, la Xunta y su Presidente"},{"key":"b","text":"El Parlamento y la Xunta"},{"key":"c","text":"El Parlamento, la Xunta, su Presidente y el Valedor do Pobo"},{"key":"d","text":"El Parlamento, el Gobierno y el Tribunal Superior de Justicia"}]',
 'a', 'Según el art. 9 del Estatuto de Autonomía de Galicia, las instituciones de la Comunidad Autónoma son: el Parlamento, la Xunta y su Presidente.', 3, 'manual'),

-- Tema 6: Derecho Administrativo
('f0000000-0000-0000-0000-000000000013', 'c0000000-0000-0000-0000-000000000001', 'b0000000-0000-0000-0000-000000000001', 'e0000000-0000-0000-0000-000000000006',
 'El plazo máximo para resolver un procedimiento administrativo, cuando no esté fijado por la norma reguladora, es de:',
 '[{"key":"a","text":"6 meses"},{"key":"b","text":"3 meses"},{"key":"c","text":"1 mes"},{"key":"d","text":"2 meses"}]',
 'b', 'Según el art. 21.3 de la Ley 39/2015, cuando las normas reguladoras de los procedimientos no fijen plazo máximo, éste será de tres meses.', 3, 'manual'),

('f0000000-0000-0000-0000-000000000014', 'c0000000-0000-0000-0000-000000000001', 'b0000000-0000-0000-0000-000000000001', 'e0000000-0000-0000-0000-000000000006',
 '¿Cuál de los siguientes NO es un recurso administrativo regulado en la Ley 39/2015?',
 '[{"key":"a","text":"Recurso de alzada"},{"key":"b","text":"Recurso potestativo de reposición"},{"key":"c","text":"Recurso extraordinario de revisión"},{"key":"d","text":"Recurso de súplica"}]',
 'd', 'La Ley 39/2015 regula tres tipos de recursos administrativos: alzada (arts. 121-122), potestativo de reposición (arts. 123-124) y extraordinario de revisión (arts. 125-126). El recurso de súplica no existe en vía administrativa.', 3, 'manual'),

('f0000000-0000-0000-0000-000000000015', 'c0000000-0000-0000-0000-000000000001', 'b0000000-0000-0000-0000-000000000001', 'e0000000-0000-0000-0000-000000000006',
 'Son causas de nulidad de pleno derecho de los actos administrativos (art. 47 Ley 39/2015):',
 '[{"key":"a","text":"Los dictados por órgano incompetente por razón de la materia o del territorio"},{"key":"b","text":"Los que tengan un contenido imposible"},{"key":"c","text":"Los dictados con infracción del procedimiento"},{"key":"d","text":"Los que incurran en cualquier infracción del ordenamiento jurídico"}]',
 'b', 'El art. 47.1.c) de la Ley 39/2015 establece como causa de nulidad de pleno derecho «Los que tengan un contenido imposible». La incompetencia por materia/territorio también lo es (apartado b), pero la opción b es más precisa como respuesta correcta.', 4, 'manual'),

-- Tema 10: Unión Europea
('f0000000-0000-0000-0000-000000000016', 'c0000000-0000-0000-0000-000000000001', 'b0000000-0000-0000-0000-000000000001', 'e0000000-0000-0000-0000-000000000010',
 '¿Cuál es la institución de la UE que representa a los ciudadanos y es colegisladora?',
 '[{"key":"a","text":"El Consejo de la UE"},{"key":"b","text":"La Comisión Europea"},{"key":"c","text":"El Parlamento Europeo"},{"key":"d","text":"El Consejo Europeo"}]',
 'c', 'El Parlamento Europeo representa directamente a los ciudadanos de la UE. Es elegido por sufragio universal directo y actúa como colegislador junto con el Consejo de la UE.', 2, 'manual'),

('f0000000-0000-0000-0000-000000000017', 'c0000000-0000-0000-0000-000000000001', 'b0000000-0000-0000-0000-000000000001', 'e0000000-0000-0000-0000-000000000010',
 '¿Qué tratado de la UE estableció la ciudadanía europea?',
 '[{"key":"a","text":"Tratado de Roma (1957)"},{"key":"b","text":"Acta Única Europea (1986)"},{"key":"c","text":"Tratado de Maastricht (1992)"},{"key":"d","text":"Tratado de Lisboa (2007)"}]',
 'c', 'El Tratado de Maastricht (Tratado de la Unión Europea), firmado en 1992, introdujo la ciudadanía europea.', 3, 'manual'),

-- Extra questions for variety
('f0000000-0000-0000-0000-000000000018', 'c0000000-0000-0000-0000-000000000001', 'b0000000-0000-0000-0000-000000000001', 'e0000000-0000-0000-0000-000000000007',
 'Los funcionarios de carrera se clasifican en:',
 '[{"key":"a","text":"Grupos A, B, C y D"},{"key":"b","text":"Grupos A1, A2, B, C1 y C2"},{"key":"c","text":"Grupos A, B y C"},{"key":"d","text":"Categorías 1ª, 2ª, 3ª y 4ª"}]',
 'b', 'Según el art. 76 del TREBEP, los cuerpos y escalas de funcionarios se clasifican en los grupos A (subgrupos A1 y A2), B y C (subgrupos C1 y C2).', 2, 'manual'),

('f0000000-0000-0000-0000-000000000019', 'c0000000-0000-0000-0000-000000000001', 'b0000000-0000-0000-0000-000000000001', 'e0000000-0000-0000-0000-000000000008',
 'En la contratación pública, el procedimiento abierto se caracteriza por:',
 '[{"key":"a","text":"Solo pueden presentar ofertas los empresarios invitados"},{"key":"b","text":"Todo empresario interesado puede presentar una proposición"},{"key":"c","text":"Se negocia con al menos tres candidatos"},{"key":"d","text":"Se desarrolla en dos fases: selección y adjudicación"}]',
 'b', 'En el procedimiento abierto (art. 156 LCSP), todo empresario interesado podrá presentar una proposición, quedando excluida toda negociación de los términos del contrato con los licitadores.', 2, 'manual'),

('f0000000-0000-0000-0000-000000000020', 'c0000000-0000-0000-0000-000000000001', 'b0000000-0000-0000-0000-000000000001', 'e0000000-0000-0000-0000-000000000009',
 '¿Cuál es el principio presupuestario según el cual los créditos para gastos se destinarán exclusivamente a la finalidad para la que hayan sido autorizados?',
 '[{"key":"a","text":"Principio de unidad"},{"key":"b","text":"Principio de universalidad"},{"key":"c","text":"Principio de especialidad"},{"key":"d","text":"Principio de anualidad"}]',
 'c', 'El principio de especialidad presupuestaria implica que los créditos se destinarán exclusivamente a la finalidad específica para la que fueron autorizados (especialidad cualitativa, cuantitativa y temporal).', 3, 'manual')
ON CONFLICT (id) DO NOTHING;

-- ============================================
-- DEMO RESOURCES
-- ============================================
INSERT INTO resources (id, organization_id, opposition_id, topic_id, title, description, type, is_public, sort_order) VALUES
  ('f1000000-0000-0000-0000-000000000001', 'c0000000-0000-0000-0000-000000000001', 'b0000000-0000-0000-0000-000000000001', 'e0000000-0000-0000-0000-000000000001', 'Esquema Constitución Española', 'Esquema resumen de la estructura y contenido de la CE 1978', 'pdf', false, 1),
  ('f1000000-0000-0000-0000-000000000002', 'c0000000-0000-0000-0000-000000000001', 'b0000000-0000-0000-0000-000000000001', 'e0000000-0000-0000-0000-000000000001', 'Vídeo: Derechos Fundamentales', 'Clase grabada sobre derechos fundamentales y libertades públicas', 'video', false, 2),
  ('f1000000-0000-0000-0000-000000000003', 'c0000000-0000-0000-0000-000000000001', 'b0000000-0000-0000-0000-000000000001', 'e0000000-0000-0000-0000-000000000004', 'Estatuto de Autonomía - Texto Consolidado', 'Texto completo del Estatuto de Autonomía de Galicia con anotaciones', 'document', false, 1),
  ('f1000000-0000-0000-0000-000000000004', 'c0000000-0000-0000-0000-000000000001', 'b0000000-0000-0000-0000-000000000001', 'e0000000-0000-0000-0000-000000000006', 'Ley 39/2015 - Esquema Procedimiento', 'Esquema del procedimiento administrativo común paso a paso', 'pdf', false, 1),
  ('f1000000-0000-0000-0000-000000000005', 'c0000000-0000-0000-0000-000000000001', 'b0000000-0000-0000-0000-000000000001', 'e0000000-0000-0000-0000-000000000010', 'Instituciones UE - Infografía', 'Infografía interactiva de las instituciones de la Unión Europea', 'link', true, 1)
ON CONFLICT (id) DO NOTHING;

-- ============================================
-- DEMO CLASSES (upcoming and past)
-- ============================================
INSERT INTO classes (id, organization_id, opposition_id, topic_id, title, description, type, starts_at, ends_at, status, max_attendees) VALUES
  ('f2000000-0000-0000-0000-000000000001', 'c0000000-0000-0000-0000-000000000001', 'b0000000-0000-0000-0000-000000000001', 'e0000000-0000-0000-0000-000000000001', 'Clase: Constitución Española - Título Preliminar', 'Análisis detallado del Título Preliminar de la CE', 'live', '2026-02-20 17:00:00+01', '2026-02-20 19:00:00+01', 'scheduled', 30),
  ('f2000000-0000-0000-0000-000000000002', 'c0000000-0000-0000-0000-000000000001', 'b0000000-0000-0000-0000-000000000001', 'e0000000-0000-0000-0000-000000000004', 'Clase: Estatuto de Galicia - Competencias', 'Repaso de competencias exclusivas y compartidas', 'live', '2026-02-22 10:00:00+01', '2026-02-22 12:00:00+01', 'scheduled', 30),
  ('f2000000-0000-0000-0000-000000000003', 'c0000000-0000-0000-0000-000000000001', 'b0000000-0000-0000-0000-000000000001', 'e0000000-0000-0000-0000-000000000006', 'Simulacro: Derecho Administrativo', 'Simulacro de examen tipo test - 50 preguntas', 'live', '2026-02-25 16:00:00+01', '2026-02-25 18:00:00+01', 'scheduled', 50),
  ('f2000000-0000-0000-0000-000000000004', 'c0000000-0000-0000-0000-000000000001', 'b0000000-0000-0000-0000-000000000001', 'e0000000-0000-0000-0000-000000000002', 'Clase grabada: La Corona', 'Grabación de la clase sobre el Título II de la CE', 'recorded', '2026-02-10 17:00:00+01', '2026-02-10 19:00:00+01', 'completed', NULL),
  ('f2000000-0000-0000-0000-000000000005', 'c0000000-0000-0000-0000-000000000001', 'b0000000-0000-0000-0000-000000000001', 'e0000000-0000-0000-0000-000000000003', 'Clase grabada: Gobierno y Administración', 'Grabación del tema 3 con casos prácticos', 'recorded', '2026-02-12 17:00:00+01', '2026-02-12 19:00:00+01', 'completed', NULL)
ON CONFLICT (id) DO NOTHING;

-- ============================================
-- TEST USERS SETUP INSTRUCTIONS
-- ============================================
-- Create these users via Supabase Auth Dashboard or supabase.auth.admin.createUser():
--
-- 1. SUPER ADMIN:
--    Email: admin@opositaplus.com | Password: Demo2026!
--    Then: INSERT INTO user_profiles (id, full_name, is_super_admin, role) VALUES ('<user_id>', 'Admin OpositaPlus', true, 'super_admin');
--
-- 2. CENTRO ADMIN (CIP Formación):
--    Email: centro@cipformacion.com | Password: Demo2026!
--    Then: INSERT INTO user_profiles (id, full_name, role) VALUES ('<user_id>', 'María García López', false, 'centro_admin');
--          INSERT INTO organization_members (organization_id, user_id, role, status) VALUES ('c0000000-0000-0000-0000-000000000001', '<user_id>', 'center_admin', 'active');
--
-- 3. PROFESOR:
--    Email: profesor@cipformacion.com | Password: Demo2026!
--    Then: INSERT INTO user_profiles (id, full_name, role) VALUES ('<user_id>', 'Carlos Rodríguez Fernández', false, 'profesor');
--          INSERT INTO organization_members (organization_id, user_id, role, status) VALUES ('c0000000-0000-0000-0000-000000000001', '<user_id>', 'teacher', 'active');
--
-- 4. ALUMNO:
--    Email: alumno@cipformacion.com | Password: Demo2026!
--    Then: INSERT INTO user_profiles (id, full_name, role) VALUES ('<user_id>', 'Laura Pérez Sánchez', false, 'alumno');
--          INSERT INTO organization_members (organization_id, user_id, role, status) VALUES ('c0000000-0000-0000-0000-000000000001', '<user_id>', 'student', 'active');
--
-- 5. TEST USER (all-access demo):
--    Email: test@opositaplus.com | Password: Demo2026!
--    Then: INSERT INTO user_profiles (id, full_name, is_super_admin, role) VALUES ('<user_id>', 'Test User', true, 'super_admin');

-- ============================================
-- SEED SCRIPT FOR AUTH USERS (run via setup script)
-- ============================================
-- See scripts/setup-staging-users.ts for automated user creation
