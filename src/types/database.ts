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

// ---- composed plan view types (local, B-04) ------------------------------
// These are the nested shapes the plan generator returns and the UI renders.
// They are NOT table rows — they map onto workout_plans / workout_days /
// workout_exercises when a plan is persisted later (see planGenerator.ts).

export interface PlanStrengthExercise {
  exerciseId: string; // local slug-based id (maps to exercises.id later)
  slug: string;
  name: string;
  imageKey: string | null; // machine image key (placeholder for now)
  sets: number;
  repMin: number;
  repMax: number;
  startingWeightGuidance: string; // beginner-friendly text, not a number
  restSeconds: number;
  setupNote: string;
  formTip: string;
}

export interface PlanCardioBlock {
  machine: CardioMachine;
  minutes: number;
  intensityGuidance: string;
  beginnerNote: string;
}

export interface PlanDay {
  weekNumber: number;
  dayNumber: number;
  name: string; // "Full Body A", "Cardio + Core", ...
  focus: DayFocus; // maps to workout_days.focus (full_body | cardio | rest)
  estimatedMinutes: number;
  strength: PlanStrengthExercise[];
  cardio: PlanCardioBlock | null;
  beginnerNote: string; // always includes "Stop if you feel sharp pain."
}

export interface GeneratedPlan {
  title: string;
  weeks: number;
  daysPerWeek: number;
  days: PlanDay[]; // length = weeks * daysPerWeek
}

// ---- live workout session types (local, B-05) ----------------------------
// What the guided session captures. Maps to workout_sessions / exercise_sets /
// cardio_logs (+ feeds trainer_recommendations in B-06). UI uses friendly
// effort labels; `setEffortToDbEffort()` maps them to the DB `Effort` enum.

export type SetEffort = 'easy' | 'good' | 'hard';
export type CardioIntensity = 'easy' | 'moderate' | 'hard';

export interface LoggedSet {
  setIndex: number; // 1-based
  weightLb: number | null;
  reps: number | null;
  effort: SetEffort | null;
  pain: boolean;
}

export interface ExerciseLog {
  exerciseId: string;
  slug: string;
  name: string;
  targetSets: number;
  repMin: number;
  repMax: number;
  restSeconds: number;
  sets: LoggedSet[];
  painReported: boolean;
  skipped: boolean;
}

export interface CardioSessionLog {
  machine: CardioMachine;
  plannedMinutes: number;
  completedMinutes: number | null;
  intensity: CardioIntensity | null;
  skipped: boolean;
}

export type SessionStatusLocal = 'in_progress' | 'completed' | 'abandoned';

export interface WorkoutSessionLocal {
  weekNumber: number;
  dayNumber: number;
  dayName: string;
  startedAtISO: string;
  completedAtISO: string | null;
  status: SessionStatusLocal;
  exercises: ExerciseLog[];
  cardio: CardioSessionLog | null;
}

// ---- trainer recommendation output (local, B-06) -------------------------
// Pure output of the rule engine. Maps to the `trainer_recommendations` table:
//   ruleId→rule_id, type→action.type, exerciseId→context_id, message→message,
//   source 'rule_based'→ DB source 'rule_engine'. priority/title/nextAction are
//   UI-facing and would ride along in `action` jsonb when persisted.

export type RecommendationType =
  | 'increase_weight'
  | 'repeat_weight'
  | 'reduce_weight'
  | 'pain_safety'
  | 'skip_repeat'
  | 'cardio_progress'
  | 'consistency';

export type RecommendationPriority = 'safety' | 'high' | 'medium' | 'low';

export interface TrainerRec {
  ruleId: string; // 'R1'..'R7'
  type: RecommendationType;
  exerciseId: string | null;
  title: string;
  message: string;
  nextAction: string;
  priority: RecommendationPriority;
  generatedAtISO: string;
  source: 'rule_based';
}

// ---- local progress types (B-07) -----------------------------------------
// Body weight stored CANONICALLY in kg (D7); the UI converts at the edge.
// Maps to the `body_weight_logs` table (weight_kg, logged_on, source).

export interface BodyWeightEntry {
  weightKg: number;
  loggedOnISO: string; // ISO timestamp; date portion = logged_on
  source: 'manual';
}

// ---- adaptive plan view types (B-08) -------------------------------------
// A VIEW layer over a PlanDay: the base plan is never mutated. Applies trainer
// recommendations + last-used weights to produce adaptive suggestions for the
// NEXT session. Maps to workout_exercises.suggested_weight_lb when persisted.

export interface AdaptiveExercise extends PlanStrengthExercise {
  adaptiveWeightLb: number | null; // suggested weight for next time (null = no data)
  whyExplanation: string | null; // "Last time this felt comfortable. Try 5 lb more today."
  safetyWarning: string | null; // set for pain_safety
  adapted: boolean; // true if a recommendation changed the base guidance
  recommendationType: RecommendationType | null;
}

export interface AdaptiveDay extends Omit<PlanDay, 'strength'> {
  strength: AdaptiveExercise[];
}

// ---- weekly check-in types (local, B-12) ---------------------------------
// A short coaching reflection. Maps to the `weekly_checkins` table; the
// categorical answers convert to the table's 1–5 int scales via lib/weeklyCheckIn.

export type CheckInEnergy = 'low' | 'okay' | 'good';
export type CheckInSoreness = 'none' | 'mild' | 'moderate' | 'high';
export type CheckInConfidence = 'low' | 'medium' | 'high';
export type CheckInBarrier =
  | 'time'
  | 'soreness'
  | 'motivation'
  | 'gym_anxiety'
  | 'schedule'
  | 'other'
  | 'none';

export interface WeeklyCheckInEntry {
  weekNumber: number;
  workoutsCompleted: number;
  energy: CheckInEnergy;
  soreness: CheckInSoreness;
  confidence: CheckInConfidence;
  barriers: CheckInBarrier[];
  smallGoal: string; // free-text goal for next week (may be empty)
  createdAtISO: string;
}
