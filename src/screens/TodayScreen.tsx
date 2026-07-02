import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';

import { AppButton, ScreenContainer } from '../components';
import WeekPlanStrip from '../components/WeekPlanStrip';
import WeeklyCheckInCard from '../components/WeeklyCheckInCard';
import { colors, radius, spacing, typography } from '../theme';
import { RootStackParamList } from '../navigation/types';
import { useOnboardingStore } from '../state/onboardingStore';
import { usePlanStore } from '../state/planStore';
import { useWorkoutSessionStore } from '../state/workoutSessionStore';
import { useProgressStore } from '../state/progressStore';
import { useRecommendationStore } from '../state/recommendationStore';
import { usePlanProgressStore } from '../state/planProgressStore';
import { applyRecommendations } from '../lib/recommendationApplicator';
import { dayIdOf, getPlanProgress } from '../lib/planProgress';
import { generatePlan } from '../lib/planGenerator';
import { useWeeklyCheckInStore } from '../state/weeklyCheckInStore';
import { latestCheckIn } from '../lib/weeklyCheckIn';

type Nav = NativeStackNavigationProp<RootStackParamList>;

function cardioName(machine: string): string {
  switch (machine) {
    case 'treadmill':
      return 'Treadmill incline walk';
    case 'elliptical':
      return 'Elliptical';
    case 'stair_climber':
      return 'Stair climber';
    case 'bike':
      return 'Bike';
    default:
      return 'Cardio';
  }
}

