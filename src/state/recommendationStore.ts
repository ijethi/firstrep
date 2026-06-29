import { create } from 'zustand';
import { persist } from 'zustand/middleware';

import type { TrainerRec } from '../types/database';
import { appJSONStorage } from '../lib/storage';
import { migratePersisted, PERSIST_VERSION, STORAGE_KEYS } from '../lib/persistConfig';

/**
 * Recommendation store (B-06) — LOCAL ONLY. Holds the latest session's trainer
 * recommendations and a local count of completed workouts (the history seed for
 * R7 consistency). No persistence/analytics yet — that arrives with later loops.
 */
interface RecommendationState {
  recommendations: TrainerRec[];
  completedCount: number; // completed sessions so far (local, resets on reload)
  setRecommendations: (recs: TrainerRec[]) => void;
  registerCompletion: () => void;
  clear: () => void;
}

export const useRecommendationStore = create<RecommendationState>()(
  persist(
    (set) => ({
      recommendations: [],
      completedCount: 0,
      setRecommendations: (recs) => set({ recommendations: recs }),
      registerCompletion: () => set((s) => ({ completedCount: s.completedCount + 1 })),
      clear: () => set({ recommendations: [] }),
    }),
    {
      name: STORAGE_KEYS.recommendation,
      storage: appJSONStorage,
      version: PERSIST_VERSION,
      migrate: (s, v) => migratePersisted(s, v),
      partialize: (s) => ({ recommendations: s.recommendations, completedCount: s.completedCount }),
    },
  ),
);
