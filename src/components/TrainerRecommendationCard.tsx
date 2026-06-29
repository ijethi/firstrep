import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { colors, radius, spacing, typography } from '../theme';
import type { RecommendationPriority, TrainerRec } from '../types/database';

interface Props {
  rec: TrainerRec;
}

const ACCENT: Record<RecommendationPriority, string> = {
  safety: colors.danger,
  high: '#B45309',
  medium: colors.primary,
  low: colors.textMuted,
};

const ICON: Record<string, string> = {
  pain_safety: '⚠️',
  reduce_weight: '🔽',
  repeat_weight: '🔁',
  increase_weight: '⬆️',
  skip_repeat: '↩️',
  cardio_progress: '🏃',
  consistency: '🎉',
};

/** Beginner-friendly recommendation card; left accent color reflects priority. */
export default function TrainerRecommendationCard({ rec }: Props) {
  const accent = ACCENT[rec.priority];
  return (
    <View style={[styles.card, { borderLeftColor: accent }]}>
      <Text style={[styles.title, { color: accent }]}>
        {ICON[rec.type] ?? '💡'} {rec.title}
      </Text>
      <Text style={styles.message}>{rec.message}</Text>
      <View style={styles.actionChip}>
        <Text style={styles.actionText}>{rec.nextAction}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderLeftWidth: 5,
    padding: spacing.lg,
    gap: spacing.xs,
  },
  title: { ...typography.h3 },
  message: { ...typography.body, color: colors.text },
  actionChip: {
    alignSelf: 'flex-start',
    backgroundColor: colors.bgAlt,
    borderRadius: radius.pill,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    marginTop: spacing.xs,
  },
  actionText: { ...typography.caption, color: colors.text, fontWeight: '700' },
});
