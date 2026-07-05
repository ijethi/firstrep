import type { User } from '@supabase/supabase-js';

import { supabase } from './supabase';
import { decideSyncDirection, answersFromRemote } from './profileSyncCore';
import { useOnboardingStore, toUserProfile, toOnboardingAnswers } from '../state/onboardingStore';
import { useProfileSyncStore } from '../state/profileSyncStore';

/**
 * Profile + onboarding sync (B-18) — the ONLY data synced this loop. Local-first
 * and local-wins: local completed onboarding always pushes; otherwise pull.
 * NEVER clears local data (even on failure). No sessions/sets/cardio/weights/
 * measurements/photos/recommendations/check-ins are touched here.
 */

/** Push local profile + onboarding to Supabase (users / user_profiles / onboarding_answers). */
async function pushLocal(user: User): Promise<void> {
  if (!supabase) return;
  const { answers } = useOnboardingStore.getState();

  const usersRes = await supabase.from('users').upsert({ id: user.id, email: user.email ?? null });
  if (usersRes.error) throw usersRes.error;

  const profRes = await supabase
    .from('user_profiles')
    .upsert({ user_id: user.id, ...toUserProfile(answers) }, { onConflict: 'user_id' });
  if (profRes.error) throw profRes.error;

  // onboarding_answers is an append-log with no unique(user_id); replace the
  // user's row(s) with the current answers so re-syncs don't pile up duplicates.
  const delRes = await supabase.from('onboarding_answers').delete().eq('user_id', user.id);
  if (delRes.error) throw delRes.error;
  const insRes = await supabase
    .from('onboarding_answers')
    .insert({ user_id: user.id, answers: toOnboardingAnswers(answers) });
  if (insRes.error) throw insRes.error;
}

/**
 * Sync profile + onboarding. Safe no-op (disabled) when Supabase is unconfigured
 * or the user is signed out. Errors set status='error' but never touch local data.
 */
export async function syncProfile(user: User | null): Promise<void> {
  const sync = useProfileSyncStore.getState();

  if (!supabase || !user) {
    sync.setDisabled();
    return;
  }

  sync.setSyncing();
  try {
    const { completed } = useOnboardingStore.getState();

    // Read remote presence (latest onboarding_answers + any user_profiles row).
    const oaRes = await supabase
      .from('onboarding_answers')
      .select('answers, created_at')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(1);
    if (oaRes.error) throw oaRes.error;

    const profRes = await supabase
      .from('user_profiles')
      .select('user_id')
      .eq('user_id', user.id)
      .limit(1);
    if (profRes.error) throw profRes.error;

    const remoteAnswersRaw = oaRes.data?.[0]?.answers as Record<string, unknown> | undefined;
    const remoteHasData = !!remoteAnswersRaw || (profRes.data?.length ?? 0) > 0;

    const direction = decideSyncDirection(completed, remoteHasData);

    if (direction === 'push') {
      await pushLocal(user);
    } else if (direction === 'pull' && remoteAnswersRaw) {
      // Pull only when local isn't complete (local-wins). Bring remote answers in.
      useOnboardingStore.getState().importAnswers(answersFromRemote(remoteAnswersRaw), true);
    }
    // 'noop' (or pull with no answers row): nothing to do.

    sync.setSuccess(new Date().toISOString());
  } catch (e) {
    const message = e instanceof Error ? e.message : 'Sync failed. Your data is safe on this device.';
    sync.setError(message);
    // Deliberately do NOT clear or modify any local store on failure.
  }
}
