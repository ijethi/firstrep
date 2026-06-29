/**
 * Units (decision D7 / Q2).
 * Canonical storage is metric (kg / cm). The UI is IMPERIAL-FIRST for MVP because
 * Planet Fitness machines display lb. Convert only at the UI edge — never store lb.
 * A kg/lb toggle comes later; `defaultUnitSystem` is the single switch the UI reads.
 */

export type UnitSystem = 'imperial' | 'metric';

export const defaultUnitSystem: UnitSystem = 'imperial';

const LB_PER_KG = 2.2046226218;
const IN_PER_CM = 0.3937007874;

export const kgToLb = (kg: number): number => kg * LB_PER_KG;
export const lbToKg = (lb: number): number => lb / LB_PER_KG;
export const cmToIn = (cm: number): number => cm * IN_PER_CM;
export const inToCm = (inch: number): number => inch / IN_PER_CM;

/** Format a canonical kg value for display in the user's unit system. */
export function formatWeight(kg: number, system: UnitSystem = defaultUnitSystem): string {
  return system === 'imperial' ? `${Math.round(kgToLb(kg))} lb` : `${kg.toFixed(1)} kg`;
}

/** Format a canonical cm value for display in the user's unit system. */
export function formatLength(cm: number, system: UnitSystem = defaultUnitSystem): string {
  return system === 'imperial' ? `${Math.round(cmToIn(cm))} in` : `${Math.round(cm)} cm`;
}
