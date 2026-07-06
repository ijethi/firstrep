import React, { useState } from 'react';
import { Alert, StyleSheet, Text } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';

import { AppButton, ScreenContainer } from '../components';
import SettingsSection, { SettingRow } from '../components/SettingsSection';
import UnitToggle from '../components/UnitToggle';
import AuthStatusCard from '../components/AuthStatusCard';
import ProfileSyncCard from '../components/ProfileSyncCard';
import PlanSyncCard from '../components/PlanSyncCard';
import PlanProgressSyncCard from '../components/PlanProgressSyncCard';
import WorkoutSyncCard from '../components/WorkoutSyncCard';
import CardioSyncCard from '../components/CardioSyncCard';
import BodyWeightSyncCard from '../components/BodyWeightSyncCard';
import BodyMeasurementSyncCard from '../components/BodyMeasurementSyncCard';
import { ChoiceGroup, MultiChoiceGroup } from '../components/onboarding';
import type { ChoiceOption } from '../components/onboarding';
import { colors, spacing, typography } from '../theme';
import { formatLength, formatWeight } from '../lib/units';
import { RootStackParamList } from '../navigation/types';
import { useOnboardingStore } from '../state/onboardingStore';
import type { WorkoutLength } from '../state/onboardingStore';
import { usePlanStore } from '../state/planStore';
import { usePlanProgressStore } from '../state/planProgressStore';
import { generatePlan } from '../lib/planGenerator';
import { decidePlanUpdate } from '../lib/settingsProfile';
import { resetLocalAppData } from '../lib/resetAppData';
import { DISCLAIMER_TEXT, SAFETY_TIPS } from '../lib/safety';

type Nav = NativeStackNavigationProp<RootStackParamList>;

