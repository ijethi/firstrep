# WORKOUT_SYNC_REVIEW.md — B-21 checker pass

> Reviews workout session + set sync against DATA_MODEL.md, SYNC_PLAN.md, and the
> local persistence pattern. Last updated: 2026-06-29

---

## 1. Scope (SYNC_PLAN step 4 only)
Syncs ONLY completed `workout_sessions` + strength `exercise_sets`. NOT cardio_logs, body weight,
measurements, photos, recommendations, weekly check-ins. No AI/nutrition/analytics/photo-upload. Local-first.

## 2. What syncs (req 3–8, verified)
- **Completed sessions only.** `isSyncableSession(s) = s.status === 'completed'`. Abandoned and active
  (`in_progress`) sessions are excluded (asserted). Discarded sessions never reach `progressStore.history`
  (B-15 discards without saving), so they can't sync either.
- **Strength sets only.** `toSetRows` iterates `s.exercises` (strength) — `s.cardio` is never read, so
  no cardio leaks into `exercise_sets` (asserted: rows contain no cardio fields). A mixed session syncs
  its session row + strength sets; its cardio block is left for B-22.

## 3. Schema safety — non-destructive migration 003 (req: schema safety)
`workout_sessions`/`exercise_sets` had no client-id columns for de-dup. `003_workout_sync_ids.sql` adds:
- `workout_sessions.local_session_id text` + `unique(user_id, local_session_id)` (upsert target).
- `exercise_sets.local_set_id text` + index.
**NON-DESTRUCTIVE:** 2 add-column statements, 0 drops/renames (verified). Local ids are deterministic
from immutable fields: `local_session_id = startedAtISO`; `local_set_id = startedAtISO#exerciseId#setIndex`.

## 4. Conflict policy — LOCAL WINS (verified)
`decideWorkoutSyncDirection(localHasCompleted, remoteHasSessions)`: local completed history present →
push (even if remote exists); else pull; else noop. Asserted (incl. local+remote → push).

## 5. Remote write strategy
Per completed session: **upsert `workout_sessions` by `(user_id, local_session_id)`** → get remote id;
then **delete this session's `exercise_sets` and reinsert** its strength sets (the sanctioned "delete +
reinsert sets only for the synced local sessions" — no unique needed on exercise_sets). Exercise slugs
are resolved to remote `exercises.id`; a missing slug **stops** the sync (no broken FK). Only the
signed-in user's rows for the synced sessions are touched. NO other tables.

## 6. PULL deferred (documented schema gap)
`workout_sessions`/`exercise_sets` don't store the full local session view (`dayName`, week/day,
per-exercise `name`/`targetSets`/`repMin`/`repMax`/`restSeconds`, the cardio block,
`currentExerciseIndex`, per-exercise `painReported`/`skipped`). A faithful `WorkoutSessionLocal` can't be
reconstructed, so `syncWorkouts` does not apply a pull (`WORKOUT_PULL_SUPPORTED=false`). Push works;
lossless pull would need a richer schema (or a `session_json` column) in a later loop.

## 7. Local history never mutated (req 13, and checker) — verified
`syncWorkouts`/`pushSessions` only READ `progressStore.history`. No writes to any local store; no
`addSession`, no clears. On any error → status set, return; history untouched (req 13). App never blocked
(req 14).

## 8. Missing config / signed out (req 15 — verified)
`supabase === null` or no `user` → status `disabled`, returns, no crash. Card disables the button.

## 9. Settings + status + persistence (req 16, 17)
`WorkoutSyncCard` — "Sync workouts" + status + last-synced + the exact copy: "Only completed strength
workouts and sets sync here. Cardio, photos, and measurements stay on this device for now."
`lastSyncedAtISO` persisted (B-10 pattern; hydration + reset wired).

## 10. Secrets
None committed; `.env` gitignored.

## 11. Tests (executed, pure) + typecheck
22 assertions: syncable (completed only; abandoned/active excluded), direction (incl. local-wins), stable
ids, `dbEffort`, `toSessionRow` columns, `toSetRows` (strength-only, cardio-excluded, uuid resolution,
effort/pain, deterministic local_set_id, missing-slug stop), `WORKOUT_PULL_SUPPORTED=false`. **All pass.**
`tsc --noEmit` clean. Migration sanity: 2 add-column, 0 destructive.

## 12. Verdict
✅ Completed strength sessions + sets only; abandoned/active/discarded excluded; cardio never synced;
local-wins; upsert by local id + reinsert sets; non-destructive migration; local history never mutated;
safe/disabled when unconfigured or signed out; failures never erase history. Scope strictly respected.
