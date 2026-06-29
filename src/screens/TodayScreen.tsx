import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { ScreenContainer } from '../components';
import { colors, radius, spacing, typography } from '../theme';
import { useOnboardingStore } from '../state/onboardingStore';

const GOAL_LABEL: Record<string, string> = { weight_loss: 'Lose weight' };

export default function TodayScreen() {
  const { answers, completed } = useOnboardingStore();

  return (
    <ScreenContainer scroll>
      <Text style={typography.h1}>Today</Text>

      {completed ? (
        <View style={styles.readyCard}>
          <Text style={styles.readyTitle}>Your beginner plan is ready 🎉</Text>
          <Text style={styles.readyBody}>Next step: generate your Week 1 workout.</Text>
        </View>
      ) : (
        <Text style={[typography.body, styles.muted]}>
          Finish onboarding to see your plan.
        </Text>
      )}

      {completed ? (
        <View style={styles.summary}>
          <Text style={styles.summaryLine}>
            🎯 Goal: {answers.goal ? GOAL_LABEL[answers.goal] : '—'}
          </Text>
          <Text style={styles.summaryLine}>
            📅 {answers.daysPerWeek ?? '—'} days/week · {answers.workoutLengthMin ?? '—'} min sessions
          </Text>
          <Text style={styles.summaryLine}>
            🏋️ Experience: {answers.experience === 'some' ? 'Some' : 'Beginner'}
          </Text>
        </View>
      ) : null}
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  muted: { color: colors.textMuted },
  readyCard: {
    backgroundColor: '#E8F3F0',
    borderRadius: radius.lg,
    padding: spacing.lg,
    gap: spacing.xs,
  },
  readyTitle: { ...typography.h2, color: colors.primary },
  readyBody: { ...typography.body, color: colors.text },
  summary: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: spacing.lg,
    gap: spacing.sm,
  },
  summaryLine: { ...typography.body, color: colors.text },
});
