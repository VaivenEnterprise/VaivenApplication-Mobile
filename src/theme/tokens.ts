import type { TextStyle, ViewStyle } from 'react-native';

export const colors = {
  primary: '#0F7B6C',
  primaryPressed: '#0B5F54',
  primarySoft: '#E3F2EF',
  terracotta: '#C45C3E',
  terracottaPressed: '#A3482F',
  terracottaSoft: '#F7E3DB',
  orange: '#F28C28',
  orangePressed: '#D87412',
  orangeSoft: '#FDEBD8',
  ink: '#0E3B43',
  muted: '#5B6B70',
  surface: '#FFFFFF',
  background: '#F5F8F8',
  border: '#D9E3E2',
  danger: '#B3261E',
  dangerSoft: '#F9E3E1',
  success: '#1E7B4F',
  successSoft: '#E2F3E9',
  warning: '#8A5A00',
  warningSoft: '#FFF1D6',
  onPrimary: '#FFFFFF',
  overlay: 'rgba(14, 59, 67, 0.08)',
} as const;

export const spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
} as const;

export const radius = {
  sm: 6,
  md: 12,
  lg: 20,
  xl: 28,
  pill: 999,
} as const;

export const typography = {
  display: { fontSize: 30, lineHeight: 36, fontWeight: '800' },
  title: { fontSize: 24, lineHeight: 30, fontWeight: '700' },
  subtitle: { fontSize: 18, lineHeight: 24, fontWeight: '600' },
  body: { fontSize: 16, lineHeight: 22, fontWeight: '400' },
  bodyBold: { fontSize: 16, lineHeight: 22, fontWeight: '700' },
  label: { fontSize: 14, lineHeight: 20, fontWeight: '600' },
  caption: { fontSize: 13, lineHeight: 18, fontWeight: '500' },
} satisfies Record<string, TextStyle>;

export const touch = {
  minSize: 44,
} as const;

export const sizes = {
  avatar: 56,
  fab: 56,
  icon: 24,
  iconLarge: 32,
  iconSmall: 16,
  iconXLarge: 48,
  mapHeight: 240,
  pin: 36,
} as const;

export const borders = {
  width: 1,
} as const;

export const shadows = {
  card: {
    elevation: 3,
    shadowColor: colors.ink,
    shadowOffset: { height: 6, width: 0 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
  },
  floating: {
    elevation: 6,
    shadowColor: colors.ink,
    shadowOffset: { height: 10, width: 0 },
    shadowOpacity: 0.12,
    shadowRadius: 18,
  },
} satisfies Record<string, ViewStyle>;

export const theme = {
  borders,
  colors,
  radius,
  shadows,
  sizes,
  spacing,
  touch,
  typography,
};
