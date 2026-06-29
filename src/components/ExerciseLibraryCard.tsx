import React from 'react';
import { Image, Pressable, StyleSheet, Text, View } from 'react-native';

import { getExerciseImage } from '../images/exerciseImages';
import { colors, radius, spacing, typography } from '../theme';
import { CATEGORY_LABEL, categoryOf } from '../lib/exerciseLibrary';
import type { CatalogExercise } from '../data/exerciseCatalog';

interface Props {
  exercise: CatalogExercise;
  onPress: () => void;
}

/** Tappable library row — image (or placeholder) + name + category + muscles. */
export default function ExerciseLibraryCard({ exercise, onPress }: Props) {
  const image = getExerciseImage(exercise.slug);

  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      style={({ pressed }) => [styles.card, pressed && styles.pressed]}
    >
      <View style={styles.thumb}>
        {image ? (
          <Image source={image} style={styles.img} resizeMode="cover" />
        ) : (
          <Text style={styles.placeholder}>🏋️</Text>
        )}
      </View>
      <View style={styles.body}>
        <Text style={styles.name}>{exercise.name}</Text>
        <Text style={styles.category}>{CATEGORY_LABEL[categoryOf(exercise)]}</Text>
        <Text style={styles.muscles} numberOfLines={1}>
          {exercise.primaryMuscles.join(' · ')}
        </Text>
      </View>
      <Text style={styles.chevron}>›</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: spacing.md,
  },
  pressed: { opacity: 0.85 },
  thumb: {
    width: 64,
    height: 64,
    borderRadius: radius.md,
    backgroundColor: colors.bgAlt,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  img: { width: '100%', height: '100%' },
  placeholder: { fontSize: 28 },
  body: { flex: 1, gap: 2 },
  name: { ...typography.h3, color: colors.text },
  category: { ...typography.caption, color: colors.primary, fontWeight: '700' },
  muscles: { ...typography.caption, color: colors.textMuted },
  chevron: { ...typography.h2, color: colors.textMuted },
});
