# WEEKLY_CHECKIN_SYNC_REVIEW.md — B-25 checker pass

> Reviews weekly-check-in sync against DATA_MODEL.md, SYNC_PLAN.md,
> WEEKLY_CHECKIN_REVIEW.md, and the local persistence pattern. Last updated: 2026-06-29

---

## 1. Scope (SYNC_PLAN step 7)
Syncs ONLY `weekly_checkins`. NOT trainer recommendations, progress photos, workouts, sets, cardio,
body weight, measurements, nutrition. No AI/analytics/photo-upload. Local-first.

## 2. Pieces
- `lib/weeklyCheckInSyncCore.ts` (**pure**): `hasSyncableCheckIns`, `decideCheckInSyncDirection`
  (local-wins), `localCheckInId`, `toCheckInRow(s)`, `checkInFromRow(s)`, `CHECKIN_PULL_SUPPORTED=true`.
- `lib/weeklyCheckInSync.ts`: `syncWeeklyCheckIns(user)` push (upsert) / pull (safe) / disabled.
- `state/weeklyCheckInSyncStore.ts`: status + persisted `lastSyncedAtISO`.
- `state/weeklyCheckInStore.ts`: `importCheckIns(entries)` for the pull path.
- `components/WeeklyCheckInSyncCard.tsx` in Settings; `authStore` triggers on sign-in/up.

## 3. Schema safety — non-destructive migration 007
The DB `weekly_checkins` has int scales (energy/soreness/motivation) but NO columns for confidence
(categorical), barriers, small goal, or the generated message. To preserve everything, `007` adds
`payload jsonb` + `local_weekly_checkin_id text` + `unique(user_id, local_weekly_checkin_id)`.
NON-DESTRUCTIVE (2 add-column, 0 drops/renames/updates; verified). Local id:
`checkin:${createdAtISO}:${index}`.

## 4. Conflict policy — LOCAL WINS (verified)
`decideCheckInSyncDirection(localHas, remoteHas)`: local present → push (even if remote exists); else
pull; else noop. Asserted (incl. local+remote → push).

## 5. Data rules — preserved, no reinterpretation (verified)
`toCheckInRow` maps:
- Int columns (queryable/analytics-ready): `energy`/`soreness` = scored; `motivation` = confidence score;
  `week_number`, `workouts_completed`; `cardio_minutes=0`.
- **`payload` (authoritative):** the full local entry — `energy`/`soreness`/`confidence` (original
  CATEGORICAL, not the ints), `barriers`, `smallGoal`, `weekNumber`, `workoutsCompleted`, `createdAtISO`,
  and the generated `message`.
- **No user value is reinterpreted:** the pull reads `payload`, so categoricals round-trip exactly
  (asserted). The int columns are a derived view only.
- **Generated message:** the local entry doesn't store the message; per the rule ("recreate only if the
  stored value is missing and the helper can safely do so"), it's recreated via `weeklyCheckInMessages`
  and stored in `payload.message` (asserted it matches the entry, e.g. 0 workouts → restart message).

## 6. Push / pull
- **Push:** `upsert(toCheckInRows(list, user.id), { onConflict: 'user_id,local_weekly_checkin_id' })`.
- **Pull (SAFE via payload):** `checkInFromRow` reconstructs from `payload`; rows without a usable
  payload (or with invalid categoricals) are dropped (asserted). Applied ONLY when local is empty, via
  `importCheckIns`.

## 7. Local history never mutated on failure (req 11, checker) — verified
`syncWeeklyCheckIns`/`pushCheckIns` only READ `weeklyCheckInStore.checkIns` on push. Pull calls
`importCheckIns` only when local is empty (never overwrites existing local check-ins). On ANY error →
status set, return; local untouched (req 11). App never blocked (req 12).

## 8. Missing config / signed out (req 13 — verified)
`supabase === null` or no `user` → status `disabled`, returns, no crash. Card disables the button.

## 9. Settings + status + persistence (req 14, 15)
`WeeklyCheckInSyncCard` — "Sync weekly check-ins" + status + last-synced + exact copy: "Only weekly
check-ins sync here. Photos and trainer recommendations stay on this device for now." `lastSyncedAtISO`
persisted (B-10 pattern; hydration + reset wired).

## 10. Secrets
None committed; `.env` gitignored.

## 11. Tests (executed, pure) + typecheck
22 assertions: syncable, direction (incl. local-wins), deterministic `localCheckInId`, `toCheckInRow`
(derived ints + payload preserves categorical/barriers/goal, generated message matches entry),
`checkInFromRow`/`checkInsFromRows` safe pull + defenses (no/invalid payload, bad barriers, null),
`CHECKIN_PULL_SUPPORTED=true`. **All pass.** `tsc --noEmit` clean. Migration sanity: 2 add-column, 0 destructive.

## 12. Verdict
✅ Weekly check-ins only; local-wins; full fidelity via `payload` (no value reinterpretation); message
recreated by the rule helper; clean upsert; SAFE pull (only when local empty); non-destructive migration;
local history never mutated; safe/disabled when unconfigured or signed out; failures never erase check-ins.
Scope strictly respected.
