import { useEffect, useState } from 'react';

import { useOnboardingStore } from '../state/onboardingStore';
import { usePlanStore } from '../state/planStore';
import { usePlanProgressStore } from '../state/planProgressStore';
import { useProgressStore } from '../state/progressStore';
import { useRecommendationStore } from '../state/recommendationStore';
import { useWeeklyCheckInStore } from '../state/weeklyCheckInStore';

/**
 * Hydration gate (B-10). AsyncStorage is async, so persisted stores rehydrate
 * after first render. We wait for ALL persisted stores before showing the app,
 * so onboarding never flickers when persisted onboarding is already complete.
 */
interface PersistedStore {
  persist: {
    hasHydrated: () => boolean;
    onFinishHydration: (cb: () => void) => () => void;
  };
}

function useOneHydrated(store: PersistedStore): boolean {
  const [hydrated, setHydrated] = useState<boolean>(() => store.persist.hasHydrated());
  useEffect(() => {
    const unsub = store.persist.onFinishHydration(() => setHydrated(true));
    if (store.persist.hasHydrated()) setHydrated(true);
    return unsub;
  }, [store]);
  return hydrated;
}

export function useAppHydrated(): boolean {
  const a = useOneHydrated(useOnboardingStore as unknown as PersistedStore);
  const b = useOneHydrated(usePlanStore as unknown as PersistedStore);
  const c = useOneHydrated(usePlanProgressStore as unknown as PersistedStore);
  const d = useOneHydrated(useProgressStore as unknown as PersistedStore);
  const e = useOneHydrated(useRecommendationStore as unknown as PersistedStore);
  const f = useOneHydrated(useWeeklyCheckInStore as unknown as PersistedStore);
  return a && b && c && d && e && f;
}
