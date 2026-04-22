import { NavLink, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { C, brand } from '../theme'

const NAV = [
  { to: '/',          icon: '⬡', label: 'Dashboard'          },
  { to: '/usuarios',  icon: '◈', label: 'Usuarios'            },
  { to: '/grupos',    icon: '◉', label: 'Grupos'              },
  { to: '/nas',       icon: '◎', label: 'Clientes NAS'        },
  { to: '/sesiones',  icon: '▣', label: 'Sesiones'            },
  { to: '/logs',      icon: '▤', label: 'Logs'                },
  { to: '/reportes',  icon: '▦', label: 'Reportes'            },
  { to: '/batch',     icon: '▥', label: 'Usuarios en Lote'    },
  { to: '/perfiles',  icon: '📶', label: 'Perfiles BW'        },
  { to: '/vouchers',  icon: '🎟', label: 'Vouchers'           },
  { to: '/config',    icon: '⚙', label: 'Configuración'       },
]

export default function Layout({ children }) {
  const { logout } = useAuth()
  const location = useLocation()

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: C.bg, fontFamily: "'Sora', sans-serif" }}>
      {/* Sidebar */}
      <aside style={styles.sidebar}>
        {/* Logo AxioRadius */}
        <div style={styles.logo}>
          <div style={styles.logoIcon}>
            <span style={{ fontSize: 18, lineHeight: 1 }}>⬡</span>
          </div>
          <div>
            <div style={styles.logoTitle}>{brand.name}</div>
            <div style={styles.logoSub}>{brand.tagline}</div>
          </div>
        </div>

        {/* Nav */}
        <nav style={{ flex: 1, overflowY: 'auto', padding: '8px 0' }}>
          {NAV.map(n => {
            const active = n.to === '/'
              ? location.pathname === '/'
              : location.pathname.startsWith(n.to)
            return (
              <NavLink key={n.to} to={n.to} style={{ textDecoration: 'none' }}>
                <div style={{
                  display: 'flex', alignItems: 'center', gap: 10,
                  padding: '10px 20px', fontSize: 13, fontWeight: active ? 600 : 400,
                  cursor: 'pointer', transition: 'all 0.15s',
                  background: active ? C.accentDim : 'transparent',
                  borderLeft: active ? `3px solid ${C.accent}` : '3px solid transparent',
                  color: active ? C.accent : C.muted,
                  borderRadius: '0 6px 6px 0',
                  marginRight: 8,
                }}>
                  <span style={{ fontSize: 14, width: 18, textAlign: 'center' }}>{n.icon}</span>
                  <span>{n.label}</span>
                </div>
              </NavLink>
            )
          })}
        </nav>

        {/* Footer */}
        <div style={styles.sideFooter}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '0 4px' }}>
            <div style={{ width: 8, height: 8, borderRadius: '50%', background: C.green, boxShadow: `0 0 6px ${C.green}`, flexShrink: 0 }} />
            <div>
              <div style={{ fontSize: 11, color: C.muted }}>API Backend</div>
              <div style={{ fontSize: 11, color: C.green, fontFamily: 'monospace' }}>:8080 activo</div>
            </div>
          </div>
          <button onClick={logout} style={{
            background: 'transparent', border: `1px solid ${C.border}`,
            color: C.muted, padding: '7px 12px', borderRadius: 7,
            fontSize: 12, cursor: 'pointer', fontFamily: "'Sora', sans-serif",
            width: '100%', marginTop: 8, transition: 'all 0.15s',
          }}>
            ⏻ Cerrar sesión
          </button>
        </div>
      </aside>

      {/* Main */}
      <main style={{ flex: 1, padding: '32px 36px', overflowY: 'auto', maxWidth: '100%' }}>
        {children}
      </main>
    </div>
  )
}

const styles = {
  sidebar: {
    width: 230,
    background: C.surface,
    borderRight: `1px solid ${C.border}`,
    display: 'flex',
    flexDirection: 'column',
    flexShrink: 0,
    position: 'sticky',
    top: 0,
    height: '100vh',
  },
  logo: {
    display: 'flex', alignItems: 'center', gap: 12,
    padding: '22px 20px 18px',
    borderBottom: `1px solid ${C.border}`,
  },
  logoIcon: {
    width: 36, height: 36, borderRadius: 10,
    background: C.gradientAccent,
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    color: '#fff', flexShrink: 0,
    boxShadow: `0 4px 12px ${C.accentMid}`,
  },
  logoTitle: {
    fontSize: 15, fontWeight: 700, color: C.text, letterSpacing: 0.5,
  },
  logoSub: {
    fontSize: 10, color: C.muted, marginTop: 1,
  },
  sideFooter: {
    padding: '14px 16px',
    borderTop: `1px solid ${C.border}`,
  },
}
