/**
 * Plan-progress sync core (B-20) — PURE helpers, no store/supabase imports
 * (node-testable). Conflict policy: LOCAL WINS. This maps ONLY plan progress —
 * it is a passthrough of `completedDayIds` and never derives completion from
 * sessions (so an abandoned session can never advance synced progress).
 */

export type ProgressSyncDirection = 'push' | 'pull' | 'noop';

export interface LocalProgress {
  completedDayIds: string[];
  lastCompletedDayId: string | null;
  selectedDayId: string | null;
}

/** True when the device has any progress worth syncing. */
export function progressHasData(p: LocalProgress): boolean {
  return p.completedDayIds.length > 0 || p.lastCompletedDayId != null || p.selectedDayId != null;
}

/** Local-wins: local progress present → push (even if remote exists); else pull; else noop. */
export function decideProgressSyncDirection(
  localHasProgress: boolean,
  remoteHasProgress: boolean,
): ProgressSyncDirection {
  if (localHasProgress) return 'push';
  if (remoteHasProgress) return 'pull';
  return 'noop';
}

export interface PlanProgressRow {
  user_id: string;
  workout_plan_id: string | null;
  completed_day_ids: string[];
  last_completed_day_id: string | null;
  selected_day_id: string | null;
}

/** Local → plan_progress row. Pure passthrough — never fabricates completed days. */
export function toProgressRow(
  userId: string,
  workoutPlanId: string | null,
  p: LocalProgress,
): PlanProgressRow {
  return {
    user_id: userId,
    workout_plan_id: workoutPlanId,
    completed_day_ids: [...p.completedDayIds],
    last_completed_day_id: p.lastCompletedDayId,
    selected_day_id: p.selectedDayId,
  };
}

/** plan_progress row → local progress, defensive against bad/partial jsonb. */
export function progressFromRow(row: Record<string, unknown> | null | undefined): LocalProgress {
  const r = row ?? {};
  const ids = Array.isArray(r.completed_day_ids)
    ? (r.completed_day_ids as unknown[]).filter((v): v is string => typeof v === 'string')
    : [];
  const str = (v: unknown): string | null => (typeof v === 'string' && v.length > 0 ? v : null);
  return {
    completedDayIds: ids,
    lastCompletedDayId: str(r.last_completed_day_id),
    selectedDayId: str(r.selected_day_id),
  };
}
