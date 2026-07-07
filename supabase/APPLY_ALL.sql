-- =============================================================================
-- FirstRep — APPLY_ALL.sql  (convenience: migrations 001..009 + seed, in order)
-- Paste this whole file into the Supabase SQL Editor and Run.
-- Safe to re-run: uses IF NOT EXISTS / ON CONFLICT. Non-destructive.
-- NOTE: if a storage policy already exists from a manual bucket setup, a
--       'policy already exists' error is harmless — the bucket + columns still apply.
-- =============================================================================


-- ####### 001_initial_schema.sql #######

-- =============================================================================
-- FirstRep — 001_initial_schema.sql
-- Database foundation (B-02). SQL FILES ONLY — no live project provisioned yet.
-- Target: Supabase Postgres (assumes the `auth` schema + auth.uid() exist,
--         e.g. when run via `supabase start` / `supabase db reset`).
--
-- Design rules honored:
--   * Body metrics stored canonical: weight in KG, lengths in CM.
--   * Lift LOADS stored in LB (equipment-denominated; PF machines + trainer
--     progressive-overload steps are 5 lb). See docs/SCHEMA_REVIEW.md §Units.
--   * `source` columns on log-style tables for future connectors
--     (manual | wearable | llm | import).
--   * UUID PKs, proper FKs, indexes, and simple per-user RLS.
--   * No nutrition tables. No AI tables beyond trainer_recommendations.
-- =============================================================================

create extension if not exists "pgcrypto";

-- ---------------------------------------------------------------------------
-- Shared helper: keep updated_at fresh on mutable tables.
-- ---------------------------------------------------------------------------
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- ===========================================================================
-- 1. users  (thin app mirror of auth.users)
-- ===========================================================================
create table public.users (
  id          uuid primary key references auth.users (id) on delete cascade,
  email       text,
  created_at  timestamptz not null default now()
);

-- ===========================================================================
-- 2. user_profiles
-- ===========================================================================
create table public.user_profiles (
  id                  uuid primary key default gen_random_uuid(),
  user_id             uuid not null unique references public.users (id) on delete cascade,
  display_name        text,
  goal                text not null default 'weight_loss' check (goal in ('weight_loss')),
  sex                 text check (sex in ('female','male','other','prefer_not')),
  age_range           text,
  height_cm           numeric,                          -- canonical CM
  starting_weight_kg  numeric,                          -- canonical KG
  days_per_week       int check (days_per_week between 1 and 7),
  workout_length_min  int check (workout_length_min in (20,30,45)),
  experience          text check (experience in ('beginner','some')),
  injuries            text[] not null default '{}',
  unit_pref           text not null default 'imperial' check (unit_pref in ('imperial','metric')),
  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now()
);
create trigger trg_user_profiles_updated before update on public.user_profiles
  for each row execute function public.set_updated_at();

-- ===========================================================================
-- 3. onboarding_answers  (raw quiz payload for audit + replanning)
-- ===========================================================================
create table public.onboarding_answers (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references public.users (id) on delete cascade,
  answers     jsonb not null default '{}'::jsonb,
  created_at  timestamptz not null default now()
);

-- ===========================================================================
-- 4. exercises  (shared catalog — public read, admin/seed write)
-- ===========================================================================
create table public.exercises (
  id                 uuid primary key default gen_random_uuid(),
  name               text not null,
  slug               text not null unique,
  muscle_group       text check (muscle_group in
                       ('back','legs','chest','core','full_body','shoulders','glutes','arms','cardio')),
  machine_type       text not null default 'machine' check (machine_type in ('machine','cardio','free')),
  works_plain        text,                              -- "works your back"
  setup_steps        jsonb not null default '[]'::jsonb,  -- ordered string[]
  form_tips          jsonb not null default '[]'::jsonb,  -- string[]
  default_sets       int,
  default_rep_min    int,
  default_rep_max    int,
  default_weight_lb  numeric,                           -- LB (equipment-denominated); null for cardio
  rest_seconds       int,
  beginner_friendly  boolean not null default true,
  image_path         text,                              -- Storage key in `machine-images` (placeholder for now)
  alt_exercise_id    uuid references public.exercises (id) on delete set null,  -- safer alternative (R3)
  created_at         timestamptz not null default now(),
  updated_at         timestamptz not null default now()
);
create trigger trg_exercises_updated before update on public.exercises
  for each row execute function public.set_updated_at();

