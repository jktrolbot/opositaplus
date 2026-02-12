'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { storage } from '@/lib/storage';
import { ArrowLeft, Clock, Check, X } from 'lucide-react';
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

export default function TestPage() {
  const [selectedTopic, setSelectedTopic] = useState<string | null>(null);
  const [testQuestions, setTestQuestions] = useState<Question[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState('');
  const [showExplanation, setShowExplanation] = useState(false);
  const [isCorrect, setIsCorrect] = useState(false);
  const [userAnswers, setUserAnswers] = useState<Array<{questionId: string; correct: boolean}>>([]);
  const [startTime, setStartTime] = useState(Date.now());
  const [testComplete, setTestComplete] = useState(false);

  const topics = Array.from(new Set(questions.map(q => q.topic)));

  const startTest = (topic: string) => {
    setSelectedTopic(topic);
    const topicQuestions = questions.filter(q => 
      topic === 'General' ? true : q.topic === topic
    );
    
    // Shuffle and select 10 questions
    const shuffled = [...topicQuestions].sort(() => Math.random() - 0.5);
    const selected = shuffled.slice(0, 10);
    
    setTestQuestions(selected);
    setCurrentIndex(0);
    setUserAnswers([]);
    setStartTime(Date.now());
    setTestComplete(false);
  };

  const handleAnswer = () => {
    const current = testQuestions[currentIndex];
    const correct = selectedAnswer === current.correct;
    
    setIsCorrect(correct);
    setShowExplanation(true);
    setUserAnswers([...userAnswers, { questionId: current.id, correct }]);
  };

  const handleNext = () => {
    if (currentIndex < testQuestions.length - 1) {
      setCurrentIndex(currentIndex + 1);
      setSelectedAnswer('');
      setShowExplanation(false);
    } else {
      completeTest();
    }
  };

  const completeTest = () => {
    const correctCount = userAnswers.filter(a => a.correct).length + (isCorrect ? 1 : 0);
    const totalQuestions = testQuestions.length;
    const score = correctCount / totalQuestions;
    const timeSpent = Math.floor((Date.now() - startTime) / 1000);
    const wrongAnswers = userAnswers
      .map((a, i) => !a.correct ? testQuestions[i].id : null)
      .filter(Boolean) as string[];
    
    if (!isCorrect) {
      wrongAnswers.push(testQuestions[currentIndex].id);
    }

    storage.addTestResult({
      id: `test-${Date.now()}`,
      date: new Date().toISOString(),
      topic: selectedTopic || 'General',
      score,
      totalQuestions,
      timeSpent,
      wrongAnswers,
    });

    setTestComplete(true);
  };

  if (testComplete) {
    const correctCount = userAnswers.filter(a => a.correct).length + (isCorrect ? 1 : 0);
    const scorePercentage = Math.round((correctCount / testQuestions.length) * 100);
    const timeSpent = Math.floor((Date.now() - startTime) / 1000);

    return (
      <div className="min-h-screen bg-gradient-to-br from-[#F8FAFC] via-white to-[#F8FAFC]">
        <header className="border-b bg-white/80 backdrop-blur-sm">
          <div className="container mx-auto px-4 py-4">
            <Link href="/dashboard" className="text-2xl font-bold text-[#1B3A5C]">Oposita+</Link>
          </div>
        </header>

        <div className="container mx-auto px-4 py-12">
          <Card className="max-w-2xl mx-auto">
            <CardHeader className="text-center">
              <div className="mb-4">
                {scorePercentage >= 80 ? (
                  <div className="w-24 h-24 bg-[#10B981] rounded-full flex items-center justify-center mx-auto">
                    <Check className="w-12 h-12 text-white" />
                  </div>
                ) : (
                  <div className="w-24 h-24 bg-[#F59E0B] rounded-full flex items-center justify-center mx-auto">
                    <span className="text-3xl text-white font-bold">{scorePercentage}%</span>
                  </div>
                )}
              </div>
              <CardTitle className="text-3xl">¡Test Completado!</CardTitle>
              <CardDescription>
                {scorePercentage >= 80 ? '¡Excelente trabajo!' : '¡Buen intento! Sigue practicando'}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div className="text-center p-4 bg-gray-50 rounded-lg">
                  <div className="text-3xl font-bold text-[#1B3A5C]">{correctCount}/{testQuestions.length}</div>
                  <div className="text-sm text-gray-600">Respuestas correctas</div>
                </div>
                <div className="text-center p-4 bg-gray-50 rounded-lg">
                  <div className="text-3xl font-bold text-[#1B3A5C]">{Math.floor(timeSpent / 60)}:{(timeSpent % 60).toString().padStart(2, '0')}</div>
                  <div className="text-sm text-gray-600">Tiempo empleado</div>
                </div>
              </div>

              {scorePercentage < 80 && (
                <div className="p-4 bg-[#FEF3C7] border border-[#F59E0B] rounded-lg">
                  <p className="text-sm text-[#92400E]">
                    <strong>Áreas de mejora:</strong> Revisa los errores y practica más preguntas de <strong>{selectedTopic}</strong>
                  </p>
                </div>
              )}

              <div className="flex gap-4">
                <Link href="/test" className="flex-1">
                  <Button variant="outline" className="w-full">Nuevo Test</Button>
                </Link>
                <Link href="/review" className="flex-1">
                  <Button className="w-full bg-[#F59E0B] hover:bg-[#D97706]">Repasar Errores</Button>
                </Link>
                <Link href="/dashboard" className="flex-1">
                  <Button className="w-full bg-[#10B981] hover:bg-[#059669]">Ir al Panel</Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  if (!selectedTopic) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#F8FAFC] via-white to-[#F8FAFC]">
        <header className="border-b bg-white/80 backdrop-blur-sm">
          <div className="container mx-auto px-4 py-4 flex items-center gap-4">
            <Link href="/dashboard">
              <Button variant="ghost" size="icon">
                <ArrowLeft className="h-5 w-5" />
              </Button>
            </Link>
            <Link href="/" className="text-2xl font-bold text-[#1B3A5C]">Oposita+</Link>
          </div>
        </header>

        <div className="container mx-auto px-4 py-12">
          <div className="max-w-4xl mx-auto">
            <h1 className="text-4xl font-bold text-[#1B3A5C] mb-4">Elige un tema</h1>
            <p className="text-gray-600 mb-8">Selecciona el tema que quieres practicar o haz un test general</p>

            <div className="grid md:grid-cols-2 gap-4">
              <Card 
                className="cursor-pointer hover:border-[#10B981] transition-all border-2"
                onClick={() => startTest('General')}
              >
                <CardHeader>
                  <CardTitle>Test General</CardTitle>
                  <CardDescription>10 preguntas aleatorias de todos los temas</CardDescription>
                </CardHeader>
              </Card>

              {topics.map((topic) => (
                <Card
                  key={topic}
                  className="cursor-pointer hover:border-[#10B981] transition-all border-2"
                  onClick={() => startTest(topic)}
                >
                  <CardHeader>
                    <CardTitle className="text-lg">{topic}</CardTitle>
                    <CardDescription>
                      {questions.filter(q => q.topic === topic).length} preguntas disponibles
                    </CardDescription>
                  </CardHeader>
                </Card>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  const current = testQuestions[currentIndex];
  const progress = ((currentIndex + 1) / testQuestions.length) * 100;

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#F8FAFC] via-white to-[#F8FAFC]">
      <header className="border-b bg-white/80 backdrop-blur-sm">
        <div className="container mx-auto px-4 py-4">
          <Link href="/" className="text-2xl font-bold text-[#1B3A5C]">Oposita+</Link>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8">
        <div className="max-w-3xl mx-auto">
          {/* Progress Bar */}
          <div className="mb-6">
            <div className="flex justify-between mb-2">
              <span className="text-sm font-medium text-[#1B3A5C]">
                Pregunta {currentIndex + 1} de {testQuestions.length}
              </span>
              <Badge variant="outline">{current.topic}</Badge>
            </div>
            <Progress value={progress} className="h-2" />
          </div>

          {/* Question Card */}
          <Card>
            <CardHeader>
              <CardTitle className="text-2xl">{current.question}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <RadioGroup value={selectedAnswer} onValueChange={setSelectedAnswer} disabled={showExplanation}>
                <div className="space-y-3">
                  {current.options.map((option, i) => {
                    const letter = String.fromCharCode(65 + i);
                    const isThisCorrect = letter === current.correct;
                    const isSelected = selectedAnswer === letter;
                    
                    return (
                      <div
                        key={i}
                        className={`flex items-center space-x-3 p-4 rounded-lg border-2 transition-all ${
                          showExplanation
                            ? isThisCorrect
                              ? 'border-[#10B981] bg-green-50'
                              : isSelected
                              ? 'border-red-500 bg-red-50'
                              : 'border-gray-200'
                            : isSelected
                            ? 'border-[#10B981] bg-green-50'
                            : 'border-gray-200 hover:border-[#10B981]'
                        }`}
                      >
                        <RadioGroupItem value={letter} id={`option-${i}`} />
                        <Label htmlFor={`option-${i}`} className="flex-1 cursor-pointer">
                          {option}
                        </Label>
                        {showExplanation && isThisCorrect && (
                          <Check className="h-5 w-5 text-[#10B981]" />
                        )}
                        {showExplanation && isSelected && !isThisCorrect && (
                          <X className="h-5 w-5 text-red-500" />
                        )}
                      </div>
                    );
                  })}
                </div>
              </RadioGroup>

              {showExplanation && (
                <div className={`p-4 rounded-lg ${isCorrect ? 'bg-green-50 border border-[#10B981]' : 'bg-red-50 border border-red-500'}`}>
                  <div className="flex items-start gap-2 mb-2">
                    {isCorrect ? (
                      <Check className="h-5 w-5 text-[#10B981] mt-0.5" />
                    ) : (
                      <X className="h-5 w-5 text-red-500 mt-0.5" />
                    )}
                    <div>
                      <p className="font-semibold mb-1">
                        {isCorrect ? '¡Correcto!' : 'Incorrecto'}
                      </p>
                      <p className="text-sm text-gray-700">{current.explanation}</p>
                    </div>
                  </div>
                </div>
              )}

              <div className="flex gap-4">
                {!showExplanation ? (
                  <Button
                    onClick={handleAnswer}
                    disabled={!selectedAnswer}
                    className="w-full bg-[#10B981] hover:bg-[#059669]"
                  >
                    Responder
                  </Button>
                ) : (
                  <Button
                    onClick={handleNext}
                    className="w-full bg-[#1B3A5C] hover:bg-[#152e4a]"
                  >
                    {currentIndex < testQuestions.length - 1 ? 'Siguiente' : 'Ver Resultados'}
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
