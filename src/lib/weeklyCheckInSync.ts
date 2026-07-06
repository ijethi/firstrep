import type { User } from '@supabase/supabase-js';

import { supabase } from './supabase';
import {
  checkInsFromRows,
  decideCheckInSyncDirection,
  hasSyncableCheckIns,
  toCheckInRows,
} from './weeklyCheckInSyncCore';
import { useWeeklyCheckInStore } from '../state/weeklyCheckInStore';
import { useWeeklyCheckInSyncStore } from '../state/weeklyCheckInSyncStore';

/**
 * Weekly check-in sync (B-25) — pushes/pulls ONLY weekly_checkins. Local-first,
 * LOCAL WINS. Preserves everything via the `payload` jsonb; never mutates local
 * history on failure; touches NO other table. Pull is safe (payload) and applied
 * only when local is empty.
 */

async function pushCheckIns(user: User): Promise<void> {
  if (!supabase) return;
  const list = useWeeklyCheckInStore.getState().checkIns;
  if (list.length === 0) return;

  const up = await supabase
    .from('weekly_checkins')
    .upsert(toCheckInRows(list, user.id), { onConflict: 'user_id,local_weekly_checkin_id' });
  if (up.error) throw up.error;
}

export async function syncWeeklyCheckIns(user: User | null): Promise<void> {
  const sync = useWeeklyCheckInSyncStore.getState();

  if (!supabase || !user) {
    sync.setDisabled();
    return;
  }

  sync.setSyncing();
  try {
    const localHas = hasSyncableCheckIns(useWeeklyCheckInStore.getState().checkIns);

    const remoteRes = await supabase
      .from('weekly_checkins')
      .select('payload')
      .eq('user_id', user.id);
    if (remoteRes.error) throw remoteRes.error;
    const remoteRows = remoteRes.data ?? [];
    const remoteHas = remoteRows.length > 0;

    const direction = decideCheckInSyncDirection(localHas, remoteHas);
    if (direction === 'push') {
      await pushCheckIns(user);
    } else if (direction === 'pull') {
      // Safe mapping via payload; applies only when local is empty.
      useWeeklyCheckInStore.getState().importCheckIns(checkInsFromRows(remoteRows));
    }
    // 'noop' → nothing to do.

    sync.setSuccess(new Date().toISOString());
  } catch (e) {
    const message =
      e instanceof Error ? e.message : 'Check-in sync failed. Your check-ins are safe on this device.';
    sync.setError(message);
    // Never clear or modify local weekly check-ins on failure.
  }
}
