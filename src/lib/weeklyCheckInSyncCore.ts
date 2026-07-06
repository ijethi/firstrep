import type {
  CheckInBarrier,
  CheckInConfidence,
  CheckInEnergy,
  CheckInSoreness,
  WeeklyCheckInEntry,
} from '../types/database';
import {
  confidenceScore,
  energyScore,
  sorenessScore,
  weeklyCheckInMessages,
} from './weeklyCheckIn';

/**
 * Weekly check-in sync core (B-25) — PURE mapping + policy helpers (node-testable).
 * Syncs ONLY weekly_checkins. Conflict policy: LOCAL WINS.
 *
 * The DB int columns (energy/soreness/motivation) are a derived, queryable
 * representation; the `payload` jsonb is the AUTHORITATIVE full local entry
 * (+ the generated message, which the local entry doesn't store — recreated via
 * the rule helper, allowed since no stored message exists). Pull reads `payload`,
 * so no user values are ever reinterpreted.
 */

export type CheckInSyncDirection = 'push' | 'pull' | 'noop';

export function hasSyncableCheckIns(list: WeeklyCheckInEntry[]): boolean {
  return list.length > 0;
}

/** Deterministic local id from the entry's timestamp + its index (append-only list). */
export function localCheckInId(entry: WeeklyCheckInEntry, index: number): string {
  return `checkin:${entry.createdAtISO}:${index}`;
}

/** Local-wins: local check-ins present → push (even if remote exists); else pull; else noop. */
export function decideCheckInSyncDirection(localHas: boolean, remoteHas: boolean): CheckInSyncDirection {
  if (localHas) return 'push';
  if (remoteHas) return 'pull';
  return 'noop';
}

export interface CheckInPayload {
  weekNumber: number;
  workoutsCompleted: number;
  energy: CheckInEnergy;
  soreness: CheckInSoreness;
  confidence: CheckInConfidence;
  barriers: CheckInBarrier[];
  smallGoal: string;
  createdAtISO: string;
  message: string[]; // generated coaching message (recreated from the rule helper)
}

export interface CheckInRow {
  user_id: string;
  plan_id: null;
  week_number: number;
  weight_kg: null;
  energy: number; // 1..5 derived
  soreness: number; // 1..5 derived
  motivation: number; // 1..5 derived from confidence
  workouts_completed: number;
  cardio_minutes: number;
  payload: CheckInPayload; // authoritative full entry
  local_weekly_checkin_id: string;
}

export function toCheckInRow(entry: WeeklyCheckInEntry, index: number, userId: string): CheckInRow {
  return {
    user_id: userId,
    plan_id: null,
    week_number: entry.weekNumber,
    weight_kg: null,
    energy: energyScore(entry.energy),
    soreness: sorenessScore(entry.soreness),
    motivation: confidenceScore(entry.confidence),
    workouts_completed: entry.workoutsCompleted,
    cardio_minutes: 0,
    payload: {
      weekNumber: entry.weekNumber,
      workoutsCompleted: entry.workoutsCompleted,
      energy: entry.energy,
      soreness: entry.soreness,
      confidence: entry.confidence,
      barriers: entry.barriers,
      smallGoal: entry.smallGoal,
      createdAtISO: entry.createdAtISO,
      message: weeklyCheckInMessages(entry),
    },
    local_weekly_checkin_id: localCheckInId(entry, index),
  };
}

export function toCheckInRows(list: WeeklyCheckInEntry[], userId: string): CheckInRow[] {
  return list.map((e, i) => toCheckInRow(e, i, userId));
}

const ENERGY = new Set(['low', 'okay', 'good']);
const SORENESS = new Set(['none', 'mild', 'moderate', 'high']);
const CONFIDENCE = new Set(['low', 'medium', 'high']);

/**
 * PULL is SAFE via `payload` (lossless). Reconstructs a WeeklyCheckInEntry from a
 * row's payload. Defensive: a row without a usable payload is dropped.
 */
export function checkInFromRow(row: Record<string, unknown> | null | undefined): WeeklyCheckInEntry | null {
  const p = (row ?? {}).payload as Record<string, unknown> | undefined;
  if (!p || typeof p !== 'object') return null;
  const energy = p.energy;
  const soreness = p.soreness;
  const confidence = p.confidence;
  if (
    typeof energy !== 'string' || !ENERGY.has(energy) ||
    typeof soreness !== 'string' || !SORENESS.has(soreness) ||
    typeof confidence !== 'string' || !CONFIDENCE.has(confidence)
  ) {
    return null; // not safely reconstructable
  }
  if (typeof p.createdAtISO !== 'string' || p.createdAtISO.length === 0) return null;
  return {
    weekNumber: typeof p.weekNumber === 'number' ? p.weekNumber : 1,
    workoutsCompleted: typeof p.workoutsCompleted === 'number' ? p.workoutsCompleted : 0,
    energy: energy as CheckInEnergy,
    soreness: soreness as CheckInSoreness,
    confidence: confidence as CheckInConfidence,
    barriers: Array.isArray(p.barriers) ? (p.barriers as CheckInBarrier[]) : [],
    smallGoal: typeof p.smallGoal === 'string' ? p.smallGoal : '',
    createdAtISO: p.createdAtISO,
  };
}

export function checkInsFromRows(rows: unknown[] | null | undefined): WeeklyCheckInEntry[] {
  if (!Array.isArray(rows)) return [];
  return rows
    .map((row) => checkInFromRow(row as Record<string, unknown>))
    .filter((e): e is WeeklyCheckInEntry => e != null);
}

export const CHECKIN_PULL_SUPPORTED = true;
