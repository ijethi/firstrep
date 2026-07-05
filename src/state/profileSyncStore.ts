import { create } from 'zustand';
import { persist } from 'zustand/middleware';

import { appJSONStorage } from '../lib/storage';
import { migratePersisted, PERSIST_VERSION, STORAGE_KEYS } from '../lib/persistConfig';
import type { SyncStatus } from '../lib/profileSyncCore';

/**
 * Profile-sync status store (B-18). Only `lastSyncedAtISO` is persisted; the
 * transient `status`/`lastError` reset to idle on reload. Local-first: this
 * store is purely UI status — it never holds the user's actual data.
 */
interface ProfileSyncState {
  status: SyncStatus;
  lastSyncedAtISO: string | null;
  lastError: string | null;
  setSyncing: () => void;
  setSuccess: (atISO: string) => void;
  setError: (message: string) => void;
  setDisabled: () => void;
}

export const useProfileSyncStore = create<ProfileSyncState>()(
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
      name: STORAGE_KEYS.profileSync,
      storage: appJSONStorage,
      version: PERSIST_VERSION,
      migrate: (s, v) => migratePersisted(s, v),
      partialize: (s) => ({ lastSyncedAtISO: s.lastSyncedAtISO }),
    },
  ),
);
