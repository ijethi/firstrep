import { create } from 'zustand';
import type { Session, User } from '@supabase/supabase-js';

import { supabase } from '../lib/supabase';
import { deriveAuthStatus, isSupabaseConfigured } from '../lib/supabaseConfig';
import type { AuthStatus } from '../lib/supabaseConfig';
import { syncProfile } from '../lib/profileSync';
import { syncPlan } from '../lib/planSync';
import { syncPlanProgress } from '../lib/planProgressSync';
import { syncWorkouts } from '../lib/workoutSync';
import { syncCardio } from '../lib/cardioSync';
import { syncBodyWeight } from '../lib/bodyWeightSync';

/**
 * Auth store (B-17) — Supabase auth foundation ONLY. Not persisted here; the
 * Supabase client persists the session via AsyncStorage. Sign-out clears the
 * remote session only — it NEVER touches local app data (that's Reset Local Data).
 *
 * No data sync in this loop beyond a best-effort profile upsert on sign-in.
 */
interface AuthState {
  user: User | null;
  session: Session | null;
  loading: boolean;
  status: AuthStatus;
  initialize: () => Promise<void>;
  signUp: (email: string, password: string) => Promise<{ error: string | null }>;
  signIn: (email: string, password: string) => Promise<{ error: string | null }>;
  signOut: () => Promise<void>;
}

const NOT_CONFIGURED = 'Cloud sync isn’t set up on this build yet. Your data stays on this device.';

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  session: null,
  loading: false,
  status: isSupabaseConfigured ? 'signed_out' : 'unconfigured',

  initialize: async () => {
    if (!supabase) {
      set({ status: 'unconfigured' });
      return;
    }
    set({ loading: true });
    const { data } = await supabase.auth.getSession();
    set({
      session: data.session ?? null,
      user: data.session?.user ?? null,
      status: deriveAuthStatus(true, !!data.session),
      loading: false,
    });
    supabase.auth.onAuthStateChange((_event, session) => {
      set({
        session: session ?? null,
        user: session?.user ?? null,
        status: deriveAuthStatus(true, !!session),
      });
    });
  },

  signUp: async (email, password) => {
    if (!supabase) return { error: NOT_CONFIGURED };
    set({ loading: true });
    const { data, error } = await supabase.auth.signUp({ email, password });
    if (!error && data.user) { void syncProfile(data.user); void syncPlan(data.user); void syncPlanProgress(data.user); void syncWorkouts(data.user); void syncCardio(data.user); void syncBodyWeight(data.user); } // sync: profile(18)+plan(19)+progress(20)+workouts(21)+cardio(22)+weight(23)
    set({ loading: false });
    return { error: error?.message ?? null };
  },

  signIn: async (email, password) => {
    if (!supabase) return { error: NOT_CONFIGURED };
    set({ loading: true });
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (!error && data.user) { void syncProfile(data.user); void syncPlan(data.user); void syncPlanProgress(data.user); void syncWorkouts(data.user); void syncCardio(data.user); void syncBodyWeight(data.user); } // sync: profile(18)+plan(19)+progress(20)+workouts(21)+cardio(22)+weight(23)
    set({ loading: false });
    return { error: error?.message ?? null };
  },

  // Clears the remote session only. Local progress is preserved (req 11/15).
  signOut: async () => {
    if (!supabase) return;
    set({ loading: true });
    await supabase.auth.signOut();
    set({ user: null, session: null, status: 'signed_out', loading: false });
  },
}));
