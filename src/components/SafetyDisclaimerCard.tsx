import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { colors, radius, spacing, typography } from '../theme';
import { DISCLAIMER_TEXT } from '../lib/safety';

/** Reusable card showing the short, non-medical safety disclaimer. */
export default function SafetyDisclaimerCard() {
  return (
    <View style={styles.card}>
      <Text style={styles.title}>A quick safety note</Text>
      <Text style={styles.body}>{DISCLAIMER_TEXT}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderLeftWidth: 5,
    borderLeftColor: colors.primary,
    padding: spacing.lg,
    gap: spacing.sm,
  },
  title: { ...typography.h3, color: colors.text },
  body: { ...typography.body, color: colors.text },
});
