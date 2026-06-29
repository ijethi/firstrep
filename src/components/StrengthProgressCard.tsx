import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { colors, radius, spacing, typography } from '../theme';
import type { StrengthProgress } from '../lib/progressStats';

interface Props {
  items: StrengthProgress[];
}

/** Per-machine strength progress: best + recent weight, or learning copy. */
export default function StrengthProgressCard({ items }: Props) {
  return (
    <View style={styles.card}>
      <Text style={styles.title}>💪 Strength progress</Text>
      {items.length === 0 ? (
        <Text style={styles.muted}>Log some sets and your strength progress shows up here.</Text>
      ) : (
        items.map((it) => (
          <View key={it.exerciseId} style={styles.row}>
            <Text style={styles.name}>{it.name}</Text>
            {it.learning || it.bestWeightLb == null ? (
              <Text style={styles.learning}>
                You&apos;re still learning this machine — keep the same weight until it feels controlled.
              </Text>
            ) : (
              <Text style={styles.stat}>
                Best {it.bestWeightLb} lb · Last {it.recentWeightLb ?? '—'} lb
              </Text>
            )}
          </View>
        ))
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  card: { backgroundColor: colors.surface, borderRadius: radius.lg, padding: spacing.lg, gap: spacing.sm },
  title: { ...typography.h3, color: colors.text },
  muted: { ...typography.body, color: colors.textMuted },
  row: { borderTopWidth: 1, borderTopColor: colors.border, paddingTop: spacing.sm, gap: 2 },
  name: { ...typography.body, color: colors.text, fontWeight: '700' },
  stat: { ...typography.body, color: colors.primary },
  learning: { ...typography.caption, color: colors.textMuted },
});
