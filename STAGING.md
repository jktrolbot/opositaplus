# 🎯 Oposita+ Staging — Demo CIP Formación

## Quick Start

### 1. Deploy staging branch
```bash
git checkout staging
# Deploy to Vercel (staging environment) or run locally
npm install && npm run dev
```

### 2. Seed the database
```bash
# Option A: Via Supabase SQL Editor
# Copy supabase/seed.sql → paste in SQL Editor → Run

# Option B: Via supabase CLI (local)
supabase db reset
```

### 3. Create demo users
```bash
# Set env vars first
export NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
export SUPABASE_SERVICE_ROLE_KEY=eyJ...

npx tsx scripts/setup-staging-users.ts
```

---

## 👥 Demo Accounts

| Rol | Email | Password | Acceso |
|-----|-------|----------|--------|
| **Super Admin** | `admin@opositaplus.com` | `Demo2026!` | Panel admin global (`/admin`) |
| **Centro Admin** | `centro@cipformacion.com` | `Demo2026!` | Panel CIP (`/centro/cip-formacion`) |
| **Profesor** | `profesor@cipformacion.com` | `Demo2026!` | Gestión contenido/clases CIP |
| **Alumno** | `alumno@cipformacion.com` | `Demo2026!` | Dashboard alumno, tests, tutor IA |
| **Test (all-access)** | `test@opositaplus.com` | `Demo2026!` | Super admin + miembro CIP |

---

## 🎬 Flujo de Demo para CIP Formación

### 1. Vista Admin Global (admin@opositaplus.com)
- `/admin` → Dashboard de plataforma
- `/admin/centros` → Ver centros registrados (CIP Formación)
- `/admin/oposiciones` → Catálogo de oposiciones
- `/admin/liquidaciones` → Liquidaciones y comisiones

### 2. Vista Centro Admin (centro@cipformacion.com)
- `/centro/cip-formacion` → Dashboard del centro
- `/centro/cip-formacion/oposiciones` → Oposiciones que imparte CIP
- `/centro/cip-formacion/oposiciones/xunta-a1/contenido` → Gestión de temario
- `/centro/cip-formacion/oposiciones/xunta-a1/preguntas` → Banco de preguntas
- `/centro/cip-formacion/clases` → Programación de clases
- `/centro/cip-formacion/alumnos` → Gestión de alumnos
- `/centro/cip-formacion/profesores` → Equipo docente
- `/centro/cip-formacion/planes` → Planes y precios

### 3. Vista Profesor (profesor@cipformacion.com)
- `/centro/cip-formacion` → Dashboard profesor
- `/centro/cip-formacion/clases` → Sus clases programadas
- `/centro/cip-formacion/contenido` → Subir/gestionar material
- `/centro/cip-formacion/oposiciones/xunta-a1/preguntas` → Crear/validar preguntas

### 4. Vista Alumno (alumno@cipformacion.com)
- `/oposiciones/xunta-a1` → Dashboard de la oposición
- `/oposiciones/xunta-a1/test` → Hacer tests de práctica (20 preguntas demo)
- `/oposiciones/xunta-a1/tutor` → Tutor IA 24/7
- `/oposiciones/xunta-a1/dashboard` → Progreso y estadísticas
- `/oposiciones/xunta-a1/simulacro` → Simulacros de examen
- `/oposiciones/xunta-a1/planner` → Planificador de estudio

---

## 📊 Datos de Demo Incluidos

| Contenido | Cantidad |
|-----------|----------|
| Categorías de oposición | 4 |
| Oposiciones | 6 |
| Temas (Xunta A1) | 10 |
| Temas (Xunta A2) | 5 |
| Preguntas tipo test | 20 (realistas, con explicación) |
| Recursos/materiales | 5 |
| Clases programadas | 3 (futuras) + 2 (grabadas) |
| Planes de precio | 5 |

---

## 🔑 Roles y Permisos

| Permiso | super_admin | centro_admin | profesor | alumno |
|---------|:-----------:|:------------:|:--------:|:------:|
| Panel admin global | ✅ | ❌ | ❌ | ❌ |
| Gestionar centros | ✅ | Solo su centro | ❌ | ❌ |
| Gestionar oposiciones | ✅ | Sus oposiciones | ❌ | ❌ |
| Subir contenido/KB | ✅ | ✅ | ✅ | ❌ |
| Crear/validar preguntas | ✅ | ✅ | ✅ | ❌ |
| Programar clases | ✅ | ✅ | ✅ | ❌ |
| Ver alumnos/progreso | ✅ | ✅ | ✅ | Solo propio |
| Hacer tests | ✅ | ✅ | ✅ | ✅ |
| Tutor IA | ✅ | ✅ | ✅ | ✅ |
| Gestionar planes/precios | ✅ | ✅ | ❌ | ❌ |
| Liquidaciones | ✅ | ✅ (ver) | ❌ | ❌ |

---

## ⚙️ Variables de Entorno Staging

```env
NEXT_PUBLIC_SUPABASE_URL=<staging-supabase-url>
NEXT_PUBLIC_SUPABASE_ANON_KEY=<staging-anon-key>
SUPABASE_SERVICE_ROLE_KEY=<staging-service-role>
NEXT_PUBLIC_SITE_URL=<staging-url>

# Optional for full demo:
OPENAI_API_KEY=<for-tutor-ia>
RESEND_API_KEY=<for-emails>
```

---

## 🚨 Notas Importantes

- **NO usar en producción** — datos de demo, passwords débiles
- Los usuarios se crean via Supabase Auth Admin API (script automatizado)
- El trigger `trg_user_profiles_sync_role` asigna roles automáticamente desde `organization_members`
- Las preguntas son contenido real de oposiciones (Constitución, Estatuto Galicia, Derecho Administrativo)
- Stripe no está configurado en staging — los planes se muestran pero el pago no procesa
