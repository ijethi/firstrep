import type {
  AdaptiveDay,
  AdaptiveExercise,
  PlanDay,
  PlanStrengthExercise,
  TrainerRec,
  WorkoutSessionLocal,
} from '../types/database';

/**
 * Recommendation applicator (B-08) — a PURE view layer. Given a base PlanDay,
 * completed session history, and trainer recommendations, it returns a NEW
 * AdaptiveDay with adjusted weight guidance + safety notes. It NEVER mutates the
 * base plan (the plan generator / planStore are untouched).
 *
 * Pain has the highest priority: a `pain_safety` recommendation never increases
 * weight and always surfaces a safety warning. Maps to
 * workout_exercises.suggested_weight_lb when persisted later.
 */

const WEIGHT_STEP_LB = 5;
const SAFE_MIN_WEIGHT_LB = 10; // never suggest below this for a beginner

export interface ApplicatorOptions {
  safeMinLb?: number;
}

/** Most recent logged weight for an exercise across history (null if none). */
function lastLoggedWeight(history: WorkoutSessionLocal[], exerciseId: string): number | null {
  for (let i = history.length - 1; i >= 0; i -= 1) {
    const ex = history[i].exercises.find((e) => e.exerciseId === exerciseId);
    if (ex) {
      const weights = ex.sets.map((s) => s.weightLb).filter((w): w is number => w != null);
      if (weights.length > 0) return weights[weights.length - 1];
    }
  }
  return null;
}

/** The recommendation that applies to this exercise (recs are pain-first sorted). */
function recForExercise(recs: TrainerRec[], exerciseId: string): TrainerRec | null {
  return recs.find((r) => r.exerciseId === exerciseId) ?? null;
}

function adaptExercise(
  ex: PlanStrengthExercise,
  history: WorkoutSessionLocal[],
  recs: TrainerRec[],
  safeMin: number,
): AdaptiveExercise {
  const baseline: AdaptiveExercise = {
    ...ex,
    adaptiveWeightLb: null,
    whyExplanation: null,
    safetyWarning: null,
    adapted: false,
    recommendationType: null,
  };

  const rec = recForExercise(recs, ex.exerciseId);
  if (!rec) return baseline;

  const last = lastLoggedWeight(history, ex.exerciseId);

  switch (rec.type) {
    case 'increase_weight':
      if (last == null) return baseline; // no number to add to → keep base guidance
      return {
        ...baseline,
        adapted: true,
        recommendationType: 'increase_weight',
        adaptiveWeightLb: last + WEIGHT_STEP_LB,
        startingWeightGuidance: `Try about ${last + WEIGHT_STEP_LB} lb today — up ${WEIGHT_STEP_LB} lb from last time.`,
        whyExplanation: `Last time this felt comfortable. Try ${WEIGHT_STEP_LB} lb more today.`,
      };

    case 'repeat_weight':
      return {
        ...baseline,
        adapted: true,
        recommendationType: 'repeat_weight',
        adaptiveWeightLb: last,
        startingWeightGuidance:
          last != null ? `Stick with about ${last} lb today.` : ex.startingWeightGuidance,
        whyExplanation: 'Last time this felt hard. Keep the same weight and focus on control.',
      };

    case 'reduce_weight': {
      const reduced = last != null ? Math.max(safeMin, last - WEIGHT_STEP_LB) : null;
      return {
        ...baseline,
        adapted: true,
        recommendationType: 'reduce_weight',
        adaptiveWeightLb: reduced,
        startingWeightGuidance:
          reduced != null
            ? `Try about ${reduced} lb today — a little lighter so your form stays smooth.`
            : ex.startingWeightGuidance,
        whyExplanation: 'Last time this felt tough. We lowered it slightly so you can move well.',
      };
    }

    case 'pain_safety':
      return {
        ...baseline,
        adapted: true,
        recommendationType: 'pain_safety',
        adaptiveWeightLb: last, // NEVER increase after pain
        startingWeightGuidance:
          last != null
            ? `If you try it, go light (around ${last} lb) and stop if it hurts.`
            : 'Go light today, and stop if anything hurts.',
        safetyWarning: "You reported pain last time. Skip this exercise if it doesn't feel right today.",
      };

    case 'skip_repeat':
      return {
        ...baseline,
        adapted: true,
        recommendationType: 'skip_repeat',
        adaptiveWeightLb: last,
        startingWeightGuidance: `Start light${last != null ? ` (around ${last} lb)` : ''} — just to practice the movement.`,
        whyExplanation: "You skipped this last time — no problem at all. Start light and get a feel for it.",
      };

    default:
      return baseline; // cardio_progress / consistency don't apply to a strength exercise
  }
}

/** PURE: base day + history + recs → a new AdaptiveDay (base plan untouched). */
export function applyRecommendations(
  day: PlanDay | null,
  history: WorkoutSessionLocal[],
  recs: TrainerRec[],
  options: ApplicatorOptions = {},
): AdaptiveDay | null {
  if (!day) return null;
  const safeMin = options.safeMinLb ?? SAFE_MIN_WEIGHT_LB;
  return {
    ...day,
    strength: day.strength.map((ex) => adaptExercise(ex, history, recs, safeMin)),
  };
}
