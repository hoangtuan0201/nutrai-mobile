/**
 * Semantic color tokens for Light / Dark mode.
 * Use via `useAppTheme().colors` — never hardcode hex in themed screens.
 */
export interface AppColors {
  background: string;
  surface: string;
  surfaceMuted: string;
  border: string;
  divider: string;
  textPrimary: string;
  textSecondary: string;
  textMuted: string;
  accent: string;
  accentSoft: string;
  primary: string;
  onPrimary: string;
  danger: string;
  dangerBorder: string;
  overlay: string;
  iconBg: string;
  inputBg: string;

  // Navigation & Tabs
  tabBarBg: string;
  tabBarBorder: string;
  tabBarActive: string;
  tabBarInactive: string;
  fabBg: string;

  // Feature Cards & Highlights
  card: string;
  cardBorder: string;
  waterCardBg: string;
  waterCardBorder: string;
  aiBannerBg: string;
  aiBannerBorder: string;
  tagBg: string;
}

export const LIGHT_COLORS: AppColors = {
  background: '#F6F5EE',
  surface: '#FFFFFF',
  surfaceMuted: '#F3F2EB',
  border: '#EFECE2',
  divider: '#F2EFE8',
  textPrimary: '#1B281B',
  textSecondary: '#767B71',
  textMuted: '#A0A096',
  accent: '#FF9114',
  accentSoft: '#FFF9F2',
  primary: '#263427',
  onPrimary: '#FFFFFF',
  danger: '#D83B28',
  dangerBorder: '#FBE2DE',
  overlay: 'rgba(0,0,0,0.5)',
  iconBg: 'rgba(27, 40, 27, 0.06)',
  inputBg: '#F6F5EE',

  tabBarBg: '#F6F5EE',
  tabBarBorder: '#ECE9DF',
  tabBarActive: '#FF9114',
  tabBarInactive: '#7E8379',
  fabBg: '#1E3120',

  card: '#FFFFFF',
  cardBorder: '#EFECE2',
  waterCardBg: '#F2F8FA',
  waterCardBorder: '#D8EAF2',
  aiBannerBg: '#F4F7ED',
  aiBannerBorder: '#E2EBD5',
  tagBg: '#F3F2EB',
};

export const DARK_COLORS: AppColors = {
  background: '#121512',
  surface: '#1C211C',
  surfaceMuted: '#262C26',
  border: '#2B322B',
  divider: '#262C26',
  textPrimary: '#F2F4EE',
  textSecondary: '#A3AA9F',
  textMuted: '#7C837A',
  accent: '#FF9114',
  accentSoft: '#2A2013',
  primary: '#3F5A41',
  onPrimary: '#FFFFFF',
  danger: '#FF6B57',
  dangerBorder: '#4A2620',
  overlay: 'rgba(0,0,0,0.65)',
  iconBg: 'rgba(242, 244, 238, 0.08)',
  inputBg: '#262C26',

  tabBarBg: '#181C18',
  tabBarBorder: '#262C26',
  tabBarActive: '#FF9114',
  tabBarInactive: '#7C837A',
  fabBg: '#2E4B31',

  card: '#1C211C',
  cardBorder: '#2B322B',
  waterCardBg: '#162228',
  waterCardBorder: '#213742',
  aiBannerBg: '#1A261D',
  aiBannerBorder: '#283D2D',
  tagBg: '#262C26',
};
