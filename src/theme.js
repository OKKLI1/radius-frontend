// AxioRadius — Tema central
// Importa este archivo en todos los componentes: import { C, brand } from '../theme'

export const brand = {
  name: "AxioRadius",
  version: "1.0",
  tagline: "Panel de Administración RADIUS",
}

// Paleta de colores AxioRadius
// Fondo gris oscuro intermedio + Azul moderno
export const C = {
  // Fondos
  bg:        '#1a1d23',   // fondo principal — gris oscuro cálido
  surface:   '#22262f',   // tarjetas y paneles
  surface2:  '#2a2f3a',   // hover, inputs
  border:    '#353a47',   // bordes suaves

  // Acento principal — azul Linear/Tailwind
  accent:    '#4f8ef7',   // azul principal
  accentDim: '#4f8ef715', // azul muy transparente (backgrounds)
  accentMid: '#4f8ef740', // azul semitransparente

  // Texto
  text:      '#e8eaf0',   // texto principal — blanco cálido
  textSoft:  '#b0b7c3',   // texto secundario
  muted:     '#737a8c',   // texto apagado

  // Semánticos
  green:     '#34c48b',   // éxito / activo
  greenDim:  '#34c48b18',
  danger:    '#f0606a',   // error / peligro
  dangerDim: '#f0606a18',
  warn:      '#f5a623',   // advertencia
  warnDim:   '#f5a62318',
  blue:      '#60a5fa',   // info / secundario
  blueDim:   '#60a5fa18',
  purple:    '#a78bfa',   // especial

  // Gradientes
  gradientAccent: 'linear-gradient(135deg, #4f8ef7, #6366f1)',
  gradientCard:   'linear-gradient(135deg, #22262f, #2a2f3a)',
}

// Estilos reutilizables
export const inputStyle = {
  background:  C.surface2,
  border:      `1px solid ${C.border}`,
  color:       C.text,
  padding:     '9px 12px',
  borderRadius: 8,
  fontSize:    13,
  fontFamily:  "'Sora', sans-serif",
  width:       '100%',
  boxSizing:   'border-box',
  outline:     'none',
  transition:  'border-color 0.15s',
}

export const btnPrimary = {
  background:  C.accent,
  color:       '#fff',
  border:      'none',
  padding:     '9px 20px',
  borderRadius: 8,
  fontWeight:  700,
  fontSize:    13,
  cursor:      'pointer',
  fontFamily:  "'Sora', sans-serif",
  transition:  'opacity 0.15s',
}

export const btnSecondary = {
  background:  'transparent',
  color:       C.textSoft,
  border:      `1px solid ${C.border}`,
  padding:     '9px 20px',
  borderRadius: 8,
  fontSize:    13,
  cursor:      'pointer',
  fontFamily:  "'Sora', sans-serif",
}

export const btnDanger = {
  background:  C.dangerDim,
  color:       C.danger,
  border:      `1px solid ${C.danger}44`,
  padding:     '9px 20px',
  borderRadius: 8,
  fontSize:    13,
  cursor:      'pointer',
  fontFamily:  "'Sora', sans-serif",
}

export const btnSm = {
  background:  'transparent',
  color:       C.accent,
  border:      `1px solid ${C.accent}44`,
  padding:     '5px 12px',
  borderRadius: 6,
  fontSize:    12,
  cursor:      'pointer',
  fontFamily:  "'Sora', sans-serif",
}

export const card = {
  background:   C.surface,
  border:       `1px solid ${C.border}`,
  borderRadius: 12,
  padding:      '20px 24px',
}

export const th = {
  padding:         '10px 14px',
  textAlign:       'left',
  color:           C.muted,
  fontSize:        11,
  textTransform:   'uppercase',
  letterSpacing:   1,
  fontWeight:      600,
  borderBottom:    `1px solid ${C.border}`,
  whiteSpace:      'nowrap',
}

export const td = {
  padding: '10px 14px',
  color:   C.text,
}
