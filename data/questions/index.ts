import ageA1Questions from './age-a1.json';
import inspectoresHaciendaQuestions from './inspectores-hacienda.json';
import justiciaAuxilioQuestions from './justicia-auxilio.json';
import tecnicosHaciendaQuestions from './tecnicos-hacienda.json';
import xuntaA1Questions from './xunta-a1.json';
import xuntaA2Questions from './xunta-a2.json';
import type { Question } from './types';

export const questionBanks: Record<string, Question[]> = {
  'xunta-a1': xuntaA1Questions as Question[],
  'xunta-a2': xuntaA2Questions as Question[],
  'tecnicos-hacienda': tecnicosHaciendaQuestions as Question[],
  'inspectores-hacienda': inspectoresHaciendaQuestions as Question[],
  'age-a1': ageA1Questions as Question[],
  'justicia-auxilio': justiciaAuxilioQuestions as Question[],
};

export function getQuestionsByOposicion(oposicionSlug: string) {
  return questionBanks[oposicionSlug] ?? [];
}

export function getAllQuestions() {
  return Object.values(questionBanks).flat();
}
