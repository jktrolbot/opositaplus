'use client';

import { useMemo } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { Award, Clock, Flame, MessageCircle, RotateCcw, Target } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { oposiciones } from '@/data/oposiciones';
import { storage } from '@/lib/storage';
import { OposicionNotFound } from '@/components/oposiciones/not-found';
import { OposicionPageHeader } from '@/components/oposiciones/page-header';

export default function OposicionDashboardPage() {
  const params = useParams<{ slug: string }>();
  const slug = typeof params?.slug === 'string' ? params.slug : '';
  const oposicion = useMemo(() => oposiciones.find((item) => item.slug === slug), [slug]);
  const progress = useMemo(
    () => (oposicion ? storage.forOposicion(oposicion.slug).getProgress() : null),
    [oposicion],
  );
  const history = useMemo(
    () => (oposicion ? storage.forOposicion(oposicion.slug).getTestHistory() : []),
    [oposicion],
  );

  if (!oposicion) {
    return <OposicionNotFound />;
  }

  const safeProgress = progress ?? {
    testsCompleted: 0,
    averageScore: 0,
    studyStreak: 0,
    totalStudyTime: 0,
    lastStudyDate: new Date().toISOString(),
    topicScores: {},
  };

  const weeklyData = history.slice(-7).map((result, index) => ({
    name: `Dia ${index + 1}`,
    puntuacion: Math.round(result.score * 100),
  }));

  const topicData = Object.entries(safeProgress.topicScores)
    .map(([topic, scores]) => ({
      name: topic.length > 20 ? `${topic.slice(0, 20)}...` : topic,
      porcentaje: scores.total > 0 ? Math.round((scores.correct / scores.total) * 100) : 0,
    }))
    .sort((a, b) => b.porcentaje - a.porcentaje);

  const formatTime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    return `${hours}h ${mins}m`;
  };

  return (
    <main className="min-h-screen bg-slate-50">
      <OposicionPageHeader oposicion={oposicion} current="Dashboard" />

      <section className="mx-auto max-w-6xl px-4 py-6">
        <h2 className="mb-5 text-2xl font-bold text-slate-900">Panel de progreso</h2>

        <div className="mb-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Racha</CardTitle>
              <Flame className="h-5 w-5 text-amber-500" />
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold text-slate-900">{safeProgress.studyStreak}</p>
              <p className="text-xs text-slate-500">dias consecutivos</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Tests</CardTitle>
              <Target className="h-5 w-5 text-emerald-600" />
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold text-slate-900">{safeProgress.testsCompleted}</p>
              <p className="text-xs text-slate-500">completados</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Media</CardTitle>
              <Award className="h-5 w-5 text-indigo-600" />
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold text-slate-900">{safeProgress.averageScore}%</p>
              <p className="text-xs text-slate-500">acierto acumulado</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Tiempo</CardTitle>
              <Clock className="h-5 w-5 text-slate-700" />
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold text-slate-900">{formatTime(safeProgress.totalStudyTime)}</p>
              <p className="text-xs text-slate-500">dedicado</p>
            </CardContent>
          </Card>
        </div>

        <div className="mb-6 grid gap-4 xl:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Progreso semanal</CardTitle>
              <CardDescription>Ultimos resultados guardados en esta oposicion.</CardDescription>
            </CardHeader>
            <CardContent>
              {weeklyData.length > 0 ? (
                <ResponsiveContainer width="100%" height={250}>
                  <LineChart data={weeklyData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip />
                    <Line type="monotone" dataKey="puntuacion" stroke="#0f172a" strokeWidth={2} />
                  </LineChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex h-[250px] items-center justify-center text-sm text-slate-500">
                  Aun no hay actividad registrada.
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Rendimiento por tema</CardTitle>
              <CardDescription>Comparativa de fortalezas y lagunas.</CardDescription>
            </CardHeader>
            <CardContent>
              {topicData.length > 0 ? (
                <ResponsiveContainer width="100%" height={250}>
                  <BarChart data={topicData} layout="vertical" margin={{ left: 12 }}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis type="number" />
                    <YAxis type="category" dataKey="name" width={110} />
                    <Tooltip />
                    <Bar dataKey="porcentaje" fill="#334155" />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex h-[250px] items-center justify-center text-sm text-slate-500">
                  Realiza tests de distintos bloques para activar el analisis.
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Acciones rapidas</CardTitle>
            <CardDescription>Avanza desde el panel sin salir de tu itinerario.</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-3 sm:grid-cols-3">
            <Link href={`/oposiciones/${oposicion.slug}/test`}>
              <Button className="h-14 w-full bg-slate-900 text-white hover:bg-slate-700">
                <Target className="mr-2 h-5 w-5" />
                Hacer test
              </Button>
            </Link>
            <Link href={`/oposiciones/${oposicion.slug}/tutor`}>
              <Button className="h-14 w-full bg-indigo-700 text-white hover:bg-indigo-600">
                <MessageCircle className="mr-2 h-5 w-5" />
                Consultar tutor
              </Button>
            </Link>
            <Link href={`/oposiciones/${oposicion.slug}/review`}>
              <Button className="h-14 w-full bg-amber-600 text-white hover:bg-amber-500">
                <RotateCcw className="mr-2 h-5 w-5" />
                Repasar fallos
              </Button>
            </Link>
          </CardContent>
        </Card>

        {history.length > 0 && (
          <Card className="mt-6">
            <CardHeader>
              <CardTitle>Actividad reciente</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {history
                .slice(-5)
                .reverse()
                .map((result) => (
                  <div key={result.id} className="flex items-center justify-between rounded-lg border border-slate-200 p-3">
                    <div>
                      <p className="font-medium text-slate-900">{result.topic}</p>
                      <p className="text-xs text-slate-500">{new Date(result.date).toLocaleDateString('es-ES')}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-lg font-semibold text-slate-900">{Math.round(result.score * 100)}%</p>
                      <p className="text-xs text-slate-500">{result.totalQuestions} preguntas</p>
                    </div>
                  </div>
                ))}
            </CardContent>
          </Card>
        )}
      </section>
    </main>
  );
}
