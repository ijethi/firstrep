# PLAN_PROGRESS_SYNC_REVIEW.md — B-20 checker pass

> Reviews plan-progress sync against DATA_MODEL.md, SYNC_PLAN.md, and the local
> persistence pattern. Last updated: 2026-06-29

---

## 1. Scope (SYNC_PLAN step 3 only)
Syncs ONLY plan progress: `completedDayIds`, `lastCompletedDayId`, `selectedDayId`. Nothing else — no
workout sessions, sets, cardio, weight, measurements, photos, recommendations, weekly check-ins. No AI/
nutrition/analytics/photo-upload. App stays local-first.

## 2. Schema decision (req 3, 4 — non-destructive migration added)
001 has no home for plan progress. Rather than hack it into an unrelated table (req 5), B-20 adds a
**new** table via `supabase/migrations/002_plan_progress.sql`:
- `plan_progress (id, user_id UNIQUE → public.users, workout_plan_id → workout_plans, completed_day_ids
  jsonb, last_completed_day_id text, selected_day_id text, created_at, updated_at)`.
- RLS `auth.uid() = user_id` (same style as 001); `set_updated_at` trigger; indexes.
- **NON-DESTRUCTIVE:** creates one table; alters/drops nothing (verified — 0 other tables touched).
- `unique(user_id)` → clean **upsert on conflict user_id** (one row per user), no delete-then-insert.

## 3. Pieces
- `lib/planProgressSyncCore.ts` (**pure**): `progressHasData`, `decideProgressSyncDirection` (local-wins),
  `toProgressRow` (passthrough), `progressFromRow` (defensive).
- `lib/planProgressSync.ts`: `syncPlanProgress(user)` push (upsert) / pull (safe) / disabled.
- `state/planProgressSyncStore.ts`: status + persisted `lastSyncedAtISO`.
- `state/planProgressStore.ts`: `importProgress(...)` for the pull path.
- `components/PlanProgressSyncCard.tsx` in Settings; `authStore` triggers on sign-in/up.

## 4. Conflict policy — LOCAL WINS (verified)
`decideProgressSyncDirection(localHasProgress, remoteHasProgress)`: local present → push (even if remote
exists); else pull; else noop. Asserted (incl. local+remote → push).

## 5. Push / pull
- **Push:** `upsert(toProgressRow(user, planId, local), { onConflict: 'user_id' })`. `workout_plan_id`
  is best-effort resolved from the user's `workout_plans` row (null if none / on error). Clean and idempotent.
- **Pull:** applied ONLY when local has no progress; mapping is fully safe here (plain strings + a string
  array), so `importProgress` brings remote in. `completed_day_ids` are string-filtered defensively.

## 6. Abandoned sessions can't advance synced progress (req 13 — verified)
Sync is a **passthrough** of `completedDayIds`; it never inspects session status or fabricates
completions. The invariant that `completedDayIds` only ever contains genuinely-completed days is
enforced upstream: `planProgressStore.markDayCompleted` is called ONLY from `concludeSession('completed')`
(B-15) — abandoned/discarded never mark. Asserted: `toProgressRow` copies the array exactly (no extras).

## 7. Local plan & history never mutated (req 12, 14 — verified)
`syncPlanProgress` only reads `planProgressStore` (and reads `workout_plans` for a best-effort link).
It never calls `setPlan`/`generatePlan`, never writes sessions/sets, and on the pull path only replaces
plan *progress* (not the plan, not history). On any error it sets status and returns — local untouched.

## 8. Missing config / signed out (req 11 — verified)
`supabase === null` or no `user` → status `disabled`, returns, no crash. Card disables the button.

## 9. Status + persistence
`lastSyncedAtISO` persisted (B-10 pattern; added to `useAppHydrated` + `resetLocalAppData`).
`status`/`lastError` transient.

## 10. Secrets
None committed; `.env` gitignored (only `.env.example`).

## 11. Tests (executed, pure) + typecheck
17 assertions: `progressHasData`, direction (incl. local-wins), `toProgressRow` passthrough + no
fabrication + null plan id, `progressFromRow` defenses (null/garbage/non-string filtering). **All pass.**
Full `tsc --noEmit` clean. Migration sanity: 1 new table, RLS on, unique(user_id) FK, 0 other tables touched.

## 12. Verdict
✅ Plan progress only; local-wins; clean upsert via a new non-destructive `plan_progress` table with RLS;
pull is safe and guarded; abandoned sessions can't advance synced progress; local plan/history never
mutated; safe/disabled when unconfigured or signed out; failures never erase local progress. Scope respected.
