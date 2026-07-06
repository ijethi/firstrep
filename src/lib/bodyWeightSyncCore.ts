import type { BodyWeightEntry } from '../types/database';

/**
 * Body weight sync core (B-23) — PURE mapping + policy helpers (node-testable).
 * Syncs ONLY body_weight_logs. Conflict policy: LOCAL WINS. Weight is stored
 * CANONICALLY in kg (both local and DB), so no unit conversion happens here.
 */

export type WeightSyncDirection = 'push' | 'pull' | 'noop';

export function hasSyncableWeights(entries: BodyWeightEntry[]): boolean {
  return entries.length > 0;
}

/** Deterministic local id from the entry's timestamp + its index (append-only list). */
export function localWeightId(entry: BodyWeightEntry, index: number): string {
  return `weight:${entry.loggedOnISO}:${index}`;
}

/** Local-wins: local weights present → push (even if remote exists); else pull; else noop. */
export function decideWeightSyncDirection(
  localHasWeights: boolean,
  remoteHasWeights: boolean,
): WeightSyncDirection {
  if (localHasWeights) return 'push';
  if (remoteHasWeights) return 'pull';
  return 'noop';
}

export interface WeightRow {
  user_id: string;
  weight_kg: number;
  logged_on: string; // DATE column → date portion of loggedOnISO
  source: 'manual';
  local_weight_log_id: string;
}

export function toWeightRow(entry: BodyWeightEntry, index: number, userId: string): WeightRow {
  return {
    user_id: userId,
    weight_kg: entry.weightKg,
    logged_on: entry.loggedOnISO.slice(0, 10), // YYYY-MM-DD
    source: 'manual',
    local_weight_log_id: localWeightId(entry, index),
  };
}

export function toWeightRows(entries: BodyWeightEntry[], userId: string): WeightRow[] {
  return entries.map((e, i) => toWeightRow(e, i, userId));
}

/**
 * PULL is SAFE for weight logs (simple: weight_kg + date). Reconstructs a
 * BodyWeightEntry from a body_weight_logs row. `logged_on` is date-only, so the
 * time-of-day is normalized to midnight UTC — acceptable for a date-based log.
 */
export function weightFromRow(row: Record<string, unknown> | null | undefined): BodyWeightEntry | null {
  const r = row ?? {};
  const kg = typeof r.weight_kg === 'number' ? r.weight_kg : Number(r.weight_kg);
  if (!Number.isFinite(kg)) return null;
  const day = typeof r.logged_on === 'string' && r.logged_on.length >= 10 ? r.logged_on.slice(0, 10) : null;
  if (!day) return null;
  return { weightKg: kg, loggedOnISO: `${day}T00:00:00.000Z`, source: 'manual' };
}

export function weightsFromRows(rows: unknown[] | null | undefined): BodyWeightEntry[] {
  if (!Array.isArray(rows)) return [];
  return rows
    .map((row) => weightFromRow(row as Record<string, unknown>))
    .filter((e): e is BodyWeightEntry => e != null);
}

export const WEIGHT_PULL_SUPPORTED = true;
