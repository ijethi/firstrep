# LOOP_STATE.md — Living memory of the build

> The single place that answers: **What's done? What's next? What's blocked?**
> Updated at the END of every development loop. Read at the START of every loop.
> Last updated: 2026-06-28

---

## Current loop
- **Loop #:** 3 — **B-03 Onboarding quiz (local state only)**
- **Goal of this loop:** 11-step beginner onboarding quiz; answers in local Zustand store; land on Today. No Supabase/auth/AI/plan-gen.
- **Success condition:** Starts at onboarding; forward/back nav; required fields enforced; answers stored locally; lands on Today with the "plan is ready" message; typecheck clean.
- **Ceiling:** Max 3 fix attempts. (Used: 0 — passed on first checker pass.)
- **Status:** ✅ Complete — awaiting approval for B-04 (plan generation).

### Loop 3 verification (maker-checker)
| Gate | Result |
|------|--------|
| 11 questions present | ✅ unit, goal, sex, age, height, current wt, goal wt, experience, days/wk, duration, injuries |
| Progress indicator | ✅ bar + "Step X of 11" |
| Back / Continue | ✅ Back hidden on step 1; Continue→"Finish" on last |
| Required-field validation | ✅ Continue disabled until step valid; injuries needs explicit choice ('None' counts) |
| Local storage | ✅ Zustand `useOnboardingStore` (no persistence — resets on reload, expected) |
| Lands on Today | ✅ `navigation.replace('Main')` on finish |
| Today message | ✅ "Your beginner plan is ready 🎉 / Next step: generate your Week 1 workout." |
| Maps to Supabase shape | ✅ `toUserProfile()` (kg/cm canonical, age→age_range) + `toOnboardingAnswers()`; `normalizeInjuries` strips 'none' sentinel |
| No backend/Supabase/auth/AI/plan-gen | ✅ |
| `npx tsc --noEmit` | ✅ TYPECHECK PASSED |

### Loop 2 verification (maker-checker)
| Gate | Result |
|------|--------|
| Tables in migration | ✅ 15 / 15 |
| RLS enabled / policies | ✅ 15 enabled, 15 policies (users + 10 owner + exercises read + 3 child-via-parent) |
| Seed exercises | ✅ 12 PF machines, placeholder image keys, idempotent (ON CONFLICT) |
| `npx tsc --noEmit` | ✅ TYPECHECK PASSED (types in src/types/database.ts) |
| Schema vs DATA_MODEL.md | ✅ all tables/cols/FKs match |
| FKs / cascade behavior | ✅ cascade on plan/session children; restrict on exercise_id; set null on back-refs |
| No nutrition / no AI beyond trainer_recommendations | ✅ |
| No live Supabase project | ✅ files only |
| ⚠️ Open decision | Lift loads stored in **lb** (body metrics in kg/cm) — see SCHEMA_REVIEW §4, needs sign-off |

### B-01 (Loop 1) — ✅ Complete
- App builds, navigable, typecheck clean. (Full Metro device run not executed here — verify with `npx expo start`.)

### Loop 1 verification (maker-checker)
| Gate | Result |
|------|--------|
| `npm install` | ✅ 901 packages, no errors (deprecation warnings only) |
| `npx tsc --noEmit` | ✅ TYPECHECK PASSED (strict) — no broken imports |
| `npx expo config` | ✅ valid (SDK 52, "FirstRep") |
| Navigation | ✅ Onboarding → Main tabs (Today/Progress/Library/Settings); Today → WorkoutGuide → back |
| Screens vs UX_FLOW | ✅ all 6 use beginner copy from UX_FLOW.md |
| Backend/Supabase/AI | ✅ none (as required) |
| Full Metro runtime on device | ⚠️ NOT run here (long-running). Static checks pass; user can verify with `npx expo start`. |

---

## Done
| Date | Item | Notes |
|------|------|-------|
| 2026-06-28 | Project root chosen | `C:\gym1` |
| 2026-06-28 | PRODUCT_SPEC.md | MVP scope, persona, stack, metrics |
| 2026-06-28 | UX_FLOW.md | 11 screens fully specified |
| 2026-06-28 | DATA_MODEL.md | 15 tables + relationships + RLS notes |
| 2026-06-28 | TRAINER_LOGIC.md | Rule engine v1, 6 core rules formalized |
| 2026-06-28 | FEATURE_BACKLOG.md | Prioritized, sliced into loop-sized tasks |
| 2026-06-28 | CURSOR_RULES.md | AI/dev conventions + connector boundaries |
| 2026-06-28 | Q1–Q4 baked in | D6–D9 added; docs updated (TRAINER_LOGIC R7 soft-unlock) |
| 2026-06-28 | **B-01 scaffold** | Expo+RN app, nav shell, 6 screens, tokens, 4 components — typecheck clean |
| 2026-06-28 | **B-02 schema (SQL files)** | 15-table migration + seed (12 machines) + TS types + SCHEMA_REVIEW — typecheck clean |
| 2026-06-28 | **B-03 onboarding quiz** | 11-step wizard, Zustand store, 5 reusable quiz components, Today "ready" message — typecheck clean |

