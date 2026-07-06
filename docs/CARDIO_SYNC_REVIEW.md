# CARDIO_SYNC_REVIEW.md — B-22 checker pass

> Reviews cardio-log sync against DATA_MODEL.md, SYNC_PLAN.md, WORKOUT_SYNC_REVIEW.md,
> and the local persistence pattern. Last updated: 2026-06-29

---

## 1. Scope (SYNC_PLAN step 5 only)
Syncs ONLY `cardio_logs` from completed sessions. NOT body weight, measurements, photos,
recommendations, weekly check-ins, nutrition. No AI/analytics/photo-upload. Local-first.

## 2. What syncs (req 3–6, verified)
`hasSyncableCardio(s)` = `status==='completed'` AND `s.cardio` present AND `!skipped` AND
`completedMinutes != null`. So cardio from abandoned / active (`in_progress`) / skipped / zero-effort
sessions never syncs (asserted); discarded sessions aren't in `history` at all (B-15). One cardio block
per local session → cardio index 0.

## 3. Depends on synced workout sessions (req 7, 8 — verified)
Cardio rows need `session_id` (remote `workout_sessions.id`). `cardioSync` reads `workout_sessions`
ONLY to build a `local_session_id → remote id` map (the sanctioned exception in req 7). If a cardio's
local session has no remote row yet, it **stops** with the exact error: **"Sync workouts before syncing
cardio."** — it never fabricates a `workout_sessions` row (checker requirement).

## 4. Schema safety — non-destructive migration 004
`cardio_logs` had no client id. `004_cardio_sync_ids.sql` adds `local_cardio_log_id text` +
`unique(user_id, local_cardio_log_id)`. NON-DESTRUCTIVE (1 add-column, 0 drops/renames/deletes; verified).
Local id is deterministic: `cardio:${local_session_id}:0`, so re-sync upserts the same row.

## 5. Conflict policy — LOCAL WINS (verified)
`decideCardioSyncDirection(localHasCardio, remoteHasCardio)`: local present → push (even if remote
exists); else pull; else noop. Asserted (incl. local+remote → push).

## 6. Remote write strategy
Resolve remote session id via `workout_sessions.local_session_id`, then **upsert `cardio_logs` by
`(user_id, local_cardio_log_id)`** — idempotent, no duplicates, no unique-hack. Only the signed-in
user's cardio rows are written. NO other table is touched (workout_sessions is read-only here).

## 7. Mapping (DATA_MODEL `cardio_logs`)
`toCardioRow` → { user_id, session_id, machine (CardioMachine matches the DB check enum), minutes =
completedMinutes, distance null, level_or_incline null, effort = intensity (free-text column),
calories_est null, source 'manual', logged_at = completedAtISO, local_cardio_log_id }. Optional columns
are null (no fabrication) — asserted.

## 8. PULL deferred (documented)
`cardio_logs` doesn't store the local block's `plannedMinutes`, and cardio lives inside
`WorkoutSessionLocal` (no standalone local cardio store) — so a faithful reconstruction into local state
isn't safe. `CARDIO_PULL_SUPPORTED=false`; push works; pull is a future concern.

## 9. Local history never mutated (req 13, checker) — verified
`cardioSync`/`pushCardio` only READ `progressStore.history` (and read `workout_sessions`). No local
writes; on any error → status set, return. History untouched (req 13); app never blocked (req 14).

## 10. Missing config / signed out (req 15 — verified)
`supabase === null` or no `user` → status `disabled`, returns, no crash. Card disables the button.

## 11. Settings + status + persistence (req 16, 17)
`CardioSyncCard` — "Sync cardio" + status + last-synced + exact copy: "Only completed cardio logs sync
here. Weight, measurements, photos, and recommendations stay on this device for now."
`lastSyncedAtISO` persisted (B-10 pattern; hydration + reset wired).

## 12. Secrets
None committed; `.env` gitignored.

## 13. Tests (executed, pure) + typecheck
19 assertions: syncable (completed+did-cardio only; abandoned/active/skipped/no-minutes excluded),
direction (incl. local-wins), deterministic `localCardioId`, `toCardioRow` mapping + null optionals +
resolved session id, `CARDIO_PULL_SUPPORTED=false`. **All pass.** `tsc --noEmit` clean. Migration sanity:
1 add-column, 0 destructive.

## 14. Verdict
✅ Cardio logs only, from completed sessions; abandoned/active/discarded/skipped excluded; depends safely
on synced sessions (stops with a clear message, never fabricates); local-wins; clean upsert; non-destructive
migration; local history never mutated; safe/disabled when unconfigured or signed out; failures never erase
cardio. Scope strictly respected.
