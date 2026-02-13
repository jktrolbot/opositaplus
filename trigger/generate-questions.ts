import { task } from '@trigger.dev/sdk/v3';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
);

export const generateQuestions = task({
  id: 'generate-questions',
  maxDuration: 120,
  run: async (payload: {
    organizationId: string;
    oppositionId: string;
    topicId: string;
    topicTitle: string;
    context: string;
    count: number;
  }) => {
    const { organizationId, oppositionId, topicId, topicTitle, context, count } = payload;

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content: `Eres un experto en oposiciones españolas. Genera ${count} preguntas tipo test sobre "${topicTitle}" con 4 opciones (A, B, C, D), indicando la respuesta correcta y una explicación. Responde en JSON: {"questions": [{"question_text": "...", "options": [{"key": "A", "text": "..."}, ...], "correct_answer": "A", "explanation": "...", "difficulty": 3}]}`,
          },
          {
            role: 'user',
            content: context || `Genera ${count} preguntas sobre ${topicTitle} para oposiciones.`,
          },
        ],
        temperature: 0.7,
        response_format: { type: 'json_object' },
      }),
    });

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content;

    if (!content) {
      return { status: 'failed', reason: 'No response from OpenAI' };
    }

    const parsed = JSON.parse(content);
    const questions: Array<{
      question_text: string;
      options: Array<{ key: string; text: string }>;
      correct_answer: string;
      explanation?: string;
      difficulty?: number;
    }> = parsed.questions ?? parsed;

    if (!Array.isArray(questions) || questions.length === 0) {
      return { status: 'failed', reason: 'No questions parsed from response' };
    }

    // Insert into questions table
    const rows = questions.map((q) => ({
      organization_id: organizationId,
      opposition_id: oppositionId,
      topic_id: topicId,
      question_text: q.question_text,
      options: JSON.stringify(q.options),
      correct_answer: q.correct_answer,
      explanation: q.explanation ?? '',
      difficulty: q.difficulty ?? 3,
      source: 'ai_generated' as const,
      ai_validated: false,
    }));

    const { error } = await supabase.from('questions').insert(rows);
    if (error) {
      throw new Error(`Failed to insert questions: ${error.message}`);
    }

    return {
      status: 'completed',
      generated: questions.length,
      organizationId,
      oppositionId,
      topicId,
    };
  },
});
