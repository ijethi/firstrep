import type { User } from '@supabase/supabase-js';

import { supabase } from './supabase';
import {
  decidePhotoSyncDirection,
  hasSyncablePhotos,
  PROGRESS_PHOTO_BUCKET,
  storagePath,
  toPhotoRow,
} from './progressPhotoSyncCore';
import * as FileSystem from 'expo-file-system';

import { base64ToUint8Array } from './base64';
import { useProgressStore } from '../state/progressStore';
import { useProgressPhotoSyncStore } from '../state/progressPhotoSyncStore';

/**
 * Progress photo sync (B-27, FINAL) — uploads local photo FILES to a PRIVATE
 * Storage bucket, then upserts progress_photos metadata. Local-first, LOCAL WINS.
 * PRIVACY-FIRST: private bucket only, no public URLs, no analysis/comparison.
 * Never deletes/mutates local photo entries (even on failure). Touches ONLY
 * progress_photos + the private bucket. Runs on explicit user action (no auto
 * upload on sign-in). PULL deferred.
 *
 * Upload adapter (B-28): reads the local file as base64 via expo-file-system and
 * decodes to a Uint8Array — the Supabase-RN-recommended path (avoids the flaky
 * `fetch(uri).blob()/arrayBuffer()` on Expo). The base64→bytes decode is pure and
 * unit-tested; the FileSystem read + Storage upload still need device verification.
 */

/** Upload one local photo file to the private bucket. Metadata is written only after this succeeds. */
async function uploadPhotoFile(uri: string, path: string): Promise<void> {
  if (!supabase) return;
  const base64 = await FileSystem.readAsStringAsync(uri, {
    encoding: FileSystem.EncodingType.Base64,
  });
  const bytes = base64ToUint8Array(base64);
  const { error } = await supabase.storage
    .from(PROGRESS_PHOTO_BUCKET)
    .upload(path, bytes, { contentType: 'image/jpeg', upsert: true });
  if (error) throw error;
}

async function pushPhotos(user: User): Promise<void> {
  if (!supabase) return;
  const photos = useProgressStore.getState().photos;
  if (photos.length === 0) return;

  for (let i = 0; i < photos.length; i += 1) {
    const entry = photos[i];
    const path = storagePath(user.id, entry, i);

    // 1) Upload the file FIRST (req 4). If it fails → stop; local photo is kept.
    await uploadPhotoFile(entry.uri, path);

    // 2) Only after upload succeeds, upsert the metadata row.
    const up = await supabase
      .from('progress_photos')
      .upsert(toPhotoRow(entry, i, user.id, new Date().toISOString()), {
        onConflict: 'user_id,local_photo_id',
      });
    if (up.error) throw up.error; // partial: file up, metadata failed — local photo untouched
  }
}

export async function syncProgressPhotos(user: User | null): Promise<void> {
  const sync = useProgressPhotoSyncStore.getState();

  if (!supabase || !user) {
    sync.setDisabled();
    return;
  }

  sync.setSyncing();
  try {
    const localHas = hasSyncablePhotos(useProgressStore.getState().photos);

    const remoteRes = await supabase.from('progress_photos').select('id').eq('user_id', user.id).limit(1);
    if (remoteRes.error) throw remoteRes.error;
    const remoteHas = (remoteRes.data?.length ?? 0) > 0;

    const direction = decidePhotoSyncDirection(localHas, remoteHas);
    if (direction === 'push') {
      await pushPhotos(user);
    }
    // 'pull' DEFERRED — metadata alone isn't a displayable local photo (req 12).
    // 'noop' → nothing to do.

    sync.setSuccess(new Date().toISOString());
  } catch (e) {
    const message =
      e instanceof Error ? e.message : 'Photo sync failed. Your photos are safe on this device.';
    sync.setError(message);
    // NEVER delete or modify local photo entries on failure.
  }
}
