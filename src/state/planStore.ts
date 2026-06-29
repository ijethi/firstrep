import { create } from 'zustand';

import type { GeneratedPlan, PlanDay } from '../types/database';

/**
 * Plan store (B-04) — LOCAL STATE ONLY. Holds the generated 4-week plan.
 * No persistence yet (resets on reload); Supabase sync arrives with the auth loop.
 * The generator stays pure — this store stamps the save time, not the generator.
 */
interface PlanState {
  plan: GeneratedPlan | null;
  savedAtISO: string | null;
  setPlan: (plan: GeneratedPlan) => void;
  clear: () => void;
}

export const usePlanStore = create<PlanState>((set) => ({
  plan: null,
  savedAtISO: null,
  setPlan: (plan) => set({ plan, savedAtISO: new Date().toISOString() }),
  clear: () => set({ plan: null, savedAtISO: null }),
}));

/** Find a specific day. Returns null if no plan or the day doesn't exist. */
export function getPlanDay(
  plan: GeneratedPlan | null,
  weekNumber: number,
  dayNumber: number,
): PlanDay | null {
  if (!plan) return null;
  return plan.days.find((d) => d.weekNumber === weekNumber && d.dayNumber === dayNumber) ?? null;
}
