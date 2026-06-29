# TRAINER_LOGIC.md — Rule-based trainer engine (v1)

> Deterministic, testable rules. NO AI in MVP. Lives in `src/trainer/` as pure TypeScript.
> Every rule has: trigger, condition, action, user-facing message, and a stable `rule_id`
> (logged into `trainer_recommendations.rule_id` for traceability).
> Later, an LLM `TrainerProvider` can emit the same structured `action` objects.
> Last updated: 2026-06-28

---

## Design contract
```ts
interface TrainerContext {
  scope: 'set' | 'session' | 'weekly' | 'plan';
  // relevant logged data assembled by the caller
}
interface TrainerAction {
  type: 'increase_weight' | 'keep_weight' | 'reduce_weight'
      | 'swap_exercise' | 'rest' | 'restart_easier'
      | 'review_nutrition' | 'congratulate_unlock';
  delta_lb?: number;
  altExerciseId?: string;
}
interface TrainerRecommendation {
  ruleId: string;          // 'R1' ... maps to this doc
  message: string;         // beginner-friendly
  action: TrainerAction;
  source: 'rule_engine';
}
```
Engine is a pure function: `evaluate(ctx) => TrainerRecommendation[]`. No side effects; caller persists.

---

## Core rules (v1)

### R1 — Progressive overload (increase weight)
- **Scope:** per-exercise, evaluated after a session's sets for that exercise.
- **Condition:** user completed **all** prescribed sets AND hit the **top** of the rep range AND effort on the last set ∈ {easy, just_right} AND no pain.
- **Action:** `increase_weight`, `delta_lb: +5` (default; +2.5 if available/selectorized small increment later).
- **Message:** *"Nice — that looked easy. Next time, bump it up 5 lb. Small jumps build real strength."*
- **Updates:** `workout_exercises.suggested_weight_lb += 5` for next occurrence.

### R2 — Hold steady (keep same weight)
- **Scope:** per-exercise.
- **Condition:** user did NOT reach target reps on one or more sets (but no pain), OR effort = too_hard at current weight.
- **Action:** `keep_weight`.
- **Message:** *"Stick with this weight next time. Once you nail all your reps, we'll go up."*

### R3 — Pain → safer alternative (safety override, highest priority)
- **Scope:** per-set / per-exercise. **Overrides all other rules.**
- **Condition:** `pain_flag = true` on any set.
- **Action:** `swap_exercise` → `altExerciseId` from `exercises.alt_exercise_id` (or `reduce_weight` if no alt).
- **Message:** *"Stop that move for now. Pain isn't 'no pain, no gain' — let's switch to a safer exercise that works the same area."*
- **Side effects:** immediately offer swap in UI; flag exercise for this user's session; surface in weekly check-in.

### R4 — Reduce weight (too hard / form risk)
- **Scope:** per-exercise.
- **Condition:** effort = too_hard AND reps fell **well below** rep_min (e.g. < rep_min − 3) across sets, no pain.
- **Action:** `reduce_weight`, `delta_lb: -5` (floor at machine minimum / bodyweight).
- **Message:** *"Let's drop 5 lb so you can move smoothly and safely. Form first, weight later."*

### R5 — Missed 3 days → restart easier
- **Scope:** plan, evaluated on app open / Today screen.
- **Condition:** ≥ 3 consecutive scheduled days with no completed session since last workout.
- **Action:** `restart_easier` → insert an easier full-body day before resuming the plan.
- **Message:** *"Welcome back! No guilt — life happens. Let's ease in with a lighter full-body day to find your groove again."*

### R6 — Weight stalled 2 weeks → nutrition review
- **Scope:** weekly check-in.
- **Condition:** ≥ 2 consecutive weeks where body weight change is within ±0.3 kg (i.e., effectively flat) AND user is logging workouts.
- **Action:** `review_nutrition` (prompt only — we do NOT build a food log in MVP).
- **Message:** *"Your workouts are on point 👏 When the scale stalls, food is usually the lever. A quick check: are you getting enough protein and a slight calorie deficit? Tap to learn more."*

### R7 — Weekly progression (soft-unlock, never hard-block) — decision D6
- **Scope:** weekly (or live when 3rd workout completes).
- **Rule R7a (earned):** if `workouts_completed_this_week >= 3` → `congratulate_unlock`, `workout_plans.current_week += 1`.
  - **Message:** *"You did 3 workouts this week — that's the habit forming! Next week is unlocked. 🔓"*
- **Rule R7b (soft path):** if `workouts_completed_this_week < 3` → STILL allow Week 2 (`current_week += 1`), but recommend repeating Week 1.
  - **Action:** `congratulate_unlock` with `action: { recommendRepeatWeek: true }`.
  - **Message:** *"You're moving to Week 2 — no gatekeeping here. Fewer than 3 workouts last week, so repeating Week 1 is a great option to build a solid base. Your call."*
- **Never hard-block the user from progressing.**

---

## Priority & conflict resolution
1. **R3 (pain)** always wins; short-circuit other progression rules for that exercise.
2. R4 (reduce) before R2 (keep) before R1 (increase) — pick the most conservative justified by data.
3. R5/R6/R7 are plan/weekly-scoped and evaluated separately from per-exercise rules; they can co-occur.

## Default parameters (tunable, keep in one config)
```ts
export const TRAINER_CONFIG = {
  weightStepLb: 5,
  reduceStepLb: 5,
  missedDaysForRestart: 3,
  stallWeeks: 2,
  stallToleranceKg: 0.3,
  workoutsToUnlock: 3,
  repBelowMinForReduce: 3,
};
```

## Testing (maker-checker)
Each rule ships with table-driven unit tests: an input `TrainerContext` fixture → expected `ruleId` + `action`. Checker pass verifies:
- R3 truly overrides (pain + easy-effort → swap, NOT increase).
- Conservative-wins ordering.
- No rule fires on insufficient data (e.g., partial session) — returns `keep_weight` as safe default.

## Connector boundary (future)
`TrainerProvider` interface has two implementations:
- `RuleTrainer` (this doc) — MVP.
- `LlmTrainer` (later) — calls OpenAI, but MUST return the same `TrainerRecommendation` shape and reuse `action.type` enum so the UI and DB don't change. Rule engine remains the fallback/safety net (e.g., pain handling stays rule-based even with LLM on).
