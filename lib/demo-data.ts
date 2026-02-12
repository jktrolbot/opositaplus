import { questionBanks } from '@/data/questions';
import type { Question } from '@/data/questions/types';
import { storage, type StudyPlan, type TestResult, type UserProgress } from '@/lib/storage';

type SupportedDemoSlug = 'xunta-a1' | 'tecnicos-hacienda';

interface DemoDataset {
  history: TestResult[];
  progress: UserProgress;
  plan?: StudyPlan;
}

const XUNTA_TOPIC_LABELS: Record<string, string> = {
  constitucion: 'Constitución',
  'estatuto-galicia': 'Estatuto Galicia',
  'ley-39-2015': 'Ley 39/2015',
  'ley-40-2015': 'Ley 40/2015',
  'derecho-admin': 'Derecho Administrativo',
  'funcion-publica-galicia': 'Función Pública',
};

const TECNICOS_TOPIC_LABELS: Record<string, string> = {
  'derecho-tributario': 'Derecho Tributario',
  irpf: 'IRPF',
  iva: 'IVA',
  'impuesto-sociedades': 'Impuesto Sociedades',
  'procedimientos-tributarios': 'Procedimientos Tributarios',
};

const XUNTA_DAY_OFFSETS = [21, 20, 19, 18, 17, 16, 15, 14, 13, 12, 11, 10, 9, 8, 7, 6, 5, 4, 3, 2, 1, 0, 0];
const XUNTA_SCORES = [
  0.55, 0.57, 0.6, 0.62, 0.64, 0.66, 0.68, 0.69, 0.71, 0.72, 0.73, 0.74, 0.75, 0.76, 0.77, 0.78, 0.79,
  0.8, 0.81, 0.82, 0.82, 0.82, 0.82,
];
const XUNTA_TOPIC_SEQUENCE = [
  'ley-40-2015',
  'derecho-admin',
  'ley-40-2015',
  'ley-39-2015',
  'funcion-publica-galicia',
  'derecho-admin',
  'ley-40-2015',
  'estatuto-galicia',
  'ley-39-2015',
  'funcion-publica-galicia',
  'derecho-admin',
  'estatuto-galicia',
  'ley-39-2015',
  'funcion-publica-galicia',
  'estatuto-galicia',
  'constitucion',
  'ley-39-2015',
  'funcion-publica-galicia',
  'estatuto-galicia',
  'constitucion',
  'ley-39-2015',
  'constitucion',
  'constitucion',
];
const XUNTA_TIME_SPENT_SECONDS = [
  870, 840, 820, 800, 780, 760, 740, 730, 710, 700, 680, 670, 650, 640, 620, 610, 590, 580, 560, 550, 530,
  520, 500,
];

const TECNICOS_DAY_OFFSETS = [14, 12, 10, 8, 6, 4, 2, 0];
const TECNICOS_SCORES = [0.58, 0.6, 0.62, 0.64, 0.65, 0.67, 0.69, 0.71];
const TECNICOS_TOPIC_SEQUENCE = [
  'derecho-tributario',
  'irpf',
  'iva',
  'impuesto-sociedades',
  'procedimientos-tributarios',
  'iva',
  'irpf',
  'derecho-tributario',
];
const TECNICOS_TIME_SPENT_SECONDS = [780, 760, 730, 700, 680, 650, 620, 600];

export function isDemoSlugSupported(slug: string) {
  return slug === 'xunta-a1' || slug === 'tecnicos-hacienda';
}

