/**
 * Safety copy + first-run routing (B-16) — PURE, no store/native imports.
 * Beginner-friendly, non-medical, non-scary. Not legal advice.
 */

export const DISCLAIMER_TEXT =
  'FirstRep gives general fitness guidance. It is not medical advice. Stop if you feel sharp pain, ' +
  'dizziness, chest pain, or anything that feels unsafe. If you have a medical condition or injury, ' +
  'check with a qualified professional before training.';

/** Shown at the start of a workout. */
export const START_REMINDER = 'Start light today. You can always add weight later.';

/** Clarifies what "pain" means when logging a set. */
export const PAIN_HELP = 'Pain means sharp or unusual pain. Normal muscle effort is okay.';

export const SAFETY_TIPS: string[] = [
  'Start light — form first, weight later.',
  'Stop for sharp pain, dizziness, or chest pain.',
  'Ask gym staff if you’re unsure about a machine.',
  'Keep every movement slow and controlled.',
];

export type RootStart = 'SafetyIntro' | 'Onboarding' | 'Main';

/**
 * First screen after hydration:
 *  - not acknowledged → SafetyIntro (acknowledge once)
 *  - acknowledged + onboarding done → Main
 *  - acknowledged + onboarding not done → Onboarding
 */
export function initialRouteName(acknowledged: boolean, onboardingComplete: boolean): RootStart {
  if (!acknowledged) return 'SafetyIntro';
  return onboardingComplete ? 'Main' : 'Onboarding';
}
