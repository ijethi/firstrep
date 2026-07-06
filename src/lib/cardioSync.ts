import type { User } from '@supabase/supabase-js';

import { supabase } from './supabase';
import { decideCardioSyncDirection, syncableCardioSessions, toCardioRow } from './cardioSyncCore';
import { localSessionId } from './workoutSyncCore';
import { useProgressStore } from '../state/progressStore';
import { useCardioSyncStore } from '../state/cardioSyncStore';

/**
 * Cardio sync (B-22) — pushes ONLY cardio_logs from completed sessions.
 * Local-first, LOCAL WINS. Reads workout_sessions ONLY to resolve remote session
 * ids (does not re-sync sessions/sets, and never fabricates a session). Never
 * mutates local workout history. Touches NO table except cardio_logs. PULL deferred.
 */

/** Map local_session_id → remote workout_sessions.id for this user. */
async function loadLocalSessionIdToRemoteId(userId: string): Promise<Record<string, string>> {
  if (!supabase) return {};
  const res = await supabase
    .from('workout_sessions')
    .select('id, local_session_id')
    .eq('user_id', userId);
  if (res.error) throw res.error;
  const map: Record<string, string> = {};
  for (const row of res.data ?? []) {
    if (row.local_session_id && row.id) map[row.local_session_id as string] = row.id as string;
  }
  return map;
}

async function pushCardio(user: User): Promise<void> {
  if (!supabase) return;
  const sessions = syncableCardioSessions(useProgressStore.getState().history);
  if (sessions.length === 0) return;

  const sessionIdMap = await loadLocalSessionIdToRemoteId(user.id);

  const rows = sessions.map((session) => {
    const remoteSessionId = sessionIdMap[localSessionId(session)];
    if (!remoteSessionId) {
      // Never fabricate a workout_session — require it to be synced first.
      throw new Error('Sync workouts before syncing cardio.');
    }
    return toCardioRow(session, user.id, remoteSessionId);
  });

  // Clean upsert by (user_id, local_cardio_log_id) — idempotent, no duplicates.
  const up = await supabase.from('cardio_logs').upsert(rows, { onConflict: 'user_id,local_cardio_log_id' });
  if (up.error) throw up.error;
}

export async function syncCardio(user: User | null): Promise<void> {
  const sync = useCardioSyncStore.getState();

  if (!supabase || !user) {
    sync.setDisabled();
    return;
  }

  sync.setSyncing();
  try {
    const localHasCardio = syncableCardioSessions(useProgressStore.getState().history).length > 0;

    const remoteRes = await supabase.from('cardio_logs').select('id').eq('user_id', user.id).limit(1);
    if (remoteRes.error) throw remoteRes.error;
    const remoteHasCardio = (remoteRes.data?.length ?? 0) > 0;

    const direction = decideCardioSyncDirection(localHasCardio, remoteHasCardio);
    if (direction === 'push') {
      await pushCardio(user);
    }
    // 'pull' deferred; 'noop' → nothing to do.

    sync.setSuccess(new Date().toISOString());
  } catch (e) {
    const message =
      e instanceof Error ? e.message : 'Cardio sync failed. Your cardio is safe on this device.';
    sync.setError(message);
    // Never clear or modify local workout/cardio history on failure.
  }
}
