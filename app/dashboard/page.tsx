'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { storage } from '@/lib/storage';
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Target, MessageCircle, RotateCcw, TrendingUp, Clock, Award, Flame } from 'lucide-react';

export default function DashboardPage() {
  const [progress, setProgress] = useState(storage.getProgress());
  const [history, setHistory] = useState(storage.getTestHistory());

  useEffect(() => {
    setProgress(storage.getProgress());
    setHistory(storage.getTestHistory());
  }, []);

  // Weekly progress data
  const weeklyData = history.slice(-7).map((result, i) => ({
    name: `Día ${i + 1}`,
    puntuación: Math.round(result.score * 100),
  }));

  // Topic strength data
  const topicData = Object.entries(progress.topicScores).map(([topic, scores]) => ({
    name: topic.substring(0, 20),
    porcentaje: Math.round((scores.correct / scores.total) * 100) || 0,
  })).sort((a, b) => b.porcentaje - a.porcentaje);

  const formatTime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    return `${hours}h ${mins}m`;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#F8FAFC] via-white to-[#F8FAFC]">
      {/* Header */}
      <header className="border-b bg-white/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <Link href="/" className="text-2xl font-bold text-[#1B3A5C]">Oposita+</Link>
          <nav className="hidden md:flex gap-6">
            <Link href="/dashboard" className="text-[#10B981] font-semibold">Panel</Link>
            <Link href="/test" className="text-gray-700 hover:text-[#1B3A5C]">Tests</Link>
            <Link href="/tutor" className="text-gray-700 hover:text-[#1B3A5C]">Preparador</Link>
            <Link href="/planner" className="text-gray-700 hover:text-[#1B3A5C]">Planificador</Link>
            <Link href="/review" className="text-gray-700 hover:text-[#1B3A5C]">Repasar</Link>
            <Link href="/simulacro" className="text-gray-700 hover:text-[#1B3A5C]">Simulacro</Link>
          </nav>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8">
        <h1 className="text-4xl font-bold text-[#1B3A5C] mb-8">Tu Panel de Control</h1>

        {/* Stats Cards */}
        <div className="grid md:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Racha de estudio</CardTitle>
              <Flame className="h-5 w-5 text-[#F59E0B]" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-[#1B3A5C]">{progress.studyStreak}</div>
              <p className="text-xs text-gray-500 mt-1">días consecutivos</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Tests completados</CardTitle>
              <Target className="h-5 w-5 text-[#10B981]" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-[#1B3A5C]">{progress.testsCompleted}</div>
              <p className="text-xs text-gray-500 mt-1">este mes</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Puntuación media</CardTitle>
              <Award className="h-5 w-5 text-[#F59E0B]" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-[#1B3A5C]">{progress.averageScore}%</div>
              <p className="text-xs text-gray-500 mt-1">en todos los tests</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Tiempo estudiado</CardTitle>
              <Clock className="h-5 w-5 text-[#10B981]" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-[#1B3A5C]">{formatTime(progress.totalStudyTime)}</div>
              <p className="text-xs text-gray-500 mt-1">tiempo total</p>
            </CardContent>
          </Card>
        </div>

        {/* Charts */}
        <div className="grid md:grid-cols-2 gap-8 mb-8">
          <Card>
            <CardHeader>
              <CardTitle>Progreso Semanal</CardTitle>
              <CardDescription>Evolución de tus puntuaciones</CardDescription>
            </CardHeader>
            <CardContent>
              {weeklyData.length > 0 ? (
                <ResponsiveContainer width="100%" height={250}>
                  <LineChart data={weeklyData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip />
                    <Line type="monotone" dataKey="puntuación" stroke="#10B981" strokeWidth={2} />
                  </LineChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-[250px] flex items-center justify-center text-gray-500">
                  Completa tu primer test para ver tu progreso
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Puntos Fuertes y Débiles</CardTitle>
              <CardDescription>Por tema</CardDescription>
            </CardHeader>
            <CardContent>
              {topicData.length > 0 ? (
                <ResponsiveContainer width="100%" height={250}>
                  <BarChart data={topicData} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis type="number" />
                    <YAxis dataKey="name" type="category" width={100} />
                    <Tooltip />
                    <Bar dataKey="porcentaje" fill="#10B981" />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-[250px] flex items-center justify-center text-gray-500">
                  Completa tests de diferentes temas para ver tus fortalezas
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Quick Actions */}
        <Card>
          <CardHeader>
            <CardTitle>Acciones Rápidas</CardTitle>
            <CardDescription>¿Qué quieres hacer hoy?</CardDescription>
          </CardHeader>
          <CardContent className="grid md:grid-cols-3 gap-4">
            <Link href="/test">
              <Button className="w-full bg-[#10B981] hover:bg-[#059669] text-white h-20 text-lg">
                <Target className="mr-2 h-6 w-6" />
                Hacer Test
              </Button>
            </Link>
            <Link href="/tutor">
              <Button className="w-full bg-[#1B3A5C] hover:bg-[#152e4a] text-white h-20 text-lg">
                <MessageCircle className="mr-2 h-6 w-6" />
                Consultar Dudas
              </Button>
            </Link>
            <Link href="/review">
              <Button className="w-full bg-[#F59E0B] hover:bg-[#D97706] text-white h-20 text-lg">
                <RotateCcw className="mr-2 h-6 w-6" />
                Repasar Errores
              </Button>
            </Link>
          </CardContent>
        </Card>

        {/* Recent Activity */}
        {history.length > 0 && (
          <Card className="mt-8">
            <CardHeader>
              <CardTitle>Actividad Reciente</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {history.slice(-5).reverse().map((result) => (
                  <div key={result.id} className="flex items-center justify-between border-b pb-4 last:border-0">
                    <div>
                      <div className="font-semibold text-[#1B3A5C]">{result.topic}</div>
                      <div className="text-sm text-gray-500">
                        {new Date(result.date).toLocaleDateString('es-ES')}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-2xl font-bold text-[#10B981]">
                        {Math.round(result.score * 100)}%
                      </div>
                      <div className="text-xs text-gray-500">
                        {result.totalQuestions} preguntas
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
