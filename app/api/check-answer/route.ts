import { NextResponse } from 'next/server';
import { getAllQuestions, getQuestionsByOposicion } from '@/data/questions';

export async function POST(request: Request) {
  try {
    const { questionId, userAnswer, oposicion } = await request.json();

    const pool =
      typeof oposicion === 'string' && oposicion.length > 0
        ? getQuestionsByOposicion(oposicion)
        : getAllQuestions();

    const question = pool.find((item) => item.id === questionId);

    if (!question) {
      return NextResponse.json({ error: 'Pregunta no encontrada' }, { status: 404 });
    }

    const correct = userAnswer === question.correct;

    return NextResponse.json({
      correct,
      correctAnswer: question.correct,
      explanation: question.explanation,
      topic: question.topic,
      lawReference: question.lawReference,
    });
  } catch {
    return NextResponse.json({ error: 'No se pudo validar la respuesta' }, { status: 500 });
  }
}
