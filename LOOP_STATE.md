# LOOP_STATE.md — Living memory of the build

> The single place that answers: **What's done? What's next? What's blocked?**
> Updated at the END of every development loop. Read at the START of every loop.
> Last updated: 2026-06-28

---

## Current loop
- **Loop #:** 17 — **B-17 Supabase auth foundation + sync planning**
- **Goal of this loop:** Supabase auth (sign up/in/out, session restore, best-effort profile upsert) while staying local-first; safe not-configured state; sync-order doc. NO data sync.
- **Success condition:** runs with env missing (safe not-configured); sign up/in/out when configured; local data preserved on sign-in/out; profile upsert best-effort; Settings shows auth status; no secrets committed; typecheck + auth-config assertions pass.
- **Ceiling:** Max 3 fix attempts. (Used: 0 — passed on first checker pass.)
- **Status:** ✅ Complete — awaiting approval for B-18.

### Loop 17 verification (maker-checker — typecheck + 13 executed assertions)
| Gate | Result |
|------|--------|
| `npx expo install @supabase/supabase-js react-native-url-polyfill` | ✅ 2.110.0 / 3.0.0 |
| `npx tsc --noEmit` | ✅ PASSED |
| Missing env → safe not-configured (no crash) | ✅ client null; status 'unconfigured'; guarded actions (asserted) |
| Sign up / in / out wired (email+password) | ✅ authStore + SignIn/SignUp screens |
| Session restore on launch | ✅ App.initialize(); onAuthStateChange subscription |
| **Local data preserved on sign-in/out** | ✅ authStore never touches local stores; only Reset wipes |
| Profile upsert best-effort (non-destructive) | ✅ try/catch users + user_profiles (only if configured + onboarded) |
| Settings shows auth status | ✅ AuthStatusCard |
| No secrets committed | ✅ `.env` gitignored (verified); `.env.example` placeholders only |
| Local-first copy | ✅ LOCAL_FIRST_MESSAGE on screens + card |
| No data sync of sessions/sets/photos/etc | ✅ (SYNC_PLAN.md defines future order) |
| Schema `users` naming risk | ✅ documented, non-destructive proposal deferred |
| No AI/nutrition/analytics/wearable/photo-upload | ✅ |

### Loop 16 verification (maker-checker — typecheck + 17 executed assertions)
| Gate | Result |
|------|--------|
| `npx expo install expo-haptics` | ✅ ~14.0.1 |
| `npx tsc --noEmit` | ✅ PASSED |
| Disclaimer acknowledged once + persisted | ✅ safetyStore persist; SafetyIntro before onboarding |
| First-run routing | ✅ `initialRouteName` all 4 cases asserted; RootNavigator uses it |
| Disclaimer copy beginner-friendly, not medical | ✅ exact copy; no diagnose/treat/legal/diet terms (asserted) |
| Start reminder in workout flow | ✅ "Start light today…" on first step |
| Clearer pain copy | ✅ SetLogger "sharp pain" + PAIN_HELP; progression logic unchanged |
| Rest timer polish (Restart/+15s/Skip + haptic) | ✅ + `.catch` for unsupported platforms |
| No stale auto-advance after reload | ✅ countdown transient, never persisted |
| Settings Safety Tips | ✅ 4 tips + disclaimer |
| Reset clears acknowledgment | ✅ resetAppData + storage key; routes to SafetyIntro |
| No backend/Supabase/auth/AI/nutrition/analytics/wearable/photo-upload | ✅ |

### Loop 15 verification (maker-checker — typecheck + 22 executed assertions)
| Gate | Result |
|------|--------|
| `npx tsc --noEmit` | ✅ PASSED (after 1 fix) |
| Session persisted (partialize {session}) | ✅ + version/migrate; NO rest-timer state persisted |
| Reload detects unfinished session | ✅ `isInProgress`; store in hydration gate |
| Today resume prompt (Continue/End/Discard) | ✅ `ResumeWorkoutCard` |
| Resume at right exercise/set | ✅ `resumeStepIndex` clamps; WorkoutGuide inits step from it |
| Rest timer no stale auto-advance | ✅ `resting` transient, resets false on remount |
| End → abandoned (not completed) | ✅ `concludeSession('abandoned')` |
| Discard → clears live session only | ✅ `clearSession()`, no history/summary |
| Completed still saves to history + advances plan | ✅ shared `concludeSession('completed')` |
| Abandoned/discarded do NOT advance plan | ✅ markDayComplete only in completed branch (asserted) |
| Corrupt/regenerated-plan session | ✅ conservative "couldn't safely resume" + Clear (asserted) |
| Reset clears saved live session | ✅ resetAppData + storage key |
| No backend/Supabase/auth/AI/nutrition/analytics/wearable/photo-upload | ✅ |

