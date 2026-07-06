import { create } from 'zustand';
import { persist } from 'zustand/middleware';

import { appJSONStorage } from '../lib/storage';
import { migratePersisted, PERSIST_VERSION, STORAGE_KEYS } from '../lib/persistConfig';
import type { SyncStatus } from '../lib/profileSyncCore';

/**
 * Progress-photo sync status store (B-27). Only `lastSyncedAtISO` persisted;
 * `status`/`lastError` transient. Holds UI status only — never photo data/uris.
 */
interface ProgressPhotoSyncState {
  status: SyncStatus;
  lastSyncedAtISO: string | null;
  lastError: string | null;
  setSyncing: () => void;
  setSuccess: (atISO: string) => void;
  setError: (message: string) => void;
  setDisabled: () => void;
}

export const useProgressPhotoSyncStore = create<ProgressPhotoSyncState>()(
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
      name: STORAGE_KEYS.progressPhotoSync,
      storage: appJSONStorage,
      version: PERSIST_VERSION,
      migrate: (s, v) => migratePersisted(s, v),
      partialize: (s) => ({ lastSyncedAtISO: s.lastSyncedAtISO }),
    },
  ),
);
