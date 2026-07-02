import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

import AppButton from './AppButton';
import { colors, radius, spacing, typography } from '../theme';
import {
  CONFIDENCE_LABEL,
  ENERGY_LABEL,
  SORENESS_LABEL,
  weeklyCheckInMessages,
} from '../lib/weeklyCheckIn';
import type { WeeklyCheckInEntry } from '../types/database';

interface Props {
  latest: WeeklyCheckInEntry | null;
  onStart: () => void;
}

/** Prompts a weekly check-in, or shows the latest one's summary + coaching. */
export default function WeeklyCheckInCard({ latest, onStart }: Props) {
  if (!latest) {
    return (
      <View style={styles.card}>
        <Text style={styles.title}>How did this week feel?</Text>
        <Text style={styles.body}>
          A quick 1-minute check-in helps us coach you. No right answers — just be honest.
        </Text>
        <AppButton label="Start weekly check-in" onPress={onStart} />
      </View>
    );
  }

  const messages = weeklyCheckInMessages(latest);

  return (
    <View style={styles.card}>
      <Text style={styles.title}>Your weekly check-in</Text>
      <Text style={styles.summary}>
        Week {latest.weekNumber} · {latest.workoutsCompleted}{' '}
        {latest.workoutsCompleted === 1 ? 'workout' : 'workouts'} · Energy{' '}
        {ENERGY_LABEL[latest.energy]} · Soreness {SORENESS_LABEL[latest.soreness]} · Confidence{' '}
        {CONFIDENCE_LABEL[latest.confidence]}
      </Text>

      {messages.map((m, i) => (
        <Text key={i} style={styles.message}>
          💬 {m}
        </Text>
      ))}

      {latest.smallGoal.trim().length > 0 ? (
        <Text style={styles.goal}>🎯 Your goal: {latest.smallGoal}</Text>
      ) : null}

      <AppButton label="Update check-in" variant="secondary" onPress={onStart} />
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: spacing.lg,
    gap: spacing.sm,
  },
  title: { ...typography.h3, color: colors.text },
  body: { ...typography.body, color: colors.textMuted },
  summary: { ...typography.caption, color: colors.textMuted },
  message: { ...typography.body, color: colors.primary },
  goal: { ...typography.body, color: colors.text, fontWeight: '600' },
});
