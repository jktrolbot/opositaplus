# PostHog Setup - Oposita+

## 📦 Instalación completada

✅ **Paquete instalado**: `posthog-js`  
✅ **Provider creado**: `lib/posthog-provider.tsx`  
✅ **Utilidades de tracking**: `lib/analytics.ts`  
✅ **Integrado en**: `app/layout.tsx`

---

## 🎯 Eventos rastreados

### 1. **user_signup**
- **Dónde**: `lib/auth-context.tsx` (función `signUp`)
- **Propiedades**:
  - `user_id`: ID del usuario
  - `email`: Email del usuario
  - `provider`: Tipo de autenticación (email, google, etc.)
  - `signup_date`: Fecha de registro

### 2. **test_started**
- **Dónde**: `app/oposiciones/[slug]/test/page.tsx` (función `startTest`)
- **Propiedades**:
  - `user_id`: ID del usuario
  - `test_id`: Identificador único del test
  - `test_type`: Tipo de test (practice, exam, custom)
  - `subject`: Tema del test

### 3. **test_completed**
- **Dónde**: `app/oposiciones/[slug]/test/page.tsx` (función `completeTest`)
- **Propiedades**:
  - `user_id`: ID del usuario
  - `test_id`: Identificador del test
  - `test_type`: Tipo de test
  - `subject`: Tema
  - `score`: Aciertos
  - `total_questions`: Total de preguntas
  - `time_spent_seconds`: Tiempo empleado
  - `pass_rate`: Porcentaje de acierto

### 4. **tutor_interaction**
- **Dónde**: `app/oposiciones/[slug]/tutor/page.tsx` (función `handleSend`)
- **Propiedades**:
  - `user_id`: ID del usuario
  - `interaction_type`: question | explanation | hint
  - `topic`: Tema de la oposición

### 5. **activation_milestone**
- **Dónde**: Múltiples lugares
- **Milestones**:
  - `first_test`: Primer test completado
  - `first_tutor_use`: Primera interacción con el tutor
  - `first_week`: Primera semana de estudio (implementar)
  - `first_plan_created`: Primer plan creado (implementar)
  - `first_study_session`: Primera sesión de estudio (implementar)

---

## 🔧 Variables de entorno

Configuradas en **Vercel**:
- `NEXT_PUBLIC_POSTHOG_KEY`: Tu API key de PostHog
- `NEXT_PUBLIC_POSTHOG_HOST`: URL del host (ej: `https://eu.posthog.com`)

---

## 📊 Dashboard PostHog - Instrucciones

### Paso 1: Crear Dashboard
1. Ir a **PostHog** → **Dashboards** → **New Dashboard**
2. Nombre: "Oposita+ - Growth & Retention"

### Paso 2: Insights/Funnels a crear

#### **Funnel 1: Signup → Activation**
- **Eventos**:
  1. `user_signup`
  2. `activation_milestone` (milestone = 'first_test')
  3. `activation_milestone` (milestone = 'first_tutor_use')

**Objetivo**: Medir cuántos usuarios completan su primer test y usan el tutor después del registro.

---

#### **Funnel 2: Test Engagement**
- **Eventos**:
  1. `test_started`
  2. `test_completed`

**Filtros**: 
- `test_type` = 'practice'

**Objetivo**: Tasa de completitud de tests.

---

#### **Insight 3: Weekly Active Users (WAU)**
- **Tipo**: Trends
- **Evento**: `test_completed` o `tutor_interaction`
- **Agrupación**: Weekly Unique Users

**Objetivo**: Usuarios activos por semana.

---

#### **Insight 4: Test Performance**
- **Tipo**: Trends
- **Evento**: `test_completed`
- **Property**: `pass_rate` (promedio)
- **Agrupación**: Por `subject`

**Objetivo**: Ver qué temas tienen mejor rendimiento.

---

#### **Insight 5: Retention Cohorts**
- **Tipo**: Retention
- **Evento inicial**: `user_signup`
- **Evento de retorno**: `test_completed` o `tutor_interaction`
- **Periodo**: Weekly

**Objetivo**: Retención semanal de usuarios.

---

#### **Insight 6: Time to First Test**
- **Tipo**: Trends
- **Evento**: `activation_milestone` (milestone = 'first_test')
- **Property**: Tiempo desde `signup_date` hasta evento

**Objetivo**: Cuánto tardan los usuarios en hacer su primer test.

---

#### **Insight 7: Tutor Interaction Rate**
- **Tipo**: Trends
- **Evento**: `tutor_interaction`
- **Breakdown**: Por `interaction_type`

**Objetivo**: Qué tipo de interacciones son más comunes.

---

### Paso 3: Crear Acciones (opcional)

#### Acción: "Power User"
- Usuario que ha completado:
  - ≥5 tests (`test_completed`)
  - ≥3 interacciones con tutor (`tutor_interaction`)
  - En los últimos 7 días

#### Acción: "At Risk User"
- Usuario que:
  - Hizo signup hace >7 días
  - NO ha completado `first_test` milestone

---

## 🚀 Próximos pasos

### Eventos adicionales a implementar:
1. **study_session_started**: Cuando un usuario inicia una sesión de estudio
2. **plan_created**: Cuando crea un plan de estudio
3. **first_week_completed**: Al completar una semana de estudio
4. **payment_completed**: Al suscribirse (integrar con Stripe)
5. **content_uploaded**: Cuando un centro sube contenido

### Feature Flags sugeridas:
- `tutor_ai_suggestions`: Habilitar sugerencias automáticas del tutor
- `gamification_badges`: Sistema de badges/logros
- `study_reminders`: Recordatorios de estudio

---

## 📝 Notas

- **Autocapture**: Está desactivado para evitar ruido. Solo trackeamos eventos explícitos.
- **Session Recording**: Habilitado, pero sin grabar iframes cross-origin.
- **Person Profiles**: Solo se crean para usuarios identificados (después de signup).
- **Reset on Logout**: Se llama `analytics.reset()` al hacer logout para limpiar el estado.

---

## 🔗 Recursos

- [PostHog Docs](https://posthog.com/docs)
- [Funnels Guide](https://posthog.com/docs/user-guides/funnels)
- [Retention Analysis](https://posthog.com/docs/user-guides/retention)
- [Feature Flags](https://posthog.com/docs/feature-flags)
