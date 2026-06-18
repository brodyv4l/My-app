import { createContext, useContext, useMemo } from 'react';
import { useUser } from './UserContext';
import { colors, lightColors } from '../constants/theme';

const ThemeContext = createContext({ colors, isDark: true, themeMode: 'dark' });

export function ThemeProvider({ children }) {
  const { profile, loaded } = useUser();
  const themeMode = loaded && profile.themeMode === 'light' ? 'light' : 'dark';
  const value = useMemo(() => ({
    themeMode,
    isDark: themeMode === 'dark',
    colors: themeMode === 'light' ? lightColors : colors,
  }), [themeMode]);
  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme() {
  return useContext(ThemeContext);
}
