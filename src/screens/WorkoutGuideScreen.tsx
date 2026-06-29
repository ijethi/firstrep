import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';

import { AppButton, ScreenContainer } from '../components';
import { colors, radius, spacing, typography } from '../theme';
import { RootStackParamList } from '../navigation/types';
import { getPlanDay, usePlanStore } from '../state/planStore';

type GuideRoute = RouteProp<RootStackParamList, 'WorkoutGuide'>;

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

export default function WorkoutGuideScreen() {
  const navigation = useNavigation();
  const route = useRoute<GuideRoute>();
  const week = route.params?.week ?? 1;
  const dayNumber = route.params?.dayNumber ?? 1;

  const plan = usePlanStore((s) => s.plan);
  const day = getPlanDay(plan, week, dayNumber);

  if (!day) {
    return (
      <ScreenContainer scroll>
        <Text style={typography.h1}>Workout</Text>
        <Text style={[typography.body, styles.muted]}>
          No workout to show yet. Finish onboarding to generate your plan.
        </Text>
        <AppButton label="Back" variant="ghost" onPress={() => navigation.goBack()} />
      </ScreenContainer>
    );
  }

  return (
    <ScreenContainer scroll>
      <Text style={styles.weekLabel}>
        Week {day.weekNumber} · Day {day.dayNumber}
      </Text>
      <Text style={typography.h1}>{day.name}</Text>
      <Text style={[typography.body, styles.muted]}>
        ~{day.estimatedMinutes} min · You&apos;ll need: water, a towel, comfy shoes.
      </Text>

      {/* Strength list */}
      {day.strength.map((ex, i) => (
        <View key={ex.exerciseId} style={styles.exCard}>
          <View style={styles.exHeader}>
            <Text style={styles.exIndex}>{i + 1}</Text>
            <View style={styles.exHeaderText}>
              <Text style={styles.exName}>{ex.name}</Text>
              <Text style={styles.exSets}>
                {ex.sets} sets × {ex.repMin}–{ex.repMax} reps · rest {ex.restSeconds}s
              </Text>
            </View>
          </View>
          <View style={styles.imageBox}>
            <Text style={styles.imageEmoji}>🏋️</Text>
            <Text style={styles.imageHint}>Image coming soon</Text>
          </View>
          <Text style={styles.lineLabel}>Weight</Text>
          <Text style={styles.lineText}>{ex.startingWeightGuidance}</Text>
          <Text style={styles.lineLabel}>Setup</Text>
          <Text style={styles.lineText}>{ex.setupNote}</Text>
          <Text style={styles.lineLabel}>Form tip</Text>
          <Text style={styles.lineText}>{ex.formTip}</Text>
        </View>
      ))}

      {/* Cardio block */}
      {day.cardio ? (
        <View style={styles.cardioCard}>
          <Text style={styles.cardioTitle}>🏃 Cardio — {cardioName(day.cardio.machine)}</Text>
          <Text style={styles.lineText}>{day.cardio.minutes} minutes</Text>
          <Text style={styles.lineLabel}>Intensity</Text>
          <Text style={styles.lineText}>{day.cardio.intensityGuidance}</Text>
          <Text style={styles.lineText}>{day.cardio.beginnerNote}</Text>
        </View>
      ) : null}

      {/* Beginner safety note */}
      <View style={styles.noteCard}>
        <Text style={styles.noteText}>{day.beginnerNote}</Text>
      </View>

      <AppButton label="Start workout (logging coming soon)" disabled onPress={() => {}} />
      <AppButton label="Back to Today" variant="ghost" onPress={() => navigation.goBack()} />
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  muted: { color: colors.textMuted },
  weekLabel: { ...typography.caption, color: colors.primary, fontWeight: '700' },
  exCard: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: spacing.lg,
    gap: spacing.xs,
  },
  exHeader: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  exIndex: {
    ...typography.h3,
    color: colors.onPrimary,
    backgroundColor: colors.primary,
    width: 32,
    height: 32,
    borderRadius: radius.pill,
    textAlign: 'center',
    lineHeight: 32,
    overflow: 'hidden',
  },
  exHeaderText: { flex: 1 },
  exName: { ...typography.h3, color: colors.text },
  exSets: { ...typography.caption, color: colors.textMuted },
  imageBox: {
    height: 120,
    borderRadius: radius.md,
    backgroundColor: colors.bgAlt,
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: spacing.xs,
  },
  imageEmoji: { fontSize: 36 },
  imageHint: { ...typography.caption, color: colors.textMuted },
  lineLabel: { ...typography.caption, color: colors.textMuted, marginTop: spacing.xs },
  lineText: { ...typography.body, color: colors.text },
  cardioCard: {
    backgroundColor: '#E8F3F0',
    borderRadius: radius.lg,
    padding: spacing.lg,
    gap: spacing.xs,
  },
  cardioTitle: { ...typography.h3, color: colors.primary },
  noteCard: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.lg,
    padding: spacing.lg,
  },
  noteText: { ...typography.body, color: colors.text },
});
