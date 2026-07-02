import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';

import { ProgressCard, ScreenContainer } from '../components';
import CardioProgressCard from '../components/CardioProgressCard';
import StrengthProgressCard from '../components/StrengthProgressCard';
import TrainerRecommendationCard from '../components/TrainerRecommendationCard';
import WeightLogCard from '../components/WeightLogCard';
import WeeklyCheckInCard from '../components/WeeklyCheckInCard';
import { colors, spacing, typography } from '../theme';
import {
  cardioProgress,
  strengthProgress,
  summarize,
  weeklyMessage,
  weightProgress,
} from '../lib/progressStats';
import { useProgressStore } from '../state/progressStore';
import { useRecommendationStore } from '../state/recommendationStore';
import { useOnboardingStore } from '../state/onboardingStore';
import { useWeeklyCheckInStore } from '../state/weeklyCheckInStore';
import { latestCheckIn } from '../lib/weeklyCheckIn';
import { RootStackParamList } from '../navigation/types';

type Nav = NativeStackNavigationProp<RootStackParamList>;

export default function ProgressScreen() {
  const navigation = useNavigation<Nav>();
  const history = useProgressStore((s) => s.history);
  const bodyWeights = useProgressStore((s) => s.bodyWeights);
  const addBodyWeight = useProgressStore((s) => s.addBodyWeight);
  const recommendations = useRecommendationStore((s) => s.recommendations);
  const unit = useOnboardingStore((s) => s.answers.unitPref);
  const checkIns = useWeeklyCheckInStore((s) => s.checkIns);

  const summary = summarize(history);
  const weight = weightProgress(bodyWeights);
  const noWorkouts = summary.totalWorkouts === 0;

  return (
    <ScreenContainer scroll>
      <Text style={typography.h1}>Progress</Text>
      <Text style={[typography.body, styles.message]}>{weeklyMessage(summary.totalWorkouts)}</Text>

      <WeeklyCheckInCard
        latest={latestCheckIn(checkIns)}
        onStart={() => navigation.navigate('WeeklyCheckIn')}
      />

      {noWorkouts ? (
        <View style={styles.emptyCard}>
          <Text style={styles.emptyText}>Finish your first workout to see progress here.</Text>
        </View>
      ) : (
        <>
          <View style={styles.grid}>
            <View style={styles.col}>
              <ProgressCard title="Workouts" value={String(summary.totalWorkouts)} emoji="✅" />
            </View>
            <View style={styles.col}>
              <ProgressCard title="Day streak" value={String(summary.currentStreak)} emoji="🔥" />
            </View>
          </View>
          <View style={styles.grid}>
            <View style={styles.col}>
              <ProgressCard title="Sets logged" value={String(summary.totalSets)} emoji="🏋️" />
            </View>
            <View style={styles.col}>
              <ProgressCard title="Cardio min" value={String(summary.totalCardioMinutes)} emoji="🏃" />
            </View>
          </View>
          <ProgressCard
            title="Exercises completed"
            value={String(summary.exercisesCompleted)}
            emoji="🎯"
          />

          {recommendations.length > 0 ? (
            <View style={styles.section}>
              <Text style={typography.h2}>Recent tips</Text>
              {recommendations.slice(0, 3).map((rec, i) => (
                <TrainerRecommendationCard key={`${rec.ruleId}-${rec.exerciseId ?? 'x'}-${i}`} rec={rec} />
              ))}
            </View>
          ) : null}

          <StrengthProgressCard items={strengthProgress(history)} />
          <CardioProgressCard stats={cardioProgress(history)} />
        </>
      )}

      <WeightLogCard
        stats={weight}
        unit={unit}
        onAdd={(kg) => addBodyWeight(kg, new Date().toISOString())}
      />
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  message: { color: colors.textMuted },
  emptyCard: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    padding: spacing.lg,
  },
  emptyText: { ...typography.body, color: colors.textMuted },
  grid: { flexDirection: 'row', gap: spacing.md },
  col: { flex: 1 },
  section: { gap: spacing.sm },
});
