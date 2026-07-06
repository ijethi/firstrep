-- =============================================================================
-- FirstRep — 009_progress_photo_sync.sql  (B-27, FINAL sync step)
-- NON-DESTRUCTIVE: adds de-dup + bookkeeping columns to progress_photos and
-- creates a PRIVATE Storage bucket with owner-only object policies. No existing
-- table/data is altered or dropped. `storage_path` already exists in 001.
--
-- Privacy-first: the `progress-photos` bucket is PRIVATE (public=false). Objects
-- are user-scoped under `user_id/yyyy-mm-dd/<local_photo_id>.jpg` and readable
-- ONLY by their owner (via authenticated access / signed URLs). No public URLs.
--
-- Scope: progress_photos + the private bucket ONLY. Nothing else is touched.
-- =============================================================================

-- ---- metadata columns -----------------------------------------------------
alter table public.progress_photos add column if not exists local_photo_id text;
alter table public.progress_photos add column if not exists storage_bucket text default 'progress-photos';
alter table public.progress_photos add column if not exists uploaded_at timestamptz;

create unique index if not exists uq_progress_photos_user_local
  on public.progress_photos (user_id, local_photo_id)
  where local_photo_id is not null;

-- ---- private storage bucket ------------------------------------------------
insert into storage.buckets (id, name, public)
values ('progress-photos', 'progress-photos', false)
on conflict (id) do nothing;

-- ---- storage object policies: owner-only (path = user_id/...) --------------
-- The first path segment is the user's uid, so only the owner can touch objects.
create policy "progress_photos_select_own"
  on storage.objects for select to authenticated
  using (bucket_id = 'progress-photos' and (storage.foldername(name))[1] = auth.uid()::text);

create policy "progress_photos_insert_own"
  on storage.objects for insert to authenticated
  with check (bucket_id = 'progress-photos' and (storage.foldername(name))[1] = auth.uid()::text);

create policy "progress_photos_update_own"
  on storage.objects for update to authenticated
  using (bucket_id = 'progress-photos' and (storage.foldername(name))[1] = auth.uid()::text)
  with check (bucket_id = 'progress-photos' and (storage.foldername(name))[1] = auth.uid()::text);

create policy "progress_photos_delete_own"
  on storage.objects for delete to authenticated
  using (bucket_id = 'progress-photos' and (storage.foldername(name))[1] = auth.uid()::text);

-- =============================================================================
-- End 009_progress_photo_sync.sql
-- =============================================================================
