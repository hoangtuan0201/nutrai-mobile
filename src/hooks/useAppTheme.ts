import { useMemo } from 'react';
import { useColorScheme } from 'react-native';
import { useThemeStore, ThemeMode } from '../store/themeStore';
import { AppColors, DARK_COLORS, LIGHT_COLORS } from '../constants/colors';

export interface AppTheme {
  colors: AppColors;
  isDark: boolean;
  mode: ThemeMode;
  setMode: (mode: ThemeMode) => void;
}

/** Resolves the active palette from the user's choice (light / dark / system). */
export function useAppTheme(): AppTheme {
  const mode = useThemeStore((s) => s.mode);
  const setMode = useThemeStore((s) => s.setMode);
  const systemScheme = useColorScheme();

  const isDark = mode === 'system' ? systemScheme === 'dark' : mode === 'dark';

  return useMemo(
    () => ({ colors: isDark ? DARK_COLORS : LIGHT_COLORS, isDark, mode, setMode }),
    [isDark, mode, setMode],
  );
}

