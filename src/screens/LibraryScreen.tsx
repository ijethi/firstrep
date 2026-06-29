import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { ExerciseCard, ScreenContainer } from '../components';
import { colors, spacing, typography } from '../theme';

export default function LibraryScreen() {
  return (
    <ScreenContainer scroll>
      <Text style={typography.h1}>Exercise Library</Text>
      <Text style={[typography.body, styles.muted]}>
        Curious about a machine? Look it up before you try it — no pressure.
      </Text>

      <View style={styles.list}>
        <ExerciseCard name="Lat Pulldown" worksPlain="Works your back" slug="lat-pulldown" />
        <ExerciseCard name="Leg Press" worksPlain="Works your legs" slug="leg-press" />
        <ExerciseCard name="Chest Press" worksPlain="Works your chest" slug="chest-press" />
        <ExerciseCard name="Seated Row" worksPlain="Works your back" slug="seated-row" />
        <ExerciseCard
          name="Treadmill"
          worksPlain="Cardio — burns extra calories"
          slug="treadmill"
        />
      </View>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  muted: { color: colors.textMuted },
  list: { gap: spacing.sm },
});
