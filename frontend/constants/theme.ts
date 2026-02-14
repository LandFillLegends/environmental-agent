// constants/theme.ts

export const COLORS = {
  primary: '#2D5F3F',
  primaryLight: '#3A7A52',
  primaryDark: '#1E4029',

  accent: '#7BC96F',
  accentLight: '#A8E6A0',
  warning: '#F4A261',
  error: '#E63946',
  success: '#06D6A0',

  recycle: '#2A9D8F',
  trash: '#6C757D',
  compost: '#8B5A3C',
  hazardous: '#E63946',
  donate: '#7B68EE',

  background: '#F8F9F5',
  surface: '#FFFFFF',
  surfaceDark: '#E8EBE4',
  text: '#1A2E1F',
  textSecondary: '#5A6B5D',
  textLight: '#8B9A8F',
  border: '#D4DDD6',

  overlay: 'rgba(29, 53, 37, 0.7)',
  overlayLight: 'rgba(29, 53, 37, 0.3)',
} as const;

export const SPACING = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
} as const;

export const TYPOGRAPHY = {
  fontFamily: {
    heading: 'System',
    body: 'System',
  },
  fontSize: {
    xs: 12,
    sm: 14,
    md: 16,
    lg: 18,
    xl: 24,
    xxl: 32,
    xxxl: 40,
  },
  fontWeight: {
    regular: '400' as const,
    medium: '500' as const,
    semibold: '600' as const,
    bold: '700' as const,
  },
};

export const SHADOWS = {
  sm: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  md: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 4,
  },
  lg: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 8,
  },
};

export const BORDER_RADIUS = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  round: 9999,
} as const;