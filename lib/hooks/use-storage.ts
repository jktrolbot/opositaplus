'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { storage, type UserProgress, type TestResult, type StudyPlan } from '@/lib/storage';

export function useStorage(oppositionSlug: string) {
  const store = useMemo(() => storage.forOposicion(oppositionSlug), [oppositionSlug]);
  const [progress, setProgress] = useState<UserProgress | null>(null);
  const [testHistory, setTestHistory] = useState<TestResult[]>([]);
  const [studyPlan, setStudyPlan] = useState<StudyPlan | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);

    Promise.all([
      store.getProgress(),
      store.getTestHistory(),
      store.getStudyPlan(),
    ]).then(([p, h, s]) => {
      if (cancelled) return;
      setProgress(p);
      setTestHistory(h);
      setStudyPlan(s);
      setLoading(false);
    }).catch(() => {
      if (!cancelled) setLoading(false);
    });

    return () => { cancelled = true; };
  }, [store]);

  const addTestResult = useCallback(async (result: TestResult) => {
    await store.addTestResult(result);
    setTestHistory((prev) => [...prev, result]);
    const p = await store.getProgress();
    setProgress(p);
  }, [store]);

  const saveStudyPlan = useCallback(async (plan: StudyPlan) => {
    await store.setStudyPlan(plan);
    setStudyPlan(plan);
  }, [store]);

  const updateDayCompletion = useCallback(async (weekIndex: number, dayIndex: number, completed: boolean) => {
    await store.updateDayCompletion(weekIndex, dayIndex, completed);
    const plan = await store.getStudyPlan();
    setStudyPlan(plan);
  }, [store]);

  const getWrongAnswers = useCallback(() => {
    return store.getWrongAnswers();
  }, [store]);

  return {
    progress,
    testHistory,
    studyPlan,
    loading,
    addTestResult,
    saveStudyPlan,
    updateDayCompletion,
    getWrongAnswers,
  };
}
