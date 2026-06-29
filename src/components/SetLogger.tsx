import React, { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { colors, radius, spacing, typography } from '../theme';
import { NumberField } from './onboarding';
import AppButton from './AppButton';
import type { SetEffort } from '../types/database';

interface LoggedSetInput {
  weightLb: number | null;
  reps: number | null;
  effort: SetEffort | null;
  pain: boolean;
}

interface Props {
  setNumber: number; // 1-based
  totalSets: number;
  initialWeight?: string; // pre-fill (e.g. last set's weight)
  onSave: (set: LoggedSetInput) => void;
}

const EFFORTS: { value: SetEffort; label: string }[] = [
  { value: 'easy', label: 'Easy' },
  { value: 'good', label: 'Good' },
  { value: 'hard', label: 'Hard' },
];

/** Logs one set: weight (lb), reps, effort, and a pain toggle. */
export default function SetLogger({ setNumber, totalSets, initialWeight, onSave }: Props) {
  const [weight, setWeight] = useState<string>(initialWeight ?? '');
  const [reps, setReps] = useState<string>('');
  const [effort, setEffort] = useState<SetEffort | null>(null);
  const [pain, setPain] = useState(false);

  const canSave = effort != null; // weight/reps optional but encouraged

  const save = () => {
    const w = parseFloat(weight);
    const r = parseInt(reps, 10);
    onSave({
      weightLb: Number.isNaN(w) ? null : w,
      reps: Number.isNaN(r) ? null : r,
      effort,
      pain,
    });
  };

  return (
    <View style={styles.card}>
      <Text style={styles.setLabel}>
        Set {setNumber} of {totalSets}
      </Text>

      <Text style={styles.fieldLabel}>Weight</Text>
      <NumberField value={weight} onChangeText={setWeight} suffix="lb" placeholder="e.g. 30" />

      <Text style={styles.fieldLabel}>Reps completed</Text>
      <NumberField value={reps} onChangeText={setReps} suffix="reps" placeholder="e.g. 12" />

      <Text style={styles.fieldLabel}>How did that feel?</Text>
      <View style={styles.effortRow}>
        {EFFORTS.map((e) => {
          const selected = effort === e.value;
          return (
            <Pressable
              key={e.value}
              accessibilityRole="button"
              accessibilityState={{ selected }}
              onPress={() => setEffort(e.value)}
              style={({ pressed }) => [
                styles.effortBtn,
                selected && styles.effortSelected,
                pressed && styles.pressed,
              ]}
            >
              <Text style={[styles.effortText, selected && styles.effortTextSelected]}>
                {e.label}
              </Text>
            </Pressable>
          );
        })}
      </View>

      <Pressable
        accessibilityRole="switch"
        accessibilityState={{ checked: pain }}
        onPress={() => setPain((p) => !p)}
        style={({ pressed }) => [styles.painRow, pain && styles.painActive, pressed && styles.pressed]}
      >
        <Text style={[styles.painText, pain && styles.painTextActive]}>
          {pain ? '⚠️ I felt pain' : 'No pain'}
        </Text>
        <Text style={styles.painHint}>{pain ? 'Tap to undo' : 'Tap if it hurt'}</Text>
      </Pressable>

      <AppButton label="Save set" onPress={save} disabled={!canSave} />
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
  setLabel: { ...typography.h3, color: colors.primary },
  fieldLabel: { ...typography.caption, color: colors.textMuted, marginTop: spacing.xs },
  effortRow: { flexDirection: 'row', gap: spacing.sm },
  effortBtn: {
    flex: 1,
    minHeight: 52,
    borderWidth: 2,
    borderColor: colors.border,
    borderRadius: radius.lg,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surface,
  },
  effortSelected: { borderColor: colors.primary, backgroundColor: '#E8F3F0' },
  effortText: { ...typography.h3, color: colors.text },
  effortTextSelected: { color: colors.primary },
  pressed: { opacity: 0.85 },
  painRow: {
    marginTop: spacing.xs,
    borderWidth: 2,
    borderColor: colors.border,
    borderRadius: radius.lg,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  painActive: { borderColor: colors.danger, backgroundColor: '#FCECE3' },
  painText: { ...typography.body, color: colors.text, fontWeight: '600' },
  painTextActive: { color: colors.danger },
  painHint: { ...typography.caption, color: colors.textMuted },
});
