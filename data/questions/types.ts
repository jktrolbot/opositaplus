export type QuestionDifficulty = 'easy' | 'medium' | 'hard';

export interface Question {
  id: string;
  oposicion: string;
  topic: string;
  difficulty: QuestionDifficulty;
  question: string;
  options: string[];
  correct: number;
  explanation: string;
  lawReference: string;
}