-- ===========================================================================
-- 5. workout_plans
-- ===========================================================================
create table public.workout_plans (
  id            uuid primary key default gen_random_uuid(),
  user_id       uuid not null references public.users (id) on delete cascade,
  title         text not null default '4-Week Beginner Weight Loss',
  weeks         int not null default 4,
  start_date    date,
  status        text not null default 'active' check (status in ('active','completed','archived')),
  current_week  int not null default 1,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);
create trigger trg_workout_plans_updated before update on public.workout_plans
  for each row execute function public.set_updated_at();

-- ===========================================================================
-- 6. workout_days
-- ===========================================================================
create table public.workout_days (
  id              uuid primary key default gen_random_uuid(),
  plan_id         uuid not null references public.workout_plans (id) on delete cascade,
  week_number     int not null,
  day_number      int not null,
  focus           text not null default 'full_body' check (focus in ('full_body','rest','cardio')),
  duration_min    int,
  habit_goal      text,
  scheduled_date  date,
  created_at      timestamptz not null default now()
);

-- ===========================================================================
-- 7. workout_exercises  (planned prescription per day)
-- ===========================================================================
create table public.workout_exercises (
  id                   uuid primary key default gen_random_uuid(),
  workout_day_id       uuid not null references public.workout_days (id) on delete cascade,
  exercise_id          uuid not null references public.exercises (id) on delete restrict,
  order_index          int not null default 0,
  sets                 int,
  rep_min              int,
  rep_max              int,
  suggested_weight_lb  numeric,                         -- LB; updated over time by trainer logic
  rest_seconds         int,
  created_at           timestamptz not null default now()
);

-- ===========================================================================
-- 8. workout_sessions  (an actually-performed workout)
-- ===========================================================================
create table public.workout_sessions (
  id              uuid primary key default gen_random_uuid(),
  user_id         uuid not null references public.users (id) on delete cascade,
  workout_day_id  uuid references public.workout_days (id) on delete set null,
  started_at      timestamptz not null default now(),
  completed_at    timestamptz,                          -- null = in progress
  status          text not null default 'in_progress' check (status in ('in_progress','completed','abandoned')),
  felt_overall    text check (felt_overall in ('easy','just_right','too_hard')),
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);
create trigger trg_workout_sessions_updated before update on public.workout_sessions
  for each row execute function public.set_updated_at();

-- ===========================================================================
-- 9. exercise_sets  (one logged set)
-- ===========================================================================
create table public.exercise_sets (
  id           uuid primary key default gen_random_uuid(),
  session_id   uuid not null references public.workout_sessions (id) on delete cascade,
  exercise_id  uuid not null references public.exercises (id) on delete restrict,
  set_index    int not null,
  weight_lb    numeric,                                 -- LB (equipment-denominated)
  reps         int,
  effort       text check (effort in ('easy','just_right','too_hard')),
  pain_flag    boolean not null default false,
  source       text not null default 'manual' check (source in ('manual','wearable','llm','import')),
  logged_at    timestamptz not null default now()
);

-- ===========================================================================
-- 10. cardio_logs
-- ===========================================================================
create table public.cardio_logs (
  id                uuid primary key default gen_random_uuid(),
  user_id           uuid not null references public.users (id) on delete cascade,
  session_id        uuid references public.workout_sessions (id) on delete set null,
  machine           text check (machine in ('treadmill','elliptical','bike','stair_climber')),
  minutes           int,
  distance          numeric,
  level_or_incline  text,
  effort            text,
  calories_est      numeric,                            -- connector-ready (wearable later)
  source            text not null default 'manual' check (source in ('manual','wearable','llm','import')),
  logged_at         timestamptz not null default now()
);

-- ===========================================================================
-- 11. body_weight_logs
-- ===========================================================================
create table public.body_weight_logs (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references public.users (id) on delete cascade,
  weight_kg   numeric not null,                         -- canonical KG
  logged_on   date not null default current_date,
  source      text not null default 'manual' check (source in ('manual','wearable','llm','import')),
  created_at  timestamptz not null default now()
);

-- ===========================================================================
-- 12. body_measurement_logs
-- ===========================================================================
create table public.body_measurement_logs (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references public.users (id) on delete cascade,
  waist_cm    numeric,                                  -- canonical CM (all optional)
  hip_cm      numeric,
  chest_cm    numeric,
  arm_cm      numeric,
  thigh_cm    numeric,
  logged_on   date not null default current_date,
  source      text not null default 'manual' check (source in ('manual','wearable','llm','import')),
  created_at  timestamptz not null default now()
);

