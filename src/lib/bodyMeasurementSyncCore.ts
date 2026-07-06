import type { BodyMeasurementEntry } from '../types/database';

/**
 * Body measurement sync core (B-24) — PURE mapping + policy helpers (node-testable).
 * Syncs ONLY body_measurement_logs. Conflict policy: LOCAL WINS. Measurements are
 * stored CANONICALLY in cm (both local and DB) — NO unit conversion here (unit
 * preference is display-only).
 */

export type MeasurementSyncDirection = 'push' | 'pull' | 'noop';

export function hasSyncableMeasurements(entries: BodyMeasurementEntry[]): boolean {
  return entries.length > 0;
}

/** Deterministic local id from the entry's timestamp + its index (append-only list). */
export function localMeasurementId(entry: BodyMeasurementEntry, index: number): string {
  return `measure:${entry.loggedOnISO}:${index}`;
}

/** Local-wins: local measurements present → push (even if remote exists); else pull; else noop. */
export function decideMeasurementSyncDirection(
  localHas: boolean,
  remoteHas: boolean,
): MeasurementSyncDirection {
  if (localHas) return 'push';
  if (remoteHas) return 'pull';
  return 'noop';
}

export interface MeasurementRow {
  user_id: string;
  waist_cm: number | null; // canonical cm — no conversion
  chest_cm: number | null;
  hip_cm: number | null;
  arm_cm: number | null; // not captured locally → null
  thigh_cm: number | null; // not captured locally → null
  note: string | null;
  logged_on: string; // DATE column → date portion of loggedOnISO
  source: 'manual';
  local_measurement_log_id: string;
}

export function toMeasurementRow(
  entry: BodyMeasurementEntry,
  index: number,
  userId: string,
): MeasurementRow {
  return {
    user_id: userId,
    waist_cm: entry.waistCm,
    chest_cm: entry.chestCm,
    hip_cm: entry.hipCm,
    arm_cm: null,
    thigh_cm: null,
    note: entry.note,
    logged_on: entry.loggedOnISO.slice(0, 10), // YYYY-MM-DD
    source: 'manual',
    local_measurement_log_id: localMeasurementId(entry, index),
  };
}

export function toMeasurementRows(entries: BodyMeasurementEntry[], userId: string): MeasurementRow[] {
  return entries.map((e, i) => toMeasurementRow(e, i, userId));
}

const numOrNull = (v: unknown): number | null => {
  if (v == null) return null;
  const n = typeof v === 'number' ? v : Number(v);
  return Number.isFinite(n) ? n : null;
};

/**
 * PULL is SAFE for measurements (cm numbers + date + note). Reconstructs a
 * BodyMeasurementEntry from a row; `logged_on` (date-only) → midnight UTC.
 * A row with no measurement value at all is dropped (returns null).
 */
export function measurementFromRow(
  row: Record<string, unknown> | null | undefined,
): BodyMeasurementEntry | null {
  const r = row ?? {};
  const waistCm = numOrNull(r.waist_cm);
  const chestCm = numOrNull(r.chest_cm);
  const hipCm = numOrNull(r.hip_cm);
  if (waistCm == null && chestCm == null && hipCm == null) return null; // nothing usable
  const day =
    typeof r.logged_on === 'string' && r.logged_on.length >= 10 ? r.logged_on.slice(0, 10) : null;
  if (!day) return null;
  return {
    waistCm,
    chestCm,
    hipCm,
    note: typeof r.note === 'string' && r.note.length > 0 ? r.note : null,
    loggedOnISO: `${day}T00:00:00.000Z`,
    source: 'manual',
  };
}

export function measurementsFromRows(rows: unknown[] | null | undefined): BodyMeasurementEntry[] {
  if (!Array.isArray(rows)) return [];
  return rows
    .map((row) => measurementFromRow(row as Record<string, unknown>))
    .filter((e): e is BodyMeasurementEntry => e != null);
}

export const MEASUREMENT_PULL_SUPPORTED = true;
