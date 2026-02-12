import type { Oposicion } from '@/data/oposiciones';

export function difficultyBadgeClass(difficulty: Oposicion['difficulty']) {
  if (difficulty === 'muy alta') return 'bg-rose-100 text-rose-700 border-rose-200';
  if (difficulty === 'alta') return 'bg-amber-100 text-amber-700 border-amber-200';
  return 'bg-sky-100 text-sky-700 border-sky-200';
}

export function difficultyLabel(difficulty: Oposicion['difficulty']) {
  if (difficulty === 'muy alta') return 'Muy alta';
  if (difficulty === 'alta') return 'Alta';
  return 'Media';
}