-- ===========================================================================
-- 13. progress_photos  (private; storage key only, never a public URL)
-- ===========================================================================
create table public.progress_photos (
  id            uuid primary key default gen_random_uuid(),
  user_id       uuid not null references public.users (id) on delete cascade,
  storage_path  text not null,                          -- key in private `progress-photos` bucket
  pose          text check (pose in ('front','side','back')),
  taken_on      date not null default current_date,
  created_at    timestamptz not null default now()
);

-- ===========================================================================
-- 14. trainer_recommendations  (rule engine output; rule_id traces to TRAINER_LOGIC)
-- ===========================================================================
create table public.trainer_recommendations (
  id            uuid primary key default gen_random_uuid(),
  user_id       uuid not null references public.users (id) on delete cascade,
  context_type  text check (context_type in ('set','session','weekly','plan')),
  context_id    uuid,                                   -- points at set/session/checkin (polymorphic)
  rule_id       text not null,                          -- e.g. 'R1', 'R3', 'R7a'
  message       text not null,
  action        jsonb,                                  -- e.g. {"type":"increase_weight","delta_lb":5}
  source        text not null default 'rule_engine' check (source in ('rule_engine','llm')),
  created_at    timestamptz not null default now()
);

-- ===========================================================================
-- 15. weekly_checkins
-- ===========================================================================
create table public.weekly_checkins (
  id                  uuid primary key default gen_random_uuid(),
  user_id             uuid not null references public.users (id) on delete cascade,
  plan_id             uuid references public.workout_plans (id) on delete set null,
  week_number         int,
  weight_kg           numeric,                          -- canonical KG
  energy              int check (energy between 1 and 5),
  soreness            int check (soreness between 1 and 5),
  motivation          int check (motivation between 1 and 5),
  workouts_completed  int not null default 0,
  cardio_minutes      int not null default 0,
  created_at          timestamptz not null default now()
);

-- ===========================================================================
-- Indexes
-- ===========================================================================
create index idx_onboarding_answers_user        on public.onboarding_answers (user_id);
create index idx_exercises_alt                   on public.exercises (alt_exercise_id);
create index idx_workout_plans_user              on public.workout_plans (user_id);
create index idx_workout_days_plan               on public.workout_days (plan_id);
create index idx_workout_exercises_day           on public.workout_exercises (workout_day_id);
create index idx_workout_exercises_exercise      on public.workout_exercises (exercise_id);
create index idx_workout_sessions_user_started   on public.workout_sessions (user_id, started_at);
create index idx_workout_sessions_day            on public.workout_sessions (workout_day_id);
create index idx_exercise_sets_session           on public.exercise_sets (session_id);
create index idx_exercise_sets_exercise          on public.exercise_sets (exercise_id);
create index idx_cardio_logs_user                on public.cardio_logs (user_id);
create index idx_cardio_logs_session             on public.cardio_logs (session_id);
create index idx_body_weight_logs_user_date      on public.body_weight_logs (user_id, logged_on);
create index idx_body_measurement_logs_user_date on public.body_measurement_logs (user_id, logged_on);
create index idx_progress_photos_user            on public.progress_photos (user_id);
create index idx_trainer_recs_user_created       on public.trainer_recommendations (user_id, created_at);
create index idx_weekly_checkins_user            on public.weekly_checkins (user_id);
create index idx_weekly_checkins_plan            on public.weekly_checkins (plan_id);

-- ===========================================================================
-- Row Level Security
-- Pattern: every user-owned table is readable/writable ONLY by its owner.
-- Child tables (no user_id) check ownership via their parent. `exercises` is
-- the single shared catalog: public read, no client writes (service role only).
-- ===========================================================================

-- enable RLS on every table
alter table public.users                  enable row level security;
alter table public.user_profiles          enable row level security;
alter table public.onboarding_answers     enable row level security;
alter table public.exercises              enable row level security;
alter table public.workout_plans          enable row level security;
alter table public.workout_days           enable row level security;
alter table public.workout_exercises      enable row level security;
alter table public.workout_sessions       enable row level security;
alter table public.exercise_sets          enable row level security;
alter table public.cardio_logs            enable row level security;
alter table public.body_weight_logs       enable row level security;
alter table public.body_measurement_logs  enable row level security;
alter table public.progress_photos        enable row level security;
alter table public.trainer_recommendations enable row level security;
alter table public.weekly_checkins        enable row level security;

