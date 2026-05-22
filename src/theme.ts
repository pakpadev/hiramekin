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
  background: '#111111',
  surface: '#1a1a1a',
  textPrimary: '#ffffff',
  textBody: '#cccccc',
  textMuted: '#555555',
  accent: '#00e5ff',
  danger: '#ff4c4c',
  border: '#2a2a2a',
  shimmerColors: ['#111111', '#00e5ff', '#b2f0ff', '#111111'],
}

const light: Theme = {
  background: '#f5f5f5',
  surface: '#ffffff',
  textPrimary: '#111111',
  textBody: '#333333',
  textMuted: '#888888',
  accent: '#00acc1',
  danger: '#d32f2f',
  border: '#e0e0e0',
  shimmerColors: ['#f5f5f5', '#00acc1', '#80deea', '#f5f5f5'],
}

export function getTheme(isDark: boolean): Theme {
  return isDark ? dark : light
}
