import { NavLink, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

const NAV = [
  { to: '/',          icon: '⬡', label: 'Dashboard'     },
  { to: '/usuarios',  icon: '◈', label: 'Usuarios'       },
  { to: '/grupos',    icon: '◉', label: 'Grupos'          },
  { to: '/nas',       icon: '◎', label: 'Clientes NAS'   },
  { to: '/sesiones',  icon: '▣', label: 'Sesiones'        },
  { to: '/logs',      icon: '▤', label: 'Logs'            },
  { to: '/reportes',  icon: '▦', label: 'Reportes'        },
]

const C = {
  bg: '#0d1117', surface: '#161b22', border: '#30363d',
  accent: '#00d4aa', text: '#e6edf3', muted: '#8b949e',
}

export default function Layout({ children }) {
  const { logout } = useAuth()
  const location = useLocation()

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: C.bg, fontFamily: "'Sora', sans-serif" }}>
      {/* Sidebar */}
      <aside style={styles.sidebar}>
        {/* Logo */}
        <div style={styles.logo}>
          <span style={styles.logoIcon}>⬡</span>
          <div>
            <div style={styles.logoTitle}>RADIUS</div>
            <div style={styles.logoSub}>Manager v1.0</div>
          </div>
        </div>

        {/* Nav */}
        <nav style={{ flex: 1 }}>
          {NAV.map(n => {
            const active = n.to === '/'
              ? location.pathname === '/'
              : location.pathname.startsWith(n.to)
            return (
              <NavLink key={n.to} to={n.to} style={{ textDecoration: 'none' }}>
                <div style={{
                  ...styles.navItem,
                  background: active ? `${C.accent}18` : 'transparent',
                  borderLeft: active ? `2px solid ${C.accent}` : '2px solid transparent',
                  color: active ? C.accent : C.muted,
                }}>
                  <span style={styles.navIcon}>{n.icon}</span>
                  <span>{n.label}</span>
                </div>
              </NavLink>
            )
          })}
        </nav>

        {/* Footer */}
        <div style={styles.sideFooter}>
          <div style={styles.serverStatus}>
            <span style={styles.dot} />
            <div>
              <div style={{ fontSize: 11, color: C.muted }}>Servidor</div>
              <div style={{ fontSize: 12, color: C.accent, fontFamily: 'monospace' }}>:8080 activo</div>
            </div>
          </div>
          <button onClick={logout} style={styles.logoutBtn}>
            ⏻ Salir
          </button>
        </div>
      </aside>

      {/* Main content */}
      <main style={styles.main}>
        {children}
      </main>
    </div>
  )
}

const styles = {
  sidebar: {
    width: 220, background: C.surface, borderRight: `1px solid ${C.border}`,
    display: 'flex', flexDirection: 'column', padding: '24px 0', flexShrink: 0,
    position: 'sticky', top: 0, height: '100vh',
  },
  logo: {
    display: 'flex', alignItems: 'center', gap: 12,
    padding: '0 20px 28px', borderBottom: `1px solid ${C.border}`, marginBottom: 12,
  },
  logoIcon: { fontSize: 28, color: C.accent, filter: `drop-shadow(0 0 8px ${C.accent})` },
  logoTitle: { fontSize: 16, fontWeight: 700, color: C.text, letterSpacing: 1 },
  logoSub: { fontSize: 10, color: C.muted, marginTop: 1 },
  navItem: {
    display: 'flex', alignItems: 'center', gap: 10,
    padding: '11px 22px', fontSize: 13, fontWeight: 500,
    transition: 'all 0.15s', cursor: 'pointer',
  },
  navIcon: { fontFamily: 'monospace', fontSize: 15, width: 18, textAlign: 'center' },
  sideFooter: {
    padding: '16px 20px 0', borderTop: `1px solid ${C.border}`,
    display: 'flex', flexDirection: 'column', gap: 12,
  },
  serverStatus: { display: 'flex', alignItems: 'center', gap: 10 },
  dot: {
    width: 8, height: 8, borderRadius: '50%', background: '#3fb950',
    boxShadow: '0 0 6px #3fb950', flexShrink: 0,
    animation: 'pulse 2s infinite',
  },
  logoutBtn: {
    background: 'transparent', border: `1px solid ${C.border}`,
    color: C.muted, padding: '7px 12px', borderRadius: 6,
    fontSize: 12, cursor: 'pointer', fontFamily: "'Sora', sans-serif",
    transition: 'all 0.15s',
  },
  main: { flex: 1, padding: '32px 36px', overflowY: 'auto', maxWidth: '100%' },
}
