import React from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { colors, radius, spacing, typography } from '../theme';
import { dayIdOf } from '../lib/planProgress';
import type { PlanDay } from '../types/database';

interface Props {
  weekDays: PlanDay[];
  completedDayIds: string[];
  currentDayId: string | null; // the recommended next day
  selectedDayId: string | null; // the day being previewed
  onSelect: (dayId: string) => void;
}

/** Horizontal strip of the week's days: ✓ completed, highlighted current, tap to preview. */
export default function WeekPlanStrip({
  weekDays,
  completedDayIds,
  currentDayId,
  selectedDayId,
  onSelect,
}: Props) {
  const done = new Set(completedDayIds);

  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.row}
    >
      {weekDays.map((day) => {
        const id = dayIdOf(day);
        const isCompleted = done.has(id);
        const isCurrent = id === currentDayId;
        const isSelected = id === selectedDayId || (selectedDayId == null && isCurrent);

        return (
          <Pressable
            key={id}
            accessibilityRole="button"
            accessibilityState={{ selected: isSelected }}
            onPress={() => onSelect(id)}
            style={({ pressed }) => [
              styles.chip,
              isCurrent && styles.chipCurrent,
              isSelected && styles.chipSelected,
              pressed && styles.pressed,
            ]}
          >
            <Text style={styles.dayLabel}>Day {day.dayNumber}</Text>
            <Text style={styles.dayName} numberOfLines={1}>
              {day.name}
            </Text>
            <Text style={styles.status}>
              {isCompleted ? '✓ Done' : isCurrent ? '▶ Next' : '•'}
            </Text>
          </Pressable>
        );
      })}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  row: { gap: spacing.sm, paddingVertical: spacing.xs },
  chip: {
    width: 124,
    borderRadius: radius.lg,
    borderWidth: 2,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    padding: spacing.md,
    gap: 2,
  },
  chipCurrent: { borderColor: colors.primary },
  chipSelected: { backgroundColor: '#E8F3F0', borderColor: colors.primary },
  pressed: { opacity: 0.85 },
  dayLabel: { ...typography.caption, color: colors.textMuted, fontWeight: '700' },
  dayName: { ...typography.body, color: colors.text },
  status: { ...typography.caption, color: colors.primary, fontWeight: '700' },
});
