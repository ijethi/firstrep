/**
 * Persistence config (B-10) — PURE, no native imports (testable in node).
 * Storage keys, version, migration, and a partialize helper shared by the
 * Zustand `persist` wrappers. The AsyncStorage adapter lives in lib/storage.ts.
 */

export const STORAGE_KEYS = {
  onboarding: 'firstrep:onboarding',
  plan: 'firstrep:plan',
  planProgress: 'firstrep:plan-progress',
  progress: 'firstrep:progress',
  recommendation: 'firstrep:recommendation',
  weeklyCheckIn: 'firstrep:weekly-checkin',
  workoutSession: 'firstrep:workout-session',
} as const;

/** Bump when a persisted store's shape changes; add a branch in migratePersisted. */
export const PERSIST_VERSION = 1;

/**
 * v1 migration is a no-op. Structure is here so a future version can transform
 * old persisted state (e.g. rename a field) instead of dropping the user's data.
 */
export function migratePersisted<T>(persistedState: unknown, _version: number): T {
  // version 1: nothing to migrate yet.
  return persistedState as T;
}

/** Keep only the given keys (drops actions/functions) for persistence. */
export function pickKeys<T extends object, K extends keyof T>(state: T, keys: K[]): Pick<T, K> {
  const out = {} as Pick<T, K>;
  for (const k of keys) out[k] = state[k];
  return out;
}
