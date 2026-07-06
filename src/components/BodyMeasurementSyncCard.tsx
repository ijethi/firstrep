import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

import AppButton from './AppButton';
import { colors, radius, spacing, typography } from '../theme';
import { useAuthStore } from '../state/authStore';
import { useBodyMeasurementSyncStore } from '../state/bodyMeasurementSyncStore';
import { syncBodyMeasurements } from '../lib/bodyMeasurementSync';

const SCOPE_COPY =
  'Only body measurements sync here. Photos and recommendations stay on this device for now.';

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

/** Manual "Sync measurements" control + status. Disabled when signed out. */
export default function BodyMeasurementSyncCard() {
  const user = useAuthStore((s) => s.user);
  const authStatus = useAuthStore((s) => s.status);
  const status = useBodyMeasurementSyncStore((s) => s.status);
  const lastError = useBodyMeasurementSyncStore((s) => s.lastError);
  const lastSyncedAtISO = useBodyMeasurementSyncStore((s) => s.lastSyncedAtISO);

  const canSync = authStatus === 'signed_in' && !!user;

  return (
    <View style={styles.card}>
      <Text style={styles.title}>📏 Measurements sync</Text>
      <Text style={styles.scope}>{SCOPE_COPY}</Text>

      <Text style={styles.status}>{statusLabel(canSync ? status : 'disabled', lastError)}</Text>
      <Text style={styles.when}>Last synced: {formatWhen(lastSyncedAtISO)}</Text>

      <AppButton
        label="Sync measurements"
        variant="secondary"
        onPress={() => syncBodyMeasurements(user)}
        loading={status === 'syncing'}
        disabled={!canSync}
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
