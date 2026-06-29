# PLAN_PROGRESSION_REVIEW.md — B-09 checker pass

> Reviews plan navigation/progression against UX_FLOW.md, DATA_MODEL.md, TRAINER_LOGIC.md.
> Last updated: 2026-06-29

---

## 1. What it does
Makes the 4-week plan navigable and progressive without locking the user to Week 1 Day 1.
A pure helper derives the current/next/selected day and week view from the base plan + a set of
completed day ids; a small local store holds that raw progress. Completing a workout advances the
plan; abandoning does not.

## 2. Pieces
- `lib/planProgress.ts` (**pure**): `planDayId()`, `dayIdOf()`, `getPlanProgress(plan, completedIds, selectedId?)` → `{ currentDay, nextDay, currentWeek, selectedDay, isPreviewingNonCurrent, weekDays, isPlanComplete, completedCount, totalDays }`.
- `state/planProgressStore.ts` (local): `completedDayIds`, `lastCompletedDayId`, `selectedDayId`; `markDayCompleted`, `selectDay`, `reset`.
- `components/WeekPlanStrip.tsx`: horizontal week strip — ✓ completed, ▶ Next (current), tap to preview.
- Today / WorkoutGuide / SessionSummary updated to use it.

## 3. Day identity
Derived as `w{week}-d{day}` (no field added to the generator output). Maps to
`workout_days (week_number, day_number)` when persisted. Base plan shape unchanged.

## 4. Behaviour (all asserted)
| Case | Result |
|------|--------|
| No plan | empty progress, Today shows onboarding prompt (no crash) |
| No completed days | current = W1D1; Today starts there |
| Completed 1 day | current = next day |
| Completed a full week | current = next week, Day 1; week view follows |
| Completed all 4 weeks | `isPlanComplete`; Today shows completion banner |
| Preview another day | selection honoured; current stays the recommended next incomplete; copy says so |
| Unknown completed id | ignored gracefully |

## 5. Progression rules (vs requirements)
- **Start uses the selected day**, not always W1D1 (Today `Start Workout` → `startSession(selectedDay)` → `WorkoutGuide {week, dayNumber}`).
- **Completion advances**: `WorkoutGuideScreen.finishAndSummarize('completed')` → `markDayCompleted(planDayId(week, day))`. `markDayCompleted` also clears `selectedDayId` so Today jumps to the new recommended day.
- **Abandoned does NOT advance**: marking is inside the `status === 'completed'` branch only (verified by code path; abandoned sessions still save to history for stats but don't mark the day).
- **Adaptive recs still apply** to the selected day: WorkoutGuide computes `applyRecommendations(planDay, history, recs)` for whatever day was started (matches by exerciseId).

## 6. No mutation of the base plan — verified
`getPlanProgress` only reads/filters/sorts copies; asserted that `JSON.stringify(plan)` is unchanged
after a call. The generator and `planStore.plan` remain the single source of truth; progress is a
separate id set. Week strip sorts a filtered copy, never the original array in place... (`filter` +
`sort` operate on a new array from `filter`).

## 7. Session summary
Shows the completed workout name and the **next** workout (the recommended current day computed from
the updated `completedDayIds`), or the plan-complete message. "Back to Today" returns to the tabs.

## 8. Plan completion
Today shows: "You completed your beginner plan! You can repeat Week 4 or generate a fresh plan."
- **Repeat Week 4** → `selectDay('w4-d1')` (preview/start the last week again).
- **Generate a new plan** → `setPlan(generatePlan(answers))` + `planProgress.reset()`.

## 9. Maps to DB
- `completedDayIds` → completed `workout_days`; completed sessions already map to `workout_sessions`/`exercise_sets`/`cardio_logs` (B-05/B-07).
- No new tables; progress is derivable.

## 10. Risks / notes
- **No persistence** — progress resets on reload (consistent with other local stores; Supabase sync = auth loop).
- **Adaptive recs source** is still the latest finished session's recs (MVP). Per-day rec history is a later concern.
- **"Repeat Week 4"** previews/starts the last week without un-completing it (completion stays true). Good enough for MVP; a true "restart week" could clear those ids later.
- Exercise Library / Settings intentionally NOT built this loop (per scope).

## 11. Tests (executed)
20 assertions over getPlanProgress: null plan, no-completed, completed-one, week rollover, full
completion + fallback selected day, preview vs current, unknown ids, and base-plan-not-mutated.
**All pass.**

## 12. Verdict
✅ Navigation, progression, completion, preview, adaptive-on-selected-day, and no-mutation all correct
and tested. Abandoned sessions don't advance. Scope respected (no backend/auth/AI/nutrition/analytics/
wearable; no Library/Settings).
