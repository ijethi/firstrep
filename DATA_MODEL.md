# DATA_MODEL.md — Database schema (Supabase / Postgres)

> 15 tables. Designed for RLS (row-level security) per user, and connector-ready.
> `id` = uuid default gen_random_uuid(). Timestamps = timestamptz default now().
> Last updated: 2026-06-28

---

## Entity relationship overview
```
users (1)─(1) user_profiles
users (1)─(n) onboarding_answers
users (1)─(n) workout_plans (1)─(n) workout_days (1)─(n) workout_exercises ──► exercises
users (1)─(n) workout_sessions (1)─(n) exercise_sets ──► exercises
workout_sessions (1)─(n) cardio_logs
users (1)─(n) body_weight_logs
users (1)─(n) body_measurement_logs
users (1)─(n) progress_photos
users (1)─(n) trainer_recommendations  (polymorphic context)
users (1)─(n) weekly_checkins
exercises (self-ref) alt_exercise_id ──► exercises   (safer alternative)
```

---

## Tables

### 1. users
Mirrors Supabase `auth.users`. We keep a thin app-level row.
| col | type | notes |
|-----|------|-------|
| id | uuid PK | = auth.users.id |
| email | text | |
| created_at | timestamptz | |
- RLS: user can read/update only `id = auth.uid()`.

### 2. user_profiles
| col | type | notes |
|-----|------|-------|
| id | uuid PK | |
| user_id | uuid FK→users | unique |
| display_name | text | |
| goal | text | enum: 'weight_loss' (MVP only) |
| sex | text | enum |
| age_range | text | e.g. '25-34' |
| height_cm | numeric | stored metric, displayed per unit pref |
| starting_weight_kg | numeric | |
| days_per_week | int | 2–4 |
| workout_length_min | int | 20/30/45 |
| experience | text | 'beginner' / 'some' |
| injuries | text[] | e.g. {knee, shoulder} or {} |
| unit_pref | text | 'imperial' default |
| created_at, updated_at | timestamptz | |

### 3. onboarding_answers
Raw quiz responses (audit + replanning).
| col | type | notes |
| id | uuid PK |
| user_id | uuid FK |
| answers | jsonb | full questionnaire payload |
| created_at | timestamptz |

### 4. exercises  (catalog — shared, not per user)
| col | type | notes |
| id | uuid PK |
| name | text | "Lat Pulldown" |
| slug | text unique |
| muscle_group | text | 'back','legs','chest','core','full_body' |
| machine_type | text | 'machine','cardio','free' |
| works_plain | text | "works your back" |
| setup_steps | jsonb | ordered string[] |
| form_tips | jsonb | string[] |
| default_sets | int |
| default_rep_min | int |
| default_rep_max | int |
| default_weight_lb | numeric | conservative beginner start |
| rest_seconds | int |
| beginner_friendly | bool |
| image_path | text | Supabase Storage key in `machine-images` |
| alt_exercise_id | uuid FK→exercises null | safer alternative (R3) |
- RLS: public read; writes admin-only (service role / seed).

### 5. workout_plans
| col | type | notes |
| id | uuid PK |
| user_id | uuid FK |
| title | text | "4-Week Beginner Weight Loss" |
| weeks | int | 4 |
| start_date | date |
| status | text | 'active','completed','archived' |
| current_week | int | unlock tracking |
| created_at | timestamptz |

### 6. workout_days
| col | type | notes |
| id | uuid PK |
| plan_id | uuid FK→workout_plans |
| week_number | int |
| day_number | int | within week |
| focus | text | 'full_body','rest','cardio' |
| duration_min | int |
| habit_goal | text | "Drink 6 glasses of water" |
| scheduled_date | date null | optional concrete date |

### 7. workout_exercises  (planned prescription per day)
| col | type | notes |
| id | uuid PK |
| workout_day_id | uuid FK |
| exercise_id | uuid FK→exercises |
| order_index | int |
| sets | int |
| rep_min | int |
| rep_max | int |
| suggested_weight_lb | numeric | seeded from exercise default; updated by trainer logic over time |
| rest_seconds | int |

