import { create } from 'zustand';
import { persist } from 'zustand/middleware';

import type { BodyWeightEntry, WorkoutSessionLocal } from '../types/database';
import { appJSONStorage } from '../lib/storage';
import { migratePersisted, PERSIST_VERSION, STORAGE_KEYS } from '../lib/persistConfig';

/**
 * Progress / history store (B-07) — LOCAL ONLY, no persistence yet.
 * Holds finished session snapshots (maps to workout_sessions/exercise_sets/
 * cardio_logs) and body-weight entries (maps to body_weight_logs). All stats
 * are derived by the pure functions in lib/progressStats.ts.
 */
interface ProgressState {
  history: WorkoutSessionLocal[];
  bodyWeights: BodyWeightEntry[];
  addSession: (session: WorkoutSessionLocal) => void;
  addBodyWeight: (weightKg: number, loggedOnISO: string) => void;
  clear: () => void;
}

export const useProgressStore = create<ProgressState>()(
  persist(
    (set) => ({
      history: [],
      bodyWeights: [],
      addSession: (session) => set((s) => ({ history: [...s.history, session] })),
      addBodyWeight: (weightKg, loggedOnISO) =>
        set((s) => ({
          bodyWeights: [...s.bodyWeights, { weightKg, loggedOnISO, source: 'manual' }],
        })),
      clear: () => set({ history: [], bodyWeights: [] }),
    }),
    {
      name: STORAGE_KEYS.progress,
      storage: appJSONStorage,
      version: PERSIST_VERSION,
      migrate: (s, v) => migratePersisted(s, v),
      partialize: (s) => ({ history: s.history, bodyWeights: s.bodyWeights }),
    },
  ),
);
