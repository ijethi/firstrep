import type { User } from '@supabase/supabase-js';

import { supabase } from './supabase';
import {
  decideRecSyncDirection,
  hasSyncableRecs,
  recsFromRows,
  toRecRows,
} from './trainerRecommendationSyncCore';
import { useRecommendationStore } from '../state/recommendationStore';
import { useTrainerRecSyncStore } from '../state/trainerRecommendationSyncStore';

/**
 * Trainer recommendation sync (B-26) — pushes/pulls ONLY trainer_recommendations.
 * Local-first, LOCAL WINS. A passthrough of already-generated recs — NEVER
 * regenerates or changes meaning. Never mutates local recs on failure; touches
 * NO other table. Pull is safe (payload) and applied only when local is empty.
 */

async function pushRecs(user: User): Promise<void> {
  if (!supabase) return;
  const list = useRecommendationStore.getState().recommendations;
  if (list.length === 0) return;

  const up = await supabase
    .from('trainer_recommendations')
    .upsert(toRecRows(list, user.id), { onConflict: 'user_id,local_recommendation_id' });
  if (up.error) throw up.error;
}

export async function syncTrainerRecommendations(user: User | null): Promise<void> {
  const sync = useTrainerRecSyncStore.getState();

  if (!supabase || !user) {
    sync.setDisabled();
    return;
  }

  sync.setSyncing();
  try {
    const localHas = hasSyncableRecs(useRecommendationStore.getState().recommendations);

    const remoteRes = await supabase
      .from('trainer_recommendations')
      .select('payload')
      .eq('user_id', user.id);
    if (remoteRes.error) throw remoteRes.error;
    const remoteRows = remoteRes.data ?? [];
    const remoteHas = remoteRows.length > 0;

    const direction = decideRecSyncDirection(localHas, remoteHas);
    if (direction === 'push') {
      await pushRecs(user);
    } else if (direction === 'pull') {
      // Safe mapping via payload; applies only when local is empty. Not regenerated.
      useRecommendationStore.getState().setRecommendations(recsFromRows(remoteRows));
    }
    // 'noop' → nothing to do.

    sync.setSuccess(new Date().toISOString());
  } catch (e) {
    const message =
      e instanceof Error ? e.message : 'Recommendation sync failed. Your tips are safe on this device.';
    sync.setError(message);
    // Never clear or modify local recommendations on failure.
  }
}
