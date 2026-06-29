import React from 'react';
import { Image, StyleSheet, Text, View } from 'react-native';

import { getExerciseImage } from '../images/exerciseImages';
import { colors, radius, spacing, typography } from '../theme';

type Props = {
  name: string;
  /** Plain-language "what it works", e.g. "Works your back". */
  worksPlain: string;
  setsReps?: string;
  /** Slug used to resolve the machine image (placeholder until art exists). */
  slug?: string;
};

/** Row card for an exercise — image (or placeholder) + name + plain description. */
export default function ExerciseCard({ name, worksPlain, setsReps, slug }: Props) {
  const image = slug ? getExerciseImage(slug) : null;

  return (
    <View style={styles.card}>
      <View style={styles.thumb}>
        {image ? (
          <Image source={image} style={styles.img} resizeMode="cover" />
        ) : (
          <Text style={styles.placeholder}>🏋️</Text>
        )}
      </View>
      <View style={styles.body}>
        <Text style={styles.name}>{name}</Text>
        <Text style={styles.works}>{worksPlain}</Text>
        {setsReps ? <Text style={styles.sets}>{setsReps}</Text> : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    gap: spacing.md,
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: spacing.md,
    alignItems: 'center',
  },
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
  works: { ...typography.caption, color: colors.textMuted },
  sets: { ...typography.caption, color: colors.primary },
});
