import type { ProgressPhotoEntry } from '../types/database';

/**
 * Progress photo sync core (B-27) — PURE mapping + path helpers (node-testable).
 * Syncs ONLY progress_photos metadata + private Storage paths. Conflict policy:
 * LOCAL WINS. PRIVACY-FIRST: paths are user-scoped in a PRIVATE bucket; nothing
 * here produces a public URL, and no photo is analyzed or compared.
 */

export const PROGRESS_PHOTO_BUCKET = 'progress-photos';

export type PhotoSyncDirection = 'push' | 'pull' | 'noop';

export function hasSyncablePhotos(photos: ProgressPhotoEntry[]): boolean {
  return photos.length > 0;
}

/** Local-wins: local photos present → push (even if remote exists); else pull; else noop. */
export function decidePhotoSyncDirection(localHas: boolean, remoteHas: boolean): PhotoSyncDirection {
  if (localHas) return 'push';
  if (remoteHas) return 'pull';
  return 'noop';
}

/** Filesystem/object-key-safe deterministic id from immutable fields. */
export function localPhotoId(entry: ProgressPhotoEntry, index: number): string {
  const safeIso = entry.loggedOnISO.replace(/[:.]/g, '-');
  const angle = entry.angle ?? 'none';
  return `photo-${safeIso}-${angle}-${index}`;
}

/**
 * User-scoped object path in the PRIVATE bucket:
 *   `${userId}/${yyyy-mm-dd}/${localPhotoId}.jpg`
 * The first segment is the uid, which the Storage RLS uses for owner-only access.
 */
export function storagePath(userId: string, entry: ProgressPhotoEntry, index: number): string {
  const date = entry.loggedOnISO.slice(0, 10);
  return `${userId}/${date}/${localPhotoId(entry, index)}.jpg`;
}

export interface PhotoRow {
  user_id: string;
  storage_path: string; // key in the private bucket — NOT a public url
  storage_bucket: string;
  pose: string | null; // front/side/back
  taken_on: string; // date portion of loggedOnISO
  uploaded_at: string;
  local_photo_id: string;
}

/** Metadata row for progress_photos. Written ONLY after the file upload succeeds. */
export function toPhotoRow(
  entry: ProgressPhotoEntry,
  index: number,
  userId: string,
  uploadedAtISO: string,
): PhotoRow {
  return {
    user_id: userId,
    storage_path: storagePath(userId, entry, index),
    storage_bucket: PROGRESS_PHOTO_BUCKET,
    pose: entry.angle,
    taken_on: entry.loggedOnISO.slice(0, 10),
    uploaded_at: uploadedAtISO,
    local_photo_id: localPhotoId(entry, index),
  };
}

/**
 * PULL is DEFERRED. Pulling metadata alone does NOT make the photo file available
 * locally, and we must not claim it is (req 12). Displaying remote photos would
 * need authenticated download / signed-URL handling — a future loop. Push (upload
 * + metadata) is the deliverable here.
 */
export const PHOTO_PULL_SUPPORTED = false;
