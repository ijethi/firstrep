# PROFILE_ONBOARDING_SYNC_REVIEW.md — B-18 checker pass

> Reviews profile + onboarding sync against DATA_MODEL.md, SYNC_PLAN.md,
> SUPABASE_AUTH_REVIEW.md, and the local persistence pattern. Last updated: 2026-06-29

---

## 1. Scope (SYNC_PLAN step 1 only)
Syncs ONLY **user profile** + **onboarding answers**. Nothing else: no workout sessions, sets, cardio,
body weight, measurements, progress photos, trainer recommendations, or weekly check-ins. No AI/nutrition/
analytics/photo-upload. App stays fully local-first.

## 2. Pieces
- `lib/profileSyncCore.ts` (**pure**): `decideSyncDirection`, `answersFromRemote`, `SyncStatus`.
- `lib/profileSync.ts`: `syncProfile(user)` orchestration (Supabase reads/writes).
- `state/profileSyncStore.ts`: status + `lastSyncedAtISO` (persisted), `lastError`.
- `state/onboardingStore.ts`: `importAnswers(answers, completed)` for the pull path.
- `components/ProfileSyncCard.tsx` in Settings; `authStore` triggers sync on sign-in/up.

## 3. Conflict policy — LOCAL WINS (req + verified)
`decideSyncDirection(localComplete, remoteHasData)`:
| local complete | remote has data | direction |
|---|---|---|
| yes | no | push |
| **yes** | **yes** | **push (local wins)** |
| no | yes | pull |
| no | no | noop |
Reason: the user built locally first, so the current device is the source of truth until full conflict
handling is designed. Asserted (incl. the local+remote → push case).

## 4. On sign-in / sign-up (req 2, 3)
`authStore.signIn/signUp` fire `void syncProfile(data.user)` (non-blocking, so auth returns fast; the
sync store shows progress). `syncProfile`:
1. disabled if `!supabase || !user`.
2. reads latest remote `onboarding_answers` + any `user_profiles` row.
3. `push` → upsert `users` (id,email) + `user_profiles` (onConflict user_id) + replace `onboarding_answers`.
4. `pull` → `importAnswers(answersFromRemote(raw), true)`.

## 5. Manual sync (req 4)
`ProfileSyncCard` has a "Sync profile" button (calls `syncProfile(user)`), shows status + last-synced
time, and the exact scope copy: "Only your profile and onboarding answers sync right now. Workouts stay
on this device." Disabled unless signed in.

## 6. Status + persistence (req 5, 6)
`SyncStatus = idle | syncing | success | error | disabled`. `lastSyncedAtISO` persisted (same B-10
pattern; added to `useAppHydrated` + `resetLocalAppData`). `status`/`lastError` are transient (reset to
idle on reload). `disabled` shown when unconfigured or signed out.

## 7. Local data is never erased (req 7, 8 — verified by design)
`syncProfile` only READS local stores when pushing. On the PULL path it calls `importAnswers` (that's an
intentional replace of the *incomplete* local onboarding with remote data — never a wipe of workout/
progress data). On ANY error it sets `status='error'` and returns — it does **not** clear or modify any
store. The only wipe path remains `resetLocalAppData`. The app is never blocked by a sync failure.

## 8. Missing Supabase config (req 9 — verified)
`supabase` is `null` when env vars are absent → `syncProfile` sets `disabled` and returns; the card
disables the button. No crash (config asserted in B-17 + here via the disabled branch).

## 9. Schema mapping (DATA_MODEL)
- `users` ← { id, email } (upsert on PK).
- `user_profiles` ← { user_id, ...toUserProfile(answers) } (upsert onConflict `user_id`).
- `onboarding_answers` ← { user_id, answers: toOnboardingAnswers(answers) }.
`answersFromRemote` reconstructs local `OnboardingAnswers` from the `onboarding_answers.answers` jsonb
(full fidelity incl. exact age + goal weight), with defensive defaults for missing/garbage fields
(asserted).

## 10. `onboarding_answers` has no unique(user_id) — handled (req 10 posture)
That table is an append-log; a plain upsert-on-user_id would fail (no unique constraint). Rather than
hack a fake conflict target, the push does **delete-by-user_id then insert** so re-syncs don't pile up
duplicates. This is remote-only and non-destructive to local data. Documented as the safe approach; a
future migration could add `unique(user_id)` or a dedicated `profiles` row.

## 11. Schema `users` naming (from B-17, unchanged)
Still using `public.users` (mirror) + `public.user_profiles`. No rename/destructive change this loop
(no live project). Future proposal in SYNC_PLAN: collapse to a single `profiles`-style table. If a real
mismatch surfaces at runtime, `syncProfile` surfaces it as `status='error'` (message shown) and stops —
it does not transform data to force a fit.

## 12. Secrets
No secrets committed; `.env` gitignored (verified), only `.env.example` placeholders.

## 13. Tests (executed, pure) + typecheck
11 assertions: `decideSyncDirection` (4 cases incl. local-wins), `answersFromRemote` field mapping +
canonical units + null/garbage/bad-type defenses. **All pass.** Full `tsc --noEmit` clean.

## 14. Verdict
✅ Profile + onboarding sync only; local-wins; disabled/safe when unconfigured or signed out; failures
never erase local data or block the app; Settings shows status + last-synced. Maps to
users/user_profiles/onboarding_answers. Scope strictly respected.
