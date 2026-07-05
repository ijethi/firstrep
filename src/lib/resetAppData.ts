import { clearPersistedStorage } from './storage';
import { useOnboardingStore } from '../state/onboardingStore';
import { usePlanStore } from '../state/planStore';
import { usePlanProgressStore } from '../state/planProgressStore';
import { useProgressStore } from '../state/progressStore';
import { useRecommendationStore } from '../state/recommendationStore';
import { useWeeklyCheckInStore } from '../state/weeklyCheckInStore';
import { useWorkoutSessionStore } from '../state/workoutSessionStore';
import { useSafetyStore } from '../state/safetyStore';
import { useProfileSyncStore } from '../state/profileSyncStore';

/**
 * Clears all locally persisted FirstRep data (dev/testing + Settings reset).
 * Removes AsyncStorage keys, then resets every in-memory store to defaults
 * (including the non-persisted live session).
 */
export async function resetLocalAppData(): Promise<void> {
  await clearPersistedStorage();

  useOnboardingStore.getState().reset();
  usePlanStore.getState().clear();
  usePlanProgressStore.getState().reset();
  useProgressStore.getState().clear();
  useRecommendationStore.setState({ recommendations: [], completedCount: 0 });
  useWeeklyCheckInStore.getState().clear();
  useWorkoutSessionStore.getState().clear();
  useSafetyStore.getState().reset();
  useProfileSyncStore.setState({ status: 'idle', lastSyncedAtISO: null, lastError: null });
}
