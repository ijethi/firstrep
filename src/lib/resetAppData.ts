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
import { usePlanSyncStore } from '../state/planSyncStore';
import { usePlanProgressSyncStore } from '../state/planProgressSyncStore';
import { useWorkoutSyncStore } from '../state/workoutSyncStore';
import { useCardioSyncStore } from '../state/cardioSyncStore';
import { useBodyWeightSyncStore } from '../state/bodyWeightSyncStore';
import { useBodyMeasurementSyncStore } from '../state/bodyMeasurementSyncStore';

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
  usePlanSyncStore.setState({ status: 'idle', lastSyncedAtISO: null, lastError: null });
  usePlanProgressSyncStore.setState({ status: 'idle', lastSyncedAtISO: null, lastError: null });
  useWorkoutSyncStore.setState({ status: 'idle', lastSyncedAtISO: null, lastError: null });
  useCardioSyncStore.setState({ status: 'idle', lastSyncedAtISO: null, lastError: null });
  useBodyWeightSyncStore.setState({ status: 'idle', lastSyncedAtISO: null, lastError: null });
  useBodyMeasurementSyncStore.setState({ status: 'idle', lastSyncedAtISO: null, lastError: null });
}
