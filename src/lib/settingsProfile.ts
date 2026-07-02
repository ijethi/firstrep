/**
 * Settings/profile helpers (B-13) — PURE, no store/native imports (node-testable).
 * Decide when a preference change requires regenerating the plan and/or resetting
 * plan progress.
 *
 * Rules:
 *  - Regenerate when a plan-affecting pref changes: days/week, duration, or injuries.
 *  - Reset progress ONLY when the plan STRUCTURE changes (days/week), because that
 *    changes which `w{week}-d{day}` ids exist. Duration/injury changes keep the same
 *    day ids, so completed-day progress stays valid.
 *  - Completed workout history + body weights are never touched here (separate store).
 */

export interface PlanPrefs {
  daysPerWeek: number | null;
  workoutLengthMin: number | null;
  injuries: string[];
}

/** The UI uses a 'none' sentinel; compare the real injury set. */
function normalized(injuries: string[]): string[] {
  return [...new Set(injuries.filter((v) => v !== 'none'))].sort();
}

export function injuriesEqual(a: string[], b: string[]): boolean {
  const na = normalized(a);
  const nb = normalized(b);
  return na.length === nb.length && na.every((v, i) => v === nb[i]);
}

export function samePrefs(a: PlanPrefs, b: PlanPrefs): boolean {
  return (
    a.daysPerWeek === b.daysPerWeek &&
    a.workoutLengthMin === b.workoutLengthMin &&
    injuriesEqual(a.injuries, b.injuries)
  );
}

/** Any plan-affecting pref changed → the plan should be regenerated. */
export function planAffectingChanged(prev: PlanPrefs, next: PlanPrefs): boolean {
  return !samePrefs(prev, next);
}

/** Day-count changed → day ids shift → completed-day progress must reset. */
export function structureChanged(prev: PlanPrefs, next: PlanPrefs): boolean {
  return prev.daysPerWeek !== next.daysPerWeek;
}

export interface PlanUpdateDecision {
  regenerate: boolean;
  resetProgress: boolean;
}

/** What to do after a confirmed preference change. */
export function decidePlanUpdate(prev: PlanPrefs, next: PlanPrefs): PlanUpdateDecision {
  const regenerate = planAffectingChanged(prev, next);
  return { regenerate, resetProgress: regenerate && structureChanged(prev, next) };
}
