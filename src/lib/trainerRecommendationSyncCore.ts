import type { RecommendationPriority, RecommendationType, TrainerRec } from '../types/database';

/**
 * Trainer recommendation sync core (B-26) — PURE mapping + policy helpers
 * (node-testable). Syncs ONLY trainer_recommendations. Conflict policy: LOCAL
 * WINS. This is a passthrough of already-generated recs — it NEVER regenerates
 * or changes a recommendation's meaning.
 *
 * The existing DB columns (rule_id/message/action/source) are a derived,
 * queryable view; the `payload` jsonb is the AUTHORITATIVE full local rec.
 * Mapping notes: local `source='rule_based'` → DB enum 'rule_engine' (original
 * kept in payload.source); local `exerciseId` is a slug → kept in payload, not
 * the uuid `context_id`.
 */

export type RecSyncDirection = 'push' | 'pull' | 'noop';

export function hasSyncableRecs(list: TrainerRec[]): boolean {
  return list.length > 0;
}

/** Deterministic local id from immutable fields. */
export function localRecId(rec: TrainerRec, index: number): string {
  return `rec:${rec.generatedAtISO}:${rec.ruleId}:${rec.exerciseId ?? 'none'}:${index}`;
}

/** Local-wins: local recs present → push (even if remote exists); else pull; else noop. */
export function decideRecSyncDirection(localHas: boolean, remoteHas: boolean): RecSyncDirection {
  if (localHas) return 'push';
  if (remoteHas) return 'pull';
  return 'noop';
}

export interface RecRow {
  user_id: string;
  context_type: 'set' | 'session' | 'weekly';
  context_id: null; // exerciseId is a slug → kept in payload, not this uuid column
  rule_id: string;
  message: string;
  action: { type: RecommendationType; priority: RecommendationPriority; nextAction: string; exerciseId: string | null };
  source: 'rule_engine'; // DB enum; original 'rule_based' preserved in payload.source
  payload: TrainerRec; // authoritative full rec
  local_recommendation_id: string;
}

function contextTypeFor(rec: TrainerRec): 'set' | 'session' | 'weekly' {
  if (rec.exerciseId) return 'set';
  if (rec.type === 'consistency') return 'weekly';
  return 'session';
}

export function toRecRow(rec: TrainerRec, index: number, userId: string): RecRow {
  return {
    user_id: userId,
    context_type: contextTypeFor(rec),
    context_id: null,
    rule_id: rec.ruleId,
    message: rec.message,
    action: {
      type: rec.type,
      priority: rec.priority,
      nextAction: rec.nextAction,
      exerciseId: rec.exerciseId ?? null,
    },
    source: 'rule_engine',
    payload: { ...rec },
    local_recommendation_id: localRecId(rec, index),
  };
}

export function toRecRows(list: TrainerRec[], userId: string): RecRow[] {
  return list.map((r, i) => toRecRow(r, i, userId));
}

const TYPES = new Set<RecommendationType>([
  'increase_weight',
  'repeat_weight',
  'reduce_weight',
  'pain_safety',
  'skip_repeat',
  'cardio_progress',
  'consistency',
]);
const PRIORITIES = new Set<RecommendationPriority>(['safety', 'high', 'medium', 'low']);

/**
 * PULL is SAFE via `payload` (lossless). Reconstructs a TrainerRec from a row's
 * payload; a row without a usable payload is dropped.
 */
export function recFromRow(row: Record<string, unknown> | null | undefined): TrainerRec | null {
  const p = (row ?? {}).payload as Record<string, unknown> | undefined;
  if (!p || typeof p !== 'object') return null;
  const type = p.type as RecommendationType;
  const priority = p.priority as RecommendationPriority;
  if (
    typeof p.ruleId !== 'string' ||
    !TYPES.has(type) ||
    !PRIORITIES.has(priority) ||
    typeof p.message !== 'string' ||
    typeof p.generatedAtISO !== 'string'
  ) {
    return null; // not safely reconstructable
  }
  return {
    ruleId: p.ruleId,
    type,
    exerciseId: typeof p.exerciseId === 'string' ? p.exerciseId : null,
    title: typeof p.title === 'string' ? p.title : '',
    message: p.message,
    nextAction: typeof p.nextAction === 'string' ? p.nextAction : '',
    priority,
    generatedAtISO: p.generatedAtISO,
    source: 'rule_based',
  };
}

export function recsFromRows(rows: unknown[] | null | undefined): TrainerRec[] {
  if (!Array.isArray(rows)) return [];
  return rows
    .map((row) => recFromRow(row as Record<string, unknown>))
    .filter((r): r is TrainerRec => r != null);
}

export const REC_PULL_SUPPORTED = true;
