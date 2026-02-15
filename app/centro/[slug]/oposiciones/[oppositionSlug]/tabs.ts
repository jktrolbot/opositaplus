import { BarChart3, BookOpenText, ClipboardCheck, FileQuestion, Layers, Users } from 'lucide-react';
import type { ElementType } from 'react';
import { canAccess, type AppRole } from '@/lib/auth/roles';

export type OppositionTabKey =
  | 'contenido'
  | 'preguntas'
  | 'flashcards'
  | 'tests'
  | 'dashboard'
  | 'alumnos';

type OppositionTabDefinition = {
  key: OppositionTabKey;
  label: string;
  description: string;
  icon: ElementType;
  canView: (role: AppRole | null) => boolean;
};

const TAB_DEFINITIONS: OppositionTabDefinition[] = [
  {
    key: 'contenido',
    label: 'Contenido',
    description: 'KB chunks y trazabilidad',
    icon: BookOpenText,
    canView: (role) => canAccess('kb_chunks', 'read', role),
  },
  {
    key: 'preguntas',
    label: 'Preguntas',
    description: 'Banco generado por IA',
    icon: FileQuestion,
    canView: (role) => canAccess('questions', 'read', role),
  },
  {
    key: 'flashcards',
    label: 'Flashcards',
    description: 'Repaso activo',
    icon: Layers,
    canView: (role) => canAccess('flashcards', 'read', role),
  },
  {
    key: 'tests',
    label: 'Tests',
    description: 'Práctica tipo examen',
    icon: ClipboardCheck,
    canView: (role) => canAccess('tests', 'read', role),
  },
  {
    key: 'dashboard',
    label: 'Dashboard',
    description: 'Métricas y progreso',
    icon: BarChart3,
    canView: (role) => canAccess('center', 'manage', role),
  },
  {
    key: 'alumnos',
    label: 'Alumnos',
    description: 'Matriculados',
    icon: Users,
    canView: (role) => canAccess('center', 'manage', role),
  },
];

export function getAvailableOppositionTabs(role: AppRole | null) {
  return TAB_DEFINITIONS.filter((tab) => tab.canView(role));
}

export function getDefaultOppositionTab(role: AppRole | null): OppositionTabKey | null {
  const firstTab = getAvailableOppositionTabs(role)[0];
  return firstTab?.key ?? null;
}

export function canAccessOppositionTab(role: AppRole | null, tabKey: OppositionTabKey) {
  const tab = TAB_DEFINITIONS.find((item) => item.key === tabKey);
  if (!tab) return false;
  return tab.canView(role);
}
