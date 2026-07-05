import React, { useState } from 'react';
import { StyleSheet, Text, TextInput, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';

import { AppButton, ScreenContainer } from '../components';
import { colors, radius, spacing, typography } from '../theme';
import { RootStackParamList } from '../navigation/types';
import { useAuthStore } from '../state/authStore';
import { isSupabaseConfigured, LOCAL_FIRST_MESSAGE } from '../lib/supabaseConfig';

type Nav = NativeStackNavigationProp<RootStackParamList, 'SignIn'>;

export default function SignInScreen() {
  const navigation = useNavigation<Nav>();
  const signIn = useAuthStore((s) => s.signIn);
  const loading = useAuthStore((s) => s.loading);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);

  const submit = async () => {
    setError(null);
    const { error: err } = await signIn(email.trim(), password);
    if (err) setError(err);
    else navigation.goBack();
  };

  return (
    <ScreenContainer scroll>
      <Text style={typography.h1}>Sign in</Text>
      <Text style={[typography.body, styles.muted]}>{LOCAL_FIRST_MESSAGE}</Text>

      {!isSupabaseConfigured ? (
        <View style={styles.warn}>
          <Text style={styles.warnText}>
            Cloud sync isn&apos;t set up on this build yet, so sign-in is unavailable. Everything still
            works on your device.
          </Text>
        </View>
      ) : null}

      <Text style={styles.label}>Email</Text>
      <TextInput
        style={styles.input}
        value={email}
        onChangeText={setEmail}
        autoCapitalize="none"
        keyboardType="email-address"
        placeholder="you@example.com"
        placeholderTextColor={colors.textMuted}
      />
      <Text style={styles.label}>Password</Text>
      <TextInput
        style={styles.input}
        value={password}
        onChangeText={setPassword}
        secureTextEntry
        placeholder="Your password"
        placeholderTextColor={colors.textMuted}
      />

      {error ? <Text style={styles.error}>{error}</Text> : null}

      <AppButton
        label="Sign in"
        onPress={submit}
        loading={loading}
        disabled={!isSupabaseConfigured || email.trim().length === 0 || password.length === 0}
      />
      <AppButton
        label="Create an account instead"
        variant="ghost"
        onPress={() => navigation.replace('SignUp')}
      />
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  muted: { color: colors.textMuted },
  label: { ...typography.caption, color: colors.textMuted, marginTop: spacing.sm },
  input: {
    minHeight: 52,
    borderWidth: 2,
    borderColor: colors.border,
    borderRadius: radius.lg,
    backgroundColor: colors.surface,
    paddingHorizontal: spacing.lg,
    ...typography.body,
    color: colors.text,
  },
  error: { ...typography.body, color: colors.danger },
  warn: { backgroundColor: '#FCECE3', borderRadius: radius.md, padding: spacing.md },
  warnText: { ...typography.body, color: colors.danger },
});
