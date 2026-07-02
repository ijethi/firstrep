import React, { useState } from 'react';
import { Alert, StyleSheet, Text, View } from 'react-native';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';

import { AppButton, ScreenContainer } from '../components';
import CardioLogger from '../components/CardioLogger';
import ExerciseStepCard from '../components/ExerciseStepCard';
import RestTimer from '../components/RestTimer';
import SetLogger from '../components/SetLogger';
import { colors, radius, spacing, typography } from '../theme';
import { RootStackParamList } from '../navigation/types';
import { getPlanDay, usePlanStore } from '../state/planStore';
import { useWorkoutSessionStore } from '../state/workoutSessionStore';
import { useRecommendationStore } from '../state/recommendationStore';
import { useProgressStore } from '../state/progressStore';
import { usePlanProgressStore } from '../state/planProgressStore';
import { generateRecommendations } from '../lib/trainerEngine';
import { applyRecommendations } from '../lib/recommendationApplicator';
import { planDayId } from '../lib/planProgress';

type GuideRoute = RouteProp<RootStackParamList, 'WorkoutGuide'>;
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

export default function WorkoutGuideScreen() {
  const navigation = useNavigation<Nav>();
  const route = useRoute<GuideRoute>();
  const week = route.params?.week ?? 1;
  const dayNumber = route.params?.dayNumber ?? 1;

  const plan = usePlanStore((s) => s.plan);
  const planDay = getPlanDay(plan, week, dayNumber);
  const session = useWorkoutSessionStore((s) => s.session);
  const { logSet, skipExercise, logCardio, skipCardio, finish } = useWorkoutSessionStore();
  // Adaptive guidance is a VIEW over the base plan (B-08) — base plan untouched.
  const history = useProgressStore((s) => s.history);
  const priorRecs = useRecommendationStore((s) => s.recommendations);

  // step 0..strength.length-1 = exercises; strength.length = cardio (if any)
  const [step, setStep] = useState(0);
  const [resting, setResting] = useState(false);

  // Guard: no session/plan → don't crash, send the user back to Today.
  if (!session || !planDay) {
    return (
      <ScreenContainer scroll>
        <Text style={typography.h1}>Workout</Text>
        <Text style={[typography.body, styles.muted]}>
          No active workout. Head back to Today and tap Start Workout.
        </Text>
        <AppButton label="Back to Today" variant="ghost" onPress={() => navigation.navigate('Main')} />
      </ScreenContainer>
    );
  }

  const strengthCount = planDay.strength.length;
  const hasCardio = !!planDay.cardio;
  const totalSteps = strengthCount + (hasCardio ? 1 : 0);
  const onCardioStep = hasCardio && step === strengthCount;

  // Finish: stamp the session, run the (pure) trainer engine, save recs, go to summary.
  const finishAndSummarize = (status: 'completed' | 'abandoned') => {
    const now = new Date().toISOString();
    const priorCompletedCount = useRecommendationStore.getState().completedCount;
    finish(status, now);
    const finished = useWorkoutSessionStore.getState().session;
    const recs = generateRecommendations(finished, { nowISO: now, priorCompletedCount });
    useRecommendationStore.getState().setRecommendations(recs);
    if (finished) useProgressStore.getState().addSession(finished); // save to local history
    if (status === 'completed') {
      useRecommendationStore.getState().registerCompletion();
      // Advance the plan ONLY for completed (not abandoned) sessions.
      if (finished) {
        usePlanProgressStore
          .getState()
          .markDayCompleted(planDayId(finished.weekNumber, finished.dayNumber));
      }
    }
    navigation.replace('SessionSummary');
  };

  const endEarly = () => {
    Alert.alert('End workout?', 'Your logged sets will be saved.', [
      { text: 'Keep going', style: 'cancel' },
      { text: 'End workout', style: 'destructive', onPress: () => finishAndSummarize('abandoned') },
    ]);
  };

  const goToSummary = () => finishAndSummarize('completed');

  // ---- Cardio step ----
  if (onCardioStep && session.cardio && planDay.cardio) {
    return (
      <ScreenContainer scroll>
        <Text style={styles.stepCount}>Last step · Cardio</Text>
        <CardioLogger
          machineName={cardioName(planDay.cardio.machine)}
          plannedMinutes={planDay.cardio.minutes}
          onSave={(data) => {
            logCardio(data);
            goToSummary();
          }}
          onSkip={() => {
            skipCardio();
            goToSummary();
          }}
        />
        {step > 0 ? (
          <AppButton label="Back" variant="ghost" onPress={() => setStep((s) => s - 1)} />
        ) : null}
        <AppButton label="End workout" variant="ghost" onPress={endEarly} />
      </ScreenContainer>
    );
  }

  // ---- Strength step ----
  // Adaptive view: applies prior recommendations + last-used weights (base plan unchanged).
  const adaptiveDay = applyRecommendations(planDay, history, priorRecs);
  const planEx = adaptiveDay ? adaptiveDay.strength[step] : planDay.strength[step];
  const exLog = session.exercises[step];
  if (!planEx || !exLog) {
    // Out of range safety — jump to finishing.
    return (
      <ScreenContainer scroll>
        <Text style={typography.h1}>Nice work!</Text>
        <AppButton label="Finish" onPress={goToSummary} />
      </ScreenContainer>
    );
  }

  const setsDone = exLog.sets.length;
  const exerciseResolved = exLog.painReported || exLog.skipped || setsDone >= exLog.targetSets;
  const isLastStep = step === totalSteps - 1;

  const advance = () => {
    setResting(false);
    if (isLastStep) {
      goToSummary();
    } else {
      setStep((s) => s + 1);
    }
  };

  // Pre-fill weight: this session's last set, else the adaptive suggestion.
  const adaptiveWeight = adaptiveDay ? adaptiveDay.strength[step].adaptiveWeightLb : null;
  const lastWeight =
    setsDone > 0 && exLog.sets[setsDone - 1].weightLb != null
      ? String(exLog.sets[setsDone - 1].weightLb)
      : adaptiveWeight != null
        ? String(adaptiveWeight)
        : undefined;

  const adaptiveEx = adaptiveDay ? adaptiveDay.strength[step] : null;

  return (
    <ScreenContainer scroll>
      <ExerciseStepCard
        exercise={planEx}
        exerciseIndex={step}
        totalExercises={strengthCount}
        why={adaptiveEx?.whyExplanation}
        safety={adaptiveEx?.safetyWarning}
        onOpenGuide={() => navigation.navigate('ExerciseDetail', { slug: planEx.slug })}
      />

      {/* Pain warning takes priority */}
      {exLog.painReported ? (
        <View style={styles.painCard}>
          <Text style={styles.painTitle}>Let&apos;s pause this one</Text>
          <Text style={styles.painBody}>
            Stop this exercise for today. Your next plan can use a safer option.
          </Text>
        </View>
      ) : null}

      {/* Logging / resting / resolved */}
      {!exerciseResolved && !resting ? (
        <SetLogger
          setNumber={setsDone + 1}
          totalSets={exLog.targetSets}
          initialWeight={lastWeight}
          onSave={(set) => {
            logSet(step, set);
            const willBeDone = setsDone + 1 >= exLog.targetSets;
            if (!set.pain && !willBeDone) setResting(true);
          }}
        />
      ) : null}

      {!exerciseResolved && resting ? (
        <RestTimer
          seconds={exLog.restSeconds}
          nextLabel={`Set ${setsDone + 1} of ${exLog.targetSets}`}
          onDone={() => setResting(false)}
          onSkip={() => setResting(false)}
        />
      ) : null}

      {exerciseResolved ? (
        <AppButton label={isLastStep ? 'Finish workout' : 'Next exercise'} onPress={advance} />
      ) : (
        <AppButton
          label="Skip this exercise"
          variant="ghost"
          onPress={() => skipExercise(step)}
        />
      )}

      {step > 0 ? (
        <AppButton label="Back" variant="ghost" onPress={() => setStep((s) => s - 1)} />
      ) : null}
      <AppButton label="End workout" variant="ghost" onPress={endEarly} />
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  muted: { color: colors.textMuted },
  stepCount: { ...typography.caption, color: colors.primary, fontWeight: '700' },
  painCard: {
    backgroundColor: '#FCECE3',
    borderRadius: radius.lg,
    padding: spacing.lg,
    gap: spacing.xs,
  },
  painTitle: { ...typography.h3, color: colors.danger },
  painBody: { ...typography.body, color: colors.text },
});
