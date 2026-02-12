import { NextResponse } from 'next/server';
import questions from '@/data/questions.json';

export async function POST(request: Request) {
  try {
    const { questionId, userAnswer } = await request.json();
    const q = (questions as any[]).find((item) => item.id === questionId);

    if (!q) {
      return NextResponse.json({ error: 'Pregunta no encontrada' }, { status: 404 });
    }

    const correct = userAnswer === q.correct;

    return NextResponse.json({
      correct,
      correctAnswer: q.correct,
      explanation: q.explanation,
      topic: q.topic,
    });
  } catch (error) {
    return NextResponse.json({ error: 'No se pudo validar la respuesta' }, { status: 500 });
  }
}
