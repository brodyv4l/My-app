import { DarkTheme, DefaultTheme } from '@react-navigation/native';
import { colors, lightColors } from './theme';

export const navigationTheme = {
  ...DarkTheme,
  dark: true,
  colors: {
    ...DarkTheme.colors,
    primary: colors.accent,
    background: colors.bg,
    card: colors.surface,
    text: colors.text,
    border: colors.border,
    notification: colors.accent,
  },
};

export const navigationThemeLight = {
  ...DefaultTheme,
  dark: false,
  colors: {
    ...DefaultTheme.colors,
    primary: lightColors.accent,
    background: lightColors.bg,
    card: lightColors.surface,
    text: lightColors.text,
    border: lightColors.border,
    notification: lightColors.accent,
  },
};

export function navigationThemeForMode(mode) {
  return mode === 'light' ? navigationThemeLight : navigationTheme;
}
