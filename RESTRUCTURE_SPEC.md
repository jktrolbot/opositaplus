# Oposita+ Complete Restructure - Implementation Spec

## CONTEXT
Live Next.js app at ~/Downloads/opositaplus needs complete architectural restructure from flat generic tools to category-based oposición platform validated by expert centers (CIP Formación).

## CRITICAL REQUIREMENTS

### 1. NEW DATA STRUCTURE

Create `data/oposiciones.ts`:
```typescript
export interface Oposicion {
  slug: string;
  name: string;
  category: string;
  categorySlug: string;
  description: string;
  requirements: string;
  centro: {
    name: string;
    slug: string;
    years: number;
    description: string;
  };
  topics: Array<{
    id: string;
    name: string;
    questionCount: number;
  }>;
  totalQuestions: number;
  difficulty: 'media' | 'alta' | 'muy alta';
}

export const oposiciones: Oposicion[] = [
  // 6 oposiciones defined below
];

export const categories = [
  { slug: 'age', name: 'Administración General del Estado', icon: '📋' },
  { slug: 'xunta', name: 'Xunta de Galicia', icon: '🏛️' },
  { slug: 'hacienda', name: 'Hacienda y Finanzas', icon: '💰' },
  { slug: 'justicia', name: 'Justicia', icon: '⚖️' },
  { slug: 'seguridad', name: 'Fuerzas y Cuerpos de Seguridad', icon: '🔒' },
  { slug: 'sanidad', name: 'Sanidad', icon: '🏥' },
];
```

Create `data/centros.ts`:
```typescript
export interface Centro {
  slug: string;
  name: string;
  fullName: string;
  founded: number;
  description: string;
  specialties: string[];
  location: string;
  certifications: string[];
  oposiciones: string[];
}

export const centros: Centro[] = [{
  slug: 'cip',
  name: 'CIP Formación',
  fullName: 'Centro de Iniciativas Profesionales',
  founded: 1989,
  description: 'Centro líder en Galicia con más de 35 años de experiencia en preparación de oposiciones...',
  specialties: ['Oposiciones A1/A2', 'Hacienda', 'Másteres jurídico-fiscales'],
  location: 'Vigo, Galicia',
  certifications: ['ISO 9001', 'ISO 14001', 'ISO 27001'],
  oposiciones: ['xunta-a1', 'xunta-a2', 'tecnicos-hacienda', 'inspectores-hacienda', 'age-a1', 'justicia-auxilio']
}];
```

### 2. SIX OPOSICIONES WITH REALISTIC QUESTIONS

Create `data/questions/` directory with 6 JSON files:

**xunta-a1.json** (80 questions):
- Topics: Constitución Española, Estatuto de Autonomía de Galicia, Ley 39/2015, Ley 40/2015, Derecho Administrativo, Función Pública de Galicia, Hacienda Pública, Unión Europea, Organización de la Xunta
- Questions must reference REAL Spanish law articles
- Mix of easy (30%), medium (50%), hard (20%)

**xunta-a2.json** (60 questions):
- Topics: Constitución, Estatuto Galicia, Procedimiento Administrativo, Contratos Sector Público, Función Pública, Presupuestos

**tecnicos-hacienda.json** (60 questions):
- Topics: Derecho Tributario, IRPF, IVA, Impuesto Sociedades, Procedimientos Tributarios, Contabilidad, Economía

**inspectores-hacienda.json** (50 questions):
- Topics: Similar to Técnicos but deeper + Derecho Mercantil, Economía Financiera

**age-a1.json** (50 questions):
- Topics: Constitución, Organización del Estado, Derecho Administrativo, UE, Gestión Pública

**justicia-auxilio.json** (50 questions):
- Topics: Organización Judicial, Procedimiento Civil, Procedimiento Penal, Derecho Constitucional

**Question format**:
```json
{
  "id": "xunta-a1-001",
  "oposicion": "xunta-a1",
  "topic": "Constitución Española",
  "difficulty": "medium",
  "question": "Según el artículo 103 de la Constitución Española, ¿cuál de los siguientes principios NO rige la Administración Pública?",
  "options": [
    "Eficacia",
    "Jerarquía",
    "Descentralización",
    "Rentabilidad económica"
  ],
  "correct": 3,
  "explanation": "El artículo 103 CE establece que la Administración Pública sirve con objetividad los intereses generales y actúa con eficacia, jerarquía, descentralización, desconcentración y coordinación. La rentabilidad económica no es un principio constitucional de la Administración.",
  "lawReference": "Art. 103 CE"
}
```

