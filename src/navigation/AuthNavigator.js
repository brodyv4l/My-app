import { createNativeStackNavigator } from '@react-navigation/native-stack';
import LoginScreen from '../screens/auth/LoginScreen';
import SignUpScreen from '../screens/auth/SignUpScreen';
import ForgotPasswordScreen from '../screens/auth/ForgotPasswordScreen';
import { useTheme } from '../context/ThemeContext';

const Stack = createNativeStackNavigator();

export default function AuthNavigator() {
  const { colors } = useTheme();
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
        animation: 'slide_from_right',
        contentStyle: { backgroundColor: colors.bg, flex: 1 },
      }}
    >
      <Stack.Screen name="Login" component={LoginScreen} />
      <Stack.Screen name="SignUp" component={SignUpScreen} />
      <Stack.Screen name="ForgotPassword" component={ForgotPasswordScreen} />
    </Stack.Navigator>
  );
}
