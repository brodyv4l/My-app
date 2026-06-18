import { ActivityIndicator, View, StyleSheet } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { useAuth } from '../context/AuthContext';
import { useUser } from '../context/UserContext';
import { useTheme } from '../context/ThemeContext';
import AuthNavigator from './AuthNavigator';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import MainTabs from './MainTabs';
import FoodLibraryScreen from '../screens/tabs/FoodLibraryScreen';
import UpgradeScreen from '../screens/UpgradeScreen';
import AdminScreen from '../screens/AdminScreen';
import NutrientReportScreen from '../screens/NutrientReportScreen';
import OnboardingScreen from '../screens/onboarding/OnboardingScreen';
import { isSurveyComplete } from '../utils/subscriptionMerge';
import { navigationThemeForMode } from '../constants/navigationTheme';
import { StatusBar } from 'expo-status-bar';

const AppStackNav = createNativeStackNavigator();

function needsOnboarding(profile) {
  return !isSurveyComplete(profile);
}

function MainAppStack() {
  return (
    <AppStackNav.Navigator screenOptions={{ headerShown: false, contentStyle: { flex: 1 } }}>
      <AppStackNav.Screen name="Main" component={MainTabs} />
      <AppStackNav.Screen name="Search" component={FoodLibraryScreen} />
      <AppStackNav.Screen name="Upgrade" component={UpgradeScreen} />
      <AppStackNav.Screen name="Admin" component={AdminScreen} />
      <AppStackNav.Screen name="NutrientReport" component={NutrientReportScreen} />
    </AppStackNav.Navigator>
  );
}

export default function RootNavigator() {
  const { isAuthenticated, loading: authLoading } = useAuth();
  const { profile, loaded: profileLoaded } = useUser();
  const { isDark, colors } = useTheme();

  const waiting = authLoading || (isAuthenticated && !profileLoaded);

  if (waiting) {
    return (
      <View style={[styles.loading, { backgroundColor: colors.bg }]}>
        <ActivityIndicator size="large" color={colors.accent} />
      </View>
    );
  }

  return (
    <View style={styles.app}>
      <StatusBar style={isDark ? 'light' : 'dark'} />
      <NavigationContainer theme={navigationThemeForMode(profile.themeMode)}>
        {!isAuthenticated ? (
          <AuthNavigator />
        ) : needsOnboarding(profile) ? (
          <OnboardingScreen />
        ) : (
          <MainAppStack />
        )}
      </NavigationContainer>
    </View>
  );
}

const styles = StyleSheet.create({
  app: { flex: 1 },
  loading: { flex: 1, alignItems: 'center', justifyContent: 'center' },
});
