# BODY_MEASUREMENT_SYNC_REVIEW.md — B-24 checker pass

> Reviews body-measurement sync against DATA_MODEL.md, SYNC_PLAN.md,
> BODY_PROGRESS_REVIEW.md, and the local persistence pattern. Last updated: 2026-06-29

---

## 1. Scope (SYNC_PLAN step 6 cont.)
Syncs ONLY `body_measurement_logs`. NOT progress photos, recommendations, weekly check-ins, workouts,
sets, cardio, body weight (already B-23), nutrition. No AI/analytics/photo-upload. Local-first.

## 2. Pieces
- `lib/bodyMeasurementSyncCore.ts` (**pure**): `hasSyncableMeasurements`, `decideMeasurementSyncDirection`
  (local-wins), `localMeasurementId`, `toMeasurementRow(s)`, `measurementFromRow(s)`,
  `MEASUREMENT_PULL_SUPPORTED=true`.
- `lib/bodyMeasurementSync.ts`: `syncBodyMeasurements(user)` push (upsert) / pull (safe) / disabled.
- `state/bodyMeasurementSyncStore.ts`: status + persisted `lastSyncedAtISO`.
- `state/progressStore.ts`: `importMeasurements(entries)` for the pull path.
- `components/BodyMeasurementSyncCard.tsx` in Settings; `authStore` triggers on sign-in/up.

## 3. Schema safety — non-destructive migration 006
`body_measurement_logs` had no client id, and no `note` column (the local entry has a `note`).
`006_body_measurement_sync_ids.sql` adds `note text` + `local_measurement_log_id text` +
`unique(user_id, local_measurement_log_id)`. NON-DESTRUCTIVE (2 add-column, 0 drops/renames/updates;
verified). Local id: `measure:${loggedOnISO}:${index}` → re-sync upserts the same row.

## 4. Conflict policy — LOCAL WINS (verified)
`decideMeasurementSyncDirection(localHas, remoteHas)`: local present → push (even if remote exists);
else pull; else noop. Asserted (incl. local+remote → push).

## 5. Data rules (cm canonical, note preserved) — verified
- Values stored/synced **canonically in cm** (`waist_cm`/`chest_cm`/`hip_cm`); NO cm→in conversion
  (asserted). Unit preference is display-only.
- `arm_cm`/`thigh_cm` aren't captured locally → null (no fabrication).
- `note` preserved (via the new column). `logged_on` = date portion of `loggedOnISO`.
- Partial entries (any subset of waist/chest/hip) are kept as-is (asserted).

## 6. Push / pull
- **Push:** `upsert(toMeasurementRows(entries, user.id), { onConflict: 'user_id,local_measurement_log_id' })`.
- **Pull (SAFE, supported):** measurements are simple (cm + date + note), so `measurementFromRow`
  reconstructs a `BodyMeasurementEntry`; a row with no measurement value at all is dropped. Applied ONLY
  when local is empty, via `importMeasurements`. Bad/empty rows filtered (asserted).

## 7. Local history never mutated on failure (req 11, checker) — verified
`syncBodyMeasurements`/`pushMeasurements` only READ `progressStore.measurements` on push. Pull calls
`importMeasurements` only when local is empty (never overwrites existing local entries). On ANY error →
status set, return; local untouched (req 11). App never blocked (req 12).

## 8. Missing config / signed out (req 13 — verified)
`supabase === null` or no `user` → status `disabled`, returns, no crash. Card disables the button.

## 9. Settings + status + persistence (req 14, 15)
`BodyMeasurementSyncCard` — "Sync measurements" + status + last-synced + exact copy: "Only body
measurements sync here. Photos and recommendations stay on this device for now." `lastSyncedAtISO`
persisted (B-10 pattern; hydration + reset wired).

## 10. Secrets
None committed; `.env` gitignored.

## 11. Tests (executed, pure) + typecheck
21 assertions: syncable, direction (incl. local-wins), deterministic `localMeasurementId`,
`toMeasurementRow` (canonical cm, arm/thigh null, note, date-only, partial metrics), indexing,
`measurementFromRow`/`measurementsFromRows` safe pull + defenses (empty/null filtered),
`MEASUREMENT_PULL_SUPPORTED=true`. **All pass.** `tsc --noEmit` clean. Migration sanity: 2 add-column,
0 destructive.

## 12. Verdict
✅ Body measurements only; local-wins; canonical cm (no conversion); note preserved; clean upsert; SAFE
pull (only when local empty); non-destructive migration; local history never mutated; safe/disabled when
unconfigured or signed out; failures never erase measurements. Scope strictly respected.
