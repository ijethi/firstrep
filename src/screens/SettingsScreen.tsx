import React from 'react';
import { Alert, StyleSheet, Text } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';

import { AppButton, ScreenContainer } from '../components';
import { colors, typography } from '../theme';
import { defaultUnitSystem } from '../lib/units';
import { resetLocalAppData } from '../lib/resetAppData';
import { RootStackParamList } from '../navigation/types';

type Nav = NativeStackNavigationProp<RootStackParamList>;

export default function SettingsScreen() {
  const navigation = useNavigation<Nav>();
  const unitLabel =
    defaultUnitSystem === 'imperial' ? 'lb / in (imperial)' : 'kg / cm (metric)';

  const onReset = () => {
    Alert.alert(
      'Reset local data?',
      'This clears your onboarding, plan, progress, and logs on this device. This cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Reset',
          style: 'destructive',
          onPress: async () => {
            await resetLocalAppData();
            navigation.reset({ index: 0, routes: [{ name: 'Onboarding' }] });
          },
        },
      ],
    );
  };

  return (
    <ScreenContainer scroll>
      <Text style={typography.h1}>Profile</Text>
      <Text style={[typography.body, styles.muted]}>
        Update anything here. Changed injuries? Tell us and we&apos;ll adjust your moves.
      </Text>

      <Text style={typography.body}>Goal: Weight loss</Text>
      <Text style={typography.body}>Units: {unitLabel}</Text>

      <AppButton label="Restart plan" variant="secondary" onPress={() => {}} />
      <AppButton label="Reset local data" variant="secondary" onPress={onReset} />
      <AppButton label="Sign out" variant="ghost" onPress={() => {}} />
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  muted: { color: colors.textMuted },
});
