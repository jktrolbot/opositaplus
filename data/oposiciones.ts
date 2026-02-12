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
    name: "Técnicos de Hacienda del Estado",
    shortName: "Técnicos Hacienda",
    category: "Hacienda y Finanzas",
    categoryIcon: "💰",
    description: "Cuerpo técnico en gestión, inspección y recaudación tributaria del Estado.",
    requirements: "Título de Grado o Diplomatura. Nacionalidad española.",
    difficulty: "muy alta",
    centro: centros[0],
    topics: [
      { id: "derecho-tributario", name: "Derecho Financiero y Tributario", questionCount: 10 },
      { id: "irpf", name: "IRPF", questionCount: 8 },
      { id: "iva", name: "IVA", questionCount: 8 },
      { id: "impuesto-sociedades", name: "Impuesto sobre Sociedades", questionCount: 8 },
      { id: "procedimientos-tributarios", name: "Procedimientos Tributarios", questionCount: 8 }
    ],
    totalQuestions: 42
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
