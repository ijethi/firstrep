import 'react-native-url-polyfill/auto';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient, SupabaseClient } from '@supabase/supabase-js';

import { isSupabaseConfigured, SUPABASE_ANON_KEY, SUPABASE_URL } from './supabaseConfig';

/**
 * Supabase client (B-17) — auth foundation only. `null` when env vars are
 * missing, so the app stays fully usable local-first. Session is persisted via
 * AsyncStorage (the same local storage the rest of the app uses).
 */
export const supabase: SupabaseClient | null =
  isSupabaseConfigured && SUPABASE_URL && SUPABASE_ANON_KEY
    ? createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
        auth: {
          storage: AsyncStorage,
          autoRefreshToken: true,
          persistSession: true,
          detectSessionInUrl: false,
        },
      })
    : null;

export { isSupabaseConfigured } from './supabaseConfig';
