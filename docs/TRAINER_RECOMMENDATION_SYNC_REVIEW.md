# TRAINER_RECOMMENDATION_SYNC_REVIEW.md — B-26 checker pass

> Reviews trainer-recommendation sync against DATA_MODEL.md, SYNC_PLAN.md,
> TRAINER_ENGINE_REVIEW.md, and the local persistence pattern. Last updated: 2026-06-29

---

## 1. Scope (SYNC_PLAN step 8)
Syncs ONLY `trainer_recommendations`. NOT progress photos, weekly check-ins, workouts, sets, cardio,
body weight, measurements, nutrition. No AI/analytics/photo-upload. Local-first.

## 2. Pieces
- `lib/trainerRecommendationSyncCore.ts` (**pure**): `hasSyncableRecs`, `decideRecSyncDirection`
  (local-wins), `localRecId`, `toRecRow(s)`, `recFromRow(s)`, `REC_PULL_SUPPORTED=true`.
- `lib/trainerRecommendationSync.ts`: `syncTrainerRecommendations(user)` push / safe pull / disabled.
- `state/trainerRecommendationSyncStore.ts`: status + persisted `lastSyncedAtISO`.
- Reuses `recommendationStore.setRecommendations` for the pull path (no new store helper).
- `components/TrainerRecommendationSyncCard.tsx` in Settings; `authStore` triggers on sign-in/up.

## 3. Schema safety — non-destructive migration 008
The DB `trainer_recommendations` has `rule_id/message/action/source/context_*` but NO columns for
`type/title/next_action/priority/generated_at`, and its `source` check is `('rule_engine','llm')` — it
can't hold the local `'rule_based'`. To preserve everything, `008` adds `payload jsonb` +
`local_recommendation_id text` + `unique(user_id, local_recommendation_id)`. NON-DESTRUCTIVE (2
add-column, 0 drops/renames/updates; verified). Local id:
`rec:${generatedAtISO}:${ruleId}:${exerciseId|none}:${index}`.

## 4. Conflict policy — LOCAL WINS (verified)
`decideRecSyncDirection(localHas, remoteHas)`: local present → push (even if remote exists); else pull;
else noop. Asserted (incl. local+remote → push).

## 5. Data rules — all fields preserved, meaning unchanged (verified)
`toRecRow` preserves (data rules): `rule_id`, `recommendation_type`, `exercise_id` (slug), `title`,
`message`, `next_action`, `priority`, `generated_at`, `source='rule_based'`. Storage:
- Derived/queryable columns: `rule_id`, `message`, `action` jsonb ({ type, priority, nextAction,
  exerciseId }), `source='rule_engine'` (DB enum), `context_type` (set/weekly/session, derived).
- **`payload` (authoritative):** the full `TrainerRec`, incl. the original `source='rule_based'` and the
  slug `exerciseId` (kept here since `context_id` is a uuid). Pull reads `payload`, so **no meaning is
  changed** (asserted: reconstructed `source==='rule_based'`).
- **Not regenerated:** sync only READS `recommendationStore.recommendations`; it never calls
  `generateRecommendations`. No AI logic added.

## 6. `source` and `context_id` mapping (documented)
- Local `source='rule_based'` → DB `source='rule_engine'` (the enum has no 'rule_based'); the original is
  preserved in `payload.source`. This matches the mapping noted in SUPABASE_AUTH_REVIEW / TRAINER_ENGINE_REVIEW.
- Local `exerciseId` is a **slug**, not a uuid, so it is NOT written to the uuid `context_id` (null) — it
  lives in `payload.exerciseId` (and `action.exerciseId`).

## 7. Push / pull
- **Push:** `upsert(toRecRows(list, user.id), { onConflict: 'user_id,local_recommendation_id' })`.
- **Pull (SAFE via payload):** `recFromRow` reconstructs from `payload`; rows with no/invalid payload
  (bad type/priority) are dropped (asserted). Applied ONLY when local is empty, via `setRecommendations`.

## 8. Local recs never mutated on failure (req 11, checker) — verified
`syncTrainerRecommendations`/`pushRecs` only READ `recommendationStore.recommendations` on push. Pull
overwrites only when local is empty. On ANY error → status set, return; local untouched (req 11). App
never blocked (req 12).

## 9. Missing config / signed out (req 13 — verified)
`supabase === null` or no `user` → status `disabled`, returns, no crash. Card disables the button.

## 10. Settings + status + persistence (req 14, 15)
`TrainerRecommendationSyncCard` — "Sync trainer recommendations" + status + last-synced + exact copy:
"Only trainer recommendations sync here. Progress photos stay on this device for now." `lastSyncedAtISO`
persisted (B-10 pattern; hydration + reset wired).

## 11. Secrets
None committed; `.env` gitignored.

## 12. Tests (executed, pure) + typecheck
26 assertions: syncable, direction (incl. local-wins), deterministic `localRecId` (with/without
exercise), `toRecRow` (all fields preserved, source-enum mapping, payload keeps rule_based, action jsonb,
context_type derivation, context_id null), `recFromRow`/`recsFromRows` safe pull + defenses (no/invalid
payload, null), `REC_PULL_SUPPORTED=true`. **All pass.** `tsc --noEmit` clean. Migration sanity: 2
add-column, 0 destructive.

## 13. Verdict
✅ Trainer recommendations only; local-wins; all 9 fields preserved with no reinterpretation; not
regenerated; source/context mappings documented; clean upsert; SAFE pull (only when local empty);
non-destructive migration; local recs never mutated; safe/disabled when unconfigured or signed out;
failures never erase recs. Scope strictly respected.
