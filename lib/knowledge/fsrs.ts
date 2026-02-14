export type FsrsRating = 1 | 2 | 3 | 4;

export interface FsrsState {
  version: 'fsrs-6';
  difficulty: number;
  stability: number;
  retrievability: number;
  last_review: string;
  due: string;
  lapses: number;
  desired_retention: number;
  decay: number;
}

export interface FsrsReviewResult {
  fsrsState: FsrsState;
  nextReview: Date;
  intervalDays: number;
  repetitions: number;
  easiness: number;
}

const DEFAULT_PARAMS = [
  0.4, 1.2, 3.2, 15.7, 7.2, 0.53, 1.46, 0.0046, 1.55, 0.12, 1.02,
  1.94, 0.11, 0.3, 2.27, 0.23, 2.99, 0.52, 0.66, 0.15, 0.5,
] as const;

const RATING_INTERVAL_MULTIPLIER: Record<FsrsRating, number> = {
  1: 0,
  2: 0.8,
  3: 1,
  4: 1.3,
};

function clamp(value: number, min: number, max: number) {
  return Math.max(min, Math.min(max, value));
}

function daysBetween(a: Date, b: Date) {
  return Math.max(0, (a.getTime() - b.getTime()) / (1000 * 60 * 60 * 24));
}

function addDays(base: Date, days: number) {
  return new Date(base.getTime() + days * 24 * 60 * 60 * 1000);
}

function getParam(index: number) {
  return DEFAULT_PARAMS[index] ?? 0;
}

function initialStability(rating: FsrsRating) {
  const value = getParam(rating - 1);
  return clamp(value, 0.1, 36500);
}

function initialDifficulty(rating: FsrsRating) {
  // FSRS-5/6 D0 formula
  const raw = getParam(4) - Math.exp(getParam(5) * (rating - 1)) + 1;
  return clamp(raw, 1, 10);
}

function updateDifficulty(current: number, rating: FsrsRating) {
  // FSRS linear damping + mean reversion
  const delta = -getParam(6) * (rating - 3);
  const damped = current + (delta * (10 - current)) / 9;
  const target = initialDifficulty(4);
  const revised = getParam(7) * target + (1 - getParam(7)) * damped;
  return clamp(revised, 1, 10);
}

function retrievability(elapsedDays: number, stability: number, decay: number) {
  const safeStability = Math.max(0.1, stability);
  const safeDecay = Math.max(0.05, decay);
  const factor = Math.pow(0.9, -1 / safeDecay) - 1;
  return Math.pow(1 + (factor * elapsedDays) / safeStability, -safeDecay);
}

function intervalFromRetention(stability: number, targetRetention: number, decay: number) {
  const safeStability = Math.max(0.1, stability);
  const retention = clamp(targetRetention, 0.7, 0.97);
  const safeDecay = Math.max(0.05, decay);
  const factor = Math.pow(0.9, -1 / safeDecay) - 1;
  const interval = (safeStability / factor) * (Math.pow(retention, -1 / safeDecay) - 1);
  return Math.max(0, interval);
}

function stabilityAfterRecall(
  stability: number,
  difficulty: number,
  retrievabilityValue: number,
  rating: FsrsRating,
) {
  const hardPenalty = rating === 2 ? getParam(15) : 1;
  const easyBonus = rating === 4 ? getParam(16) : 1;

  const gain =
    Math.exp(getParam(8)) *
    (11 - difficulty) *
    Math.pow(stability, -getParam(9)) *
    (Math.exp(getParam(10) * (1 - retrievabilityValue)) - 1) *
    hardPenalty *
    easyBonus;

  return clamp(stability * (1 + gain), 0.1, 36500);
}

function stabilityAfterForget(stability: number, difficulty: number, retrievabilityValue: number) {
  const value =
    getParam(11) *
    Math.pow(difficulty, -getParam(12)) *
    (Math.pow(stability + 1, getParam(13)) - 1) *
    Math.exp(getParam(14) * (1 - retrievabilityValue));

  return clamp(value, 0.1, 36500);
}

function stabilitySameDay(stability: number, rating: FsrsRating) {
  // FSRS-6 same-day review update
  const value =
    stability *
    Math.exp(getParam(17) * (rating - 3 + getParam(18))) *
    Math.pow(stability, -getParam(19));

  return clamp(value, 0.1, 36500);
}

