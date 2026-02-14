import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

function normalizeLimit(value: string | null) {
  if (!value) return 40;
  const parsed = Number.parseInt(value, 10);
  if (!Number.isFinite(parsed)) return 40;
  return Math.max(1, Math.min(120, parsed));
}

export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const studentId = url.searchParams.get('student_id');
    const oposicionId = url.searchParams.get('oposicion_id');
    const limit = normalizeLimit(url.searchParams.get('limit'));

    if (!studentId || !oposicionId) {
      return NextResponse.json(
        { error: 'Parámetros requeridos: student_id, oposicion_id' },
        { status: 400 },
      );
    }

    const supabase = await createClient();
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
    }

    if (user.id !== studentId) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 403 });
    }

    const nowIso = new Date().toISOString();

    const { data: dueProgressRows, error: dueError } = await supabase
      .from('student_progress')
      .select('item_id, item_type, next_review, fsrs_state, interval, repetitions, easiness')
      .eq('student_id', studentId)
      .eq('oposicion_id', oposicionId)
      .lte('next_review', nowIso)
      .order('next_review', { ascending: true, nullsFirst: true })
      .limit(limit);

    if (dueError) {
      return NextResponse.json({ error: dueError.message }, { status: 500 });
    }

    const dueRows = dueProgressRows ?? [];
    const questionIds = dueRows
      .filter((row) => row.item_type === 'question')
      .map((row) => row.item_id);
    const flashcardIds = dueRows
      .filter((row) => row.item_type === 'flashcard')
      .map((row) => row.item_id);

    const [{ data: questions, error: questionsError }, { data: flashcards, error: flashcardsError }] =
      await Promise.all([
        questionIds.length
          ? supabase
              .from('generated_questions')
              .select('id, question_text, options, correct_answer, explanation, difficulty, quality_score')
              .in('id', questionIds)
          : Promise.resolve({ data: [], error: null }),
        flashcardIds.length
          ? supabase
              .from('flashcards')
              .select('id, front, back, tags, difficulty')
              .in('id', flashcardIds)
          : Promise.resolve({ data: [], error: null }),
      ]);

    if (questionsError) {
      return NextResponse.json({ error: questionsError.message }, { status: 500 });
    }

    if (flashcardsError) {
      return NextResponse.json({ error: flashcardsError.message }, { status: 500 });
    }

    const questionById = new Map((questions ?? []).map((question) => [question.id, question]));
    const flashcardById = new Map((flashcards ?? []).map((flashcard) => [flashcard.id, flashcard]));

    const dueItems = dueRows
      .map((row) => {
        if (row.item_type === 'question') {
          const question = questionById.get(row.item_id);
          if (!question) return null;
          return {
            item_id: row.item_id,
            item_type: 'question' as const,
            next_review: row.next_review,
            fsrs_state: row.fsrs_state,
            interval: row.interval,
            repetitions: row.repetitions,
            easiness: row.easiness,
            data: question,
            is_new: false,
          };
        }

        const flashcard = flashcardById.get(row.item_id);
        if (!flashcard) return null;

        return {
          item_id: row.item_id,
          item_type: 'flashcard' as const,
          next_review: row.next_review,
          fsrs_state: row.fsrs_state,
          interval: row.interval,
          repetitions: row.repetitions,
          easiness: row.easiness,
          data: flashcard,
          is_new: false,
        };
      })
      .filter(Boolean);

    const seenQuestionIds = new Set(questionIds);
    const seenFlashcardIds = new Set(flashcardIds);
    const remaining = Math.max(0, limit - dueItems.length);

    let newItems: Array<{
      item_id: string;
      item_type: 'question' | 'flashcard';
      next_review: string | null;
      fsrs_state: null;
      interval: number;
      repetitions: number;
      easiness: number;
      data: Record<string, unknown>;
      is_new: boolean;
    }> = [];

    if (remaining > 0) {
      const [questionCandidates, flashcardCandidates] = await Promise.all([
        supabase
          .from('generated_questions')
          .select('id, question_text, options, correct_answer, explanation, difficulty, quality_score')
          .eq('oposicion_id', oposicionId)
          .eq('validated', true)
          .order('quality_score', { ascending: false, nullsFirst: false })
          .limit(remaining * 2),
        supabase
          .from('flashcards')
          .select('id, front, back, tags, difficulty')
          .eq('oposicion_id', oposicionId)
          .order('created_at', { ascending: false })
          .limit(remaining * 2),
      ]);

      const freshQuestions = (questionCandidates.data ?? [])
        .filter((question) => !seenQuestionIds.has(question.id))
        .slice(0, remaining)
        .map((question) => ({
          item_id: question.id,
          item_type: 'question' as const,
          next_review: null,
          fsrs_state: null,
          interval: 0,
          repetitions: 0,
          easiness: 2.5,
          data: question as unknown as Record<string, unknown>,
          is_new: true,
        }));

      const remainingAfterQuestions = Math.max(0, remaining - freshQuestions.length);
      const freshFlashcards = (flashcardCandidates.data ?? [])
        .filter((flashcard) => !seenFlashcardIds.has(flashcard.id))
        .slice(0, remainingAfterQuestions)
        .map((flashcard) => ({
          item_id: flashcard.id,
          item_type: 'flashcard' as const,
          next_review: null,
          fsrs_state: null,
          interval: 0,
          repetitions: 0,
          easiness: 2.5,
          data: flashcard as unknown as Record<string, unknown>,
          is_new: true,
        }));

      newItems = [...freshQuestions, ...freshFlashcards];
    }

    return NextResponse.json({
      items: [...dueItems, ...newItems],
      due_count: dueItems.length,
      new_count: newItems.length,
    });
  } catch (error) {
    console.error('GET /api/fsrs/due error', error);
    return NextResponse.json({ error: 'No se pudieron cargar repasos pendientes' }, { status: 500 });
  }
}
