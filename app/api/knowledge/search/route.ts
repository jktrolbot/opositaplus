import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { generateGeminiEmbedding } from '@/lib/knowledge/ai';

function toVectorLiteral(values: number[]) {
  return `[${values.join(',')}]`;
}

function normalizeLimit(value: unknown) {
  if (typeof value !== 'number') return 10;
  if (!Number.isFinite(value)) return 10;
  return Math.max(1, Math.min(20, Math.floor(value)));
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as {
      query?: string;
      oposicion?: string;
      oposicion_id?: string;
      limit?: number;
    };

    const query = body.query?.trim();
    if (!query || query.length < 2) {
      return NextResponse.json({ error: 'La búsqueda debe tener al menos 2 caracteres' }, { status: 400 });
    }

    const supabase = await createClient();
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
    }

    let oposicionId = body.oposicion_id;
    if (!oposicionId && body.oposicion) {
      const bySlug = await supabase
        .from('oppositions')
        .select('id')
        .eq('slug', body.oposicion)
        .maybeSingle();

      if (bySlug.data?.id) {
        oposicionId = bySlug.data.id;
      }
    }

    if (!oposicionId) {
      return NextResponse.json({ error: 'oposicion_id u oposicion (slug) es obligatorio' }, { status: 400 });
    }

    const embedding = await generateGeminiEmbedding(query);
    const limit = normalizeLimit(body.limit);

    const { data: matchedRows, error: matchError } = await supabase.rpc('match_knowledge_chunks', {
      query_embedding: toVectorLiteral(embedding),
      filter_oposicion_id: oposicionId,
      match_count: limit,
      match_threshold: 0.55,
    });

    if (matchError) {
      return NextResponse.json({ error: matchError.message }, { status: 500 });
    }

    const chunks = (matchedRows ?? []) as Array<{
      id: string;
      content_id: string;
      oposicion_id: string;
      tema: string | null;
      subtema: string | null;
      chunk_text: string;
      tags: string[] | null;
      similarity: number;
    }>;

    if (chunks.length === 0) {
      return NextResponse.json({
        chunks: [],
        related_questions: [],
        related_flashcards: [],
      });
    }

    const chunkIds = chunks.map((chunk) => chunk.id);

    const [{ data: questions, error: questionsError }, { data: flashcards, error: flashcardsError }] =
      await Promise.all([
        supabase
          .from('generated_questions')
          .select('id, chunk_id, question_text, options, correct_answer, explanation, difficulty, validated, quality_score')
          .in('chunk_id', chunkIds)
          .eq('validated', true)
          .order('quality_score', { ascending: false, nullsFirst: false })
          .limit(80),
        supabase
          .from('flashcards')
          .select('id, chunk_id, front, back, tags, difficulty')
          .in('chunk_id', chunkIds)
          .limit(120),
      ]);

    if (questionsError) {
      return NextResponse.json({ error: questionsError.message }, { status: 500 });
    }

    if (flashcardsError) {
      return NextResponse.json({ error: flashcardsError.message }, { status: 500 });
    }

    const questionsByChunk = new Map<string, Array<Record<string, unknown>>>();
    for (const question of questions ?? []) {
      const existing = questionsByChunk.get(question.chunk_id) ?? [];
      existing.push(question as unknown as Record<string, unknown>);
      questionsByChunk.set(question.chunk_id, existing);
    }

    const flashcardsByChunk = new Map<string, Array<Record<string, unknown>>>();
    for (const flashcard of flashcards ?? []) {
      const existing = flashcardsByChunk.get(flashcard.chunk_id) ?? [];
      existing.push(flashcard as unknown as Record<string, unknown>);
      flashcardsByChunk.set(flashcard.chunk_id, existing);
    }

    return NextResponse.json({
      chunks: chunks.map((chunk) => ({
        ...chunk,
        related_questions: (questionsByChunk.get(chunk.id) ?? []).slice(0, 5),
        related_flashcards: (flashcardsByChunk.get(chunk.id) ?? []).slice(0, 8),
      })),
      related_questions: questions ?? [],
      related_flashcards: flashcards ?? [],
    });
  } catch (error) {
    console.error('POST /api/knowledge/search error', error);
    return NextResponse.json({ error: 'No se pudo realizar la búsqueda semántica' }, { status: 500 });
  }
}
