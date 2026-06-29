# ADAPTIVE_PLAN_REVIEW.md — B-08 checker pass

> Reviews `src/lib/recommendationApplicator.ts` against TRAINER_LOGIC.md and DATA_MODEL.md.
> Last updated: 2026-06-29

---

## 1. What it does
Pure `applyRecommendations(day, history, recs, opts?) → AdaptiveDay | null`. A **view layer**:
takes the base `PlanDay`, completed session history, and trainer recommendations, and returns a
**new** day whose strength exercises carry adaptive weight guidance, a "why" explanation, and a
safety warning where relevant. The base plan / generator / planStore are never mutated.

## 2. How each recommendation is applied (per strength exercise)
| Rec type | Suggested weight | Copy |
|----------|------------------|------|
| `increase_weight` | last logged + 5 lb | "Last time this felt comfortable. Try 5 lb more today." |
| `repeat_weight` | same as last | "Last time this felt hard. Keep the same weight and focus on control." |
| `reduce_weight` | max(safeMin, last − 5) | "Last time this felt tough. We lowered it slightly so you can move well." |
| `pain_safety` | **last (never increased)** + `safetyWarning` | "You reported pain last time. Skip this exercise if it doesn't feel right today." |
| `skip_repeat` | last (lighter framing) | "You skipped this last time — no problem at all. Start light and get a feel for it." |
| cardio / consistency | n/a (not a strength exercise) | — |

`last logged weight` comes from history (latest session containing that exercise with a non-null
weight). Safe minimum defaults to **10 lb** (`opts.safeMinLb` override).

## 3. Pain priority (the critical safety rule) — verified
- `pain_safety` sets `adaptiveWeightLb = last` (no +5) and always populates `safetyWarning`.
- Recommendations are pain-first sorted by the engine, and `recForExercise` takes the first match,
  so even if an `increase_weight` rec also existed for the same exercise, pain wins (asserted: test 8).

## 4. View-layer, not mutation — verified
`applyRecommendations` spreads into new objects (`{...day, strength: day.strength.map(...)}`); the
input day and its exercises are unchanged and `adaptiveDay !== day` (asserted: test 5). The base plan
in `planStore` is the single source of truth; adaptation is recomputed on render in Today / WorkoutGuide.

## 5. Maps to DB
- `AdaptiveExercise.adaptiveWeightLb` → `workout_exercises.suggested_weight_lb` when a plan/session is persisted.
- `recommendationType` / `whyExplanation` / `safetyWarning` ride along in `trainer_recommendations.action` jsonb.
- No new tables required (pure derivation).

## 6. Where it shows up
- **Today**: each exercise row shows a one-line adaptive hint (safety warning, else the "why").
- **WorkoutGuide (live)**: `ExerciseStepCard` shows the adjusted weight guidance, a "💡 Why this
  suggestion?" box, and a pain/safety box; `SetLogger` pre-fills the suggested weight (falling back
  to this session's last set when present).

## 7. Robustness (no crash) — verified
- Null day → null. Empty history/recs → base guidance, `adapted=false`.
- `increase_weight` with no prior logged weight → keeps base guidance (can't add to nothing).
- All branches guard `last == null`.

## 8. Risks / notes
- **Recommendation source:** uses `recommendationStore.recommendations` (latest finished session).
  In MVP the user always repeats Week 1 Day 1, so exercise ids line up. When multiple distinct days
  exist, recs should be keyed by day — a later loop concern (noted, not built).
- **Safe minimum** is a flat 10 lb; per-machine minimums (e.g. leg press) could be refined later.
- **No persistence/analytics/wearable/nutrition** added. Plan generator untouched (requirement 9).

## 9. Tests (executed, all pass)
increase→+5; pain→safety + no increase; reduce→−5; reduce floor; repeat→same; skip→lighter; base
not mutated; empty→base; null→null; increase w/o weight→base; pain priority over increase. **11/11.**

## 10. Verdict
✅ Adaptive guidance, pain priority, view-layer purity, DB mapping, and beginner copy all correct and
tested. Base plan unchanged. Scope respected.
