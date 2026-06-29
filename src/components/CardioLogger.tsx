import React, { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { colors, radius, spacing, typography } from '../theme';
import { NumberField } from './onboarding';
import AppButton from './AppButton';
import type { CardioIntensity } from '../types/database';

interface Props {
  machineName: string;
  plannedMinutes: number;
  onSave: (data: { completedMinutes: number | null; intensity: CardioIntensity | null }) => void;
  onSkip: () => void;
}

const INTENSITIES: { value: CardioIntensity; label: string }[] = [
  { value: 'easy', label: 'Easy' },
  { value: 'moderate', label: 'Moderate' },
  { value: 'hard', label: 'Hard' },
];

/** Logs the cardio block: completed minutes + intensity. */
export default function CardioLogger({ machineName, plannedMinutes, onSave, onSkip }: Props) {
  const [minutes, setMinutes] = useState<string>(String(plannedMinutes));
  const [intensity, setIntensity] = useState<CardioIntensity | null>(null);

  const save = () => {
    const m = parseInt(minutes, 10);
    onSave({ completedMinutes: Number.isNaN(m) ? null : m, intensity });
  };

  return (
    <View style={styles.card}>
      <Text style={styles.title}>🏃 Cardio — {machineName}</Text>
      <Text style={styles.planned}>Planned: {plannedMinutes} min. Go at a talk-friendly pace.</Text>

      <Text style={styles.fieldLabel}>Minutes completed</Text>
      <NumberField value={minutes} onChangeText={setMinutes} suffix="min" />

      <Text style={styles.fieldLabel}>How hard was it?</Text>
      <View style={styles.row}>
        {INTENSITIES.map((opt) => {
          const selected = intensity === opt.value;
          return (
            <Pressable
              key={opt.value}
              accessibilityRole="button"
              accessibilityState={{ selected }}
              onPress={() => setIntensity(opt.value)}
              style={({ pressed }) => [
                styles.btn,
                selected && styles.btnSelected,
                pressed && styles.pressed,
              ]}
            >
              <Text style={[styles.btnText, selected && styles.btnTextSelected]}>{opt.label}</Text>
            </Pressable>
          );
        })}
      </View>

      <AppButton label="Save cardio" onPress={save} disabled={intensity == null} />
      <AppButton label="Skip cardio" variant="ghost" onPress={onSkip} />
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: spacing.lg,
    gap: spacing.sm,
  },
  title: { ...typography.h2, color: colors.primary },
  planned: { ...typography.body, color: colors.textMuted },
  fieldLabel: { ...typography.caption, color: colors.textMuted, marginTop: spacing.xs },
  row: { flexDirection: 'row', gap: spacing.sm },
  btn: {
    flex: 1,
    minHeight: 52,
    borderWidth: 2,
    borderColor: colors.border,
    borderRadius: radius.lg,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surface,
  },
  btnSelected: { borderColor: colors.primary, backgroundColor: '#E8F3F0' },
  btnText: { ...typography.h3, color: colors.text },
  btnTextSelected: { color: colors.primary },
  pressed: { opacity: 0.85 },
});
