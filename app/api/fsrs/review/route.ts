import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { runFsrsReview, type FsrsRating } from '@/lib/knowledge/fsrs';

type ItemContext = {
  itemType: 'question' | 'flashcard';
  itemId: string;
  chunkId: string;
  oposicionId: string;
  centerId: string;
};

async function resolveItemContext(
  supabase: Awaited<ReturnType<typeof createClient>>,
  itemId: string,
): Promise<ItemContext | null> {
  const { data: question } = await supabase
    .from('generated_questions')
    .select('id, chunk_id, oposicion_id')
    .eq('id', itemId)
    .maybeSingle();

  if (question) {
    const { data: chunk, error: chunkError } = await supabase
      .from('knowledge_chunks')
      .select('id, content_id')
      .eq('id', question.chunk_id)
      .single();
    if (chunkError || !chunk) return null;

    const { data: processed, error: processedError } = await supabase
      .from('processed_content')
      .select('id, upload_id')
      .eq('id', chunk.content_id)
      .single();
    if (processedError || !processed) return null;

    const { data: upload, error: uploadError } = await supabase
      .from('content_uploads')
      .select('id, center_id')
      .eq('id', processed.upload_id)
      .single();
    if (uploadError || !upload) return null;

    return {
      itemType: 'question',
      itemId: question.id,
      chunkId: question.chunk_id,
      oposicionId: question.oposicion_id,
      centerId: upload.center_id,
    };
  }

  const { data: flashcard } = await supabase
    .from('flashcards')
    .select('id, chunk_id, oposicion_id')
    .eq('id', itemId)
    .maybeSingle();

  if (!flashcard) return null;

  const { data: chunk, error: chunkError } = await supabase
    .from('knowledge_chunks')
    .select('id, content_id')
    .eq('id', flashcard.chunk_id)
    .single();
  if (chunkError || !chunk) return null;

  const { data: processed, error: processedError } = await supabase
    .from('processed_content')
    .select('id, upload_id')
    .eq('id', chunk.content_id)
    .single();
  if (processedError || !processed) return null;

  const { data: upload, error: uploadError } = await supabase
    .from('content_uploads')
    .select('id, center_id')
    .eq('id', processed.upload_id)
    .single();
  if (uploadError || !upload) return null;

  return {
    itemType: 'flashcard',
    itemId: flashcard.id,
    chunkId: flashcard.chunk_id,
    oposicionId: flashcard.oposicion_id,
    centerId: upload.center_id,
  };
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as {
      student_id?: string;
      item_id?: string;
      rating?: number;
      item_type?: 'question' | 'flashcard';
    };

    const studentId = body.student_id;
    const itemId = body.item_id;
    const rating = body.rating;

    if (!studentId || !itemId || !rating) {
      return NextResponse.json(
        { error: 'Campos requeridos: student_id, item_id, rating' },
        { status: 400 },
      );
    }

    if (![1, 2, 3, 4].includes(rating)) {
      return NextResponse.json({ error: 'rating debe estar entre 1 y 4' }, { status: 400 });
    }

    const supabase = await createClient();
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
    }

    const context = await resolveItemContext(supabase, itemId);
    if (!context) {
      return NextResponse.json({ error: 'Item no encontrado o sin acceso' }, { status: 404 });
    }

    if (body.item_type && body.item_type !== context.itemType) {
      return NextResponse.json({ error: 'item_type no coincide con el item indicado' }, { status: 400 });
    }

    if (user.id !== studentId) {
      const [{ data: member }, { data: profile }] = await Promise.all([
        supabase
          .from('organization_members')
          .select('role')
          .eq('organization_id', context.centerId)
          .eq('user_id', user.id)
          .in('role', ['center_admin', 'teacher'])
          .maybeSingle(),
        supabase.from('user_profiles').select('is_super_admin').eq('id', user.id).maybeSingle(),
      ]);

      if (!member && !profile?.is_super_admin) {
        return NextResponse.json({ error: 'No autorizado para registrar este repaso' }, { status: 403 });
      }
    }

    const { data: existingProgress } = await supabase
      .from('student_progress')
      .select('id, fsrs_state, repetitions')
      .eq('student_id', studentId)
      .eq('item_id', itemId)
      .eq('item_type', context.itemType)
      .maybeSingle();

    const review = runFsrsReview({
      rating: rating as FsrsRating,
      previousState: existingProgress?.fsrs_state,
      previousRepetitions: existingProgress?.repetitions ?? 0,
      now: new Date(),
    });

    const upsertPayload = {
      student_id: studentId,
      item_id: itemId,
      item_type: context.itemType,
      center_id: context.centerId,
      oposicion_id: context.oposicionId,
      fsrs_state: review.fsrsState,
      next_review: review.nextReview.toISOString(),
      easiness: review.easiness,
      interval: review.intervalDays,
      repetitions: review.repetitions,
    };

    const { error: upsertError } = await supabase
      .from('student_progress')
      .upsert(upsertPayload, { onConflict: 'student_id,item_id,item_type' });

    if (upsertError) {
      return NextResponse.json({ error: upsertError.message }, { status: 500 });
    }

    return NextResponse.json({
      ok: true,
      item_type: context.itemType,
      next_review: review.nextReview.toISOString(),
      interval_days: review.intervalDays,
      repetitions: review.repetitions,
      easiness: review.easiness,
      fsrs_state: review.fsrsState,
    });
  } catch (error) {
    console.error('POST /api/fsrs/review error', error);
    return NextResponse.json({ error: 'No se pudo registrar el repaso' }, { status: 500 });
  }
}
