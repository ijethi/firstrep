import type { BodyWeightEntry, WorkoutSessionLocal } from '../types/database';

/**
 * Progress calculations (B-07) — PURE functions over local history. No I/O,
 * no Date.now, no UI. Robust to no sessions, partial sessions, skipped
 * exercises, and missing cardio. Used by the Progress dashboard.
 */

export interface ProgressSummary {
  totalWorkouts: number; // completed sessions
  currentStreak: number; // consecutive days ending at the latest completed workout
  totalSets: number;
  totalCardioMinutes: number;
  exercisesCompleted: number;
}

export interface StrengthProgress {
  exerciseId: string;
  name: string;
  bestWeightLb: number | null;
  recentWeightLb: number | null;
  sessions: number; // sessions where this exercise had logged sets
  learning: boolean; // not enough data yet → show encouraging copy
}

export interface CardioProgress {
  totalMinutes: number;
  bestDuration: number;
  recentMachine: string | null;
  sessions: number;
}

export interface WeightProgress {
  latestKg: number | null;
  firstKg: number | null;
  changeKg: number | null; // latest - first
  count: number;
}

const dateKey = (iso: string): string => iso.slice(0, 10); // YYYY-MM-DD

export function currentStreak(history: WorkoutSessionLocal[]): number {
  const days = Array.from(
    new Set(
      history
        .filter((s) => s.status === 'completed' && s.completedAtISO)
        .map((s) => dateKey(s.completedAtISO as string)),
    ),
  ).sort(); // ascending
  if (days.length === 0) return 0;

  let streak = 1;
  for (let i = days.length - 1; i > 0; i -= 1) {
    const cur = Date.parse(`${days[i]}T00:00:00Z`);
    const prev = Date.parse(`${days[i - 1]}T00:00:00Z`);
    if ((cur - prev) / 86_400_000 === 1) streak += 1;
    else break;
  }
  return streak;
}

export function summarize(history: WorkoutSessionLocal[]): ProgressSummary {
  let totalSets = 0;
  let totalCardioMinutes = 0;
  let exercisesCompleted = 0;

  for (const s of history) {
    for (const ex of s.exercises) {
      totalSets += ex.sets.length;
      if (!ex.skipped && ex.sets.length > 0) exercisesCompleted += 1;
    }
    if (s.cardio && !s.cardio.skipped) totalCardioMinutes += s.cardio.completedMinutes ?? 0;
  }

  return {
    totalWorkouts: history.filter((s) => s.status === 'completed').length,
    currentStreak: currentStreak(history),
    totalSets,
    totalCardioMinutes,
    exercisesCompleted,
  };
}

export function strengthProgress(history: WorkoutSessionLocal[]): StrengthProgress[] {
  const map = new Map<
    string,
    { exerciseId: string; name: string; best: number | null; recent: number | null; sessions: number }
  >();

  for (const s of history) {
    for (const ex of s.exercises) {
      const weights = ex.sets.map((x) => x.weightLb).filter((w): w is number => w != null);
      const cur =
        map.get(ex.exerciseId) ??
        { exerciseId: ex.exerciseId, name: ex.name, best: null, recent: null, sessions: 0 };
      if (!ex.skipped && ex.sets.length > 0) cur.sessions += 1;
      if (weights.length > 0) {
        const localBest = Math.max(...weights);
        cur.best = cur.best == null ? localBest : Math.max(cur.best, localBest);
        cur.recent = weights[weights.length - 1]; // later sessions overwrite → most recent
      }
      map.set(ex.exerciseId, cur);
    }
  }

  return Array.from(map.values()).map((m) => ({
    exerciseId: m.exerciseId,
    name: m.name,
    bestWeightLb: m.best,
    recentWeightLb: m.recent,
    sessions: m.sessions,
    learning: m.sessions < 2 || m.best == null,
  }));
}

export function cardioProgress(history: WorkoutSessionLocal[]): CardioProgress {
  let totalMinutes = 0;
  let bestDuration = 0;
  let recentMachine: string | null = null;
  let sessions = 0;

  for (const s of history) {
    if (s.cardio && !s.cardio.skipped) {
      const m = s.cardio.completedMinutes ?? 0;
      totalMinutes += m;
      bestDuration = Math.max(bestDuration, m);
      recentMachine = s.cardio.machine;
      sessions += 1;
    }
  }

  return { totalMinutes, bestDuration, recentMachine, sessions };
}

export function weightProgress(entries: BodyWeightEntry[]): WeightProgress {
  if (entries.length === 0) return { latestKg: null, firstKg: null, changeKg: null, count: 0 };
  const sorted = [...entries].sort((a, b) => a.loggedOnISO.localeCompare(b.loggedOnISO));
  const firstKg = sorted[0].weightKg;
  const latestKg = sorted[sorted.length - 1].weightKg;
  return { latestKg, firstKg, changeKg: latestKg - firstKg, count: sorted.length };
}

/** Beginner-friendly weekly message based on how many workouts are done. */
export function weeklyMessage(totalWorkouts: number): string {
  if (totalWorkouts <= 0) return 'Your goal this week is consistency, not perfection.';
  if (totalWorkouts === 1) return 'Nice start. One completed workout is already progress.';
  if (totalWorkouts < 3) return 'Your goal this week is consistency, not perfection.';
  return "You're building a real habit. Keep showing up! 🔥";
}
