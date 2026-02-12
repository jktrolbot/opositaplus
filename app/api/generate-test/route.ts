import { NextResponse } from 'next/server';
import type { Question } from '@/data/questions/types';

type Payload = {
  oposicion?: string;
  topics?: string[];
  difficulty?: 'easy' | 'medium' | 'hard';
  count?: number;
  history?: { recentScore?: number };
};

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

async function loadQuestionsBySlug(slug: string) {
  const importer = questionImporters[slug];
  if (!importer) return [] as Question[];
  return await importer();
}

async function readPayload(request: Request): Promise<Payload> {
  if (request.method !== 'POST') return {};
  try {
    return (await request.json()) as Payload;
  } catch {
    return {};
  }
}

function pickQuestions(pool: Question[], count: number) {
  return [...pool].sort(() => Math.random() - 0.5).slice(0, count);
}

async function handleRequest(request: Request) {
  const url = new URL(request.url);
  const body = await readPayload(request);

  const oposicion =
    url.searchParams.get('oposicion') ||
    (typeof body.oposicion === 'string' ? body.oposicion : '');

  if (!oposicion) {
    return NextResponse.json({ error: 'Parametro oposicion requerido' }, { status: 400 });
  }

  const allQuestions = await loadQuestionsBySlug(oposicion);
  if (allQuestions.length === 0) {
    return NextResponse.json({ error: 'No hay preguntas para esta oposicion' }, { status: 404 });
  }

  const topics = Array.isArray(body.topics) ? body.topics : [];
  const requestedCount = Number.isFinite(body.count) ? Number(body.count) : 10;
  const count = Math.max(1, Math.min(60, requestedCount));

  let pool = allQuestions;
  if (topics.length > 0) {
    pool = allQuestions.filter((question) => topics.includes(question.topic));
  }

  if (pool.length === 0) {
    pool = allQuestions;
  }

  const recentScore = typeof body.history?.recentScore === 'number' ? body.history.recentScore : 0.6;
  const requestedDifficulty = body.difficulty ?? 'medium';
  const targetDifficulty = recentScore < 0.5 ? 'easy' : recentScore > 0.8 ? 'hard' : requestedDifficulty;

  const difficultyPool = pool.filter((question) => question.difficulty === targetDifficulty);
  const source = difficultyPool.length >= count ? difficultyPool : pool;

  return NextResponse.json({
    questions: pickQuestions(source, count),
    meta: {
      oposicion,
      targetDifficulty,
      totalAvailable: source.length,
    },
  });
}

export async function GET(request: Request) {
  try {
    return await handleRequest(request);
  } catch {
    return NextResponse.json({ error: 'No se pudo generar el test' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    return await handleRequest(request);
  } catch {
    return NextResponse.json({ error: 'No se pudo generar el test' }, { status: 500 });
  }
}
