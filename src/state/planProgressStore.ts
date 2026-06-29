import { create } from 'zustand';
import { persist } from 'zustand/middleware';

import { appJSONStorage } from '../lib/storage';
import { migratePersisted, PERSIST_VERSION, STORAGE_KEYS } from '../lib/persistConfig';

/**
 * Plan progression store (B-09) — LOCAL ONLY, no persistence yet. Tracks which
 * plan days are done + the day the user is previewing. Derivations live in the
 * pure helpers in lib/planProgress.ts; this store holds only raw state.
 *
 * Completed day ids map to workout_days (week_number, day_number) when persisted.
 */
interface PlanProgressState {
  completedDayIds: string[];
  lastCompletedDayId: string | null;
  selectedDayId: string | null; // null = follow the recommended (current) day
  markDayCompleted: (dayId: string) => void;
  selectDay: (dayId: string | null) => void;
  reset: () => void;
}

export const usePlanProgressStore = create<PlanProgressState>()(
  persist(
    (set) => ({
      completedDayIds: [],
      lastCompletedDayId: null,
      selectedDayId: null,

      markDayCompleted: (dayId) =>
        set((s) => ({
          completedDayIds: s.completedDayIds.includes(dayId)
            ? s.completedDayIds
            : [...s.completedDayIds, dayId],
          lastCompletedDayId: dayId,
          selectedDayId: null, // jump back to the new recommended day
        })),

      selectDay: (dayId) => set({ selectedDayId: dayId }),

      reset: () => set({ completedDayIds: [], lastCompletedDayId: null, selectedDayId: null }),
    }),
    {
      name: STORAGE_KEYS.planProgress,
      storage: appJSONStorage,
      version: PERSIST_VERSION,
      migrate: (s, v) => migratePersisted(s, v),
      partialize: (s) => ({
        completedDayIds: s.completedDayIds,
        lastCompletedDayId: s.lastCompletedDayId,
        selectedDayId: s.selectedDayId,
      }),
    },
  ),
);
