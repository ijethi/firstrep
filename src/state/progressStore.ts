import { create } from 'zustand';
import { persist } from 'zustand/middleware';

import type {
  BodyMeasurementEntry,
  BodyWeightEntry,
  ProgressPhotoEntry,
  WorkoutSessionLocal,
} from '../types/database';
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
  measurements: BodyMeasurementEntry[];
  photos: ProgressPhotoEntry[];
  addSession: (session: WorkoutSessionLocal) => void;
  addBodyWeight: (weightKg: number, loggedOnISO: string) => void;
  /** Replace local body weights wholesale (used by the body-weight PULL sync, B-23). */
  importBodyWeights: (entries: BodyWeightEntry[]) => void;
  addMeasurement: (entry: BodyMeasurementEntry) => void;
  /** Replace local measurements wholesale (used by the measurement PULL sync, B-24). */
  importMeasurements: (entries: BodyMeasurementEntry[]) => void;
  addPhoto: (entry: ProgressPhotoEntry) => void;
  clear: () => void;
}

export const useProgressStore = create<ProgressState>()(
  persist(
    (set) => ({
      history: [],
      bodyWeights: [],
      measurements: [],
      photos: [],
      addSession: (session) => set((s) => ({ history: [...s.history, session] })),
      addBodyWeight: (weightKg, loggedOnISO) =>
        set((s) => ({
          bodyWeights: [...s.bodyWeights, { weightKg, loggedOnISO, source: 'manual' }],
        })),
      importBodyWeights: (entries) => set({ bodyWeights: [...entries] }),
      addMeasurement: (entry) => set((s) => ({ measurements: [...s.measurements, entry] })),
      importMeasurements: (entries) => set({ measurements: [...entries] }),
      addPhoto: (entry) => set((s) => ({ photos: [...s.photos, entry] })),
      clear: () => set({ history: [], bodyWeights: [], measurements: [], photos: [] }),
    }),
    {
      name: STORAGE_KEYS.progress,
      storage: appJSONStorage,
      version: PERSIST_VERSION,
      migrate: (s, v) => migratePersisted(s, v),
      partialize: (s) => ({
        history: s.history,
        bodyWeights: s.bodyWeights,
        measurements: s.measurements,
        photos: s.photos,
      }),
    },
  ),
);
