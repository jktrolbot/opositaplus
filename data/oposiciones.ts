export interface Topic {
  id: string;
  name: string;
  questionCount: number;
}

export interface Centro {
  slug: string;
  name: string;
  fullName: string;
  founded: number;
  description: string;
  location: string;
  certifications: string[];
}

export interface Oposicion {
  slug: string;
  name: string;
  shortName: string;
  category: string;
  categoryIcon: string;
  description: string;
  requirements: string;
  difficulty: "media" | "alta" | "muy alta";
  centro: Centro;
  topics: Topic[];
  totalQuestions: number;
}

export const centros: Centro[] = [{
  slug: "cip-formacion",
  name: "CIP Formación",
  fullName: "Centro de Iniciativas Profesionales",
  founded: 1989,
  description: "Referente en formación para oposiciones con más de 35 años de experiencia. Especialistas en oposiciones de la Administración del Estado, Xunta de Galicia y Hacienda.",
  location: "Vigo, Galicia",
  certifications: ["ISO 9001", "ISO 14001", "ISO 27001"]
}];

export const oposiciones: Oposicion[] = [
  {
    slug: "xunta-a1",
    name: "Cuerpo Superior - Xunta de Galicia (A1)",
    shortName: "Xunta A1",
    category: "Xunta de Galicia",
    categoryIcon: "🏛️",
    description: "Acceso al Cuerpo Superior (Grupo A1) de la Xunta. Funciones de gestión, inspección y asesoramiento.",
    requirements: "Título universitario de Grado. Nacionalidad española o UE.",
    difficulty: "muy alta",
    centro: centros[0],
    topics: [
      { id: "constitucion", name: "Constitución Española", questionCount: 10 },
      { id: "estatuto-galicia", name: "Estatuto de Autonomía de Galicia", questionCount: 8 },
      { id: "ley-39-2015", name: "Ley 39/2015 Procedimiento Administrativo", questionCount: 8 },
      { id: "ley-40-2015", name: "Ley 40/2015 Régimen Jurídico", questionCount: 8 },
      { id: "derecho-admin", name: "Derecho Administrativo", questionCount: 8 },
      { id: "funcion-publica-galicia", name: "Función Pública de Galicia", questionCount: 8 }
    ],
    totalQuestions: 50
  },
  {
    slug: "xunta-a2",
    name: "Cuerpo de Gestión - Xunta de Galicia (A2)",
    shortName: "Xunta A2",
    category: "Xunta de Galicia",
    categoryIcon: "🏛️",
    description: "Acceso al Cuerpo de Gestión (Grupo A2) de la Xunta. Tareas de gestión y apoyo administrativo.",
    requirements: "Título de Grado o Diplomatura. Nacionalidad española o UE.",
    difficulty: "alta",
    centro: centros[0],
    topics: [
      { id: "constitucion", name: "Constitución Española", questionCount: 10 },
      { id: "estatuto-galicia", name: "Estatuto de Autonomía de Galicia", questionCount: 8 },
      { id: "procedimiento-admin", name: "Procedimiento Administrativo", questionCount: 8 },
      { id: "contratos-publicos", name: "Contratos del Sector Público", questionCount: 8 },
      { id: "funcion-publica", name: "Función Pública", questionCount: 8 }
    ],
    totalQuestions: 42
  },
  {
    slug: "tecnicos-hacienda",
    name: "Técnicos de Hacienda del Estado — 3er ejercicio: Derecho Financiero y Tributario",
    shortName: "Técnicos Hacienda",
    category: "Hacienda y Finanzas",
    categoryIcon: "💰",
    description: "3er ejercicio: Derecho Financiero y Tributario Español. 36 temas. Contenido procesado de CIP Formación con Knowledge Base IA.",
    requirements: "Título de Grado o Diplomatura. Nacionalidad española.",
    difficulty: "muy alta",
    centro: centros[0],
    topics: [
      { id: "tema-1", name: "Tema 1 — Constitución y Derecho Presupuestario", questionCount: 218 },
      { id: "tema-2", name: "Tema 2 — Créditos Presupuestarios", questionCount: 10 },
      { id: "tema-4", name: "Tema 4 — Los Tributos", questionCount: 22 },
      { id: "tema-5", name: "Tema 5 — Obligaciones Tributarias", questionCount: 22 },
      { id: "tema-6", name: "Tema 6 — Obligados Tributarios", questionCount: 47 },
      { id: "tema-7", name: "Tema 7 — Deuda Tributaria", questionCount: 30 },
      { id: "tema-8", name: "Tema 8 — Normas Comunes", questionCount: 45 },
      { id: "tema-9", name: "Tema 9 — Procedimientos de Gestión", questionCount: 36 },
      { id: "tema-10", name: "Tema 10 — Recaudación (I)", questionCount: 40 },
      { id: "tema-11", name: "Tema 11 — Recaudación (II)", questionCount: 74 },
      { id: "tema-12", name: "Tema 12 — Inspección (I)", questionCount: 24 },
      { id: "tema-13", name: "Tema 13 — Inspección (II)", questionCount: 84 },
      { id: "tema-14", name: "Tema 14 — Infracciones y Sanciones", questionCount: 34 },
      { id: "tema-16", name: "Tema 16 — Revisión Administrativa", questionCount: 34 },
      { id: "tema-18", name: "Tema 18-19 — IRPF", questionCount: 369 },
      { id: "tema-20", name: "Tema 20 — IRNR (3er Examen)", questionCount: 75 },
      { id: "tema-21", name: "Tema 21 — Impuesto sobre el Patrimonio", questionCount: 39 },
      { id: "tema-22", name: "Tema 22-23 — Impuesto sobre Sociedades", questionCount: 208 },
      { id: "tema-24", name: "Tema 24-26 — IVA", questionCount: 296 },
      { id: "tema-27", name: "Tema 27 — ITP y AJD", questionCount: 252 },
      { id: "tema-28", name: "Tema 28 — ISD", questionCount: 37 },
      { id: "tema-29", name: "Tema 29-31 — Impuestos Especiales", questionCount: 122 },
      { id: "tema-33", name: "Tema 33-36 — Aduanas y Comercio Exterior", questionCount: 206 }
    ],
    totalQuestions: 4926
  },
  {
    slug: "inspectores-hacienda",
    name: "Inspectores de Hacienda del Estado",
    shortName: "Inspectores Hacienda",
    category: "Hacienda y Finanzas",
    categoryIcon: "💰",
    description: "Cuerpo superior de inspección tributaria. Investigación y comprobación de tributos.",
    requirements: "Título de Grado o Licenciatura. Nacionalidad española.",
    difficulty: "muy alta",
    centro: centros[0],
    topics: [
      { id: "derecho-tributario-avanzado", name: "Derecho Tributario Avanzado", questionCount: 8 },
      { id: "irpf-avanzado", name: "IRPF Avanzado", questionCount: 8 },
      { id: "iva-avanzado", name: "IVA Avanzado", questionCount: 8 },
      { id: "derecho-mercantil", name: "Derecho Mercantil", questionCount: 8 }
    ],
    totalQuestions: 32
  },
  {
    slug: "age-a1",
    name: "Administración General del Estado (A1)",
    shortName: "AGE A1",
    category: "Administración General",
    categoryIcon: "📋",
    description: "Cuerpo Superior de Administradores Civiles del Estado. Alta dirección administrativa.",
    requirements: "Título de Grado o Licenciatura. Nacionalidad española o UE.",
    difficulty: "muy alta",
    centro: centros[0],
    topics: [
      { id: "constitucion-avanzada", name: "Constitución y Organización del Estado", questionCount: 10 },
      { id: "derecho-admin-avanzado", name: "Derecho Administrativo Avanzado", questionCount: 8 },
      { id: "ue", name: "Unión Europea", questionCount: 8 },
      { id: "gestion-publica", name: "Gestión Pública", questionCount: 8 }
    ],
    totalQuestions: 34
  },
  {
    slug: "justicia-auxilio",
    name: "Auxilio Judicial",
    shortName: "Auxilio Judicial",
    category: "Justicia",
    categoryIcon: "⚖️",
    description: "Cuerpo de Auxilio Judicial. Apoyo a la actividad de juzgados y tribunales.",
    requirements: "Título de Graduado en ESO. Nacionalidad española o UE.",
    difficulty: "media",
    centro: centros[0],
    topics: [
      { id: "organizacion-judicial", name: "Organización del Poder Judicial", questionCount: 10 },
      { id: "procedimiento-civil", name: "Procedimiento Civil", questionCount: 8 },
      { id: "procedimiento-penal", name: "Procedimiento Penal", questionCount: 8 },
      { id: "derecho-constitucional", name: "Derecho Constitucional", questionCount: 8 }
    ],
    totalQuestions: 34
  }
];

export const categories = [...new Set(oposiciones.map(o => o.category))].map(cat => {
  const ops = oposiciones.filter(o => o.category === cat);
  return { name: cat, icon: ops[0].categoryIcon, count: ops.length, centro: ops[0].centro.name };
});

export function getOposicionBySlug(slug: string) {
  return oposiciones.find(o => o.slug === slug);
}
