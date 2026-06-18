import { View, StyleSheet } from 'react-native';
import { AuthProvider } from './src/context/AuthContext';
import { UserProvider } from './src/context/UserContext';
import { ThemeProvider } from './src/context/ThemeContext';
import { ToastProvider } from './src/context/ToastContext';
import RootNavigator from './src/navigation/RootNavigator';
import CheckoutCallbackHandler from './src/components/paywall/CheckoutCallbackHandler';
import WebAppVersionSync from './src/components/layout/WebAppVersionSync';
import WebErrorBoundary from './src/components/layout/WebErrorBoundary';

export default function App() {
  return (
    <View style={styles.root}>
      <WebErrorBoundary>
        <AuthProvider>
          <ToastProvider>
            <UserProvider>
              <ThemeProvider>
                <WebAppVersionSync />
                <CheckoutCallbackHandler />
                <RootNavigator />
              </ThemeProvider>
            </UserProvider>
          </ToastProvider>
        </AuthProvider>
      </WebErrorBoundary>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
});
