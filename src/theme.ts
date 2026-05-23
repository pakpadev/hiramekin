export interface Theme {
  background: string
  surface: string
  textPrimary: string
  textBody: string
  textMuted: string
  accent: string
  danger: string
  border: string
  shimmerColors: readonly [string, string, string, string]
}

const dark: Theme = {
  background: '#09090b',
  surface: '#18181b',
  textPrimary: '#ffffff',
  textBody: '#e4e4e7',
  textMuted: '#a1a1aa',
  accent: '#00e5ff',
  danger: '#ff5a5f',
  border: '#3f3f46',
  shimmerColors: ['#09090b', '#00e5ff', '#b2f0ff', '#09090b'],
}

const light: Theme = {
  background: '#f7f8fa',
  surface: '#ffffff',
  textPrimary: '#111111',
  textBody: '#24292f',
  textMuted: '#5f6368',
  accent: '#00acc1',
  danger: '#c62828',
  border: '#cfd4dc',
  shimmerColors: ['#f7f8fa', '#00acc1', '#80deea', '#f7f8fa'],
}

export function getTheme(isDark: boolean): Theme {
  return isDark ? dark : light
}
