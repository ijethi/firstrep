import { create } from 'zustand';
import { persist } from 'zustand/middleware';

import { lbToKg } from '../lib/units';
import type { UnitSystem } from '../lib/units';
import { appJSONStorage } from '../lib/storage';
import { migratePersisted, PERSIST_VERSION, STORAGE_KEYS } from '../lib/persistConfig';

/**
 * Onboarding store (B-03) — LOCAL STATE ONLY. No Supabase, no auth, no persistence.
 *
 * Single source of truth stores BODY metrics canonically (kg / cm) so the shape
 * maps 1:1 to `user_profiles` later. The UI is imperial-first (D7): input
 * components convert at the edge and write canonical values here.
 *
 * `toUserProfile()` / `toOnboardingAnswers()` produce Supabase-ready payloads so
 * a future B-? loop can persist with zero reshaping.
 */

export type Sex = 'female' | 'male' | 'other' | 'prefer_not';
export type Experience = 'beginner' | 'some';
export type WorkoutLength = 20 | 30 | 45;

export interface OnboardingAnswers {
  unitPref: UnitSystem; // default 'imperial' (lb-first)
  goal: 'weight_loss' | null;
  sex: Sex | null;
  age: number | null; // years
  heightCm: number | null; // canonical
  currentWeightKg: number | null; // canonical
  goalWeightKg: number | null; // canonical
  experience: Experience | null;
  daysPerWeek: number | null; // 2..4
  workoutLengthMin: WorkoutLength | null;
  injuries: string[]; // [] = none; e.g. ['knee','shoulder']
}

const EMPTY: OnboardingAnswers = {
  unitPref: 'imperial',
  goal: null,
  sex: null,
  age: null,
  heightCm: null,
  currentWeightKg: null,
  goalWeightKg: null,
  experience: null,
  daysPerWeek: null,
  workoutLengthMin: null,
  injuries: [],
};

interface OnboardingState {
  answers: OnboardingAnswers;
  completed: boolean;
  setAnswer: <K extends keyof OnboardingAnswers>(key: K, value: OnboardingAnswers[K]) => void;
  complete: () => void;
  reset: () => void;
}

export const useOnboardingStore = create<OnboardingState>()(
  persist(
    (set) => ({
      answers: { ...EMPTY },
      completed: false,
      setAnswer: (key, value) => set((s) => ({ answers: { ...s.answers, [key]: value } })),
      complete: () => set({ completed: true }),
      reset: () => set({ answers: { ...EMPTY }, completed: false }),
    }),
    {
      name: STORAGE_KEYS.onboarding,
      storage: appJSONStorage,
      version: PERSIST_VERSION,
      migrate: (s, v) => migratePersisted(s, v),
      partialize: (s) => ({ answers: s.answers, completed: s.completed }),
    },
  ),
);

// --------------------------------------------------------------------------
// Helpers
// --------------------------------------------------------------------------

/** The UI uses a 'none' sentinel so the user must make an explicit choice; the
 *  DB stores an empty array for "no injuries". */
export function normalizeInjuries(injuries: string[]): string[] {
  return injuries.filter((v) => v !== 'none');
}

/** Bucket a numeric age into the `user_profiles.age_range` text the schema expects. */
export function ageToRange(age: number | null): string | null {
  if (age == null) return null;
  if (age < 18) return 'under_18';
  if (age <= 24) return '18-24';
  if (age <= 34) return '25-34';
  if (age <= 44) return '35-44';
  if (age <= 54) return '45-54';
  if (age <= 64) return '55-64';
  return '65+';
}

/** Shape matching the `user_profiles` table (minus ids/timestamps). */
export interface UserProfilePayload {
  goal: 'weight_loss';
  sex: Sex | null;
  age_range: string | null;
  height_cm: number | null;
  starting_weight_kg: number | null;
  days_per_week: number | null;
  workout_length_min: number | null;
  experience: Experience | null;
  injuries: string[];
  unit_pref: UnitSystem;
}

export function toUserProfile(a: OnboardingAnswers): UserProfilePayload {
  return {
    goal: 'weight_loss',
    sex: a.sex,
    age_range: ageToRange(a.age),
    height_cm: a.heightCm,
    starting_weight_kg: a.currentWeightKg,
    days_per_week: a.daysPerWeek,
    workout_length_min: a.workoutLengthMin,
    experience: a.experience,
    injuries: normalizeInjuries(a.injuries),
    unit_pref: a.unitPref,
  };
}

/** Raw jsonb payload for the `onboarding_answers` table (keeps everything, incl. goal weight). */
export function toOnboardingAnswers(a: OnboardingAnswers): Record<string, unknown> {
  return {
    unit_pref: a.unitPref,
    goal: a.goal,
    sex: a.sex,
    age: a.age,
    height_cm: a.heightCm,
    current_weight_kg: a.currentWeightKg,
    goal_weight_kg: a.goalWeightKg,
    experience: a.experience,
    days_per_week: a.daysPerWeek,
    workout_length_min: a.workoutLengthMin,
    injuries: normalizeInjuries(a.injuries),
  };
}

/** Convenience for tests/UI: a display-unit pounds value into canonical kg. */
export const enteredLbToKg = (lb: number): number => lbToKg(lb);
