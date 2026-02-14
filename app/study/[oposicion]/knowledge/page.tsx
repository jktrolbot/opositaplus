'use client';

import { useEffect, useMemo, useState } from 'react';
import { useParams } from 'next/navigation';
import { BookOpenText, Loader2, Search, Sparkles } from 'lucide-react';
import { AuthGuard } from '@/components/auth-guard';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { createClient } from '@/lib/supabase/client';
import { useAuth } from '@/lib/auth-context';

type SearchChunk = {
  id: string;
  tema: string | null;
  subtema: string | null;
  chunk_text: string;
  tags: string[] | null;
  similarity: number;
  related_questions: Array<{
    id: string;
    question_text: string;
    options: Array<{ key: string; text: string }>;
    explanation: string | null;
    difficulty: number;
    quality_score: number | null;
  }>;
  related_flashcards: Array<{
    id: string;
    front: string;
    back: string;
    tags: string[];
    difficulty: number;
  }>;
};

type DueItem = {
  item_id: string;
  item_type: 'question' | 'flashcard';
  next_review: string | null;
  is_new: boolean;
  data: Record<string, unknown>;
};

const RATING_OPTIONS = [
  { value: 1, label: 'Muy difícil' },
  { value: 2, label: 'Difícil' },
  { value: 3, label: 'Bien' },
  { value: 4, label: 'Muy fácil' },
] as const;

