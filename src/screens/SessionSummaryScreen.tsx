import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';

import { AppButton, ScreenContainer } from '../components';
import { colors, radius, spacing, typography } from '../theme';
import { RootStackParamList } from '../navigation/types';
import { useWorkoutSessionStore } from '../state/workoutSessionStore';

type Nav = NativeStackNavigationProp<RootStackParamList>;

export default function SessionSummaryScreen() {
  const navigation = useNavigation<Nav>();
  const session = useWorkoutSessionStore((s) => s.session);

  if (!session) {
    return (
      <ScreenContainer scroll>
        <Text style={typography.h1}>All done</Text>
        <Text style={[typography.body, styles.muted]}>No session to summarize.</Text>
        <AppButton label="Back to Today" onPress={() => navigation.navigate('Main')} />
      </ScreenContainer>
    );
  }

  const totalSets = session.exercises.reduce((sum, ex) => sum + ex.sets.length, 0);
  const skipped = session.exercises.filter((ex) => ex.skipped).length;
  const painCount = session.exercises.filter((ex) => ex.painReported).length;
  const cardioMin = session.cardio && !session.cardio.skipped ? session.cardio.completedMinutes ?? 0 : 0;

  return (
    <ScreenContainer scroll>
      <Text style={typography.h1}>Great work! 🎉</Text>
      <Text style={[typography.body, styles.muted]}>
        {session.dayName} · You showed up — that&apos;s what counts.
      </Text>

      <View style={styles.statsRow}>
        <Stat value={String(totalSets)} label="sets logged" />
        <Stat value={String(cardioMin)} label="cardio min" />
        <Stat value={String(skipped)} label="skipped" />
      </View>

      <View style={styles.card}>
        {session.exercises.map((ex) => (
          <View key={ex.exerciseId} style={styles.exRow}>
            <Text style={styles.exName}>{ex.name}</Text>
            <Text style={styles.exMeta}>
              {ex.skipped
                ? 'Skipped'
                : `${ex.sets.length}/${ex.targetSets} sets${ex.painReported ? ' · ⚠️ pain' : ''}`}
            </Text>
          </View>
        ))}
        {session.cardio ? (
          <View style={styles.exRow}>
            <Text style={styles.exName}>Cardio</Text>
            <Text style={styles.exMeta}>
              {session.cardio.skipped
                ? 'Skipped'
                : `${session.cardio.completedMinutes ?? 0} min${
                    session.cardio.intensity ? ` · ${session.cardio.intensity}` : ''
                  }`}
            </Text>
          </View>
        ) : null}
      </View>

      {painCount > 0 ? (
        <Text style={[typography.caption, styles.painNote]}>
          We noticed some pain today. Your next plan can swap in safer options.
        </Text>
      ) : null}

      <AppButton label="Back to Today" onPress={() => navigation.navigate('Main')} />
    </ScreenContainer>
  );
}

function Stat({ value, label }: { value: string; label: string }) {
  return (
    <View style={styles.stat}>
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  muted: { color: colors.textMuted },
  statsRow: { flexDirection: 'row', gap: spacing.md },
  stat: {
    flex: 1,
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: spacing.lg,
    alignItems: 'center',
    gap: spacing.xs,
  },
  statValue: { ...typography.h1, color: colors.primary },
  statLabel: { ...typography.caption, color: colors.textMuted, textAlign: 'center' },
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: spacing.lg,
    gap: spacing.sm,
  },
  exRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  exName: { ...typography.body, color: colors.text, flex: 1 },
  exMeta: { ...typography.body, color: colors.textMuted },
  painNote: { color: colors.danger },
});
