'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { AlertCircle, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { oposiciones } from '@/data/oposiciones';
import { getQuestionsByOposicion } from '@/data/questions';
import type { Question } from '@/data/questions/types';
import { storage } from '@/lib/storage';
import { OposicionNotFound } from '@/components/oposiciones/not-found';
import { OposicionPageHeader } from '@/components/oposiciones/page-header';

export default function OposicionSimulacroPage() {
  const params = useParams<{ slug: string }>();
  const slug = typeof params?.slug === 'string' ? params.slug : '';
  const oposicion = useMemo(() => oposiciones.find((item) => item.slug === slug), [slug]);

  const [started, setStarted] = useState(false);
  const [examQuestions, setExamQuestions] = useState<Question[]>([]);
  const [userAnswers, setUserAnswers] = useState<Record<number, number>>({});
  const [timeLeft, setTimeLeft] = useState(90 * 60);
  const [finished, setFinished] = useState(false);
  const [results, setResults] = useState<{
    correct: number;
    total: number;
    percentage: number;
    timeUsed: number;
    topicBreakdown: Record<string, { correct: number; total: number }>;
  } | null>(null);

  const startExam = () => {
    if (!oposicion) return;
    const pool = getQuestionsByOposicion(oposicion.slug);
    const selectedCount = Math.min(60, pool.length);
    const shuffled = [...pool].sort(() => Math.random() - 0.5);
    setExamQuestions(shuffled.slice(0, selectedCount));
    setUserAnswers({});
    setStarted(true);
    setFinished(false);
    setResults(null);
    setTimeLeft(90 * 60);
  };

  const handleAnswer = (index: number, answer: number) => {
    setUserAnswers((previous) => ({ ...previous, [index]: answer }));
  };

  const handleFinish = useCallback(() => {
    if (!oposicion || examQuestions.length === 0) return;

    const correct = examQuestions.reduce((count, question, index) => {
      return count + (userAnswers[index] === question.correct ? 1 : 0);
    }, 0);

    const topicBreakdown = examQuestions.reduce<Record<string, { correct: number; total: number }>>((acc, question, index) => {
      if (!acc[question.topic]) acc[question.topic] = { correct: 0, total: 0 };
      acc[question.topic].total += 1;
      if (userAnswers[index] === question.correct) acc[question.topic].correct += 1;
      return acc;
    }, {});

    const total = examQuestions.length;
    const percentage = Math.round((correct / total) * 100);

    setResults({
      correct,
      total,
      percentage,
      timeUsed: 90 * 60 - timeLeft,
      topicBreakdown,
    });

    storage.forOposicion(oposicion.slug).addTestResult({
      id: `simulacro-${Date.now()}`,
      date: new Date().toISOString(),
      topic: 'Simulacro oficial',
      score: correct / total,
      totalQuestions: total,
      timeSpent: 90 * 60 - timeLeft,
      wrongAnswers: examQuestions
        .filter((question, index) => userAnswers[index] !== question.correct)
        .map((question) => question.id),
    });

    setFinished(true);
  }, [examQuestions, userAnswers, timeLeft, oposicion]);

  useEffect(() => {
    if (!started || finished) return;

    const timer = setInterval(() => {
      setTimeLeft((previous) => {
        if (previous <= 1) {
          handleFinish();
          return 0;
        }
        return previous - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [started, finished, handleFinish]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  if (!oposicion) {
    return <OposicionNotFound />;
  }

  const topicMap = Object.fromEntries(oposicion.topics.map((topic) => [topic.id, topic.name]));

  if (!started) {
    return (
      <main className="min-h-screen bg-slate-50">
        <OposicionPageHeader oposicion={oposicion} current="Simulacro" />
        <section className="mx-auto max-w-3xl px-4 py-10">
          <Card>
            <CardHeader className="text-center">
              <div className="mx-auto mb-3 inline-flex h-16 w-16 items-center justify-center rounded-full bg-slate-900 text-white">
                <Clock className="h-8 w-8" />
              </div>
              <CardTitle>Simulacro de examen</CardTitle>
              <CardDescription>Entrenamiento en formato oficial para {oposicion.name}.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="rounded-lg border border-blue-200 bg-blue-50 p-4 text-sm text-blue-900">
                <div className="mb-2 flex items-start gap-2">
                  <AlertCircle className="mt-0.5 h-4 w-4" />
                  <p className="font-medium">Condiciones del simulacro</p>
                </div>
                <ul className="list-disc space-y-1 pl-6">
                  <li>{Math.min(60, oposicion.totalQuestions)} preguntas</li>
                  <li>90 minutos de tiempo maximo</li>
                  <li>Correccion final con desglose por tema</li>
                </ul>
              </div>

              <Button onClick={startExam} className="w-full bg-slate-900 text-white hover:bg-slate-700">
                Comenzar simulacro
              </Button>
            </CardContent>
          </Card>
        </section>
      </main>
    );
  }

  if (finished && results) {
    const errors = results.total - results.correct;
    const officialScore = Math.max(0, results.correct - errors / 3).toFixed(2);

    return (
      <main className="min-h-screen bg-slate-50">
        <OposicionPageHeader oposicion={oposicion} current="Simulacro" />
        <section className="mx-auto max-w-4xl px-4 py-8">
          <Card>
            <CardHeader className="text-center">
              <CardTitle className="text-3xl">Resultado del simulacro</CardTitle>
              <CardDescription>Analisis de rendimiento por bloques del temario.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid gap-4 sm:grid-cols-3">
                <div className="rounded-xl bg-slate-900 p-4 text-center text-white">
                  <p className="text-3xl font-bold">{results.percentage}%</p>
                  <p className="text-sm text-slate-200">Aciertos</p>
                </div>
                <div className="rounded-xl bg-slate-100 p-4 text-center">
                  <p className="text-3xl font-bold text-slate-900">{officialScore}</p>
                  <p className="text-sm text-slate-600">Nota estimada</p>
                </div>
                <div className="rounded-xl bg-slate-100 p-4 text-center">
                  <p className="text-3xl font-bold text-slate-900">{formatTime(results.timeUsed)}</p>
                  <p className="text-sm text-slate-600">Tiempo empleado</p>
                </div>
              </div>

              <div>
                <h3 className="mb-3 font-semibold text-slate-900">Desglose por temas</h3>
                <div className="space-y-2">
                  {Object.entries(results.topicBreakdown).map(([topic, data]) => (
                    <div key={topic} className="rounded-lg border border-slate-200 bg-white p-3">
                      <div className="mb-2 flex items-center justify-between text-sm">
                        <span className="font-medium text-slate-900">{topicMap[topic] ?? topic}</span>
                        <span className="text-slate-600">
                          {data.correct}/{data.total}
                        </span>
                      </div>
                      <Progress value={(data.correct / data.total) * 100} className="h-2" />
                    </div>
                  ))}
                </div>
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                <Button variant="outline" onClick={startExam}>
                  Repetir simulacro
                </Button>
                <Button asChild className="bg-slate-900 text-white hover:bg-slate-700">
                  <Link href={`/oposiciones/${oposicion.slug}/dashboard`}>Ir al dashboard</Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        </section>
      </main>
    );
  }

  const answeredCount = Object.keys(userAnswers).length;
  const progressValue = examQuestions.length > 0 ? (answeredCount / examQuestions.length) * 100 : 0;

  return (
    <main className="min-h-screen bg-slate-50">
      <OposicionPageHeader oposicion={oposicion} current="Simulacro" />
      <section className="mx-auto max-w-5xl px-4 py-6">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <Badge variant="outline">
            {answeredCount}/{examQuestions.length} respondidas
          </Badge>
          <div className={`flex items-center gap-2 rounded-lg px-3 py-1.5 text-sm ${timeLeft < 600 ? 'bg-rose-100 text-rose-700' : 'bg-slate-100 text-slate-700'}`}>
            <Clock className="h-4 w-4" />
            <span className="font-mono font-semibold">{formatTime(timeLeft)}</span>
          </div>
        </div>

        <Progress value={progressValue} className="mb-6 h-2" />

        <div className="space-y-5">
          {examQuestions.map((question, index) => (
            <Card key={question.id}>
              <CardHeader>
                <div className="mb-2 flex items-center justify-between gap-2">
                  <Badge>{index + 1}</Badge>
                  <Badge variant="outline">{topicMap[question.topic] ?? question.topic}</Badge>
                </div>
                <CardTitle className="text-lg leading-relaxed">{question.question}</CardTitle>
              </CardHeader>
              <CardContent>
                <RadioGroup
                  value={userAnswers[index] !== undefined ? String(userAnswers[index]) : ''}
                  onValueChange={(value) => handleAnswer(index, Number.parseInt(value, 10))}
                >
                  <div className="space-y-2">
                    {question.options.map((option, optionIndex) => (
                      <div
                        key={optionIndex}
                        className={`flex items-center gap-3 rounded-lg border-2 p-3 ${
                          userAnswers[index] === optionIndex
                            ? 'border-slate-900 bg-slate-50'
                            : 'border-slate-200 bg-white hover:border-slate-400'
                        }`}
                      >
                        <RadioGroupItem value={String(optionIndex)} id={`q-${index}-option-${optionIndex}`} />
                        <Label htmlFor={`q-${index}-option-${optionIndex}`} className="flex-1 cursor-pointer">
                          {option}
                        </Label>
                      </div>
                    ))}
                  </div>
                </RadioGroup>
              </CardContent>
            </Card>
          ))}
        </div>

        <Card className="sticky bottom-4 mt-6 border-slate-300">
          <CardContent className="flex flex-wrap items-center justify-between gap-4 py-4">
            <div>
              <p className="font-semibold text-slate-900">
                {answeredCount === examQuestions.length
                  ? 'Todas las preguntas respondidas'
                  : `${examQuestions.length - answeredCount} preguntas pendientes`}
              </p>
              <p className="text-sm text-slate-600">Finaliza cuando quieras corregir el simulacro.</p>
            </div>
            <Button onClick={handleFinish} className="bg-slate-900 text-white hover:bg-slate-700">
              Finalizar simulacro
            </Button>
          </CardContent>
        </Card>
      </section>
    </main>
  );
}
