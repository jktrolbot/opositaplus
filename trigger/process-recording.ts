import { task } from '@trigger.dev/sdk/v3';
import OpenAI from 'openai';
import { createClient } from '@supabase/supabase-js';

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
);

export const processRecording = task({
  id: 'process-recording',
  maxDuration: 600,
  run: async (payload: {
    classId: string;
    recordingUrl: string;
    organizationId: string;
    oppositionId: string;
  }) => {
    const { classId, recordingUrl, organizationId, oppositionId } = payload;

    // 1. Download audio
    const audioResponse = await fetch(recordingUrl);
    if (!audioResponse.ok) {
      throw new Error(`Failed to download recording: ${audioResponse.status}`);
    }
    const audioBuffer = Buffer.from(await audioResponse.arrayBuffer());
    const audioFile = new File([audioBuffer], 'recording.mp4', { type: 'audio/mp4' });

    // 2. Transcribe with Whisper
    const transcription = await openai.audio.transcriptions.create({
      model: 'whisper-1',
      file: audioFile,
      language: 'es',
    });

    const transcript = transcription.text;
    if (!transcript || transcript.length < 50) {
      return { status: 'skipped', reason: 'Transcript too short' };
    }

    // 3. Generate questions from transcript
    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: `Eres un experto en oposiciones españolas. A partir de la transcripción de una clase, genera 10 preguntas tipo test con 4 opciones (A, B, C, D), indicando la respuesta correcta y una explicación. Responde en JSON: {"questions": [{"question_text": "...", "options": [{"key": "A", "text": "..."}, ...], "correct_answer": "A", "explanation": "...", "difficulty": 3}]}`,
        },
        {
          role: 'user',
          content: `Transcripción de la clase:\n\n${transcript.slice(0, 12000)}`,
        },
      ],
      temperature: 0.7,
      response_format: { type: 'json_object' },
    });

    const content = completion.choices[0]?.message?.content;
    if (!content) {
      return { status: 'failed', reason: 'No response from GPT' };
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
      return { status: 'failed', reason: 'No questions generated' };
    }

    // 4. Insert questions into DB
    const rows = questions.map((q) => ({
      organization_id: organizationId,
      opposition_id: oppositionId,
      question_text: q.question_text,
      options: JSON.stringify(q.options),
      correct_answer: q.correct_answer,
      explanation: q.explanation ?? '',
      difficulty: q.difficulty ?? 3,
      source: 'ai_generated' as const,
      ai_validated: false,
      metadata: JSON.stringify({ class_id: classId, from_recording: true }),
    }));

    const { error } = await supabase.from('questions').insert(rows);
    if (error) {
      throw new Error(`Failed to insert questions: ${error.message}`);
    }

    // 5. Update class with transcript info
    await supabase
      .from('classes')
      .update({
        metadata: {
          transcript_length: transcript.length,
          auto_questions_count: questions.length,
        },
      })
      .eq('id', classId);

    return {
      status: 'completed',
      classId,
      transcriptLength: transcript.length,
      questionsGenerated: questions.length,
    };
  },
});
