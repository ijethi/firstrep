import type { MachineType, MuscleGroup, CardioMachine } from '../types/database';

/**
 * Local exercise catalog (B-04) — mirrors `supabase/seed.sql`.
 * Used by the plan generator while there is no live DB. Local `id` is the slug;
 * it maps to `exercises.id` once a real catalog is provisioned.
 */
export interface CatalogExercise {
  id: string; // = slug
  slug: string;
  name: string;
  muscleGroup: MuscleGroup;
  machineType: MachineType;
  worksPlain: string;
  setupSteps: string[];
  formTips: string[];
  defaultSets: number | null;
  defaultRepMin: number | null;
  defaultRepMax: number | null;
  defaultWeightLb: number | null;
  restSeconds: number;
  imagePath: string;
  beginnerFriendly: boolean;
  altSlug: string | null;
}

const make = (e: Omit<CatalogExercise, 'id'>): CatalogExercise => ({ ...e, id: e.slug });

export const EXERCISE_CATALOG: CatalogExercise[] = [
  make({
    slug: 'chest-press',
    name: 'Chest Press Machine',
    muscleGroup: 'chest',
    machineType: 'machine',
    worksPlain: 'Works your chest, shoulders, and arms',
    setupSteps: [
      'Sit with your back flat against the pad.',
      'Set the seat so the handles line up with your chest.',
      'Grab the handles and push forward until arms are almost straight.',
      'Slowly bring the handles back.',
    ],
    formTips: ["Keep your back against the pad the whole time.", "Don't lock your elbows.", 'Breathe out as you push.'],
    defaultSets: 3,
    defaultRepMin: 10,
    defaultRepMax: 12,
    defaultWeightLb: 30,
    restSeconds: 60,
    imagePath: 'machine-images/chest-press.png',
    beginnerFriendly: true,
    altSlug: 'shoulder-press',
  }),
  make({
    slug: 'lat-pulldown',
    name: 'Lat Pulldown',
    muscleGroup: 'back',
    machineType: 'machine',
    worksPlain: 'Works your back and arms',
    setupSteps: [
      'Sit down and tuck your knees under the pad.',
      'Grab the wide bar with both hands.',
      'Pull the bar down to your upper chest.',
      'Slowly let it rise back up.',
    ],
    formTips: ['Lead with your elbows, not your hands.', 'Squeeze your shoulder blades together.', 'Avoid leaning too far back.'],
    defaultSets: 3,
    defaultRepMin: 10,
    defaultRepMax: 12,
    defaultWeightLb: 30,
    restSeconds: 60,
    imagePath: 'machine-images/lat-pulldown.png',
    beginnerFriendly: true,
    altSlug: 'seated-row',
  }),
  make({
    slug: 'seated-row',
    name: 'Seated Row',
    muscleGroup: 'back',
    machineType: 'machine',
    worksPlain: 'Works your back and arms',
    setupSteps: [
      'Sit with your chest against the pad.',
      'Grab the handles with both hands.',
      'Pull the handles toward you, squeezing your back.',
      'Slowly return to the start.',
    ],
    formTips: ['Keep your chest on the pad.', 'Pull your elbows straight back.', "Don't shrug your shoulders up."],
    defaultSets: 3,
    defaultRepMin: 10,
    defaultRepMax: 12,
    defaultWeightLb: 30,
    restSeconds: 60,
    imagePath: 'machine-images/seated-row.png',
    beginnerFriendly: true,
    altSlug: 'lat-pulldown',
  }),
  make({
    slug: 'shoulder-press',
    name: 'Shoulder Press Machine',
    muscleGroup: 'shoulders',
    machineType: 'machine',
    worksPlain: 'Works your shoulders and arms',
    setupSteps: [
      'Sit with your back flat against the pad.',
      'Set the seat so handles start near your shoulders.',
      'Press the handles straight up.',
      'Lower them back down slowly.',
    ],
    formTips: ['Keep your core tight.', "Don't arch your lower back.", 'Stop just before locking your elbows.'],
    defaultSets: 3,
    defaultRepMin: 10,
    defaultRepMax: 12,
    defaultWeightLb: 20,
    restSeconds: 60,
    imagePath: 'machine-images/shoulder-press.png',
    beginnerFriendly: true,
    altSlug: 'chest-press',
  }),
  make({
    slug: 'leg-press',
    name: 'Leg Press',
    muscleGroup: 'legs',
    machineType: 'machine',
    worksPlain: 'Works your thighs and glutes',
    setupSteps: [
      'Sit back into the seat.',
      'Place your feet flat, shoulder-width on the platform.',
      'Push the platform away until legs are almost straight.',
      'Slowly bend your knees to return.',
    ],
    formTips: ["Don't lock your knees at the top.", 'Keep your knees in line with your toes.', 'Push through your heels.'],
    defaultSets: 3,
    defaultRepMin: 10,
    defaultRepMax: 12,
    defaultWeightLb: 90,
    restSeconds: 75,
    imagePath: 'machine-images/leg-press.png',
    beginnerFriendly: true,
    altSlug: 'leg-extension',
  }),
  make({
    slug: 'leg-extension',
    name: 'Leg Extension',
    muscleGroup: 'legs',
    machineType: 'machine',
    worksPlain: 'Works the front of your thighs',
    setupSteps: [
      'Sit back with knees bent over the seat edge.',
      'Set the pad to rest on your lower shins.',
      'Straighten your legs to lift the pad.',
      'Slowly lower back down.',
    ],
    formTips: ['Move slowly and with control.', 'Squeeze your thighs at the top.', "Don't swing the weight."],
    defaultSets: 3,
    defaultRepMin: 10,
    defaultRepMax: 12,
    defaultWeightLb: 30,
    restSeconds: 60,
    imagePath: 'machine-images/leg-extension.png',
    beginnerFriendly: true,
    altSlug: 'leg-press',
  }),
  make({
    slug: 'seated-leg-curl',
    name: 'Seated Leg Curl',
    muscleGroup: 'legs',
    machineType: 'machine',
    worksPlain: 'Works the back of your thighs',
    setupSteps: [
      'Sit with the pad resting on top of your lower legs.',
      'Adjust the thigh pad so it holds you in place.',
      'Bend your knees to pull the pad down.',
      'Slowly return to the start.',
    ],
    formTips: ['Keep your back against the seat.', 'Control the weight on the way back.', "Don't rush the reps."],
    defaultSets: 3,
    defaultRepMin: 10,
    defaultRepMax: 12,
    defaultWeightLb: 30,
    restSeconds: 60,
    imagePath: 'machine-images/seated-leg-curl.png',
    beginnerFriendly: true,
    altSlug: 'hip-adductor',
  }),
  make({
    slug: 'hip-abductor',
    name: 'Hip Abductor',
    muscleGroup: 'glutes',
    machineType: 'machine',
    worksPlain: 'Works your outer hips and glutes',
    setupSteps: [
      'Sit with your back against the pad.',
      'Place your outer thighs against the pads.',
      'Push your knees outward as far as comfortable.',
      'Slowly bring them back together.',
    ],
    formTips: ['Move in a slow, controlled way.', 'Keep your back against the seat.', "Don't use momentum."],
    defaultSets: 3,
    defaultRepMin: 12,
    defaultRepMax: 15,
    defaultWeightLb: 50,
    restSeconds: 45,
    imagePath: 'machine-images/hip-abductor.png',
    beginnerFriendly: true,
    altSlug: 'hip-adductor',
  }),
  make({
    slug: 'hip-adductor',
    name: 'Hip Adductor',
    muscleGroup: 'legs',
    machineType: 'machine',
    worksPlain: 'Works your inner thighs',
    setupSteps: [
      'Sit with your back against the pad.',
      'Place your inner thighs against the pads, knees apart.',
      'Squeeze your knees together.',
      'Slowly let them open back out.',
    ],
    formTips: ['Control the weight in both directions.', 'Keep your back against the seat.', "Don't let the pads slam open."],
    defaultSets: 3,
    defaultRepMin: 12,
    defaultRepMax: 15,
    defaultWeightLb: 50,
    restSeconds: 45,
    imagePath: 'machine-images/hip-adductor.png',
    beginnerFriendly: true,
    altSlug: 'hip-abductor',
  }),
  make({
    slug: 'treadmill-incline-walk',
    name: 'Treadmill Incline Walk',
    muscleGroup: 'cardio',
    machineType: 'cardio',
    worksPlain: 'Cardio — burns extra calories',
    setupSteps: [
      'Step on and clip the safety key to your shirt.',
      'Start at a slow walk (about 2.5 mph).',
      'Set the incline to 3-5%.',
      'Walk at a pace where you can still talk.',
    ],
    formTips: ["Don't hold the handrails the whole time.", 'Stand tall, look ahead.', 'Start slow and build up your minutes.'],
    defaultSets: null,
    defaultRepMin: null,
    defaultRepMax: null,
    defaultWeightLb: null,
    restSeconds: 0,
    imagePath: 'machine-images/treadmill-incline-walk.png',
    beginnerFriendly: true,
    altSlug: 'elliptical',
  }),
  make({
    slug: 'elliptical',
    name: 'Elliptical',
    muscleGroup: 'cardio',
    machineType: 'cardio',
    worksPlain: 'Cardio — easy on the joints',
    setupSteps: [
      'Step onto the pedals and hold the moving handles.',
      'Start pedaling at a steady, easy pace.',
      'Set resistance to a low level to begin.',
      'Keep a rhythm you can sustain.',
    ],
    formTips: ['Keep your posture upright.', 'Push and pull with both arms and legs.', 'Aim for a talk-friendly pace.'],
    defaultSets: null,
    defaultRepMin: null,
    defaultRepMax: null,
    defaultWeightLb: null,
    restSeconds: 0,
    imagePath: 'machine-images/elliptical.png',
    beginnerFriendly: true,
    altSlug: 'treadmill-incline-walk',
  }),
  make({
    slug: 'stair-climber',
    name: 'Stair Climber',
    muscleGroup: 'cardio',
    machineType: 'cardio',
    worksPlain: 'Cardio — strong calorie burn',
    setupSteps: [
      'Step on and hold the rails to steady yourself.',
      'Start at the lowest speed.',
      'Take full, steady steps.',
      'Increase speed only when it feels easy.',
    ],
    formTips: ["Don't lean heavily on the rails.", 'Keep your steps full, not tiny.', 'Start with short sessions and build up.'],
    defaultSets: null,
    defaultRepMin: null,
    defaultRepMax: null,
    defaultWeightLb: null,
    restSeconds: 0,
    imagePath: 'machine-images/stair-climber.png',
    beginnerFriendly: true,
    altSlug: 'elliptical',
  }),
];

export const EXERCISE_BY_SLUG: Record<string, CatalogExercise> = Object.fromEntries(
  EXERCISE_CATALOG.map((e) => [e.slug, e]),
);

/** Map a cardio catalog slug to the `cardio_logs.machine` enum value. */
export const CARDIO_SLUG_TO_MACHINE: Record<string, CardioMachine> = {
  'treadmill-incline-walk': 'treadmill',
  elliptical: 'elliptical',
  'stair-climber': 'stair_climber',
};
