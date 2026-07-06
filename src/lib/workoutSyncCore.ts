import type { Effort, SetEffort, WorkoutSessionLocal } from '../types/database';

/**
 * Workout sync core (B-21) — PURE mapping + policy helpers (node-testable).
 * Syncs ONLY completed workout_sessions + strength exercise_sets. Conflict
 * policy: LOCAL WINS. Cardio is intentionally NOT mapped (left for B-22).
 */

export type WorkoutSyncDirection = 'push' | 'pull' | 'noop';

/** Only genuinely completed sessions sync. Abandoned/active never do. */
export function isSyncableSession(s: WorkoutSessionLocal): boolean {
  return s.status === 'completed';
}

export function syncableSessions(history: WorkoutSessionLocal[]): WorkoutSessionLocal[] {
  return history.filter(isSyncableSession);
}

/** Stable local id from an immutable field (start time is unique per session). */
export function localSessionId(s: WorkoutSessionLocal): string {
  return s.startedAtISO;
}

export function localSetId(s: WorkoutSessionLocal, exerciseId: string, setIndex: number): string {
  return `${s.startedAtISO}#${exerciseId}#${setIndex}`;
}

/** UI effort → DB `exercise_sets.effort` enum. */
export function dbEffort(effort: SetEffort | null): Effort | null {
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

/** Local-wins: local completed history present → push (even if remote exists). */
export function decideWorkoutSyncDirection(
  localHasCompleted: boolean,
  remoteHasSessions: boolean,
): WorkoutSyncDirection {
  if (localHasCompleted) return 'push';
  if (remoteHasSessions) return 'pull';
  return 'noop';
}

// ---- row mapping (subset of DATA_MODEL columns) --------------------------

export interface SessionRow {
  user_id: string;
  workout_day_id: string | null; // remote day uuid unknown from local → null
  started_at: string;
  completed_at: string | null;
  status: 'completed';
  felt_overall: Effort | null;
  local_session_id: string;
}

export interface SetRow {
  session_id: string; // remote workout_sessions.id
  exercise_id: string; // remote exercises.id (uuid), resolved from local slug
  set_index: number;
  weight_lb: number | null;
  reps: number | null;
  effort: Effort | null;
  pain_flag: boolean;
  source: 'manual';
  local_set_id: string;
}

export function toSessionRow(s: WorkoutSessionLocal, userId: string): SessionRow {
  return {
    user_id: userId,
    workout_day_id: null,
    started_at: s.startedAtISO,
    completed_at: s.completedAtISO,
    status: 'completed',
    felt_overall: null, // not captured in the local session model
    local_session_id: localSessionId(s),
  };
}

/**
 * Map a session's STRENGTH sets to exercise_sets rows. Cardio (s.cardio) is
 * intentionally ignored (B-22). `slugToId` resolves the local slug to the remote
 * `exercises.id`; unresolved slugs are reported so the caller can STOP.
 */
export function toSetRows(
  s: WorkoutSessionLocal,
  sessionRemoteId: string,
  slugToId: Record<string, string>,
): { rows: SetRow[]; missingSlugs: string[] } {
  const rows: SetRow[] = [];
  const missingSlugs: string[] = [];
  for (const ex of s.exercises) {
    const exerciseId = slugToId[ex.slug];
    if (!exerciseId) {
      if (ex.sets.length > 0 && !missingSlugs.includes(ex.slug)) missingSlugs.push(ex.slug);
      continue;
    }
    for (const set of ex.sets) {
      rows.push({
        session_id: sessionRemoteId,
        exercise_id: exerciseId,
        set_index: set.setIndex,
        weight_lb: set.weightLb,
        reps: set.reps,
        effort: dbEffort(set.effort),
        pain_flag: set.pain,
        source: 'manual',
        local_set_id: localSetId(s, ex.exerciseId, set.setIndex),
      });
    }
  }
  return { rows, missingSlugs };
}

/**
 * PULL deferred this loop: workout_sessions/exercise_sets don't store the full
 * local session view (dayName, week/day, per-exercise targets/name, cardio block,
 * currentExerciseIndex, per-exercise pain/skip). A faithful local session can't be
 * reconstructed safely, so we do not apply a pull. Push works. Documented in review.
 */
export const WORKOUT_PULL_SUPPORTED = false;
