import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

import AppButton from './AppButton';
import { colors, radius, spacing, typography } from '../theme';
import { useAuthStore } from '../state/authStore';
import { useProgressPhotoSyncStore } from '../state/progressPhotoSyncStore';
import { useProgressStore } from '../state/progressStore';
import { syncProgressPhotos } from '../lib/progressPhotoSync';

const SCOPE_COPY =
  'Progress photos are private and only sync to your account. They are not analyzed or shared.';

function statusLabel(status: string, lastError: string | null): string {
  switch (status) {
    case 'syncing':
      return 'Syncing…';
    case 'success':
      return 'Synced ✓';
    case 'error':
      return `Couldn’t sync: ${lastError ?? 'please try again'}`;
    case 'disabled':
      return 'Sign in to sync';
    default:
      return 'Not synced yet';
  }
}

function formatWhen(iso: string | null): string {
  if (!iso) return 'never';
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? 'never' : d.toLocaleString();
}

/** Manual "Sync progress photos" control + status. Explicit action only (no auto-upload). */
export default function ProgressPhotoSyncCard() {
  const user = useAuthStore((s) => s.user);
  const authStatus = useAuthStore((s) => s.status);
  const status = useProgressPhotoSyncStore((s) => s.status);
  const lastError = useProgressPhotoSyncStore((s) => s.lastError);
  const lastSyncedAtISO = useProgressPhotoSyncStore((s) => s.lastSyncedAtISO);
  const hasPhotos = useProgressStore((s) => s.photos.length > 0);

  const canSync = authStatus === 'signed_in' && !!user;

  return (
    <View style={styles.card}>
      <Text style={styles.title}>📸 Progress photo sync</Text>
      <Text style={styles.scope}>{SCOPE_COPY}</Text>

      <Text style={styles.status}>{statusLabel(canSync ? status : 'disabled', lastError)}</Text>
      <Text style={styles.when}>Last synced: {formatWhen(lastSyncedAtISO)}</Text>

      <AppButton
        label="Sync progress photos"
        variant="secondary"
        onPress={() => syncProgressPhotos(user)}
        loading={status === 'syncing'}
        disabled={!canSync || !hasPhotos}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  card: { backgroundColor: colors.surface, borderRadius: radius.lg, padding: spacing.lg, gap: spacing.xs },
  title: { ...typography.h3, color: colors.text },
  scope: { ...typography.caption, color: colors.textMuted },
  status: { ...typography.body, color: colors.text, marginTop: spacing.xs },
  when: { ...typography.caption, color: colors.textMuted },
});
