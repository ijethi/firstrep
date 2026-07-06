# LIVE_SUPABASE_SMOKE_TEST_RESULTS.md — B-29

> Live smoke test attempt. Legend: **Passed** · **Failed** · **Not run** · **Blocked**
> · **Needs device** · **Needs Supabase dashboard action**.
> Last updated: 2026-06-29.

---

## 0. Security decision (why this run used a DUMMY env)
The Supabase keys were pasted directly into chat, including the **secret key** (`sb_secret_…`), which
bypasses RLS. To avoid using or persisting exposed credentials, this loop used a **DUMMY `.env`**
(placeholder URL + anon key) and did **NOT** connect to the real project.

**Action required by the owner:**
1. **Rotate the secret key** (Supabase → Settings → API → roll `service_role`/secret). Treat it as compromised.
2. Optionally rotate the anon (publishable) key too.
3. To do a real live run later: put the fresh anon key + project URL in `.env` (gitignored), then follow
   `docs/E2E_SUPABASE_SMOKE_TEST.md` §1–§4.

---

## 1. What ran this loop (dummy env, local)
| Check | Result | Notes |
|-------|--------|-------|
| `npx tsc --noEmit` | **Passed** | whole app |
| `.env` exists locally | **Passed** | dummy values |
| `.env` gitignored + not tracked | **Passed** | `git check-ignore` OK; 0 tracked |
| `.env.example` placeholders only | **Passed** | no real project ref / no `sb_secret` |
| App reads only `EXPO_PUBLIC_SUPABASE_URL` / `_ANON_KEY` | **Passed** | grep of `supabaseConfig.ts` |
| No `service_role`/secret key in tracked repo | **Passed** | only doc text saying "don't use service_role" |
| Supabase config detection | **Passed** | no env → `isSupabaseConfigured=false`; dummy present → `true`; `deriveAuthStatus(true,false)='signed_out'` |
| Consolidated sync-core + base64 assertions (from B-28) | **Passed** | 26/26 |
| Migrations 001–009 ordered + 0-destructive; 001 = 15 tables/15 RLS/15 policies; seed 12 idempotent | **Passed** | static review |
| Photos: private bucket + 4 owner-only policies (SQL) | **Passed** | static review of `009` |
| No public photo URLs (no `getPublicUrl`; storage_path is a key) | **Passed** | static |

## 1b. Attempt to apply migrations via management API — BLOCKED
Tried to apply migrations 001–009 + seed to the project WITHOUT the leaked keys, using the Supabase
management (MCP) connection. **Blocked: HTTP 503** on `list_projects` / `list_migrations` (3 attempts).
The management connection is unavailable in this environment, so backend setup could not run here.

## 2. Live steps — NOT RUN (dummy env + management API 503; needs rotated real keys / device)
| Step | Status |
|------|--------|
| Apply migrations 001–009 to dev project | **Not run** (needs rotated keys; SQL order documented) |
| Apply `seed.sql` | **Not run** |
| Confirm private bucket exists live | **Needs Supabase dashboard action** |
| Confirm storage policies live | **Needs Supabase dashboard action** |
| Auth: sign up / sign in / sign out / session restore | **Not run** (needs live + device) |
| Sync round-trips (all 10 layers) | **Not run** (needs live + device) |
| Cross-user RLS block (user 2 can't read user 1) | **Not run** (needs live) |

## 3. Photo upload adapter (B-27/B-28)
- Adapter uses `expo-file-system` `readAsStringAsync(Base64)` → `base64ToUint8Array` → `storage.upload`.
- `base64ToUint8Array` is unit-tested (exact byte lengths incl. JPEG header).
- On-device file read + Storage PUT: **Needs device** — NOT run (dummy env, no device here).

## 4. Failure-safety / privacy (static — behavioral confirmation needs device)
- Missing/broken env → `supabase=null`, status `unconfigured`, no crash. **Passed (asserted)**.
- Sign-out clears remote session only; **local data preserved** (code path). **Passed (static)**.
- Reset Local Data clears LOCAL stores/keys only; issues **no** remote deletes. **Passed (static)**.
- Sync failure → status only; local stores never cleared. **Passed (static)**.

## 5. Exact files changed this loop
- NEW `.env` (dummy, **gitignored — not committed**).
- NEW `docs/LIVE_SUPABASE_SMOKE_TEST_RESULTS.md` (this file).
- CHANGED `docs/RELEASE_READINESS_REPORT.md` (live-run status note).
- CHANGED `LOOP_STATE.md`.
- **No source/product code changed** (verification loop).

## 6. Recommended next task
1. **Rotate the exposed secret key now.**
2. Re-run B-29 as a true live test with a **fresh anon key** in `.env` on a device/simulator:
   apply 001–009 + seed → verify bucket/policies → auth → each sync card → on-device photo upload →
   cross-user RLS. Fill in the **Not run** rows above.
