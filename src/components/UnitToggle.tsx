import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { colors, radius, spacing, typography } from '../theme';
import type { UnitSystem } from '../lib/units';

interface Props {
  value: UnitSystem;
  onChange: (unit: UnitSystem) => void;
}

const OPTIONS: { value: UnitSystem; label: string }[] = [
  { value: 'imperial', label: 'lb / in' },
  { value: 'metric', label: 'kg / cm' },
];

/** Two-option unit display toggle (imperial / metric). */
export default function UnitToggle({ value, onChange }: Props) {
  return (
    <View style={styles.row}>
      {OPTIONS.map((opt) => {
        const selected = value === opt.value;
        return (
          <Pressable
            key={opt.value}
            accessibilityRole="button"
            accessibilityState={{ selected }}
            onPress={() => onChange(opt.value)}
            style={({ pressed }) => [styles.btn, selected && styles.selected, pressed && styles.pressed]}
          >
            <Text style={[styles.label, selected && styles.labelSelected]}>{opt.label}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', gap: spacing.sm },
  btn: {
    flex: 1,
    minHeight: 48,
    borderRadius: radius.lg,
    borderWidth: 2,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surface,
  },
  selected: { borderColor: colors.primary, backgroundColor: '#E8F3F0' },
  pressed: { opacity: 0.85 },
  label: { ...typography.body, color: colors.text, fontWeight: '600' },
  labelSelected: { color: colors.primary },
});
