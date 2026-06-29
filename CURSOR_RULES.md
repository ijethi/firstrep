# CURSOR_RULES.md — Rules for every AI/dev run on this project

> Reusable project knowledge so any future AI run (or human) understands the app instantly.
> Read this + PRODUCT_SPEC.md + LOOP_STATE.md before touching anything.
> Last updated: 2026-06-28

---

## 0. Read order (every session)
1. `PRODUCT_SPEC.md` — what & why.
2. `LOOP_STATE.md` — where we are, what's next, blockers.
3. This file — how we work.
4. The relevant spec: `UX_FLOW.md`, `DATA_MODEL.md`, or `TRAINER_LOGIC.md`.

## 1. The development loop (heartbeat)
Repeat per feature:
1. Read PRODUCT_SPEC + LOOP_STATE.
2. Pick **ONE** task from FEATURE_BACKLOG.md.
3. Write a **mini-spec** (goal, files, success condition, out-of-scope).
4. Implement **only** that task (maker pass).
5. **Check** against the mini-spec + relevant doc (checker pass) — a deliberate second read, ideally fresh eyes.
6. Fix issues found.
7. Update LOOP_STATE.md (done / files changed / decisions / next / blockers).
8. **STOP** and ask the user before the next task.

**Ceiling rule (hard):** every loop has a success condition and a ceiling. Stop when the deliverable is met, OR after **3 attempts** — then report blockers instead of grinding. Do not code endlessly.

## 2. Maker–checker
- Maker writes; checker reviews against the spec, not against vibes.
- Checker verifies: matches mini-spec? matches DATA_MODEL/UX_FLOW/TRAINER_LOGIC? empty/error states handled? beginner-friendly copy? tests where logic exists?
- Disagreements get logged in LOOP_STATE Decisions.

## 3. Task isolation
- One task = one branch/worktree where possible. Keep diffs small and reviewable.
- Pure-logic tasks (rule engine, plan generator) built against fixtures, no UI coupling.
- Don't bundle "while I'm here" changes — log them to FEATURE_BACKLOG instead.

## 4. Connector-ready boundaries (do not violate)
The MVP must run fully on rule-based logic. Future connectors plug in behind interfaces:
- **Trainer:** all recommendation logic goes through `TrainerProvider` (see TRAINER_LOGIC §Connector boundary). UI/DB consume `TrainerRecommendation`/`TrainerAction` shapes only. Never call OpenAI directly from a screen.
- **Data source tagging:** every log table has a `source` column (`'manual'` now; `'wearable'`/`'llm'` later). Never hardcode assumptions that data is manual.
- **Nutrition:** MVP only *prompts* review (R6). No food log. Keep it a deep-link/stub.
- **Storage:** images via Supabase Storage keys, never bundled binaries; `progress-photos` is private + signed URLs only.
- Keep network/IO at the edges; core logic pure and testable.

## 5. State / memory discipline
- `LOOP_STATE.md` is the project's working memory — update it at the end of EVERY loop. If it's stale, fix it before coding.
- Decisions are append-only with rationale + date.
- Open questions live in LOOP_STATE §Open Questions with a default-if-no-answer so work isn't blocked.

## 6. Code conventions
- **Stack:** React Native + Expo (managed), TypeScript strict, Zustand (session) + React Query (server cache), Supabase JS client.
- **Structure:**
  ```
  src/
    app/            # screens & navigation
    components/     # reusable UI (Button, Stepper, Ring…)
    trainer/        # rule engine (pure, tested)
    planner/        # plan generator (pure, tested)
    data/           # supabase client, queries, types
    state/          # zustand stores
    lib/            # units, dates, formatting
    theme/          # tokens
  ```
- **Units:** store kg/cm canonical; convert at the display/logging edge (lb-first UI for PF). Use `lib/units.ts` — never inline conversions.
- **Naming:** files kebab-case, components PascalCase, hooks `useX`.
- **No magic numbers** in trainer logic — use `TRAINER_CONFIG`.
- **Types from DB:** generate Supabase types; don't hand-maintain table shapes.

## 7. Copy & UX guardrails (beginner-first)
- Always gloss jargon: machine name + "what it works" + plain steps.
- One primary action per screen, big and bottom-anchored.
- Celebrate behavior (showed up, logged), never shame the scale.
- Pain flag → safer-alternative offer, always (R3). Safety overrides progression.
- Every screen defines empty + success states (see UX_FLOW).

## 8. Safety / legal
- One-time medical disclaimer; not a medical/diagnostic app.
- No calorie/diagnosis claims. R6 prompts review, doesn't prescribe.
- Private data (photos, measurements) strictly RLS + private bucket.

## 9. Testing
- Pure logic (trainer, planner, units) → unit tests required, table-driven.
- Each backlog item's "Success condition" is the acceptance test for its loop.

## 10. Definition of Done (per loop)
- [ ] Meets the task's success condition.
- [ ] Matches relevant spec doc.
- [ ] Empty + error/success states handled (if UI).
- [ ] Tests pass (if logic).
- [ ] Beginner copy reviewed.
- [ ] LOOP_STATE.md updated.
- [ ] Stopped & reported to user.
