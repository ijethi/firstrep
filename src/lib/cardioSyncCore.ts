import type { CardioMachine, WorkoutSessionLocal } from '../types/database';
import { localSessionId } from './workoutSyncCore';

/**
 * Cardio sync core (B-22) — PURE mapping + policy helpers (node-testable).
 * Syncs ONLY cardio_logs from COMPLETED sessions. Conflict policy: LOCAL WINS.
 * Depends on the session already being synced (id resolved by the caller).
 */

export type CardioSyncDirection = 'push' | 'pull' | 'noop';

/** A completed session has syncable cardio if it did cardio (not skipped, has minutes). */
export function hasSyncableCardio(s: WorkoutSessionLocal): boolean {
  return (
    s.status === 'completed' &&
    !!s.cardio &&
    !s.cardio.skipped &&
    s.cardio.completedMinutes != null
  );
}

export function syncableCardioSessions(history: WorkoutSessionLocal[]): WorkoutSessionLocal[] {
  return history.filter(hasSyncableCardio);
}

/** Deterministic local id. One cardio block per session → index defaults to 0. */
export function localCardioId(sessionLocalId: string, index = 0): string {
  return `cardio:${sessionLocalId}:${index}`;
}

/** Local-wins: local cardio present → push (even if remote exists); else pull; else noop. */
export function decideCardioSyncDirection(
  localHasCardio: boolean,
  remoteHasCardio: boolean,
): CardioSyncDirection {
  if (localHasCardio) return 'push';
  if (remoteHasCardio) return 'pull';
  return 'noop';
}

export interface CardioRow {
  user_id: string;
  session_id: string; // remote workout_sessions.id (resolved via local_session_id)
  machine: CardioMachine;
  minutes: number | null;
  distance: number | null;
  level_or_incline: string | null;
  effort: string | null;
  calories_est: number | null;
  source: 'manual';
  logged_at: string;
  local_cardio_log_id: string;
}

/**
 * Map a completed session's cardio block → a cardio_logs row. Only call for
 * sessions where `hasSyncableCardio` is true (cardio is non-null there).
 */
export function toCardioRow(
  s: WorkoutSessionLocal,
  userId: string,
  sessionRemoteId: string,
): CardioRow {
  const cardio = s.cardio!;
  const sessionLocalId = localSessionId(s);
  return {
    user_id: userId,
    session_id: sessionRemoteId,
    machine: cardio.machine,
    minutes: cardio.completedMinutes,
    distance: null,
    level_or_incline: null,
    effort: cardio.intensity, // 'easy' | 'moderate' | 'hard' (free text column)
    calories_est: null,
    source: 'manual',
    logged_at: s.completedAtISO ?? s.startedAtISO,
    local_cardio_log_id: localCardioId(sessionLocalId, 0),
  };
}

/**
 * PULL deferred this loop: cardio_logs doesn't store the local cardio block's
 * `plannedMinutes`, and cardio lives inside `WorkoutSessionLocal` (not a standalone
 * local store) — so a faithful reconstruction into local state isn't safe. Push
 * works; documented in the review.
 */
export const CARDIO_PULL_SUPPORTED = false;
