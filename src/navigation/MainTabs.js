import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { StyleSheet, Platform } from 'react-native';
import { Feather } from '@expo/vector-icons';
import LogScreen from '../screens/tabs/LogScreen';
import ProgressScreen from '../screens/tabs/ProgressScreen';
import FoodLibraryScreen from '../screens/tabs/FoodLibraryScreen';
import MealsScreen from '../screens/tabs/MealsScreen';
import ProfileScreen from '../screens/tabs/ProfileScreen';
import { colors } from '../constants/theme';

const Tab = createBottomTabNavigator();
const isWebPreview = Platform.OS === 'web';

const ICONS = {
  Log: 'book-open',
  Progress: 'trending-up',
  Library: 'search',
  Meals: 'calendar',
  Profile: 'user',
};

export default function MainTabs() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarStyle: styles.tabBar,
        tabBarActiveTintColor: colors.accent,
        tabBarInactiveTintColor: colors.textMuted,
        tabBarLabelStyle: styles.tabLabel,
        tabBarItemStyle: styles.tabItem,
        tabBarIcon: ({ color }) => (
          <Feather name={ICONS[route.name]} size={18} color={color} />
        ),
      })}
    >
      <Tab.Screen name="Log" component={LogScreen} />
      <Tab.Screen name="Progress" component={ProgressScreen} />
      <Tab.Screen name="Library" component={FoodLibraryScreen} options={{ tabBarLabel: 'Food' }} />
      <Tab.Screen name="Meals" component={MealsScreen} />
      <Tab.Screen name="Profile" component={ProfileScreen} />
    </Tab.Navigator>
  );
}

const styles = StyleSheet.create({
  tabBar: {
    backgroundColor: colors.surface,
    borderTopColor: colors.border,
    borderTopWidth: 1,
    height: isWebPreview ? 58 : (Platform.OS === 'ios' ? 84 : 64),
    paddingBottom: isWebPreview ? 8 : (Platform.OS === 'ios' ? 24 : 8),
    paddingTop: 6,
  },
  tabItem: {
    paddingTop: 2,
    paddingBottom: 2,
  },
  tabLabel: {
    fontSize: 10,
    fontWeight: '500',
    marginTop: 2,
    marginBottom: 0,
  },
});
