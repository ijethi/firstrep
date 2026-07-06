import type { User } from '@supabase/supabase-js';

import { supabase } from './supabase';
import {
  decideWeightSyncDirection,
  hasSyncableWeights,
  toWeightRows,
  weightsFromRows,
} from './bodyWeightSyncCore';
import { useProgressStore } from '../state/progressStore';
import { useBodyWeightSyncStore } from '../state/bodyWeightSyncStore';

/**
 * Body weight sync (B-23) — pushes/pulls ONLY body_weight_logs. Local-first,
 * LOCAL WINS. Weight stays canonical kg. Never mutates local history on failure;
 * touches NO other table. Pull is safe here (weight + date) and applied only when
 * local is empty.
 */

async function pushWeights(user: User): Promise<void> {
  if (!supabase) return;
  const entries = useProgressStore.getState().bodyWeights;
  if (entries.length === 0) return;

  const up = await supabase
    .from('body_weight_logs')
    .upsert(toWeightRows(entries, user.id), { onConflict: 'user_id,local_weight_log_id' });
  if (up.error) throw up.error;
}

export async function syncBodyWeight(user: User | null): Promise<void> {
  const sync = useBodyWeightSyncStore.getState();

  if (!supabase || !user) {
    sync.setDisabled();
    return;
  }

  sync.setSyncing();
  try {
    const localHasWeights = hasSyncableWeights(useProgressStore.getState().bodyWeights);

    const remoteRes = await supabase
      .from('body_weight_logs')
      .select('weight_kg, logged_on')
      .eq('user_id', user.id);
    if (remoteRes.error) throw remoteRes.error;
    const remoteRows = remoteRes.data ?? [];
    const remoteHasWeights = remoteRows.length > 0;

    const direction = decideWeightSyncDirection(localHasWeights, remoteHasWeights);
    if (direction === 'push') {
      await pushWeights(user);
    } else if (direction === 'pull') {
      // Safe mapping; applies only when local is empty.
      useProgressStore.getState().importBodyWeights(weightsFromRows(remoteRows));
    }
    // 'noop' → nothing to do.

    sync.setSuccess(new Date().toISOString());
  } catch (e) {
    const message =
      e instanceof Error ? e.message : 'Body weight sync failed. Your logs are safe on this device.';
    sync.setError(message);
    // Never clear or modify local body weight history on failure.
  }
}
