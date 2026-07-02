# SETTINGS_PROFILE_REVIEW.md — B-13 checker pass

> Reviews Settings/Profile + machine-guide linking against UX_FLOW.md, DATA_MODEL.md,
> TRAINER_LOGIC.md, and the B-10 persistence pattern. Last updated: 2026-06-29

---

## 1. What it does
A real Settings/Profile area: shows the user's profile, lets them edit units / days-per-week /
duration / injuries, and regenerates the plan on confirmed changes — **preserving completed history**.
Plus a "Need help with this machine?" link from the live workout guide (and tappable Today rows) into
the full Exercise Detail. Local only, persisted; no backend/Supabase/auth/AI/nutrition/analytics/wearable.

## 2. Sections (requirement 1–2)
- **Profile:** main goal, sex, age, height, current weight, goal weight, experience (read-only summary).
- **Units:** `UnitToggle` (lb/in ↔ kg/cm) — applies immediately.
- **Workout preferences:** days/week + workout length (`ChoiceGroup`).
- **Injuries & safety:** injury multi-select (reuses `MultiChoiceGroup`).
- **Local data:** Reset button (from B-10).

## 3. Editing + regeneration (requirements 3–7)
Editable state is local until saved. Units apply immediately (display-only). Days/duration/injuries are
staged; a **"Save workout changes"** button appears only when a plan-affecting pref changed. Tapping it
shows the confirm:
> "This can update your future workout plan. Your completed history will stay safe."
On confirm (`applyChanges`): writes the answers, regenerates via `generatePlan(updatedAnswers)` →
`planStore.setPlan`, and resets plan progress **only if the structure changed**.

Decision logic is pure (`lib/settingsProfile.ts`, asserted):
| Change | Regenerate | Reset progress |
|--------|-----------|----------------|
| none | no | no |
| duration | yes | **no** (day ids unchanged) |
| injuries | yes | **no** |
| days/week | yes | **yes** (day ids shift) |

## 4. History is preserved (requirement 6, verified by design)
Regeneration only touches `planStore` (+ optionally `planProgressStore`). **`progressStore`
(completed sessions + body weights) and `weeklyCheckInStore` are never modified** by Settings. So
completed history and weight logs survive a plan regeneration. `resetLocalAppData` (explicit Reset
button) is the only path that clears history.

## 5. Units don't corrupt data (requirement — verified)
Body metrics stay canonical (`heightCm`/`*Kg`); the toggle only flips `unitPref`, and display uses
`formatWeight`/`formatLength`. Switching units changes labels, not stored numbers. Lift loads remain lb
internally (D10). Onboarding answers (canonical) are unchanged by a unit switch.

## 6. Machine guide → Exercise Detail (requirements 10–12)
- `ExerciseStepCard` gained an optional `onOpenGuide` prop → renders "❔ Need help with this machine?".
- `WorkoutGuideScreen` passes `onOpenGuide={() => navigate('ExerciseDetail', { slug: planEx.slug })}`.
- `TodayScreen` exercise rows are now tappable → the same Exercise Detail.
- No exercise instructions are duplicated in Settings; Exercise Detail (from the catalog) stays the
  single source of machine education (requirement 12).

## 7. Persistence
No new stores. Edits go through `onboardingStore.setAnswer` (persisted) and `planStore.setPlan`
(persisted) — same B-10 AsyncStorage pattern — so changes survive reload. `planProgressStore.reset`
(persisted) is called only on structure change.

## 8. Maps to DB
Editable fields map to `user_profiles` (unit_pref, days_per_week, workout_length_min, injuries).
Regenerated plan maps to `workout_plans`/`workout_days`/`workout_exercises` as before. No new tables.

## 9. Robustness (no crash)
Missing profile fields render "—". Null days/duration handled by `decidePlanUpdate` (asserted null→set
case). Settings is only reachable inside Main (post-onboarding), but still guards nullable values.

## 10. Risks / notes
- **Reset-on-days-change** discards completed-day *progress markers* (not history). This is intentional:
  a 4-day week's `w1-d4` id has no meaning in a 2-day plan. History/stats are untouched.
- Removed the old placeholder "Restart plan"/"Sign out" buttons (sign-out belongs to the deferred auth
  loop). Reset Local Data retained.
- `WorkoutLength` typing: duration state is typed `20|30|45` to match `setAnswer('workoutLengthMin')`.

## 11. Tests (executed, pure)
`injuriesEqual` (order + 'none' sentinel), and `decidePlanUpdate` across none/duration/injury/days
changes (+ null-safe). **11/11 pass.**

## 12. Verdict
✅ Real Settings with profile + editable prefs; plan regenerates on confirmed change; history preserved;
units don't corrupt data; machine guide links to Exercise Detail from workout + Today. Scope respected.
