import { CARDIO_SLUG_TO_MACHINE, EXERCISE_BY_SLUG } from '../data/exerciseCatalog';
import { normalizeInjuries } from '../state/onboardingStore';
import type { OnboardingAnswers, Experience } from '../state/onboardingStore';
import type {
  GeneratedPlan,
  PlanCardioBlock,
  PlanDay,
  PlanStrengthExercise,
} from '../types/database';

/**
 * Plan generator (B-04) — a PURE function. No I/O, no Date/random, no UI side
 * effects. Same answers in → same plan out. The store stamps save time, not this.
 *
 * Produces a 4-week beginner weight-loss plan from onboarding answers, adapting
 * to days/week, preferred duration, experience, and injuries. Machine-based only
 * (no advanced free weights in MVP) per PRODUCT_SPEC.
 */

const WEEKS = 4;
const SAFETY = 'Stop if you feel sharp pain.';

const FULL_BODY_A = ['chest-press', 'lat-pulldown', 'leg-press', 'shoulder-press', 'seated-leg-curl'];
const FULL_BODY_B = ['seated-row', 'chest-press', 'leg-extension', 'hip-abductor', 'hip-adductor'];
const CARDIO_CORE_STRENGTH = ['hip-abductor', 'hip-adductor'];
const CARDIO_LIGHT_STRENGTH = ['seated-row', 'chest-press', 'lat-pulldown'];

// Order used to backfill when an exercise is dropped for safety.
const SAFE_POOL = [
  'leg-press',
  'chest-press',
  'lat-pulldown',
  'seated-row',
  'seated-leg-curl',
  'hip-abductor',
  'hip-adductor',
  'shoulder-press',
  'leg-extension',
];

type DayKind = 'full_body_a' | 'full_body_b' | 'cardio_core' | 'cardio_light';

function templatesForDays(days: number): { name: string; kind: DayKind }[] {
  if (days <= 2) {
    return [
      { name: 'Full Body A', kind: 'full_body_a' },
      { name: 'Full Body B', kind: 'full_body_b' },
    ];
  }
  if (days >= 4) {
    return [
      { name: 'Full Body A', kind: 'full_body_a' },
      { name: 'Cardio + Core', kind: 'cardio_core' },
      { name: 'Full Body B', kind: 'full_body_b' },
      { name: 'Cardio + Machines Light', kind: 'cardio_light' },
    ];
  }
  return [
    { name: 'Full Body A', kind: 'full_body_a' },
    { name: 'Cardio + Core', kind: 'cardio_core' },
    { name: 'Full Body B', kind: 'full_body_b' },
  ];
}

function fullBodyCount(durationMin: number): number {
  if (durationMin <= 20) return 3;
  if (durationMin <= 30) return 4;
  return 5;
}

function setsFor(week: number, experience: Experience): number {
  const base = experience === 'some' ? 3 : 2;
  return week >= 3 ? Math.min(base + 1, 3) : base;
}

/** Exercises to remove entirely for the given injuries. */
function droppedFor(injuries: string[]): Set<string> {
  const drop = new Set<string>();
  if (injuries.includes('knee')) drop.add('leg-extension'); // open-chain knee load
  if (injuries.includes('shoulder')) drop.add('shoulder-press'); // overhead
  return drop;
}

/** A "soften" safety note for an exercise we keep but adjust, or null. */
function softenNote(slug: string, injuries: string[]): string | null {
  const notes: string[] = [];
  if (injuries.includes('knee') && slug === 'leg-press') {
    notes.push("Use a comfortable, partial range — don't go too deep.");
  }
  if (injuries.includes('back') && (slug === 'seated-row' || slug === 'lat-pulldown')) {
    notes.push('Keep your back supported and your core gently braced.');
  }
  if (injuries.includes('shoulder') && slug === 'lat-pulldown') {
    notes.push('Keep your shoulders relaxed and avoid shrugging.');
  }
  if (injuries.includes('wrist') && (slug === 'lat-pulldown' || slug === 'seated-row' || slug === 'chest-press')) {
    notes.push('Use a lighter weight and a relaxed grip.');
  }
  return notes.length ? notes.join(' ') : null;
}

function toStrength(
  slug: string,
  week: number,
  experience: Experience,
  injuries: string[],
): PlanStrengthExercise {
  const cat = EXERCISE_BY_SLUG[slug];
  const sets = setsFor(week, experience);
  const soften = softenNote(slug, injuries);
  const formTip = soften ? `⚠️ ${soften} ${cat.formTips[0] ?? ''}`.trim() : cat.formTips[0] ?? '';
  const guidance =
    cat.defaultWeightLb != null
      ? `Start light — about ${cat.defaultWeightLb} lb. If 15 reps feel easy, add 5 lb next time.`
      : 'Start light and only add weight once 15 reps feel easy.';

  return {
    exerciseId: cat.id,
    slug: cat.slug,
    name: cat.name,
    imageKey: cat.imagePath,
    sets,
    repMin: 12, // weight-loss rep range (higher reps)
    repMax: 15,
    startingWeightGuidance: guidance,
    restSeconds: cat.restSeconds || 60,
    setupNote: cat.setupSteps[0] ?? '',
    formTip,
  };
}