export default function TodayScreen() {
  const navigation = useNavigation<Nav>();
  const completed = useOnboardingStore((s) => s.completed);
  const answers = useOnboardingStore((s) => s.answers);
  const plan = usePlanStore((s) => s.plan);
  const setPlan = usePlanStore((s) => s.setPlan);

  const history = useProgressStore((s) => s.history);
  const priorRecs = useRecommendationStore((s) => s.recommendations);
  const completedDayIds = usePlanProgressStore((s) => s.completedDayIds);
  const selectedDayId = usePlanProgressStore((s) => s.selectedDayId);
  const selectDay = usePlanProgressStore((s) => s.selectDay);
  const resetProgress = usePlanProgressStore((s) => s.reset);
  const checkIns = useWeeklyCheckInStore((s) => s.checkIns);

  const progress = getPlanProgress(plan, completedDayIds, selectedDayId);
  const day = progress.selectedDay;

  // Defensive: never crash if onboarding is incomplete or no plan exists yet.
  if (!completed || !plan || !day) {
    return (
      <ScreenContainer scroll>
        <Text style={typography.h1}>Today</Text>
        <Text style={[typography.body, styles.muted]}>
          Finish onboarding to see your Week 1 workout.
        </Text>
      </ScreenContainer>
    );
  }

  const adaptiveDay = applyRecommendations(day, history, priorRecs);
  const currentDayId = progress.currentDay ? dayIdOf(progress.currentDay) : null;

  const startNewPlan = () => {
    setPlan(generatePlan(answers));
    resetProgress();
  };

  return (
    <ScreenContainer scroll>
      <Text style={typography.h1}>Today</Text>

      {/* Plan-complete banner */}
      {progress.isPlanComplete ? (
        <View style={styles.doneCard}>
          <Text style={styles.doneTitle}>You completed your beginner plan! 🎉</Text>
          <Text style={styles.doneBody}>
            You can repeat Week {plan.weeks} or generate a fresh plan.
          </Text>
          <AppButton
            label={`Repeat Week ${plan.weeks}`}
            variant="secondary"
            onPress={() => selectDay(`w${plan.weeks}-d1`)}
          />
          <AppButton label="Generate a new plan" variant="ghost" onPress={startNewPlan} />
        </View>
      ) : null}

      {/* Week view */}
      <Text style={styles.weekLabel}>Week {day.weekNumber}</Text>
      <WeekPlanStrip
        weekDays={progress.weekDays}
        completedDayIds={completedDayIds}
        currentDayId={currentDayId}
        selectedDayId={selectedDayId}
        onSelect={selectDay}
      />

      {/* Preview note when looking at a non-recommended day */}
      {progress.isPreviewingNonCurrent && progress.currentDay ? (
        <Text style={[typography.caption, styles.previewNote]}>
          Previewing this day. Your recommended next workout is {progress.currentDay.name} (Week{' '}
          {progress.currentDay.weekNumber} · Day {progress.currentDay.dayNumber}).
        </Text>
      ) : null}

      {/* Selected day card */}
      <View style={styles.card}>
        <Text style={styles.cardLabel}>
          Week {day.weekNumber} · Day {day.dayNumber}
        </Text>
        <Text style={styles.cardTitle}>{day.name}</Text>
        <Text style={styles.cardMeta}>
          ~{day.estimatedMinutes} min · {day.strength.length}{' '}
          {day.strength.length === 1 ? 'machine' : 'machines'}
          {day.cardio ? ` · ${day.cardio.minutes} min cardio` : ''}
        </Text>

        {day.strength.map((ex, i) => {
          const adaptiveEx = adaptiveDay?.strength[i];
          const hint = adaptiveEx?.adapted
            ? adaptiveEx.safetyWarning ?? adaptiveEx.whyExplanation
            : null;
          return (
            <View key={ex.exerciseId} style={styles.exRow}>
              <View style={styles.exNameWrap}>
                <Text style={styles.exName}>{ex.name}</Text>
                {hint ? <Text style={styles.exHint}>{hint}</Text> : null}
              </View>
              <Text style={styles.exMeta}>
                {ex.sets} × {ex.repMin}–{ex.repMax}
              </Text>
            </View>
          );
        })}

        {day.cardio ? (
          <View style={styles.cardioRow}>
            <Text style={styles.cardioLabel}>🏃 Cardio</Text>
            <Text style={styles.cardioText}>
              {cardioName(day.cardio.machine)} · {day.cardio.minutes} min
            </Text>
          </View>
        ) : null}
      </View>

      <Text style={[typography.caption, styles.note]}>{day.beginnerNote}</Text>

      <AppButton
        label={progress.isPreviewingNonCurrent ? 'Start this workout' : 'Start Workout'}
        onPress={() => {
          useWorkoutSessionStore.getState().startSession(day, new Date().toISOString());
          navigation.navigate('WorkoutGuide', { week: day.weekNumber, dayNumber: day.dayNumber });
        }}
      />

      <WeeklyCheckInCard
        latest={latestCheckIn(checkIns)}
        onStart={() => navigation.navigate('WeeklyCheckIn')}
      />
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  muted: { color: colors.textMuted },
  weekLabel: { ...typography.caption, color: colors.primary, fontWeight: '700' },
  previewNote: { color: colors.textMuted },
  doneCard: {
    backgroundColor: '#E8F3F0',
    borderRadius: radius.lg,
    padding: spacing.lg,
    gap: spacing.sm,
  },
  doneTitle: { ...typography.h2, color: colors.primary },
  doneBody: { ...typography.body, color: colors.text },
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: spacing.lg,
    gap: spacing.sm,
  },
  cardLabel: { ...typography.caption, color: colors.textMuted, fontWeight: '700' },
  cardTitle: { ...typography.h2, color: colors.text },
  cardMeta: { ...typography.caption, color: colors.textMuted },
  exRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: colors.border,
    paddingTop: spacing.sm,
  },
  exNameWrap: { flex: 1, paddingRight: spacing.sm, gap: 2 },
  exName: { ...typography.body, color: colors.text },
  exHint: { ...typography.caption, color: colors.primary },
  exMeta: { ...typography.body, color: colors.primary, fontWeight: '700' },
  cardioRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    borderTopWidth: 1,
    borderTopColor: colors.border,
    paddingTop: spacing.sm,
  },
  cardioLabel: { ...typography.body, color: colors.text },
  cardioText: { ...typography.body, color: colors.textMuted },
  note: { color: colors.textMuted },
});
