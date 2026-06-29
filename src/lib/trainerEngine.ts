import type {
  ExerciseLog,
  RecommendationPriority,
  TrainerRec,
  WorkoutSessionLocal,
} from '../types/database';

/**
 * Trainer engine (B-06) — a PURE function. No I/O, no Date/random, no UI logic.
 * Same input → same output. Time is injected via `options.nowISO`.
 *
 * Consumes a (completed) WorkoutSessionLocal and returns beginner-friendly
 * recommendations. The session already embeds the planned targets
 * (targetSets / repMin / repMax / cardio.plannedMinutes), so the planned day is
 * not needed separately. Output maps to the `trainer_recommendations` table.
 *
 * Rule priority (highest first): R1 pain (safety) > R4 reduce > R3 repeat /
 * R2 increase / R5 skip > R6 cardio > R7 consistency. Pain ALWAYS overrides
 * progression for that exercise.
 */

export interface TrainerEngineOptions {
  nowISO: string;
  /** Completed sessions BEFORE this one (local history seed for R7). 0 = first. */
  priorCompletedCount?: number;
}

const WEIGHT_STEP_LB = 5;

const PRIORITY_RANK: Record<RecommendationPriority, number> = {
  safety: 0,
  high: 1,
  medium: 2,
  low: 3,
};

function evaluateExercise(ex: ExerciseLog, nowISO: string): TrainerRec | null {
  const base = { exerciseId: ex.exerciseId, generatedAtISO: nowISO, source: 'rule_based' as const };

  // R1 — Pain override (always wins for this exercise).
  if (ex.painReported) {
    return {
      ...base,
      ruleId: 'R1',
      type: 'pain_safety',
      priority: 'safety',
      title: `Go easy on ${ex.name}`,
      message: `You flagged pain on ${ex.name}. Skip it for now — next time we can swap in a gentler option that works the same muscles.`,
      nextAction: 'Use a safer alternative next time',
    };
  }

  // R5 — Skipped (or no sets logged) → repeat with a comfortable setup.
  if (ex.skipped || ex.sets.length === 0) {
    return {
      ...base,
      ruleId: 'R5',
      type: 'skip_repeat',
      priority: 'medium',
      title: `Give ${ex.name} a go next time`,
      message: `You skipped ${ex.name} today — no worries at all. Try it next time with a lighter, comfortable setting to get a feel for it.`,
      nextAction: 'Try it next time, lighter',
    };
  }

  const sets = ex.sets;
  const allSetsDone = sets.length >= ex.targetSets;
  const hitTop = sets.every((s) => s.reps != null && s.reps >= ex.repMax);
  const allEasyOrGood = sets.every((s) => s.effort === 'easy' || s.effort === 'good');
  const hardCount = sets.filter((s) => s.effort === 'hard').length;
  const wellBelowCount = sets.filter((s) => s.reps != null && s.reps < ex.repMin).length;

  // R4 — Reduce weight (struggled): hard across sets, or reps well below target.
  if (hardCount >= 2 || wellBelowCount >= 2) {
    return {
      ...base,
      ruleId: 'R4',
      type: 'reduce_weight',
      priority: 'high',
      title: `Lighten up ${ex.name} a little`,
      message: `${ex.name} felt tough today. Next time, drop about ${WEIGHT_STEP_LB} lb so your form stays smooth — that's how you build strength safely.`,
      nextAction: `Reduce by ${WEIGHT_STEP_LB} lb next time`,
    };
  }

  // R2 — Increase weight: all sets done, hit top reps, felt easy/good, no pain.
  if (allSetsDone && hitTop && allEasyOrGood) {
    return {
      ...base,
      ruleId: 'R2',
      type: 'increase_weight',
      priority: 'medium',
      title: `Level up ${ex.name}`,
      message: `Great work — you finished all your ${ex.name} sets and hit the top reps comfortably. Next time, try adding ${WEIGHT_STEP_LB} lb.`,
      nextAction: `Add ${WEIGHT_STEP_LB} lb next time`,
    };
  }

  // R3 — Repeat same weight (default for "most sets, but not easy/top yet").
  return {
    ...base,
    ruleId: 'R3',
    type: 'repeat_weight',
    priority: 'medium',
    title: `Stick with ${ex.name}`,
    message: `Nice effort on ${ex.name}. Keep the same weight next time — once you nail all your reps and it feels easy, we'll go up.`,
    nextAction: 'Repeat the same weight',
  };
}

function evaluateCardio(session: WorkoutSessionLocal, nowISO: string): TrainerRec | null {
  const cardio = session.cardio;
  if (!cardio) return null;

  const base = {
    exerciseId: null,
    generatedAtISO: nowISO,
    source: 'rule_based' as const,
    ruleId: 'R6',
    type: 'cardio_progress' as const,
    priority: 'low' as const,
  };
  const completed = cardio.completedMinutes ?? 0;
  const planned = cardio.plannedMinutes;

  // Hard → keep the same target (regardless of minutes).
  if (cardio.intensity === 'hard') {
    return {
      ...base,
      title: 'Keep your cardio target',
      message: `You pushed hard on cardio — ${completed} min. Keep the same target next time and let your body adjust.`,
      nextAction: 'Keep the same cardio target',
    };
  }

  // Below planned → repeat the same target.
  if (cardio.skipped || completed < planned) {
    return {
      ...base,
      title: 'Repeat your cardio target',
      message: `You did ${completed} of ${planned} cardio minutes — every minute counts. Aim for the same ${planned} min next time.`,
      nextAction: `Aim for ${planned} min next time`,
    };
  }

  // Met/exceeded at easy or moderate → add a little.
  return {
    ...base,
    title: 'Add a little cardio',
    message: `Nice — ${completed} min of cardio at a comfortable pace. Next time, add 2–5 minutes.`,
    nextAction: 'Add 2–5 minutes next time',
  };
}

function consistencyRec(priorCompleted: number, nowISO: string): TrainerRec {
  const base = {
    exerciseId: null,
    generatedAtISO: nowISO,
    source: 'rule_based' as const,
    ruleId: 'R7',
    type: 'consistency' as const,
    priority: 'low' as const,
  };
  if (priorCompleted <= 0) {
    return {
      ...base,
      title: 'You did it — workout #1! 🎉',
      message: "Congratulations on your first workout! The goal is consistency, not perfection. Just keep showing up and the results will follow.",
      nextAction: 'Come back for your next workout',
    };
  }
  return {
    ...base,
    title: `That's workout #${priorCompleted + 1}!`,
    message: 'You keep showing up — that consistency is exactly what builds results. Keep it going.',
    nextAction: 'Stay consistent this week',
  };
}

/** PURE: completed session → ordered list of beginner-friendly recommendations. */
export function generateRecommendations(
  session: WorkoutSessionLocal | null,
  options: TrainerEngineOptions,
): TrainerRec[] {
  if (!session) return []; // incomplete/missing session never crashes

  const { nowISO } = options;
  const priorCompleted = options.priorCompletedCount ?? 0;

  const recs: TrainerRec[] = [];

  for (const ex of session.exercises) {
    const rec = evaluateExercise(ex, nowISO);
    if (rec) recs.push(rec);
  }

  const cardioRec = evaluateCardio(session, nowISO);
  if (cardioRec) recs.push(cardioRec);

  recs.push(consistencyRec(priorCompleted, nowISO));

  // Stable sort by priority so the pain/safety item is always first.
  return recs
    .map((r, i) => ({ r, i }))
    .sort((a, b) => PRIORITY_RANK[a.r.priority] - PRIORITY_RANK[b.r.priority] || a.i - b.i)
    .map(({ r }) => r);
}
