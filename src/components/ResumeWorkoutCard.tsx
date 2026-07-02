import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

import AppButton from './AppButton';
import { colors, radius, spacing, typography } from '../theme';
import type { ResumeInfo } from '../lib/sessionRecovery';

interface Props {
  info: ResumeInfo;
  onContinue: () => void;
  onEnd: () => void;
  onDiscard: () => void;
}

/** Recovery prompt for an unfinished workout (safe-resume or corrupt-session). */
export default function ResumeWorkoutCard({ info, onContinue, onEnd, onDiscard }: Props) {
  if (!info.resumable) {
    return (
      <View style={styles.card}>
        <Text style={styles.title}>Unfinished workout</Text>
        <Text style={styles.body}>
          We couldn&apos;t safely resume this workout. You can start again from Today.
        </Text>
        <AppButton label="Clear it" variant="secondary" onPress={onDiscard} />
      </View>
    );
  }

  return (
    <View style={styles.card}>
      <Text style={styles.title}>You have a workout in progress</Text>
      <Text style={styles.body}>
        {info.dayName}
        {info.exerciseLabel ? ` · ${info.exerciseLabel}` : ''}
      </Text>
      <Text style={styles.prompt}>Do you want to continue or end it?</Text>

      <AppButton label="Continue workout" onPress={onContinue} />
      <AppButton label="End workout" variant="secondary" onPress={onEnd} />
      <AppButton label="Discard workout" variant="ghost" onPress={onDiscard} />
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#E8F3F0',
    borderRadius: radius.lg,
    padding: spacing.lg,
    gap: spacing.sm,
  },
  title: { ...typography.h3, color: colors.primary },
  body: { ...typography.body, color: colors.text },
  prompt: { ...typography.caption, color: colors.textMuted },
});
