import type {
  CheckInConfidence,
  CheckInEnergy,
  CheckInSoreness,
  WeeklyCheckInEntry,
} from '../types/database';

/**
 * Weekly check-in logic (B-12) — PURE. Rule-based coaching message + helpers.
 * No plan mutation here (that's a later loop), no AI, no diet advice.
 */

/** Encouraging, non-judgmental message(s) from a check-in (requirement 9). */
export function weeklyCheckInMessages(entry: WeeklyCheckInEntry): string[] {
  const msgs: string[] = [];

  if (entry.workoutsCompleted <= 0) {
    msgs.push('No judgment. Let’s restart with one easy workout this week.');
  } else if (entry.workoutsCompleted <= 2) {
    msgs.push('Nice start. Keep the goal simple this week.');
  } else {
    msgs.push('Great consistency. You are building the habit.');
  }

  if (entry.soreness === 'high') {
    msgs.push('Keep the next workout lighter and focus on control.');
  }
  if (entry.confidence === 'low') {
    msgs.push('Use the Exercise Library before your next workout.');
  }

  return msgs;
}

/** Most recent check-in, or null. */
export function latestCheckIn(checkIns: WeeklyCheckInEntry[]): WeeklyCheckInEntry | null {
  return checkIns.length === 0 ? null : checkIns[checkIns.length - 1];
}

// ---- DB mapping: categorical answers → weekly_checkins 1–5 int scales -----

export function energyScore(e: CheckInEnergy): number {
  return e === 'low' ? 2 : e === 'okay' ? 3 : 5;
}
export function sorenessScore(s: CheckInSoreness): number {
  return s === 'none' ? 1 : s === 'mild' ? 2 : s === 'moderate' ? 3 : 5;
}
export function confidenceScore(c: CheckInConfidence): number {
  return c === 'low' ? 2 : c === 'medium' ? 3 : 5;
}

/** Shape matching the `weekly_checkins` table (minus ids/timestamps). */
export interface WeeklyCheckinRow {
  week_number: number;
  weight_kg: number | null;
  energy: number;
  soreness: number;
  motivation: number; // we use confidence as the motivation proxy
  workouts_completed: number;
  cardio_minutes: number;
}

export function toWeeklyCheckinRow(
  entry: WeeklyCheckInEntry,
  weightKg: number | null = null,
): WeeklyCheckinRow {
  return {
    week_number: entry.weekNumber,
    weight_kg: weightKg,
    energy: energyScore(entry.energy),
    soreness: sorenessScore(entry.soreness),
    motivation: confidenceScore(entry.confidence),
    workouts_completed: entry.workoutsCompleted,
    cardio_minutes: 0,
  };
}

// ---- display labels -------------------------------------------------------

export const ENERGY_LABEL: Record<CheckInEnergy, string> = {
  low: 'Low',
  okay: 'Okay',
  good: 'Good',
};
export const SORENESS_LABEL: Record<CheckInSoreness, string> = {
  none: 'None',
  mild: 'Mild',
  moderate: 'Moderate',
  high: 'High',
};
export const CONFIDENCE_LABEL: Record<CheckInConfidence, string> = {
  low: 'Low',
  medium: 'Medium',
  high: 'High',
};
