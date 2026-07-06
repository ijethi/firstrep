import { create } from 'zustand';
import { persist } from 'zustand/middleware';

import { appJSONStorage } from '../lib/storage';
import { migratePersisted, PERSIST_VERSION, STORAGE_KEYS } from '../lib/persistConfig';
import type { SyncStatus } from '../lib/profileSyncCore';

/**
 * Generated-plan sync status store (B-19). Only `lastSyncedAtISO` is persisted;
 * `status`/`lastError` are transient (idle on reload). Local-first: this holds
 * UI status only, never the plan itself.
 */
interface PlanSyncState {
  status: SyncStatus;
  lastSyncedAtISO: string | null;
  lastError: string | null;
  setSyncing: () => void;
  setSuccess: (atISO: string) => void;
  setError: (message: string) => void;
  setDisabled: () => void;
}

export const usePlanSyncStore = create<PlanSyncState>()(
  persist(
    (set) => ({
      status: 'idle',
      lastSyncedAtISO: null,
      lastError: null,
      setSyncing: () => set({ status: 'syncing', lastError: null }),
      setSuccess: (atISO) => set({ status: 'success', lastSyncedAtISO: atISO, lastError: null }),
      setError: (message) => set({ status: 'error', lastError: message }),
      setDisabled: () => set({ status: 'disabled' }),
    }),
    {
      name: STORAGE_KEYS.planSync,
      storage: appJSONStorage,
      version: PERSIST_VERSION,
      migrate: (s, v) => migratePersisted(s, v),
      partialize: (s) => ({ lastSyncedAtISO: s.lastSyncedAtISO }),
    },
  ),
);
