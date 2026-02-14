import { task, tasks } from '@trigger.dev/sdk/v3';
import { chunkText } from '../lib/knowledge/chunking';
import { generateGeminiEmbedding, generateStudyMaterialDraft } from '../lib/knowledge/ai';
import { createServiceSupabase, updateUploadState } from './knowledge-pipeline-utils';
import type { validateQuality } from './validate-quality';

type DetectedQuestion = {
  question_text: string;
  options: Array<{ key: string; text: string }>;
  correct_answer: string;
  explanation: string | null;
  difficulty: number;
  tags: string[];
};

function normalizeChunks(input: unknown, fallbackText: string) {
  if (Array.isArray(input)) {
    const extracted = input
      .map((entry) => {
        if (typeof entry === 'string') return entry;
        if (entry && typeof entry === 'object' && typeof (entry as { text?: unknown }).text === 'string') {
          return (entry as { text: string }).text;
        }
        return '';
      })
      .map((text) => text.trim())
      .filter((text) => text.length > 0);

    if (extracted.length > 0) {
      return extracted;
    }
  }

  return chunkText(fallbackText, 1200, 180);
}

function serializeVector(values: number[]) {
  return `[${values.join(',')}]`;
}

export const generateStudyMaterial = task({
  id: 'generateStudyMaterial',
  maxDuration: 2400,
  run: async (payload: {
    uploadId: string;
    processedContentId: string;
    detectedQuestions?: DetectedQuestion[];
  }) => {
    const supabase = createServiceSupabase();
    const uploadId = payload.uploadId;

    try {
      await updateUploadState({ supabase, uploadId, progress: 72, status: 'processing' });

      const { data: processed, error: processedError } = await supabase
        .from('processed_content')
        .select('id, raw_text, chunks, metadata, upload_id')
        .eq('id', payload.processedContentId)
        .single();

      if (processedError || !processed) {
        throw new Error(processedError?.message ?? 'processed_content no encontrado');
      }

      const { data: uploadRow, error: uploadError } = await supabase
        .from('content_uploads')
        .select('id, oposicion_id, file_name, center_id')
        .eq('id', processed.upload_id)
        .single();

      if (uploadError || !uploadRow) {
        throw new Error(uploadError?.message ?? 'No se encontró upload para processed_content');
      }

      const oposicionId = uploadRow.oposicion_id;
      if (!oposicionId) {
        throw new Error('processed_content sin oposición asociada');
      }

      const rawText = processed.raw_text;
      const chunks = normalizeChunks(processed.chunks, rawText).slice(0, 120);
      if (chunks.length === 0) {
        throw new Error('No hay chunks para generar material');
      }

      const { data: opposition } = await supabase
        .from('oppositions')
        .select('name')
        .eq('id', oposicionId)
        .single();

      await updateUploadState({
        supabase,
        uploadId,
        progress: 76,
        metadataPatch: { chunk_count: chunks.length },
      });

      const draft = await generateStudyMaterialDraft({
        chunks,
        fileName: uploadRow.file_name ?? 'archivo',
        oposicionName: opposition?.name,
      });

      const annotationByIndex = new Map(
        draft.chunk_annotations.map((annotation) => [annotation.chunk_index, annotation]),
      );

      const chunkIdByIndex = new Map<number, string>();
      for (let index = 0; index < chunks.length; index += 1) {
        const chunkTextValue = chunks[index];
        const annotation = annotationByIndex.get(index);

        const embedding = await generateGeminiEmbedding(chunkTextValue);
        const { data: insertedChunk, error } = await supabase
          .from('knowledge_chunks')
          .insert({
            content_id: payload.processedContentId,
            oposicion_id: oposicionId,
            tema: annotation?.tema ?? draft.summaries[0]?.tema ?? 'General',
            subtema: annotation?.subtema ?? draft.summaries[0]?.subtema ?? null,
            chunk_text: chunkTextValue,
            embedding: serializeVector(embedding),
            difficulty: annotation?.difficulty ?? draft.summaries[0]?.difficulty ?? 'media',
            tags: annotation?.tags ?? draft.summaries[0]?.tags ?? [],
            source_ref: `chunk:${index}`,
          })
          .select('id')
          .single();

        if (error || !insertedChunk) {
          throw new Error(error?.message ?? `No se pudo insertar chunk ${index}`);
        }

        chunkIdByIndex.set(index, insertedChunk.id);
      }

      await updateUploadState({ supabase, uploadId, progress: 84 });

      const generatedQuestionRows = [
        ...draft.questions.map((question) => ({ ...question, source: 'gemini_2_5_flash' as const })),
        ...(payload.detectedQuestions ?? []).map((question) => ({
          chunk_index: 0,
          ...question,
          tema: draft.summaries[0]?.tema,
          subtema: draft.summaries[0]?.subtema,
          source: 'existing_test' as const,
        })),
      ]
        .map((question) => {
          const chunkIndex = question.chunk_index ?? 0;
          const chunkId = chunkIdByIndex.get(chunkIndex);
          if (!chunkId) return null;

          return {
            chunk_id: chunkId,
            oposicion_id: oposicionId,
            question_text: question.question_text,
            options: question.options,
            correct_answer: question.correct_answer,
            explanation: question.explanation ?? null,
            difficulty: Math.max(1, Math.min(5, Math.round(question.difficulty ?? 3))),
            validated: false,
            metadata: {
              tema: question.tema ?? null,
              subtema: question.subtema ?? null,
              tags: question.tags ?? [],
              source: question.source,
            },
          };
        })
        .filter((row): row is NonNullable<typeof row> => Boolean(row));

      const generatedFlashcardRows = draft.flashcards
        .map((flashcard) => {
          const chunkIndex = flashcard.chunk_index ?? 0;
          const chunkId = chunkIdByIndex.get(chunkIndex);
          if (!chunkId) return null;

          return {
            chunk_id: chunkId,
            oposicion_id: oposicionId,
            front: flashcard.front,
            back: flashcard.back,
            tags: flashcard.tags ?? [],
            difficulty: Math.max(1, Math.min(5, Math.round(flashcard.difficulty ?? 3))),
            metadata: {
              tema: flashcard.tema ?? null,
              subtema: flashcard.subtema ?? null,
            },
          };
        })
        .filter((row): row is NonNullable<typeof row> => Boolean(row));

      const [{ data: questionRows, error: questionsError }, { error: flashcardsError }] =
        await Promise.all([
          generatedQuestionRows.length
            ? supabase
                .from('generated_questions')
                .insert(generatedQuestionRows)
                .select('id')
            : Promise.resolve({ data: [], error: null }),
          generatedFlashcardRows.length
            ? supabase
                .from('flashcards')
                .insert(generatedFlashcardRows)
            : Promise.resolve({ error: null }),
        ]);

      if (questionsError) {
        throw new Error(`No se pudieron insertar preguntas: ${questionsError.message}`);
      }
      if (flashcardsError) {
        throw new Error(`No se pudieron insertar flashcards: ${flashcardsError.message}`);
      }

      const metadata = {
        ...(processed.metadata as Record<string, unknown> | null),
        generated_at: new Date().toISOString(),
        summaries: draft.summaries,
        generated_questions: generatedQuestionRows.length,
        generated_flashcards: generatedFlashcardRows.length,
        indexed_chunks: chunks.length,
      };

      const { error: processedUpdateError } = await supabase
        .from('processed_content')
        .update({ metadata })
        .eq('id', payload.processedContentId);

      if (processedUpdateError) {
        throw new Error(`No se pudo actualizar metadata de processed_content: ${processedUpdateError.message}`);
      }

      await updateUploadState({
        supabase,
        uploadId,
        progress: 92,
        metadataPatch: {
          generated_questions: generatedQuestionRows.length,
          generated_flashcards: generatedFlashcardRows.length,
          indexed_chunks: chunks.length,
        },
      });

      await tasks.trigger<typeof validateQuality>('validateQuality', {
        uploadId,
        questionIds: (questionRows ?? []).map((row) => row.id),
      });

      return {
        status: 'queued-validation',
        uploadId,
        chunks: chunks.length,
        questions: generatedQuestionRows.length,
        flashcards: generatedFlashcardRows.length,
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
      console.error('generate-study-material error', { uploadId, message });
      throw error;
    }
  },
});