const DAYS_OPTIONS: ChoiceOption<number>[] = [
  { label: '2 days', value: 2 },
  { label: '3 days', value: 3 },
  { label: '4 days', value: 4 },
];
const DURATION_OPTIONS: ChoiceOption<WorkoutLength>[] = [
  { label: '20 min', value: 20 },
  { label: '30 min', value: 30 },
  { label: '45 min', value: 45 },
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

const GOAL_LABEL: Record<string, string> = { weight_loss: 'Lose weight' };

export default function SettingsScreen() {
  const navigation = useNavigation<Nav>();
  const answers = useOnboardingStore((s) => s.answers);
  const setAnswer = useOnboardingStore((s) => s.setAnswer);

  // Editable workout-preference state (units apply immediately; these need confirm).
  const [days, setDays] = useState<number | null>(answers.daysPerWeek);
  const [duration, setDuration] = useState<WorkoutLength | null>(answers.workoutLengthMin);
  const [injuries, setInjuries] = useState<string[]>(answers.injuries);

  const normalizedInjuries = injuries.filter((v) => v !== 'none');
  const prevPrefs = {
    daysPerWeek: answers.daysPerWeek,
    workoutLengthMin: answers.workoutLengthMin,
    injuries: answers.injuries,
  };
  const nextPrefs = { daysPerWeek: days, workoutLengthMin: duration, injuries: normalizedInjuries };
  const decision = decidePlanUpdate(prevPrefs, nextPrefs);

  const dv = (v: string | number | null | undefined) => (v == null || v === '' ? '—' : String(v));
  const injuryDisplay =
    answers.injuries.length === 0 ? 'None' : answers.injuries.join(', ');

  const applyChanges = () => {
    setAnswer('daysPerWeek', days);
    setAnswer('workoutLengthMin', duration);
    setAnswer('injuries', normalizedInjuries);
    const updated = useOnboardingStore.getState().answers;
    usePlanStore.getState().setPlan(generatePlan(updated));
    if (decision.resetProgress) usePlanProgressStore.getState().reset();
  };

  const onSavePrefs = () => {
    if (!decision.regenerate) return;
    Alert.alert(
      'Update your plan?',
      'This can update your future workout plan. Your completed history will stay safe.',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Update plan', onPress: applyChanges },
      ],
    );
  };

  const onReset = () => {
    Alert.alert(
      'Reset local data?',
      'This clears your onboarding, plan, progress, and logs on this device. This cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Reset',
          style: 'destructive',
          onPress: async () => {
            await resetLocalAppData();
            // Disclaimer was cleared too — send them back through the safety intro.
            navigation.reset({ index: 0, routes: [{ name: 'SafetyIntro' }] });
          },
        },
      ],
    );
  };

  return (
    <ScreenContainer scroll>
      <Text style={typography.h1}>Profile & Settings</Text>

      <SettingsSection title="Profile">
        <SettingRow label="Main goal" value={answers.goal ? GOAL_LABEL[answers.goal] : '—'} />
        <SettingRow label="Sex" value={dv(answers.sex)} />
        <SettingRow label="Age" value={dv(answers.age)} />
        <SettingRow
          label="Height"
          value={answers.heightCm != null ? formatLength(answers.heightCm, answers.unitPref) : '—'}
        />
        <SettingRow
          label="Current weight"
          value={
            answers.currentWeightKg != null ? formatWeight(answers.currentWeightKg, answers.unitPref) : '—'
          }
        />
        <SettingRow
          label="Goal weight"
          value={answers.goalWeightKg != null ? formatWeight(answers.goalWeightKg, answers.unitPref) : '—'}
        />
        <SettingRow label="Experience" value={answers.experience === 'some' ? 'Some' : 'Beginner'} />
      </SettingsSection>

      <SettingsSection title="Units">
        <Text style={styles.help}>
          Display only. Your data is stored consistently — switching won&apos;t change your numbers.
        </Text>
        <UnitToggle value={answers.unitPref} onChange={(u) => setAnswer('unitPref', u)} />
      </SettingsSection>

      <SettingsSection title="Workout preferences">
        <Text style={styles.help}>Days per week</Text>
        <ChoiceGroup value={days} onSelect={setDays} options={DAYS_OPTIONS} />

        <Text style={styles.help}>Workout length</Text>
        <ChoiceGroup value={duration} onSelect={setDuration} options={DURATION_OPTIONS} />
      </SettingsSection>

      <SettingsSection title="Injuries & safety">
        <Text style={styles.help}>
          Anything hurting? We&apos;ll avoid it and pick safer moves in your next plan.
        </Text>
        <MultiChoiceGroup
          options={INJURY_OPTIONS}
          noneValue="none"
          selected={injuries}
          onChange={(next) => setInjuries(next.includes('none') ? [] : next)}
        />
        <SettingRow label="Currently avoiding" value={injuryDisplay} />
      </SettingsSection>

      {decision.regenerate ? (
        <AppButton label="Save workout changes" onPress={onSavePrefs} />
      ) : null}

      <AuthStatusCard onSignIn={() => navigation.navigate('SignIn')} />
      <ProfileSyncCard />
      <PlanSyncCard />
      <PlanProgressSyncCard />
      <WorkoutSyncCard />
      <CardioSyncCard />
      <BodyWeightSyncCard />
      <BodyMeasurementSyncCard />

      <SettingsSection title="Safety tips">
        {SAFETY_TIPS.map((tip, i) => (
          <Text key={i} style={styles.tip}>
            • {tip}
          </Text>
        ))}
        <Text style={styles.disclaimer}>{DISCLAIMER_TEXT}</Text>
      </SettingsSection>

      <SettingsSection title="Local data">
        <Text style={styles.help}>
          Everything stays on this device. Resetting clears your plan and logs.
        </Text>
        <AppButton label="Reset local data" variant="secondary" onPress={onReset} />
      </SettingsSection>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  help: { ...typography.caption, color: colors.textMuted },
  tip: { ...typography.body, color: colors.text },
  disclaimer: { ...typography.caption, color: colors.textMuted, marginTop: spacing.xs },
});
