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

export const centros: Centro[] = [
  {
    slug: 'cip',
    name: 'CIP Formacion',
    fullName: 'Centro de Iniciativas Profesionales',
    founded: 1989,
    description:
      'Centro lider en Galicia con mas de 35 anos de experiencia en preparacion de oposiciones y programas juridico-fiscales. Su metodologia combina exigencia tecnica, seguimiento individual y simulacion de examen real.',
    specialties: ['Oposiciones A1/A2', 'Hacienda', 'Masteres juridico-fiscales'],
    location: 'Vigo, Galicia',
    certifications: ['ISO 9001', 'ISO 14001', 'ISO 27001'],
    oposiciones: [
      'xunta-a1',
      'xunta-a2',
      'tecnicos-hacienda',
      'inspectores-hacienda',
      'age-a1',
      'justicia-auxilio',
    ],
  },
];

export function getCentroBySlug(slug: string) {
  return centros.find((centro) => centro.slug === slug);
}
