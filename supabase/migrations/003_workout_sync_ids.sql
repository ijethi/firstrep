-- =============================================================================
-- FirstRep — 003_workout_sync_ids.sql  (B-21)
-- NON-DESTRUCTIVE: adds client-id columns so local completed sessions/sets can
-- be de-duplicated on sync. No table is renamed or dropped; no column removed.
--
-- Local ids are derived deterministically from immutable fields:
--   local_session_id = session.startedAtISO
--   local_set_id     = `${startedAtISO}#${exerciseId}#${setIndex}`
-- so re-syncing the same completed session upserts the same rows.
--
-- Scope: workout_sessions + exercise_sets ONLY. Nothing else is touched.
-- =============================================================================

alter table public.workout_sessions add column if not exists local_session_id text;

-- one remote row per (user, local session) → clean upsert target
create unique index if not exists uq_workout_sessions_user_local
  on public.workout_sessions (user_id, local_session_id)
  where local_session_id is not null;

alter table public.exercise_sets add column if not exists local_set_id text;

-- sets are (re)written per synced session; index for traceability/lookups
create index if not exists idx_exercise_sets_local on public.exercise_sets (local_set_id);

-- =============================================================================
-- End 003_workout_sync_ids.sql
-- =============================================================================
