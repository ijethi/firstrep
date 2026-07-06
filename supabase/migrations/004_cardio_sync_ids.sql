-- =============================================================================
-- FirstRep — 004_cardio_sync_ids.sql  (B-22)
-- NON-DESTRUCTIVE: adds a client-id column so local cardio logs can be
-- de-duplicated on sync. No table is renamed/dropped; no data is altered.
--
-- Local id is deterministic from immutable fields:
--   local_cardio_log_id = `cardio:${local_session_id}:${index}`
-- (one cardio block per local session → index 0), so re-syncing upserts the
-- same row. Cardio rows link to workout_sessions via the already-synced session
-- (resolved through workout_sessions.local_session_id).
--
-- Scope: cardio_logs ONLY. Nothing else is touched.
-- =============================================================================

alter table public.cardio_logs add column if not exists local_cardio_log_id text;

-- one remote row per (user, local cardio log) → clean upsert target
create unique index if not exists uq_cardio_logs_user_local
  on public.cardio_logs (user_id, local_cardio_log_id)
  where local_cardio_log_id is not null;

-- =============================================================================
-- End 004_cardio_sync_ids.sql
-- =============================================================================