### 3. NEW ROUTE STRUCTURE

**Landing** `app/page.tsx`:
- Hero: "Prepárate para tu oposición con las mejores herramientas"
- Grid of 6 category cards (NOT tools)
- "Centros que confían en nosotros" section with CIP badge
- Pricing, FAQ (updated), footer
- **REMOVE** fake stats (12,450 users, 2.1M tests, 87% success, 4.8/5)

**Catalog** `app/oposiciones/page.tsx`:
- Search bar
- Category filter
- Grid of oposición cards showing: name, category, topics count, questions count, difficulty, centro badge

**Oposición detail** `app/oposiciones/[slug]/page.tsx`:
- Header with name, category, centro badge
- Description, requirements
- Temario list with completion %
- Tools grid:
  - 🎯 Tests adaptativos
  - 👨‍🏫 Preparador personal
  - 📅 Planificador de estudio
  - 🔄 Repaso inteligente
  - 📝 Simulacro de examen
  - 📊 Tu progreso

**Tool pages** `app/oposiciones/[slug]/test/page.tsx` (and tutor, planner, review, simulacro, dashboard):
- Same functionality as current BUT scoped to oposición
- Breadcrumb navigation
- Header showing oposición + centro

**Centro page** `app/centros/[slug]/page.tsx`:
- Profile, description, specialties
- List of oposiciones validated
- Badge/seal design

### 4. API UPDATES

**`app/api/generate-test/route.ts`**:
- Accept `oposicion` param
- Load from `data/questions/${oposicion}.json`
- Return only questions for that oposición

**`app/api/tutor/route.ts`**:
- Accept `oposicion` param
- System prompt: "You are an expert tutor for [OPOSICION NAME]. Your knowledge covers: [TOPICS]. Always reference specific articles from Spanish law."

**`app/api/generate-plan/route.ts`**:
- Accept `oposicion` param
- Generate study plan using that oposición's temario

**`app/api/check-answer/route.ts`**:
- No changes needed

### 5. STORAGE SCOPING

Update all localStorage keys from:
- `opositaplus_progress` → `opositaplus_${slug}_progress`
- `opositaplus_history` → `opositaplus_${slug}_history`
- etc.

### 6. REALISTIC QUESTION REQUIREMENTS

CRITICAL: Questions must be professionally written with REAL Spanish law references:
- Use actual article numbers (Art. 14 CE, Art. 39 Ley 39/2015, etc.)
- Correct legal terminology (recurso de alzada, silencio administrativo positivo, etc.)
- 4 plausible options
- Detailed explanations citing the law
- Match real oposición exam format

Examples:
- "Según la Ley 39/2015, el plazo máximo para resolver procedimientos es..."
- "El artículo 103 CE establece que la Administración actúa con los siguientes principios..."
- "En el IRPF, las rentas del trabajo incluyen..."

### 7. BRANDING GUIDELINES

- Professional, institutional tone
- "Validado por CIP Formación" badges prominent
- Mobile-first responsive design
- Clean, utility-focused (tools not AI marketing)
- NO fake testimonials or inflated stats
- Trust signals: ISO certifications, years of experience, real centro info

### 8. IMPLEMENTATION ORDER

1. Create new data structures (oposiciones.ts, centros.ts, questions/*.json)
2. Update landing page (remove stats, add categories)
3. Create oposiciones catalog page
4. Create oposición detail page
5. Update tool pages to accept [slug] param
6. Create centro page
7. Update APIs for scoping
8. Update localStorage usage
9. Test all routes
10. Build + deploy

## SUCCESS CRITERIA

- All 6 oposiciones with 50-80 questions each
- All routes render without errors
- Questions are realistic with real law references
- Professional branding without fake stats
- Mobile responsive
- Build passes (0 TS errors)
- Deployed to production

## TECHNICAL NOTES

- Use Next.js 14+ App Router conventions
- TypeScript strict mode
- Tailwind CSS for styling
- Shadcn/ui components
- Keep existing test/tutor/planner logic, just scope it
- OpenAI API for tutor/planner (env var already set)

MAKE THIS IMPRESSIVE FOR CIP FORMACIÓN.
