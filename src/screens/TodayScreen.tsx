import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';

import { AppButton, ScreenContainer } from '../components';
import { colors, radius, spacing, typography } from '../theme';
import { RootStackParamList } from '../navigation/types';
import { useOnboardingStore } from '../state/onboardingStore';
import { getPlanDay, usePlanStore } from '../state/planStore';
import { useWorkoutSessionStore } from '../state/workoutSessionStore';
import { useProgressStore } from '../state/progressStore';
import { useRecommendationStore } from '../state/recommendationStore';
import { applyRecommendations } from '../lib/recommendationApplicator';

type Nav = NativeStackNavigationProp<RootStackParamList>;

export default function TodayScreen() {
  const navigation = useNavigation<Nav>();
  const completed = useOnboardingStore((s) => s.completed);
  const plan = usePlanStore((s) => s.plan);
  const day = getPlanDay(plan, 1, 1);
  const history = useProgressStore((s) => s.history);
  const priorRecs = useRecommendationStore((s) => s.recommendations);

  // Adaptive view over the base day (B-08). Falls back to base when no history.
  const adaptiveDay = applyRecommendations(day, history, priorRecs);

  // Defensive: never crash if onboarding is incomplete or no plan exists yet.
  if (!completed || !plan || !day) {
    return (
      <ScreenContainer scroll>
        <Text style={typography.h1}>Today</Text>
        <Text style={[typography.body, styles.muted]}>
          Finish onboarding to see your Week 1 workout.
        </Text>
      </ScreenContainer>
    );
  }

  return (
    <ScreenContainer scroll>
      <Text style={typography.h1}>Today</Text>
      <Text style={styles.weekLabel}>Week 1 · Day 1</Text>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>{day.name}</Text>
        <Text style={styles.cardMeta}>
          ~{day.estimatedMinutes} min · {day.strength.length}{' '}
          {day.strength.length === 1 ? 'machine' : 'machines'}
          {day.cardio ? ` · ${day.cardio.minutes} min cardio` : ''}
        </Text>

        {day.strength.map((ex, i) => {
          const adaptiveEx = adaptiveDay?.strength[i];
          const hint = adaptiveEx?.adapted
            ? adaptiveEx.safetyWarning ?? adaptiveEx.whyExplanation
            : null;
          return (
            <View key={ex.exerciseId} style={styles.exRow}>
              <View style={styles.exNameWrap}>
                <Text style={styles.exName}>{ex.name}</Text>
                {hint ? <Text style={styles.exHint}>{hint}</Text> : null}
              </View>
              <Text style={styles.exMeta}>
                {ex.sets} × {ex.repMin}–{ex.repMax}
              </Text>
            </View>
          );
        })}

        {day.cardio ? (
          <View style={styles.cardioRow}>
            <Text style={styles.cardioLabel}>🏃 Cardio</Text>
            <Text style={styles.cardioText}>
              {cardioName(day.cardio.machine)} · {day.cardio.minutes} min
            </Text>
          </View>
        ) : null}
      </View>

      <Text style={[typography.caption, styles.note]}>{day.beginnerNote}</Text>

      <AppButton
        label="Start Workout"
        onPress={() => {
          useWorkoutSessionStore.getState().startSession(day, new Date().toISOString());
          navigation.navigate('WorkoutGuide', { week: 1, dayNumber: 1 });
        }}
      />
    </ScreenContainer>
  );
}

function cardioName(machine: string): string {
  switch (machine) {
    case 'treadmill':
      return 'Treadmill incline walk';
    case 'elliptical':
      return 'Elliptical';
    case 'stair_climber':
      return 'Stair climber';
    case 'bike':
      return 'Bike';
    default:
      return 'Cardio';
  }
}

const styles = StyleSheet.create({
  muted: { color: colors.textMuted },
  weekLabel: { ...typography.caption, color: colors.primary, fontWeight: '700' },
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: spacing.lg,
    gap: spacing.sm,
  },
  cardTitle: { ...typography.h2, color: colors.text },
  cardMeta: { ...typography.caption, color: colors.textMuted },
  exRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: colors.border,
    paddingTop: spacing.sm,
  },
  exNameWrap: { flex: 1, paddingRight: spacing.sm, gap: 2 },
  exName: { ...typography.body, color: colors.text },
  exHint: { ...typography.caption, color: colors.primary },
  exMeta: { ...typography.body, color: colors.primary, fontWeight: '700' },
  cardioRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    borderTopWidth: 1,
    borderTopColor: colors.border,
    paddingTop: spacing.sm,
  },
  cardioLabel: { ...typography.body, color: colors.text },
  cardioText: { ...typography.body, color: colors.textMuted },
  note: { color: colors.textMuted },
});
