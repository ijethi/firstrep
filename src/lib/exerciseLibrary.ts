import { EXERCISE_BY_SLUG } from '../data/exerciseCatalog';
import type { CatalogExercise } from '../data/exerciseCatalog';
import type { MuscleGroup } from '../types/database';

/**
 * Exercise Library search/filter (B-11) — PURE helpers over the catalog.
 * The catalog is the single source of truth; these only read it.
 */

export type LibraryCategory = 'upper' | 'lower' | 'cardio' | 'core';
export type LibraryFilter = 'all' | LibraryCategory | 'beginner_safe';

const UPPER: MuscleGroup[] = ['chest', 'back', 'shoulders', 'arms'];
const LOWER: MuscleGroup[] = ['legs', 'glutes'];

/** Beginner-readable category for a catalog exercise. */
export function categoryOf(ex: CatalogExercise): LibraryCategory {
  if (ex.muscleGroup === 'cardio') return 'cardio';
  if (ex.muscleGroup === 'core') return 'core';
  if (LOWER.includes(ex.muscleGroup)) return 'lower';
  if (UPPER.includes(ex.muscleGroup)) return 'upper';
  // full_body or anything else → treat as upper for the simple beginner filter
  return 'upper';
}

export const CATEGORY_LABEL: Record<LibraryFilter, string> = {
  all: 'All',
  upper: 'Upper body',
  lower: 'Lower body',
  cardio: 'Cardio',
  core: 'Core',
  beginner_safe: 'Beginner safe',
};

function matchesQuery(ex: CatalogExercise, q: string): boolean {
  const needle = q.trim().toLowerCase();
  if (needle.length === 0) return true;
  const hay = [
    ex.name,
    ex.muscleGroup,
    ex.worksPlain,
    ...ex.primaryMuscles,
  ]
    .join(' ')
    .toLowerCase();
  return hay.includes(needle);
}

function matchesFilter(ex: CatalogExercise, filter: LibraryFilter): boolean {
  switch (filter) {
    case 'all':
      return true;
    case 'beginner_safe':
      return ex.beginnerFriendly;
    default:
      return categoryOf(ex) === filter;
  }
}

/** PURE: filter the catalog by free-text query + category/beginner filter. */
export function filterExercises(
  catalog: CatalogExercise[],
  query: string,
  filter: LibraryFilter,
): CatalogExercise[] {
  return catalog.filter((ex) => matchesFilter(ex, filter) && matchesQuery(ex, query));
}

/** The safer-alternative exercise for a given one, if defined. */
export function alternativeFor(ex: CatalogExercise): CatalogExercise | null {
  return ex.altSlug ? EXERCISE_BY_SLUG[ex.altSlug] ?? null : null;
}
