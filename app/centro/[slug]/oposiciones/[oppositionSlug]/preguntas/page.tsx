'use client';

import { use, useEffect, useMemo, useState } from 'react';
import { AlertCircle, Loader2 } from 'lucide-react';
import { AuthGuard } from '@/components/auth-guard';
import { QuestionEditor } from '@/components/centro/question-editor';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { createClient } from '@/lib/supabase/client';
import { useCenterOpposition } from '../use-center-opposition';

type QuestionOption = {
  key: string;
  text: string;
};

type GeneratedQuestionRow = {
  id: string;
  question_text: string;
  options: unknown;
  correct_answer: string;
  explanation: string | null;
  difficulty: number;
  validated: boolean;
  created_at: string;
};

function normalizeOptions(rawOptions: unknown): QuestionOption[] {
  if (!Array.isArray(rawOptions)) return [];

  return rawOptions
    .map((item, index) => {
      const fallbackKey = String.fromCharCode(65 + index);

      if (typeof item === 'string') {
        return { key: fallbackKey, text: item };
      }

      if (!item || typeof item !== 'object') return null;
      const record = item as Record<string, unknown>;
      const key = typeof record.key === 'string' ? record.key : fallbackKey;
      const text = typeof record.text === 'string' ? record.text : '';
      if (!text) return null;
      return { key, text };
    })
    .filter((option): option is QuestionOption => option !== null);
}

export default function OppositionQuestionsPage({
  params,
}: {
  params: Promise<{ slug: string; oppositionSlug: string }>;
}) {
  const { slug, oppositionSlug } = use(params);
  const { organization, opposition, isLoading: contextLoading, error: contextError } =
    useCenterOpposition(oppositionSlug);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [showValidated, setShowValidated] = useState(false);
  const [questions, setQuestions] = useState<GeneratedQuestionRow[]>([]);

  useEffect(() => {
    if (!organization || !opposition) return;
    const currentOpposition = opposition;
    const supabase = createClient();

    async function load() {
      setLoading(true);
      setError(null);

      const { data, error: queryError } = await supabase
        .from('generated_questions')
        .select('id, question_text, options, correct_answer, explanation, difficulty, validated, created_at')
        .eq('oposicion_id', currentOpposition.id)
        .order('created_at', { ascending: false })
        .limit(240);

      if (queryError) {
        throw new Error(queryError.message);
      }

      setQuestions((data ?? []) as GeneratedQuestionRow[]);
      setLoading(false);
    }

    load().catch((loadError) => {
      setError((loadError as Error).message);
      setLoading(false);
    });
  }, [opposition, organization]);

  const pendingCount = useMemo(
    () => questions.filter((question) => !question.validated).length,
    [questions],
  );

  const visibleQuestions = useMemo(() => {
    if (showValidated) return questions;
    return questions.filter((question) => !question.validated);
  }, [questions, showValidated]);

  async function updateQuestionRow(id: string, payload: Record<string, unknown>) {
    const supabase = createClient();
    setSaving(id);
    setError(null);

    const { error: updateError } = await supabase
      .from('generated_questions')
      .update(payload)
      .eq('id', id);

    if (updateError) {
      setSaving(null);
      throw new Error(updateError.message);
    }

    setQuestions((current) =>
      current.map((question) => (question.id === id ? { ...question, ...payload } as GeneratedQuestionRow : question)),
    );
    setSaving(null);
  }

  async function deleteQuestionRow(id: string) {
    const supabase = createClient();
    setSaving(id);
    setError(null);

    const { error: deleteError } = await supabase.from('generated_questions').delete().eq('id', id);
    if (deleteError) {
      setSaving(null);
      throw new Error(deleteError.message);
    }

    setQuestions((current) => current.filter((question) => question.id !== id));
    setSaving(null);
  }

  return (
    <AuthGuard
      resource="questions"
      action="read"
      fallbackPath={`/centro/${slug}/oposiciones/${oppositionSlug}`}
    >
      {contextLoading || loading ? (
        <div className="flex min-h-[40vh] items-center justify-center">
          <Loader2 className="h-6 w-6 animate-spin text-[#1B3A5C]" />
        </div>
      ) : contextError ? (
        <p className="text-sm text-slate-500">{contextError}</p>
      ) : (
        <div className="space-y-6">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="text-xl font-semibold text-[#1B3A5C]">Preguntas generadas</h2>
              <p className="text-sm text-slate-500">
                {pendingCount} pendientes de validación · {questions.length} totales
              </p>
            </div>
            <Button
              variant="outline"
              onClick={() => setShowValidated((current) => !current)}
              className="border-slate-200"
            >
              {showValidated ? 'Ocultar validadas' : 'Mostrar validadas'}
            </Button>
          </div>

          {error && (
            <Card className="border-rose-200 bg-rose-50">
              <CardContent className="flex items-center gap-2 py-3 text-sm text-rose-700">
                <AlertCircle className="h-4 w-4" />
                {error}
              </CardContent>
            </Card>
          )}

          {visibleQuestions.length === 0 ? (
            <Card className="border-slate-200">
              <CardContent className="py-10 text-center text-sm text-slate-500">
                No hay preguntas para los filtros seleccionados.
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {visibleQuestions.map((question) => (
                <div key={question.id} className={saving === question.id ? 'pointer-events-none opacity-70' : ''}>
                  <QuestionEditor
                    id={question.id}
                    questionText={question.question_text}
                    options={normalizeOptions(question.options)}
                    correctAnswer={question.correct_answer}
                    explanation={question.explanation}
                    difficulty={question.difficulty}
                    onValidate={async (id, validated) => {
                      try {
                        await updateQuestionRow(id, { validated });
                      } catch (validateError) {
                        setError((validateError as Error).message);
                      }
                    }}
                    onUpdate={async (id, payload) => {
                      try {
                        await updateQuestionRow(id, payload);
                      } catch (updateError) {
                        setError((updateError as Error).message);
                      }
                    }}
                    onDelete={async (id) => {
                      try {
                        await deleteQuestionRow(id);
                      } catch (deleteError) {
                        setError((deleteError as Error).message);
                      }
                    }}
                  />
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </AuthGuard>
  );
}
