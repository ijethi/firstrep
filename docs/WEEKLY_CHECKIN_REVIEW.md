# WEEKLY_CHECKIN_REVIEW.md — B-12 checker pass

> Reviews the Weekly Check-in against UX_FLOW.md, DATA_MODEL.md, TRAINER_LOGIC.md.
> Last updated: 2026-06-29

---

## 1. What it does
A short, encouraging end-of-week reflection ("How did this week feel?"). Captures workouts completed,
energy, soreness, confidence, barriers, and one small goal — then shows a rule-based coaching message.
Local only, persisted. No plan changes, no Supabase/auth/AI/nutrition.

## 2. Pieces
- `state/weeklyCheckInStore.ts` — Zustand **persist** (same B-10 pattern): `checkIns[]`, `addCheckIn`, `clear`.
- `lib/weeklyCheckIn.ts` (**pure**): `weeklyCheckInMessages`, `latestCheckIn`, `toWeeklyCheckinRow` (+ score helpers + labels).
- `screens/WeeklyCheckInScreen.tsx` — the form (reuses onboarding `ChoiceGroup`/`MultiChoiceGroup`).
- `components/WeeklyCheckInCard.tsx` — prompt (no check-in) OR latest summary + coaching (used on Today + Progress).
- Navigation: `WeeklyCheckIn` route added.

## 3. Questions (requirement 6 — all present)
Workouts completed (0–4+), Energy (low/okay/good), Soreness (none/mild/moderate/high), Confidence
(low/medium/high), Barriers (time/soreness/motivation/gym anxiety/schedule/other/none — multi-select with
mutually-exclusive "none"), and a free-text small goal for next week.

## 4. Rule-based message (requirement 9 — asserted)
| Condition | Message |
|-----------|---------|
| 0 workouts | "No judgment. Let’s restart with one easy workout this week." |
| 1–2 workouts | "Nice start. Keep the goal simple this week." |
| 3+ workouts | "Great consistency. You are building the habit." |
| soreness = high (added) | "Keep the next workout lighter and focus on control." |
| confidence = low (added) | "Use the Exercise Library before your next workout." |

Returns 1–3 messages (one consistency message + optional soreness/confidence add-ons). All-good → 1 message.

## 5. Entry points (requirement 5)
- **Today**: `WeeklyCheckInCard` below Start Workout — prompts a check-in, or shows the latest summary.
- **Progress**: same card near the top — shows the **latest check-in summary** (requirement 8) + coaching.
Both navigate to `WeeklyCheckIn`. Opening from either works.

## 6. Persistence (same pattern as B-10)
`weeklyCheckInStore` uses `persist` with `appJSONStorage`, key `firstrep:weekly-checkin`, version 1,
`migratePersisted`, `partialize: { checkIns }`. Included in `useAppHydrated()` (app waits for it) and in
`resetLocalAppData()`. Survives reload.

## 7. Maps to `weekly_checkins` table
`toWeeklyCheckinRow(entry)` converts categorical answers to the table's 1–5 int scales:
energy low/okay/good → 2/3/5; soreness none/mild/moderate/high → 1/2/3/5; confidence → `motivation`
(2/3/5). Plus `week_number`, `workouts_completed`, `weight_kg` (null), `cardio_minutes` (0).
Barriers + small goal would ride in extra columns / jsonb when persisted (documented; not in MVP schema).

## 8. No crash on missing/partial data
- `latestCheckIn([])` → null; card renders the prompt state (asserted).
- Form requires workouts/energy/soreness/confidence + at least one barrier before "Save" enables;
  small goal is optional. `weekNumber` derives from `getPlanProgress` (defaults to 1 with no plan).

## 9. Scope / non-goals
Does NOT modify the plan based on the check-in (requirement 10 — later loop). No calorie/diet advice,
no AI, no Supabase, no analytics/wearable, no full Settings build-out.

## 10. Tests (executed, pure)
All message branches (0 / 1 / 2 / 3+ / high soreness / low confidence / combined / all-good), empty-safe
`latestCheckIn`, most-recent selection, and categorical→int DB mapping. **13/13 pass.**

## 11. Verdict
✅ Open from Today/Progress, answer all questions, save + persist, latest summary on Progress, rule-based
message, empty state, no crash, maps to `weekly_checkins`. Encouraging non-judgmental tone. Scope respected.
