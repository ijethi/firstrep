import React, { useMemo, useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';

import { ScreenContainer } from '../components';
import SearchBar from '../components/SearchBar';
import FilterPill from '../components/FilterPill';
import ExerciseLibraryCard from '../components/ExerciseLibraryCard';
import { colors, spacing, typography } from '../theme';
import { RootStackParamList } from '../navigation/types';
import { EXERCISE_CATALOG } from '../data/exerciseCatalog';
import { CATEGORY_LABEL, filterExercises } from '../lib/exerciseLibrary';
import type { LibraryFilter } from '../lib/exerciseLibrary';

type Nav = NativeStackNavigationProp<RootStackParamList>;

const FILTERS: LibraryFilter[] = ['all', 'upper', 'lower', 'cardio', 'core', 'beginner_safe'];

export default function ExerciseLibraryScreen() {
  const navigation = useNavigation<Nav>();
  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState<LibraryFilter>('all');

  const results = useMemo(() => filterExercises(EXERCISE_CATALOG, query, filter), [query, filter]);

  return (
    <ScreenContainer scroll>
      <Text style={typography.h1}>Exercise Library</Text>
      <Text style={[typography.body, styles.muted]}>
        Curious about a machine? Look it up before you try it — no pressure.
      </Text>

      <SearchBar value={query} onChangeText={setQuery} />

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.filters}
      >
        {FILTERS.map((f) => (
          <FilterPill
            key={f}
            label={CATEGORY_LABEL[f]}
            selected={filter === f}
            onPress={() => setFilter(f)}
          />
        ))}
      </ScrollView>

      {results.length === 0 ? (
        <View style={styles.empty}>
          <Text style={styles.emptyText}>
            No machines match that. Try a different word, like &quot;back&quot; or &quot;legs&quot;.
          </Text>
        </View>
      ) : (
        <View style={styles.list}>
          {results.map((ex) => (
            <ExerciseLibraryCard
              key={ex.slug}
              exercise={ex}
              onPress={() => navigation.navigate('ExerciseDetail', { slug: ex.slug })}
            />
          ))}
        </View>
      )}
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  muted: { color: colors.textMuted },
  filters: { gap: spacing.sm, paddingVertical: spacing.xs },
  list: { gap: spacing.sm },
  empty: { paddingVertical: spacing.xl, alignItems: 'center' },
  emptyText: { ...typography.body, color: colors.textMuted, textAlign: 'center' },
});