### Loop 14 verification (maker-checker — typecheck + 12 executed assertions)
| Gate | Result |
|------|--------|
| `npx expo install expo-image-picker` | ✅ ~16.0.6 |
| `npx tsc --noEmit` | ✅ PASSED |
| Log waist/chest/hips (cm canonical) | ✅ input in unit → inToCm; display formatLength |
| Latest + change since first (per metric) | ✅ needs ≥2 readings (asserted) |
| Units don't corrupt canonical cm | ✅ toggle = display only |
| Add local progress photo | ✅ expo-image-picker; stores local uri only (never uploaded) |
| Latest photo + recent grid | ✅ newest-first, ≤6 |
| Privacy + encouraging + empty copy | ✅ "stay on this device" / "scale misses" / no-pressure empties |
| Persistence (B-10 pattern) | ✅ measurements+photos in progressStore partialize + clear |
| Maps to DB | ✅ body_measurement_logs / progress_photos (uri→storage_path later) |
| Empty states / picker cancel / bad uri | ✅ no crash |
| No backend/Supabase/auth/AI/nutrition/analytics/wearable/photo-analysis | ✅ |

### Loop 13 verification (maker-checker — typecheck + 11 executed assertions)
| Gate | Result |
|------|--------|
| `npx tsc --noEmit` | ✅ PASSED (after 1 fix) |
| Settings shows real profile + prefs | ✅ profile summary + units + days + duration + injuries |
| Edit units (display only, no corruption) | ✅ toggle flips unit_pref; canonical kg/cm unchanged |
| Edit days/duration/injuries + confirm | ✅ confirm alert → regenerate `generatePlan` |
| Regenerate keeps history | ✅ only planStore/planProgress touched; progressStore + weeklyCheckIn untouched |
| Reset progress only on structure (days) change | ✅ duration/injury keep progress; days change resets (asserted) |
| Machine guide → Exercise Detail | ✅ ExerciseStepCard `onOpenGuide`; WorkoutGuide + tappable Today rows |
| No exercise-instruction duplication in Settings | ✅ detail stays source of truth |
| Persistence (B-10 pattern) | ✅ via setAnswer/setPlan (persisted) |
| Partial profile no crash | ✅ "—" fallbacks; null-safe decide (asserted) |
| No backend/Supabase/auth/AI/nutrition/analytics/wearable | ✅ |

### Loop 12 verification (maker-checker — typecheck + 13 executed assertions)
| Gate | Result |
|------|--------|
| `npx tsc --noEmit` | ✅ PASSED |
| Persisted store (same B-10 pattern) | ✅ weeklyCheckInStore persist + key + hydration + reset |
| All 6 questions present | ✅ workouts/energy/soreness/confidence/barriers/small goal |
| Rule-based message (req 9) | ✅ 0 / 1–2 / 3+ + high-soreness + low-confidence (asserted) |
| Open from Today AND Progress | ✅ WeeklyCheckInCard on both → WeeklyCheckIn route |
| Latest summary on Progress | ✅ card shows latest + coaching |
| Empty state / partial data | ✅ `latestCheckIn([])`→null prompt; Save gated until required answered |
| Maps to `weekly_checkins` | ✅ `toWeeklyCheckinRow` categorical→1–5 ints (asserted) |
| No plan modification (req 10) | ✅ |
| No backend/Supabase/auth/AI/nutrition/analytics/wearable | ✅ |