-- users: a row keyed by the auth uid
create policy users_self on public.users
  for all using (auth.uid() = id) with check (auth.uid() = id);

-- direct user-owned tables (have user_id)
create policy user_profiles_owner on public.user_profiles
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy onboarding_answers_owner on public.onboarding_answers
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy workout_plans_owner on public.workout_plans
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy workout_sessions_owner on public.workout_sessions
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy cardio_logs_owner on public.cardio_logs
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy body_weight_logs_owner on public.body_weight_logs
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy body_measurement_logs_owner on public.body_measurement_logs
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy progress_photos_owner on public.progress_photos
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy trainer_recommendations_owner on public.trainer_recommendations
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy weekly_checkins_owner on public.weekly_checkins
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- shared catalog: anyone authenticated/anon may read; no client writes
create policy exercises_read on public.exercises
  for select using (true);

-- child tables: ownership via parent chain
create policy workout_days_owner on public.workout_days
  for all using (
    exists (select 1 from public.workout_plans p
            where p.id = workout_days.plan_id and p.user_id = auth.uid())
  ) with check (
    exists (select 1 from public.workout_plans p
            where p.id = workout_days.plan_id and p.user_id = auth.uid())
  );

create policy workout_exercises_owner on public.workout_exercises
  for all using (
    exists (select 1 from public.workout_days d
            join public.workout_plans p on p.id = d.plan_id
            where d.id = workout_exercises.workout_day_id and p.user_id = auth.uid())
  ) with check (
    exists (select 1 from public.workout_days d
            join public.workout_plans p on p.id = d.plan_id
            where d.id = workout_exercises.workout_day_id and p.user_id = auth.uid())
  );

create policy exercise_sets_owner on public.exercise_sets
  for all using (
    exists (select 1 from public.workout_sessions s
            where s.id = exercise_sets.session_id and s.user_id = auth.uid())
  ) with check (
    exists (select 1 from public.workout_sessions s
            where s.id = exercise_sets.session_id and s.user_id = auth.uid())
  );

-- =============================================================================
-- End 001_initial_schema.sql
-- =============================================================================

-- ####### 002_plan_progress.sql #######

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

-- ####### 003_workout_sync_ids.sql #######

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

-- ####### 004_cardio_sync_ids.sql #######

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

-- ####### 005_body_weight_sync_ids.sql #######

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

-- ####### 006_body_measurement_sync_ids.sql #######

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

-- ####### 007_weekly_checkin_sync_ids.sql #######

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

-- ####### 008_trainer_recommendation_sync_ids.sql #######

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

-- ####### 009_progress_photo_sync.sql #######

-- =============================================================================
-- FirstRep — 009_progress_photo_sync.sql  (B-27, FINAL sync step)
-- NON-DESTRUCTIVE: adds de-dup + bookkeeping columns to progress_photos and
-- creates a PRIVATE Storage bucket with owner-only object policies. No existing
-- table/data is altered or dropped. `storage_path` already exists in 001.
--
-- Privacy-first: the `progress-photos` bucket is PRIVATE (public=false). Objects
-- are user-scoped under `user_id/yyyy-mm-dd/<local_photo_id>.jpg` and readable
-- ONLY by their owner (via authenticated access / signed URLs). No public URLs.
--
-- Scope: progress_photos + the private bucket ONLY. Nothing else is touched.
-- =============================================================================

-- ---- metadata columns -----------------------------------------------------
alter table public.progress_photos add column if not exists local_photo_id text;
alter table public.progress_photos add column if not exists storage_bucket text default 'progress-photos';
alter table public.progress_photos add column if not exists uploaded_at timestamptz;

create unique index if not exists uq_progress_photos_user_local
  on public.progress_photos (user_id, local_photo_id)
  where local_photo_id is not null;

-- ---- private storage bucket ------------------------------------------------
insert into storage.buckets (id, name, public)
values ('progress-photos', 'progress-photos', false)
on conflict (id) do nothing;

-- ---- storage object policies: owner-only (path = user_id/...) --------------
-- The first path segment is the user's uid, so only the owner can touch objects.
create policy "progress_photos_select_own"
  on storage.objects for select to authenticated
  using (bucket_id = 'progress-photos' and (storage.foldername(name))[1] = auth.uid()::text);

