// AxioRadius theme core

export const brand = {
  name: 'AxioRadius',
  version: '1.0',
  tagline: 'Panel de Administracion RADIUS',
  logo: '/brand/axioradius-logo-full.svg',
  logoIcon: '/brand/axioradius-logo-icon.svg',
}

export const THEMES = {
  dark: {
    bg: '#1a1d23',
    surface: '#22262f',
    surface2: '#2a2f3a',
    border: '#353a47',
    accent: '#4f8ef7',
    accentDim: '#4f8ef715',
    accentMid: '#4f8ef740',
    text: '#e8eaf0',
    textSoft: '#b0b7c3',
    muted: '#737a8c',
    green: '#34c48b',
    greenDim: '#34c48b18',
    danger: '#f0606a',
    dangerDim: '#f0606a18',
    warn: '#f5a623',
    warnDim: '#f5a62318',
    blue: '#60a5fa',
    blueDim: '#60a5fa18',
    purple: '#a78bfa',
    gradientAccent: 'linear-gradient(135deg, #4f8ef7, #6366f1)',
    gradientCard: 'linear-gradient(135deg, #22262f, #2a2f3a)',
  },
  light: {
    bg: '#eef2f7',
    surface: '#ffffff',
    surface2: '#e9eef6',
    border: '#c5d0df',
    accent: '#2468d8',
    accentDim: '#2468d815',
    accentMid: '#2468d840',
    text: '#18212e',
    textSoft: '#3a485d',
    muted: '#4d5d74',
    green: '#1f9f6e',
    greenDim: '#1f9f6e15',
    danger: '#d64a57',
    dangerDim: '#d64a5715',
    warn: '#d18b18',
    warnDim: '#d18b1815',
    blue: '#2c76e6',
    blueDim: '#2c76e615',
    purple: '#7353d8',
    gradientAccent: 'linear-gradient(135deg, #2468d8, #2c76e6)',
    gradientCard: 'linear-gradient(135deg, #ffffff, #f4f7fc)',
  },
}

const initialMode =
  (typeof window !== 'undefined' && localStorage.getItem('theme_mode')) || 'dark'

export const C = { ...(THEMES[initialMode] || THEMES.dark) }

export const inputStyle = {
  background: C.surface2,
  border: `1px solid ${C.border}`,
  color: C.text,
  padding: '9px 12px',
  borderRadius: 10,
  fontSize: 13,
  fontFamily: "'Sora', sans-serif",
  width: '100%',
  boxSizing: 'border-box',
  outline: 'none',
  transition: 'border-color 0.15s',
}

export const btnPrimary = {
  background: C.accent,
  color: '#fff',
  border: 'none',
  padding: '9px 20px',
  borderRadius: 10,
  fontWeight: 700,
  fontSize: 13,
  cursor: 'pointer',
  fontFamily: "'Sora', sans-serif",
  transition: 'opacity 0.15s',
}

export const btnSecondary = {
  background: 'transparent',
  color: C.textSoft,
  border: `1px solid ${C.border}`,
  padding: '9px 20px',
  borderRadius: 10,
  fontSize: 13,
  cursor: 'pointer',
  fontFamily: "'Sora', sans-serif",
}

export const btnDanger = {
  background: C.dangerDim,
  color: C.danger,
  border: `1px solid ${C.danger}44`,
  padding: '9px 20px',
  borderRadius: 10,
  fontSize: 13,
  cursor: 'pointer',
  fontFamily: "'Sora', sans-serif",
}

export const btnSm = {
  background: 'transparent',
  color: C.accent,
  border: `1px solid ${C.accent}44`,
  padding: '5px 12px',
  borderRadius: 8,
  fontSize: 12,
  cursor: 'pointer',
  fontFamily: "'Sora', sans-serif",
}

export const card = {
  background: C.surface,
  border: `1px solid ${C.border}`,
  borderRadius: 16,
  padding: '20px 24px',
}

export const th = {
  padding: '10px 14px',
  textAlign: 'left',
  color: C.muted,
  fontSize: 11,
  textTransform: 'uppercase',
  letterSpacing: 1,
  fontWeight: 600,
  borderBottom: `1px solid ${C.border}`,
  whiteSpace: 'nowrap',
}

export const td = {
  padding: '10px 14px',
  color: C.text,
}

function syncSharedStyles() {
  inputStyle.background = C.surface2
  inputStyle.border = `1px solid ${C.border}`
  inputStyle.color = C.text

  btnPrimary.background = C.accent
  btnSecondary.color = C.textSoft
  btnSecondary.border = `1px solid ${C.border}`
  btnDanger.background = C.dangerDim
  btnDanger.color = C.danger
  btnDanger.border = `1px solid ${C.danger}44`
  btnSm.color = C.accent
  btnSm.border = `1px solid ${C.accent}44`

  card.background = C.surface
  card.border = `1px solid ${C.border}`
  th.color = C.muted
  th.borderBottom = `1px solid ${C.border}`
  td.color = C.text
}

export function applyTheme(mode = 'dark') {
  const palette = THEMES[mode] || THEMES.dark
  Object.assign(C, palette)
  syncSharedStyles()
  if (typeof document !== 'undefined') {
    document.body.style.background = C.bg
    document.body.style.color = C.text
    document.documentElement.style.setProperty('--ax-bg', C.bg)
    document.documentElement.style.setProperty('--ax-surface', C.surface)
    document.documentElement.style.setProperty('--ax-surface2', C.surface2)
    document.documentElement.style.setProperty('--ax-border', C.border)
    document.documentElement.style.setProperty('--ax-accent', C.accent)
    document.documentElement.style.setProperty('--ax-accent-dim', C.accentDim)
    document.documentElement.style.setProperty('--ax-text', C.text)
    document.documentElement.style.setProperty('--ax-muted', C.muted)
    document.documentElement.setAttribute('data-theme', mode)
  }
}
