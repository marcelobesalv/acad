export const ACCENTS = {
  yellow: '#F5C842',
  blue:   '#60A5FA',
  teal:   '#34D399',
  coral:  '#FB923C',
  purple: '#A78BFA',
};

const ACCENT_LIGHT = {
  yellow: '#856A02',
  blue:   '#1555C4',
  teal:   '#0D6B43',
  coral:  '#B83C00',
  purple: '#4C2DB8',
};

const DARK_BASE = {
  background:    '#0F0F0F',
  surface:       '#1A1A1A',
  surfaceAlt:    '#252525',
  text:          '#FFFFFF',
  textSecondary: '#9E9E9E',
  border:        '#2C2C2C',
  danger:        '#FF5252',
  onAccent:      '#000000',
};

const LIGHT_BASE = {
  background:    '#F2F2F7',
  surface:       '#FFFFFF',
  surfaceAlt:    '#E5E5EA',
  text:          '#1A1A1A',
  textSecondary: '#6C6C70',
  border:        '#D1D1D6',
  danger:        '#E53935',
  onAccent:      '#000000',
};

export function buildTheme(mode, accentKey) {
  const base      = mode === 'dark' ? DARK_BASE : LIGHT_BASE;
  const accentMap = mode === 'dark' ? ACCENTS : ACCENT_LIGHT;
  return { ...base, accent: accentMap[accentKey] ?? accentMap.blue };
}
