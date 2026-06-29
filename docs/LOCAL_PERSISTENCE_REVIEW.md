# LOCAL_PERSISTENCE_REVIEW.md — B-10 checker pass

> Reviews local persistence against UX_FLOW.md, DATA_MODEL.md, CURSOR_RULES.md.
> Last updated: 2026-06-29

---

## 1. What it does
Persists the user's data on-device so onboarding, plan, progress, history, body weights, and
recommendations survive app reloads. Uses `@react-native-async-storage/async-storage` (Expo-pinned
1.23.1) + Zustand `persist` middleware. Local only — no Supabase, no auth, no secrets.

## 2. Persisted stores (and what's stored)
| Store | Persisted (partialize) | Key | Not persisted |
|-------|------------------------|-----|----------------|
| onboardingStore | `answers`, `completed` | `firstrep:onboarding` | actions |
| planStore | `plan`, `savedAtISO` | `firstrep:plan` | actions |
| planProgressStore | `completedDayIds`, `lastCompletedDayId`, `selectedDayId` | `firstrep:plan-progress` | actions |
| progressStore | `history`, `bodyWeights` | `firstrep:progress` | actions |
| recommendationStore | `recommendations`, `completedCount` | `firstrep:recommendation` | actions |
| **workoutSessionStore** | **— (intentionally NOT persisted)** | — | live in-progress session |

`partialize` drops the action functions; only data is written (asserted).

## 3. Live session is deliberately NOT persisted
Per requirements, the active in-progress workout is not saved (no half-baked recovery flow this loop).
WorkoutGuide already guards a null session ("No active workout… tap Start Workout"), so a reload
mid-workout lands safely on a fresh state rather than restoring a broken session. Completed sessions
persist via `progressStore.history`.

## 4. Versioning & migration
Every persisted store has `version: PERSIST_VERSION` (1) and `migrate: migratePersisted`. v1 migration
is an identity no-op, but the branch structure is in place so a future shape change can transform old
persisted data instead of discarding it (asserted: migrate is identity).

## 5. Hydration (no onboarding flicker)
`lib/useHydration.useAppHydrated()` waits for ALL five persisted stores' `onFinishHydration` before the
app renders navigation. `App.tsx` shows a `LoadingScreen` (spinner + "Loading your plan…") until then.
`RootNavigator` picks `initialRouteName` from the (now-hydrated) `onboarding.completed` — so a returning
user goes straight to Today with no onboarding flash, and a new user sees Onboarding.

## 6. Reset
`lib/resetAppData.resetLocalAppData()` clears all `firstrep:*` AsyncStorage keys (`clearPersistedStorage`)
then resets every in-memory store to defaults (incl. the non-persisted live session). Settings has a
"Reset local data" button with a confirm `Alert` that, on reset, navigates back to Onboarding.

## 7. Maps to Supabase later
The persisted shapes are the same local view models already mapped in earlier loops:
onboarding→`user_profiles`/`onboarding_answers`, plan→`workout_plans`/`workout_days`/`workout_exercises`,
planProgress→completed `workout_days`, progress.history→`workout_sessions`/`exercise_sets`/`cardio_logs`,
bodyWeights→`body_weight_logs`, recommendations→`trainer_recommendations`. AsyncStorage is the local
mirror; the Supabase loop will sync these same objects.

## 8. Base plan still not mutated
Persistence only reads `plan` to serialize it; the generator and progression helpers are untouched.
B-09's no-mutation guarantee is unaffected.

## 9. Risks / notes
- **No secrets stored** — only workout data. ✅ CURSOR_RULES.
- **Reload mid-workout** loses the live (unsaved) session by design; acceptable for MVP. A safe
  resume flow is a future loop.
- **Storage growth** — history grows unbounded locally; fine at MVP scale, prune/sync later.
- Runtime hydration itself needs a device/AsyncStorage and wasn't executed in node; verified statically
  (tsc) + via JSON round-trip of real snapshots (AsyncStorage stores strings).

## 10. Tests (executed, pure pieces)
`pickKeys` keeps data / drops actions; `migratePersisted` identity; storage keys unique + namespaced;
version = 1; and all five real persisted snapshots round-trip through `JSON.parse(JSON.stringify(...))`.
**11/11 pass.**

## 11. Verdict
✅ All five stores persist the right fields; live session excluded; versioned + migratable; hydration
gates the UI (no flicker); reset works; data maps to Supabase. Scope respected (local only, no
auth/Supabase/AI/nutrition/analytics/wearable; no Library/Settings build-out beyond the reset button).
