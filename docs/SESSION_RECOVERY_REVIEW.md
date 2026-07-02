# SESSION_RECOVERY_REVIEW.md — B-15 checker pass

> Reviews resumable in-progress workout recovery against UX_FLOW.md, DATA_MODEL.md,
> TRAINER_LOGIC.md, and the B-10 persistence pattern. Last updated: 2026-06-29

---

## 1. What it does
B-10 deliberately did NOT persist the live workout session (no safe recovery flow). B-15 adds that
flow: the in-progress session is now persisted, and on reload Today offers to Continue / End / Discard
an unfinished workout — resuming at the exact exercise and set. Local only; no backend/auth/AI/sync.

## 2. What is persisted (requirements 1–3)
`workoutSessionStore` is now wrapped in `persist` (key `firstrep:workout-session`, version 1, migrate),
`partialize: { session }`. The session already holds only DURABLE data — session identity, plan day
(week/day), name, started-at, logged sets, cardio, skips, pain flags, status, and the new
`currentExerciseIndex` (resume point; set index is derivable from `sets.length`). The **rest-timer
countdown is NOT in the store** — it's transient screen state that resets to `false` on remount, so a
reload never auto-advances on stale time (requirements 3 + 12).

## 3. Recovery detection + prompt (requirements 4–6, 14)
`lib/sessionRecovery.ts` (**pure**) gates resume through three checks:
- `isInProgress` — status === 'in_progress'.
- `isStructurallyValid` — guards corrupt persisted JSON (exercises array, numeric targetSets, sets array).
- `sessionMatchesPlanDay` — the saved session's exercise ids still match the plan day (guards a plan
  regenerated via Settings).

`resumeInfo(session, planDay)` returns null unless in-progress; otherwise `{ resumable, dayName,
exerciseLabel, stepIndex }`. Today renders `ResumeWorkoutCard`:
- **Resumable** → "You have a workout in progress … Do you want to continue or end it?" + Continue / End
  / Discard, and shows where they were ("Chest Press · Set 2 of 3").
- **Not resumable** (corrupt/mismatch) → "We couldn't safely resume this workout. You can start again
  from Today." + a single Clear button. Conservative per the spec.

## 4. Continue / End / Discard (requirements 7–9)
- **Continue** → navigate to `WorkoutGuide` for the session's week/day. The screen initializes its step
  from `resumeStepIndex` (clamped), so it opens at the right exercise; set logging continues from
  `sets.length`. Rest starts idle (no stale timer).
- **End** → `concludeSession('abandoned')` (shared action) → SessionSummary.
- **Discard** → `clearSession()` only — no history, no summary, stays on Today.

## 5. Completed vs abandoned/discarded (requirements 8, 10, 11)
The shared `lib/sessionActions.concludeSession(status)` is used by BOTH the workout screen's finish and
the resume card's End, so behavior is identical:
- always: stamp status, run trainer engine, save recs, **save the session to progress history**.
- **only `completed`** registers completion + `markDayCompleted` (advances the plan).
- **`abandoned` never advances plan progress**; **Discard** doesn't even save history. Verified: the
  markDayComplete call sits inside the `status === 'completed'` branch.

## 6. Terminal-session cleanup
On finish the persisted session becomes terminal (completed/abandoned). SessionSummary's "Back to
Today" now calls `clearSession()` so a reload never re-detects it as in-progress. If a reload happens
before that (rare), Today simply won't show a resume card (status ≠ in_progress); the next Start
overwrites it.

## 7. Reset (requirement 15)
`resetLocalAppData` already clears the workout-session store and, via `clearPersistedStorage`
(`Object.values(STORAGE_KEYS)` now includes `workoutSession`), removes the persisted key. Also added to
`useAppHydrated` so Today's resume detection is correct on first render (no flicker).

## 8. Maps to DB
Unchanged from B-05/B-06: `WorkoutSessionLocal` → `workout_sessions` (+ `exercise_sets`, `cardio_logs`);
completed sessions still save to history and map the same way. `currentExerciseIndex` is a local resume
aid (no column needed).

## 9. Robustness / corruption (no crash)
All recovery helpers are null-safe and array-checked (asserted). A plan regenerated mid-session →
`sessionMatchesPlanDay` false → not resumable → Clear. Out-of-range `currentExerciseIndex` is clamped.
WorkoutGuide still guards a missing session/plan day.

## 10. Risks / notes
- Runtime reload behavior (persist rehydrate → resume) needs a device; verified via typecheck + pure
  assertions here.
- Discarding loses partial logged data by design (user chose to discard). End preserves it in history.
- `currentExerciseIndex` is synced on every step change; set index is derived (not separately stored),
  which is sufficient to resume the correct set.

## 11. Tests (executed, pure)
22 assertions: in-progress/terminal detection, structural validity, plan-day match/mismatch/length/null,
`canSafelyResume` combinations, `resumeStepIndex` clamping (saved/cardio/over/under/no-cardio), and
`resumeInfo` labels + corrupt/null paths. **All pass.**

## 12. Verdict
✅ In-progress session is recoverable; Today prompts Continue/End/Discard; resumes at the right
exercise/set; abandoned/discarded never advance the plan; completed still saves normally; rest timer
never auto-advances on stale time; corrupt/mismatched sessions handled conservatively; reset clears it.
Scope respected (local only).
