/**
 * NutraAI Design System Theme Tokens
 * Generated from document/designsystem.md & StitchMCP Design Tokens
 */

export const FONTS = {
  regular: 'Manrope_400Regular',
  medium: 'Manrope_500Medium',
  semiBold: 'Manrope_600SemiBold',
  bold: 'Manrope_700Bold',
  extraBold: 'Manrope_800ExtraBold',
} as const;

export const PALETTE = {
  // Core Brand Colors
  saffron: '#FF9114', // Primary CTA, highlights, calorie ring
  scarlet: '#F04B37', // Secondary accent, streak badges, alerts
  khaki: '#C8C29B',   // Muted backgrounds, secondary surfaces
  onyx: '#131313',    // Primary text, dark surfaces, bottom nav
  ivory: '#F4F2E7',   // App base background (warm minimalism)

  // Macro Semantic Colors (Synchronized across Home, Log, and Progress)
  green: '#7BC754',   // Macro: Carbs, success state
  yellow: '#F5A623',  // Macro: Fat, points/rewards
  blue: '#5D80E6',    // Macro: Protein, water intake

  // Neutral & Surfaces
  surfaceBase: '#F4F2E7',
  surfaceCard: '#FAF9F3',
  surfaceWhite: '#FFFFFF',
  surfaceDark: '#131313',
  surfaceContainerLow: '#F6F3F2',

  // Typography Colors
  textPrimary: '#131313',
  textSecondary: '#6B675A',
  textInverse: '#FFFFFF',
  textMuted: '#9B988D',

  // Borders & Dividers
  borderLight: 'rgba(19, 19, 19, 0.08)',
  borderMuted: 'rgba(19, 19, 19, 0.04)',
} as const;

export const MACRO_COLORS = {
  protein: '#5D80E6',
  carbs: '#7BC754',
  fat: '#F5A623',
  quickLog: '#9CA3AF',
  calories: PALETTE.saffron,
} as const;

export const SPACING = {
  xs: 4,     // space/1
  sm: 8,     // space/2
  md: 12,    // space/3
  lg: 16,    // space/4
  xl: 20,    // space/5
  xxl: 24,   // space/6
  screenMargin: 20,
} as const;

export const RADIUS = {
  sm: 12,    // Chips, small buttons
  md: 20,    // Cards
  lg: 28,    // Sheets, nav bar
  full: 999, // Pills, badges, circular buttons
} as const;

export const TYPOGRAPHY = {
  displayNumber: {
    fontFamily: FONTS.bold,
    fontSize: 36,
    lineHeight: 40,
    fontWeight: '700' as const,
  },
  h1: {
    fontFamily: FONTS.bold,
    fontSize: 22,
    lineHeight: 28,
    fontWeight: '700' as const,
  },
  h2: {
    fontFamily: FONTS.semiBold,
    fontSize: 18,
    lineHeight: 24,
    fontWeight: '600' as const,
  },
  body: {
    fontFamily: FONTS.medium,
    fontSize: 15,
    lineHeight: 20,
    fontWeight: '500' as const,
  },
  bodySecondary: {
    fontFamily: FONTS.regular,
    fontSize: 13,
    lineHeight: 18,
    fontWeight: '400' as const,
  },
  caption: {
    fontFamily: FONTS.medium,
    fontSize: 11,
    lineHeight: 14,
    fontWeight: '500' as const,
  },
} as const;

export const SHADOWS = {
  elevation1: {
    shadowColor: '#131313',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  elevation2: {
    shadowColor: '#131313',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.12,
    shadowRadius: 20,
    elevation: 4,
  },
  elevation3: {
    shadowColor: '#FF9114',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.25,
    shadowRadius: 24,
    elevation: 6,
  },
} as const;

export const theme = {
  fonts: FONTS,
  colors: PALETTE,
  macros: MACRO_COLORS,
  spacing: SPACING,
  radius: RADIUS,
  typography: TYPOGRAPHY,
  shadows: SHADOWS,
} as const;

export type Theme = typeof theme;
export default theme;
