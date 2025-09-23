export const tokens = {
  colors: {
    primary: '#5560FF',
    primaryAccent: '#846BFF',
    primaryTint: '#6EA8FF',
    surface: '#FFFFFF',
    surfaceAlt: '#F8F9FF',
    surfaceMuted: '#EEF1F6',
    textPrimary: '#1F2B5C',
    textSecondary: '#4B5BD7',
    textMuted: '#5C6B9B',
    info: '#2A5DE8',
    infoSoft: 'rgba(110, 168, 255, 0.20)',
    success: '#1F8A5C',
    successSoft: 'rgba(123, 227, 181, 0.25)',
    warning: '#A56A00',
    warningSoft: 'rgba(255, 214, 107, 0.25)',
    danger: '#C03647',
    dangerSoft: 'rgba(255, 137, 137, 0.25)',
    borderSubtle: 'rgba(85, 96, 255, 0.32)',
  },
  gradients: {
    primary: 'linear-gradient(135deg, #6EA8FF, #846BFF)',
    progress: 'linear-gradient(90deg, #6EA8FF, #23D3FF)',
  },
  radii: {
    pill: '999px',
    xl: '24px',
    lg: '18px',
    md: '12px',
    sm: '8px',
  },
  shadows: {
    none: 'none',
    sm: '0 2px 6px rgba(33, 41, 63, 0.08)',
    md: '0 8px 18px rgba(20, 41, 82, 0.12)',
    lg: '0 12px 24px rgba(18, 36, 99, 0.14)',
  },
  spacing: {
    xxs: '4px',
    xs: '8px',
    sm: '12px',
    md: '16px',
    lg: '20px',
    xl: '24px',
  },
  typography: {
    fontFamily: "'DM Sans', 'Inter', 'PingFang SC', 'Microsoft YaHei', sans-serif",
    sizes: {
      xs: '12px',
      sm: '14px',
      md: '16px',
      lg: '20px',
    },
    weights: {
      regular: 400,
      medium: 500,
      semibold: 600,
      bold: 700,
    },
  },
} as const;

export type DesignTokens = typeof tokens;
