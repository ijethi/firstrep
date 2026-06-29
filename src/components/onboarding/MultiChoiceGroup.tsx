import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { colors, radius, spacing, typography } from '../../theme';

export interface MultiOption {
  label: string;
  value: string;
}

interface Props {
  options: MultiOption[];
  /** The "none" value clears all others; selecting any other clears "none". */
  noneValue?: string;
  selected: string[];
  onChange: (next: string[]) => void;
}

/** Multi-select chips (e.g. injuries) with a mutually-exclusive "None" option. */
export default function MultiChoiceGroup({ options, noneValue, selected, onChange }: Props) {
  const toggle = (value: string) => {
    if (noneValue && value === noneValue) {
      onChange([noneValue]);
      return;
    }
    const withoutNone = selected.filter((v) => v !== noneValue);
    const next = withoutNone.includes(value)
      ? withoutNone.filter((v) => v !== value)
      : [...withoutNone, value];
    onChange(next);
  };

  return (
    <View style={styles.wrap}>
      {options.map((opt) => {
        const isSelected = selected.includes(opt.value);
        return (
          <Pressable
            key={opt.value}
            accessibilityRole="checkbox"
            accessibilityState={{ checked: isSelected }}
            onPress={() => toggle(opt.value)}
            style={({ pressed }) => [
              styles.chip,
              isSelected && styles.chipSelected,
              pressed && styles.pressed,
            ]}
          >
            <Text style={[styles.label, isSelected && styles.labelSelected]}>{opt.label}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  chip: {
    borderWidth: 2,
    borderColor: colors.border,
    borderRadius: radius.pill,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    backgroundColor: colors.surface,
  },
  chipSelected: { borderColor: colors.primary, backgroundColor: '#E8F3F0' },
  pressed: { opacity: 0.85 },
  label: { ...typography.body, color: colors.text },
  labelSelected: { color: colors.primary, fontWeight: '700' },
});
