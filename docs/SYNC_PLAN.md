# SYNC_PLAN.md — Future local→cloud sync order

> Defines the ORDER we will sync local Zustand stores to Supabase in later loops.
> B-17 delivered auth foundation only — NO data sync yet (beyond a best-effort
> profile upsert on sign-in). Last updated: 2026-06-29

---

## Principles
- **Local-first stays.** Every feature must keep working offline / with Supabase unconfigured.
  Sync is additive, never a replacement for local state.
- **One store per loop.** Sync is introduced incrementally, lowest-risk first, each behind its own loop
  with maker-checker + assertions.
- **Conflict rule (default):** last-write-wins per row using `updated_at`/`logged_at`; the local device
  is authoritative for in-progress/live data until a row is confirmed remote.
- **Idempotent upserts** keyed by stable ids so re-sync never duplicates.
- **No secrets in code.** Only the anon key via `EXPO_PUBLIC_*`; service role never ships to the client.

## Sync order (earliest → latest)
1. **Profile & onboarding** — `user_profiles` (+ thin `users`), `onboarding_answers`. *(profile upsert
   already scaffolded in B-17's auth store.)*
2. **Generated plan** — `workout_plans`, `workout_days`, `workout_exercises`.
3. **Plan progress** — completed `workout_days` (from `planProgressStore.completedDayIds`).
4. **Workout sessions & sets** — `workout_sessions`, `exercise_sets` (from `progressStore.history`).
5. **Cardio logs** — `cardio_logs`.
6. **Body weight & measurements** — `body_weight_logs`, `body_measurement_logs`.
7. **Weekly check-ins** — `weekly_checkins`.
8. **Trainer recommendations** — `trainer_recommendations`.
9. **Progress photos — LAST** — upload local uris to the **private** `progress-photos` bucket, store
   the storage key, serve via signed URLs. Never public.

## Not synced (intentionally, for now)
- Live in-progress workout session (resume state) — stays device-local; too transient to sync.
- Safety acknowledgment — a client preference; may later map to a `user_profiles` boolean.
- Rest-timer / UI-only state.

## Auth foundation already in place (B-17)
- `lib/supabase.ts` client (null when unconfigured), `lib/supabaseConfig.ts` (pure config/status).
- `authStore` (sign up / in / out / initialize); session persisted by the Supabase client via AsyncStorage.
- Sign-out clears the remote session only — local data is preserved (Reset Local Data is the only wipe).

## Schema note (see SUPABASE_AUTH_REVIEW §Naming)
`public.users` mirrors `auth.users`; `public.user_profiles` is the real profile table. When sync lands,
consider dropping the thin `public.users` mirror and treating `user_profiles` as the canonical profile
(a `profiles`-style table keyed by `auth.uid()`). Non-destructive; deferred.
