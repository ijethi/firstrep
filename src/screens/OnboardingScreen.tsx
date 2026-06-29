import React, { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';

import { AppButton, ScreenContainer } from '../components';
import {
  ChoiceGroup,
  HeightField,
  MultiChoiceGroup,
  NumberField,
  WeightField,
} from '../components/onboarding';
import type { ChoiceOption } from '../components/onboarding';
import { colors, radius, spacing, typography } from '../theme';
import { RootStackParamList } from '../navigation/types';
import { useOnboardingStore } from '../state/onboardingStore';
import type { OnboardingAnswers } from '../state/onboardingStore';

type Nav = NativeStackNavigationProp<RootStackParamList, 'Onboarding'>;

type StepKey =
  | 'unit'
  | 'goal'
  | 'sex'
  | 'age'
  | 'height'
  | 'currentWeight'
  | 'goalWeight'
  | 'experience'
  | 'days'
  | 'duration'
  | 'injuries';

const STEPS: { key: StepKey; title: string; subtitle: string }[] = [
  { key: 'unit', title: 'How should we show weights?', subtitle: 'Planet Fitness machines use pounds — most beginners pick lb.' },
  { key: 'goal', title: "What's your main goal?", subtitle: 'We tailor everything around this.' },
  { key: 'sex', title: 'Which best describes you?', subtitle: 'This helps us set safe starting weights.' },
  { key: 'age', title: 'How old are you?', subtitle: 'Just to keep your plan age-appropriate.' },
  { key: 'height', title: 'How tall are you?', subtitle: 'No judgment — this helps track progress.' },
  { key: 'currentWeight', title: "What's your current weight?", subtitle: 'This is private and only you will see it.' },
  { key: 'goalWeight', title: "What's your goal weight?", subtitle: 'A target to aim for. You can change it anytime.' },
  { key: 'experience', title: 'How much gym experience do you have?', subtitle: 'Be honest — beginners are exactly who this app is for.' },
  { key: 'days', title: 'How many days a week can you train?', subtitle: 'Start small. Consistency beats intensity.' },
  { key: 'duration', title: 'How long do you want each workout?', subtitle: 'We can always adjust later.' },
  { key: 'injuries', title: 'Anything hurting right now?', subtitle: "We'll avoid it and pick safer moves." },
];

// Typed as number so ChoiceGroup's generic widens to match the store's `daysPerWeek: number`.
const DAYS_OPTIONS: ChoiceOption<number>[] = [
  { label: '2 days', value: 2, description: 'A gentle start' },
  { label: '3 days', value: 3, description: 'Recommended for beginners' },
  { label: '4 days', value: 4, description: 'Ready to commit' },
];

const INJURY_OPTIONS = [
  { label: 'None', value: 'none' },
  { label: 'Knee', value: 'knee' },
  { label: 'Shoulder', value: 'shoulder' },
  { label: 'Lower back', value: 'back' },
  { label: 'Wrist', value: 'wrist' },
  { label: 'Hip', value: 'hip' },
  { label: 'Ankle', value: 'ankle' },
  { label: 'Neck', value: 'neck' },
];

function isStepValid(key: StepKey, a: OnboardingAnswers): boolean {
  switch (key) {
    case 'unit':
      return a.unitPref === 'imperial' || a.unitPref === 'metric';
    case 'goal':
      return a.goal === 'weight_loss';
    case 'sex':
      return a.sex != null;
    case 'age':
      return a.age != null && a.age >= 13 && a.age <= 100;
    case 'height':
      return a.heightCm != null && a.heightCm > 0;
    case 'currentWeight':
      return a.currentWeightKg != null && a.currentWeightKg > 0;
    case 'goalWeight':
      return a.goalWeightKg != null && a.goalWeightKg > 0;
    case 'experience':
      return a.experience != null;
    case 'days':
      return a.daysPerWeek != null;
    case 'duration':
      return a.workoutLengthMin != null;
    case 'injuries':
      return a.injuries.length > 0; // 'none' selection counts
    default:
      return false;
  }
}

export default function OnboardingScreen() {
  const navigation = useNavigation<Nav>();
  const { answers, setAnswer, complete } = useOnboardingStore();
  const [index, setIndex] = useState(0);

  const step = STEPS[index];
  const valid = isStepValid(step.key, answers);
  const isLast = index === STEPS.length - 1;

  const onContinue = () => {
    if (!valid) return;
    if (isLast) {
      complete();
      navigation.replace('Main');
      return;
    }
    setIndex((i) => Math.min(i + 1, STEPS.length - 1));
  };

  const onBack = () => setIndex((i) => Math.max(i - 1, 0));

  return (
    <ScreenContainer scroll>
      {/* progress */}
      <View style={styles.progressRow}>
        <View style={styles.progressTrack}>
          <View style={[styles.progressFill, { width: `${((index + 1) / STEPS.length) * 100}%` }]} />
        </View>
        <Text style={styles.progressLabel}>
          Step {index + 1} of {STEPS.length}
        </Text>
      </View>

      <Text style={typography.h1}>{step.title}</Text>
      <Text style={[typography.body, styles.subtitle]}>{step.subtitle}</Text>

      <View style={styles.field}>{renderStep(step.key, answers, setAnswer)}</View>

      <View style={styles.actions}>
        {index > 0 ? (
          <View style={styles.backBtn}>
            <AppButton label="Back" variant="ghost" onPress={onBack} />
          </View>
        ) : null}
        <View style={styles.continueBtn}>
          <AppButton label={isLast ? 'Finish' : 'Continue'} onPress={onContinue} disabled={!valid} />
        </View>
      </View>
    </ScreenContainer>
  );
}

function renderStep(
  key: StepKey,
  a: OnboardingAnswers,
  set: <K extends keyof OnboardingAnswers>(k: K, v: OnboardingAnswers[K]) => void,
) {
  switch (key) {
    case 'unit':
      return (
        <ChoiceGroup
          value={a.unitPref}
          onSelect={(v) => set('unitPref', v)}
          options={[
            { label: 'Pounds (lb)', value: 'imperial', description: 'Recommended for Planet Fitness' },
            { label: 'Kilograms (kg)', value: 'metric' },
          ]}
        />
      );
    case 'goal':
      return (
        <ChoiceGroup
          value={a.goal}
          onSelect={(v) => set('goal', v)}
          options={[{ label: 'Lose weight', value: 'weight_loss', description: 'Burn fat and build a gym habit' }]}
        />
      );
    case 'sex':
      return (
        <ChoiceGroup
          value={a.sex}
          onSelect={(v) => set('sex', v)}
          options={[
            { label: 'Female', value: 'female' },
            { label: 'Male', value: 'male' },
            { label: 'Other', value: 'other' },
            { label: 'Prefer not to say', value: 'prefer_not' },
          ]}
        />
      );
    case 'age':
      return (
        <NumberField
          value={a.age == null ? '' : String(a.age)}
          onChangeText={(t) => {
            const n = parseInt(t, 10);
            set('age', Number.isNaN(n) ? null : n);
          }}
          suffix="years"
          placeholder="e.g. 32"
          autoFocus
        />
      );
    case 'height':
      return <HeightField valueCm={a.heightCm} unit={a.unitPref} onChange={(cm) => set('heightCm', cm)} />;
    case 'currentWeight':
      return (
        <WeightField
          valueKg={a.currentWeightKg}
          unit={a.unitPref}
          onChange={(kg) => set('currentWeightKg', kg)}
          placeholder="e.g. 180"
          autoFocus
        />
      );
    case 'goalWeight':
      return (
        <WeightField
          valueKg={a.goalWeightKg}
          unit={a.unitPref}
          onChange={(kg) => set('goalWeightKg', kg)}
          placeholder="e.g. 160"
          autoFocus
        />
      );
    case 'experience':
      return (
        <ChoiceGroup
          value={a.experience}
          onSelect={(v) => set('experience', v)}
          options={[
            { label: 'Total beginner', value: 'beginner', description: "I've never really used the machines" },
            { label: 'Some experience', value: 'some', description: "I've used a few machines before" },
          ]}
        />
      );
    case 'days':
      return (
        <ChoiceGroup value={a.daysPerWeek} onSelect={(v) => set('daysPerWeek', v)} options={DAYS_OPTIONS} />
      );
    case 'duration':
      return (
        <ChoiceGroup
          value={a.workoutLengthMin}
          onSelect={(v) => set('workoutLengthMin', v)}
          options={[
            { label: '20 minutes', value: 20, description: 'Quick and doable' },
            { label: '30 minutes', value: 30, description: 'A solid session' },
            { label: '45 minutes', value: 45, description: 'Full workout' },
          ]}
        />
      );
    case 'injuries':
      return (
        <MultiChoiceGroup
          options={INJURY_OPTIONS}
          noneValue="none"
          selected={a.injuries.length === 0 ? [] : a.injuries}
          onChange={(next) => set('injuries', next.includes('none') ? ['none'] : next)}
        />
      );
    default:
      return null;
  }
}

const styles = StyleSheet.create({
  progressRow: { gap: spacing.xs },
  progressTrack: {
    height: 8,
    borderRadius: radius.pill,
    backgroundColor: colors.bgAlt,
    overflow: 'hidden',
  },
  progressFill: { height: 8, borderRadius: radius.pill, backgroundColor: colors.primary },
  progressLabel: { ...typography.caption, color: colors.textMuted },
  subtitle: { color: colors.textMuted },
  field: { marginTop: spacing.sm },
  actions: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, marginTop: spacing.lg },
  backBtn: { flex: 1 },
  continueBtn: { flex: 2 },
});
