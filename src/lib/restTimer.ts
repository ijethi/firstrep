/**
 * Rest-timer helpers (B-16) — PURE. Formatting + safe bounds. No timer state is
 * ever persisted (see RestTimer.tsx); this is display/arithmetic only.
 */

const MAX_REST_SECONDS = 15 * 60; // sane upper bound so +15s can't run away

/** "m:ss" countdown display. Clamps negatives to 0. */
export function formatCountdown(totalSeconds: number): string {
  const t = Math.max(0, Math.floor(totalSeconds));
  const mm = Math.floor(t / 60);
  const ss = t % 60;
  return `${mm}:${ss.toString().padStart(2, '0')}`;
}

/** Add/subtract seconds, kept within [0, MAX_REST_SECONDS]. */
export function adjustSeconds(current: number, delta: number): number {
  return Math.min(MAX_REST_SECONDS, Math.max(0, current + delta));
}

/** A safe initial rest duration (fallback when the exercise has none). */
export function initialRest(seconds: number): number {
  return seconds > 0 ? Math.min(seconds, MAX_REST_SECONDS) : 30;
}
