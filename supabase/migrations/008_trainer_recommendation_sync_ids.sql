-- =============================================================================
-- FirstRep — 008_trainer_recommendation_sync_ids.sql  (B-26)
-- NON-DESTRUCTIVE: adds a client-id column (de-dup) and a `payload jsonb` column
-- so the FULL local recommendation (type, title, next_action, priority,
-- generated_at, exercise slug, source='rule_based') is preserved losslessly.
-- The existing columns (rule_id, message, action, source) stay as a derived/
-- queryable representation; `payload` is authoritative for a safe pull.
--
-- Note: local `source='rule_based'` maps to the DB `source` enum value
-- 'rule_engine' (the enum has no 'rule_based'); the original string lives in
-- `payload.source`. Local `exerciseId` is a slug (not a uuid), so it stays in
-- `payload` rather than `context_id` (uuid).
--
-- Local id is deterministic:
--   local_recommendation_id = `rec:${generatedAtISO}:${ruleId}:${exerciseId|none}:${index}`
--
-- Scope: trainer_recommendations ONLY. Nothing else is touched.
-- =============================================================================

alter table public.trainer_recommendations add column if not exists payload jsonb;
alter table public.trainer_recommendations add column if not exists local_recommendation_id text;

-- one remote row per (user, local recommendation) → clean upsert target
create unique index if not exists uq_trainer_recommendations_user_local
  on public.trainer_recommendations (user_id, local_recommendation_id)
  where local_recommendation_id is not null;

-- =============================================================================
-- End 008_trainer_recommendation_sync_ids.sql
-- =============================================================================
