import React from 'react';
import { StyleSheet, Text } from 'react-native';

import { AppButton, ScreenContainer } from '../components';
import { colors, typography } from '../theme';
import { defaultUnitSystem } from '../lib/units';

export default function SettingsScreen() {
  const unitLabel =
    defaultUnitSystem === 'imperial' ? 'lb / in (imperial)' : 'kg / cm (metric)';

  return (
    <ScreenContainer scroll>
      <Text style={typography.h1}>Profile</Text>
      <Text style={[typography.body, styles.muted]}>
        Update anything here. Changed injuries? Tell us and we&apos;ll adjust your moves.
      </Text>

      <Text style={typography.body}>Goal: Weight loss</Text>
      <Text style={typography.body}>Units: {unitLabel}</Text>

      <AppButton label="Restart plan" variant="secondary" onPress={() => {}} />
      <AppButton label="Sign out" variant="ghost" onPress={() => {}} />
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  muted: { color: colors.textMuted },
});
