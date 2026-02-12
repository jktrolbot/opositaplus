'use client';

export interface TestResult {
  id: string;
  date: string;
  topic: string;
  score: number;
  totalQuestions: number;
  timeSpent: number;
  wrongAnswers: string[];
}

export interface UserProgress {
  testsCompleted: number;
  averageScore: number;
  studyStreak: number;
  totalStudyTime: number;
  lastStudyDate: string;
  topicScores: Record<string, { correct: number; total: number }>;
}

export interface StudyPlan {
  examDate: string;
  hoursPerDay: number;
  topics: string[];
  weeks: Array<{
    week: number;
    days: Array<{
      date: string;
      topics: string[];
      completed: boolean;
    }>;
  }>;
}

function safeParse<T>(value: string | null, fallback: T): T {
  if (!value) return fallback;
  try {
    return JSON.parse(value) as T;
  } catch {
    return fallback;
  }
}

function normalizeSlug(slug: string) {
  return slug.trim().toLowerCase().replace(/[^a-z0-9-]/g, '-') || 'general';
}

function getDefaultProgress(): UserProgress {
  return {
    testsCompleted: 0,
    averageScore: 0,
    studyStreak: 0,
    totalStudyTime: 0,
    lastStudyDate: new Date().toISOString(),
    topicScores: {},
  };
}

function buildKeys(oposicionSlug: string) {
  const normalized = normalizeSlug(oposicionSlug);
  return {
    progress: `opositaplus_${normalized}_progress`,
    history: `opositaplus_${normalized}_test_history`,
    legacyHistory: `opositaplus_${normalized}_history`,
    plan: `opositaplus_${normalized}_plan`,
  };
}

function createScopedStorage(oposicionSlug: string) {
  const keys = buildKeys(oposicionSlug);

  return {
    getProgress(): UserProgress {
      if (typeof window === 'undefined') return getDefaultProgress();
      return safeParse<UserProgress>(localStorage.getItem(keys.progress), getDefaultProgress());
    },

    setProgress(progress: UserProgress) {
      if (typeof window === 'undefined') return;
      localStorage.setItem(keys.progress, JSON.stringify(progress));
    },

    getTestHistory(): TestResult[] {
      if (typeof window === 'undefined') return [];
      const current = safeParse<TestResult[]>(localStorage.getItem(keys.history), []);
      if (current.length > 0) return current;
      return safeParse<TestResult[]>(localStorage.getItem(keys.legacyHistory), []);
    },

    addTestResult(result: TestResult) {
      if (typeof window === 'undefined') return;

      const history = this.getTestHistory();
      history.push(result);
      localStorage.setItem(keys.history, JSON.stringify(history));

      const progress = this.getProgress();
      const previousStudyDate = progress.lastStudyDate;

      progress.testsCompleted = history.length;
      progress.totalStudyTime += result.timeSpent;
      progress.lastStudyDate = result.date;

      const totalScore = history.reduce((sum, item) => sum + item.score, 0);
      progress.averageScore = Math.round((totalScore / history.length) * 100);

      if (!progress.topicScores[result.topic]) {
        progress.topicScores[result.topic] = { correct: 0, total: 0 };
      }
      progress.topicScores[result.topic].correct += Math.round(result.score * result.totalQuestions);
      progress.topicScores[result.topic].total += result.totalQuestions;

      const previousDate = new Date(previousStudyDate);
      const currentDate = new Date(result.date);
      const diffDays = Math.floor(
        (currentDate.getTime() - previousDate.getTime()) / (1000 * 60 * 60 * 24),
      );

      if (progress.studyStreak === 0) {
        progress.studyStreak = 1;
      } else if (diffDays === 0) {
        // same day, keep streak
      } else if (diffDays === 1) {
        progress.studyStreak += 1;
      } else {
        progress.studyStreak = 1;
      }

      this.setProgress(progress);
    },

    getWrongAnswers(): string[] {
      return this.getTestHistory().flatMap((test) => test.wrongAnswers);
    },

    getStudyPlan(): StudyPlan | null {
      if (typeof window === 'undefined') return null;
      return safeParse<StudyPlan | null>(localStorage.getItem(keys.plan), null);
    },

    setStudyPlan(plan: StudyPlan) {
      if (typeof window === 'undefined') return;
      localStorage.setItem(keys.plan, JSON.stringify(plan));
    },

    updateDayCompletion(weekIndex: number, dayIndex: number, completed: boolean) {
      if (typeof window === 'undefined') return;
      const plan = this.getStudyPlan();
      if (!plan) return;

      if (!plan.weeks[weekIndex] || !plan.weeks[weekIndex].days[dayIndex]) return;

      plan.weeks[weekIndex].days[dayIndex].completed = completed;
      this.setStudyPlan(plan);
    },

    clearAll() {
      if (typeof window === 'undefined') return;
      localStorage.removeItem(keys.progress);
      localStorage.removeItem(keys.history);
      localStorage.removeItem(keys.legacyHistory);
      localStorage.removeItem(keys.plan);
    },
  };
}

export const storage = {
  forOposicion(oposicionSlug: string) {
    return createScopedStorage(oposicionSlug);
  },
};