### Loop 11 verification (maker-checker — typecheck + executed assertions)
| Gate | Result |
|------|--------|
| `npx tsc --noEmit` | ✅ PASSED |
| Catalog = single source of truth | ✅ added primaryMuscles/commonMistakes/safetyNote to catalog; screens read it |
| Lists all 12 machines | ✅ |
| Search (name/muscle/primary muscle, case-insensitive) | ✅ asserted |
| Filters (all/upper/lower/cardio/core/beginner_safe) | ✅ asserted; core → 0 empty handled |
| Empty / whitespace / nonsense query | ✅ all-or-none, no crash |
| Detail view (setup/form/mistakes/safety/guidance/alt) | ✅ + universal "Stop if you feel sharp pain." |
| Missing image keys | ✅ placeholder renders, no crash |
| Alternative (altSlug) tappable | ✅ push to that detail |
| Maps to DB (`exercises`) | ✅ new fields + alt_exercise_id |
| No backend/Supabase/auth/AI/nutrition/analytics/wearable/video | ✅ |

### Loop 10 verification (maker-checker — typecheck + 11 executed assertions)
| Gate | Result |
|------|--------|
| `npx expo install async-storage` | ✅ 1.23.1 (Expo-pinned) |
| `npx tsc --noEmit` | ✅ PASSED |
| 5 stores persisted (partialize = data only) | ✅ onboarding/plan/planProgress/progress/recommendation |
| Live session NOT persisted | ✅ workoutSessionStore unchanged; WorkoutGuide guards null |
| Version + migration | ✅ version 1; `migratePersisted` identity (asserted) |
| Hydration gate (no flicker) | ✅ `useAppHydrated` waits for all; App shows LoadingScreen; RootNavigator initialRoute from persisted `completed` |
| Reset works | ✅ `resetLocalAppData` clears keys + resets stores; Settings button + confirm |
| JSON-safe snapshots | ✅ all 5 round-trip through JSON (asserted) |
| Maps to Supabase | ✅ same view models as earlier loops |
| Base plan not mutated | ✅ unaffected |
| No backend/Supabase/auth/AI/nutrition/analytics/wearable | ✅ |

### Loop 9 verification (maker-checker — typecheck + 20 executed assertions)
| Gate | Result |
|------|--------|
| `npx tsc --noEmit` | ✅ PASSED |
| `getPlanProgress` PURE / no mutation | ✅ base plan unchanged after call (asserted) |
| No completed → W1D1 | ✅ |
| Completed one → next day | ✅ current=W1D2, next=W1D3 |
| Completed a week → next week D1 | ✅ current=W2D1, currentWeek=2, week strip follows |
| Completed all 4 weeks → complete state | ✅ isPlanComplete; Today shows completion banner + repeat/new-plan |
| Preview another day | ✅ selection honored; current stays recommended; preview copy shown |
| Start uses selected day (not W1D1) | ✅ `startSession(selectedDay)` → WorkoutGuide {week,dayNumber} |
| Completion advances; abandoned does NOT | ✅ markDayCompleted only in `status==='completed'` branch |
| Adaptive recs apply to selected day | ✅ WorkoutGuide applies to started day |
| Summary shows completed + next workout | ✅ |
| No plan / unknown ids | ✅ no crash; unknown ids ignored |
| Maps to DB | ✅ completedDayIds→workout_days; sessions→workout_sessions |
| No backend/Supabase/auth/AI/nutrition/analytics/wearable/Library/Settings | ✅ |

### Loop 8 verification (maker-checker — typecheck + 11 executed assertions)
| Gate | Result |
|------|--------|
| `npx tsc --noEmit` | ✅ PASSED |
| Applicator is PURE / view-layer | ✅ returns NEW AdaptiveDay; base day + planStore untouched (asserted) |
| increase_weight → +5 lb | ✅ 30→35 with "5 lb more" copy |
| pain_safety → no increase + warning | ✅ stays at last weight; safety warning shown |
| **pain priority** | ✅ pain wins even if increase rec also present (asserted) |
| reduce_weight → −5 lb + floor | ✅ 30→25; floors at safe min 10 |
| repeat_weight / skip_repeat | ✅ same weight / lighter practice framing |
| Empty history / null day | ✅ base guidance kept; null→null (no crash) |
| increase w/o prior weight | ✅ keeps base guidance (safe) |
| Today reflects adaptive hint | ✅ per-exercise hint line |
| WorkoutGuide reflects adaptive | ✅ ExerciseStepCard why+safety; SetLogger pre-fills suggested weight |
| Maps to DB | ✅ adaptiveWeightLb→workout_exercises.suggested_weight_lb; why/safety→trainer_recommendations.action |
| No backend/Supabase/auth/AI/nutrition/analytics/wearable | ✅ |

