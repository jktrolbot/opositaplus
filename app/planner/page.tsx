'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { storage, StudyPlan } from '@/lib/storage';
import { ArrowLeft, Calendar, Check, Loader2 } from 'lucide-react';
import { format, addDays, startOfWeek } from 'date-fns';
import { es } from 'date-fns/locale';

export default function PlannerPage() {
  const [plan, setPlan] = useState<StudyPlan | null>(null);
  const [loading, setLoading] = useState(false);
  const [examDate, setExamDate] = useState('');
  const [hoursPerDay, setHoursPerDay] = useState('2');

  useEffect(() => {
    setPlan(storage.getStudyPlan());
  }, []);

  const topics = [
    "Constitución Española",
    "Estatuto de Autonomía de Galicia",
    "Ley 39/2015",
    "Ley 40/2015",
    "Derecho Administrativo",
    "Función Pública",
    "Hacienda Pública",
    "Unión Europea"
  ];

  const handleGenerate = async () => {
    if (!examDate || !hoursPerDay) return;

    setLoading(true);

    try {
      const response = await fetch('/api/generate-plan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          examDate,
          hoursPerDay: parseInt(hoursPerDay),
          topics,
        }),
      });

      const data = await response.json();
      storage.setStudyPlan(data);
      setPlan(data);
    } catch (error) {
      console.error('Error generating plan:', error);
      // Fallback to simple plan
      const simplePlan = generateSimplePlan(examDate, parseInt(hoursPerDay), topics);
      storage.setStudyPlan(simplePlan);
      setPlan(simplePlan);
    } finally {
      setLoading(false);
    }
  };

  const toggleDay = (weekIndex: number, dayIndex: number) => {
    if (!plan) return;
    const completed = !plan.weeks[weekIndex].days[dayIndex].completed;
    storage.updateDayCompletion(weekIndex, dayIndex, completed);
    const updated = storage.getStudyPlan();
    setPlan(updated);
  };

  if (!plan) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#F8FAFC] via-white to-[#F8FAFC]">
        <header className="border-b bg-white/80 backdrop-blur-sm">
          <div className="container mx-auto px-4 py-4 flex items-center gap-4">
            <Link href="/dashboard">
              <Button variant="ghost" size="icon">
                <ArrowLeft className="h-5 w-5" />
              </Button>
            </Link>
            <div className="text-2xl font-bold text-[#1B3A5C]">Planificador de Estudio</div>
          </div>
        </header>

        <div className="container mx-auto px-4 py-12">
          <Card className="max-w-2xl mx-auto">
            <CardHeader>
              <CardTitle>Crea tu plan de estudio personalizado</CardTitle>
              <CardDescription>
                Introduce la fecha de tu examen y el tiempo que puedes dedicar cada día
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="examDate">Fecha del examen</Label>
                <Input
                  id="examDate"
                  type="date"
                  value={examDate}
                  onChange={(e) => setExamDate(e.target.value)}
                  min={new Date().toISOString().split('T')[0]}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="hours">Horas de estudio por día</Label>
                <Input
                  id="hours"
                  type="number"
                  min="1"
                  max="12"
                  value={hoursPerDay}
                  onChange={(e) => setHoursPerDay(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label>Temas a estudiar</Label>
                <div className="text-sm text-gray-600">
                  {topics.join(', ')}
                </div>
              </div>

              <Button
                onClick={handleGenerate}
                disabled={!examDate || !hoursPerDay || loading}
                className="w-full bg-[#10B981] hover:bg-[#059669]"
              >
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Generando plan...
                  </>
                ) : (
                  <>
                    <Calendar className="mr-2 h-4 w-4" />
                    Generar Plan de Estudio
                  </>
                )}
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  const completedDays = plan.weeks.flatMap(w => w.days).filter(d => d.completed).length;
  const totalDays = plan.weeks.flatMap(w => w.days).length;
  const progressPercentage = Math.round((completedDays / totalDays) * 100);

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#F8FAFC] via-white to-[#F8FAFC]">
      <header className="border-b bg-white/80 backdrop-blur-sm">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/dashboard">
              <Button variant="ghost" size="icon">
                <ArrowLeft className="h-5 w-5" />
              </Button>
            </Link>
            <div className="text-2xl font-bold text-[#1B3A5C]">Tu Plan de Estudio</div>
          </div>
          <Button
            variant="outline"
            onClick={() => setPlan(null)}
          >
            Crear Nuevo Plan
          </Button>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8">
        <Card className="mb-8">
          <CardHeader>
            <div className="flex justify-between items-start">
              <div>
                <CardTitle>Progreso del Plan</CardTitle>
                <CardDescription>
                  Examen: {format(new Date(plan.examDate), 'dd MMMM yyyy', { locale: es })}
                </CardDescription>
              </div>
              <div className="text-right">
                <div className="text-3xl font-bold text-[#10B981]">{progressPercentage}%</div>
                <div className="text-sm text-gray-600">{completedDays}/{totalDays} días</div>
              </div>
            </div>
          </CardHeader>
        </Card>

        <div className="space-y-8">
          {plan.weeks.map((week, weekIndex) => (
            <Card key={weekIndex}>
              <CardHeader>
                <CardTitle>Semana {week.week}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid md:grid-cols-7 gap-4">
                  {week.days.map((day, dayIndex) => (
                    <div
                      key={dayIndex}
                      onClick={() => toggleDay(weekIndex, dayIndex)}
                      className={`p-4 rounded-lg border-2 cursor-pointer transition-all ${
                        day.completed
                          ? 'bg-green-50 border-[#10B981]'
                          : 'bg-white border-gray-200 hover:border-[#10B981]'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-semibold text-sm">
                          {format(new Date(day.date), 'EEE dd', { locale: es })}
                        </span>
                        {day.completed && <Check className="h-5 w-5 text-[#10B981]" />}
                      </div>
                      <div className="space-y-1">
                        {day.topics.map((topic, i) => (
                          <div key={i} className="text-xs text-gray-600 truncate">{topic}</div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}

// Fallback plan generator
function generateSimplePlan(examDate: string, hoursPerDay: number, topics: string[]): StudyPlan {
  const start = startOfWeek(new Date(), { locale: es });
  const exam = new Date(examDate);
  const days = Math.floor((exam.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
  const weeks = Math.ceil(days / 7);

  const weeksData = [];
  let currentDate = start;
  let topicIndex = 0;

  for (let w = 0; w < weeks; w++) {
    const daysData = [];
    for (let d = 0; d < 7; d++) {
      const dayTopics = [topics[topicIndex % topics.length]];
      if (hoursPerDay >= 3) {
        dayTopics.push(topics[(topicIndex + 1) % topics.length]);
      }
      
      daysData.push({
        date: currentDate.toISOString().split('T')[0],
        topics: dayTopics,
        completed: false,
      });
      
      currentDate = addDays(currentDate, 1);
      if ((d + 1) % 2 === 0) topicIndex++;
    }
    
    weeksData.push({ week: w + 1, days: daysData });
  }

  return {
    examDate,
    hoursPerDay,
    topics,
    weeks: weeksData,
  };
}
