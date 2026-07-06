-- =============================================================================
-- FirstRep — 006_body_measurement_sync_ids.sql  (B-24)
-- NON-DESTRUCTIVE: adds a client-id column (de-dup) and a `note` column so the
-- local measurement note can be preserved. No table renamed/dropped; no data
-- altered.
--
-- Local id is deterministic from immutable fields:
--   local_measurement_log_id = `measure:${loggedOnISO}:${index}`
-- (loggedOnISO is a per-entry timestamp; append-only list → stable index).
--
-- Scope: body_measurement_logs ONLY. Nothing else is touched. Values stay
-- canonical CM (waist_cm/chest_cm/hip_cm) — no unit conversion.
-- =============================================================================

alter table public.body_measurement_logs add column if not exists note text;
alter table public.body_measurement_logs add column if not exists local_measurement_log_id text;

-- one remote row per (user, local measurement log) → clean upsert target
create unique index if not exists uq_body_measurement_logs_user_local
  on public.body_measurement_logs (user_id, local_measurement_log_id)
  where local_measurement_log_id is not null;

-- =============================================================================
-- End 006_body_measurement_sync_ids.sql
-- =============================================================================
