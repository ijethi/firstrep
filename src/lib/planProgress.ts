import type { GeneratedPlan, PlanDay } from '../types/database';

/**
 * Plan progression (B-09) — PURE helpers. No I/O, no mutation. The base
 * GeneratedPlan is the single source of truth and is never modified; progress
 * is tracked separately as a set of completed day ids.
 *
 * Day identity is derived (`w{week}-d{day}`) so we don't have to add ids to the
 * generator output. Maps to workout_days (week_number, day_number) later.
 */

export function planDayId(weekNumber: number, dayNumber: number): string {
  return `w${weekNumber}-d${dayNumber}`;
}

export function dayIdOf(day: PlanDay): string {
  return planDayId(day.weekNumber, day.dayNumber);
}

export interface PlanProgress {
  currentDay: PlanDay | null; // next incomplete day (the recommended workout)
  nextDay: PlanDay | null; // next incomplete day after currentDay
  currentWeek: number;
  selectedDay: PlanDay | null; // preview/start target (selection, else currentDay)
  isPreviewingNonCurrent: boolean; // user is previewing a day that isn't the recommended one
  weekDays: PlanDay[]; // days of the week being viewed (sorted by dayNumber)
  isPlanComplete: boolean;
  completedCount: number;
  totalDays: number;
}

const EMPTY: PlanProgress = {
  currentDay: null,
  nextDay: null,
  currentWeek: 1,
  selectedDay: null,
  isPreviewingNonCurrent: false,
  weekDays: [],
  isPlanComplete: false,
  completedCount: 0,
  totalDays: 0,
};

/** Derive everything Today/Summary need from the plan + completed ids + selection. */
export function getPlanProgress(
  plan: GeneratedPlan | null,
  completedDayIds: string[],
  selectedDayId?: string | null,
): PlanProgress {
  if (!plan || plan.days.length === 0) return EMPTY;

  const completed = new Set(completedDayIds);
  const totalDays = plan.days.length;
  const completedCount = plan.days.filter((d) => completed.has(dayIdOf(d))).length;

  const firstIncompleteIdx = plan.days.findIndex((d) => !completed.has(dayIdOf(d)));
  const isPlanComplete = firstIncompleteIdx === -1;
  const currentDay = isPlanComplete ? null : plan.days[firstIncompleteIdx];

  let nextDay: PlanDay | null = null;
  if (!isPlanComplete) {
    for (let i = firstIncompleteIdx + 1; i < plan.days.length; i += 1) {
      if (!completed.has(dayIdOf(plan.days[i]))) {
        nextDay = plan.days[i];
        break;
      }
    }
  }

  // Preview/start target: explicit selection (if valid), else the current day,
  // else (plan complete) the last day so the UI still has something to show.
  let selectedDay: PlanDay | null = null;
  if (selectedDayId) selectedDay = plan.days.find((d) => dayIdOf(d) === selectedDayId) ?? null;
  if (!selectedDay) selectedDay = currentDay ?? plan.days[plan.days.length - 1];

  const weekForView = selectedDay ? selectedDay.weekNumber : currentDay?.weekNumber ?? plan.weeks;
  const weekDays = plan.days
    .filter((d) => d.weekNumber === weekForView)
    .sort((a, b) => a.dayNumber - b.dayNumber);

  const currentWeek = currentDay?.weekNumber ?? plan.weeks;
  const isPreviewingNonCurrent =
    !!currentDay && !!selectedDay && dayIdOf(selectedDay) !== dayIdOf(currentDay);

  return {
    currentDay,
    nextDay,
    currentWeek,
    selectedDay,
    isPreviewingNonCurrent,
    weekDays,
    isPlanComplete,
    completedCount,
    totalDays,
  };
}
