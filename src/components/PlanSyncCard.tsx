import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

import AppButton from './AppButton';
import { colors, radius, spacing, typography } from '../theme';
import { useAuthStore } from '../state/authStore';
import { usePlanSyncStore } from '../state/planSyncStore';
import { usePlanStore } from '../state/planStore';
import { syncPlan } from '../lib/planSync';

const SCOPE_COPY =
  'Only your generated plan syncs here. Workout history still stays on this device.';

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

/** Manual "Sync workout plan" control + status. Disabled when signed out / no plan. */
export default function PlanSyncCard() {
  const user = useAuthStore((s) => s.user);
  const authStatus = useAuthStore((s) => s.status);
  const status = usePlanSyncStore((s) => s.status);
  const lastError = usePlanSyncStore((s) => s.lastError);
  const lastSyncedAtISO = usePlanSyncStore((s) => s.lastSyncedAtISO);
  const hasPlan = usePlanStore((s) => !!s.plan);

  const canSync = authStatus === 'signed_in' && !!user;

  return (
    <View style={styles.card}>
      <Text style={styles.title}>🗓️ Workout plan sync</Text>
      <Text style={styles.scope}>{SCOPE_COPY}</Text>

      <Text style={styles.status}>{statusLabel(canSync ? status : 'disabled', lastError)}</Text>
      <Text style={styles.when}>Last synced: {formatWhen(lastSyncedAtISO)}</Text>

      <AppButton
        label="Sync workout plan"
        variant="secondary"
        onPress={() => syncPlan(user)}
        loading={status === 'syncing'}
        disabled={!canSync || !hasPlan}
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
