# TRAINER_ENGINE_REVIEW.md — B-06 checker pass

> Reviews `src/lib/trainerEngine.ts` against TRAINER_LOGIC.md and DATA_MODEL.md.
> Last updated: 2026-06-29

---

## 1. What it does
Pure function `generateRecommendations(session, { nowISO, priorCompletedCount })` → `TrainerRec[]`.
Consumes one (completed) `WorkoutSessionLocal` and returns beginner-friendly next-step coaching. No I/O, no `Date`/random inside (time is injected), no UI logic. Same input → same output (asserted).

The session already embeds the planned targets it needs (`targetSets`, `repMin`, `repMax`, `cardio.plannedMinutes`), so the planned day is not required as a separate argument — this also makes the engine robust if the plan store is empty.

## 2. Rules implemented (maps to TRAINER_LOGIC.md)
| Rule | Trigger | Output type | Priority |
|------|---------|-------------|----------|
| R1 Pain override | `painReported` on an exercise | `pain_safety` | **safety** (always first) |
| R4 Reduce | ≥2 hard sets OR ≥2 sets with reps < repMin | `reduce_weight` | high |
| R2 Increase | all sets done + hit top reps + all easy/good + no pain | `increase_weight` | medium |
| R3 Repeat | completed but not easy/top yet (default) | `repeat_weight` | medium |
| R5 Skip | `skipped` OR zero sets logged | `skip_repeat` | medium |
| R6 Cardio | below planned → repeat; met @ easy/moderate → +2–5 min; hard → keep | `cardio_progress` | low |
| R7 Consistency | first completed → congratulate; else encourage | `consistency` | low |

## 3. Priority & ordering (verified)
- Rank: `safety < high < medium < low`. Stable sort preserves exercise order within a rank.
- **Pain always overrides progression for that exercise** and is sorted to the top (asserted: pain + easy sets → R1, not R2; appears first).
- Conservative-wins among completed exercises: **reduce → increase → repeat (default)**.

## 4. Pain override check (the critical safety rule)
`evaluateExercise` returns the R1 `pain_safety` rec immediately when `painReported`, before any reduce/increase/repeat logic can run. Confirmed by test "pain overrides increase weight".

## 5. Output shape → `trainer_recommendations` table
`TrainerRec` fields and their mapping:
| TrainerRec | trainer_recommendations |
|------------|--------------------------|
| `ruleId` | `rule_id` |
| `type` | `action.type` (jsonb) / classification |
| `exerciseId` | `context_id` (with `context_type='set'/'session'`) |
| `message` | `message` |
| `title` / `nextAction` / `priority` | ride along in `action` jsonb |
| `generatedAtISO` | `created_at` |
| `source: 'rule_based'` | DB `source` enum value `'rule_engine'` |
All recommendation data is structured (no free-form-only output), so persistence in a later loop is a direct field map.

## 6. Beginner-friendly language
Messages are coaching, not jargon. E.g. *"Great work — you finished all your Chest Press sets and hit the top reps comfortably. Next time, try adding 5 lb."* No "progressive overload condition satisfied."

## 7. History readiness (R7)
Engine accepts `priorCompletedCount` (the local completed-session count from `recommendationStore`). 0 → first-workout congratulations; >0 → keep-it-going message. The signature is ready to accept richer history later **without** building analytics now (per scope).

## 8. Risks / notes
- **Reps optional:** if a user logs effort but not reps, `hitTop`/`wellBelow` use `reps != null` guards, so missing reps never falsely triggers increase/reduce — it falls back to repeat (safe default).
- **Abandoned sessions** still get recommendations (for whatever was logged) but do **not** increment `completedCount` (only `completed` does). R7 wording stays correct.
- **Single rec per exercise** by design (most relevant action). Multiple concurrent suggestions would clutter the beginner UI.
- Source string is `'rule_based'` per spec; documented mapping to DB `'rule_engine'` to avoid a future mismatch.

## 9. Tests (executed, all pass)
Pain override; easy full → +5 lb; one-hard → repeat; multi-hard/low-reps → reduce (high priority); skipped → repeat-safer; cardio below → repeat; cardio met → +2–5 min; cardio hard → keep; null session → []; empty exercises → R7 only; R7 first-workout copy; purity; full output shape. **15/15 pass.**

## 10. Verdict
✅ Rules, priority, pain override, purity, and table-mapping all correct and tested. No backend/Supabase/auth/AI/nutrition/dashboard added.
