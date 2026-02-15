'use client';

import { use, useEffect, useMemo, useState } from 'react';
import { AlertCircle, ChevronDown, ChevronUp, Layers, Loader2, Search } from 'lucide-react';
import { AuthGuard } from '@/components/auth-guard';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { createClient } from '@/lib/supabase/client';
import { useAuth } from '@/lib/auth-context';
import { useCenterOpposition } from '../use-center-opposition';

type FlashcardRow = {
  id: string;
  front: string;
  back: string;
  tags: string[] | null;
  difficulty: number;
  created_at: string;
};

type DueItem = {
  item_id: string;
  item_type: 'question' | 'flashcard';
  is_new: boolean;
};

export default function OppositionFlashcardsPage({
  params,
}: {
  params: Promise<{ slug: string; oppositionSlug: string }>;
}) {
  const { slug, oppositionSlug } = use(params);
  const { user } = useAuth();
  const { organization, opposition, isLoading: contextLoading, error: contextError } =
    useCenterOpposition(oppositionSlug);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [query, setQuery] = useState('');
  const [flashcards, setFlashcards] = useState<FlashcardRow[]>([]);
  const [expandedIds, setExpandedIds] = useState<string[]>([]);
  const [dueCount, setDueCount] = useState(0);

  useEffect(() => {
    if (!organization || !opposition) return;
    const currentOpposition = opposition;
    const supabase = createClient();

    async function load() {
      setLoading(true);
      setError(null);

      const { data, error: listError } = await supabase
        .from('flashcards')
        .select('id, front, back, tags, difficulty, created_at')
        .eq('oposicion_id', currentOpposition.id)
        .order('created_at', { ascending: false })
        .limit(240);

      if (listError) {
        throw new Error(listError.message);
      }

      setFlashcards((data ?? []) as FlashcardRow[]);

      if (user?.id) {
        const response = await fetch(
          `/api/fsrs/due?student_id=${user.id}&oposicion_id=${currentOpposition.id}&limit=120`,
        );

        if (response.ok) {
          const dueData = (await response.json()) as { items?: DueItem[] };
          const dueFlashcards = (dueData.items ?? []).filter(
            (item) => item.item_type === 'flashcard' && !item.is_new,
          );
          setDueCount(dueFlashcards.length);
        } else {
          setDueCount(0);
        }
      } else {
        setDueCount(0);
      }

      setLoading(false);
    }

    load().catch((loadError) => {
      setError((loadError as Error).message);
      setLoading(false);
    });
  }, [opposition, organization, user?.id]);

  const filteredFlashcards = useMemo(() => {
    const term = query.trim().toLowerCase();
    if (!term) return flashcards;
    return flashcards.filter((flashcard) => {
      const front = flashcard.front.toLowerCase();
      const back = flashcard.back.toLowerCase();
      const tags = flashcard.tags?.join(' ').toLowerCase() ?? '';
      return front.includes(term) || back.includes(term) || tags.includes(term);
    });
  }, [flashcards, query]);

  function toggleExpanded(id: string) {
    setExpandedIds((current) =>
      current.includes(id) ? current.filter((existing) => existing !== id) : [...current, id],
    );
  }

  return (
    <AuthGuard
      resource="flashcards"
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
          <div className="flex flex-wrap items-end justify-between gap-3">
            <div>
              <h2 className="text-xl font-semibold text-[#1B3A5C]">Flashcards</h2>
              <p className="text-sm text-slate-500">
                {flashcards.length} disponibles · {dueCount} pendientes de repaso FSRS
              </p>
            </div>
          </div>

          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <Input
              className="pl-9"
              placeholder="Buscar por concepto, reverso o tag..."
              value={query}
              onChange={(event) => setQuery(event.target.value)}
            />
          </div>

          {error && (
            <Card className="border-rose-200 bg-rose-50">
              <CardContent className="flex items-center gap-2 py-3 text-sm text-rose-700">
                <AlertCircle className="h-4 w-4" />
                {error}
              </CardContent>
            </Card>
          )}

          {filteredFlashcards.length === 0 ? (
            <Card className="border-slate-200">
              <CardContent className="py-10 text-center text-sm text-slate-500">
                No hay flashcards para esta oposición.
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-3 md:grid-cols-2">
              {filteredFlashcards.map((flashcard) => {
                const expanded = expandedIds.includes(flashcard.id);
                return (
                  <Card key={flashcard.id} className="border-slate-200">
                    <CardHeader className="pb-3">
                      <CardDescription className="flex items-center justify-between">
                        <span>Dificultad {flashcard.difficulty}/5</span>
                        <button
                          type="button"
                          onClick={() => toggleExpanded(flashcard.id)}
                          className="inline-flex items-center gap-1 text-xs text-[#1B3A5C] hover:underline"
                        >
                          {expanded ? (
                            <>
                              Ocultar <ChevronUp className="h-3.5 w-3.5" />
                            </>
                          ) : (
                            <>
                              Mostrar <ChevronDown className="h-3.5 w-3.5" />
                            </>
                          )}
                        </button>
                      </CardDescription>
                      <CardTitle className="text-base text-slate-900">{flashcard.front}</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      {expanded ? (
                        <p className="rounded-md border border-slate-200 bg-slate-50 p-3 text-sm text-slate-700">
                          {flashcard.back}
                        </p>
                      ) : (
                        <p className="text-sm text-slate-500">Pulsa “Mostrar” para ver la respuesta.</p>
                      )}

                      {flashcard.tags?.length ? (
                        <div className="flex flex-wrap gap-1">
                          {flashcard.tags.map((tag) => (
                            <span
                              key={`${flashcard.id}-${tag}`}
                              className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2 py-0.5 text-xs text-slate-600"
                            >
                              <Layers className="h-3 w-3" />
                              {tag}
                            </span>
                          ))}
                        </div>
                      ) : null}
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </div>
      )}
    </AuthGuard>
  );
}
