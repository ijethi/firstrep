# EXERCISE_LIBRARY_REVIEW.md — B-11 checker pass

> Reviews the Exercise Library against UX_FLOW.md and DATA_MODEL.md.
> Last updated: 2026-06-29

---

## 1. What it does
A beginner-friendly browse/search/detail experience over the 12 Planet Fitness machines, so a new
user can learn a machine before or during a workout. Local only — no backend/Supabase/auth/AI/video.

## 2. Single source of truth
All exercise data lives in `src/data/exerciseCatalog.ts`. B-11 extended `CatalogExercise` with three
beginner-detail fields (in the catalog, not the screens):
- `primaryMuscles: string[]` — beginner-readable muscles trained
- `commonMistakes: string[]` — mistakes to avoid
- `safetyNote: string` — machine-specific safety note

Screens/components read the catalog; no exercise data is duplicated in UI (verified by inspection).

## 3. Pieces
- `lib/exerciseLibrary.ts` (**pure**): `categoryOf`, `filterExercises(catalog, query, filter)`,
  `alternativeFor`, `CATEGORY_LABEL`.
- `components/SearchBar.tsx`, `components/FilterPill.tsx`, `components/ExerciseLibraryCard.tsx`.
- `screens/ExerciseLibraryScreen.tsx` (list + search + filters), `screens/ExerciseDetailScreen.tsx`.
- Navigation: `ExerciseDetail: { slug }` route added; Library tab now uses `ExerciseLibraryScreen`
  (old placeholder `LibraryScreen.tsx` removed).

## 4. Search & filters (all asserted)
- **Search** matches name, muscle group, plain description, and primary muscles (case-insensitive,
  substring). Empty/whitespace query → all.
- **Filters**: All / Upper body / Lower body / Cardio / Core / Beginner safe. Category derived from
  `muscleGroup` via `categoryOf` (upper = chest/back/shoulders/arms, lower = legs/glutes, cardio, core).
- **Combined** search + filter works (e.g. "treadmill" + Lower → 0).
- **Empty results** handled with friendly copy; no crash (Core → 0 because the seed has no core machine).

## 5. Detail view (requirement 6)
Shows: placeholder image (via existing resolver), name, category, primary muscles, setup steps, form
tips, **beginner mistakes**, **safety notes** (machine-specific + universal "Stop if you feel sharp
pain."), suggested starting guidance, and a tappable **safer alternative** (`altSlug` → push to that
detail). Missing slug/exercise → friendly "Not found" (no crash).

## 6. Images
Uses the existing `getExerciseImage(slug)` resolver. Every slug currently returns null → placeholder
(🏋️ + "Image coming soon") renders without crashing. No real/licensed images, no video (per scope).

## 7. Safety / beginner tone
Copy is non-intimidating and coaching ("Curious about a machine? Look it up before you try it — no
pressure."). Every detail view shows the universal safety line plus the machine's own safety note.

## 8. Maps to DB
`CatalogExercise` (incl. the new fields) maps to the `exercises` table: `primaryMuscles` /
`commonMistakes` / `safetyNote` would be additional columns (text[]/text) or fold into existing
`setup_steps`/`form_tips` jsonb. `altSlug` → `exercises.alt_exercise_id`. No new runtime tables.

## 9. Risks / notes
- Substring search can produce mild false positives (searching "back" also matches "Back of thighs").
  Acceptable for a simple beginner search; documented (was an initial wrong test expectation, not a bug).
- **Core** filter returns nothing because the 12-machine seed has no core machine — handled as a clean
  empty state, not an error.
- `components/ExerciseCard.tsx` (B-01) is now unused by screens but kept as a generic reusable component.

## 10. Tests (executed, pure)
12-exercise catalog completeness (all have the 3 new fields); empty/whitespace query → all; search by
name/muscle/primary-muscle; case-insensitivity; cardio/upper/lower/beginner_safe filters; core → 0;
nonsense query → 0; combined filter → 0; `alternativeFor` resolves; label coverage. **All pass** (one
initial failure was a wrong test expectation re: "Back of thighs"; corrected, code unchanged).

## 11. Verdict
✅ Library lists all catalog machines; search + filters work (incl. empty/no-results); detail shows
setup/form/mistakes/safety/alternative; placeholders render safely; catalog stays the single source of
truth. Scope respected (no Weekly Check-in / full Settings, no backend/AI/video/nutrition/wearable).
