import { create } from 'zustand';
import { persist } from 'zustand/middleware';

import { appJSONStorage } from '../lib/storage';
import { migratePersisted, PERSIST_VERSION, STORAGE_KEYS } from '../lib/persistConfig';
import type { SyncStatus } from '../lib/profileSyncCore';

/**
 * Cardio-sync status store (B-22). Only `lastSyncedAtISO` persisted;
 * `status`/`lastError` transient. Holds UI status only, never cardio data.
 */
interface CardioSyncState {
  status: SyncStatus;
  lastSyncedAtISO: string | null;
  lastError: string | null;
  setSyncing: () => void;
  setSuccess: (atISO: string) => void;
  setError: (message: string) => void;
  setDisabled: () => void;
}

export const useCardioSyncStore = create<CardioSyncState>()(
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
      name: STORAGE_KEYS.cardioSync,
      storage: appJSONStorage,
      version: PERSIST_VERSION,
      migrate: (s, v) => migratePersisted(s, v),
      partialize: (s) => ({ lastSyncedAtISO: s.lastSyncedAtISO }),
    },
  ),
);
