import { useMemo } from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { View, StyleSheet, Platform, useWindowDimensions, TouchableOpacity } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import LogScreen from '../screens/tabs/LogScreen';
import ProgressScreen from '../screens/tabs/ProgressScreen';
import MealsScreen from '../screens/tabs/MealsScreen';
import AIChatScreen from '../screens/tabs/AIChatScreen';
import ProfileScreen from '../screens/tabs/ProfileScreen';
import { useTheme } from '../context/ThemeContext';
import Sidebar from './Sidebar';
import OfflineBanner from '../components/layout/OfflineBanner';
import ErrorBoundary from '../components/layout/ErrorBoundary';

const Tab = createBottomTabNavigator();
const isWeb = Platform.OS === 'web';
const DESKTOP_SIDEBAR_WIDTH = 240;

function withErrorBoundary(Screen) {
  return function WrappedScreen(props) {
    return (
      <ErrorBoundary>
        <Screen {...props} />
      </ErrorBoundary>
    );
  };
}

const TAB_ORDER = ['Log', 'Progress', 'Meals', 'AI', 'Profile'];

const TAB_CONFIG = {
  Log: { icon: 'book-open' },
  Progress: { icon: 'trending-up' },
  Meals: { icon: 'coffee' },
  AI: { icon: 'message-circle' },
  Profile: { icon: 'user' },
};

function MobileTabBar({ state, navigation }) {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const styles = useMemo(() => makeTabBarStyles(insets.bottom), [insets.bottom]);

  const routes = TAB_ORDER.map((name) => state.routes.find((r) => r.name === name)).filter(Boolean);

  return (
    <View style={styles.tabBar}>
      {routes.map((route) => {
        const routeIndex = state.routes.findIndex((r) => r.key === route.key);
        const isFocused = state.index === routeIndex;
        const iconName = TAB_CONFIG[route.name]?.icon;

        const onPress = () => {
          if (Platform.OS !== 'web') {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
          }
          const event = navigation.emit({
            type: 'tabPress',
            target: route.key,
            canPreventDefault: true,
          });
          if (!isFocused && !event.defaultPrevented) {
            navigation.navigate(route.name);
          }
        };

        return (
          <TouchableOpacity
            key={route.key}
            style={styles.tabItem}
            onPress={onPress}
            activeOpacity={0.7}
            accessibilityRole="button"
            accessibilityState={isFocused ? { selected: true } : {}}
          >
            <Feather
              name={iconName}
              size={isFocused ? 24 : 22}
              color={isFocused ? colors.accent : colors.textMuted}
            />
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

function DesktopTabBar({ state, navigation }) {
  const route = state.routes[state.index];
  return (
    <Sidebar
      activeRoute={route.name}
      onNavigate={(name) => navigation.navigate(name)}
    />
  );
}

function TabNavigator() {
  const { width } = useWindowDimensions();
  const { colors } = useTheme();
  const isDesktop = isWeb && width >= 1024;

  return (
    <Tab.Navigator
      tabBar={(props) => (isDesktop ? <DesktopTabBar {...props} /> : <MobileTabBar {...props} />)}
      screenOptions={{
        headerShown: false,
        tabBarShowLabel: false,
        lazy: true,
        tabBarPosition: isDesktop ? 'left' : 'bottom',
        sceneStyle: { backgroundColor: colors.bg, flex: 1 },
        tabBarStyle: isDesktop
          ? {
              width: DESKTOP_SIDEBAR_WIDTH,
              minWidth: DESKTOP_SIDEBAR_WIDTH,
              borderTopWidth: 0,
              borderRightWidth: 1,
              borderRightColor: colors.border,
              backgroundColor: colors.surface,
              elevation: 0,
            }
          : {
              backgroundColor: '#0F0F0F',
              borderTopColor: '#1A1A1A',
              borderTopWidth: 1,
            },
      }}
    >
      <Tab.Screen name="Log" component={withErrorBoundary(LogScreen)} />
      <Tab.Screen name="Progress" component={withErrorBoundary(ProgressScreen)} />
      <Tab.Screen name="Meals" component={withErrorBoundary(MealsScreen)} />
      <Tab.Screen name="AI" component={withErrorBoundary(AIChatScreen)} />
      <Tab.Screen name="Profile" component={withErrorBoundary(ProfileScreen)} />
    </Tab.Navigator>
  );
}

export default function MainTabs() {
  const { colors } = useTheme();
  const styles = useMemo(() => makeRootStyles(colors), [colors]);
  return (
    <View style={styles.root}>
      <OfflineBanner />
      <View style={styles.tabs}>
        <TabNavigator />
      </View>
    </View>
  );
}

const makeRootStyles = (colors) => StyleSheet.create({
  root: { flex: 1, backgroundColor: colors?.bg || '#0A0A0A' },
  tabs: { flex: 1 },
});

const makeTabBarStyles = (bottomInset) => StyleSheet.create({
  tabBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#0F0F0F',
    borderTopColor: '#1A1A1A',
    borderTopWidth: 1,
    paddingTop: 4,
    paddingBottom: Math.max(bottomInset, 8),
    minHeight: 60 + Math.max(bottomInset, 0),
  },
  tabItem: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
  },
});
