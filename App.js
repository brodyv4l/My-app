import { StatusBar } from 'expo-status-bar';
import { AuthProvider } from './src/context/AuthContext';
import { UserProvider } from './src/context/UserContext';
import RootNavigator from './src/navigation/RootNavigator';

export default function App() {
  return (
    <AuthProvider>
      <UserProvider>
        <StatusBar style="light" />
        <RootNavigator />
      </UserProvider>
    </AuthProvider>
  );
}
