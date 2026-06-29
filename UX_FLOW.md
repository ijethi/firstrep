# UX_FLOW.md — Screens & flows

> 11 screens. For each: purpose, components, actions, data, empty state, success state, beginner copy.
> Copy is intentionally warm, plain, jargon-glossed. Last updated: 2026-06-28

---

## Navigation map
```
Onboarding Quiz ──► (plan generated) ──► Home/Today ◄── bottom tab root
                                          │
Bottom tabs: [ Today ] [ Progress ] [ Library ] [ Profile ]
                                          │
Today ──► Workout Overview ──► Start ──► Machine Guide ⇄ Set Logging ⇄ Rest Timer
                                          │                      │
                                          └──► Cardio Tracking    └──► (session done) ──► Session Summary ──► Today
Weekly Check-in: triggered by schedule (every 7 days) or banner on Today.
```

---

## 1. Onboarding Quiz
- **Purpose:** Gather the minimum to generate a safe 4-week beginner weight-loss plan.
- **Components:** Progress bar (step N of M), single-question-per-screen cards, big choice buttons, back arrow.
- **Questions (MVP):** goal (confirm: lose weight), sex, age range, current body weight, height, days/week available (2–4), any injuries/pain areas (multi-select + "none"), gym = Planet Fitness (confirm), experience (true beginner / some), preferred workout length (20/30/45 min).
- **User actions:** Tap to select, auto-advance; "Back"; final "Build my plan".
- **Data needed (write):** `onboarding_answers`, then derive `user_profiles`, then generate `workout_plans` + `workout_days` + `workout_exercises` via planner.
- **Empty state:** N/A (first run). If abandoned midway, resume at last answered question.
- **Success state:** Animated "Your 4-week plan is ready 🎉" → CTA "See today's workout".
- **Copy:** *"Let's build your plan. No gym experience needed — we'll walk you through everything."* / Injuries: *"Anything hurting right now? We'll avoid it and pick safer moves."*

## 2. Home / Today
- **Purpose:** Answer "what do I do today?" in one glance.
- **Components:** Greeting + date, today's workout card (duration, # exercises, focus e.g. "Full Body"), cardio target chip, **one** daily habit goal (e.g. "Drink 6 glasses of water"), streak badge, big **Start Workout** button. Rest-day variant. Check-in banner when due.
- **User actions:** Start Workout, log habit done, open cardio, dismiss/open check-in.
- **Data needed (read):** today's `workout_days` + `workout_exercises`, current streak (from `workout_sessions`), habit goal, check-in due flag.
- **Empty state:** No plan yet → "Finish onboarding to see today." Rest day → "Today's a rest day. Recovery is part of progress. 💤" with optional light-cardio suggestion.
- **Success state:** Workout completed today → card flips to "Done ✅ Great work" + tomorrow preview.
- **Copy:** *"Today: Full Body • 30 min • 5 machines. You've got this."*

## 3. Workout Overview
- **Purpose:** Preview the session before starting; set expectations.
- **Components:** Ordered list of exercises (thumbnail, name, sets×reps, est. time), cardio block, total duration, "what you'll need" (e.g. towel, water), **Start Workout** sticky button.
- **User actions:** Expand an exercise to preview, reorder is NOT allowed (trainer decides), Start.
- **Data needed:** `workout_exercises` for the day joined to `exercises`.
- **Empty state:** N/A (only reachable with a plan).
- **Success state:** Tap Start → enters Machine Guide at exercise 1.
- **Copy:** *"Here's the plan. We'll guide you through each machine — just follow along."*

## 4. Step-by-step Machine Guide
- **Purpose:** Remove all confusion at the machine. The heart of the app.
- **Components:** Large machine **image**, machine name + plain-language "what it works", numbered **setup steps** (seat height, pin, grip), target **sets × reps**, **suggested weight**, 2–3 **form tips** ("keep back flat"), safety note, progress indicator (exercise 3 of 5), **Log this set** primary button, "Swap exercise" secondary (safer alternative), "Skip" tertiary.
- **User actions:** Read, tap "Log this set" → Set Logging; "Swap" if pain/unavailable; "Skip".
- **Data needed:** `exercises` (image_url, setup_steps, form_tips, muscle_group, alt_exercise_id), `workout_exercises` (sets, rep range, suggested weight from last session via trainer logic).
- **Empty state:** Missing image → branded placeholder + "Image coming soon", steps still show.
- **Success state:** All sets for this exercise logged → auto-advance to next, or "Exercise done ✅".
- **Copy:** *"Lat Pulldown — works your back. 1) Sit, knees under the pad. 2) Grab the wide bar. 3) Pull to your chest, squeeze, slow release."* Suggested weight: *"Start light — 30 lb. We'll adjust as you go."*

## 5. Set Logging
- **Purpose:** Capture what actually happened, fast, between sets.
- **Components:** Set number, big +/- steppers for **weight** and **reps** (pre-filled with target/last), "felt easy / just right / too hard" 3-button effort, optional "pain" toggle, **Save set** button, auto-opens Rest Timer.
- **User actions:** Adjust weight/reps, tap effort, flag pain, Save.
- **Data needed (write):** `exercise_sets` (session_id, exercise_id, set_index, weight, reps, effort, pain_flag).
- **Empty state:** First-ever set → pre-fill with conservative suggested weight + target reps.
- **Success state:** "Set 1 logged 💪" → Rest Timer launches automatically.
- **Copy:** *"How'd that feel?"* [Easy] [Just right] [Too hard]. Pain toggle: *"Felt pain? Tell us — we'll switch to a safer move."*

