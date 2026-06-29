import React from 'react';
import { Image, Pressable, StyleSheet, Text, View } from 'react-native';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';

import { AppButton, ScreenContainer } from '../components';
import { colors, radius, spacing, typography } from '../theme';
import { RootStackParamList } from '../navigation/types';
import { EXERCISE_BY_SLUG } from '../data/exerciseCatalog';
import { getExerciseImage } from '../images/exerciseImages';
import { alternativeFor, CATEGORY_LABEL, categoryOf } from '../lib/exerciseLibrary';

type DetailRoute = RouteProp<RootStackParamList, 'ExerciseDetail'>;
type Nav = NativeStackNavigationProp<RootStackParamList>;

const SAFETY = 'Stop if you feel sharp pain.';

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>{title}</Text>
      {children}
    </View>
  );
}

export default function ExerciseDetailScreen() {
  const navigation = useNavigation<Nav>();
  const route = useRoute<DetailRoute>();
  const exercise = EXERCISE_BY_SLUG[route.params?.slug ?? ''];

  if (!exercise) {
    return (
      <ScreenContainer scroll>
        <Text style={typography.h1}>Not found</Text>
        <Text style={[typography.body, styles.muted]}>We couldn&apos;t find that machine.</Text>
        <AppButton label="Back" variant="ghost" onPress={() => navigation.goBack()} />
      </ScreenContainer>
    );
  }

  const image = getExerciseImage(exercise.slug);
  const alt = alternativeFor(exercise);
  const guidance =
    exercise.defaultWeightLb != null
      ? `Start light — about ${exercise.defaultWeightLb} lb. If 15 reps feel easy, add 5 lb next time.`
      : 'Start at an easy pace and build up your minutes over time.';

  return (
    <ScreenContainer scroll>
      <View style={styles.imageBox}>
        {image ? (
          <Image source={image} style={styles.img} resizeMode="cover" />
        ) : (
          <>
            <Text style={styles.imageEmoji}>🏋️</Text>
            <Text style={styles.imageHint}>Image coming soon</Text>
          </>
        )}
      </View>

      <Text style={typography.h1}>{exercise.name}</Text>
      <Text style={styles.category}>{CATEGORY_LABEL[categoryOf(exercise)]}</Text>
      <Text style={[typography.body, styles.muted]}>{exercise.worksPlain}.</Text>

      <Section title="Muscles you'll train">
        <Text style={styles.text}>{exercise.primaryMuscles.join(' · ')}</Text>
      </Section>

      <Section title="How to set it up">
        {exercise.setupSteps.map((step, i) => (
          <Text key={i} style={styles.text}>
            {i + 1}. {step}
          </Text>
        ))}
      </Section>

      <Section title="Good form">
        {exercise.formTips.map((tip, i) => (
          <Text key={i} style={styles.text}>
            • {tip}
          </Text>
        ))}
      </Section>

      <Section title="Beginner mistakes to avoid">
        {exercise.commonMistakes.map((m, i) => (
          <Text key={i} style={styles.text}>
            • {m}
          </Text>
        ))}
      </Section>

      <Section title="Suggested starting point">
        <Text style={styles.text}>{guidance}</Text>
      </Section>

      <View style={styles.safetyBox}>
        <Text style={styles.safetyText}>⚠️ {exercise.safetyNote}</Text>
        <Text style={styles.safetyText}>⚠️ {SAFETY}</Text>
      </View>

      {alt ? (
        <Section title="Feels uncomfortable? Try this instead">
          <Pressable
            accessibilityRole="button"
            onPress={() => navigation.push('ExerciseDetail', { slug: alt.slug })}
            style={({ pressed }) => [styles.altCard, pressed && styles.pressed]}
          >
            <Text style={styles.altName}>{alt.name}</Text>
            <Text style={styles.altWorks}>{alt.worksPlain}</Text>
          </Pressable>
        </Section>
      ) : null}

      <AppButton label="Back to Library" variant="ghost" onPress={() => navigation.goBack()} />
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  muted: { color: colors.textMuted },
  imageBox: {
    height: 180,
    borderRadius: radius.lg,
    backgroundColor: colors.bgAlt,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  img: { width: '100%', height: '100%' },
  imageEmoji: { fontSize: 48 },
  imageHint: { ...typography.caption, color: colors.textMuted },
  category: { ...typography.caption, color: colors.primary, fontWeight: '700' },
  section: { gap: spacing.xs, marginTop: spacing.sm },
  sectionTitle: { ...typography.h3, color: colors.text },
  text: { ...typography.body, color: colors.text },
  safetyBox: {
    marginTop: spacing.md,
    backgroundColor: '#FCECE3',
    borderRadius: radius.md,
    padding: spacing.md,
    gap: spacing.xs,
  },
  safetyText: { ...typography.body, color: colors.danger, fontWeight: '600' },
  altCard: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 2,
    borderColor: colors.primary,
    padding: spacing.md,
  },
  pressed: { opacity: 0.85 },
  altName: { ...typography.h3, color: colors.primary },
  altWorks: { ...typography.caption, color: colors.textMuted },
});
