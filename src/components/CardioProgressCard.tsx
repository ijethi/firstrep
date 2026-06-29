import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { colors, radius, spacing, typography } from '../theme';
import type { CardioProgress } from '../lib/progressStats';

interface Props {
  stats: CardioProgress;
}

function machineName(machine: string | null): string {
  switch (machine) {
    case 'treadmill':
      return 'Treadmill';
    case 'elliptical':
      return 'Elliptical';
    case 'stair_climber':
      return 'Stair climber';
    case 'bike':
      return 'Bike';
    default:
      return '—';
  }
}

/** Cardio totals: minutes, best single session, most recent machine. */
export default function CardioProgressCard({ stats }: Props) {
  return (
    <View style={styles.card}>
      <Text style={styles.title}>🏃 Cardio progress</Text>
      {stats.sessions === 0 ? (
        <Text style={styles.muted}>Add some cardio in a workout and it adds up here.</Text>
      ) : (
        <>
          <Text style={styles.line}>Total: {stats.totalMinutes} min</Text>
          <Text style={styles.line}>Best session: {stats.bestDuration} min</Text>
          <Text style={styles.line}>Most recent: {machineName(stats.recentMachine)}</Text>
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  card: { backgroundColor: colors.surface, borderRadius: radius.lg, padding: spacing.lg, gap: spacing.xs },
  title: { ...typography.h3, color: colors.text },
  muted: { ...typography.body, color: colors.textMuted },
  line: { ...typography.body, color: colors.text },
});
