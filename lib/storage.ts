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

export const storage = {
  getProgress(): UserProgress {
    if (typeof window === 'undefined') return getDefaultProgress();
    const data = localStorage.getItem('opositaplus_progress');
    return data ? JSON.parse(data) : getDefaultProgress();
  },

  setProgress(progress: UserProgress) {
    if (typeof window === 'undefined') return;
    localStorage.setItem('opositaplus_progress', JSON.stringify(progress));
  },

  getTestHistory(): TestResult[] {
    if (typeof window === 'undefined') return [];
    const data = localStorage.getItem('opositaplus_history');
    return data ? JSON.parse(data) : [];
  },

  addTestResult(result: TestResult) {
    if (typeof window === 'undefined') return;
    const history = this.getTestHistory();
    history.push(result);
    localStorage.setItem('opositaplus_history', JSON.stringify(history));
    
    // Update progress
    const progress = this.getProgress();
    progress.testsCompleted = history.length;
    progress.totalStudyTime += result.timeSpent;
    progress.lastStudyDate = result.date;
    
    // Update average score
    const totalScore = history.reduce((sum, r) => sum + r.score, 0);
    progress.averageScore = Math.round((totalScore / history.length) * 100);
    
    // Update topic scores
    if (!progress.topicScores[result.topic]) {
      progress.topicScores[result.topic] = { correct: 0, total: 0 };
    }
    progress.topicScores[result.topic].correct += result.score * result.totalQuestions;
    progress.topicScores[result.topic].total += result.totalQuestions;
    
    // Update streak
    const lastDate = new Date(progress.lastStudyDate);
    const today = new Date();
    const diffDays = Math.floor((today.getTime() - lastDate.getTime()) / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) {
      // Same day, keep streak
    } else if (diffDays === 1) {
      progress.studyStreak += 1;
    } else {
      progress.studyStreak = 1;
    }
    
    this.setProgress(progress);
  },

  getWrongAnswers(): string[] {
    if (typeof window === 'undefined') return [];
    const history = this.getTestHistory();
    return history.flatMap(r => r.wrongAnswers);
  },

  getStudyPlan(): StudyPlan | null {
    if (typeof window === 'undefined') return null;
    const data = localStorage.getItem('opositaplus_plan');
    return data ? JSON.parse(data) : null;
  },

  setStudyPlan(plan: StudyPlan) {
    if (typeof window === 'undefined') return;
    localStorage.setItem('opositaplus_plan', JSON.stringify(plan));
  },

  updateDayCompletion(weekIndex: number, dayIndex: number, completed: boolean) {
    if (typeof window === 'undefined') return;
    const plan = this.getStudyPlan();
    if (!plan) return;
    
    plan.weeks[weekIndex].days[dayIndex].completed = completed;
    this.setStudyPlan(plan);
  },
};

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
