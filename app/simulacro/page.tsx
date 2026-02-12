'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { ArrowLeft, Clock, AlertCircle } from 'lucide-react';
import questions from '@/data/questions.json';

type Question = {
  id: string;
  topic: string;
  difficulty: string;
  question: string;
  options: string[];
  correct: string;
  explanation: string;
};

export default function SimulacroPage() {
  const [started, setStarted] = useState(false);
  const [examQuestions, setExamQuestions] = useState<Question[]>([]);
  const [userAnswers, setUserAnswers] = useState<Record<number, string>>({});
  const [timeLeft, setTimeLeft] = useState(90 * 60); // 90 minutes
  const [finished, setFinished] = useState(false);
  const [results, setResults] = useState<any>(null);

  useEffect(() => {
    if (!started || finished) return;

    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          handleFinish();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [started, finished]);

  const startExam = () => {
    // Select 60 random questions
    const shuffled = [...questions].sort(() => Math.random() - 0.5);
    setExamQuestions(shuffled.slice(0, 60));
    setStarted(true);
    setTimeLeft(90 * 60);
  };

  const handleAnswer = (index: number, answer: string) => {
    setUserAnswers({ ...userAnswers, [index]: answer });
  };

  const handleFinish = () => {
    const correct = examQuestions.reduce((count, q, i) => {
      return count + (userAnswers[i] === q.correct ? 1 : 0);
    }, 0);

    const topicBreakdown = examQuestions.reduce((acc: Record<string, {correct: number, total: number}>, q, i) => {
      if (!acc[q.topic]) acc[q.topic] = { correct: 0, total: 0 };
      acc[q.topic].total++;
      if (userAnswers[i] === q.correct) acc[q.topic].correct++;
      return acc;
    }, {});

    setResults({
      correct,
      total: examQuestions.length,
      percentage: Math.round((correct / examQuestions.length) * 100),
      timeUsed: 90 * 60 - timeLeft,
      topicBreakdown,
    });
    setFinished(true);
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  if (!started) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#F8FAFC] via-white to-[#F8FAFC]">
        <header className="border-b bg-white/80 backdrop-blur-sm">
          <div className="container mx-auto px-4 py-4 flex items-center gap-4">
            <Link href="/dashboard">
              <Button variant="ghost" size="icon">
                <ArrowLeft className="h-5 w-5" />
              </Button>
            </Link>
            <div className="text-2xl font-bold text-[#1B3A5C]">Simulacro de Examen</div>
          </div>
        </header>

        <div className="container mx-auto px-4 py-12">
          <Card className="max-w-2xl mx-auto">
            <CardHeader>
              <div className="w-20 h-20 bg-[#1B3A5C] rounded-full flex items-center justify-center mx-auto mb-4">
                <Clock className="w-10 h-10 text-white" />
              </div>
              <CardTitle className="text-center text-3xl">Simulacro Oficial</CardTitle>
              <CardDescription className="text-center text-base">
                Practica en condiciones reales de examen
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <div className="flex items-start gap-3 p-4 bg-blue-50 rounded-lg">
                  <AlertCircle className="w-5 h-5 text-blue-600 mt-0.5" />
                  <div className="text-sm text-blue-900">
                    <strong>Condiciones del simulacro:</strong>
                    <ul className="list-disc ml-5 mt-2 space-y-1">
                      <li>60 preguntas</li>
                      <li>90 minutos de tiempo límite</li>
                      <li>No podrás ver las explicaciones hasta el final</li>
                      <li>El cronómetro comenzará automáticamente</li>
                    </ul>
                  </div>
                </div>

                <div className="p-4 border-2 border-gray-200 rounded-lg">
                  <h4 className="font-semibold mb-2">Fórmula de puntuación oficial:</h4>
                  <p className="text-sm text-gray-600">
                    Aciertos - (Errores / 3) = Nota final
                  </p>
                </div>
              </div>

              <Button
                onClick={startExam}
                className="w-full bg-[#1B3A5C] hover:bg-[#152e4a] text-lg h-12"
              >
                Comenzar Simulacro
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  if (finished && results) {
    const errors = results.total - results.correct;
    const officialScore = Math.max(0, results.correct - (errors / 3)).toFixed(2);
    const averageScore = 35; // Mock average

    return (
      <div className="min-h-screen bg-gradient-to-br from-[#F8FAFC] via-white to-[#F8FAFC]">
        <header className="border-b bg-white/80 backdrop-blur-sm">
          <div className="container mx-auto px-4 py-4">
            <Link href="/dashboard" className="text-2xl font-bold text-[#1B3A5C]">Oposita+</Link>
          </div>
        </header>

        <div className="container mx-auto px-4 py-12">
          <Card className="max-w-3xl mx-auto">
            <CardHeader className="text-center">
              <CardTitle className="text-3xl mb-2">Resultados del Simulacro</CardTitle>
              <CardDescription>Comparación con la media de opositores</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid md:grid-cols-3 gap-4">
                <div className="text-center p-6 bg-gradient-to-br from-[#10B981] to-[#059669] text-white rounded-xl">
                  <div className="text-4xl font-bold mb-1">{results.percentage}%</div>
                  <div className="text-sm opacity-90">Porcentaje de aciertos</div>
                </div>
                <div className="text-center p-6 bg-gray-50 rounded-xl">
                  <div className="text-4xl font-bold text-[#1B3A5C] mb-1">{officialScore}</div>
                  <div className="text-sm text-gray-600">Nota estimada</div>
                </div>
                <div className="text-center p-6 bg-gray-50 rounded-xl">
                  <div className="text-4xl font-bold text-[#1B3A5C] mb-1">{formatTime(results.timeUsed)}</div>
                  <div className="text-sm text-gray-600">Tiempo empleado</div>
                </div>
              </div>

              <Card className="bg-blue-50 border-blue-200">
                <CardContent className="pt-6">
                  <div className="flex justify-between items-center mb-4">
                    <span className="font-semibold">Tu puntuación:</span>
                    <Badge className="bg-[#10B981]">{results.correct}/{results.total}</Badge>
                  </div>
                  <div className="flex justify-between items-center mb-2">
                    <span className="font-semibold">Media de opositores:</span>
                    <Badge variant="outline">{averageScore}/60</Badge>
                  </div>
                  <Progress 
                    value={(results.correct / results.total) * 100} 
                    className="h-3 mb-1"
                  />
                  <div className="text-sm text-gray-600 text-center">
                    {results.correct > averageScore 
                      ? `¡Estás ${results.correct - averageScore} puntos por encima de la media!`
                      : `Estás ${averageScore - results.correct} puntos por debajo de la media`
                    }
                  </div>
                </CardContent>
              </Card>

              <div>
                <h3 className="font-semibold mb-4">Desglose por temas:</h3>
                <div className="space-y-2">
                  {Object.entries(results.topicBreakdown).map(([topic, data]: [string, any]) => (
                    <div key={topic} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <span className="text-sm font-medium">{topic}</span>
                      <div className="flex items-center gap-2">
                        <Progress 
                          value={(data.correct / data.total) * 100}
                          className="w-24 h-2"
                        />
                        <span className="text-sm text-gray-600 w-12 text-right">
                          {data.correct}/{data.total}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex gap-4">
                <Link href="/simulacro" className="flex-1">
                  <Button variant="outline" className="w-full">Repetir Simulacro</Button>
                </Link>
                <Link href="/dashboard" className="flex-1">
                  <Button className="w-full bg-[#10B981] hover:bg-[#059669]">Volver al Panel</Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  const answeredCount = Object.keys(userAnswers).length;
  const progress = (answeredCount / examQuestions.length) * 100;

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#F8FAFC] via-white to-[#F8FAFC]">
      <header className="border-b bg-white/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <div className="text-2xl font-bold text-[#1B3A5C]">Simulacro</div>
          <div className="flex items-center gap-4">
            <Badge variant="outline">
              {answeredCount}/{examQuestions.length} respondidas
            </Badge>
            <div className={`flex items-center gap-2 px-4 py-2 rounded-lg ${timeLeft < 600 ? 'bg-red-100 text-red-700' : 'bg-gray-100'}`}>
              <Clock className="w-5 h-5" />
              <span className="font-mono font-bold">{formatTime(timeLeft)}</span>
            </div>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          <div className="mb-6">
            <Progress value={progress} className="h-2" />
          </div>

          <div className="space-y-6">
            {examQuestions.map((q, i) => (
              <Card key={i}>
                <CardHeader>
                  <div className="flex justify-between items-start mb-2">
                    <Badge>{i + 1}</Badge>
                    <Badge variant="outline">{q.topic}</Badge>
                  </div>
                  <CardTitle className="text-lg">{q.question}</CardTitle>
                </CardHeader>
                <CardContent>
                  <RadioGroup 
                    value={userAnswers[i] || ''} 
                    onValueChange={(value) => handleAnswer(i, value)}
                  >
                    <div className="space-y-2">
                      {q.options.map((option, j) => {
                        const letter = String.fromCharCode(65 + j);
                        return (
                          <div
                            key={j}
                            className={`flex items-center space-x-3 p-3 rounded-lg border-2 transition-all ${
                              userAnswers[i] === letter
                                ? 'border-[#10B981] bg-green-50'
                                : 'border-gray-200 hover:border-[#10B981]'
                            }`}
                          >
                            <RadioGroupItem value={letter} id={`q${i}-option-${j}`} />
                            <Label htmlFor={`q${i}-option-${j}`} className="flex-1 cursor-pointer">
                              {option}
                            </Label>
                          </div>
                        );
                      })}
                    </div>
                  </RadioGroup>
                </CardContent>
              </Card>
            ))}
          </div>

          <Card className="mt-8 sticky bottom-4">
            <CardContent className="py-6">
              <div className="flex justify-between items-center">
                <div>
                  <p className="font-semibold">
                    {answeredCount === examQuestions.length 
                      ? '¡Todas las preguntas respondidas!'
                      : `${examQuestions.length - answeredCount} preguntas sin responder`
                    }
                  </p>
                  <p className="text-sm text-gray-600">
                    Puedes finalizar cuando estés listo
                  </p>
                </div>
                <Button
                  onClick={handleFinish}
                  className="bg-[#1B3A5C] hover:bg-[#152e4a]"
                  size="lg"
                >
                  Finalizar Simulacro
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
