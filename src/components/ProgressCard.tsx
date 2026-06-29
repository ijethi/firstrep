import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { colors, radius, spacing, typography } from '../theme';

type Props = {
  title: string;
  value: string;
  caption?: string;
  emoji?: string;
};

/** A single stat tile for the Progress dashboard (streak, cardio minutes, etc.). */
export default function ProgressCard({ title, value, caption, emoji }: Props) {
  return (
    <View style={styles.card}>
      <Text style={styles.title}>
        {emoji ? `${emoji} ` : ''}
        {title}
      </Text>
      <Text style={styles.value}>{value}</Text>
      {caption ? <Text style={styles.caption}>{caption}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: spacing.lg,
    gap: spacing.xs,
  },
  title: { ...typography.caption, color: colors.textMuted },
  value: { ...typography.h2, color: colors.text },
  caption: { ...typography.caption, color: colors.textMuted },
});
