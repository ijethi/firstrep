import { create } from 'zustand';
import { persist } from 'zustand/middleware';

import type { WeeklyCheckInEntry } from '../types/database';
import { appJSONStorage } from '../lib/storage';
import { migratePersisted, PERSIST_VERSION, STORAGE_KEYS } from '../lib/persistConfig';

/**
 * Weekly check-in store (B-12) — LOCAL + persisted (same pattern as B-10).
 * Holds the user's short weekly reflections. Maps to the `weekly_checkins`
 * table later. No Supabase/auth/AI/nutrition.
 */
interface WeeklyCheckInState {
  checkIns: WeeklyCheckInEntry[];
  addCheckIn: (entry: WeeklyCheckInEntry) => void;
  /** Replace local check-ins wholesale (used by the weekly-check-in PULL sync, B-25). */
  importCheckIns: (entries: WeeklyCheckInEntry[]) => void;
  clear: () => void;
}

export const useWeeklyCheckInStore = create<WeeklyCheckInState>()(
  persist(
    (set) => ({
      checkIns: [],
      addCheckIn: (entry) => set((s) => ({ checkIns: [...s.checkIns, entry] })),
      importCheckIns: (entries) => set({ checkIns: [...entries] }),
      clear: () => set({ checkIns: [] }),
    }),
    {
      name: STORAGE_KEYS.weeklyCheckIn,
      storage: appJSONStorage,
      version: PERSIST_VERSION,
      migrate: (s, v) => migratePersisted(s, v),
      partialize: (s) => ({ checkIns: s.checkIns }),
    },
  ),
);
