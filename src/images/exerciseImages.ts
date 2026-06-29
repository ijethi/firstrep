import { ImageSourcePropType } from 'react-native';

/**
 * Exercise image system (decision D8 / Q3).
 *
 * Screens and components NEVER hardcode image paths. They call `getExerciseImage(slug)`.
 * Today every slug returns `null`, so components render a friendly placeholder.
 *
 * Later, we drop licensed or custom illustrations into the `registry` below
 * (local `require(...)`) OR swap to remote Supabase Storage URLs — WITHOUT touching
 * any screen or component. This is the seam that keeps the app structure stable
 * when real art arrives.
 */

const registry: Record<string, ImageSourcePropType> = {
  // Example for later — uncomment when assets exist:
  // 'lat-pulldown': require('../../assets/exercises/lat-pulldown.png'),
  // or remote: 'lat-pulldown': { uri: 'https://<supabase>/machine-images/lat-pulldown.png' },
};

export function getExerciseImage(slug: string): ImageSourcePropType | null {
  return registry[slug] ?? null;
}

export function hasExerciseImage(slug: string): boolean {
  return slug in registry;
}
