import React from 'react';
import { Alert, Image, Pressable, StyleSheet, Text, View } from 'react-native';
import * as ImagePicker from 'expo-image-picker';

import AppButton from './AppButton';
import { colors, radius, spacing, typography } from '../theme';
import type { PhotoProgress } from '../lib/progressStats';
import type { ProgressPhotoEntry } from '../types/database';

interface Props {
  stats: PhotoProgress;
  onAdd: (entry: ProgressPhotoEntry) => void;
}

/** Add + view local progress photos. Photos never leave the device. */
export default function ProgressPhotoCard({ stats, onAdd }: Props) {
  const pickPhoto = async () => {
    try {
      const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!perm.granted) {
        Alert.alert('Photo access needed', 'Allow photo access to add a progress photo.');
        return;
      }
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        quality: 0.6,
      });
      if (result.canceled) return;
      const uri = result.assets?.[0]?.uri;
      if (uri) {
        onAdd({ uri, angle: null, note: null, loggedOnISO: new Date().toISOString() });
      }
    } catch {
      Alert.alert('Couldn’t add photo', 'Something went wrong opening your photos. Please try again.');
    }
  };

  return (
    <View style={styles.card}>
      <Text style={styles.title}>📸 Progress photos</Text>
      <Text style={styles.privacy}>Photos stay on this device unless you choose to sync them.</Text>

      {stats.latest ? (
        <Image source={{ uri: stats.latest.uri }} style={styles.hero} resizeMode="cover" />
      ) : (
        <View style={styles.emptyBox}>
          <Text style={styles.emptyText}>Add a progress photo only if it feels helpful.</Text>
        </View>
      )}

      {stats.recent.length > 1 ? (
        <View style={styles.grid}>
          {stats.recent.map((p) => (
            <Image key={p.uri + p.loggedOnISO} source={{ uri: p.uri }} style={styles.thumb} resizeMode="cover" />
          ))}
        </View>
      ) : null}

      <AppButton label="Add progress photo" variant="secondary" onPress={pickPhoto} />
    </View>
  );
}

const styles = StyleSheet.create({
  card: { backgroundColor: colors.surface, borderRadius: radius.lg, padding: spacing.lg, gap: spacing.sm },
  title: { ...typography.h3, color: colors.text },
  privacy: { ...typography.caption, color: colors.textMuted },
  hero: { width: '100%', height: 240, borderRadius: radius.md, backgroundColor: colors.bgAlt },
  emptyBox: {
    height: 120,
    borderRadius: radius.md,
    backgroundColor: colors.bgAlt,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.lg,
  },
  emptyText: { ...typography.body, color: colors.textMuted, textAlign: 'center' },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  thumb: { width: 64, height: 64, borderRadius: radius.sm, backgroundColor: colors.bgAlt },
});
