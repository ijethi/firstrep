# PROGRESS_PHOTO_SYNC_REVIEW.md — B-27 checker pass (FINAL sync step)

> Reviews progress-photo sync (private Storage) against DATA_MODEL.md, SYNC_PLAN.md,
> BODY_PROGRESS_REVIEW.md, and the local persistence pattern. Last updated: 2026-06-29

---

## 1. Scope (SYNC_PLAN step 9 — LAST)
Syncs ONLY `progress_photos` metadata + photo FILES to a PRIVATE Storage bucket. NOT workouts, sets,
cardio, body weight, measurements, weekly check-ins, recommendations, nutrition. No AI/analytics/photo
analysis/comparison. Local-first, privacy-first.

## 2. Pieces
- `lib/progressPhotoSyncCore.ts` (**pure**): `hasSyncablePhotos`, `decidePhotoSyncDirection` (local-wins),
  `localPhotoId` (fs-safe), `storagePath`, `toPhotoRow`, `PROGRESS_PHOTO_BUCKET`, `PHOTO_PULL_SUPPORTED=false`.
- `lib/progressPhotoSync.ts`: `syncProgressPhotos(user)` — upload file → upsert metadata; disabled/safe.
- `state/progressPhotoSyncStore.ts`: status + persisted `lastSyncedAtISO`.
- `components/ProgressPhotoSyncCard.tsx` in Settings; Progress screen privacy copy updated.
- `supabase/migrations/009_progress_photo_sync.sql`: columns + PRIVATE bucket + owner-only object policies.

## 3. Privacy-first (reqs 3–8, 5–6 storage) — verified
- Bucket `progress-photos` is created with **`public=false`** (asserted in migration). No public bucket mode.
- **No public URL is ever produced** — the core exports NO `getPublicUrl`/`publicUrl` helper (asserted);
  metadata stores a storage KEY, not a URL (asserted `storage_path` is not `http(s)://`).
- Objects are user-scoped: `user_id/yyyy-mm-dd/<local_photo_id>.jpg`; the first path segment is the uid.
  Four `storage.objects` policies (select/insert/update/delete) restrict access to
  `(storage.foldername(name))[1] = auth.uid()::text` → **owner-only** authenticated access.
- **No analysis / comparison / AI** — grep confirms only privacy *disclaimer* text, no logic.

## 4. Schema safety — non-destructive migration 009
`progress_photos` already had `storage_path`. `009` adds `local_photo_id`, `storage_bucket` (default
'progress-photos'), `uploaded_at`, `unique(user_id, local_photo_id)`, and creates the private bucket +
policies. NON-DESTRUCTIVE (add-column + bucket/policies; 0 drops/renames/updates; verified). Local id is
fs/object-key safe: `photo-${loggedOnISO with :/. → -}-${angle|none}-${index}`.

## 5. Conflict policy — LOCAL WINS (verified)
`decidePhotoSyncDirection(localHas, remoteHas)`: local present → push (even if remote exists); else pull;
else noop. Asserted (incl. local+remote → push).

## 6. Remote write strategy (reqs 4, fallback) — verified by design
Per photo: **(1) upload the file FIRST** to the private bucket; **(2) only after upload succeeds**, upsert
the `progress_photos` row by `(user_id, local_photo_id)`. If the upload fails → throw, stop, local photo
kept. If metadata write fails after a successful upload → throw (partial), local photo kept. **No local
photo entry is ever deleted or mutated** (req 14).

## 7. PULL deferred (req 12) — verified
Pulling metadata alone does NOT make the file available locally, and we must not claim it is. So
`PHOTO_PULL_SUPPORTED=false` and `syncProgressPhotos` does not apply a pull. Displaying remote photos
(authenticated download / signed-URL gallery) is a future loop.

## 8. Explicit action only (reqs 9, "no upload without explicit action") — decision D20
Photo sync is triggered ONLY by the manual "Sync progress photos" button — it is deliberately NOT wired
into the sign-in auto-sync chain (unlike the other 8 sync steps). Rationale: privacy + bandwidth (photos
are large; auto-uploading on every sign-in would be surprising). Photos come only from the explicit
"Add photo" flow (never temporary/abandoned state), satisfying req 9.

## 9. Local data / no crash (reqs 14–16) — verified
Failure → status set, local photos untouched, app not blocked. `supabase===null` or no user → status
`disabled`, no crash. Card disables when signed out or when there are no photos.

## 10. Progress privacy copy (req 19)
`ProgressPhotoCard` now shows: "Photos stay on this device unless you choose to sync them." The sync card
shows (req 17): "Progress photos are private and only sync to your account. They are not analyzed or shared."

## 11. Secrets
None committed; `.env` gitignored.

## 12. ⚠️ Runtime blocker (honest, per task guidance)
The **local-uri → bytes** step in `uploadPhotoFile` (`fetch(uri).then(r => r.arrayBuffer())`) is the one
part NOT verifiable without a device + provisioned Supabase project. In Expo/RN, reading a `file://` uri
into an ArrayBuffer can be flaky; if it fails on device, the robust fix is `expo-file-system`
`readAsStringAsync(uri, { encoding: Base64 })` → decode to `Uint8Array` → upload. Everything else
(mapping, path generation, private bucket + policies, store, card, privacy copy, migration, conflict
policy) is built and unit-tested. This is documented rather than claimed as fully verified.

## 13. Tests (executed, pure) + typecheck
22 assertions: syncable, direction (incl. local-wins), fs-safe `localPhotoId`, `storagePath` (user-scoped,
private, dated, `.jpg`, no `public`), no public-url helper, `toPhotoRow` (key not URL, pose/taken_on/
bucket/uploaded_at, no local-uri leak), `PHOTO_PULL_SUPPORTED=false`. **All pass.** `tsc --noEmit` clean.
Migration sanity: private bucket + 4 policies, 0 destructive.

## 14. Verdict
✅ Progress photos → PRIVATE Storage; owner-only; no public URLs; no analysis; local-wins metadata;
upload-then-metadata; local photos never deleted/mutated; manual-only (explicit) trigger; safe/disabled
when unconfigured or signed out. Runtime upload path documented as the sole device-verification blocker.
This completes SYNC_PLAN (steps 1–9). Scope strictly respected.
