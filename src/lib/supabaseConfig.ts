/**
 * Supabase config (B-17) — PURE helpers, no native/supabase-js imports (node-testable).
 * The app is LOCAL-FIRST: if env vars are missing, auth is simply "unconfigured"
 * and nothing crashes. Real keys live in `.env` (gitignored), not in code.
 */

export function hasSupabaseConfig(url?: string | null, anon?: string | null): boolean {
  return !!(url && String(url).trim() && anon && String(anon).trim());
}

export type AuthStatus = 'unconfigured' | 'signed_out' | 'signed_in';

export function deriveAuthStatus(configured: boolean, hasSession: boolean): AuthStatus {
  if (!configured) return 'unconfigured';
  return hasSession ? 'signed_in' : 'signed_out';
}

/** Shown wherever cloud sync is referenced, so the user knows data is safe locally. */
export const LOCAL_FIRST_MESSAGE =
  'Your workouts are still saved on this device. Cloud sync will be added step by step.';

// Read once at module load. Expo inlines EXPO_PUBLIC_* at build time.
export const SUPABASE_URL: string | null = process.env.EXPO_PUBLIC_SUPABASE_URL ?? null;
export const SUPABASE_ANON_KEY: string | null = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ?? null;

export const isSupabaseConfigured = hasSupabaseConfig(SUPABASE_URL, SUPABASE_ANON_KEY);