### B-03 files created / changed
- NEW `src/state/onboardingStore.ts` — Zustand store, canonical kg/cm, `toUserProfile`/`toOnboardingAnswers`/`normalizeInjuries`/`ageToRange`
- NEW `src/components/onboarding/{ChoiceGroup,MultiChoiceGroup,NumberField,WeightField,HeightField}.tsx` + `index.ts`
- CHANGED `src/screens/OnboardingScreen.tsx` — single welcome → 11-step wizard
- CHANGED `src/screens/TodayScreen.tsx` — reads store, shows "plan ready / next step" + input summary
- CHANGED `package.json` — added `zustand`

### B-02 files created
- `supabase/migrations/001_initial_schema.sql` — 15 tables, FKs, 19 indexes, RLS (15 policies), updated_at trigger
- `supabase/seed.sql` — 12 PF beginner machines, placeholder image keys, alt_exercise_id links, idempotent
- `src/types/database.ts` — app-facing types for the 10 requested entities + shared unions + TrainerAction
- `docs/SCHEMA_REVIEW.md` — purpose, relationships, MVP vs future, risks, next-loop tests

### B-01 files created
- Config: `package.json`, `app.json`, `tsconfig.json`, `babel.config.js`, `index.ts`, `.gitignore`
- Entry/nav: `src/App.tsx`, `src/navigation/RootNavigator.tsx`, `src/navigation/types.ts`
- Theme: `src/theme/tokens.ts`, `src/theme/index.ts`
- Lib: `src/lib/units.ts` (D7 imperial-first), `src/images/exerciseImages.ts` (D8 resolver)
- Components: `src/components/{AppButton,ScreenContainer,ProgressCard,ExerciseCard}.tsx` + `index.ts`
- Screens: `src/screens/{Onboarding,Today,WorkoutGuide,Progress,Library,Settings}Screen.tsx`

## Reprioritized sequence (per D12 — auth moved late)
Onboarding ✅ → **Plan generation (next)** → Today (real plan) → Workout guide → Set logging → *then* Auth + Supabase wiring.

## Next task (single, after approval)
> Per the loop rule: pick ONE item from FEATURE_BACKLOG.md, write a mini-spec, build, check, update this file, STOP.
- **Proposed next:** Plan generation (FEATURE_BACKLOG **B-06**, called "B-04" in user's sequence) — pure function: onboarding answers → a Week-1 (or 4-week) beginner plan in local state. Injury-safe filter via `alt_exercise_id`. Imperial-first, lb loads. Still local only, no Supabase.
- Awaiting user go-ahead.

## Decisions log
| # | Decision | Rationale | Date |
|---|----------|-----------|------|
| D1 | RN + Expo managed | Fastest path to device, OTA updates | 2026-06-28 |
| D2 | Supabase over custom backend | Auth + DB + Storage + RLS in one, connector-ready | 2026-06-28 |
| D3 | Rule-based trainer FIRST, AI later behind interface | De-risk MVP, no LLM cost/latency dependency | 2026-06-28 |
| D4 | Zustand for session state | Live set-by-set state is local & ephemeral | 2026-06-28 |
| D5 | Imperial (lb) default | PF is US-centric; unit toggle deferred (see Q2) | 2026-06-28 |
| D6 | Q1: **Soft-unlock** Week 2, never hard-block | Beginners shouldn't be locked out; <3 workouts → allow Week 2 but recommend repeating Week 1 | 2026-06-28 |
| D7 | Q2: **Imperial-first UI**, kg/cm canonical storage, convert at edge; kg/lb toggle later | PF machines show lb; keep math/charts consistent | 2026-06-28 |
| D8 | Q3: **Placeholder image system** via resolver (`getExerciseImage(slug)`) | Swap to licensed/custom illustrations later with zero screen/component changes | 2026-06-28 |
| D9 | Q4: Keep **"FirstRep"** as temporary name | — | 2026-06-28 |
| D10 | Body metrics canonical **kg/cm**; lift loads in **lb** — ✅ CONFIRMED by user | PF lb-first; 5 lb beginner progression. Sign-off received. | 2026-06-28 |
| D11 | **No Supabase provisioning yet** | Keep building UI/logic on local state until core flow feels right | 2026-06-28 |
| D12 | **Auth deferred** until after onboarding + plan-gen + Today + workout guide + set logging | Validate the core beginner experience before adding accounts | 2026-06-28 |
| D13 | Onboarding/session use **Zustand** local stores (no persistence yet) | Matches stack; persistence + Supabase sync come with auth loop | 2026-06-28 |

## Open questions (need user input)
| # | Question | Status |
|---|----------|--------|
| Q1 | Week 2 gating | ✅ RESOLVED → soft-unlock + recommend repeat if <3 (D6) |
| Q2 | Units | ✅ RESOLVED → imperial-first UI, kg/cm canonical (D7) |
| Q3 | Machine images | ✅ RESOLVED → placeholder resolver system (D8) |
| Q4 | App name | ✅ RESOLVED → keep "FirstRep" (D9) |

## Bugs / issues
- None yet (no code).

## Blockers
- None. Awaiting approval to begin code loop B-01.