create policy "progress_photos_insert_own"
  on storage.objects for insert to authenticated
  with check (bucket_id = 'progress-photos' and (storage.foldername(name))[1] = auth.uid()::text);

create policy "progress_photos_update_own"
  on storage.objects for update to authenticated
  using (bucket_id = 'progress-photos' and (storage.foldername(name))[1] = auth.uid()::text)
  with check (bucket_id = 'progress-photos' and (storage.foldername(name))[1] = auth.uid()::text);

create policy "progress_photos_delete_own"
  on storage.objects for delete to authenticated
  using (bucket_id = 'progress-photos' and (storage.foldername(name))[1] = auth.uid()::text);

-- =============================================================================
-- End 009_progress_photo_sync.sql
-- =============================================================================

-- ####### seed.sql (12 beginner machines) #######

-- =============================================================================
-- FirstRep — seed.sql
-- Beginner Planet Fitness-style machine catalog. Image keys are PLACEHOLDERS
-- (decision D8): the `machine-images/...` paths do not exist yet — the app
-- resolver renders a placeholder until real art is dropped in. Re-runnable via
-- ON CONFLICT (slug) upsert.
-- =============================================================================

insert into public.exercises
  (name, slug, muscle_group, machine_type, works_plain,
   setup_steps, form_tips,
   default_sets, default_rep_min, default_rep_max, default_weight_lb, rest_seconds,
   beginner_friendly, image_path)
