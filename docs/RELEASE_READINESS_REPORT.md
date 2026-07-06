# RELEASE_READINESS_REPORT.md — FirstRep (as of B-28)

> Honest readiness snapshot. Legend: ✅ done/verified · 🟡 built, needs live/device verification ·
> ⛔ not started. Last updated: 2026-06-29.

---

## 1. Product (local-first MVP) — ✅ shippable locally
The full beginner journey works entirely on-device, offline, with no backend:
- Safety intro + onboarding quiz → rule-based 4-week plan generation.
- Today (multi-day nav, adaptive suggestions), guided session (set logging, rest timer, pain-safe),
  resumable in-progress workout, session summary + trainer recommendations.
- Progress dashboard (weight/streak/cardio/strength, measurements, photos), Exercise Library,
  Weekly check-in, Settings (edit prefs → safe plan regen), Reset Local Data.
- All state persisted via AsyncStorage; hydration-gated launch.

## 2. Quality gates — ✅
| Gate | Status |
|------|--------|
| TypeScript (`tsc --noEmit`, strict) | ✅ clean |
| Pure-logic assertions (plan gen, trainer engine, progression, all 10 sync cores, base64) | ✅ passing |
| No secrets committed (`.env` ignored; `.env.example` accurate) | ✅ |
| Migrations non-destructive + ordered (001→009) | ✅ |
| Git history authored by owner (`ijethi`), no AI co-author | ✅ |

## 3. Cloud sync (SYNC_PLAN 1–9) — 🟡 built + unit-tested, live round-trip pending
Auth foundation + all 9 data layers are implemented local-first with local-wins and (where lossless)
safe pull. **Not yet exercised against a live project** (no dev project/keys in this environment).
See `docs/E2E_SUPABASE_SMOKE_TEST.md`.

| Layer | Code | Live verified |
|-------|------|---------------|
| Auth (email/pw, session) | ✅ | 🟡 NEEDS LIVE |
| Profile & onboarding | ✅ | 🟡 |
| Generated plan | ✅ | 🟡 (needs seed) |
| Plan progress | ✅ | 🟡 |
| Workout sessions & sets | ✅ | 🟡 |
| Cardio | ✅ | 🟡 |
| Body weight | ✅ | 🟡 |
| Body measurements | ✅ | 🟡 |
| Weekly check-ins | ✅ | 🟡 |
| Trainer recommendations | ✅ | 🟡 |
| Progress photos (private Storage) | ✅ | 🟡 NEEDS DEVICE + LIVE |

## 4. Known blockers / follow-ups
1. **Live Supabase verification** (🟡): provision a dev project, apply 001–009 + seed, add `.env`, then
   run the smoke-test matrix. Highest-value next step before any sync ships to users.
2. **Photo upload on device** (🟡): adapter upgraded to `expo-file-system` base64 → `Uint8Array` (the
   Supabase-RN pattern); base64 decode unit-tested; file read + Storage PUT need a device.
3. **Pull for plan / workouts / cardio / photos** (⛔ deferred): current schema can't losslessly
   reconstruct these local view models. Options: add `*_json` columns, or a signed-URL photo gallery.
4. **RLS cross-user test** (🟡): policies reviewed (owner-only); execute against a live project.

## 5. Not in scope (by design)
AI trainer chat, nutrition/calorie tracking, wearable sync, advanced analytics, public photo sharing,
multi-gym support. (All explicitly deferred in PRODUCT_SPEC / per-loop constraints.)

## 6. Recommendation
- **Local-first MVP:** ✅ ready for internal/TestFlight-style trials on device (`npx expo start`).
- **Cloud sync:** 🟡 hold until the live smoke test (§blocker 1) + on-device photo upload (§blocker 2)
  are green. Everything is code-complete and unit-tested; only live/device confirmation remains.