/** Pick `count` injury-safe strength exercises, preferring the template order. */
function buildStrength(
  template: string[],
  count: number,
  week: number,
  experience: Experience,
  injuries: string[],
): PlanStrengthExercise[] {
  const drop = droppedFor(injuries);
  const ordered = [...template, ...SAFE_POOL].filter((s) => !drop.has(s));
  const chosen: string[] = [];
  for (const slug of ordered) {
    if (chosen.length >= count) break;
    if (!chosen.includes(slug) && EXERCISE_BY_SLUG[slug]) chosen.push(slug);
  }
  return chosen.map((slug) => toStrength(slug, week, experience, injuries));
}

function cardioMinutes(kind: DayKind, week: number): number {
  if (kind === 'full_body_a' || kind === 'full_body_b') return 10; // short finisher
  return 16 + week * 2; // 18, 20, 22, 24 — main cardio grows weekly
}

function pickCardioSlug(kind: DayKind, injuries: string[]): string {
  const hasKnee = injuries.includes('knee');
  if (kind === 'cardio_light') return hasKnee ? 'elliptical' : 'stair-climber';
  // knee → low-impact elliptical; otherwise incline walk (great for weight loss)
  return hasKnee ? 'elliptical' : 'treadmill-incline-walk';
}

function buildCardio(kind: DayKind, week: number, injuries: string[]): PlanCardioBlock {
  const slug = pickCardioSlug(kind, injuries);
  const cat = EXERCISE_BY_SLUG[slug];
  const machine = CARDIO_SLUG_TO_MACHINE[slug];
  const intensity =
    slug === 'stair-climber'
      ? 'Take full, steady steps at a pace you can keep up. Slow down anytime.'
      : 'Keep an easy, steady pace where you can still hold a conversation.';
  return {
    machine,
    minutes: cardioMinutes(kind, week),
    intensityGuidance: intensity,
    beginnerNote: `${cat.name}: even a few minutes counts. ${SAFETY}`,
  };
}

function estimateMinutes(strength: PlanStrengthExercise[], cardio: PlanCardioBlock | null): number {
  const strengthMin = strength.reduce((sum, e) => sum + (e.sets * (e.restSeconds + 40)) / 60, 0);
  const cardioMin = cardio ? cardio.minutes : 0;
  const total = strengthMin + cardioMin;
  return Math.max(10, Math.round(total / 5) * 5); // round to nearest 5
}

function dayBeginnerNote(injuries: string[]): string {
  const base = `Move slowly, breathe, and rest between sets. ${SAFETY}`;
  if (injuries.length === 0) return base;
  const labels: Record<string, string> = {
    knee: 'knee',
    shoulder: 'shoulder',
    back: 'back',
    wrist: 'wrist',
    hip: 'hip',
    ankle: 'ankle',
    neck: 'neck',
  };
  const named = injuries.map((i) => labels[i] ?? i).join(', ');
  return `${base} We adjusted a few moves to protect your ${named}.`;
}

function buildDay(
  weekNumber: number,
  dayNumber: number,
  template: { name: string; kind: DayKind },
  durationMin: number,
  experience: Experience,
  injuries: string[],
): PlanDay {
  const { kind, name } = template;

  let strengthSlugs: string[];
  let count: number;
  if (kind === 'full_body_a') {
    strengthSlugs = FULL_BODY_A;
    count = fullBodyCount(durationMin);
  } else if (kind === 'full_body_b') {
    strengthSlugs = FULL_BODY_B;
    count = fullBodyCount(durationMin);
  } else if (kind === 'cardio_core') {
    strengthSlugs = CARDIO_CORE_STRENGTH;
    count = 2;
  } else {
    strengthSlugs = CARDIO_LIGHT_STRENGTH;
    count = 3;
  }

  const strength = buildStrength(strengthSlugs, count, weekNumber, experience, injuries);
  const cardio = buildCardio(kind, weekNumber, injuries);
  const focus = kind === 'full_body_a' || kind === 'full_body_b' ? 'full_body' : 'cardio';

  return {
    weekNumber,
    dayNumber,
    name,
    focus,
    estimatedMinutes: estimateMinutes(strength, cardio),
    strength,
    cardio,
    beginnerNote: dayBeginnerNote(injuries),
  };
}

/** PURE: onboarding answers → a 4-week beginner weight-loss plan. */
export function generatePlan(answers: OnboardingAnswers): GeneratedPlan {
  // Defensive defaults so an incomplete onboarding never crashes generation.
  const daysPerWeek = answers.daysPerWeek ?? 3;
  const durationMin = answers.workoutLengthMin ?? 30;
  const experience: Experience = answers.experience ?? 'beginner';
  const injuries = normalizeInjuries(answers.injuries);

  const templates = templatesForDays(daysPerWeek);
  const days: PlanDay[] = [];

  for (let week = 1; week <= WEEKS; week += 1) {
    templates.forEach((tpl, i) => {
      days.push(buildDay(week, i + 1, tpl, durationMin, experience, injuries));
    });
  }

  return {
    title: '4-Week Beginner Weight Loss Plan',
    weeks: WEEKS,
    daysPerWeek: templates.length,
    days,
  };
}
