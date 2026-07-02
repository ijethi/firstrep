import React, { useState } from 'react';
import { StyleSheet, Text, TextInput, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';

import { AppButton, ScreenContainer } from '../components';
import { ChoiceGroup, MultiChoiceGroup } from '../components/onboarding';
import type { ChoiceOption } from '../components/onboarding';
import { colors, radius, spacing, typography } from '../theme';
import { RootStackParamList } from '../navigation/types';
import { usePlanStore } from '../state/planStore';
import { usePlanProgressStore } from '../state/planProgressStore';
import { useWeeklyCheckInStore } from '../state/weeklyCheckInStore';
import { getPlanProgress } from '../lib/planProgress';
import type {
  CheckInBarrier,
  CheckInConfidence,
  CheckInEnergy,
  CheckInSoreness,
} from '../types/database';

type Nav = NativeStackNavigationProp<RootStackParamList>;

const WORKOUT_OPTIONS: ChoiceOption<number>[] = [
  { label: '0', value: 0 },
  { label: '1', value: 1 },
  { label: '2', value: 2 },
  { label: '3', value: 3 },
  { label: '4+', value: 4 },
];

const BARRIER_OPTIONS = [
  { label: 'Nothing', value: 'none' },
  { label: 'Time', value: 'time' },
  { label: 'Soreness', value: 'soreness' },
  { label: 'Motivation', value: 'motivation' },
  { label: 'Gym anxiety', value: 'gym_anxiety' },
  { label: 'Schedule', value: 'schedule' },
  { label: 'Other', value: 'other' },
];

export default function WeeklyCheckInScreen() {
  const navigation = useNavigation<Nav>();
  const plan = usePlanStore((s) => s.plan);
  const completedDayIds = usePlanProgressStore((s) => s.completedDayIds);
  const addCheckIn = useWeeklyCheckInStore((s) => s.addCheckIn);

  const weekNumber = getPlanProgress(plan, completedDayIds, null).currentWeek;

  const [workouts, setWorkouts] = useState<number | null>(null);
  const [energy, setEnergy] = useState<CheckInEnergy | null>(null);
  const [soreness, setSoreness] = useState<CheckInSoreness | null>(null);
  const [confidence, setConfidence] = useState<CheckInConfidence | null>(null);
  const [barriers, setBarriers] = useState<string[]>([]);
  const [smallGoal, setSmallGoal] = useState('');

  const valid =
    workouts != null && energy != null && soreness != null && confidence != null && barriers.length > 0;

  const submit = () => {
    if (!valid) return;
    addCheckIn({
      weekNumber,
      workoutsCompleted: workouts,
      energy,
      soreness,
      confidence,
      barriers: barriers as CheckInBarrier[],
      smallGoal: smallGoal.trim(),
      createdAtISO: new Date().toISOString(),
    });
    navigation.goBack();
  };

  return (
    <ScreenContainer scroll>
      <Text style={typography.h1}>Weekly check-in</Text>
      <Text style={[typography.body, styles.muted]}>
        How did this week feel? No right answers — this just helps us coach you.
      </Text>

      <Text style={styles.q}>How many workouts did you complete this week?</Text>
      <ChoiceGroup value={workouts} onSelect={setWorkouts} options={WORKOUT_OPTIONS} />

      <Text style={styles.q}>How was your energy?</Text>
      <ChoiceGroup
        value={energy}
        onSelect={setEnergy}
        options={[
          { label: 'Low', value: 'low' },
          { label: 'Okay', value: 'okay' },
          { label: 'Good', value: 'good' },
        ]}
      />

      <Text style={styles.q}>How sore did you feel?</Text>
      <ChoiceGroup
        value={soreness}
        onSelect={setSoreness}
        options={[
          { label: 'None', value: 'none' },
          { label: 'Mild', value: 'mild' },
          { label: 'Moderate', value: 'moderate' },
          { label: 'High', value: 'high' },
        ]}
      />

      <Text style={styles.q}>How confident do you feel using the machines?</Text>
      <ChoiceGroup
        value={confidence}
        onSelect={setConfidence}
        options={[
          { label: 'Low', value: 'low' },
          { label: 'Medium', value: 'medium' },
          { label: 'High', value: 'high' },
        ]}
      />

      <Text style={styles.q}>Did anything stop you from working out?</Text>
      <MultiChoiceGroup
        options={BARRIER_OPTIONS}
        noneValue="none"
        selected={barriers}
        onChange={(next) => setBarriers(next.includes('none') ? ['none'] : next)}
      />

      <Text style={styles.q}>One small goal for next week?</Text>
      <TextInput
        style={styles.input}
        value={smallGoal}
        onChangeText={setSmallGoal}
        placeholder="e.g. Show up twice"
        placeholderTextColor={colors.textMuted}
        maxLength={120}
      />

      <AppButton label="Save check-in" onPress={submit} disabled={!valid} />
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  muted: { color: colors.textMuted },
  q: { ...typography.h3, color: colors.text, marginTop: spacing.sm },
  input: {
    minHeight: 52,
    borderWidth: 2,
    borderColor: colors.border,
    borderRadius: radius.lg,
    backgroundColor: colors.surface,
    paddingHorizontal: spacing.lg,
    ...typography.body,
    color: colors.text,
  },
});
