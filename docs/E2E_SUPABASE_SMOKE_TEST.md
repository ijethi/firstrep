# E2E_SUPABASE_SMOKE_TEST.md — B-28

> Full end-to-end smoke test of the FirstRep sync layer against a dev Supabase
> project. Honest status legend: **PASS** (ran, green) · **FAIL** (ran, red) ·
> **NOT RUN** · **NEEDS LIVE SUPABASE** · **NEEDS DEVICE**.
> Last updated: 2026-06-29 · Environment: local dev, **no Supabase CLI**, **no live project provisioned**.

---

## 0. What was actually run here
| Check | Result |
|-------|--------|
| `npx tsc --noEmit` (whole app) | **PASS** |
| Consolidated pure assertions (10 sync cores + config + base64) | **PASS** — 26/26 |
| Migration set present + ordered (001→009) | **PASS** |
| Every migration non-destructive (0 drop/rename/delete/truncate) | **PASS** |
| 001: 15 tables / 15 RLS-enabled / 15 policies | **PASS** |
| seed.sql: 12 beginner machines, idempotent (`on conflict (slug)`) | **PASS** |
| `.env.example` matches the exact env vars the code reads | **PASS** (EXPO_PUBLIC_SUPABASE_URL / _ANON_KEY) |
| `.env` not tracked + gitignored | **PASS** |
| No `getPublicUrl` / `service_role` in `src/` | **PASS** |
| Photos: private bucket (`public=false`) + 4 owner-only Storage policies | **PASS** |
| Missing-env behavior (`isSupabaseConfigured=false`, client `null`) | **PASS** (asserted) — full app boot = **NEEDS DEVICE** |
| Live auth + each sync push/pull round-trip | **NEEDS LIVE SUPABASE** |
| Photo file upload (FileSystem read + Storage put) | **NEEDS DEVICE + LIVE SUPABASE** |

Reproduce the local checks:
```bash
npx tsc --noEmit
# consolidated assertions: compile the *Core.ts + base64.ts to CJS and run the
# node assertion runner (see LOOP_STATE Loop-28 notes for the exact one-liner).
```

---

## 1. Supabase setup checklist (do this to run the live test)
1. **Create a dev project** at supabase.com → get Project URL + anon (publishable) key.
2. **Apply migrations in order** (SQL editor or CLI): `001 → 002 → 003 → 004 → 005 → 006 → 007 → 008 → 009`.
   Each is idempotent-ish (`if not exists`, `on conflict do nothing`) and non-destructive.
3. **Seed exercises:** run `supabase/seed.sql` (idempotent upsert by slug; 12 machines). *Required for plan
   & workout sync — they resolve local slugs → remote `exercises.id`.*
4. **Auth:** enable Email provider. For quick testing, disable "Confirm email" (or confirm via the emailed
   link before signing in).
5. **Storage:** migration `009` already creates the PRIVATE `progress-photos` bucket + owner-only
   `storage.objects` policies. Confirm the bucket shows **Public = false** in the dashboard.
6. **Expo env:** copy `.env.example` → `.env`, fill `EXPO_PUBLIC_SUPABASE_URL` / `EXPO_PUBLIC_SUPABASE_ANON_KEY`.
   Restart Expo so the values inline. **Never commit `.env`.**

## 2. Auth smoke test  — NEEDS LIVE SUPABASE
| Step | Expected |
|------|----------|
| Sign up (Settings → account) | user created; `users`/`user_profiles` upsert attempted |
| Sign in | session restored on reload; status → signed_in |
| Sign out | remote session cleared; **local data preserved** (see §5) |
| RLS: sign in as user B, query user A's rows | 0 rows (RLS `auth.uid() = user_id`) |

## 3. Per-layer sync round-trip — NEEDS LIVE SUPABASE
For each: complete the local action → open Settings → tap the layer's Sync card → expect `Synced ✓` and
matching rows in the dashboard. Pull = sign in on a fresh install (local empty) and confirm re-hydration
where supported.

| Layer | Table(s) | Push | Pull | Notes |
|-------|----------|------|------|-------|
| Profile & onboarding | user_profiles, onboarding_answers, users | ☐ | ☐ (safe) | delete+insert onboarding_answers |
| Generated plan | workout_plans/days/exercises | ☐ | deferred | needs seeded `exercises` for slug→uuid |
| Plan progress | plan_progress | ☐ | ☐ (safe) | upsert on user_id |
| Workout sessions & sets | workout_sessions, exercise_sets | ☐ | deferred | completed-only; strength sets only |
| Cardio | cardio_logs | ☐ | deferred | needs synced session; stops if not |
| Body weight | body_weight_logs | ☐ | ☐ (safe) | kg canonical |
| Body measurements | body_measurement_logs | ☐ | ☐ (safe) | cm canonical + note col |
| Weekly check-ins | weekly_checkins | ☐ | ☐ (safe) | payload jsonb |
| Trainer recs | trainer_recommendations | ☐ | ☐ (safe) | payload jsonb; source→rule_engine |
| Progress photos | progress_photos + Storage | ☐ | deferred | private; upload FIRST then metadata |

## 4. Progress photo upload (B-27 blocker) — status after B-28
- **Fix applied (adapter-only):** replaced `fetch(uri).arrayBuffer()` with the Supabase-RN-recommended
  path: `expo-file-system` `readAsStringAsync(uri, { encoding: Base64 })` → `base64ToUint8Array` →
  `storage.upload(path, bytes, { contentType:'image/jpeg', upsert:true })`.
- **Unit-tested:** `base64ToUint8Array` decodes exact byte lengths incl. JPEG header (asserted).
- **Still NEEDS DEVICE + LIVE SUPABASE:** the `FileSystem.readAsStringAsync` read of a real `file://`
  uri and the actual Storage PUT can only be confirmed on a device against a live bucket.
- **Privacy verified statically:** path is user-scoped (`user_id/date/id.jpg`), no `public` segment, no
  public-URL helper exists, metadata stores a storage KEY (not a URL), no local uri leaks into the row.

## 5. Local-first / safety invariants — verified statically (behavioral confirmation NEEDS DEVICE)
| Invariant | How enforced |
|-----------|--------------|
| Runs with env missing | `supabase = null`; status `unconfigured`; every sync guards `!supabase` → disabled |
| Sync failure never erases local data | every `sync*` only READS local stores on push; error → status only |
| Sign-out preserves local data | `authStore.signOut` clears remote session only |
| Reset Local Data clears LOCAL only | `resetLocalAppData` clears/removes local AsyncStorage keys + resets stores; issues NO remote deletes |
| Photos never deleted after upload | `pushPhotos` never mutates `progressStore.photos` |

## 6. Gaps / not run (be explicit)
- **Live Supabase round-trips (auth + all 10 syncs):** NOT RUN — no project/keys in this environment.
- **Live migration apply:** NOT RUN — Supabase CLI not installed. SQL order documented (§1.2).
- **On-device photo upload:** NEEDS DEVICE — adapter upgraded + unit-tested; file read/PUT unconfirmed.
- **RLS cross-user block:** NEEDS LIVE SUPABASE — policy SQL reviewed (owner-only), not executed.