### Loop 7 verification (maker-checker — typecheck + executed assertions)
| Gate | Result |
|------|--------|
| `npx tsc --noEmit` | ✅ PASSED |
| Stats are PURE | ✅ `lib/progressStats.ts`, no IO/Date.now |
| totalWorkouts / streak / sets / cardio / exercises | ✅ asserted (2-day fixture: 2/2/6/40/3) |
| Skipped exercise handling | ✅ excluded from exercisesCompleted; sessions count reflects it |
| Strength best/recent/learning | ✅ best=35 recent=35 sessions=2 learning=false; sparse → learning=true |
| Cardio totals + recent machine | ✅ total/best/recent asserted |
| Streak breaks on gap | ✅ non-consecutive → 1 |
| Abandoned session | ✅ 0 workouts but sets still counted |
| Body weight (kg canonical) | ✅ change=−1.5 kg; lb-first input → kg |
| Empty states (no crash) | ✅ null/empty → zeros/nulls; UI empty copy for no-workout & no-weight |
| Encouraging copy (not clinical) | ✅ asserted no "insufficient/metric unavailable" |
| Maps to DB tables | ✅ history→workout_sessions/exercise_sets/cardio_logs; weights→body_weight_logs |
| No backend/Supabase/auth/AI/nutrition/wearable/charts | ✅ |

### Loop 6 verification (maker-checker — typecheck + 15 executed assertions)
| Gate | Result |
|------|--------|
| `npx tsc --noEmit` | ✅ PASSED |
| Engine is PURE | ✅ no Date/random/IO; identical output for identical input (asserted) |
| R1 pain override | ✅ pain → pain_safety, beats progression, sorted FIRST (priority 'safety') |
| R2 increase | ✅ all sets + top reps + easy/good → +5 lb |
| R3 repeat / R4 reduce | ✅ one-hard → repeat; multi-hard/low-reps → reduce (priority 'high') |
| R5 skipped | ✅ skipped or zero sets → skip_repeat (lighter setup) |
| R6 cardio | ✅ below→repeat, met@easy/mod→+2–5min, hard→keep |
| R7 consistency | ✅ first completed → congratulate "consistency, not perfection"; accepts history seed |
| Empty/null session | ✅ null→[]; empty→R7 only (no crash) |
| Output → trainer_recommendations | ✅ ruleId/type/exerciseId/title/message/nextAction/priority/generatedAt/source='rule_based' |
| Summary shows rec cards | ✅ `TrainerRecommendationCard`, sorted, pain accent red |
| Beginner-friendly copy | ✅ coaching tone, no jargon |
| No backend/Supabase/auth/AI/nutrition/dashboard | ✅ |

### Loop 5 verification (maker-checker — typecheck + executed assertions)
| Gate | Result |
|------|--------|
| `npx tsc --noEmit` | ✅ PASSED |
| Start W1D1 from Today | ✅ `startSession(day)` → WorkoutGuide live mode |
| One exercise at a time | ✅ step index; "Exercise N of M" + "Set Y of Z" |
| Log sets locally | ✅ weight(lb)/reps/effort(easy·good·hard)/pain → Zustand (asserted) |
| Rest timer | ✅ countdown, ±15s, skip, auto-advance |
| Cardio logging | ✅ planned + completed minutes + intensity (asserted) |
| **Pain stops exercise, not workout** | ✅ painReported set; session stays in_progress; warning shown; Next continues (asserted) |
| Back / End early w/ confirm | ✅ Back to previous exercise; End workout → Alert confirm |
| Session summary | ✅ sets logged / cardio min / skipped / per-exercise recap |
| Captures B-06 data | ✅ reps, weight, effort, pain, skipped, cardio minutes (asserted) |
| Maps to DB tables | ✅ WorkoutSessionLocal→workout_sessions, sets→exercise_sets (`setEffortToDbEffort`→Effort enum), cardio→cardio_logs, pain→feeds trainer_recommendations |
| Incomplete plan/session | ✅ guards in WorkoutGuide + SessionSummary (no crash) |
| No backend/Supabase/auth/AI/nutrition/analytics | ✅ |

