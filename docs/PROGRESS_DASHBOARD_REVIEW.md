# PROGRESS_DASHBOARD_REVIEW.md — B-07 checker pass

> Reviews the local Progress dashboard against UX_FLOW.md and DATA_MODEL.md.
> Last updated: 2026-06-29

---

## 1. What it does
After a workout finishes, the session snapshot is appended to a local history
store (`progressStore`). The Progress screen derives motivating stats from that
history using **pure** functions (`lib/progressStats.ts`) and lets the user log
body weight. No backend/Supabase/auth/AI/nutrition/wearable.

## 2. Data flow
`WorkoutGuideScreen.finishAndSummarize()` → `progressStore.addSession(session)`
(every finished session, completed or abandoned). `ProgressScreen` reads
`history` + `bodyWeights` and computes view models on render. Body weight logged
via `WeightLogCard` → `progressStore.addBodyWeight(kg, nowISO)`.

## 3. Stats (all pure, all tested)
| Stat | Definition |
|------|-----------|
| totalWorkouts | sessions with `status==='completed'` |
| currentStreak | consecutive days ending at the latest completed workout |
| totalSets | sum of all logged sets across history |
| totalCardioMinutes | sum of non-skipped `cardio.completedMinutes` |
| exercisesCompleted | exercise logs that were not skipped and had ≥1 set |
| strengthProgress | per-exercise best + most-recent lb, session count, `learning` flag |
| cardioProgress | total minutes, best single session, most recent machine |
| weightProgress | first/latest kg + change (latest − first) |

## 4. Units (consistent with D7)
Body weight is stored **canonically in kg** (`BodyWeightEntry.weightKg`), entered
imperial-first (lb) and converted at the edge via `lbToKg`; displayed via
`formatWeight` per the user's `unitPref`. Matches the rest of the app and maps
directly to `body_weight_logs.weight_kg`.

## 5. Maps to DB tables
- `progressStore.history: WorkoutSessionLocal[]` → `workout_sessions` (+ `exercise_sets` via `exercises[].sets`, `cardio_logs` via `cardio`).
- `progressStore.bodyWeights: BodyWeightEntry[]` → `body_weight_logs` (weight_kg, logged_on from `loggedOnISO`, source='manual').
- Strength PRs are derived (not stored) — no schema needed.

## 6. Empty states (no crash — tested)
- No completed workout → "Finish your first workout to see progress here." (stats/strength/cardio hidden; weight card still usable).
- No weight logged → "Log your weight when you're ready. No pressure."
- Strength with sparse data → "You're still learning this machine — keep the same weight until it feels controlled."
- Empty/partial history, skipped exercises, missing cardio all return zeros/nulls (asserted), never throw.

## 7. Encouraging copy (not clinical)
Weekly messages: 0/2 → "consistency, not perfection"; 1 → "Nice start. One completed workout is already progress."; 3+ → "building a real habit". No "insufficient data" / "metric unavailable" phrasing (asserted).

## 8. Risks / notes
- **No charts** — cards only, per scope ("Cards are enough"). A simple weight line chart is a candidate for a later loop.
- **Abandoned sessions** are saved and contribute sets/cardio, but do NOT count as a completed workout or extend the streak. Intentional and tested.
- **Recent tips** reuse `recommendationStore` (latest session's recs, top 3) — not a full per-session rec history yet (out of scope; analytics later).
- **No persistence** — history/weights reset on reload (consistent with other local stores; Supabase sync arrives with the auth loop).

## 9. Tests (executed)
Empty history → zeros/nulls; 2-day history totals (workouts/streak/sets/cardio/exercises); strength best/recent/learning with a skipped day; cardio totals + recent machine; streak break on gap; abandoned session counts sets not workouts; weight change in kg; encouraging copy. **All pass** (one initial failure was a faulty test regex expecting the word "first"; copy matches the required example — assertion corrected, code unchanged).

## 10. Verdict
✅ Stats, units, empty states, DB mapping, and encouraging tone all correct and tested. Scope respected (no charts/analytics/wearable/backend).