## 6. Rest Timer
- **Purpose:** Time the rest so beginners don't rush or dawdle.
- **Components:** Big countdown ring (default 60–90s by exercise), +15s / -15s, "next set" preview (set 2 of 3 • 30 lb × 12), Skip rest, gentle haptic + optional sound at 0.
- **User actions:** Add/subtract time, skip, auto-continue to next set or next exercise.
- **Data needed:** rest duration from `exercises`/`workout_exercises`; current set position from session state (Zustand).
- **Empty state:** N/A.
- **Success state:** Timer hits 0 → "Ready? Next set: 30 lb × 12" → tap to return to Machine Guide/Set Logging.
- **Copy:** *"Rest up. Catch your breath — next set in…"*

## 7. Cardio Tracking
- **Purpose:** Log the weight-loss-critical cardio block simply.
- **Components:** Machine picker (treadmill/elliptical/bike), duration timer or manual entry, optional distance, optional incline/level, perceived effort, **Save cardio** button. Live timer mode + manual mode.
- **User actions:** Pick machine, start/stop timer or type minutes, save.
- **Data needed (write):** `cardio_logs` (session_id?, machine, minutes, distance, effort, calories_est optional).
- **Empty state:** "No cardio logged yet today. Even 10 minutes counts."
- **Success state:** "Cardio: 15 min on the treadmill ✅ +15 to your weekly minutes."
- **Copy:** *"Cardio burns extra calories. Pick a machine and we'll time you — go at a pace you can talk at."*

## 8. Progress Dashboard
- **Purpose:** Make progress visible so beginners stay motivated.
- **Components:** Body-weight trend chart (line), workout **streak** + total workouts, **cardio minutes** this week, **strength** highlights (e.g. "Leg press: 50→70 lb"), **progress photos** grid, body-measurements mini-trends. Time-range toggle (week/month/all).
- **User actions:** Log weight, add photo, add measurements, switch range.
- **Data needed (read):** `body_weight_logs`, `workout_sessions`, `cardio_logs`, `exercise_sets` (for PRs), `progress_photos`, `body_measurement_logs`.
- **Empty state:** Brand-new → friendly prompts: "Log today's weight to start your trend." Photo grid → "Add your first photo. Only you can see these."
- **Success state:** Downward weight trend highlighted positively; new PR badge; streak fire icon.
- **Copy:** *"You showed up 3 times this week. That's how change happens."* Avoid scale-shaming; celebrate behavior.

## 9. Exercise Library
- **Purpose:** Let users browse/learn machines outside a session (reduces gym anxiety).
- **Components:** Searchable, filterable (muscle group, beginner-friendly) grid; each card → same content as Machine Guide minus logging.
- **User actions:** Search, filter, open detail, "add to today" (deferred — read-only in MVP).
- **Data needed (read):** `exercises`.
- **Empty state:** Search no-match → "No machine by that name. Try 'chest' or 'legs'."
- **Success state:** Detail view with image + steps + form tips.
- **Copy:** *"Curious about a machine? Look it up before you try it — no pressure."*

## 10. Weekly Check-in
- **Purpose:** Capture weekly data + drive trainer adjustments and motivation.
- **Components:** Weight entry, optional measurements, optional photo, "how did this week feel?" (energy/soreness/motivation), summary of week (workouts done, cardio min), **trainer message** (rule-based) + next-week unlock.
- **User actions:** Enter data, submit; receive recommendation.
- **Data needed (read/write):** writes `weekly_checkins`, `body_weight_logs`, optional `progress_photos`/`body_measurement_logs`; reads week's sessions; writes `trainer_recommendations`.
- **Empty state:** Not due yet → "Your check-in unlocks in 3 days."
- **Success state:** "Week 1 complete! You did 3 workouts. Week 2 unlocked 🔓" + tailored tip (e.g. weight stalled → review protein).
- **Copy:** *"Quick weekly check-in — 1 minute. This is how we tune your plan."*

## 11. Settings / Profile
- **Purpose:** Account, preferences, plan info, safety/legal.
- **Components:** Profile (name, goal, stats), units (deferred toggle), rest-timer sound/haptics, notification prefs, plan info / restart plan, injuries update, export/delete data, medical disclaimer, sign out.
- **User actions:** Edit profile, toggle prefs, restart/regenerate plan, update injuries (re-runs planner safety filter), manage account.
- **Data needed (read/write):** `users`, `user_profiles`.
- **Empty state:** N/A.
- **Success state:** "Saved." Plan restart → confirm dialog → new plan generated.
- **Copy:** *"Update anything here. Changed injuries? Tell us and we'll adjust your moves."*

---

## Cross-cutting UX rules
- Every primary action is a single, large, bottom-anchored button.
- No raw jargon: always pair (machine name) with (what it works) and (plain steps).
- Pain flag ANYWHERE → immediate safer-alternative offer (TRAINER_LOGIC R3).
- Session is resumable: if the app closes mid-workout, "Resume your workout?" on return.
