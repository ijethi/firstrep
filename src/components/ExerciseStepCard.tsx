import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { colors, radius, spacing, typography } from '../theme';
import type { PlanStrengthExercise } from '../types/database';

interface Props {
  exercise: PlanStrengthExercise;
  exerciseIndex: number; // 0-based
  totalExercises: number;
}

const SAFETY = 'Stop if you feel sharp pain.';

/** Presentational card showing everything a beginner needs at the machine. */
export default function ExerciseStepCard({ exercise, exerciseIndex, totalExercises }: Props) {
  return (
    <View style={styles.wrap}>
      <Text style={styles.progress}>
        Exercise {exerciseIndex + 1} of {totalExercises}
      </Text>
      <Text style={typography.h1}>{exercise.name}</Text>

      <View style={styles.imageBox}>
        <Text style={styles.imageEmoji}>🏋️</Text>
        <Text style={styles.imageHint}>Image coming soon</Text>
      </View>

      <Text style={styles.target}>
        {exercise.sets} sets × {exercise.repMin}–{exercise.repMax} reps · rest {exercise.restSeconds}s
      </Text>

      <Text style={styles.label}>Setup</Text>
      <Text style={styles.text}>{exercise.setupNote}</Text>

      <Text style={styles.label}>Form tip</Text>
      <Text style={styles.text}>{exercise.formTip}</Text>

      <Text style={styles.label}>Weight</Text>
      <Text style={styles.text}>{exercise.startingWeightGuidance}</Text>

      <View style={styles.safety}>
        <Text style={styles.safetyText}>⚠️ {SAFETY}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: spacing.xs },
  progress: { ...typography.caption, color: colors.primary, fontWeight: '700' },
  imageBox: {
    height: 160,
    borderRadius: radius.lg,
    backgroundColor: colors.bgAlt,
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: spacing.sm,
  },
  imageEmoji: { fontSize: 44 },
  imageHint: { ...typography.caption, color: colors.textMuted },
  target: { ...typography.h3, color: colors.text },
  label: { ...typography.caption, color: colors.textMuted, marginTop: spacing.sm },
  text: { ...typography.body, color: colors.text },
  safety: {
    marginTop: spacing.sm,
    backgroundColor: '#FCECE3',
    borderRadius: radius.md,
    padding: spacing.md,
  },
  safetyText: { ...typography.body, color: colors.danger, fontWeight: '600' },
});
