# SAFETY_POLISH_REVIEW.md — B-16 checker pass

> Reviews safety disclaimer + first-run intro + rest-timer polish against UX_FLOW.md,
> TRAINER_LOGIC.md, and the B-10 persistence pattern. Last updated: 2026-06-29

---

## 1. What it does
Makes the app feel safer and more trustworthy for a gym beginner: a one-time fitness safety disclaimer,
clearer pain-reporting copy, a light "start light" reminder at the start of a workout, a Safety Tips
section in Settings, and a polished rest timer (clearer copy, Restart/+15s/Skip, end haptic). Local only;
no backend/Supabase/auth/AI/nutrition/analytics/wearable/photo-upload. Trainer progression logic unchanged.

## 2. Disclaimer + first-run intro (requirements 1–6)
- `SafetyIntroScreen` shows once before onboarding, with `SafetyDisclaimerCard` (the exact required copy)
  and an "I understand — let's go" button.
- `safetyStore` (Zustand **persist**, key `firstrep:safety`, version 1) holds `acknowledged`.
- Routing: `lib/safety.initialRouteName(acknowledged, onboardingComplete)` →
  `SafetyIntro` (not acknowledged) → else `Main`/`Onboarding`. `RootNavigator` uses it as
  `initialRouteName` (computed post-hydration, so no flicker). Asserted for all 4 combinations.
- Copy is beginner-friendly, **not medical advice**, no scary/legal-wall language (asserted: no
  diagnose/treat/liable/diet terms).

## 3. Workout start reminder (requirement 7)
`WorkoutGuideScreen` shows "💡 Start light today. You can always add weight later." on the first step
before any set is logged (`step === 0 && sets.length === 0`). Unobtrusive banner, not a blocking modal.

## 4. Pain reporting copy (requirement 8)
`SetLogger` toggle now reads "No sharp pain" / "⚠️ I felt sharp pain", hint "Tap only for sharp pain",
plus a help line: "Pain means sharp or unusual pain. Normal muscle effort is okay." (`PAIN_HELP`).
This only changes copy — the pain flag still drives the same R1/R3 safety behavior (progression logic
untouched, per the constraint).

## 5. Rest timer polish (requirements 9–10)
- Clearer copy: "Catch your breath" + "Next: Set N of M".
- Controls: **Restart rest**, **+15 sec**, **Skip rest** (Restart is new).
- Haptic: `expo-haptics` (~14.0.1) fires `notificationAsync(Success)` when the countdown reaches 0,
  wrapped in `.catch(() => {})` so unsupported platforms (web) are safe. Haptics install was simple
  (one `expo install`), so it was added rather than skipped.
- **No stale auto-advance after reload:** the countdown lives entirely in `RestTimer` local state
  (never persisted). The screen only renders `RestTimer` while `resting` is true, and `resting` resets
  to `false` on remount — so a reload lands on the exercise in logging mode, never mid-countdown.
- Pure helpers `lib/restTimer.ts`: `formatCountdown` (clamps negatives), `adjustSeconds` (0..15min),
  `initialRest` (fallback 30). Asserted.

## 6. Settings Safety Tips (requirement 11)
`SettingsScreen` has a "Safety tips" section: start light · stop for sharp pain/dizziness/chest pain ·
ask staff if unsure about a machine · keep movements controlled — plus the disclaimer text for reference
(`SAFETY_TIPS` + `DISCLAIMER_TEXT`).

## 7. Reset clears acknowledgment (requirement 12)
`resetLocalAppData` now calls `useSafetyStore.getState().reset()`, and `clearPersistedStorage`
(`Object.values(STORAGE_KEYS)` includes `safety`) removes the persisted flag. Settings "Reset local data"
then routes back to `SafetyIntro` (since the acknowledgment was cleared).

## 8. Persistence / hydration
Same B-10 pattern. `safetyStore` added to `useAppHydrated()` so `acknowledged` is known before the first
render — the initial route is correct with no disclaimer flicker.

## 9. Maps to DB
Safety acknowledgment is a client-only preference (no table needed). If ever synced, it fits a
`user_profiles` boolean. No schema change.

## 10. Risks / notes
- Runtime (haptic buzz, first-run routing after rehydrate) needs a device; verified via typecheck +
  pure assertions.
- Disclaimer is intentionally short (not a legal wall). It is guidance, not medical/diagnostic content.
- Rest-timer `+15s` is capped at 15 min so it can't run away.

## 11. Tests (executed, pure)
17 assertions: disclaimer content + non-medical/non-scary check, start reminder + pain help copy, 4
safety tips coverage, `initialRouteName` (all 4 cases), `formatCountdown` (+clamp), `adjustSeconds`
(+/- and max cap), `initialRest`. **All pass.**

## 12. Verdict
✅ One-time disclaimer acknowledged + persisted; reset clears it; start reminder; clearer pain copy;
polished rest timer with safe reload behavior + haptic; Settings safety tips. Copy is beginner-friendly
and non-medical. Scope respected; trainer logic unchanged.