### Loop 4 verification (maker-checker — typecheck + executed assertions)
| Gate | Result |
|------|--------|
| `npx tsc --noEmit` | ✅ PASSED |
| Generator is PURE | ✅ no Date/random/IO; identical output for identical input (asserted) |
| Days/week adaptation | ✅ 2→8 days, 3→12, 4→16 (asserted) |
| Duration adaptation | ✅ 20min→3 / 30→4 / 45→5 strength exercises |
| Day structure matches spec | ✅ 3-day = A / Cardio+Core / B; 4-day adds Cardio+Machines Light; 2-day = A / B |
| Injury: knee | ✅ drops `leg-extension`, swaps stair-climber→elliptical (asserted) |
| Injury: shoulder | ✅ drops `shoulder-press` (asserted); back/wrist → soften notes |
| Safety copy | ✅ "Stop if you feel sharp pain." on every day (asserted) |
| Sets progression | ✅ beginner 2 (wk1) → 3 (wk3) |
| Reps (weight loss) | ✅ 12–15 |
| Incomplete onboarding | ✅ defaults applied, no crash (Today + overview guard for null plan) |
| Maps to DB tables | ✅ GeneratedPlan→workout_plans, PlanDay→workout_days(+focus enum), PlanStrengthExercise→workout_exercises |
| No backend/Supabase/auth/AI/nutrition | ✅ |

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

### B-04 files created / changed
- NEW `src/data/exerciseCatalog.ts` — local catalog mirroring seed.sql (12 machines) + cardio-slug→machine map
- NEW `src/lib/planGenerator.ts` — PURE `generatePlan(answers)`; injury safety, days/week + duration adaptation, weekly progression
- NEW `src/state/planStore.ts` — Zustand plan store + `getPlanDay()` selector
- CHANGED `src/types/database.ts` — added GeneratedPlan / PlanDay / PlanStrengthExercise / PlanCardioBlock
- CHANGED `src/screens/OnboardingScreen.tsx` — on finish, generate plan + save to planStore
- CHANGED `src/screens/TodayScreen.tsx` — render W1D1 from generated plan (guarded for null)
- CHANGED `src/screens/WorkoutGuideScreen.tsx` — read-only workout overview from plan (logging deferred to B-05)
- CHANGED `src/navigation/types.ts` — WorkoutGuide route params `{ week?, dayNumber? }`

### B-05 files created / changed
- NEW `src/state/workoutSessionStore.ts` — live session Zustand store + `setEffortToDbEffort()` mapper
- NEW `src/components/{ExerciseStepCard,SetLogger,RestTimer,CardioLogger}.tsx`
- NEW `src/screens/SessionSummaryScreen.tsx`
- CHANGED `src/types/database.ts` — LoggedSet / ExerciseLog / CardioSessionLog / WorkoutSessionLocal + SetEffort / CardioIntensity
- CHANGED `src/screens/WorkoutGuideScreen.tsx` — read-only overview → live guided session (steps, set logging, rest, cardio, pain handling, end-early)
- CHANGED `src/screens/TodayScreen.tsx` — "Start Workout" starts session + navigates
- CHANGED `src/navigation/{types.ts,RootNavigator.tsx}` — added SessionSummary route

### B-06 files created / changed
- NEW `src/lib/trainerEngine.ts` — PURE `generateRecommendations()`; R1–R7, priority sort, pain override
- NEW `src/state/recommendationStore.ts` — recs + local `completedCount` (R7 history seed)
- NEW `src/components/TrainerRecommendationCard.tsx` — priority-accented coaching card
- NEW `docs/TRAINER_ENGINE_REVIEW.md` — rules, priority, pain override, DB mapping, tests
- CHANGED `src/types/database.ts` — TrainerRec / RecommendationType / RecommendationPriority
- CHANGED `src/screens/WorkoutGuideScreen.tsx` — on finish, run engine + save recs (completed increments count)
- CHANGED `src/screens/SessionSummaryScreen.tsx` — "Your next steps" rec cards

