import { registerRootComponent } from 'expo';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { Platform } from 'react-native';
import App from './App';

if (Platform.OS === 'web' && typeof document !== 'undefined') {
  // Make the app fill the entire viewport with no phone frame, style the
  // scrollbar for the dark theme, and add the safe-area / PWA meta tags.
  const css = `
    html, body, #root { height: 100%; margin: 0; padding: 0; }
    body { background-color: #0A0A0A; }
    #root { display: flex; flex: 1; }
    * { scrollbar-width: thin; scrollbar-color: #AAFF00 #1C1C1C; }
    *::-webkit-scrollbar { width: 6px; height: 6px; }
    *::-webkit-scrollbar-track { background: #1C1C1C; }
    *::-webkit-scrollbar-thumb { background-color: #AAFF00; border-radius: 3px; }
    [role="button"]:hover { filter: brightness(1.08); }
    @font-face {
      font-family: Feather;
      src: url(https://cdn.jsdelivr.net/npm/@expo/vector-icons@15.0.3/build/vendor/react-native-vector-icons/Fonts/Feather.ttf) format('truetype');
      font-weight: normal;
      font-style: normal;
    }
    @font-face {
      font-family: Ionicons;
      src: url(https://cdn.jsdelivr.net/npm/@expo/vector-icons@15.0.3/build/vendor/react-native-vector-icons/Fonts/Ionicons.ttf) format('truetype');
      font-weight: normal;
      font-style: normal;
    }
  `;
  const style = document.createElement('style');
  style.setAttribute('data-foodprint', 'true');
  style.textContent = css;
  document.head.appendChild(style);

  const upsertMeta = (name, content) => {
    let el = document.head.querySelector(`meta[name="${name}"]`);
    if (!el) {
      el = document.createElement('meta');
      el.setAttribute('name', name);
      document.head.appendChild(el);
    }
    el.setAttribute('content', content);
  };
  const upsertHttpEquiv = (httpEquiv, content) => {
    let el = document.head.querySelector(`meta[http-equiv="${httpEquiv}"]`);
    if (!el) {
      el = document.createElement('meta');
      el.setAttribute('http-equiv', httpEquiv);
      document.head.appendChild(el);
    }
    el.setAttribute('content', content);
  };
  upsertHttpEquiv('Cache-Control', 'no-cache, no-store, must-revalidate');
  upsertHttpEquiv('Pragma', 'no-cache');
  upsertHttpEquiv('Expires', '0');
  upsertMeta('viewport', 'width=device-width, initial-scale=1, viewport-fit=cover');
  upsertMeta('apple-mobile-web-app-capable', 'yes');
  upsertMeta('apple-mobile-web-app-status-bar-style', 'black-translucent');
  upsertMeta('theme-color', '#0A0A0A');
}

function Root() {
  return (
    <SafeAreaProvider style={{ flex: 1 }}>
      <App />
    </SafeAreaProvider>
  );
}

registerRootComponent(Root);
