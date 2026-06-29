import React, { useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { cmToIn, inToCm } from '../../lib/units';
import type { UnitSystem } from '../../lib/units';
import { spacing } from '../../theme';
import NumberField from './NumberField';

interface Props {
  valueCm: number | null; // canonical
  unit: UnitSystem;
  onChange: (cm: number | null) => void;
}

/** Height entry. Imperial = feet + inches; metric = cm. Always stores canonical cm. */
export default function HeightField({ valueCm, unit, onChange }: Props) {
  if (unit === 'metric') {
    return <MetricHeight valueCm={valueCm} onChange={onChange} />;
  }
  return <ImperialHeight valueCm={valueCm} onChange={onChange} />;
}

function MetricHeight({
  valueCm,
  onChange,
}: {
  valueCm: number | null;
  onChange: (cm: number | null) => void;
}) {
  const [text, setText] = useState<string>(valueCm == null ? '' : String(Math.round(valueCm)));
  const handle = (t: string) => {
    setText(t);
    const n = parseFloat(t);
    onChange(Number.isNaN(n) || n <= 0 ? null : n);
  };
  return <NumberField value={text} onChangeText={handle} suffix="cm" autoFocus />;
}

function ImperialHeight({
  valueCm,
  onChange,
}: {
  valueCm: number | null;
  onChange: (cm: number | null) => void;
}) {
  const totalIn = valueCm == null ? null : cmToIn(valueCm);
  const [ft, setFt] = useState<string>(totalIn == null ? '' : String(Math.floor(totalIn / 12)));
  const [inch, setInch] = useState<string>(totalIn == null ? '' : String(Math.round(totalIn % 12)));

  const commit = (ftStr: string, inStr: string) => {
    const f = parseInt(ftStr, 10);
    const i = parseInt(inStr, 10);
    const feet = Number.isNaN(f) ? 0 : f;
    const inches = Number.isNaN(i) ? 0 : i;
    const total = feet * 12 + inches;
    onChange(total > 0 ? inToCm(total) : null);
  };

  return (
    <View style={styles.row}>
      <View style={styles.cell}>
        <NumberField
          value={ft}
          onChangeText={(t) => {
            setFt(t);
            commit(t, inch);
          }}
          suffix="ft"
          autoFocus
        />
      </View>
      <View style={styles.cell}>
        <NumberField
          value={inch}
          onChangeText={(t) => {
            setInch(t);
            commit(ft, t);
          }}
          suffix="in"
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', gap: spacing.md },
  cell: { flex: 1 },
});
