import React, { useEffect } from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import RootNavigator from './navigation/RootNavigator';
import { useAppHydrated } from './lib/useHydration';
import { useAuthStore } from './state/authStore';
import { colors, spacing, typography } from './theme';

function LoadingScreen() {
  return (
    <View style={styles.loading}>
      <ActivityIndicator size="large" color={colors.primary} />
      <Text style={styles.loadingText}>Loading your plan…</Text>
    </View>
  );
}

export default function App() {
  const hydrated = useAppHydrated();

  // Restore any existing Supabase session (no-op when Supabase isn't configured).
  useEffect(() => {
    useAuthStore.getState().initialize();
  }, []);

  return (
    <SafeAreaProvider>
      <StatusBar style="dark" />
      {hydrated ? <RootNavigator /> : <LoadingScreen />}
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  loading: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.bg,
    gap: spacing.md,
  },
  loadingText: { ...typography.body, color: colors.textMuted },
});
