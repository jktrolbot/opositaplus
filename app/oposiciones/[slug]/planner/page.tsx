'use client';

import { useEffect, useMemo, useState } from 'react';
import { useParams } from 'next/navigation';
import { addDays, format, startOfWeek } from 'date-fns';
import { es } from 'date-fns/locale';
import { Calendar, Check, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { oposiciones } from '@/data/oposiciones';
import { OposicionNotFound } from '@/components/oposiciones/not-found';
import { OposicionPageHeader } from '@/components/oposiciones/page-header';
import { storage, type StudyPlan } from '@/lib/storage';
import { AuthGuard } from '@/components/auth-guard';

export default function OposicionPlannerPage() {
  const params = useParams<{ slug: string }>();
  const slug = typeof params?.slug === 'string' ? params.slug : '';
  const oposicion = useMemo(() => oposiciones.find((item) => item.slug === slug), [slug]);

  const [plan, setPlan] = useState<StudyPlan | null>(null);
  const [loading, setLoading] = useState(false);
  const [examDate, setExamDate] = useState('');
  const [hoursPerDay, setHoursPerDay] = useState('2');

  useEffect(() => {
    if (!oposicion) return;
    setPlan(storage.forOposicion(oposicion.slug).getStudyPlan());
  }, [oposicion]);

  if (!oposicion) {
    return (
      <AuthGuard>
        <OposicionNotFound />
      </AuthGuard>
    );
  }

  const topics = oposicion.topics.map((topic) => topic.name);

  const handleGenerate = async () => {
    if (!examDate || !hoursPerDay) return;

    setLoading(true);
    try {
      const response = await fetch('/api/generate-plan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          oposicion: oposicion.slug,
          examDate,
          hoursPerDay: Number.parseInt(hoursPerDay, 10),
        }),
      });

      if (!response.ok) {
        throw new Error('Plan generation failed');
      }

      const data = (await response.json()) as StudyPlan;
      storage.forOposicion(oposicion.slug).setStudyPlan(data);
      setPlan(data);
    } catch {
      const fallback = generateSimplePlan(examDate, Number.parseInt(hoursPerDay, 10), topics);
      storage.forOposicion(oposicion.slug).setStudyPlan(fallback);
      setPlan(fallback);
    } finally {
      setLoading(false);
    }
  };

  const toggleDay = (weekIndex: number, dayIndex: number) => {
    if (!plan) return;
    const completed = !plan.weeks[weekIndex]?.days[dayIndex]?.completed;
    storage.forOposicion(oposicion.slug).updateDayCompletion(weekIndex, dayIndex, completed);
    setPlan(storage.forOposicion(oposicion.slug).getStudyPlan());
  };

  if (!plan) {
    return (
      <AuthGuard>
        <main className="min-h-screen bg-slate-50">
          <OposicionPageHeader oposicion={oposicion} current="Planificador" />
          <section className="mx-auto max-w-3xl px-4 py-10">
            <Card>
              <CardHeader>
                <CardTitle>Crear plan de estudio</CardTitle>
                <CardDescription>
                  El plan se calcula sobre el temario de {oposicion.name} y se guarda por convocatoria.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-5">
                <div className="space-y-2">
                  <Label htmlFor="examDate">Fecha de examen</Label>
                  <Input
                    id="examDate"
                    type="date"
                    value={examDate}
                    onChange={(event) => setExamDate(event.target.value)}
                    min={new Date().toISOString().split('T')[0]}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="hoursPerDay">Horas de estudio por dia</Label>
                  <Input
                    id="hoursPerDay"
                    type="number"
                    min="1"
                    max="12"
                    value={hoursPerDay}
                    onChange={(event) => setHoursPerDay(event.target.value)}
                  />
                </div>

                <div className="space-y-2 text-sm text-slate-600">
                  <p className="font-medium text-slate-800">Temario incluido:</p>
                  <p>{topics.join(' · ')}</p>
                </div>

                <Button
                  onClick={handleGenerate}
                  disabled={!examDate || !hoursPerDay || loading}
                  className="w-full bg-slate-900 text-white hover:bg-slate-700"
                >
                  {loading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Generando plan...
                    </>
                  ) : (
                    <>
                      <Calendar className="mr-2 h-4 w-4" />
                      Generar plan
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>
          </section>
        </main>
      </AuthGuard>
    );
  }

  const completedDays = plan.weeks.flatMap((week) => week.days).filter((day) => day.completed).length;
  const totalDays = plan.weeks.flatMap((week) => week.days).length;
  const progressPercentage = totalDays > 0 ? Math.round((completedDays / totalDays) * 100) : 0;

  return (
    <AuthGuard>
      <main className="min-h-screen bg-slate-50">
        <OposicionPageHeader oposicion={oposicion} current="Planificador" />

        <section className="mx-auto max-w-6xl px-4 py-6">
          <Card className="mb-6">
            <CardHeader>
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                  <CardTitle>Plan activo</CardTitle>
                  <CardDescription>
                    Examen: {format(new Date(plan.examDate), 'dd MMMM yyyy', { locale: es })}
                  </CardDescription>
                </div>
                <div className="text-right">
                  <p className="text-3xl font-bold text-slate-900">{progressPercentage}%</p>
                  <p className="text-sm text-slate-600">
                    {completedDays}/{totalDays} dias completados
                  </p>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <Button variant="outline" onClick={() => setPlan(null)}>
                Crear nuevo plan
              </Button>
            </CardContent>
          </Card>

          <div className="space-y-6">
            {plan.weeks.map((week, weekIndex) => (
              <Card key={week.week}>
                <CardHeader>
                  <CardTitle>Semana {week.week}</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-7">
                    {week.days.map((day, dayIndex) => (
                      <button
                        type="button"
                        key={`${week.week}-${day.date}`}
                        onClick={() => toggleDay(weekIndex, dayIndex)}
                        className={`rounded-lg border-2 p-3 text-left transition ${
                          day.completed
                            ? 'border-emerald-500 bg-emerald-50'
                            : 'border-slate-200 bg-white hover:border-slate-400'
                        }`}
                      >
                        <div className="mb-2 flex items-center justify-between">
                          <span className="text-sm font-semibold text-slate-800">
                            {format(new Date(day.date), 'EEE dd', { locale: es })}
                          </span>
                          {day.completed && <Check className="h-4 w-4 text-emerald-600" />}
                        </div>
                        <div className="space-y-1">
                          {day.topics.map((topic) => (
                            <p key={`${day.date}-${topic}`} className="truncate text-xs text-slate-600">
                              {topic}
                            </p>
                          ))}
                        </div>
                      </button>
                    ))}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>
      </main>
    </AuthGuard>
  );
}

function generateSimplePlan(examDate: string, hoursPerDay: number, topics: string[]): StudyPlan {
  const start = startOfWeek(new Date(), { locale: es });
  const exam = new Date(examDate);
  const days = Math.floor((exam.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
  const weeks = Math.max(1, Math.ceil(days / 7));

  const weeksData: StudyPlan['weeks'] = [];
  let currentDate = start;
  let topicIndex = 0;

  for (let week = 0; week < weeks && week < 16; week += 1) {
    const daysData = [];

    for (let day = 0; day < 7; day += 1) {
      const dayTopics = [topics[topicIndex % topics.length]];
      if (hoursPerDay >= 3) dayTopics.push(topics[(topicIndex + 1) % topics.length]);
      if (hoursPerDay >= 5) dayTopics.push(topics[(topicIndex + 2) % topics.length]);

      daysData.push({
        date: currentDate.toISOString().split('T')[0],
        topics: dayTopics,
        completed: false,
      });

      currentDate = addDays(currentDate, 1);
      if ((day + 1) % 2 === 0) topicIndex += 1;
    }

    weeksData.push({ week: week + 1, days: daysData });
  }

  return {
    examDate,
    hoursPerDay,
    topics,
    weeks: weeksData,
  };
}
