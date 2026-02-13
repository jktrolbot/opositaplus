import { task } from '@trigger.dev/sdk/v3';

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

    // Call OpenAI to generate questions
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
            content: `Eres un experto en oposiciones españolas. Genera ${count} preguntas tipo test sobre "${topicTitle}" con 4 opciones (A, B, C, D), indicando la respuesta correcta y una explicación. Responde en JSON: [{"question_text": "...", "options": [{"key": "A", "text": "..."}, ...], "correct_answer": "A", "explanation": "..."}]`,
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
    const questions = parsed.questions ?? parsed;

    // TODO: Insert into questions table via Supabase
    // Each question gets source: 'ai_generated', ai_validated: false

    return {
      status: 'completed',
      generated: Array.isArray(questions) ? questions.length : 0,
      organizationId,
      oppositionId,
      topicId,
    };
  },
});
