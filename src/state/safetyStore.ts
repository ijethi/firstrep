import { create } from 'zustand';
import { persist } from 'zustand/middleware';

import { appJSONStorage } from '../lib/storage';
import { migratePersisted, PERSIST_VERSION, STORAGE_KEYS } from '../lib/persistConfig';

/**
 * Safety store (B-16) — LOCAL + persisted. Tracks the one-time acknowledgment
 * of the fitness safety disclaimer. No Supabase/auth/AI.
 */
interface SafetyState {
  acknowledged: boolean;
  acknowledge: () => void;
  reset: () => void;
}

export const useSafetyStore = create<SafetyState>()(
  persist(
    (set) => ({
      acknowledged: false,
      acknowledge: () => set({ acknowledged: true }),
      reset: () => set({ acknowledged: false }),
    }),
    {
      name: STORAGE_KEYS.safety,
      storage: appJSONStorage,
      version: PERSIST_VERSION,
      migrate: (s, v) => migratePersisted(s, v),
      partialize: (s) => ({ acknowledged: s.acknowledged }),
    },
  ),
);