function formatLocalDate(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function buildIsoDate(daysAgo: number, hour: number, minute: number) {
  const value = new Date();
  value.setHours(hour, minute, 0, 0);
  value.setDate(value.getDate() - daysAgo);
  return value.toISOString();
}

function indexQuestionsByTopic(questions: Question[]) {
  return questions.reduce<Record<string, string[]>>((accumulator, question) => {
    if (!accumulator[question.topic]) {
      accumulator[question.topic] = [];
    }
    accumulator[question.topic].push(question.id);
    return accumulator;
  }, {});
}

function selectWrongAnswers(
  topic: string,
  wrongCount: number,
  topicQuestionIds: Record<string, string[]>,
  allQuestionIds: string[],
  seed: number,
) {
  if (wrongCount <= 0 || allQuestionIds.length === 0) return [];

  const scoped = topicQuestionIds[topic] ?? [];
  const pool = [...scoped, ...allQuestionIds];
  const selected: string[] = [];
  let cursor = seed % pool.length;

  while (selected.length < wrongCount && selected.length < allQuestionIds.length) {
    const candidate = pool[cursor % pool.length];
    if (!selected.includes(candidate)) {
      selected.push(candidate);
    }
    cursor += 2;
  }

  if (selected.length < wrongCount) {
    for (const fallbackId of allQuestionIds) {
      if (!selected.includes(fallbackId)) {
        selected.push(fallbackId);
      }
      if (selected.length === wrongCount) break;
    }
  }

  return selected;
}

function buildXuntaHistory() {
  const questionPool = questionBanks['xunta-a1'] ?? [];
  const byTopic = indexQuestionsByTopic(questionPool);
  const allQuestionIds = questionPool.map((question) => question.id);

  return XUNTA_SCORES.map<TestResult>((score, index) => {
    const topicId = XUNTA_TOPIC_SEQUENCE[index];
    const wrongCount = Math.max(1, Math.min(6, Math.round((1 - score) * 10)));
    const wrongAnswers = selectWrongAnswers(topicId, wrongCount, byTopic, allQuestionIds, index + 1);
    const daysAgo = XUNTA_DAY_OFFSETS[index];
    const hour =
      daysAgo === 0 && index === XUNTA_SCORES.length - 2
        ? 10
        : daysAgo === 0 && index === XUNTA_SCORES.length - 1
          ? 20
          : 18 + (index % 3);
    const minute = (12 + index * 7) % 60;

    return {
      id: `demo-xunta-a1-${String(index + 1).padStart(2, '0')}`,
      date: buildIsoDate(daysAgo, hour, minute),
      topic: XUNTA_TOPIC_LABELS[topicId] ?? topicId,
      score,
      totalQuestions: 10,
      timeSpent: XUNTA_TIME_SPENT_SECONDS[index] ?? 600,
      wrongAnswers,
    };
  });
}

function buildXuntaPlan() {
  const topics = [
    XUNTA_TOPIC_LABELS.constitucion,
    XUNTA_TOPIC_LABELS['estatuto-galicia'],
    XUNTA_TOPIC_LABELS['ley-39-2015'],
    XUNTA_TOPIC_LABELS['ley-40-2015'],
    XUNTA_TOPIC_LABELS['derecho-admin'],
    XUNTA_TOPIC_LABELS['funcion-publica-galicia'],
  ];

  const completionMatrix: boolean[][] = [
    [true, true, true, true, true, true, false],
    [true, true, true, true, true, false, true],
    [true, true, true, true, false, true, false],
    [true, true, false, false, false, false, false],
    [false, false, true, false, false, false, false],
    [false, false, false, false, false, false, false],
    [false, false, false, false, false, false, false],
    [false, false, false, false, false, false, false],
  ];

  const planStart = new Date();
  planStart.setHours(0, 0, 0, 0);
  planStart.setDate(planStart.getDate() - 21);

  const weeks: StudyPlan['weeks'] = [];
  const cursor = new Date(planStart);

  for (let weekIndex = 0; weekIndex < 8; weekIndex += 1) {
    const days: StudyPlan['weeks'][number]['days'] = [];

    for (let dayIndex = 0; dayIndex < 7; dayIndex += 1) {
      const cycleIndex = weekIndex * 7 + dayIndex;
      days.push({
        date: formatLocalDate(cursor),
        topics: [topics[cycleIndex % topics.length], topics[(cycleIndex + 2) % topics.length]],
        completed: completionMatrix[weekIndex]?.[dayIndex] ?? false,
      });
      cursor.setDate(cursor.getDate() + 1);
    }

    weeks.push({ week: weekIndex + 1, days });
  }

  return {
    examDate: '2026-06-15',
    hoursPerDay: 3,
    topics,
    weeks,
  };
}

function buildXuntaDataset(): DemoDataset {
  const history = buildXuntaHistory();
  const lastEntry = history[history.length - 1];

  return {
    history,
    progress: {
      testsCompleted: 23,
      averageScore: 72,
      studyStreak: 5,
      totalStudyTime: 2340 * 60,
      lastStudyDate: lastEntry?.date ?? new Date().toISOString(),
      topicScores: {
        [XUNTA_TOPIC_LABELS.constitucion]: { correct: 85, total: 100 },
        [XUNTA_TOPIC_LABELS['estatuto-galicia']]: { correct: 78, total: 100 },
        [XUNTA_TOPIC_LABELS['ley-39-2015']]: { correct: 71, total: 100 },
        [XUNTA_TOPIC_LABELS['funcion-publica-galicia']]: { correct: 68, total: 100 },
        [XUNTA_TOPIC_LABELS['derecho-admin']]: { correct: 62, total: 100 },
        [XUNTA_TOPIC_LABELS['ley-40-2015']]: { correct: 58, total: 100 },
      },
    },
    plan: buildXuntaPlan(),
  };
}

function buildTecnicosDataset(): DemoDataset {
  const questionPool = questionBanks['tecnicos-hacienda'] ?? [];
  const byTopic = indexQuestionsByTopic(questionPool);
  const allQuestionIds = questionPool.map((question) => question.id);

  const history = TECNICOS_SCORES.map<TestResult>((score, index) => {
    const topicId = TECNICOS_TOPIC_SEQUENCE[index];
    const wrongCount = Math.max(2, Math.min(6, Math.round((1 - score) * 10)));
    const wrongAnswers = selectWrongAnswers(topicId, wrongCount, byTopic, allQuestionIds, index + 100);
    const hour = 17 + (index % 2);
    const minute = (index * 11) % 60;

    return {
      id: `demo-tecnicos-${String(index + 1).padStart(2, '0')}`,
      date: buildIsoDate(TECNICOS_DAY_OFFSETS[index], hour, minute),
      topic: TECNICOS_TOPIC_LABELS[topicId] ?? topicId,
      score,
      totalQuestions: 10,
      timeSpent: TECNICOS_TIME_SPENT_SECONDS[index] ?? 600,
      wrongAnswers,
    };
  });

  const lastEntry = history[history.length - 1];

  return {
    history,
    progress: {
      testsCompleted: 8,
      averageScore: 65,
      studyStreak: 2,
      totalStudyTime: 780 * 60,
      lastStudyDate: lastEntry?.date ?? new Date().toISOString(),
      topicScores: {
        [TECNICOS_TOPIC_LABELS['derecho-tributario']]: { correct: 65, total: 100 },
        [TECNICOS_TOPIC_LABELS.irpf]: { correct: 62, total: 100 },
        [TECNICOS_TOPIC_LABELS.iva]: { correct: 67, total: 100 },
        [TECNICOS_TOPIC_LABELS['impuesto-sociedades']]: { correct: 61, total: 100 },
        [TECNICOS_TOPIC_LABELS['procedimientos-tributarios']]: { correct: 64, total: 100 },
      },
    },
  };
}

function resolveTargets(targetSlug?: string): SupportedDemoSlug[] {
  const normalized = targetSlug?.trim().toLowerCase();

  if (normalized === 'tecnicos-hacienda') {
    return ['tecnicos-hacienda'];
  }

  return ['xunta-a1', 'tecnicos-hacienda'];
}

function persistDataset(slug: SupportedDemoSlug, dataset: DemoDataset) {
  const scopedStorage = storage.forOposicion(slug);
  scopedStorage.clearAll();

  for (const result of dataset.history) {
    scopedStorage.addTestResult(result);
  }

  scopedStorage.setProgress(dataset.progress);
  if (dataset.plan) {
    scopedStorage.setStudyPlan(dataset.plan);
  }
}

export function seedDemoData(targetSlug?: string) {
  if (typeof window === 'undefined') return [];

  const xunta = buildXuntaDataset();
  const tecnicos = buildTecnicosDataset();
  const datasets: Record<SupportedDemoSlug, DemoDataset> = {
    'xunta-a1': xunta,
    'tecnicos-hacienda': tecnicos,
  };

  const targets = resolveTargets(targetSlug);
  for (const slug of targets) {
    persistDataset(slug, datasets[slug]);
  }

  return targets;
}