### 8. workout_sessions  (an actual performed workout)
| col | type | notes |
| id | uuid PK |
| user_id | uuid FK |
| workout_day_id | uuid FK null | which planned day this fulfills |
| started_at | timestamptz |
| completed_at | timestamptz null | null = in progress |
| status | text | 'in_progress','completed','abandoned' |
| felt_overall | text null | post-session 1-tap |

### 9. exercise_sets  (one logged set)
| col | type | notes |
| id | uuid PK |
| session_id | uuid FK→workout_sessions |
| exercise_id | uuid FK→exercises |
| set_index | int |
| weight_lb | numeric |
| reps | int |
| effort | text | 'easy','just_right','too_hard' |
| pain_flag | bool default false |
| logged_at | timestamptz |

### 10. cardio_logs
| col | type | notes |
| id | uuid PK |
| user_id | uuid FK |
| session_id | uuid FK null |
| machine | text | 'treadmill','elliptical','bike' |
| minutes | int |
| distance | numeric null |
| level_or_incline | text null |
| effort | text null |
| calories_est | numeric null | connector-ready (wearable later) |
| logged_at | timestamptz |

### 11. body_weight_logs
| col | type | notes |
| id | uuid PK |
| user_id | uuid FK |
| weight_kg | numeric |
| logged_on | date |
| source | text | 'manual' (MVP), future 'wearable' |

### 12. body_measurement_logs
| col | type | notes |
| id | uuid PK |
| user_id | uuid FK |
| waist_cm, hip_cm, chest_cm, arm_cm, thigh_cm | numeric null | any subset |
| logged_on | date |

### 13. progress_photos
| col | type | notes |
| id | uuid PK |
| user_id | uuid FK |
| storage_path | text | key in private `progress-photos` bucket |
| pose | text null | 'front','side','back' |
| taken_on | date |
- RLS: strict — only owner; bucket private with signed URLs.

### 14. trainer_recommendations
| col | type | notes |
| id | uuid PK |
| user_id | uuid FK |
| context_type | text | 'set','session','weekly','plan' |
| context_id | uuid null | points at set/session/checkin |
| rule_id | text | e.g. 'R1_increase_weight' (traceable to TRAINER_LOGIC) |
| message | text | beginner-friendly text shown |
| action | jsonb null | machine-readable, e.g. {type:'increase_weight', delta_lb:5} |
| source | text | 'rule_engine' (MVP) / future 'llm' |
| created_at | timestamptz |

### 15. weekly_checkins
| col | type | notes |
| id | uuid PK |
| user_id | uuid FK |
| plan_id | uuid FK null |
| week_number | int |
| weight_kg | numeric null |
| energy | int null | 1–5 |
| soreness | int null | 1–5 |
| motivation | int null | 1–5 |
| workouts_completed | int |
| cardio_minutes | int |
| created_at | timestamptz |

---

## Added post-MVP
- **`plan_progress`** (migration `002_plan_progress.sql`, B-20) — one row per user (`unique(user_id)`):
  `completed_day_ids jsonb`, `last_completed_day_id`, `selected_day_id`, `workout_plan_id` FK, timestamps,
  RLS `auth.uid()=user_id`. Non-destructive addition; home for local plan-progress sync (SYNC_PLAN step 3).

## Conventions & notes
- **Units stored canonical:** weight in **kg**, height/measurements in **cm**. Display layer converts per `unit_pref`. (Logging UI is lb-first for PF users; we convert on write.) — keeps math/charts consistent.
- **RLS everywhere:** every user-owned table has policy `user_id = auth.uid()`. `exercises` is the only shared-read table.
- **Indexes:** FK columns; plus `body_weight_logs(user_id, logged_on)`, `exercise_sets(session_id)`, `workout_sessions(user_id, started_at)`.
- **Connector-ready hooks:** `source` columns on logs (manual vs wearable), `calories_est` placeholder, `trainer_recommendations.source` (rule vs llm), `action` jsonb so an LLM can later emit the same structured actions the rule engine does.
- **Soft delete / GDPR:** delete-account cascades user-owned rows; storage objects purged via edge function (deferred).
