import AsyncStorage from '@react-native-async-storage/async-storage';
import { createJSONStorage } from 'zustand/middleware';

import { STORAGE_KEYS } from './persistConfig';

/**
 * AsyncStorage-backed JSON storage for Zustand `persist` (B-10). Local only —
 * no Supabase, no auth, no secrets. Shared by every persisted store.
 */
export const appJSONStorage = createJSONStorage(() => AsyncStorage);

/** Remove all persisted FirstRep keys from AsyncStorage (storage layer only). */
export async function clearPersistedStorage(): Promise<void> {
  await AsyncStorage.multiRemove(Object.values(STORAGE_KEYS));
}
