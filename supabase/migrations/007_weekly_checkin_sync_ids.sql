-- =============================================================================
-- FirstRep — 007_weekly_checkin_sync_ids.sql  (B-25)
-- NON-DESTRUCTIVE: adds a client-id column (de-dup) and a `payload jsonb` column
-- so the FULL local check-in (confidence, barriers, small goal, generated
-- message) is preserved losslessly. The existing int columns (energy/soreness/
-- motivation) stay as a derived/queryable representation; `payload` is the
-- authoritative source for a safe pull. No table renamed/dropped; no data altered.
--
-- Local id is deterministic:
--   local_weekly_checkin_id = `checkin:${createdAtISO}:${index}`
--
-- Scope: weekly_checkins ONLY. Nothing else is touched.
-- =============================================================================

alter table public.weekly_checkins add column if not exists payload jsonb;
alter table public.weekly_checkins add column if not exists local_weekly_checkin_id text;

-- one remote row per (user, local check-in) → clean upsert target
create unique index if not exists uq_weekly_checkins_user_local
  on public.weekly_checkins (user_id, local_weekly_checkin_id)
  where local_weekly_checkin_id is not null;

-- =============================================================================
-- End 007_weekly_checkin_sync_ids.sql
-- =============================================================================
