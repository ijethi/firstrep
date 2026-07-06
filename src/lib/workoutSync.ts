import type { User } from '@supabase/supabase-js';

import { supabase } from './supabase';
import {
  decideWorkoutSyncDirection,
  syncableSessions,
  toSessionRow,
  toSetRows,
} from './workoutSyncCore';
import { useProgressStore } from '../state/progressStore';
import { useWorkoutSyncStore } from '../state/workoutSyncStore';

/**
 * Workout sync (B-21) — pushes ONLY completed workout_sessions + strength
 * exercise_sets. Local-first, LOCAL WINS. Abandoned/active/discarded sessions are
 * never synced; cardio is never touched (B-22). Never mutates local history.
 * PULL deferred (documented schema gap). Touches NO other tables.
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

async function pushSessions(user: User): Promise<void> {
  if (!supabase) return;
  const sessions = syncableSessions(useProgressStore.getState().history);
  if (sessions.length === 0) return;

  const slugToId = await loadSlugToId();
  if (Object.keys(slugToId).length === 0) {
    throw new Error('Remote exercises catalog is empty — apply seed.sql before syncing workouts.');
  }

  for (const session of sessions) {
    // Upsert the session by (user_id, local_session_id) → get its remote id.
    const sessRes = await supabase
      .from('workout_sessions')
      .upsert(toSessionRow(session, user.id), { onConflict: 'user_id,local_session_id' })
      .select('id')
      .single();
    if (sessRes.error) throw sessRes.error;
    const sessionRemoteId = sessRes.data.id as string;

    const { rows, missingSlugs } = toSetRows(session, sessionRemoteId, slugToId);
    if (missingSlugs.length > 0) {
      throw new Error(`Remote exercises missing: ${missingSlugs.join(', ')}. Apply seed.sql.`);
    }

    // Replace this session's strength sets (delete + reinsert — safest, no unique needed).
    const del = await supabase.from('exercise_sets').delete().eq('session_id', sessionRemoteId);
    if (del.error) throw del.error;
    if (rows.length > 0) {
      const ins = await supabase.from('exercise_sets').insert(rows);
      if (ins.error) throw ins.error;
    }
  }
}

export async function syncWorkouts(user: User | null): Promise<void> {
  const sync = useWorkoutSyncStore.getState();

  if (!supabase || !user) {
    sync.setDisabled();
    return;
  }

  sync.setSyncing();
  try {
    const localHasCompleted = syncableSessions(useProgressStore.getState().history).length > 0;

    const remoteRes = await supabase
      .from('workout_sessions')
      .select('id')
      .eq('user_id', user.id)
      .limit(1);
    if (remoteRes.error) throw remoteRes.error;
    const remoteHasSessions = (remoteRes.data?.length ?? 0) > 0;

    const direction = decideWorkoutSyncDirection(localHasCompleted, remoteHasSessions);
    if (direction === 'push') {
      await pushSessions(user);
    }
    // 'pull' deferred (schema can't faithfully reconstruct the local session view).
    // 'noop' → nothing to do.

    sync.setSuccess(new Date().toISOString());
  } catch (e) {
    const message =
      e instanceof Error ? e.message : 'Workout sync failed. Your history is safe on this device.';
    sync.setError(message);
    // Never clear or modify local workout history on failure.
  }
}
