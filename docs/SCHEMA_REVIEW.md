# SCHEMA_REVIEW.md — B-02 checker pass

> Reviews `supabase/migrations/001_initial_schema.sql`, `supabase/seed.sql`, and
> `src/types/database.ts` against DATA_MODEL.md and TRAINER_LOGIC.md.
> Last updated: 2026-06-28

---

## 1. Table purpose (all 15 present ✅)
| Table | Purpose | MVP / Future-ready |
|-------|---------|--------------------|
| users | Thin mirror of `auth.users` | MVP |
| user_profiles | Goal, stats, days/week, injuries, unit pref | MVP |
| onboarding_answers | Raw quiz payload (audit + replanning) | MVP |
| exercises | Shared machine catalog (public read) | MVP |
| workout_plans | The 4-week plan container | MVP |
| workout_days | A day within a plan (focus, habit goal) | MVP |
| workout_exercises | Planned prescription per day | MVP |
| workout_sessions | An actually-performed workout | MVP |
| exercise_sets | One logged set | MVP |
| cardio_logs | Cardio minutes/machine | MVP |
| body_weight_logs | Weight trend (kg canonical) | MVP |
| body_measurement_logs | Waist/hip/etc (cm canonical) | MVP (UI later) |
| progress_photos | Private photo keys | MVP (UI later) |
| trainer_recommendations | Rule-engine output, traceable to TRAINER_LOGIC | MVP |
| weekly_checkins | Weekly data + adjustment driver | MVP |

## 2. Key relationships
- `users 1─1 user_profiles`, `users 1─n onboarding_answers`.
- `workout_plans 1─n workout_days 1─n workout_exercises ──► exercises`.
- `workout_sessions 1─n exercise_sets ──► exercises`; `workout_sessions 1─n cardio_logs`.
- `exercises.alt_exercise_id ──► exercises` (self-ref, safer alternative for R3).
- All user-owned logs FK to `users(id)`; `weekly_checkins.plan_id ──► workout_plans`.
- **FK delete behavior:** child rows `on delete cascade` from plans/sessions; `exercise_id` FKs are `on delete restrict` (never silently lose a logged set's exercise); session/day back-refs are `on delete set null`.

## 3. What is MVP vs future-ready
**MVP (used immediately):** all core flow tables + exercises catalog + rule-engine output.
**Future-ready seams (built now, dormant):**
- `source` columns (`manual|wearable|llm|import`) on `exercise_sets`, `cardio_logs`, `body_weight_logs`, `body_measurement_logs` → wearable/import connectors write here later.
- `cardio_logs.calories_est` → wearable fill later.
- `trainer_recommendations.source` (`rule_engine|llm`) + `action` jsonb → LLM trainer emits the same structured actions; UI/DB unchanged.
- `exercises.image_path` placeholders → swap to real Storage keys with no schema change (D8).
- `user_profiles.unit_pref` → kg/lb toggle later (D7).

## 4. Units (the #1 reviewable decision — please confirm)
- **Body metrics are canonical metric:** `*_kg` (weights), `*_cm` (height/measurements). ✅ matches the B-02 rule "store canonical kg/cm".
- **Lift loads are stored in LB** (`default_weight_lb`, `suggested_weight_lb`, `exercise_sets.weight_lb`).
  - **Why:** PF machine stacks are lb-denominated and TRAINER_LOGIC progresses in **5 lb** steps (`weightStepLb`). Storing lifts in kg would force 2.27 kg steps and accumulate rounding drift across progressive overload.
  - This follows DATA_MODEL.md exactly, but it is a **deliberate exception** to a strict "everything in kg" reading. If you'd prefer lifts in kg too, it's a one-migration change before any data exists — flag it and we'll switch.

## 5. RLS summary
- RLS enabled on **all 15 tables**.
- Direct user-owned tables: `auth.uid() = user_id` for all commands (with check on writes).
- `users`: `auth.uid() = id`.
- `exercises`: public `select` only; writes via service role (seed/admin) — no client write policy.
- Child tables without `user_id` (`workout_days`, `workout_exercises`, `exercise_sets`) enforce ownership via an `EXISTS` walk up to the owning plan/session. Simple and readable per the "keep RLS simple" rule.

## 6. Possible risks / overbuilt areas
- **Mixed units (kg body / lb lifts)** — the deliberate exception above. Documented; needs your sign-off.
- **`EXISTS`-based child RLS** is correct but adds a subquery per row check. Fine at MVP scale; if write volume grows, denormalizing `user_id` onto `workout_days`/`exercise_sets` would simplify policies. Not needed now (would be slight overbuild today).
- **`muscle_group` check list** is broader than DATA_MODEL's examples (added shoulders/glutes/arms/cardio) to fit the seed. Low risk; easy to extend.
- **No `updated_at` on append-only logs** — intentional (logs aren't edited). Not a gap.
- **`auth.users` dependency:** these files assume the Supabase auth schema exists. They run under `supabase start` / `db reset`, not against a bare Postgres. Expected for B-02 (files-only).
- **Not overbuilt:** no nutrition tables, no AI tables beyond `trainer_recommendations` — matches scope.

## 7. What to test in the next loop (when DB is provisioned, B-03+)
1. `supabase db reset` applies `001` cleanly; `seed.sql` loads 12 exercises; re-running seed is idempotent (ON CONFLICT).
2. `alt_exercise_id` links resolve (no nulls where a pair was specified).
3. RLS proof: user A cannot read/write user B's `workout_sessions`, `exercise_sets`, `body_weight_logs`, `progress_photos`.
4. `exercises` readable by an anon/authenticated client; not writable by a client.
5. Cascade behavior: deleting a plan removes its days/exercises; deleting a session removes its sets; deleting a user cleans all owned rows.
6. `supabase gen types typescript` matches the hand-written `src/types/database.ts` (reconcile any drift).

## 8. Verdict
✅ All 15 tables, FKs, indexes, and RLS present and consistent with DATA_MODEL.md.
✅ Seed covers all 12 requested machines with beginner copy + placeholder image keys.
✅ TypeScript types compile (see LOOP_STATE Loop 2 gate).
⚠️ One decision to confirm: **lb for lift loads** (§4). Everything else is ready.
