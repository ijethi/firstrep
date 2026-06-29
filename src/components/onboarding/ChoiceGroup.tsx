import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { colors, radius, sizing, spacing, typography } from '../../theme';

export interface ChoiceOption<T extends string | number> {
  label: string;
  value: T;
  description?: string;
}

interface Props<T extends string | number> {
  options: ChoiceOption<T>[];
  value: T | null;
  onSelect: (value: T) => void;
}

/** Single-select list of big, beginner-friendly option cards. */
export default function ChoiceGroup<T extends string | number>({
  options,
  value,
  onSelect,
}: Props<T>) {
  return (
    <View style={styles.group}>
      {options.map((opt) => {
        const selected = opt.value === value;
        return (
          <Pressable
            key={String(opt.value)}
            accessibilityRole="radio"
            accessibilityState={{ selected }}
            onPress={() => onSelect(opt.value)}
            style={({ pressed }) => [
              styles.option,
              selected && styles.optionSelected,
              pressed && styles.pressed,
            ]}
          >
            <Text style={[styles.label, selected && styles.labelSelected]}>{opt.label}</Text>
            {opt.description ? <Text style={styles.description}>{opt.description}</Text> : null}
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  group: { gap: spacing.sm },
  option: {
    minHeight: sizing.touchTargetMin,
    backgroundColor: colors.surface,
    borderWidth: 2,
    borderColor: colors.border,
    borderRadius: radius.lg,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    gap: 2,
  },
  optionSelected: { borderColor: colors.primary, backgroundColor: '#E8F3F0' },
  pressed: { opacity: 0.85 },
  label: { ...typography.h3, color: colors.text },
  labelSelected: { color: colors.primary },
  description: { ...typography.caption, color: colors.textMuted },
});
