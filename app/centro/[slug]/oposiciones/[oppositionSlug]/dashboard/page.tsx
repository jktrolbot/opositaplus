'use client';

import { use, useEffect, useMemo, useState } from 'react';
import { Activity, BookOpenText, GraduationCap, Layers, Loader2, Users } from 'lucide-react';
import { AuthGuard } from '@/components/auth-guard';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { createClient } from '@/lib/supabase/client';
import { storage } from '@/lib/storage';
import { useCenterOpposition } from '../use-center-opposition';

type DashboardStats = {
  questions: number;
  flashcards: number;
  chunks: number;
  activeStudents: number;
};

export default function OppositionDashboardTabPage({
  params,
}: {
  params: Promise<{ slug: string; oppositionSlug: string }>;
}) {
  const { slug, oppositionSlug } = use(params);
  const { organization, opposition, isLoading: contextLoading, error: contextError } =
    useCenterOpposition(oppositionSlug);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [stats, setStats] = useState<DashboardStats>({
    questions: 0,
    flashcards: 0,
    chunks: 0,
    activeStudents: 0,
  });

  useEffect(() => {
    if (!organization || !opposition) return;
    const currentOrganization = organization;
    const currentOpposition = opposition;
    const supabase = createClient();

    async function load() {
      setLoading(true);
      setError(null);

      const [questionsRes, flashcardsRes, chunksRes, studentsRes] = await Promise.all([
        supabase
          .from('generated_questions')
          .select('id', { head: true, count: 'exact' })
          .eq('oposicion_id', currentOpposition.id),
        supabase
          .from('flashcards')
          .select('id', { head: true, count: 'exact' })
          .eq('oposicion_id', currentOpposition.id),
        supabase
          .from('knowledge_chunks')
          .select('id', { head: true, count: 'exact' })
          .eq('oposicion_id', currentOpposition.id),
        supabase
          .from('student_progress')
          .select('student_id')
          .eq('center_id', currentOrganization.id)
          .eq('oposicion_id', currentOpposition.id),
      ]);

      if (questionsRes.error) throw new Error(questionsRes.error.message);
      if (flashcardsRes.error) throw new Error(flashcardsRes.error.message);
      if (chunksRes.error) throw new Error(chunksRes.error.message);
      if (studentsRes.error) throw new Error(studentsRes.error.message);

      const activeStudents = new Set(
        (studentsRes.data ?? []).map((row) => row.student_id),
      ).size;

      setStats({
        questions: questionsRes.count ?? 0,
        flashcards: flashcardsRes.count ?? 0,
        chunks: chunksRes.count ?? 0,
        activeStudents,
      });
      setLoading(false);
    }

    load().catch((loadError) => {
      setError((loadError as Error).message);
      setLoading(false);
    });
  }, [opposition, organization]);

  const progress = useMemo(
    () => (opposition ? storage.forOposicion(opposition.slug).getProgress() : null),
    [opposition],
  );
  const history = useMemo(
    () => (opposition ? storage.forOposicion(opposition.slug).getTestHistory() : []),
    [opposition],
  );

  return (
    <AuthGuard
      allowedRoles={['centro_admin', 'super_admin']}
      resource="center"
      action="manage"
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
          <div>
            <h2 className="text-xl font-semibold text-[#1B3A5C]">Dashboard de oposición</h2>
            <p className="text-sm text-slate-500">Métricas operativas y progreso para {opposition?.name}.</p>
          </div>

          {error ? (
            <Card className="border-rose-200 bg-rose-50">
              <CardContent className="py-3 text-sm text-rose-700">{error}</CardContent>
            </Card>
          ) : null}

          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <Card className="border-slate-200">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardDescription>Preguntas IA</CardDescription>
                <GraduationCap className="h-4 w-4 text-slate-500" />
              </CardHeader>
              <CardContent>
                <CardTitle className="text-3xl">{stats.questions}</CardTitle>
              </CardContent>
            </Card>

            <Card className="border-slate-200">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardDescription>Flashcards</CardDescription>
                <Layers className="h-4 w-4 text-slate-500" />
              </CardHeader>
              <CardContent>
                <CardTitle className="text-3xl">{stats.flashcards}</CardTitle>
              </CardContent>
            </Card>

            <Card className="border-slate-200">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardDescription>Chunks KB</CardDescription>
                <BookOpenText className="h-4 w-4 text-slate-500" />
              </CardHeader>
              <CardContent>
                <CardTitle className="text-3xl">{stats.chunks}</CardTitle>
              </CardContent>
            </Card>

            <Card className="border-slate-200">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardDescription>Alumnos activos</CardDescription>
                <Users className="h-4 w-4 text-slate-500" />
              </CardHeader>
              <CardContent>
                <CardTitle className="text-3xl">{stats.activeStudents}</CardTitle>
              </CardContent>
            </Card>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <Card className="border-slate-200">
              <CardHeader>
                <CardTitle>Progreso de tests (cliente)</CardTitle>
                <CardDescription>Datos de práctica almacenados en el navegador.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-2 text-sm text-slate-700">
                <p>
                  Tests completados: <strong>{progress?.testsCompleted ?? 0}</strong>
                </p>
                <p>
                  Media de acierto: <strong>{progress?.averageScore ?? 0}%</strong>
                </p>
                <p>
                  Racha de estudio: <strong>{progress?.studyStreak ?? 0}</strong> días
                </p>
              </CardContent>
            </Card>

            <Card className="border-slate-200">
              <CardHeader>
                <CardTitle>Actividad reciente</CardTitle>
                <CardDescription>Últimos intentos de test en esta oposición.</CardDescription>
              </CardHeader>
              <CardContent>
                {history.length === 0 ? (
                  <p className="text-sm text-slate-500">Sin actividad registrada aún.</p>
                ) : (
                  <div className="space-y-2">
                    {history
                      .slice(-5)
                      .reverse()
                      .map((result) => (
                        <div key={result.id} className="flex items-center justify-between rounded-md border border-slate-200 p-2">
                          <div>
                            <p className="text-sm font-medium text-slate-900">{result.topic}</p>
                            <p className="text-xs text-slate-500">
                              {new Date(result.date).toLocaleDateString('es-ES')}
                            </p>
                          </div>
                          <div className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-700">
                            <Activity className="h-3 w-3" />
                            {Math.round(result.score * 100)}%
                          </div>
                        </div>
                      ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      )}
    </AuthGuard>
  );
}