### B-07 files created / changed
- NEW `src/lib/progressStats.ts` — PURE summarize / strengthProgress / cardioProgress / weightProgress / currentStreak / weeklyMessage
- NEW `src/state/progressStore.ts` — local history + body weights (maps to workout_sessions/exercise_sets/cardio_logs/body_weight_logs)
- NEW `src/components/{WeightLogCard,StrengthProgressCard,CardioProgressCard}.tsx`
- NEW `docs/PROGRESS_DASHBOARD_REVIEW.md`
- CHANGED `src/screens/ProgressScreen.tsx` — full dashboard (stats grid, recent tips, strength/cardio cards, weight logging, empty states)
- CHANGED `src/screens/WorkoutGuideScreen.tsx` — save finished session to progressStore on finish
- CHANGED `src/types/database.ts` — BodyWeightEntry
- REUSED existing `ProgressCard` for stat tiles (no new StatCard — CURSOR_RULES reuse)

### B-08 files created / changed
- NEW `src/lib/recommendationApplicator.ts` — PURE `applyRecommendations()` view layer (pain priority, safe-min floor)
- NEW `docs/ADAPTIVE_PLAN_REVIEW.md`
- CHANGED `src/types/database.ts` — AdaptiveExercise / AdaptiveDay
- CHANGED `src/components/ExerciseStepCard.tsx` — optional `why` + `safety` props ("Why this suggestion?" + pain box)
- CHANGED `src/screens/WorkoutGuideScreen.tsx` — compute adaptive day; pass why/safety; pre-fill SetLogger with suggested weight
- CHANGED `src/screens/TodayScreen.tsx` — per-exercise adaptive hint line
- NOTE: planStore + planGenerator UNCHANGED (adaptation is a view layer, per requirement 9)

### B-09 files created / changed
- NEW `src/lib/planProgress.ts` — PURE `getPlanProgress()` + `planDayId`/`dayIdOf`
- NEW `src/state/planProgressStore.ts` — completedDayIds / selectedDayId / markDayCompleted / selectDay / reset
- NEW `src/components/WeekPlanStrip.tsx` — week strip (done/current/preview)
- NEW `docs/PLAN_PROGRESSION_REVIEW.md`
- CHANGED `src/screens/TodayScreen.tsx` — week strip, selected-day card, preview note, plan-complete banner, start selected day
- CHANGED `src/screens/WorkoutGuideScreen.tsx` — mark day complete on completed finish (not abandoned)
- CHANGED `src/screens/SessionSummaryScreen.tsx` — completed + next workout block
- NOTE: planStore + planGenerator UNCHANGED (progression tracked separately as completed-id set)

### B-10 files created / changed
- NEW `src/lib/persistConfig.ts` — PURE keys/version/migrate/pickKeys
- NEW `src/lib/storage.ts` — AsyncStorage JSON adapter + clearPersistedStorage
- NEW `src/lib/useHydration.ts` — `useAppHydrated()` gate
- NEW `src/lib/resetAppData.ts` — `resetLocalAppData()`
- NEW `docs/LOCAL_PERSISTENCE_REVIEW.md`
- CHANGED stores wrapped with `persist`: onboarding, plan, planProgress, progress, recommendation (workoutSession NOT persisted)
- CHANGED `src/App.tsx` — hydration gate + LoadingScreen
- CHANGED `src/navigation/RootNavigator.tsx` — initialRoute from persisted `completed`
- CHANGED `src/screens/SettingsScreen.tsx` — "Reset local data" button + confirm
- CHANGED `package.json` — added `@react-native-async-storage/async-storage`

