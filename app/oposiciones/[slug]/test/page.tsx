'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { Check, Loader2, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { oposiciones } from '@/data/oposiciones';
import type { Question } from '@/data/questions/types';
import { storage } from '@/lib/storage';
import { OposicionNotFound } from '@/components/oposiciones/not-found';
import { OposicionPageHeader } from '@/components/oposiciones/page-header';

const questionImporters: Record<string, () => Promise<Question[]>> = {
  'xunta-a1': () => import('@/data/questions/xunta-a1.json').then((module) => module.default as Question[]),
  'xunta-a2': () => import('@/data/questions/xunta-a2.json').then((module) => module.default as Question[]),
  'tecnicos-hacienda': () =>
    import('@/data/questions/tecnicos-hacienda.json').then((module) => module.default as Question[]),
  'inspectores-hacienda': () =>
    import('@/data/questions/inspectores-hacienda.json').then((module) => module.default as Question[]),
  'age-a1': () => import('@/data/questions/age-a1.json').then((module) => module.default as Question[]),
  'justicia-auxilio': () =>
    import('@/data/questions/justicia-auxilio.json').then((module) => module.default as Question[]),
};

async function loadQuestionsBySlug(slug: string): Promise<Question[]> {
  const importer = questionImporters[slug];
  if (!importer) return [];
  return await importer();
}

