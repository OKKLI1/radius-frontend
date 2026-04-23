import { NavLink } from 'react-router-dom'
import { C } from '../theme'

const TABS = [
  { key: 'general', label: 'General', to: '/accounting/general' },
  { key: 'plans', label: 'Planes', to: '/accounting/plans' },
  { key: 'custom', label: 'Personalizado', to: '/accounting/custom' },
  { key: 'hotspot', label: 'Hotspot', to: '/accounting/hotspot' },
  { key: 'maintenance', label: 'Mantenimiento', to: '/accounting/maintenance' },
]

export function SectionTitle({ children }) {
  return (
    <div style={{ color: C.muted, fontSize: 12, letterSpacing: 1, textTransform: 'uppercase', fontWeight: 700, marginBottom: 10 }}>
      {children}
    </div>
  )
}

export function BlockTitle({ children }) {
  return (
    <div style={{ border: `1px solid ${C.border}`, background: C.surface2, color: C.text, borderRadius: 10, padding: '9px 12px', fontSize: 16 }}>
      {children}
    </div>
  )
}

export function Label({ children }) {
  return <div style={{ fontSize: 15, color: C.text, marginBottom: 6 }}>{children}</div>
}

export function Input({ placeholder }) {
  return (
    <input
      readOnly
      value=""
      placeholder={placeholder}
      style={{ width: '100%', boxSizing: 'border-box', background: C.bg, border: `1px solid ${C.border}`, color: C.textSoft, borderRadius: 10, padding: '9px 10px', fontSize: 13, marginBottom: 12 }}
    />
  )
}

export function ActionLink({ children }) {
  return <div style={{ color: C.accent, fontSize: 13, padding: '4px 0' }}>{children}</div>
}

export default function AccountingShell({ activeTab, sidebar, title, children }) {
  const styles = {
    topTabs: {
      display: 'flex',
      gap: 18,
      alignItems: 'center',
      borderBottom: `1px solid ${C.border}`,
      paddingBottom: 12,
      marginBottom: 10,
    },
    shell: {
      display: 'grid',
      gridTemplateColumns: '290px 1fr',
      minHeight: 0,
      border: `1px solid ${C.border}`,
      borderRadius: 16,
      overflow: 'hidden',
      background: C.surface,
    },
    sidebar: {
      background: C.surface2,
      borderRight: `1px solid ${C.border}`,
      padding: '16px 14px',
    },
    content: {
      padding: '18px 20px',
      background: C.surface,
    },
  }

  return (
    <div style={{ color: C.text }}>
      <div style={styles.topTabs}>
        {TABS.map((item) => (
          <NavLink key={item.key} to={item.to} style={{ textDecoration: 'none' }}>
            <div style={{ color: activeTab === item.key ? C.accent : C.text, fontSize: 13, borderBottom: activeTab === item.key ? `2px solid ${C.accent}` : '2px solid transparent', paddingBottom: 3 }}>
              {item.label}
            </div>
          </NavLink>
        ))}
      </div>

      <div style={styles.shell}>
        <aside style={styles.sidebar}>{sidebar}</aside>
        <section style={styles.content}>
          <h1 style={{ margin: 0, fontSize: 22, fontWeight: 700 }}>{title}</h1>
          <div style={{ marginTop: 16 }}>
            {children}
          </div>
        </section>
      </div>
    </div>
  )
}
