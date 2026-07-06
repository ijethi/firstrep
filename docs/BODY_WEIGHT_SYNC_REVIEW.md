# BODY_WEIGHT_SYNC_REVIEW.md — B-23 checker pass

> Reviews body-weight sync against DATA_MODEL.md, SYNC_PLAN.md, and the local
> persistence pattern. Last updated: 2026-06-29

---

## 1. Scope (SYNC_PLAN step 6, weight only)
Syncs ONLY `body_weight_logs`. NOT measurements, photos, recommendations, weekly check-ins, workouts,
sets, cardio, nutrition. No AI/analytics/photo-upload. Local-first.

## 2. Pieces
- `lib/bodyWeightSyncCore.ts` (**pure**): `hasSyncableWeights`, `decideWeightSyncDirection` (local-wins),
  `localWeightId`, `toWeightRow(s)`, `weightFromRow`/`weightsFromRows`, `WEIGHT_PULL_SUPPORTED=true`.
- `lib/bodyWeightSync.ts`: `syncBodyWeight(user)` push (upsert) / pull (safe) / disabled.
- `state/bodyWeightSyncStore.ts`: status + persisted `lastSyncedAtISO`.
- `state/progressStore.ts`: `importBodyWeights(entries)` for the pull path.
- `components/BodyWeightSyncCard.tsx` in Settings; `authStore` triggers on sign-in/up.

## 3. Schema safety — non-destructive migration 005
`body_weight_logs` had no client id. `005_body_weight_sync_ids.sql` adds `local_weight_log_id text` +
`unique(user_id, local_weight_log_id)`. NON-DESTRUCTIVE (1 add-column, 0 drops/renames/updates; verified).
Local id: `weight:${loggedOnISO}:${index}` (append-only list → stable index), so re-sync upserts the same row.

## 4. Conflict policy — LOCAL WINS (verified)
`decideWeightSyncDirection(localHasWeights, remoteHasWeights)`: local present → push (even if remote
exists); else pull; else noop. Asserted (incl. local+remote → push).

## 5. Units — canonical kg preserved
Local `BodyWeightEntry.weightKg` and DB `body_weight_logs.weight_kg` are BOTH canonical kg, so sync does
**no** conversion (D7). `logged_on` (a DATE column) gets the date portion of `loggedOnISO`.

## 6. Push / pull
- **Push:** `upsert(toWeightRows(entries, user.id), { onConflict: 'user_id,local_weight_log_id' })` —
  idempotent, no duplicates.
- **Pull (SAFE, supported):** weight logs are simple (kg + date), so `weightFromRow` reconstructs a
  `BodyWeightEntry` (time normalized to midnight UTC). Applied ONLY when local is empty, via
  `importBodyWeights`. Bad/partial rows are filtered out (asserted). This is the first sync loop where
  pull is fully safe (contrast plan/workout/cardio pull, which are deferred).

## 7. Local history never mutated on failure (req 11, checker) — verified
`syncBodyWeight`/`pushWeights` only READ `progressStore.bodyWeights` on the push path. The pull path
calls `importBodyWeights` only when local is empty (never overwrites existing local logs). On ANY error
→ status set, return; local untouched (req 11). App never blocked (req 12).

## 8. Missing config / signed out (req 13 — verified)
`supabase === null` or no `user` → status `disabled`, returns, no crash. Card disables the button.

## 9. Settings + status + persistence (req 14, 15)
`BodyWeightSyncCard` — "Sync body weight" + status + last-synced + exact copy: "Only body weight logs
sync here. Measurements, photos, and recommendations stay on this device for now." `lastSyncedAtISO`
persisted (B-10 pattern; hydration + reset wired).

## 10. Secrets
None committed; `.env` gitignored.

## 11. Tests (executed, pure) + typecheck
19 assertions: syncable, direction (incl. local-wins), deterministic `localWeightId`, `toWeightRow`
(canonical kg, date-only `logged_on`, id), `toWeightRows` indexing, `weightFromRow`/`weightsFromRows`
safe pull + defenses (bad weight/date/null filtered), `WEIGHT_PULL_SUPPORTED=true`. **All pass.**
`tsc --noEmit` clean. Migration sanity: 1 add-column, 0 destructive.

## 12. Verdict
✅ Body weight logs only; local-wins; canonical kg; clean upsert; SAFE pull (only when local empty);
non-destructive migration; local history never mutated; safe/disabled when unconfigured or signed out;
failures never erase weight logs. Scope strictly respected.
