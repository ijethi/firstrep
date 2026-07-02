import { create } from 'zustand';
import { persist } from 'zustand/middleware';

import type {
  CardioIntensity,
  Effort,
  ExerciseLog,
  LoggedSet,
  PlanDay,
  SetEffort,
  WorkoutSessionLocal,
} from '../types/database';
import { appJSONStorage } from '../lib/storage';
import { migratePersisted, PERSIST_VERSION, STORAGE_KEYS } from '../lib/persistConfig';

/**
 * Live workout session store (B-05; persisted for recovery in B-15) — LOCAL ONLY.
 *
 * Captures everything B-06's trainer logic needs (reps, weight, effort, pain,
 * skips, cardio) + `currentExerciseIndex` for resume. Now PERSISTED so an
 * in-progress workout survives a reload (recovery flow in lib/sessionRecovery.ts).
 * Only durable session data is stored — NO transient rest-timer countdown.
 */
interface WorkoutSessionState {
  session: WorkoutSessionLocal | null;
  startSession: (day: PlanDay, nowISO: string) => void;
  logSet: (exerciseIndex: number, set: Omit<LoggedSet, 'setIndex'>) => void;
  reportPain: (exerciseIndex: number) => void;
  skipExercise: (exerciseIndex: number) => void;
  logCardio: (data: { completedMinutes: number | null; intensity: CardioIntensity | null }) => void;
  skipCardio: () => void;
  setCurrentExerciseIndex: (index: number) => void;
  finish: (status: 'completed' | 'abandoned', nowISO: string) => void;
  clear: () => void;
}

function buildSession(day: PlanDay, nowISO: string): WorkoutSessionLocal {
  const exercises: ExerciseLog[] = day.strength.map((ex) => ({
    exerciseId: ex.exerciseId,
    slug: ex.slug,
    name: ex.name,
    targetSets: ex.sets,
    repMin: ex.repMin,
    repMax: ex.repMax,
    restSeconds: ex.restSeconds,
    sets: [],
    painReported: false,
    skipped: false,
  }));

  return {
    weekNumber: day.weekNumber,
    dayNumber: day.dayNumber,
    dayName: day.name,
    startedAtISO: nowISO,
    completedAtISO: null,
    status: 'in_progress',
    exercises,
    cardio: day.cardio
      ? {
          machine: day.cardio.machine,
          plannedMinutes: day.cardio.minutes,
          completedMinutes: null,
          intensity: null,
          skipped: false,
        }
      : null,
    currentExerciseIndex: 0,
  };
}

export const useWorkoutSessionStore = create<WorkoutSessionState>()(
  persist(
    (set) => ({
      session: null,

      startSession: (day, nowISO) => set({ session: buildSession(day, nowISO) }),

  logSet: (exerciseIndex, partial) =>
    set((s) => {
      if (!s.session) return s;
      const exercises = s.session.exercises.map((ex, i) => {
        if (i !== exerciseIndex) return ex;
        const nextSet: LoggedSet = { ...partial, setIndex: ex.sets.length + 1 };
        return {
          ...ex,
          sets: [...ex.sets, nextSet],
          painReported: ex.painReported || partial.pain,
        };
      });
      return { session: { ...s.session, exercises } };
    }),

  reportPain: (exerciseIndex) =>
    set((s) => {
      if (!s.session) return s;
      const exercises = s.session.exercises.map((ex, i) =>
        i === exerciseIndex ? { ...ex, painReported: true } : ex,
      );
      return { session: { ...s.session, exercises } };
    }),

  skipExercise: (exerciseIndex) =>
    set((s) => {
      if (!s.session) return s;
      const exercises = s.session.exercises.map((ex, i) =>
        i === exerciseIndex ? { ...ex, skipped: true } : ex,
      );
      return { session: { ...s.session, exercises } };
    }),

  logCardio: (data) =>
    set((s) => {
      if (!s.session || !s.session.cardio) return s;
      return {
        session: {
          ...s.session,
          cardio: { ...s.session.cardio, ...data, skipped: false },
        },
      };
    }),

  skipCardio: () =>
    set((s) => {
      if (!s.session || !s.session.cardio) return s;
      return { session: { ...s.session, cardio: { ...s.session.cardio, skipped: true } } };
    }),

  setCurrentExerciseIndex: (index) =>
    set((s) => (s.session ? { session: { ...s.session, currentExerciseIndex: index } } : s)),

  finish: (status, nowISO) =>
    set((s) => {
      if (!s.session) return s;
      return { session: { ...s.session, status, completedAtISO: nowISO } };
    }),

      clear: () => set({ session: null }),
    }),
    {
      name: STORAGE_KEYS.workoutSession,
      storage: appJSONStorage,
      version: PERSIST_VERSION,
      migrate: (s, v) => migratePersisted(s, v),
      partialize: (s) => ({ session: s.session }),
    },
  ),
);

/** Map the friendly UI effort to the DB `exercise_sets.effort` enum (for B-06 / persistence). */
export function setEffortToDbEffort(effort: SetEffort | null): Effort | null {
  switch (effort) {
    case 'easy':
      return 'easy';
    case 'good':
      return 'just_right';
    case 'hard':
      return 'too_hard';
    default:
      return null;
  }
}
