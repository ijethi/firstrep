/**
 * App-facing database types for FirstRep (B-02).
 *
 * These are hand-written, practical types the app code consumes — NOT the full
 * generated Supabase `Database` type (that gets generated later once a real
 * project exists, via `supabase gen types`). They mirror 001_initial_schema.sql.
 *
 * Unit convention (see docs/SCHEMA_REVIEW.md §Units):
 *   - `*_kg` / `*_cm`  → canonical body metrics.
 *   - `*_lb`           → lift loads, stored in lb (equipment-denominated).
 */

// ---- shared unions -------------------------------------------------------

export type UUID = string;
/** ISO date string, e.g. '2026-06-28'. */
export type DateString = string;
/** ISO timestamp string. */
export type Timestamp = string;

export type DataSource = 'manual' | 'wearable' | 'llm' | 'import';
export type MuscleGroup =
  | 'back'
  | 'legs'
  | 'chest'
  | 'core'
  | 'full_body'
  | 'shoulders'
  | 'glutes'
  | 'arms'
  | 'cardio';
export type MachineType = 'machine' | 'cardio' | 'free';
export type Effort = 'easy' | 'just_right' | 'too_hard';
export type PlanStatus = 'active' | 'completed' | 'archived';
export type DayFocus = 'full_body' | 'rest' | 'cardio';
export type SessionStatus = 'in_progress' | 'completed' | 'abandoned';
export type CardioMachine = 'treadmill' | 'elliptical' | 'bike' | 'stair_climber';
export type RecommendationContext = 'set' | 'session' | 'weekly' | 'plan';
export type RecommendationSource = 'rule_engine' | 'llm';

/** Structured trainer action (mirrors TRAINER_LOGIC `TrainerAction`). */
export interface TrainerAction {
  type:
    | 'increase_weight'
    | 'keep_weight'
    | 'reduce_weight'
    | 'swap_exercise'
    | 'rest'
    | 'restart_easier'
    | 'review_nutrition'
    | 'congratulate_unlock';
  delta_lb?: number;
  altExerciseId?: UUID;
  recommendRepeatWeek?: boolean;
}

// ---- entities ------------------------------------------------------------

export interface Exercise {
  id: UUID;
  name: string;
  slug: string;
  muscle_group: MuscleGroup | null;
  machine_type: MachineType;
  works_plain: string | null;
  setup_steps: string[];
  form_tips: string[];
  default_sets: number | null;
  default_rep_min: number | null;
  default_rep_max: number | null;
  default_weight_lb: number | null;
  rest_seconds: number | null;
  beginner_friendly: boolean;
  image_path: string | null;
  alt_exercise_id: UUID | null;
  created_at: Timestamp;
  updated_at: Timestamp;
}

export interface WorkoutPlan {
  id: UUID;
  user_id: UUID;
  title: string;
  weeks: number;
  start_date: DateString | null;
  status: PlanStatus;
  current_week: number;
  created_at: Timestamp;
  updated_at: Timestamp;
}

export interface WorkoutDay {
  id: UUID;
  plan_id: UUID;
  week_number: number;
  day_number: number;
  focus: DayFocus;
  duration_min: number | null;
  habit_goal: string | null;
  scheduled_date: DateString | null;
  created_at: Timestamp;
}

export interface WorkoutExercise {
  id: UUID;
  workout_day_id: UUID;
  exercise_id: UUID;
  order_index: number;
  sets: number | null;
  rep_min: number | null;
  rep_max: number | null;
  suggested_weight_lb: number | null;
  rest_seconds: number | null;
  created_at: Timestamp;
}

export interface WorkoutSession {
  id: UUID;
  user_id: UUID;
  workout_day_id: UUID | null;
  started_at: Timestamp;
  completed_at: Timestamp | null;
  status: SessionStatus;
  felt_overall: Effort | null;
  created_at: Timestamp;
  updated_at: Timestamp;
}

export interface ExerciseSet {
  id: UUID;
  session_id: UUID;
  exercise_id: UUID;
  set_index: number;
  weight_lb: number | null;
  reps: number | null;
  effort: Effort | null;
  pain_flag: boolean;
  source: DataSource;
  logged_at: Timestamp;
}

export interface CardioLog {
  id: UUID;
  user_id: UUID;
  session_id: UUID | null;
  machine: CardioMachine | null;
  minutes: number | null;
  distance: number | null;
  level_or_incline: string | null;
  effort: string | null;
  calories_est: number | null;
  source: DataSource;
  logged_at: Timestamp;
}

export interface BodyWeightLog {
  id: UUID;
  user_id: UUID;
  weight_kg: number;
  logged_on: DateString;
  source: DataSource;
  created_at: Timestamp;
}

export interface TrainerRecommendation {
  id: UUID;
  user_id: UUID;
  context_type: RecommendationContext | null;
  context_id: UUID | null;
  rule_id: string;
  message: string;
  action: TrainerAction | null;
  source: RecommendationSource;
  created_at: Timestamp;
}

export interface WeeklyCheckin {
  id: UUID;
  user_id: UUID;
  plan_id: UUID | null;
  week_number: number | null;
  weight_kg: number | null;
  energy: number | null;
  soreness: number | null;
  motivation: number | null;
  workouts_completed: number;
  cardio_minutes: number;
  created_at: Timestamp;
}
