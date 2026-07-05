# SUPABASE_AUTH_REVIEW.md — B-17 checker pass

> Reviews the Supabase auth foundation against DATA_MODEL.md, UX_FLOW.md, the local
> persistence pattern, and the migration files. Last updated: 2026-06-29

---

## 1. Scope
Auth foundation ONLY: sign up / in / out, session restore, a best-effort profile upsert, and a Settings
auth card — while the app stays fully local-first. **No data sync** of sessions/sets/photos/measurements/
recommendations/plans (that's SYNC_PLAN.md, later loops). No AI/nutrition/analytics/wearable.

## 2. Pieces
- `lib/supabaseConfig.ts` (**pure**): `hasSupabaseConfig`, `deriveAuthStatus`, `LOCAL_FIRST_MESSAGE`,
  and env-derived `SUPABASE_URL`/`SUPABASE_ANON_KEY`/`isSupabaseConfigured`.
- `lib/supabase.ts`: the client — **`null` when unconfigured** (AsyncStorage session storage,
  autoRefresh, persistSession, detectSessionInUrl:false, `react-native-url-polyfill/auto`).
- `state/authStore.ts`: `user/session/loading/status` + `initialize/signUp/signIn/signOut`.
- Screens `SignInScreen`, `SignUpScreen`; `components/AuthStatusCard` in Settings; routes added.
- `.env.example` (committed); `.env` gitignored.

## 3. Missing env → safe not-configured state (req 5, verified)
`isSupabaseConfigured` is false when either env var is missing/blank (asserted, incl. whitespace/null).
`supabase` is then `null`; auth store status is `unconfigured`; every auth action guards `if (!supabase)`
and returns a friendly message. `App.initialize()` no-ops. **The app runs and stays fully usable.**

## 4. Auth flow (req 6–9)
Email+password. `initialize()` restores an existing session and subscribes to `onAuthStateChange`.
`signUp`/`signIn` return `{ error }` for inline display; `signOut` clears session state only. Routes
`SignIn`/`SignUp` are reachable from Settings (not part of the first-run gate — auth is optional).

## 5. Local-first preserved (req 10, 11, 15 — verified by design)
- SafetyIntro → Onboarding → Main flow is unchanged; auth is not on the critical path.
- `authStore` does **not** touch any local store on sign-in or sign-out. Sign-out only clears the remote
  session. The ONLY local wipe remains `resetLocalAppData` (explicit Reset Local Data).
- Signing in after local use does not erase anything — profile upsert only *reads* local onboarding.

## 6. Profile upsert (req 12, verified by design)
On successful sign-up/sign-in, `upsertProfile(user)` best-effort upserts `public.users` (id, email) then,
if onboarding is complete, `public.user_profiles` (`user_id` + `toUserProfile(answers)`, `onConflict:
user_id`). Wrapped in try/catch → **never throws, never blocks, never erases local data**. Only runs when
Supabase is configured; in an unprovisioned dev build it isn't called.

## 7. Copy (req 13)
`LOCAL_FIRST_MESSAGE` = "Your workouts are still saved on this device. Cloud sync will be added step by
step." appears on the auth screens and the Settings auth card.

## 8. Secrets (req 4, verified)
No secrets in code. `.env` is gitignored (verified via `git check-ignore`), `.env.example` holds only
placeholders and documents that the anon (publishable) key is client-safe and the service_role key must
NOT be used. Env is read via `EXPO_PUBLIC_*` (Expo inlines at build).

## 9. Schema naming risk (documented, not changed)
The migration has `public.users` (thin mirror of `auth.users`) AND `public.user_profiles`. `public.users`
shadowing `auth.users` is a mild smell; best practice is a single `profiles`-style table keyed by
`auth.uid()`. **Proposal (deferred, non-destructive):** when sync lands, drop the thin `public.users`
mirror and use `user_profiles` as canonical. No destructive change this loop (no live project; migration
files remain the source of truth).

## 10. Maps to DB
`user_profiles` upsert matches the `user_profiles` columns (goal/sex/age_range/height_cm/…/unit_pref).
`users` upsert matches (id, email). RLS in the migration (`auth.uid() = user_id`) already scopes these.

## 11. Risks / notes
- Runtime auth (real sign-in) needs a provisioned Supabase project + `.env`; not exercised here.
  Verified: config logic (13 assertions) + full typecheck + no-secret check.
- `@supabase/supabase-js` warns Node 20 is deprecating for their tooling — affects our dev Node, not the
  RN runtime; non-blocking.
- Email-confirmation projects: sign-up shows "check your email … then sign in" (handled in copy).

## 12. Tests (executed, pure)
`hasSupabaseConfig` (both/one/none/blank/null), `deriveAuthStatus` (all 4), local-first message,
`isSupabaseConfigured` false with no env. **13/13 pass.** Plus a secret-leak check (`.env` untracked +
ignored).

## 13. Verdict
✅ App runs safely with env missing; sign up/in/out wired; local data preserved on sign-in/out; profile
upsert is best-effort and non-destructive; Settings shows auth status; no secrets committed; no data sync
added. Scope respected.
