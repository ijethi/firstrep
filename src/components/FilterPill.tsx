import React from 'react';
import { Pressable, StyleSheet, Text } from 'react-native';

import { colors, radius, spacing, typography } from '../theme';

interface Props {
  label: string;
  selected: boolean;
  onPress: () => void;
}

/** A selectable filter pill. */
export default function FilterPill({ label, selected, onPress }: Props) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ selected }}
      onPress={onPress}
      style={({ pressed }) => [styles.pill, selected && styles.selected, pressed && styles.pressed]}
    >
      <Text style={[styles.label, selected && styles.labelSelected]}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  pill: {
    borderRadius: radius.pill,
    borderWidth: 2,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  selected: { borderColor: colors.primary, backgroundColor: '#E8F3F0' },
  pressed: { opacity: 0.85 },
  label: { ...typography.caption, color: colors.text, fontWeight: '600' },
  labelSelected: { color: colors.primary },
});