### B-11 files created / changed
- NEW `src/lib/exerciseLibrary.ts` — PURE categoryOf / filterExercises / alternativeFor / CATEGORY_LABEL
- NEW `src/components/{SearchBar,FilterPill,ExerciseLibraryCard}.tsx`
- NEW `src/screens/{ExerciseLibraryScreen,ExerciseDetailScreen}.tsx`
- NEW `docs/EXERCISE_LIBRARY_REVIEW.md`
- CHANGED `src/data/exerciseCatalog.ts` — added primaryMuscles / commonMistakes / safetyNote (catalog = source of truth)
- CHANGED `src/navigation/{types.ts,RootNavigator.tsx}` — ExerciseDetail route; Library tab → ExerciseLibraryScreen
- REMOVED `src/screens/LibraryScreen.tsx` (placeholder superseded)
- NOTE: `components/ExerciseCard.tsx` now unused by screens; kept as generic reusable component

### B-12 files created / changed
- NEW `src/state/weeklyCheckInStore.ts` — persisted check-ins store
- NEW `src/lib/weeklyCheckIn.ts` — PURE messages / latestCheckIn / DB-row mapping / labels
- NEW `src/screens/WeeklyCheckInScreen.tsx` — form (reuses onboarding ChoiceGroup/MultiChoiceGroup)
- NEW `src/components/WeeklyCheckInCard.tsx` — prompt + latest-summary card
- NEW `docs/WEEKLY_CHECKIN_REVIEW.md`
- CHANGED `src/types/database.ts` — WeeklyCheckInEntry + enums
- CHANGED `src/lib/persistConfig.ts` — added `weeklyCheckIn` storage key
- CHANGED `src/lib/useHydration.ts` + `src/lib/resetAppData.ts` — include weekly check-in store
- CHANGED `src/navigation/{types.ts,RootNavigator.tsx}` — WeeklyCheckIn route
- CHANGED `src/screens/{TodayScreen,ProgressScreen}.tsx` — check-in card + open route

### B-13 files created / changed
- NEW `src/lib/settingsProfile.ts` — PURE decidePlanUpdate / structureChanged / planAffectingChanged / injuriesEqual
- NEW `src/components/{SettingsSection,UnitToggle}.tsx` (SettingsSection also exports SettingRow)
- NEW `docs/SETTINGS_PROFILE_REVIEW.md`
- CHANGED `src/screens/SettingsScreen.tsx` — real sections, editable prefs, confirmed regeneration (history preserved)
- CHANGED `src/components/ExerciseStepCard.tsx` — optional `onOpenGuide` ("Need help with this machine?")
- CHANGED `src/screens/WorkoutGuideScreen.tsx` — pass onOpenGuide → ExerciseDetail
- CHANGED `src/screens/TodayScreen.tsx` — exercise rows tappable → ExerciseDetail
- REUSED `MultiChoiceGroup`/`ChoiceGroup` for injuries/days/duration (no InjurySelector duplication)
- NOTE: onboardingStore.setAnswer covers edits (no new edit actions); planStore/planProgress reused

### B-14 files created / changed
- NEW `src/components/{MeasurementLogCard,ProgressPhotoCard}.tsx`
- NEW `docs/BODY_PROGRESS_REVIEW.md`
- CHANGED `src/types/database.ts` — BodyMeasurementEntry / PhotoAngle / ProgressPhotoEntry
- CHANGED `src/state/progressStore.ts` — measurements[]/photos[] + addMeasurement/addPhoto + partialize + clear
- CHANGED `src/lib/progressStats.ts` — PURE measurementProgress / photoProgress
- CHANGED `src/screens/ProgressScreen.tsx` — measurement + photo cards + encouraging copy
- CHANGED `app.json` — expo-image-picker plugin + iOS NSPhotoLibraryUsageDescription
- CHANGED `package.json` — added `expo-image-picker`

### B-15 files created / changed
- NEW `src/lib/sessionRecovery.ts` — PURE isInProgress / isStructurallyValid / sessionMatchesPlanDay / canSafelyResume / resumeStepIndex / resumeInfo
- NEW `src/lib/sessionActions.ts` — shared `concludeSession(status)` (finish + recs + history + conditional plan advance)
- NEW `src/components/ResumeWorkoutCard.tsx` — Continue/End/Discard (+ corrupt-session state)
- NEW `docs/SESSION_RECOVERY_REVIEW.md`
- CHANGED `src/types/database.ts` — WorkoutSessionLocal.currentExerciseIndex
- CHANGED `src/state/workoutSessionStore.ts` — persist + setCurrentExerciseIndex + currentExerciseIndex
- CHANGED `src/lib/persistConfig.ts` — workoutSession storage key
- CHANGED `src/lib/useHydration.ts` — wait for session store
- CHANGED `src/screens/WorkoutGuideScreen.tsx` — resume at saved step, persist step, use concludeSession
- CHANGED `src/screens/TodayScreen.tsx` — ResumeWorkoutCard + handlers
- CHANGED `src/screens/SessionSummaryScreen.tsx` — clear live session on exit
- NOTE: resetAppData already clears the session store + key (req 15)

