# PRODUCT_SPEC.md — PF Beginner Trainer (working name: "FirstRep")

> Source of truth for **what** we are building and **why**. Every AI loop reads this first.
> Last updated: 2026-06-28 · Status: Draft for approval

---

## 1. One-line pitch
A pocket personal trainer for Planet Fitness beginners who want to lose weight and have **no idea how to use the machines**. The app walks them through every workout, one machine at a time, and tells them exactly what to do next.

## 2. The problem
A first-time gym-goer at Planet Fitness faces three blockers:
1. **"What do I even do today?"** — no plan, no structure.
2. **"How does this machine work?"** — fear of looking foolish, risk of bad form/injury.
3. **"Am I making progress?"** — no feedback loop, so they quit in ~2–4 weeks.

BetterMe-style apps are broad and lifestyle-focused. We are narrow and **in-gym, machine-by-machine, weight-loss-first.**

## 3. Target user (primary persona)
**"Nervous Nadia"** — 28–45, signed up at Planet Fitness this month, main goal is weight loss, intimidated by the floor, has a smartphone in her pocket between sets. Does not know a lat pulldown from a leg press. Wants to be told what to do and reassured she's doing it right.

Secondary: returning lapsed beginner restarting after months off.

## 4. Core value proposition
**"Never feel lost in the gym again."** Open the app → it tells you today's plan → tap Start → it guides you machine by machine with pictures, setup steps, and a rest timer → it logs everything → it tells you what to do next time.

## 5. MVP scope (v0.1)
In scope:
- Onboarding quiz → generates a 4-week beginner weight-loss plan (rule-based, no AI).
- Today screen with the day's workout, cardio, and one daily habit goal.
- Guided workout session: step-by-step machine guide (image, setup, reps, sets, weight suggestion, rest timer, form tips).
- Set logging + rule-based "next step" recommendation.
- Cardio logging.
- Progress dashboard: body weight trend, workout streak, cardio minutes, strength PRs, progress photos.
- Weekly check-in.
- Exercise library (browse all machines).
- Settings/profile.

Explicitly OUT of MVP (deferred — see FEATURE_BACKLOG):
- AI trainer chat (OpenAI). MVP uses rule-based TRAINER_LOGIC only.
- Wearable sync (Apple Health / Google Fit / Fitbit).
- Nutrition database / calorie tracking (we *prompt* a review, we don't build a food log yet).
- Social / friends / leaderboards.
- Custom plan editing by the user.
- Multi-gym support (MVP assumes Planet Fitness machine set).

## 6. Success metrics (how we know it works)
- **Activation:** % of new users who complete onboarding AND finish their first guided workout. Target ≥ 60%.
- **Retention:** % completing 3 workouts in week 1 (this also unlocks week 2 in-app). Target ≥ 40%.
- **Confidence:** post-workout 1-tap survey "Did you feel guided?" ≥ 4/5 average.
- **Progress logging:** % logging body weight at least weekly. Target ≥ 50%.

## 7. Design principles
1. **One decision at a time.** Never show the user two choices when the trainer can make one for them.
2. **Big tap targets, gym-glove friendly.** Sweaty hands, between sets, glancing down.
3. **Reassure constantly.** Beginner-safe copy, no jargon without a plain-language gloss.
4. **Default forward.** Every screen has an obvious "next" action.
5. **Connector-ready, not connector-dependent.** Rule-based core works fully offline-ish; AI/wearable/nutrition are pluggable later (see CURSOR_RULES §Connector boundaries).
6. **Safety first.** Any pain signal stops the exercise and offers a safer alternative.

## 8. Tech stack (decision)
- **Mobile:** React Native + Expo (managed workflow).
- **State:** Zustand for live workout-session state; React Query for server cache.
- **Backend:** Supabase (Postgres + Auth + Storage + RLS).
- **Storage:** Supabase Storage buckets — `machine-images` (public read), `progress-photos` (private, per-user).
- **Charts:** `react-native-gifted-charts` (or `victory-native` — finalize in first chart loop).
- **Trainer logic:** pure TypeScript rule engine in `src/trainer/` (see TRAINER_LOGIC.md). No network needed.
- **AI (later):** OpenAI behind a `TrainerProvider` interface so rule-engine and LLM are swappable.

## 9. Non-goals / guardrails
- Not a medical app. Show a one-time "consult a doctor" disclaimer; no diagnosis.
- Not a calorie counter in MVP.
- No bodyweight shaming language anywhere. Celebrate behavior (showed up, logged) over outcomes.

## 10. Open product questions
Tracked live in LOOP_STATE.md §Open Questions. Top ones:
- Q1: Do we gate week 2+ strictly behind "3 workouts completed", or soft-unlock with a nudge?
- Q2: Imperial-only (lb) for MVP, or unit toggle from day one?
- Q3: Where do machine images come from (licensed set vs. our own illustrations)?
