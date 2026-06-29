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
