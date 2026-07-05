import type { OnboardingAnswers } from '../state/onboardingStore';

/**
 * Profile/onboarding sync core (B-18) — PURE helpers, no store/supabase imports
 * (node-testable). Conflict policy for this loop: LOCAL WINS (the device the user
 * built on is the source of truth until full conflict handling is designed).
 */

export type SyncStatus = 'idle' | 'syncing' | 'success' | 'error' | 'disabled';
export type SyncDirection = 'push' | 'pull' | 'noop';

/**
 * Local-wins:
 *  - local onboarding complete  → PUSH local to Supabase (even if remote exists)
 *  - local not complete, remote has data → PULL remote into local
 *  - neither                    → NOOP
 */
export function decideSyncDirection(localComplete: boolean, remoteHasData: boolean): SyncDirection {
  if (localComplete) return 'push';
  if (remoteHasData) return 'pull';
  return 'noop';
}

/**
 * Reconstruct local OnboardingAnswers from the remote `onboarding_answers.answers`
 * jsonb (produced by toOnboardingAnswers). Defensive against missing fields.
 */
export function answersFromRemote(raw: Record<string, unknown> | null | undefined): OnboardingAnswers {
  const r = raw ?? {};
  const num = (v: unknown): number | null => (typeof v === 'number' ? v : null);
  return {
    unitPref: r.unit_pref === 'metric' ? 'metric' : 'imperial',
    goal: r.goal === 'weight_loss' ? 'weight_loss' : null,
    sex: (r.sex as OnboardingAnswers['sex']) ?? null,
    age: num(r.age),
    heightCm: num(r.height_cm),
    currentWeightKg: num(r.current_weight_kg),
    goalWeightKg: num(r.goal_weight_kg),
    experience: (r.experience as OnboardingAnswers['experience']) ?? null,
    daysPerWeek: num(r.days_per_week),
    workoutLengthMin: (num(r.workout_length_min) as OnboardingAnswers['workoutLengthMin']) ?? null,
    injuries: Array.isArray(r.injuries) ? (r.injuries as string[]) : [],
  };
}
