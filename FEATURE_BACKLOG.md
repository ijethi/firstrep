# FEATURE_BACKLOG.md — Loop-sized tasks

> Each item is ONE development loop: small, independent, with a success condition.
> Loop rule: pick ONE, mini-spec it, build, check against spec, update LOOP_STATE, STOP.
> Ceiling: deliver or report blockers after max 3 attempts.
> Priority: P0 = MVP critical path, P1 = MVP important, P2 = post-MVP. Last updated: 2026-06-28

---

## Legend
`[ ]` todo · `[~]` in progress · `[x]` done · `(est)` rough size: S/M/L

---

## Epic A — Foundation (P0)
- [ ] **B-01** Project scaffold (S) — Expo app boots, bottom-tab navigation shell (Today/Progress/Library/Profile), design tokens (colors, spacing, type), big-button component. *Success: app runs on Expo Go, 4 empty tab screens render.*
- [ ] **B-02** Supabase project + schema migration (M) — create project, run SQL for all 15 tables + RLS + indexes. *Success: tables exist, RLS on, can't read another user's rows.*
- [x] **B-03** Auth flow (M) — ✅ Loop 17 (user-sequence "B-17"). Supabase email+password sign up/in/out, session restore, best-effort `users`/`user_profiles` upsert, Settings auth card. Local-first (safe when unconfigured). Data sync deferred to SYNC_PLAN.md loops.
- [x] **B-04** Exercise catalog seed (M) — ✅ delivered as SQL files in Loop 2 (`supabase/seed.sql`, 12 machines, idempotent). DB load deferred until provisioning.

## Epic B — Onboarding & Planning (P0)
- [x] **B-05** Onboarding quiz UI (M) — ✅ delivered in Loop 3 (user-sequence "B-03"). 11-step wizard, Zustand local store, maps to `onboarding_answers`/`user_profiles` shapes (write to DB deferred). *Success met: quiz completes, answers stored locally.*
- [x] **B-06** Plan generator (M) — ✅ delivered in Loop 4 (user-sequence "B-04"). PURE `generatePlan(answers)` → 4-week plan in local Zustand store; days/week + duration adaptation; injury-safe drops/softens; weekly progression. Verified via executed assertions. DB persistence deferred (no live project). *Success met.*

## Epic C — Today & Workout session (P0)
- [x] **B-09** Multi-day plan navigation + progression (user-sequence "B-09") — ✅ Loop 9. Pure `getPlanProgress`, planProgressStore, WeekPlanStrip; current/next/selected day, preview, start selected day, advance on completion (not abandon), plan-complete state. 20 assertions pass.
- [ ] **B-07** Today screen (M) — today's workout card, cardio chip, habit goal, streak, Start button; rest-day + no-plan empty states. *Success: shows correct day from plan.*
- [ ] **B-08** Workout overview screen (S) — ordered exercise list + Start. *Success: lists day's exercises, Start enters guide.*
- [x] **B-09** Machine guide screen (M) — ✅ Loop 5. ExerciseStepCard: image placeholder, plain description, setup, sets/reps, weight guidance, form tip, safety note; progress indicator.
- [x] **B-10** Session state store (Zustand) (M) — ✅ Loop 5 `workoutSessionStore`. Tracks exercises/sets/cardio/pain/skipped. (Persistence/resume + `workout_sessions` row deferred to auth loop.)
- [x] **B-11** Set logging (S) — ✅ Loop 5 `SetLogger`: weight/reps/effort/pain → local store (maps to `exercise_sets`).
- [x] **B-12** Rest timer (S) — ✅ Loop 5 `RestTimer`: countdown, ±15s, skip, auto-advance, next-set preview.
- [x] **B-13** Session summary (S) — ✅ Loop 5 `SessionSummaryScreen`: sets/cardio/skipped recap + complete. (Streak/unlock = later analytics loop.)

## Epic D — Trainer logic (P0)
- [x] **B-14** Rule engine (M) — ✅ Loop 6 (user-sequence "B-06"). PURE `generateRecommendations()`: R1 pain override, R2 increase, R3 repeat, R4 reduce, per-exercise + priority sort. 15 executed assertions pass. (DB write of `trainer_recommendations` / `suggested_weight_lb` update deferred to persistence/apply loop.)
- [x] **B-15** Rule engine cardio + consistency (M) — ✅ Loop 6. R5 skip-repeat, R6 cardio progression, R7 consistency (history-seed ready). (Restart-easier R5-missed-days + week unlock = later loop with streak/history.)

