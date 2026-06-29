import React, { useEffect, useRef, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { colors, radius, spacing, typography } from '../theme';
import AppButton from './AppButton';

interface Props {
  seconds: number;
  onDone: () => void;
  onSkip: () => void;
  nextLabel?: string;
}

/** Counts down the rest between sets. ±15s, skip, and auto-advances at zero. */
export default function RestTimer({ seconds, onDone, onSkip, nextLabel }: Props) {
  const [remaining, setRemaining] = useState(seconds > 0 ? seconds : 30);
  const doneRef = useRef(false);

  useEffect(() => {
    const id = setInterval(() => {
      setRemaining((r) => {
        if (r <= 1) {
          clearInterval(id);
          if (!doneRef.current) {
            doneRef.current = true;
            onDone();
          }
          return 0;
        }
        return r - 1;
      });
    }, 1000);
    return () => clearInterval(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const mm = Math.floor(remaining / 60);
  const ss = remaining % 60;
  const display = `${mm}:${ss.toString().padStart(2, '0')}`;

  return (
    <View style={styles.card}>
      <Text style={styles.title}>Rest up</Text>
      <Text style={styles.timer}>{display}</Text>
      {nextLabel ? <Text style={styles.next}>Next: {nextLabel}</Text> : null}

      <View style={styles.row}>
        <View style={styles.flex}>
          <AppButton
            label="-15s"
            variant="secondary"
            onPress={() => setRemaining((r) => Math.max(0, r - 15))}
          />
        </View>
        <View style={styles.flex}>
          <AppButton label="+15s" variant="secondary" onPress={() => setRemaining((r) => r + 15)} />
        </View>
      </View>

      <AppButton label="Skip rest" variant="ghost" onPress={onSkip} />
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: spacing.lg,
    gap: spacing.sm,
    alignItems: 'center',
  },
  title: { ...typography.h3, color: colors.textMuted },
  timer: { fontSize: 56, fontWeight: '800', color: colors.primary, lineHeight: 64 },
  next: { ...typography.body, color: colors.textMuted },
  row: { flexDirection: 'row', gap: spacing.md, alignSelf: 'stretch' },
  flex: { flex: 1 },
});
