import React, { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { colors, radius, spacing, typography } from '../theme';
import { NumberField } from './onboarding';
import AppButton from './AppButton';
import { formatWeight, lbToKg } from '../lib/units';
import type { UnitSystem } from '../lib/units';
import type { WeightProgress } from '../lib/progressStats';

interface Props {
  stats: WeightProgress;
  unit: UnitSystem;
  onAdd: (weightKg: number) => void;
}

/** Log body weight (canonical kg) + show latest and change-since-first. */
export default function WeightLogCard({ stats, unit, onAdd }: Props) {
  const [text, setText] = useState('');

  const save = () => {
    const n = parseFloat(text);
    if (Number.isNaN(n) || n <= 0) return;
    onAdd(unit === 'imperial' ? lbToKg(n) : n);
    setText('');
  };

  const change = stats.changeKg;
  const changeLabel =
    change == null || stats.count < 2
      ? null
      : `${change <= 0 ? '▼' : '▲'} ${formatWeight(Math.abs(change), unit)} since you started`;

  return (
    <View style={styles.card}>
      <Text style={styles.title}>⚖️ Body weight</Text>

      {stats.count === 0 ? (
        <Text style={styles.empty}>Log your weight when you&apos;re ready. No pressure.</Text>
      ) : (
        <>
          <Text style={styles.latest}>
            {stats.latestKg != null ? formatWeight(stats.latestKg, unit) : '—'}
          </Text>
          {changeLabel ? (
            <Text style={[styles.change, { color: change != null && change <= 0 ? colors.success : colors.text }]}>
              {changeLabel}
            </Text>
          ) : null}
        </>
      )}

      <Text style={styles.fieldLabel}>Add today&apos;s weight</Text>
      <NumberField
        value={text}
        onChangeText={setText}
        suffix={unit === 'imperial' ? 'lb' : 'kg'}
        placeholder={unit === 'imperial' ? 'e.g. 180' : 'e.g. 82'}
      />
      <AppButton label="Save weight" onPress={save} disabled={text.trim().length === 0} />
    </View>
  );
}

const styles = StyleSheet.create({
  card: { backgroundColor: colors.surface, borderRadius: radius.lg, padding: spacing.lg, gap: spacing.xs },
  title: { ...typography.h3, color: colors.text },
  empty: { ...typography.body, color: colors.textMuted },
  latest: { ...typography.h1, color: colors.primary },
  change: { ...typography.body },
  fieldLabel: { ...typography.caption, color: colors.textMuted, marginTop: spacing.sm },
});
