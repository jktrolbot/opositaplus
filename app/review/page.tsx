'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { storage } from '@/lib/storage';
import { ArrowLeft, RotateCcw, TrendingUp } from 'lucide-react';
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

export default function ReviewPage() {
  const [wrongQuestions, setWrongQuestions] = useState<Question[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState('');
  const [showAnswer, setShowAnswer] = useState(false);

  useEffect(() => {
    const wrongIds = storage.getWrongAnswers();
    const wrong = questions.filter(q => wrongIds.includes(q.id));
    // Show most recent/frequent first
    setWrongQuestions(wrong.reverse());
  }, []);

  if (wrongQuestions.length === 0) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#F8FAFC] via-white to-[#F8FAFC]">
        <header className="border-b bg-white/80 backdrop-blur-sm">
          <div className="container mx-auto px-4 py-4 flex items-center gap-4">
            <Link href="/dashboard">
              <Button variant="ghost" size="icon">
                <ArrowLeft className="h-5 w-5" />
              </Button>
            </Link>
            <div className="text-2xl font-bold text-[#1B3A5C]">Modo Repaso</div>
          </div>
        </header>

        <div className="container mx-auto px-4 py-12">
          <Card className="max-w-2xl mx-auto text-center">
            <CardHeader>
              <div className="w-20 h-20 bg-[#10B981] rounded-full flex items-center justify-center mx-auto mb-4">
                <TrendingUp className="w-10 h-10 text-white" />
              </div>
              <CardTitle>¡Excelente! No tienes errores que repasar</CardTitle>
              <CardDescription className="text-base mt-2">
                Completa algunos tests para que aparezcan aquí las preguntas que has fallado
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Link href="/test">
                <Button className="bg-[#10B981] hover:bg-[#059669]">
                  Hacer un Test
                </Button>
              </Link>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  const current = wrongQuestions[currentIndex];

  const handleNext = () => {
    if (currentIndex < wrongQuestions.length - 1) {
      setCurrentIndex(currentIndex + 1);
      setSelectedAnswer('');
      setShowAnswer(false);
    }
  };

  const handlePrevious = () => {
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1);
      setSelectedAnswer('');
      setShowAnswer(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#F8FAFC] via-white to-[#F8FAFC]">
      <header className="border-b bg-white/80 backdrop-blur-sm">
        <div className="container mx-auto px-4 py-4 flex items-center gap-4">
          <Link href="/dashboard">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-5 w-5" />
            </Button>
          </Link>
          <div>
            <div className="text-2xl font-bold text-[#1B3A5C]">Modo Repaso</div>
            <div className="text-sm text-gray-600">
              Pregunta {currentIndex + 1} de {wrongQuestions.length}
            </div>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8">
        <div className="max-w-3xl mx-auto">
          <div className="mb-6 flex items-center justify-between">
            <Badge variant="outline" className="text-[#F59E0B] border-[#F59E0B]">
              <RotateCcw className="w-3 h-3 mr-1" />
              Pregunta fallada anteriormente
            </Badge>
            <Badge>{current.topic}</Badge>
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="text-2xl">{current.question}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <RadioGroup value={selectedAnswer} onValueChange={setSelectedAnswer}>
                <div className="space-y-3">
                  {current.options.map((option, i) => {
                    const letter = String.fromCharCode(65 + i);
                    const isCorrect = letter === current.correct;
                    
                    return (
                      <div
                        key={i}
                        className={`flex items-center space-x-3 p-4 rounded-lg border-2 transition-all ${
                          showAnswer && isCorrect
                            ? 'border-[#10B981] bg-green-50'
                            : 'border-gray-200 hover:border-[#10B981]'
                        }`}
                      >
                        <RadioGroupItem value={letter} id={`option-${i}`} />
                        <Label htmlFor={`option-${i}`} className="flex-1 cursor-pointer">
                          {option}
                        </Label>
                      </div>
                    );
                  })}
                </div>
              </RadioGroup>

              {showAnswer && (
                <div className="p-4 rounded-lg bg-green-50 border border-[#10B981]">
                  <p className="font-semibold mb-2 text-[#059669]">Explicación:</p>
                  <p className="text-sm text-gray-700">{current.explanation}</p>
                </div>
              )}

              <div className="flex gap-4">
                {!showAnswer ? (
                  <Button
                    onClick={() => setShowAnswer(true)}
                    className="flex-1 bg-[#10B981] hover:bg-[#059669]"
                  >
                    Ver Respuesta
                  </Button>
                ) : (
                  <>
                    <Button
                      onClick={handlePrevious}
                      disabled={currentIndex === 0}
                      variant="outline"
                      className="flex-1"
                    >
                      Anterior
                    </Button>
                    <Button
                      onClick={handleNext}
                      disabled={currentIndex === wrongQuestions.length - 1}
                      className="flex-1 bg-[#1B3A5C] hover:bg-[#152e4a]"
                    >
                      Siguiente
                    </Button>
                  </>
                )}
              </div>
            </CardContent>
          </Card>

          {currentIndex === wrongQuestions.length - 1 && showAnswer && (
            <Card className="mt-6 bg-gradient-to-r from-[#10B981] to-[#059669] text-white">
              <CardContent className="py-6 text-center">
                <h3 className="text-xl font-bold mb-2">¡Has completado el repaso!</h3>
                <p className="mb-4">Sigue practicando para mejorar aún más</p>
                <Link href="/test">
                  <Button variant="secondary">Hacer Otro Test</Button>
                </Link>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
