/** Root stack route params. Kept separate from the navigator to avoid import cycles. */
export type RootStackParamList = {
  Onboarding: undefined;
  Main: undefined;
  WorkoutGuide: { week?: number; dayNumber?: number } | undefined;
  SessionSummary: undefined;
};