export default function OposicionTestPage() {
  const params = useParams<{ slug: string }>();
  const slug = typeof params?.slug === 'string' ? params.slug : '';

  const oposicion = useMemo(() => oposiciones.find((item) => item.slug === slug), [slug]);
  const [allQuestions, setAllQuestions] = useState<Question[]>([]);
  const [loadingQuestions, setLoadingQuestions] = useState(true);

  const [selectedTopic, setSelectedTopic] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [testQuestions, setTestQuestions] = useState<Question[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState('');
  const [showExplanation, setShowExplanation] = useState(false);
  const [isCorrect, setIsCorrect] = useState(false);
  const [userAnswers, setUserAnswers] = useState<Array<{ questionId: string; correct: boolean }>>([]);
  const [startTime, setStartTime] = useState(Date.now());
  const [testComplete, setTestComplete] = useState(false);

  useEffect(() => {
    if (!oposicion) return;

    setLoadingQuestions(true);
    loadQuestionsBySlug(oposicion.slug)
      .then((questions) => setAllQuestions(questions))
      .catch(() => setAllQuestions([]))
      .finally(() => setLoadingQuestions(false));
  }, [oposicion]);

  if (!oposicion) {
    return <OposicionNotFound />;
  }

  const topicMap = Object.fromEntries(oposicion.topics.map((topic) => [topic.id, topic.name]));
  const topics = oposicion.topics;

  const startTest = async (topicId: string) => {
    setLoading(true);
    setSelectedTopic(topicId);

    try {
      const response = await fetch(`/api/generate-test?oposicion=${oposicion.slug}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          topics: topicId === 'general' ? [] : [topicId],
          difficulty: 'medium',
          count: 10,
        }),
      });

      if (!response.ok) {
        throw new Error('No se pudo generar test por API');
      }

      const data = (await response.json()) as { questions?: Question[] };
      setTestQuestions(data.questions ?? []);
    } catch {
      const topicQuestions = allQuestions.filter((question) =>
        topicId === 'general' ? true : question.topic === topicId,
      );
      const fallback = [...topicQuestions].sort(() => Math.random() - 0.5).slice(0, 10);
      setTestQuestions(fallback);
    } finally {
      setCurrentIndex(0);
      setUserAnswers([]);
      setSelectedAnswer('');
      setShowExplanation(false);
      setTestComplete(false);
      setStartTime(Date.now());
      setLoading(false);
    }
  };

  const handleAnswer = () => {
    const current = testQuestions[currentIndex];
    const selected = Number.parseInt(selectedAnswer, 10);
    const correct = selected === current.correct;

    setIsCorrect(correct);
    setShowExplanation(true);
    setUserAnswers((prev) => [...prev, { questionId: current.id, correct }]);
  };

  const completeTest = () => {
    const correctCount = userAnswers.filter((answer) => answer.correct).length;
    const totalQuestions = testQuestions.length;
    const score = totalQuestions > 0 ? correctCount / totalQuestions : 0;
    const timeSpent = Math.floor((Date.now() - startTime) / 1000);
    const wrongAnswers = userAnswers.filter((answer) => !answer.correct).map((answer) => answer.questionId);

    const topicLabel = selectedTopic && selectedTopic !== 'general' ? (topicMap[selectedTopic] ?? selectedTopic) : 'General';

    storage.forOposicion(oposicion.slug).addTestResult({
      id: `test-${Date.now()}`,
      date: new Date().toISOString(),
      topic: topicLabel,
      score,
      totalQuestions,
      timeSpent,
      wrongAnswers,
    });

    setTestComplete(true);
  };

  const handleNext = () => {
    if (currentIndex < testQuestions.length - 1) {
      setCurrentIndex((index) => index + 1);
      setSelectedAnswer('');
      setShowExplanation(false);
    } else {
      completeTest();
    }
  };

  if (testComplete) {
    const correctCount = userAnswers.filter((answer) => answer.correct).length;
    const scorePercentage = Math.round((correctCount / testQuestions.length) * 100);
    const timeSpent = Math.floor((Date.now() - startTime) / 1000);

    return (
      <main className="min-h-screen bg-slate-50">
        <OposicionPageHeader oposicion={oposicion} current="Tests" />
        <section className="mx-auto max-w-3xl px-4 py-10">
          <Card>
            <CardHeader className="text-center">
              <CardTitle className="text-3xl">Test completado</CardTitle>
              <CardDescription>
                {scorePercentage >= 80
                  ? 'Rendimiento excelente en este bloque.'
                  : 'Sigue reforzando los temas de menor acierto.'}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div className="rounded-lg bg-slate-100 p-4 text-center">
                  <p className="text-3xl font-bold text-slate-900">
                    {correctCount}/{testQuestions.length}
                  </p>
                  <p className="text-sm text-slate-600">Aciertos</p>
                </div>
                <div className="rounded-lg bg-slate-100 p-4 text-center">
                  <p className="text-3xl font-bold text-slate-900">
                    {Math.floor(timeSpent / 60)}:{(timeSpent % 60).toString().padStart(2, '0')}
                  </p>
                  <p className="text-sm text-slate-600">Tiempo</p>
                </div>
              </div>

              <div className="grid gap-3 sm:grid-cols-3">
                <Link href={`/oposiciones/${oposicion.slug}/test`}>
                  <Button variant="outline" className="w-full">
                    Nuevo test
                  </Button>
                </Link>
                <Link href={`/oposiciones/${oposicion.slug}/review`}>
                  <Button className="w-full bg-amber-600 text-white hover:bg-amber-500">Repasar errores</Button>
                </Link>
                <Link href={`/oposiciones/${oposicion.slug}/dashboard`}>
                  <Button className="w-full bg-[#1B3A5C] text-white hover:bg-[#16314d]">Ver progreso</Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        </section>
      </main>
    );
  }

  if (!selectedTopic) {
    return (
      <main className="min-h-screen bg-slate-50">
        <OposicionPageHeader oposicion={oposicion} current="Tests" />
        <section className="mx-auto max-w-5xl px-4 py-8">
          <h2 className="text-2xl font-bold text-slate-900">Selecciona bloque de práctica</h2>
          <p className="mt-1 text-sm text-slate-600">Cada test genera 10 preguntas adaptadas a {oposicion.name}.</p>

          <div className="mt-6 grid gap-4 md:grid-cols-2">
            <Card className="cursor-pointer border-2 border-[#1B3A5C]" onClick={() => startTest('general')}>
              <CardHeader>
                <CardTitle>Test general</CardTitle>
                <CardDescription>Mezcla de todos los temas para entrenar visión global.</CardDescription>
              </CardHeader>
            </Card>

            {topics.map((topic) => (
              <Card
                key={topic.id}
                className="cursor-pointer border-slate-200 hover:border-slate-400"
                onClick={() => startTest(topic.id)}
              >
                <CardHeader>
                  <CardTitle className="text-lg">{topic.name}</CardTitle>
                  <CardDescription>
                    {loadingQuestions
                      ? topic.questionCount
                      : allQuestions.filter((question) => question.topic === topic.id).length}{' '}
                    preguntas disponibles
                  </CardDescription>
                </CardHeader>
              </Card>
            ))}
          </div>

          {(loading || loadingQuestions) && (
            <Card className="mt-4">
              <CardContent className="flex items-center gap-2 py-4 text-sm text-slate-600">
                <Loader2 className="h-4 w-4 animate-spin" />
                {loadingQuestions ? 'Cargando banco de preguntas...' : 'Generando test...'}
              </CardContent>
            </Card>
          )}
        </section>
      </main>
    );
  }

  if (testQuestions.length === 0) {
    return (
      <main className="min-h-screen bg-slate-50">
        <OposicionPageHeader oposicion={oposicion} current="Tests" />
        <section className="mx-auto max-w-3xl px-4 py-10">
          <Card>
            <CardHeader>
              <CardTitle>No hay preguntas disponibles</CardTitle>
              <CardDescription>
                No se pudieron cargar preguntas para este bloque. Prueba con otro tema o vuelve a intentarlo.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button onClick={() => setSelectedTopic(null)} variant="outline">
                Elegir otro bloque
              </Button>
            </CardContent>
          </Card>
        </section>
      </main>
    );
  }

  const current = testQuestions[currentIndex];
  const progressValue = ((currentIndex + 1) / testQuestions.length) * 100;

  return (
    <main className="min-h-screen bg-slate-50">
      <OposicionPageHeader oposicion={oposicion} current="Tests" />
      <section className="mx-auto max-w-3xl px-4 py-8">
        <div className="mb-5">
          <div className="mb-2 flex items-center justify-between text-sm">
            <span className="font-medium text-slate-700">
              Pregunta {currentIndex + 1} de {testQuestions.length}
            </span>
            <Badge variant="outline">{topicMap[current.topic] ?? current.topic}</Badge>
          </div>
          <Progress value={progressValue} className="h-2" />
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="text-xl leading-relaxed">{current.question}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <RadioGroup value={selectedAnswer} onValueChange={setSelectedAnswer} disabled={showExplanation}>
              <div className="space-y-3">
                {current.options.map((option, index) => {
                  const isThisCorrect = index === current.correct;
                  const isSelected = selectedAnswer === String(index);

                  return (
                    <div
                      key={index}
                      className={`flex items-center gap-3 rounded-lg border-2 p-4 transition-all ${
                        showExplanation
                          ? isThisCorrect
                            ? 'border-emerald-500 bg-emerald-50'
                            : isSelected
                              ? 'border-rose-500 bg-rose-50'
                              : 'border-slate-200 bg-white'
                          : isSelected
                            ? 'border-[#1B3A5C] bg-slate-50'
                            : 'border-slate-200 bg-white hover:border-slate-400'
                      }`}
                    >
                      <RadioGroupItem value={String(index)} id={`option-${index}`} />
                      <Label htmlFor={`option-${index}`} className="flex-1 cursor-pointer">
                        {option}
                      </Label>
                      {showExplanation && isThisCorrect && <Check className="h-5 w-5 text-emerald-600" />}
                      {showExplanation && isSelected && !isThisCorrect && <X className="h-5 w-5 text-rose-600" />}
                    </div>
                  );
                })}
              </div>
            </RadioGroup>

            {showExplanation && (
              <div
                className={`rounded-lg border p-4 ${isCorrect ? 'border-emerald-400 bg-emerald-50' : 'border-rose-400 bg-rose-50'}`}
              >
                <p className="mb-1 text-sm font-semibold">
                  {isCorrect ? 'Respuesta correcta' : 'Respuesta incorrecta'}
                </p>
                <p className="text-sm text-slate-700">{current.explanation}</p>
                <p className="mt-2 text-xs font-medium text-slate-600">Referencia: {current.lawReference}</p>
              </div>
            )}

            <div className="flex gap-3">
              {!showExplanation ? (
                <Button
                  onClick={handleAnswer}
                  disabled={selectedAnswer === ''}
                  className="w-full bg-[#1B3A5C] text-white hover:bg-[#16314d]"
                >
                  Corregir respuesta
                </Button>
              ) : (
                <Button onClick={handleNext} className="w-full bg-[#1B3A5C] text-white hover:bg-[#16314d]">
                  {currentIndex < testQuestions.length - 1 ? 'Siguiente' : 'Ver resultado'}
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      </section>
    </main>
  );
}
