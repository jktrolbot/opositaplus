import { describe, expect, it } from 'vitest';
import { runFsrsReview } from '@/lib/knowledge/fsrs';

describe('FSRS-6 engine', () => {
  it('creates initial state for a new item', () => {
    const now = new Date('2026-02-14T10:00:00.000Z');
    const result = runFsrsReview({ rating: 3, now });

    expect(result.fsrsState.version).toBe('fsrs-6');
    expect(result.intervalDays).toBeGreaterThanOrEqual(1);
    expect(result.repetitions).toBe(1);
    expect(result.fsrsState.stability).toBeGreaterThan(0);
    expect(result.nextReview.getTime()).toBeGreaterThan(now.getTime());
  });

  it('increases interval on successful subsequent review', () => {
    const firstReviewDate = new Date('2026-02-01T10:00:00.000Z');
    const first = runFsrsReview({ rating: 3, now: firstReviewDate });

    const secondReviewDate = new Date('2026-02-08T10:00:00.000Z');
    const second = runFsrsReview({
      rating: 4,
      now: secondReviewDate,
      previousState: first.fsrsState,
      previousRepetitions: first.repetitions,
    });

    expect(second.intervalDays).toBeGreaterThanOrEqual(first.intervalDays);
    expect(second.repetitions).toBeGreaterThan(first.repetitions);
    expect(second.fsrsState.stability).toBeGreaterThan(first.fsrsState.stability);
  });

  it('resets repetitions when user fails recall', () => {
    const first = runFsrsReview({ rating: 4, now: new Date('2026-02-01T10:00:00.000Z') });
    const failed = runFsrsReview({
      rating: 1,
      now: new Date('2026-02-12T10:00:00.000Z'),
      previousState: first.fsrsState,
      previousRepetitions: first.repetitions,
    });

    expect(failed.repetitions).toBe(0);
    expect(failed.intervalDays).toBeGreaterThanOrEqual(1);
    expect(failed.fsrsState.lapses).toBeGreaterThan(first.fsrsState.lapses);
  });
});
