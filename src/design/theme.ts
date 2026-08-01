export const theme = {
  colors: {
    background: '#f4f7f1',
    surface: '#ffffff',
    surfaceAlt: '#f8faf8',
    text: '#0f172a',
    textMuted: '#64748b',
    border: '#e2e8f0',
    primary: '#22c55e',
    primaryDark: '#15803d',
    accent: '#facc15',
    accentDark: '#ca8a04',
    danger: '#ef4444',
    info: '#3b82f6',
    overlay: 'rgba(15, 23, 42, 0.45)',
    shadow: '#0f172a',
  },
  spacing: {
    xs: 8,
    sm: 12,
    md: 16,
    lg: 20,
    xl: 24,
    xxl: 32,
  },
  radius: {
    sm: 12,
    md: 16,
    lg: 20,
    xl: 24,
  },
  shadows: {
    card: {
      shadowColor: '#0f172a',
      shadowOpacity: 0.08,
      shadowRadius: 14,
      shadowOffset: { width: 0, height: 10 },
      elevation: 4,
    },
    elevated: {
      shadowColor: '#0f172a',
      shadowOpacity: 0.12,
      shadowRadius: 20,
      shadowOffset: { width: 0, height: 14 },
      elevation: 6,
    },
  },
  typography: {
    title: {
      fontSize: 28,
      fontWeight: '700' as const,
    },
    subtitle: {
      fontSize: 15,
      fontWeight: '500' as const,
    },
  },
};

export const heroGradient = ['#22c55e', '#facc15'] as const;

export type ButtonVariant = 'primary' | 'secondary' | 'accent' | 'danger' | 'neutral';

export const buttonVariant = (variant: ButtonVariant = 'primary') => {
  switch (variant) {
    case 'secondary':
      return {
        backgroundColor: theme.colors.surfaceAlt,
        borderColor: theme.colors.border,
      };
    case 'accent':
      return {
        backgroundColor: theme.colors.accent,
        borderColor: theme.colors.accentDark,
      };
    case 'danger':
      return {
        backgroundColor: theme.colors.danger,
        borderColor: theme.colors.danger,
      };
    case 'neutral':
      return {
        backgroundColor: '#e2e8f0',
        borderColor: '#cbd5e1',
      };
    case 'primary':
    default:
      return {
        backgroundColor: theme.colors.primary,
        borderColor: theme.colors.primaryDark,
      };
  }
};
