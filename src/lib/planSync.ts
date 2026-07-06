import type { User } from '@supabase/supabase-js';

import { supabase } from './supabase';
import { decidePlanSyncDirection, toDayRow, toExerciseRows, toPlanRow } from './planSyncCore';
import { usePlanStore } from '../state/planStore';
import { usePlanSyncStore } from '../state/planSyncStore';

/**
 * Generated-plan sync (B-19) — pushes ONLY workout_plans / workout_days /
 * workout_exercises. Local-first, LOCAL WINS. Never mutates or regenerates the
 * local plan; never touches sessions/sets/cardio/progress/recommendations/etc.
 * PULL is deferred (documented schema gap — see review §Pull).
 */

/** Resolve local exercise slugs → remote exercises.id (uuid). */
async function loadSlugToId(): Promise<Record<string, string>> {
  if (!supabase) return {};
  const res = await supabase.from('exercises').select('id, slug');
  if (res.error) throw res.error;
  const map: Record<string, string> = {};
  for (const row of res.data ?? []) {
    if (row.slug && row.id) map[row.slug as string] = row.id as string;
  }
  return map;
}

/** Delete-then-reinsert the signed-in user's plan tree (schema has no unique(user_id)). */
async function pushPlan(user: User): Promise<void> {
  if (!supabase) return;
  const plan = usePlanStore.getState().plan;
  if (!plan) return;

  const slugToId = await loadSlugToId();
  if (Object.keys(slugToId).length === 0) {
    throw new Error('Remote exercises catalog is empty — apply seed.sql before syncing plans.');
  }

  // Non-destructive to LOCAL: only removes this user's remote plan tree
  // (workout_days / workout_exercises cascade via FK on delete).
  const del = await supabase.from('workout_plans').delete().eq('user_id', user.id);
  if (del.error) throw del.error;

  // Insert plan → get id.
  const planIns = await supabase
    .from('workout_plans')
    .insert(toPlanRow(plan, user.id))
    .select('id')
    .single();
  if (planIns.error) throw planIns.error;
  const planId = planIns.data.id as string;

  for (const day of plan.days) {
    const dayIns = await supabase
      .from('workout_days')
      .insert(toDayRow(day, planId))
      .select('id')
      .single();
    if (dayIns.error) throw dayIns.error;
    const workoutDayId = dayIns.data.id as string;

    const { rows, missingSlugs } = toExerciseRows(day, workoutDayId, slugToId);
    if (missingSlugs.length > 0) {
      // Schema/seed mismatch: don't write broken FKs — stop and surface it.
      throw new Error(`Remote exercises missing: ${missingSlugs.join(', ')}. Apply seed.sql.`);
    }
    if (rows.length > 0) {
      const exIns = await supabase.from('workout_exercises').insert(rows);
      if (exIns.error) throw exIns.error;
    }
  }
}

export async function syncPlan(user: User | null): Promise<void> {
  const sync = usePlanSyncStore.getState();

  if (!supabase || !user) {
    sync.setDisabled();
    return;
  }

  sync.setSyncing();
  try {
    const localHasPlan = !!usePlanStore.getState().plan;

    const remoteRes = await supabase
      .from('workout_plans')
      .select('id')
      .eq('user_id', user.id)
      .limit(1);
    if (remoteRes.error) throw remoteRes.error;
    const remoteHasPlan = (remoteRes.data?.length ?? 0) > 0;

    const direction = decidePlanSyncDirection(localHasPlan, remoteHasPlan);
    if (direction === 'push') {
      await pushPlan(user);
    }
    // 'pull' is DEFERRED this loop (schema can't faithfully reconstruct the local
    // plan view without regenerating). We do NOT apply a pull; local stays as-is.
    // 'noop' → nothing to do.

    sync.setSuccess(new Date().toISOString());
  } catch (e) {
    const message = e instanceof Error ? e.message : 'Plan sync failed. Your plan is safe on this device.';
    sync.setError(message);
    // Never clear or modify the local plan on failure.
  }
}