## Epic E — Cardio & Progress (P1)
- [ ] **B-16** Cardio tracking screen (S) — machine picker, timer/manual, writes `cardio_logs`. *Success: logs minutes, adds to weekly total.*
- [x] **B-17** Body weight + measurements logging (S) — ✅ body weight (Loop 7) + measurements waist/chest/hips (Loop 14, cm canonical, latest+change on dashboard).
- [x] **B-18** Progress dashboard (L) — ✅ Loop 7 (user-sequence "B-07"). Card-based dashboard: workouts/streak/sets/cardio/exercises, recent tips, strength + cardio cards, body-weight logging, empty states. Pure tested stats. (Charts deferred — cards only per scope.)
- [x] **B-19** Progress photos (M) — ✅ local capture (Loop 14) + upload to PRIVATE Supabase Storage bucket with owner-only RLS + progress_photos metadata sync (Loop 27, user-sequence "B-27"). Signed-URL gallery/pull still deferred. NOTE: cloud sync for ALL data (profile→photos) shipped across Loops 17–27 (SYNC_PLAN complete).

## Epic F — Check-in & Library & Settings (P1)
- [x] **B-20** Weekly check-in flow (M) — ✅ Loop 12 (user-sequence "B-12"). Persisted local check-in (workouts/energy/soreness/confidence/barriers/goal), rule-based coaching message, prompt + latest-summary card on Today + Progress. Maps to `weekly_checkins`. Pure logic tested. (Plan-modifying R5/R7 + due-detection deferred.)
- [x] **B-21** Exercise library screen (S) — ✅ Loop 11 (user-sequence "B-11"). List + search + filters (upper/lower/cardio/core/beginner-safe) + detail (setup/form/mistakes/safety/guidance/alternative). Catalog extended with primaryMuscles/commonMistakes/safetyNote. Pure filter logic tested.
- [~] **B-22** Settings/profile (S) — ✅ core in Loop 13 (user-sequence "B-13"). Profile summary + editable units/days/duration/injuries, confirmed plan regeneration (history preserved), machine-guide→Exercise Detail link, Reset Local Data. Medical disclaimer + sign out (auth) still TODO.

## Epic G — Polish & connector prep (P1/P2)
- [x] **B-16** Safety disclaimer + first-run intro + rest-timer polish (user-sequence "B-16") — ✅ Loop 16. One-time persisted disclaimer + SafetyIntro, start-light reminder, clearer sharp-pain copy, RestTimer (Restart/+15s/Skip + haptics, safe reload), Settings Safety Tips, reset clears acknowledgment. Pure copy/routing/timer helpers tested.
- [~] **B-10** Local persistence (user-sequence "B-10") — ✅ Loop 10. AsyncStorage + Zustand persist for onboarding/plan/planProgress/progress/recommendation; hydration gate (no flicker); version/migrate; `resetLocalAppData`. Live session intentionally not persisted. Offline write-queue/Supabase sync still in B-23.
- [~] **B-23** Resumable-session + offline-tolerant logging (M, P1) — ✅ resumable in-progress session done in Loop 15 (user-sequence "B-15"): persisted live session, Today Continue/End/Discard, resume at exact step, conservative corrupt-session handling, no stale-timer auto-advance. Offline write-queue/retry belongs to the Supabase sync loop.
- [ ] **B-24** `TrainerProvider` interface + LLM stub (M, P2) — abstract rule vs llm; OpenAI stub behind flag. *Success: swap provider, UI unchanged, rules still fallback.*
- [ ] **B-25** Wearable sync connector stub (M, P2) — Health/Fit import for weight & cardio (`source='wearable'`). *Success: imported row tagged source.*
- [ ] **B-26** Nutrition review deep-link (S, P2) — R6 links to guidance/connector. *Success: tapping recommendation opens content.*

---

## Suggested loop order (critical path to first usable build)
B-01 → B-02 → B-03 → B-04 → B-05 → B-06 → B-07 → B-08 → B-09 → B-10 → B-11 → B-12 → B-13 → B-14 → then P1 epics.

## Parallelizable / isolatable tasks (worktree candidates)
- B-04 (seed) independent of UI once B-02 done.
- B-14/B-15 (rule engine) are pure logic — buildable in isolation with fixtures, no UI dependency.
- B-21 (library) only needs B-04.
- B-18 charts can be prototyped against mock data.
