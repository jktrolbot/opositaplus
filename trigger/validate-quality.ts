import { task } from '@trigger.dev/sdk/v3';
import { validateQuestionsWithClaude } from '../lib/knowledge/ai';
import { createServiceSupabase, updateUploadState } from './knowledge-pipeline-utils';

function normalizeOptions(options: unknown) {
  if (!Array.isArray(options)) return [] as Array<{ key: string; text: string }>;
  return options
    .map((option) => {
      if (!option || typeof option !== 'object') return null;
      const key = typeof (option as { key?: unknown }).key === 'string' ? (option as { key: string }).key : '';
      const text = typeof (option as { text?: unknown }).text === 'string' ? (option as { text: string }).text : '';
      if (!key || !text) return null;
      return { key, text };
    })
    .filter((option): option is { key: string; text: string } => Boolean(option));
}

export const validateQuality = task({
  id: 'validateQuality',
  maxDuration: 1200,
  run: async (payload: { uploadId: string; questionIds?: string[] }) => {
    const supabase = createServiceSupabase();
    const uploadId = payload.uploadId;

    try {
      await updateUploadState({ supabase, uploadId, progress: 94, status: 'processing' });

      let questionIds = (payload.questionIds ?? []).filter(Boolean);

      if (questionIds.length === 0) {
        const { data: processedRows, error: processedError } = await supabase
          .from('processed_content')
          .select('id')
          .eq('upload_id', uploadId);

        if (processedError) {
          throw new Error(`No se pudo cargar processed_content: ${processedError.message}`);
        }

        const processedIds = (processedRows ?? []).map((row) => row.id);
        if (processedIds.length === 0) {
          throw new Error('No hay contenido procesado para validar');
        }

        const { data: chunkRows, error: chunkError } = await supabase
          .from('knowledge_chunks')
          .select('id')
          .in('content_id', processedIds);

        if (chunkError) {
          throw new Error(`No se pudieron cargar chunks: ${chunkError.message}`);
        }

        const chunkIds = (chunkRows ?? []).map((row) => row.id);
        if (chunkIds.length === 0) {
          questionIds = [];
        } else {
          const { data: questionRows, error: questionError } = await supabase
            .from('generated_questions')
            .select('id')
            .in('chunk_id', chunkIds);

          if (questionError) {
            throw new Error(`No se pudieron cargar preguntas: ${questionError.message}`);
          }

          questionIds = (questionRows ?? []).map((row) => row.id);
        }
      }

      if (questionIds.length === 0) {
        await updateUploadState({
          supabase,
          uploadId,
          status: 'completed',
          progress: 100,
          metadataPatch: {
            validation: {
              total: 0,
              auto_published: 0,
              manual_review: 0,
            },
          },
        });

        return {
          status: 'completed-without-questions',
          uploadId,
        };
      }

      const { data: questions, error: questionsError } = await supabase
        .from('generated_questions')
        .select('id, chunk_id, question_text, options, correct_answer, explanation, metadata')
        .in('id', questionIds);

      if (questionsError || !questions) {
        throw new Error(questionsError?.message ?? 'No se pudieron leer preguntas para validar');
      }

      const chunkIds = [...new Set(questions.map((question) => question.chunk_id))];
      const { data: chunks, error: chunkDetailsError } = await supabase
        .from('knowledge_chunks')
        .select('id, chunk_text')
        .in('id', chunkIds);

      if (chunkDetailsError) {
        throw new Error(`No se pudieron leer chunks de contexto: ${chunkDetailsError.message}`);
      }

      const chunkTextById = new Map((chunks ?? []).map((chunk) => [chunk.id, chunk.chunk_text]));
      const questionById = new Map(questions.map((question) => [question.id, question]));

      const validations = await validateQuestionsWithClaude({
        questions: questions.map((question) => ({
          id: question.id,
          question_text: question.question_text,
          options: normalizeOptions(question.options),
          correct_answer: question.correct_answer,
          explanation: question.explanation,
          chunk_text: chunkTextById.get(question.chunk_id) ?? null,
        })),
      });

      let autoPublished = 0;
      let manualReview = 0;

      for (const validation of validations) {
        const questionId = validation.question_id ?? questions[validation.index ?? 0]?.id;
        if (!questionId) continue;

        const question = questionById.get(questionId);
        if (!question) continue;

        const qualityScore = Math.max(0, Math.min(100, Math.round(validation.score)));
        const validated = qualityScore >= 80 && validation.valid;

        if (validated) autoPublished += 1;
        else manualReview += 1;

        const mergedMetadata = {
          ...(question.metadata as Record<string, unknown> | null),
          quality_review: {
            score: qualityScore,
            valid: validation.valid,
            reason: validation.reason ?? null,
            reviewed_at: new Date().toISOString(),
            reviewer_model: process.env.CLAUDE_MODEL ?? 'claude-sonnet-4-5',
            requires_manual_review: !validated,
          },
        };

        const { error } = await supabase
          .from('generated_questions')
          .update({
            validated,
            quality_score: qualityScore,
            metadata: mergedMetadata,
          })
          .eq('id', questionId);

        if (error) {
          throw new Error(`No se pudo actualizar calidad de pregunta ${questionId}: ${error.message}`);
        }
      }

      await updateUploadState({
        supabase,
        uploadId,
        status: 'completed',
        progress: 100,
        errorMessage: null,
        metadataPatch: {
          completed_at: new Date().toISOString(),
          validation: {
            total: validations.length,
            auto_published: autoPublished,
            manual_review: manualReview,
          },
        },
      });

      return {
        status: 'completed',
        uploadId,
        total: validations.length,
        autoPublished,
        manualReview,
      };
    } catch (error) {
      const message = (error as Error).message;
      await updateUploadState({
        supabase,
        uploadId,
        status: 'failed',
        progress: 100,
        errorMessage: message.slice(0, 1000),
      });
      console.error('validate-quality error', { uploadId, message });
      throw error;
    }
  },
});
