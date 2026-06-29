import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { ProgressCard, ScreenContainer } from '../components';
import { colors, spacing, typography } from '../theme';

export default function ProgressScreen() {
  return (
    <ScreenContainer scroll>
      <Text style={typography.h1}>Progress</Text>
      <Text style={[typography.body, styles.muted]}>
        You showed up 3 times this week. That&apos;s how change happens.
      </Text>

      <View style={styles.grid}>
        <ProgressCard title="Workout streak" value="3 days" emoji="🔥" />
        <ProgressCard title="Cardio this week" value="45 min" emoji="🏃" />
        <ProgressCard
          title="Body weight"
          value="—"
          caption="Log today's weight to start your trend"
          emoji="⚖️"
        />
        <ProgressCard title="Strength PR" value="Leg press 50 → 70 lb" emoji="💪" />
      </View>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  muted: { color: colors.textMuted },
  grid: { gap: spacing.md },
});
