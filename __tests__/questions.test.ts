import { describe, it, expect } from 'vitest';

interface ParsedQuestion {
  question_text: string;
  options: Array<{ key: string; text: string }>;
  correct_answer: string;
  explanation?: string;
  difficulty?: number;
}

function parseQuestionsFromJson(content: string): ParsedQuestion[] {
  const parsed = JSON.parse(content);
  const questions: ParsedQuestion[] = parsed.questions ?? parsed;
  if (!Array.isArray(questions)) return [];
  return questions.filter(
    (q) =>
      typeof q.question_text === 'string' &&
      Array.isArray(q.options) &&
      q.options.length >= 2 &&
      typeof q.correct_answer === 'string',
  );
}

describe('Question parsing', () => {
  it('parses valid JSON with questions array', () => {
    const json = JSON.stringify({
      questions: [
        {
          question_text: '¿Qué es la Constitución?',
          options: [
            { key: 'A', text: 'Una ley' },
            { key: 'B', text: 'La norma suprema' },
            { key: 'C', text: 'Un decreto' },
            { key: 'D', text: 'Una orden' },
          ],
          correct_answer: 'B',
          explanation: 'La Constitución es la norma suprema del ordenamiento jurídico.',
          difficulty: 2,
        },
      ],
    });
    const result = parseQuestionsFromJson(json);
    expect(result).toHaveLength(1);
    expect(result[0].correct_answer).toBe('B');
    expect(result[0].options).toHaveLength(4);
  });

  it('parses flat array format', () => {
    const json = JSON.stringify([
      {
        question_text: 'Test?',
        options: [{ key: 'A', text: 'Yes' }, { key: 'B', text: 'No' }],
        correct_answer: 'A',
      },
    ]);
    const result = parseQuestionsFromJson(json);
    expect(result).toHaveLength(1);
  });

  it('filters out invalid questions', () => {
    const json = JSON.stringify({
      questions: [
        { question_text: 'Valid?', options: [{ key: 'A', text: 'Yes' }, { key: 'B', text: 'No' }], correct_answer: 'A' },
        { question_text: 'Invalid', options: [], correct_answer: 'A' },
        { options: [{ key: 'A', text: 'X' }], correct_answer: 'A' },
      ],
    });
    const result = parseQuestionsFromJson(json);
    expect(result).toHaveLength(1);
  });

  it('returns empty for invalid JSON', () => {
    expect(() => parseQuestionsFromJson('not json')).toThrow();
  });

  it('returns empty for non-array result', () => {
    const json = JSON.stringify({ message: 'no questions here' });
    const result = parseQuestionsFromJson(json);
    expect(result).toHaveLength(0);
  });
});