function parseState(input: unknown): FsrsState | null {
  if (!input || typeof input !== 'object') return null;
  const candidate = input as Partial<FsrsState>;

  if (
    typeof candidate.stability !== 'number' ||
    typeof candidate.difficulty !== 'number' ||
    typeof candidate.last_review !== 'string'
  ) {
    return null;
  }

  return {
    version: 'fsrs-6',
    stability: clamp(candidate.stability, 0.1, 36500),
    difficulty: clamp(candidate.difficulty, 1, 10),
    retrievability: clamp(candidate.retrievability ?? 1, 0, 1),
    last_review: candidate.last_review,
    due: candidate.due ?? candidate.last_review,
    lapses: Math.max(0, candidate.lapses ?? 0),
    desired_retention: clamp(candidate.desired_retention ?? 0.9, 0.7, 0.97),
    decay: clamp(candidate.decay ?? getParam(20), 0.05, 2),
  };
}

export function runFsrsReview(args: {
  rating: FsrsRating;
  now?: Date;
  previousState?: unknown;
  previousRepetitions?: number;
  desiredRetention?: number;
}) {
  const now = args.now ?? new Date();
  const rating = args.rating;
  const previous = parseState(args.previousState);
  const decay = clamp(previous?.decay ?? getParam(20), 0.05, 2);
  const desiredRetention = clamp(args.desiredRetention ?? previous?.desired_retention ?? 0.9, 0.7, 0.97);

  if (!previous) {
    const stability = initialStability(rating);
    const difficulty = initialDifficulty(rating);
    const intervalBase = intervalFromRetention(stability, desiredRetention, decay);
    const intervalDays =
      rating === 1 ? 0 : Math.max(1, Math.round(intervalBase * RATING_INTERVAL_MULTIPLIER[rating]));

    const nextReview = intervalDays === 0 ? now : addDays(now, intervalDays);
    const fsrsState: FsrsState = {
      version: 'fsrs-6',
      difficulty,
      stability,
      retrievability: rating === 1 ? 0.35 : 1,
      last_review: now.toISOString(),
      due: nextReview.toISOString(),
      lapses: rating === 1 ? 1 : 0,
      desired_retention: desiredRetention,
      decay,
    };

    return {
      fsrsState,
      nextReview,
      intervalDays,
      repetitions: rating === 1 ? 0 : 1,
      easiness: Number((11 - difficulty).toFixed(4)),
    } satisfies FsrsReviewResult;
  }

  const elapsedDays = daysBetween(now, new Date(previous.last_review));
  const previousStability = Math.max(0.1, previous.stability);
  const previousDifficulty = clamp(previous.difficulty, 1, 10);

  let updatedStability = previousStability;
  if (elapsedDays < 1) {
    updatedStability = stabilitySameDay(previousStability, rating);
  } else {
    const r = retrievability(elapsedDays, previousStability, decay);
    if (rating === 1) {
      updatedStability = stabilityAfterForget(previousStability, previousDifficulty, r);
    } else {
      updatedStability = stabilityAfterRecall(previousStability, previousDifficulty, r, rating);
    }
  }

  const updatedDifficulty = updateDifficulty(previousDifficulty, rating);
  const baseInterval = intervalFromRetention(updatedStability, desiredRetention, decay);
  const intervalDays =
    rating === 1
      ? Math.max(1, Math.round(Math.min(1.5, baseInterval)))
      : Math.max(1, Math.round(baseInterval * RATING_INTERVAL_MULTIPLIER[rating]));

  const nextReview = addDays(now, intervalDays);
  const repetitions = rating === 1 ? 0 : (args.previousRepetitions ?? 0) + 1;
  const lapses = previous.lapses + (rating === 1 ? 1 : 0);

  const fsrsState: FsrsState = {
    version: 'fsrs-6',
    difficulty: updatedDifficulty,
    stability: updatedStability,
    retrievability: retrievability(0, updatedStability, decay),
    last_review: now.toISOString(),
    due: nextReview.toISOString(),
    lapses,
    desired_retention: desiredRetention,
    decay,
  };

  return {
    fsrsState,
    nextReview,
    intervalDays,
    repetitions,
    easiness: Number((11 - updatedDifficulty).toFixed(4)),
  } satisfies FsrsReviewResult;
}
