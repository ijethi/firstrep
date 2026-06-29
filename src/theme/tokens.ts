import { TextStyle } from 'react-native';

/**
 * Design tokens for FirstRep.
 * Beginner-first: generous spacing, large tap targets, calm high-contrast palette.
 * Everything in the app reads from here — no hardcoded colors/sizes in screens.
 */

export const colors = {
  primary: '#0E7C66', // calm gym green
  onPrimary: '#FFFFFF',
  bg: '#F6F8F7',
  bgAlt: '#E7ECEA',
  surface: '#FFFFFF',
  text: '#15201D',
  textMuted: '#5C6B66',
  success: '#1B873F',
  danger: '#C2410C',
  border: '#D7DEDB',
} as const;

export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 20,
  xl: 28,
  xxl: 40,
} as const;

export const radius = {
  sm: 8,
  md: 12,
  lg: 16,
  pill: 999,
} as const;

/** Beginner-friendly button sizing — big, glove/sweat-friendly tap targets. */
export const sizing = {
  buttonMinHeight: 56,
  touchTargetMin: 48,
} as const;

export const typography: Record<
  'h1' | 'h2' | 'h3' | 'body' | 'caption' | 'button',
  TextStyle
> = {
  h1: { fontSize: 28, fontWeight: '700', lineHeight: 34 },
  h2: { fontSize: 22, fontWeight: '700', lineHeight: 28 },
  h3: { fontSize: 17, fontWeight: '600', lineHeight: 22 },
  body: { fontSize: 16, fontWeight: '400', lineHeight: 24 },
  caption: { fontSize: 13, fontWeight: '500', lineHeight: 18 },
  button: { fontSize: 18, fontWeight: '700' },
};
