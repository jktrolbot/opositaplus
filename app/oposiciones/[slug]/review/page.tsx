'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { RotateCcw, TrendingUp } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { oposiciones } from '@/data/oposiciones';
import { getQuestionsByOposicion } from '@/data/questions';
import { storage } from '@/lib/storage';
import { OposicionNotFound } from '@/components/oposiciones/not-found';
import { OposicionPageHeader } from '@/components/oposiciones/page-header';
import { AuthGuard } from '@/components/auth-guard';

export default function OposicionReviewPage() {
  const params = useParams<{ slug: string }>();
  const slug = typeof params?.slug === 'string' ? params.slug : '';
  const oposicion = useMemo(() => oposiciones.find((item) => item.slug === slug), [slug]);

  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState('');
  const [showAnswer, setShowAnswer] = useState(false);
  const wrongQuestions = useMemo(() => {
    if (!oposicion) return [];
    const wrongIds = storage.forOposicion(oposicion.slug).getWrongAnswers();
    const questionPool = getQuestionsByOposicion(oposicion.slug);
    return questionPool.filter((question) => wrongIds.includes(question.id)).reverse();
  }, [oposicion]);

  if (!oposicion) {
    return (
      <AuthGuard>
        <OposicionNotFound />
      </AuthGuard>
    );
  }

  if (wrongQuestions.length === 0) {
    return (
      <AuthGuard>
        <main className="min-h-screen bg-slate-50">
          <OposicionPageHeader oposicion={oposicion} current="Repaso" />
          <section className="mx-auto max-w-3xl px-4 py-12">
            <Card className="text-center">
              <CardHeader>
                <div className="mx-auto mb-3 inline-flex h-16 w-16 items-center justify-center rounded-full bg-emerald-600 text-white">
                  <TrendingUp className="h-8 w-8" />
                </div>
                <CardTitle>Sin errores pendientes</CardTitle>
                <CardDescription>
                  Completa nuevos tests para que el repaso inteligente detecte preguntas criticas.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Link href={`/oposiciones/${oposicion.slug}/test`}>
                  <Button className="bg-slate-900 text-white hover:bg-slate-700">Hacer test ahora</Button>
                </Link>
              </CardContent>
            </Card>
          </section>
        </main>
      </AuthGuard>
    );
  }

  const safeCurrentIndex = Math.min(currentIndex, wrongQuestions.length - 1);
  const current = wrongQuestions[safeCurrentIndex];

  const handleNext = () => {
    if (safeCurrentIndex < wrongQuestions.length - 1) {
      setCurrentIndex((index) => index + 1);
      setSelectedAnswer('');
      setShowAnswer(false);
    }
  };

  const handlePrevious = () => {
    if (currentIndex > 0) {
      setCurrentIndex((index) => index - 1);
      setSelectedAnswer('');
      setShowAnswer(false);
    }
  };

  return (
    <AuthGuard>
      <main className="min-h-screen bg-slate-50">
        <OposicionPageHeader oposicion={oposicion} current="Repaso" />

        <section className="mx-auto max-w-3xl px-4 py-8">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
            <Badge variant="outline" className="border-amber-300 text-amber-700">
              <RotateCcw className="mr-1 h-3 w-3" />
              Fallada anteriormente
            </Badge>
            <p className="text-sm text-slate-600">
              Pregunta {safeCurrentIndex + 1} de {wrongQuestions.length}
            </p>
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="text-xl leading-relaxed">{current.question}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <RadioGroup value={selectedAnswer} onValueChange={setSelectedAnswer}>
                <div className="space-y-3">
                  {current.options.map((option, index) => {
                    const isCorrect = index === current.correct;
                    return (
                      <div
                        key={index}
                        className={`flex items-center gap-3 rounded-lg border-2 p-4 ${
                          showAnswer && isCorrect
                            ? 'border-emerald-500 bg-emerald-50'
                            : 'border-slate-200 bg-white hover:border-slate-400'
                        }`}
                      >
                        <RadioGroupItem value={String(index)} id={`review-option-${index}`} />
                        <Label htmlFor={`review-option-${index}`} className="flex-1 cursor-pointer">
                          {option}
                        </Label>
                      </div>
                    );
                  })}
                </div>
              </RadioGroup>

              {showAnswer && (
                <div className="rounded-lg border border-emerald-300 bg-emerald-50 p-4">
                  <p className="mb-1 text-sm font-semibold text-emerald-800">Explicacion</p>
                  <p className="text-sm text-slate-700">{current.explanation}</p>
                </div>
              )}

              <div className="flex gap-3">
                {!showAnswer ? (
                  <Button onClick={() => setShowAnswer(true)} className="w-full bg-slate-900 text-white hover:bg-slate-700">
                    Ver respuesta
                  </Button>
                ) : (
                  <>
                    <Button variant="outline" onClick={handlePrevious} disabled={currentIndex === 0} className="flex-1">
                      Anterior
                    </Button>
                    <Button
                      onClick={handleNext}
                      disabled={safeCurrentIndex === wrongQuestions.length - 1}
                      className="flex-1 bg-slate-900 text-white hover:bg-slate-700"
                    >
                      Siguiente
                    </Button>
                  </>
                )}
              </div>
            </CardContent>
          </Card>

          {safeCurrentIndex === wrongQuestions.length - 1 && showAnswer && (
            <Card className="mt-5 border-emerald-300 bg-emerald-50">
              <CardContent className="py-5 text-center">
                <p className="mb-3 font-semibold text-emerald-900">Repaso completado</p>
                <Link href={`/oposiciones/${oposicion.slug}/test`}>
                  <Button className="bg-slate-900 text-white hover:bg-slate-700">Continuar practicando</Button>
                </Link>
              </CardContent>
            </Card>
          )}
        </section>
      </main>
    </AuthGuard>
  );
}
