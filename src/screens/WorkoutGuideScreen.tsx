import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';

import { AppButton, ScreenContainer } from '../components';
import { colors, radius, spacing, typography } from '../theme';

export default function WorkoutGuideScreen() {
  const navigation = useNavigation();

  return (
    <ScreenContainer scroll>
      <Text style={typography.caption}>Exercise 1 of 3</Text>
      <Text style={typography.h1}>Lat Pulldown</Text>
      <Text style={[typography.body, styles.muted]}>Works your back.</Text>

      <View style={styles.imageBox}>
        <Text style={styles.imageEmoji}>🏋️</Text>
        <Text style={styles.imageHint}>Image coming soon</Text>
      </View>

      <Text style={typography.h3}>Setup</Text>
      <Text style={typography.body}>1) Sit down, knees snug under the pad.</Text>
      <Text style={typography.body}>2) Grab the wide bar with both hands.</Text>
      <Text style={typography.body}>3) Pull to your chest, squeeze, then slowly release.</Text>

      <Text style={[typography.h3, styles.spaced]}>
        Target: 3 sets × 12 reps · Start light: 30 lb
      </Text>

      <AppButton label="Log this set" onPress={() => {}} />
      <AppButton label="Swap exercise" variant="secondary" onPress={() => {}} />
      <AppButton label="Back to Today" variant="ghost" onPress={() => navigation.goBack()} />
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  muted: { color: colors.textMuted },
  spaced: { marginTop: spacing.sm },
  imageBox: {
    height: 180,
    borderRadius: radius.lg,
    backgroundColor: colors.bgAlt,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
  },
  imageEmoji: { fontSize: 48 },
  imageHint: { ...typography.caption, color: colors.textMuted },
});