### B-16 files created / changed
- NEW `src/lib/safety.ts` — PURE DISCLAIMER_TEXT / START_REMINDER / PAIN_HELP / SAFETY_TIPS / initialRouteName
- NEW `src/lib/restTimer.ts` — PURE formatCountdown / adjustSeconds / initialRest
- NEW `src/state/safetyStore.ts` — persisted `acknowledged`
- NEW `src/components/SafetyDisclaimerCard.tsx`, `src/screens/SafetyIntroScreen.tsx`
- NEW `docs/SAFETY_POLISH_REVIEW.md`
- CHANGED `src/components/RestTimer.tsx` — Restart/+15s/Skip, clearer copy, expo-haptics end cue, pure helpers
- CHANGED `src/components/SetLogger.tsx` — clearer sharp-pain copy + PAIN_HELP
- CHANGED `src/screens/WorkoutGuideScreen.tsx` — start-light reminder banner
- CHANGED `src/screens/SettingsScreen.tsx` — Safety tips section; reset → SafetyIntro
- CHANGED `src/navigation/{types.ts,RootNavigator.tsx}` — SafetyIntro route + initial-route logic
- CHANGED `src/lib/persistConfig.ts` (safety key), `src/lib/useHydration.ts`, `src/lib/resetAppData.ts`
- CHANGED `package.json` — added `expo-haptics`

### B-17 files created / changed
- NEW `src/lib/supabaseConfig.ts` — PURE hasSupabaseConfig / deriveAuthStatus / LOCAL_FIRST_MESSAGE / env-derived config
- NEW `src/lib/supabase.ts` — client (null when unconfigured; AsyncStorage session)
- NEW `src/state/authStore.ts` — user/session/loading/status + initialize/signUp/signIn/signOut + best-effort profile upsert
- NEW `src/components/AuthStatusCard.tsx`, `src/screens/{SignInScreen,SignUpScreen}.tsx`
- NEW `.env.example`; `.gitignore` now ignores `.env*`
- NEW `docs/SUPABASE_AUTH_REVIEW.md`, `docs/SYNC_PLAN.md`
- CHANGED `src/App.tsx` — auth initialize() on launch
- CHANGED `src/navigation/{types.ts,RootNavigator.tsx}` — SignIn/SignUp routes
- CHANGED `src/screens/SettingsScreen.tsx` — AuthStatusCard (sign in/out)
- CHANGED `package.json` — added `@supabase/supabase-js`, `react-native-url-polyfill`
- NOTE: DECISION — commit author is now the user (`ijethi`), no Claude co-author trailer (per user request)

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
… → Body measurements + photos ✅ → Resumable session ✅ → Safety polish ✅ → **Supabase auth foundation ✅** → **next: B-18 = first data sync (profile & onboarding), per SYNC_PLAN.md**.

## Next task (single, after approval) — B-18
> Per the loop rule: pick ONE item from FEATURE_BACKLOG.md, write a mini-spec, build, check, update this file, STOP.
- **Proposed next (SYNC_PLAN step 1):** Sync **profile & onboarding** — push `user_profiles`/`onboarding_answers` on sign-in and pull them back on a new device; conflict = last-write-wins; still local-first (works offline / unconfigured).
- Alternatives: streak/weekly-unlock (local), or in-session coach tips (local).
- Awaiting user direction on B-18 scope.

## Decisions (append)
- D14 (2026-06-29): Git commits are authored as the user (`ijethi <Ijethi7@gmail.com>`), no Claude co-author trailer, per explicit user request. Earlier commits (B-01…B-16) were authored "FirstRep Dev" + Claude trailer — offer to rewrite author before the user pushes (nothing is pushed yet).

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
