import React from 'react';
import { Text } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

import { colors } from '../theme';
import { RootStackParamList } from './types';
import OnboardingScreen from '../screens/OnboardingScreen';
import TodayScreen from '../screens/TodayScreen';
import ProgressScreen from '../screens/ProgressScreen';
import ExerciseLibraryScreen from '../screens/ExerciseLibraryScreen';
import ExerciseDetailScreen from '../screens/ExerciseDetailScreen';
import WeeklyCheckInScreen from '../screens/WeeklyCheckInScreen';
import SignInScreen from '../screens/SignInScreen';
import SignUpScreen from '../screens/SignUpScreen';
import SettingsScreen from '../screens/SettingsScreen';
import WorkoutGuideScreen from '../screens/WorkoutGuideScreen';
import SessionSummaryScreen from '../screens/SessionSummaryScreen';
import SafetyIntroScreen from '../screens/SafetyIntroScreen';
import { useOnboardingStore } from '../state/onboardingStore';
import { useSafetyStore } from '../state/safetyStore';
import { initialRouteName } from '../lib/safety';

const Stack = createNativeStackNavigator<RootStackParamList>();
const Tab = createBottomTabNavigator();

function TabIcon({ label, focused }: { label: string; focused: boolean }) {
  return <Text style={{ fontSize: 20, opacity: focused ? 1 : 0.5 }}>{label}</Text>;
}

function MainTabs() {
  return (
    <Tab.Navigator
      screenOptions={{
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.textMuted,
        tabBarLabelStyle: { fontSize: 12, fontWeight: '600' },
        headerTitleStyle: { fontWeight: '700' },
      }}
    >
      <Tab.Screen
        name="Today"
        component={TodayScreen}
        options={{ tabBarIcon: ({ focused }) => <TabIcon label="🏠" focused={focused} /> }}
      />
      <Tab.Screen
        name="Progress"
        component={ProgressScreen}
        options={{ tabBarIcon: ({ focused }) => <TabIcon label="📈" focused={focused} /> }}
      />
      <Tab.Screen
        name="Library"
        component={ExerciseLibraryScreen}
        options={{ tabBarIcon: ({ focused }) => <TabIcon label="📚" focused={focused} /> }}
      />
      <Tab.Screen
        name="Settings"
        component={SettingsScreen}
        options={{ tabBarIcon: ({ focused }) => <TabIcon label="⚙️" focused={focused} /> }}
      />
    </Tab.Navigator>
  );
}

export default function RootNavigator() {
  // Rendered only after hydration (see App), so this reflects persisted state:
  // show the safety intro once, then skip onboarding if already completed.
  const onboardingComplete = useOnboardingStore((s) => s.completed);
  const acknowledged = useSafetyStore((s) => s.acknowledged);
  return (
    <NavigationContainer>
      <Stack.Navigator initialRouteName={initialRouteName(acknowledged, onboardingComplete)}>
        <Stack.Screen
          name="SafetyIntro"
          component={SafetyIntroScreen}
          options={{ headerShown: false }}
        />
        <Stack.Screen
          name="Onboarding"
          component={OnboardingScreen}
          options={{ headerShown: false }}
        />
        <Stack.Screen name="Main" component={MainTabs} options={{ headerShown: false }} />
        <Stack.Screen
          name="WorkoutGuide"
          component={WorkoutGuideScreen}
          options={{ title: 'Workout' }}
        />
        <Stack.Screen
          name="SessionSummary"
          component={SessionSummaryScreen}
          options={{ title: 'Workout complete', headerBackVisible: false }}
        />
        <Stack.Screen
          name="ExerciseDetail"
          component={ExerciseDetailScreen}
          options={{ title: 'Machine guide' }}
        />
        <Stack.Screen
          name="WeeklyCheckIn"
          component={WeeklyCheckInScreen}
          options={{ title: 'Weekly check-in' }}
        />
        <Stack.Screen name="SignIn" component={SignInScreen} options={{ title: 'Sign in' }} />
        <Stack.Screen name="SignUp" component={SignUpScreen} options={{ title: 'Create account' }} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