export default function KnowledgeStudyPage() {
  const params = useParams<{ oposicion: string }>();
  const oposicionSlug = typeof params?.oposicion === 'string' ? params.oposicion : '';
  const { user } = useAuth();

  const [oposicion, setOposicion] = useState<{ id: string; name: string } | null>(null);
  const [query, setQuery] = useState('');
  const [searching, setSearching] = useState(false);
  const [chunks, setChunks] = useState<SearchChunk[]>([]);
  const [dueItems, setDueItems] = useState<DueItem[]>([]);
  const [dueLoading, setDueLoading] = useState(true);
  const [ratingBusyId, setRatingBusyId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!oposicionSlug) return;
    const supabase = createClient();

    supabase
      .from('oppositions')
      .select('id, name')
      .eq('slug', oposicionSlug)
      .maybeSingle()
      .then(({ data }) => {
        setOposicion(data ?? null);
      });
  }, [oposicionSlug]);

  async function loadDueItems(currentOposicionId: string, studentId: string) {
    setDueLoading(true);
    try {
      const response = await fetch(
        `/api/fsrs/due?student_id=${studentId}&oposicion_id=${currentOposicionId}&limit=30`,
      );
      if (!response.ok) {
        throw new Error('No se pudieron cargar los repasos pendientes');
      }

      const data = (await response.json()) as { items?: DueItem[] };
      setDueItems(data.items ?? []);
    } catch (loadError) {
      setError((loadError as Error).message);
    } finally {
      setDueLoading(false);
    }
  }

  useEffect(() => {
    if (!user?.id || !oposicion?.id) return;
    loadDueItems(oposicion.id, user.id).catch(() => {});
  }, [oposicion?.id, user?.id]);

  const dueCount = useMemo(
    () => dueItems.filter((item) => !item.is_new).length,
    [dueItems],
  );

  async function searchKnowledge() {
    if (!query.trim()) return;
    setSearching(true);
    setError(null);

    try {
      const response = await fetch('/api/knowledge/search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          query,
          oposicion: oposicionSlug,
          limit: 12,
        }),
      });

      if (!response.ok) {
        const data = (await response.json()) as { error?: string };
        throw new Error(data.error ?? 'No se pudo realizar la búsqueda');
      }

      const data = (await response.json()) as { chunks?: SearchChunk[] };
      setChunks(data.chunks ?? []);
    } catch (searchError) {
      setError((searchError as Error).message);
    } finally {
      setSearching(false);
    }
  }

  async function sendReview(itemId: string, itemType: 'question' | 'flashcard', rating: 1 | 2 | 3 | 4) {
    if (!user?.id) return;
    setRatingBusyId(itemId);
    setError(null);

    try {
      const response = await fetch('/api/fsrs/review', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          student_id: user.id,
          item_id: itemId,
          item_type: itemType,
          rating,
        }),
      });

      if (!response.ok) {
        const data = (await response.json()) as { error?: string };
        throw new Error(data.error ?? 'No se pudo registrar el repaso');
      }

      if (oposicion?.id) {
        await loadDueItems(oposicion.id, user.id);
      }
    } catch (reviewError) {
      setError((reviewError as Error).message);
    } finally {
      setRatingBusyId(null);
    }
  }

  return (
    <AuthGuard>
      <main className="min-h-screen bg-slate-50">
        <section className="mx-auto max-w-6xl px-4 py-8">
          <div className="mb-6">
            <h1 className="text-2xl font-bold text-[#1B3A5C]">Knowledge Base IA</h1>
            <p className="text-sm text-slate-500">
              {oposicion ? `Estudio semántico para ${oposicion.name}` : 'Cargando oposición...'}
            </p>
          </div>

          <Card className="mb-5">
            <CardHeader>
              <CardTitle>Buscar por tema</CardTitle>
              <CardDescription>
                Escribe una duda o concepto y obtén contenido relevante + material de repaso.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col gap-2 sm:flex-row">
                <input
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                  placeholder="Ej: recursos administrativos, plazos de subsanación, contratación pública..."
                  className="w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm"
                  onKeyDown={(event) => {
                    if (event.key === 'Enter') {
                      event.preventDefault();
                      searchKnowledge().catch(() => {});
                    }
                  }}
                />
                <Button
                  onClick={() => searchKnowledge()}
                  disabled={searching || !query.trim()}
                  className="bg-[#1B3A5C] text-white hover:bg-[#16314d]"
                >
                  {searching ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
                  <span className="ml-2">Buscar</span>
                </Button>
              </div>
            </CardContent>
          </Card>

          <div className="mb-5 grid gap-4 lg:grid-cols-3">
            <Card className="lg:col-span-1">
              <CardHeader>
                <CardTitle>Repasos pendientes</CardTitle>
                <CardDescription>
                  {dueLoading ? 'Cargando...' : `${dueCount} pendientes · ${dueItems.length - dueCount} nuevos`}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {dueLoading ? (
                  <div className="flex items-center gap-2 text-sm text-slate-500">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Cargando repasos...
                  </div>
                ) : dueItems.length === 0 ? (
                  <p className="text-sm text-slate-500">No tienes repasos activos para esta oposición.</p>
                ) : (
                  dueItems.slice(0, 8).map((item) => (
                    <div key={item.item_id} className="rounded-md border border-slate-200 p-3">
                      <p className="text-xs uppercase tracking-wide text-slate-500">{item.item_type}</p>
                      <p className="line-clamp-3 text-sm text-slate-800">
                        {item.item_type === 'question'
                          ? (item.data.question_text as string)
                          : (item.data.front as string)}
                      </p>
                      <div className="mt-2 flex flex-wrap gap-1">
                        {RATING_OPTIONS.map((option) => (
                          <Button
                            key={`${item.item_id}-${option.value}`}
                            size="sm"
                            variant="outline"
                            disabled={ratingBusyId === item.item_id}
                            onClick={() =>
                              sendReview(
                                item.item_id,
                                item.item_type,
                                option.value,
                              )
                            }
                          >
                            {option.value}
                          </Button>
                        ))}
                      </div>
                    </div>
                  ))
                )}
              </CardContent>
            </Card>

            <div className="space-y-3 lg:col-span-2">
              {chunks.length === 0 ? (
                <Card>
                  <CardContent className="py-10 text-center text-sm text-slate-500">
                    <BookOpenText className="mx-auto mb-2 h-8 w-8 text-slate-300" />
                    Usa la búsqueda semántica para encontrar contenido procesado por IA.
                  </CardContent>
                </Card>
              ) : (
                chunks.map((chunk) => (
                  <Card key={chunk.id}>
                    <CardHeader>
                      <CardTitle className="text-base">
                        {chunk.tema ?? 'Tema general'}
                        {chunk.subtema ? ` · ${chunk.subtema}` : ''}
                      </CardTitle>
                      <CardDescription>
                        Similitud semántica: {(chunk.similarity * 100).toFixed(1)}%
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <p className="whitespace-pre-wrap text-sm text-slate-700">{chunk.chunk_text}</p>

                      {chunk.tags?.length ? (
                        <div className="flex flex-wrap gap-1">
                          {chunk.tags.map((tag) => (
                            <span
                              key={`${chunk.id}-${tag}`}
                              className="rounded-full bg-slate-100 px-2 py-0.5 text-xs text-slate-600"
                            >
                              {tag}
                            </span>
                          ))}
                        </div>
                      ) : null}

                      {chunk.related_questions.length > 0 && (
                        <div className="space-y-2 rounded-md border border-slate-200 bg-slate-50 p-3">
                          <p className="text-sm font-semibold text-slate-800">Preguntas relacionadas</p>
                          {chunk.related_questions.slice(0, 2).map((question) => (
                            <div key={question.id} className="rounded bg-white p-2">
                              <p className="text-sm text-slate-800">{question.question_text}</p>
                              <div className="mt-2 flex flex-wrap gap-1">
                                {RATING_OPTIONS.map((option) => (
                                  <Button
                                    key={`${question.id}-${option.value}`}
                                    size="sm"
                                    variant="outline"
                                    disabled={ratingBusyId === question.id}
                                    onClick={() => sendReview(question.id, 'question', option.value)}
                                  >
                                    {option.value}
                                  </Button>
                                ))}
                              </div>
                            </div>
                          ))}
                        </div>
                      )}

                      {chunk.related_flashcards.length > 0 && (
                        <div className="space-y-2 rounded-md border border-slate-200 bg-slate-50 p-3">
                          <p className="text-sm font-semibold text-slate-800">Flashcards relacionadas</p>
                          {chunk.related_flashcards.slice(0, 3).map((flashcard) => (
                            <div key={flashcard.id} className="rounded bg-white p-2">
                              <p className="text-xs uppercase text-slate-500">Frente</p>
                              <p className="text-sm text-slate-800">{flashcard.front}</p>
                              <p className="mt-1 text-xs uppercase text-slate-500">Reverso</p>
                              <p className="text-sm text-slate-700">{flashcard.back}</p>
                              <div className="mt-2 flex flex-wrap gap-1">
                                {RATING_OPTIONS.map((option) => (
                                  <Button
                                    key={`${flashcard.id}-${option.value}`}
                                    size="sm"
                                    variant="outline"
                                    disabled={ratingBusyId === flashcard.id}
                                    onClick={() => sendReview(flashcard.id, 'flashcard', option.value)}
                                  >
                                    {option.value}
                                  </Button>
                                ))}
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </CardContent>
                  </Card>
                ))
              )}
            </div>
          </div>

          {error && (
            <Card className="border-rose-200 bg-rose-50">
              <CardContent className="flex items-center gap-2 py-3 text-sm text-rose-700">
                <Sparkles className="h-4 w-4" />
                {error}
              </CardContent>
            </Card>
          )}
        </section>
      </main>
    </AuthGuard>
  );
}
