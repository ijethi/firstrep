import type { User } from '@supabase/supabase-js';

import { supabase } from './supabase';
import {
  decideProgressSyncDirection,
  progressFromRow,
  progressHasData,
  toProgressRow,
} from './planProgressSyncCore';
import { usePlanProgressStore } from '../state/planProgressStore';
import { usePlanProgressSyncStore } from '../state/planProgressSyncStore';

/**
 * Plan-progress sync (B-20) — syncs ONLY plan progress (completed_day_ids +
 * last/selected day) via the dedicated `plan_progress` table (migration 002,
 * unique(user_id) → clean upsert). Local-first, LOCAL WINS. Never touches the
 * generated plan, workout history, sessions, sets, or any other data. Progress
 * is a passthrough of `completedDayIds` — sync never derives completion from a
 * session, so an abandoned session can never advance synced progress.
 */

/** Best-effort link to the user's remote plan (null if none / on error). */
async function resolveWorkoutPlanId(userId: string): Promise<string | null> {
  if (!supabase) return null;
  const res = await supabase.from('workout_plans').select('id').eq('user_id', userId).limit(1);
  if (res.error) return null;
  return (res.data?.[0]?.id as string) ?? null;
}

export async function syncPlanProgress(user: User | null): Promise<void> {
  const sync = usePlanProgressSyncStore.getState();

  if (!supabase || !user) {
    sync.setDisabled();
    return;
  }

  sync.setSyncing();
  try {
    const local = usePlanProgressStore.getState();
    const localProgress = {
      completedDayIds: local.completedDayIds,
      lastCompletedDayId: local.lastCompletedDayId,
      selectedDayId: local.selectedDayId,
    };

    const remoteRes = await supabase
      .from('plan_progress')
      .select('completed_day_ids, last_completed_day_id, selected_day_id')
      .eq('user_id', user.id)
      .limit(1);
    if (remoteRes.error) throw remoteRes.error;
    const remoteRow = remoteRes.data?.[0];

    const remoteProgress = progressFromRow(remoteRow);
    const remoteHasProgress = progressHasData(remoteProgress);

    const direction = decideProgressSyncDirection(progressHasData(localProgress), remoteHasProgress);

    if (direction === 'push') {
      const workoutPlanId = await resolveWorkoutPlanId(user.id);
      const up = await supabase
        .from('plan_progress')
        .upsert(toProgressRow(user.id, workoutPlanId, localProgress), { onConflict: 'user_id' });
      if (up.error) throw up.error;
    } else if (direction === 'pull') {
      // Safe mapping (plain strings/array). Applies only when local is empty.
      usePlanProgressStore
        .getState()
        .importProgress(
          remoteProgress.completedDayIds,
          remoteProgress.lastCompletedDayId,
          remoteProgress.selectedDayId,
        );
    }
    // 'noop' → nothing to do.

    sync.setSuccess(new Date().toISOString());
  } catch (e) {
    const message =
      e instanceof Error ? e.message : 'Progress sync failed. Your progress is safe on this device.';
    sync.setError(message);
    // Never clear or modify local progress / plan / history on failure.
  }
}
