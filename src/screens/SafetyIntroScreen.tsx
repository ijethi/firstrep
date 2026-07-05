import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';

import { AppButton, ScreenContainer } from '../components';
import SafetyDisclaimerCard from '../components/SafetyDisclaimerCard';
import { colors, spacing, typography } from '../theme';
import { RootStackParamList } from '../navigation/types';
import { useSafetyStore } from '../state/safetyStore';
import { useOnboardingStore } from '../state/onboardingStore';

type Nav = NativeStackNavigationProp<RootStackParamList, 'SafetyIntro'>;

/** One-time first-run safety intro. Acknowledge to continue. */
export default function SafetyIntroScreen() {
  const navigation = useNavigation<Nav>();
  const acknowledge = useSafetyStore((s) => s.acknowledge);
  const onboardingComplete = useOnboardingStore((s) => s.completed);

  const onContinue = () => {
    acknowledge();
    navigation.replace(onboardingComplete ? 'Main' : 'Onboarding');
  };

  return (
    <ScreenContainer>
      <View style={styles.top}>
        <Text style={typography.h1}>Welcome to FirstRep 👋</Text>
        <Text style={[typography.body, styles.sub]}>
          Your pocket trainer for the gym. Before we start, one quick note so you can train safely.
        </Text>
        <SafetyDisclaimerCard />
      </View>
      <AppButton label="I understand — let’s go" onPress={onContinue} />
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  top: { flex: 1, justifyContent: 'center', gap: spacing.md },
  sub: { color: colors.textMuted },
});
