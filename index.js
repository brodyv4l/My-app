import { registerRootComponent } from 'expo';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { Platform } from 'react-native';
import App from './App';
import PhoneFrame from './src/components/PhoneFrame';

if (Platform.OS === 'web' && typeof document !== 'undefined') {
  document.documentElement.style.height = '100%';
  document.body.style.height = '100%';
  document.body.style.margin = '0';
  document.body.style.backgroundColor = '#050506';
  const root = document.getElementById('root');
  if (root) {
    root.style.height = '100%';
    root.style.display = 'flex';
    root.style.flex = '1';
  }
}

function Root() {
  return (
    <SafeAreaProvider>
      <PhoneFrame>
        <App />
      </PhoneFrame>
    </SafeAreaProvider>
  );
}

registerRootComponent(Root);

