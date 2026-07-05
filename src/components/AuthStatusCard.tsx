import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

import AppButton from './AppButton';
import { colors, radius, spacing, typography } from '../theme';
import { LOCAL_FIRST_MESSAGE } from '../lib/supabaseConfig';
import { useAuthStore } from '../state/authStore';

interface Props {
  onSignIn: () => void;
}

/** Shows auth status in Settings. Local-first: safe when Supabase isn't configured. */
export default function AuthStatusCard({ onSignIn }: Props) {
  const status = useAuthStore((s) => s.status);
  const user = useAuthStore((s) => s.user);
  const loading = useAuthStore((s) => s.loading);
  const signOut = useAuthStore((s) => s.signOut);

  return (
    <View style={styles.card}>
      {status === 'unconfigured' ? (
        <>
          <Text style={styles.title}>☁️ Cloud sync</Text>
          <Text style={styles.body}>{LOCAL_FIRST_MESSAGE}</Text>
        </>
      ) : status === 'signed_in' ? (
        <>
          <Text style={styles.title}>Signed in</Text>
          <Text style={styles.body}>{user?.email ?? 'Your account'}</Text>
          <Text style={styles.note}>{LOCAL_FIRST_MESSAGE}</Text>
          <AppButton label="Sign out" variant="secondary" onPress={signOut} loading={loading} />
        </>
      ) : (
        <>
          <Text style={styles.title}>☁️ Back up your progress</Text>
          <Text style={styles.body}>
            Create an account to sync later. {LOCAL_FIRST_MESSAGE}
          </Text>
          <AppButton label="Sign in / Sign up" onPress={onSignIn} />
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: spacing.lg,
    gap: spacing.sm,
  },
  title: { ...typography.h3, color: colors.text },
  body: { ...typography.body, color: colors.text },
  note: { ...typography.caption, color: colors.textMuted },
});