values
  ('Chest Press Machine', 'chest-press', 'chest', 'machine',
   'Works your chest, shoulders, and arms',
   '["Sit with your back flat against the pad.","Set the seat so the handles line up with your chest.","Grab the handles and push forward until arms are almost straight.","Slowly bring the handles back."]'::jsonb,
   '["Keep your back against the pad the whole time.","Don''t lock your elbows.","Breathe out as you push."]'::jsonb,
   3, 10, 12, 30, 60, true, 'machine-images/chest-press.png'),

  ('Lat Pulldown', 'lat-pulldown', 'back', 'machine',
   'Works your back and arms',
   '["Sit down and tuck your knees under the pad.","Grab the wide bar with both hands.","Pull the bar down to your upper chest.","Slowly let it rise back up."]'::jsonb,
   '["Lead with your elbows, not your hands.","Squeeze your shoulder blades together.","Avoid leaning too far back."]'::jsonb,
   3, 10, 12, 30, 60, true, 'machine-images/lat-pulldown.png'),

  ('Seated Row', 'seated-row', 'back', 'machine',
   'Works your back and arms',
   '["Sit with your chest against the pad.","Grab the handles with both hands.","Pull the handles toward you, squeezing your back.","Slowly return to the start."]'::jsonb,
   '["Keep your chest on the pad.","Pull your elbows straight back.","Don''t shrug your shoulders up."]'::jsonb,
   3, 10, 12, 30, 60, true, 'machine-images/seated-row.png'),

  ('Shoulder Press Machine', 'shoulder-press', 'shoulders', 'machine',
   'Works your shoulders and arms',
   '["Sit with your back flat against the pad.","Set the seat so handles start near your shoulders.","Press the handles straight up.","Lower them back down slowly."]'::jsonb,
   '["Keep your core tight.","Don''t arch your lower back.","Stop just before locking your elbows."]'::jsonb,
   3, 10, 12, 20, 60, true, 'machine-images/shoulder-press.png'),

  ('Leg Press', 'leg-press', 'legs', 'machine',
   'Works your thighs and glutes',
   '["Sit back into the seat.","Place your feet flat, shoulder-width on the platform.","Push the platform away until legs are almost straight.","Slowly bend your knees to return."]'::jsonb,
   '["Don''t lock your knees at the top.","Keep your knees in line with your toes.","Push through your heels."]'::jsonb,
   3, 10, 12, 90, 75, true, 'machine-images/leg-press.png'),

  ('Leg Extension', 'leg-extension', 'legs', 'machine',
   'Works the front of your thighs',
   '["Sit back with knees bent over the seat edge.","Set the pad to rest on your lower shins.","Straighten your legs to lift the pad.","Slowly lower back down."]'::jsonb,
   '["Move slowly and with control.","Squeeze your thighs at the top.","Don''t swing the weight."]'::jsonb,
   3, 10, 12, 30, 60, true, 'machine-images/leg-extension.png'),

  ('Seated Leg Curl', 'seated-leg-curl', 'legs', 'machine',
   'Works the back of your thighs',
   '["Sit with the pad resting on top of your lower legs.","Adjust the thigh pad so it holds you in place.","Bend your knees to pull the pad down.","Slowly return to the start."]'::jsonb,
   '["Keep your back against the seat.","Control the weight on the way back.","Don''t rush the reps."]'::jsonb,
   3, 10, 12, 30, 60, true, 'machine-images/seated-leg-curl.png'),

  ('Hip Abductor', 'hip-abductor', 'glutes', 'machine',
   'Works your outer hips and glutes',
   '["Sit with your back against the pad.","Place your outer thighs against the pads.","Push your knees outward as far as comfortable.","Slowly bring them back together."]'::jsonb,
   '["Move in a slow, controlled way.","Keep your back against the seat.","Don''t use momentum."]'::jsonb,
   3, 12, 15, 50, 45, true, 'machine-images/hip-abductor.png'),

  ('Hip Adductor', 'hip-adductor', 'legs', 'machine',
   'Works your inner thighs',
   '["Sit with your back against the pad.","Place your inner thighs against the pads, knees apart.","Squeeze your knees together.","Slowly let them open back out."]'::jsonb,
   '["Control the weight in both directions.","Keep your back against the seat.","Don''t let the pads slam open."]'::jsonb,
   3, 12, 15, 50, 45, true, 'machine-images/hip-adductor.png'),

  ('Treadmill Incline Walk', 'treadmill-incline-walk', 'cardio', 'cardio',
   'Cardio — burns extra calories',
   '["Step on and clip the safety key to your shirt.","Start at a slow walk (about 2.5 mph).","Set the incline to 3-5%.","Walk at a pace where you can still talk."]'::jsonb,
   '["Don''t hold the handrails the whole time.","Stand tall, look ahead.","Start slow and build up your minutes."]'::jsonb,
   null, null, null, null, 0, true, 'machine-images/treadmill-incline-walk.png'),

  ('Elliptical', 'elliptical', 'cardio', 'cardio',
   'Cardio — easy on the joints',
   '["Step onto the pedals and hold the moving handles.","Start pedaling at a steady, easy pace.","Set resistance to a low level to begin.","Keep a rhythm you can sustain."]'::jsonb,
   '["Keep your posture upright.","Push and pull with both arms and legs.","Aim for a talk-friendly pace."]'::jsonb,
   null, null, null, null, 0, true, 'machine-images/elliptical.png'),

  ('Stair Climber', 'stair-climber', 'cardio', 'cardio',
   'Cardio — strong calorie burn',
   '["Step on and hold the rails to steady yourself.","Start at the lowest speed.","Take full, steady steps.","Increase speed only when it feels easy."]'::jsonb,
   '["Don''t lean heavily on the rails.","Keep your steps full, not tiny.","Start with short sessions and build up."]'::jsonb,
   null, null, null, null, 0, true, 'machine-images/stair-climber.png')

on conflict (slug) do update set
  name              = excluded.name,
  muscle_group      = excluded.muscle_group,
  machine_type      = excluded.machine_type,
  works_plain       = excluded.works_plain,
  setup_steps       = excluded.setup_steps,
  form_tips         = excluded.form_tips,
  default_sets      = excluded.default_sets,
  default_rep_min   = excluded.default_rep_min,
  default_rep_max   = excluded.default_rep_max,
  default_weight_lb = excluded.default_weight_lb,
  rest_seconds      = excluded.rest_seconds,
  beginner_friendly = excluded.beginner_friendly,
  image_path        = excluded.image_path;

-- Safer-alternative links (TRAINER_LOGIC R3). Resolved by slug after insert.
update public.exercises e set alt_exercise_id = alt.id
from public.exercises alt
where (e.slug, alt.slug) in (
  ('leg-extension',   'leg-press'),         -- knee-friendlier swap target / partner
  ('leg-press',       'leg-extension'),
  ('lat-pulldown',    'seated-row'),
  ('seated-row',      'lat-pulldown'),
  ('chest-press',     'shoulder-press'),
  ('shoulder-press',  'chest-press'),
  ('seated-leg-curl', 'hip-adductor'),
  ('stair-climber',   'elliptical'),        -- lower-impact cardio alternative
  ('treadmill-incline-walk', 'elliptical')
);
