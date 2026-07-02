import type { PlanDay, WorkoutSessionLocal } from '../types/database';

/**
 * Session recovery (B-15) — PURE helpers. Decide whether a persisted live
 * session can be SAFELY resumed and where to resume it. Conservative: if the
 * saved session looks corrupt or no longer matches its plan day, it is NOT
 * resumable and the caller should clear/ignore it.
 */

export function isInProgress(session: WorkoutSessionLocal | null): boolean {
  return !!session && session.status === 'in_progress';
}

/** Basic structural sanity (guards against corrupt persisted JSON). */
export function isStructurallyValid(session: WorkoutSessionLocal | null): boolean {
  if (!session) return false;
  if (typeof session.weekNumber !== 'number' || typeof session.dayNumber !== 'number') return false;
  if (!Array.isArray(session.exercises)) return false;
  return session.exercises.every(
    (ex) => ex && typeof ex.targetSets === 'number' && Array.isArray(ex.sets),
  );
}

/** The saved session must still match its plan day (plan may have been regenerated). */
export function sessionMatchesPlanDay(
  session: WorkoutSessionLocal | null,
  planDay: PlanDay | null,
): boolean {
  if (!session || !planDay) return false;
  if (planDay.strength.length !== session.exercises.length) return false;
  return planDay.strength.every((ex, i) => session.exercises[i]?.exerciseId === ex.exerciseId);
}

/** All three gates: in-progress + structurally valid + matches the plan day. */
export function canSafelyResume(
  session: WorkoutSessionLocal | null,
  planDay: PlanDay | null,
): boolean {
  return isInProgress(session) && isStructurallyValid(session) && sessionMatchesPlanDay(session, planDay);
}

/** Total steps = strength exercises + (1 for a cardio block, if any). */
export function totalSteps(planDay: PlanDay): number {
  return planDay.strength.length + (planDay.cardio ? 1 : 0);
}

/** Clamp the saved current step into the valid range for the plan day. */
export function resumeStepIndex(session: WorkoutSessionLocal, planDay: PlanDay): number {
  const max = Math.max(0, totalSteps(planDay) - 1);
  const idx = Number.isFinite(session.currentExerciseIndex) ? session.currentExerciseIndex : 0;
  return Math.min(Math.max(0, idx), max);
}

/** 1-based set number the user is on for the current strength exercise (for display). */
export function currentSetNumber(session: WorkoutSessionLocal): number {
  const ex = session.exercises[session.currentExerciseIndex];
  return ex ? ex.sets.length + 1 : 1;
}

export interface ResumeInfo {
  resumable: boolean;
  dayName: string;
  exerciseLabel: string; // e.g. "Chest Press · Set 2 of 3" or "Cardio"
  stepIndex: number;
}

/** Everything the Resume card needs (safe even if not resumable). */
export function resumeInfo(
  session: WorkoutSessionLocal | null,
  planDay: PlanDay | null,
): ResumeInfo | null {
  if (!isInProgress(session)) return null;
  const s = session as WorkoutSessionLocal;
  const resumable = canSafelyResume(s, planDay);
  if (!resumable || !planDay) {
    return { resumable: false, dayName: s.dayName, exerciseLabel: '', stepIndex: 0 };
  }
  const stepIndex = resumeStepIndex(s, planDay);
  let exerciseLabel: string;
  if (stepIndex < planDay.strength.length) {
    const ex = s.exercises[stepIndex];
    exerciseLabel = `${ex.name} · Set ${Math.min(ex.sets.length + 1, ex.targetSets)} of ${ex.targetSets}`;
  } else {
    exerciseLabel = 'Cardio';
  }
  return { resumable: true, dayName: s.dayName, exerciseLabel, stepIndex };
}
