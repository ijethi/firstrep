-- =============================================================================
-- FirstRep — 005_body_weight_sync_ids.sql  (B-23)
-- NON-DESTRUCTIVE: adds a client-id column so local body weight logs can be
-- de-duplicated on sync. No table renamed/dropped; no data altered.
--
-- Local id is deterministic from immutable fields:
--   local_weight_log_id = `weight:${loggedOnISO}:${index}`
-- (loggedOnISO is a per-entry timestamp; append-only list → stable index), so
-- re-syncing upserts the same row.
--
-- Scope: body_weight_logs ONLY. Nothing else is touched.
-- =============================================================================

alter table public.body_weight_logs add column if not exists local_weight_log_id text;

-- one remote row per (user, local weight log) → clean upsert target
create unique index if not exists uq_body_weight_logs_user_local
  on public.body_weight_logs (user_id, local_weight_log_id)
  where local_weight_log_id is not null;

-- =============================================================================
-- End 005_body_weight_sync_ids.sql
-- =============================================================================
