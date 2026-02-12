import { NextResponse } from 'next/server';
import questions from '@/data/questions.json';

export async function POST(request: Request) {
  try {
    const { topics = [], difficulty = 'medium', count = 10, history = {} } = await request.json();

    let pool = questions as any[];

    if (topics.length > 0) {
      pool = pool.filter((q) => topics.includes(q.topic));
    }

    // Basic adaptive behavior: if recent score low -> easier mix, high -> harder mix
    const recentScore = typeof history?.recentScore === 'number' ? history.recentScore : 0.6;
    const targetDifficulty =
      recentScore < 0.5 ? 'easy' : recentScore > 0.8 ? 'hard' : difficulty;

    const filtered = pool.filter((q) => q.difficulty === targetDifficulty);
    const source = filtered.length >= count ? filtered : pool;

    const selected = [...source].sort(() => Math.random() - 0.5).slice(0, count);

    return NextResponse.json({
      questions: selected,
      meta: { targetDifficulty, totalAvailable: source.length },
    });
  } catch (error) {
    return NextResponse.json({ error: 'No se pudo generar el test' }, { status: 500 });
  }
}
