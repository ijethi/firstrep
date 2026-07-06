-- =============================================================================
-- FirstRep — 002_plan_progress.sql  (B-20)
-- NON-DESTRUCTIVE: adds ONE new table for plan progress. No existing table is
-- altered or dropped. Local progress (planProgressStore) has no home in 001, so
-- this gives it a clean one-row-per-user store (upsert on user_id).
--
-- Scope: plan progress ONLY (completed day ids + last/selected day). It does NOT
-- store workout sessions, sets, cardio, weights, measurements, photos, recs, or
-- check-ins — those are separate SYNC_PLAN steps.
-- =============================================================================

create table if not exists public.plan_progress (
  id                 uuid primary key default gen_random_uuid(),
  user_id            uuid not null unique references public.users (id) on delete cascade,
  workout_plan_id    uuid references public.workout_plans (id) on delete set null,
  completed_day_ids  jsonb not null default '[]'::jsonb,   -- e.g. ["w1-d1","w1-d2"]
  last_completed_day_id text,
  selected_day_id       text,
  created_at         timestamptz not null default now(),
  updated_at         timestamptz not null default now()
);

-- one row per user → clean upsert on conflict (user_id)
create index if not exists idx_plan_progress_user on public.plan_progress (user_id);
create index if not exists idx_plan_progress_plan on public.plan_progress (workout_plan_id);

create trigger trg_plan_progress_updated before update on public.plan_progress
  for each row execute function public.set_updated_at();

-- RLS — same per-user owner pattern as 001
alter table public.plan_progress enable row level security;

create policy plan_progress_owner on public.plan_progress
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- =============================================================================
-- End 002_plan_progress.sql
-- =============================================================================
