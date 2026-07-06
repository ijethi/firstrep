import type { User } from '@supabase/supabase-js';

import { supabase } from './supabase';
import {
  decideMeasurementSyncDirection,
  hasSyncableMeasurements,
  measurementsFromRows,
  toMeasurementRows,
} from './bodyMeasurementSyncCore';
import { useProgressStore } from '../state/progressStore';
import { useBodyMeasurementSyncStore } from '../state/bodyMeasurementSyncStore';

/**
 * Body measurement sync (B-24) — pushes/pulls ONLY body_measurement_logs.
 * Local-first, LOCAL WINS. Measurements stay canonical cm (no conversion). Never
 * mutates local history on failure; touches NO other table. Pull is safe here
 * (cm + date + note) and applied only when local is empty.
 */

async function pushMeasurements(user: User): Promise<void> {
  if (!supabase) return;
  const entries = useProgressStore.getState().measurements;
  if (entries.length === 0) return;

  const up = await supabase
    .from('body_measurement_logs')
    .upsert(toMeasurementRows(entries, user.id), { onConflict: 'user_id,local_measurement_log_id' });
  if (up.error) throw up.error;
}

export async function syncBodyMeasurements(user: User | null): Promise<void> {
  const sync = useBodyMeasurementSyncStore.getState();

  if (!supabase || !user) {
    sync.setDisabled();
    return;
  }

  sync.setSyncing();
  try {
    const localHas = hasSyncableMeasurements(useProgressStore.getState().measurements);

    const remoteRes = await supabase
      .from('body_measurement_logs')
      .select('waist_cm, chest_cm, hip_cm, note, logged_on')
      .eq('user_id', user.id);
    if (remoteRes.error) throw remoteRes.error;
    const remoteRows = remoteRes.data ?? [];
    const remoteHas = remoteRows.length > 0;

    const direction = decideMeasurementSyncDirection(localHas, remoteHas);
    if (direction === 'push') {
      await pushMeasurements(user);
    } else if (direction === 'pull') {
      // Safe mapping; applies only when local is empty.
      useProgressStore.getState().importMeasurements(measurementsFromRows(remoteRows));
    }
    // 'noop' → nothing to do.

    sync.setSuccess(new Date().toISOString());
  } catch (e) {
    const message =
      e instanceof Error ? e.message : 'Measurement sync failed. Your logs are safe on this device.';
    sync.setError(message);
    // Never clear or modify local measurement history on failure.
  }
}
