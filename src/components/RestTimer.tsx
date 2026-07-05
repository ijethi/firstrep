import React, { useEffect, useRef, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import * as Haptics from 'expo-haptics';

import { colors, radius, spacing, typography } from '../theme';
import AppButton from './AppButton';
import { adjustSeconds, formatCountdown, initialRest } from '../lib/restTimer';

interface Props {
  seconds: number;
  onDone: () => void;
  onSkip: () => void;
  nextLabel?: string;
}

/**
 * Counts down the rest between sets. Add 15s / Restart / Skip, and a gentle
 * haptic when rest ends. Timer state is transient (never persisted), so a reload
 * never auto-advances on stale time (B-15/B-16 req 10).
 */
export default function RestTimer({ seconds, onDone, onSkip, nextLabel }: Props) {
  const start = initialRest(seconds);
  const [remaining, setRemaining] = useState(start);
  const doneRef = useRef(false);

  useEffect(() => {
    const id = setInterval(() => {
      setRemaining((r) => {
        if (r <= 1) {
          clearInterval(id);
          if (!doneRef.current) {
            doneRef.current = true;
            // Gentle end-of-rest cue; ignore if unsupported (e.g. web).
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
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

  const restart = () => {
    doneRef.current = false;
    setRemaining(start);
  };

  return (
    <View style={styles.card}>
      <Text style={styles.title}>Catch your breath</Text>
      <Text style={styles.timer}>{formatCountdown(remaining)}</Text>
      <Text style={styles.sub}>{nextLabel ? `Next: ${nextLabel}` : 'Rest, then keep going.'}</Text>

      <View style={styles.row}>
        <View style={styles.flex}>
          <AppButton label="Restart rest" variant="secondary" onPress={restart} />
        </View>
        <View style={styles.flex}>
          <AppButton
            label="+15 sec"
            variant="secondary"
            onPress={() => setRemaining((r) => adjustSeconds(r, 15))}
          />
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
  sub: { ...typography.body, color: colors.textMuted },
  row: { flexDirection: 'row', gap: spacing.md, alignSelf: 'stretch' },
  flex: { flex: 1 },
});
