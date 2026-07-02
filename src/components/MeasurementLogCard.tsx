import React, { useState } from 'react';
import { StyleSheet, Text, TextInput, View } from 'react-native';

import { NumberField } from './onboarding';
import AppButton from './AppButton';
import { colors, radius, spacing, typography } from '../theme';
import { cmToIn, formatLength, inToCm } from '../lib/units';
import type { UnitSystem } from '../lib/units';
import type { MeasurementProgress } from '../lib/progressStats';
import type { BodyMeasurementEntry } from '../types/database';

interface Props {
  stats: MeasurementProgress;
  unit: UnitSystem;
  onAdd: (entry: BodyMeasurementEntry) => void;
}

/** Log waist/chest/hips (canonical cm) + show latest and change-since-first. */
export default function MeasurementLogCard({ stats, unit, onAdd }: Props) {
  const [waist, setWaist] = useState('');
  const [chest, setChest] = useState('');
  const [hip, setHip] = useState('');
  const [note, setNote] = useState('');

  const suffix = unit === 'imperial' ? 'in' : 'cm';
  // input is in the display unit; store canonical cm
  const toCm = (t: string): number | null => {
    const n = parseFloat(t);
    if (Number.isNaN(n) || n <= 0) return null;
    return unit === 'imperial' ? inToCm(n) : n;
  };

  const anyValue = [waist, chest, hip].some((t) => toCm(t) != null);

  const save = () => {
    if (!anyValue) return;
    onAdd({
      waistCm: toCm(waist),
      chestCm: toCm(chest),
      hipCm: toCm(hip),
      note: note.trim().length > 0 ? note.trim() : null,
      loggedOnISO: new Date().toISOString(),
      source: 'manual',
    });
    setWaist('');
    setChest('');
    setHip('');
    setNote('');
  };

  const latest = stats.latest;
  const showVal = (cm: number | null | undefined) =>
    cm == null ? '—' : formatLength(cm, unit);
  const showChange = (changeCm: number | null) => {
    if (changeCm == null) return null;
    const disp = unit === 'imperial' ? Math.abs(cmToIn(changeCm)) : Math.abs(changeCm);
    const arrow = changeCm <= 0 ? '▼' : '▲';
    return `${arrow} ${disp.toFixed(1)} ${suffix}`;
  };

  return (
    <View style={styles.card}>
      <Text style={styles.title}>📏 Body measurements</Text>

      {stats.count === 0 ? (
        <Text style={styles.empty}>Add measurements when you&apos;re ready. No pressure.</Text>
      ) : (
        <View style={styles.latestRow}>
          <Metric label="Waist" value={showVal(latest?.waistCm)} change={showChange(stats.waistChangeCm)} />
          <Metric label="Chest" value={showVal(latest?.chestCm)} change={showChange(stats.chestChangeCm)} />
          <Metric label="Hips" value={showVal(latest?.hipCm)} change={showChange(stats.hipChangeCm)} />
        </View>
      )}

      <Text style={styles.fieldLabel}>Waist</Text>
      <NumberField value={waist} onChangeText={setWaist} suffix={suffix} placeholder="optional" />
      <Text style={styles.fieldLabel}>Chest</Text>
      <NumberField value={chest} onChangeText={setChest} suffix={suffix} placeholder="optional" />
      <Text style={styles.fieldLabel}>Hips</Text>
      <NumberField value={hip} onChangeText={setHip} suffix={suffix} placeholder="optional" />
      <TextInput
        style={styles.note}
        value={note}
        onChangeText={setNote}
        placeholder="Note (optional)"
        placeholderTextColor={colors.textMuted}
        maxLength={100}
      />

      <AppButton label="Save measurements" onPress={save} disabled={!anyValue} />
    </View>
  );
}

function Metric({ label, value, change }: { label: string; value: string; change: string | null }) {
  return (
    <View style={styles.metric}>
      <Text style={styles.metricLabel}>{label}</Text>
      <Text style={styles.metricValue}>{value}</Text>
      {change ? <Text style={styles.metricChange}>{change}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  card: { backgroundColor: colors.surface, borderRadius: radius.lg, padding: spacing.lg, gap: spacing.xs },
  title: { ...typography.h3, color: colors.text },
  empty: { ...typography.body, color: colors.textMuted },
  latestRow: { flexDirection: 'row', gap: spacing.sm, marginVertical: spacing.xs },
  metric: { flex: 1, gap: 2 },
  metricLabel: { ...typography.caption, color: colors.textMuted },
  metricValue: { ...typography.h3, color: colors.text },
  metricChange: { ...typography.caption, color: colors.success },
  fieldLabel: { ...typography.caption, color: colors.textMuted, marginTop: spacing.xs },
  note: {
    minHeight: 48,
    borderWidth: 2,
    borderColor: colors.border,
    borderRadius: radius.lg,
    backgroundColor: colors.surface,
    paddingHorizontal: spacing.lg,
    marginTop: spacing.xs,
    ...typography.body,
    color: colors.text,
  },
});
