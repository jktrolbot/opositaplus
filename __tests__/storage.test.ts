import { describe, it, expect, beforeEach } from 'vitest';

// Mock localStorage
const localStore: Record<string, string> = {};
const mockLocalStorage = {
  getItem: (key: string) => localStore[key] ?? null,
  setItem: (key: string, value: string) => { localStore[key] = value; },
  removeItem: (key: string) => { delete localStore[key]; },
  clear: () => { for (const k of Object.keys(localStore)) delete localStore[k]; },
  get length() { return Object.keys(localStore).length; },
  key: (i: number) => Object.keys(localStore)[i] ?? null,
};

// @ts-expect-error - mock
globalThis.localStorage = mockLocalStorage;

// Mock supabase client to avoid actual imports
import { vi } from 'vitest';
vi.mock('@/lib/supabase/client', () => ({
  createClient: () => ({
    auth: {
      getUser: () => Promise.resolve({ data: { user: null } }),
    },
    from: () => ({
      insert: () => Promise.resolve({ error: null }),
    }),
  }),
}));

// Now import storage after mocks
const { storage } = await import('@/lib/storage');

describe('Storage (localStorage backend)', () => {
  beforeEach(() => {
    mockLocalStorage.clear();
  });

  it('returns default progress for new oposicion', () => {
    const store = storage.forOposicion('test-opo');
    const progress = store.getProgress();
    expect(progress.testsCompleted).toBe(0);
    expect(progress.averageScore).toBe(0);
    expect(progress.studyStreak).toBe(0);
  });

  it('stores and retrieves test results', () => {
    const store = storage.forOposicion('test-opo');
    store.addTestResult({
      id: 'test-1',
      date: new Date().toISOString(),
      topic: 'Constitución',
      score: 0.8,
      totalQuestions: 10,
      timeSpent: 300,
      wrongAnswers: ['q1', 'q2'],
    });

    const history = store.getTestHistory();
    expect(history).toHaveLength(1);
    expect(history[0].score).toBe(0.8);

    const progress = store.getProgress();
    expect(progress.testsCompleted).toBe(1);
  });

  it('tracks wrong answers', () => {
    const store = storage.forOposicion('test-opo');
    store.addTestResult({
      id: 'test-1',
      date: new Date().toISOString(),
      topic: 'Test',
      score: 0.5,
      totalQuestions: 4,
      timeSpent: 100,
      wrongAnswers: ['q1', 'q2'],
    });
    expect(store.getWrongAnswers()).toEqual(['q1', 'q2']);
  });

  it('manages study plans', () => {
    const store = storage.forOposicion('test-opo');
    expect(store.getStudyPlan()).toBeNull();

    const plan = {
      examDate: '2026-06-01',
      hoursPerDay: 3,
      topics: ['Tema 1'],
      weeks: [{
        week: 1,
        days: [{ date: '2026-02-14', topics: ['Tema 1'], completed: false }],
      }],
    };
    store.setStudyPlan(plan);
    expect(store.getStudyPlan()?.examDate).toBe('2026-06-01');

    store.updateDayCompletion(0, 0, true);
    expect(store.getStudyPlan()?.weeks[0].days[0].completed).toBe(true);
  });

  it('scopes data by oposicion slug', () => {
    const store1 = storage.forOposicion('opo-a');
    const store2 = storage.forOposicion('opo-b');

    store1.addTestResult({
      id: 'test-1',
      date: new Date().toISOString(),
      topic: 'A',
      score: 1,
      totalQuestions: 5,
      timeSpent: 60,
      wrongAnswers: [],
    });

    expect(store1.getTestHistory()).toHaveLength(1);
    expect(store2.getTestHistory()).toHaveLength(0);
  });

  it('clearAll removes all data for an oposicion', () => {
    const store = storage.forOposicion('test-opo');
    store.addTestResult({
      id: 'test-1',
      date: new Date().toISOString(),
      topic: 'Test',
      score: 1,
      totalQuestions: 5,
      timeSpent: 60,
      wrongAnswers: [],
    });
    store.clearAll();
    expect(store.getTestHistory()).toHaveLength(0);
    expect(store.getProgress().testsCompleted).toBe(0);
  });
});
