# GENERATED_PLAN_SYNC_REVIEW.md — B-19 checker pass

> Reviews generated-plan sync against DATA_MODEL.md, SYNC_PLAN.md, and the local
> persistence pattern. Last updated: 2026-06-29

---

## 1. Scope (SYNC_PLAN step 2 only)
Syncs ONLY the generated 4-week plan: `workout_plans`, `workout_days`, `workout_exercises`. Nothing
else — no plan progress / completed_day_ids, sessions, sets, cardio, weight, measurements, photos,
recommendations, weekly check-ins. No AI/nutrition/analytics/photo-upload. App stays local-first.

## 2. Pieces
- `lib/planSyncCore.ts` (**pure**): `decidePlanSyncDirection` (local-wins), `toPlanRow`/`toDayRow`/
  `toExerciseRows` (with slug→uuid resolution + missing detection), `PLAN_PULL_SUPPORTED=false`.
- `lib/planSync.ts`: `syncPlan(user)` — push tree; pull deferred; safe/disabled when unconfigured/out.
- `state/planSyncStore.ts`: status + persisted `lastSyncedAtISO`.
- `components/PlanSyncCard.tsx` in Settings; `authStore` triggers `syncPlan` on sign-in/up.

## 3. Conflict policy — LOCAL WINS (verified)
`decidePlanSyncDirection(localHasPlan, remoteHasPlan)`: local plan present → **push** (even if remote
exists); else remote → pull; else noop. Asserted (incl. local+remote → push).

## 4. Push = delete-then-reinsert the user's plan tree (sanctioned by req)
`workout_plans` has no `unique(user_id)`, so a clean upsert of the nested tree isn't possible. Per the
loop's "delete and reinsert only the signed-in user's remote generated plan tree" guidance, `pushPlan`:
1. resolves local slugs → remote `exercises.id` via `select id, slug from exercises`;
2. `delete from workout_plans where user_id = me` (days/exercises cascade via FK);
3. insert plan → id; per day insert → id; insert that day's `workout_exercises`.
Only the signed-in user's rows are touched. **Never** touches sessions/sets/cardio/progress/etc.

## 5. Exercise id mapping (slug ↔ uuid) — schema reality
Local `PlanStrengthExercise.exerciseId` is a **slug**; remote `workout_exercises.exercise_id` is a
**uuid** FK → `exercises`. `toExerciseRows(day, dayId, slugToId)` resolves each slug to its remote uuid.
Any slug not present remotely is returned in `missingSlugs`; `pushPlan` then **throws and stops**
(status='error') rather than writing a broken FK — matches req 9 ("document and stop, don't hack").
This means a real push requires the remote `exercises` seed to be applied (documented dependency).

## 6. PULL is DEFERRED this loop (documented schema gap)
`workout_days`/`workout_exercises` store only a subset of the local plan view. The local `PlanDay`
carries fields the schema does NOT hold: the **cardio block**, `name` ("Full Body A/B"), `beginnerNote`,
`estimatedMinutes`, and per-exercise `startingWeightGuidance`. So a faithful local plan can't be
reconstructed from these tables, and regenerating during sync is forbidden (req 11). Therefore
`syncPlan` detects a remote plan but **does not apply a pull** (`PLAN_PULL_SUPPORTED=false`); local stays
the source of truth. A future loop can add a `workout_plans.plan_json` column (or richer day/exercise
columns) to enable a lossless pull.

## 7. Local plan never mutated / regenerated (req 10, 11 — verified by design)
`syncPlan`/`pushPlan` only **read** `usePlanStore.getState().plan`. No `setPlan`, no `generatePlan`
call anywhere in the sync path. On any error, status is set and we return — the local plan is untouched
(req 6). The app is never blocked by a sync failure (req 7).

## 8. Missing Supabase config / signed out (req 8 — verified)
`supabase === null` or no `user` → `syncPlan` sets `disabled` and returns; the card disables the button.
No crash.

## 9. Status + persistence
`SyncStatus = idle|syncing|success|error|disabled` (shared type). `lastSyncedAtISO` persisted (B-10
pattern; added to `useAppHydrated` + `resetLocalAppData`). `status`/`lastError` transient.

## 10. Secrets
No secrets committed; `.env` gitignored (only `.env.example` placeholders).

## 11. Tests (executed, pure) + typecheck
14 assertions: direction (4, incl. local-wins), `toPlanRow`/`toDayRow` column maps, `toExerciseRows`
(uuid resolution, order_index, sets/reps/rest, catalog `suggested_weight_lb`, missing-slug detection),
and `PLAN_PULL_SUPPORTED=false`. **All pass.** Full `tsc --noEmit` clean.

## 12. Verdict
✅ Generated plan push only; local-wins; delete-then-reinsert user tree; slug→uuid resolved with
stop-on-mismatch; pull deferred + documented; local plan never mutated/regenerated; safe/disabled when
unconfigured or signed out; failures never erase local plan. Scope strictly respected.
