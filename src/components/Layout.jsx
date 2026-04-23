import { useEffect, useMemo, useState } from 'react'
import { NavLink, useLocation } from 'react-router-dom'
import { useAuth } from '../context/useAuth'
import { useTheme } from '../context/useTheme'
import { C, brand } from '../theme'

const HOME_NAV = [
  { to: '/', icon: 'home', label: 'Home', match: '/' },
  { to: '/config/general', icon: 'server', label: 'Server Status', match: '/config' },
  { to: '/logs', icon: 'logs', label: 'Logs', match: '/logs' },
]

const MANAGEMENT_NAV = [
  { to: '/usuarios', icon: 'users', label: 'Users' },
  { to: '/batch', icon: 'batch', label: 'Batch Users' },
  { to: '/hotspots', icon: 'wifi', label: 'Hotspots' },
  { to: '/nas', icon: 'router', label: 'Nas' },
  { to: '/user-groups', icon: 'group', label: 'User-Groups' },
  { to: '/grupos', icon: 'layers', label: 'Groups' },
  { to: '/perfiles', icon: 'profile', label: 'Profiles' },
  { to: '/hunt-groups', icon: 'target', label: 'HuntGroups' },
  { to: '/attributes', icon: 'sliders', label: 'Attributes' },
  { to: '/realm-proxy', icon: 'globe', label: 'Realm/Proxy' },
  { to: '/ip-pool', icon: 'pool', label: 'IP-Pool' },
]

const REPORTS_NAV = [
  { to: '/reportes/general', icon: 'chart', label: 'General' },
  { to: '/reportes/logs', icon: 'logs', label: 'Logs' },
  { to: '/reportes/status', icon: 'status', label: 'Status' },
  { to: '/reportes/batch', icon: 'batch', label: 'Batch Users' },
  { to: '/reportes/dashboard', icon: 'dashboard', label: 'Dashboard' },
]

const ACCOUNTING_NAV = [
  { to: '/accounting/general', icon: 'coins', label: 'General' },
  { to: '/accounting/plans', icon: 'list', label: 'Planes' },
  { to: '/accounting/custom', icon: 'sliders', label: 'Personalizado' },
  { to: '/accounting/hotspot', icon: 'wifi', label: 'Hotspot' },
  { to: '/accounting/maintenance', icon: 'tool', label: 'Mantenimiento' },
]

const MAIN_NAV = [
  { to: '/sesiones', icon: 'session', label: 'Sesiones' },
  { to: '/vouchers', icon: 'voucher', label: 'Vouchers' },
]

const SIDEBAR_STATE_KEY = 'axio_sidebar_state'

function MiniIcon({ name, active }) {
  const stroke = active ? C.accent : C.muted
  const common = { fill: 'none', stroke, strokeWidth: 1.8, strokeLinecap: 'round', strokeLinejoin: 'round' }

  const byName = {
    home: (<path {...common} d="M2.5 7.2 8 2.8l5.5 4.4V13h-4V9.6H6.5V13h-4z" />),
    server: (<><rect {...common} x="2.5" y="2.5" width="11" height="4" /><rect {...common} x="2.5" y="8.5" width="11" height="4" /><circle cx="4.5" cy="4.5" r="0.8" fill={stroke} /><circle cx="4.5" cy="10.5" r="0.8" fill={stroke} /></>),
    logs: (<><path {...common} d="M4 3h7l3 3v7H4z" /><path {...common} d="M11 3v3h3M6 8h5M6 10.5h5" /></>),
    users: (<><circle {...common} cx="6" cy="5" r="2.2" /><path {...common} d="M2.8 12.5c.6-2 2.1-3 3.2-3s2.6 1 3.2 3" /><circle {...common} cx="11.5" cy="5.8" r="1.5" /></>),
    batch: (<><rect {...common} x="2.5" y="3" width="11" height="3.2" /><rect {...common} x="2.5" y="8" width="11" height="3.2" /></>),
    wifi: (<><path {...common} d="M2.5 6.5a8.5 8.5 0 0 1 11 0" /><path {...common} d="M4.8 8.8a5.2 5.2 0 0 1 6.4 0" /><path {...common} d="M7 11a2 2 0 0 1 2 0" /><circle cx="8" cy="13" r="0.9" fill={stroke} /></>),
    router: (<><rect {...common} x="2.5" y="7.5" width="11" height="4.5" /><path {...common} d="M5 5.5a3 3 0 0 1 6 0" /><circle cx="5" cy="9.7" r="0.8" fill={stroke} /></>),
    group: (<><circle {...common} cx="5" cy="5" r="1.8" /><circle {...common} cx="10.8" cy="5.8" r="1.5" /><path {...common} d="M2.5 12c.5-1.8 1.8-2.7 2.8-2.7s2.3.9 2.8 2.7M9 12c.3-1 1-1.6 1.8-1.6s1.4.6 1.7 1.6" /></>),
    layers: (<><path {...common} d="m8 2.8 5.5 2.8L8 8.4 2.5 5.6z" /><path {...common} d="m2.5 8.2 5.5 2.8 5.5-2.8" /></>),
    profile: (<><circle {...common} cx="8" cy="5" r="2.4" /><rect {...common} x="4" y="8.8" width="8" height="4.2" rx="2" /></>),
    target: (<><circle {...common} cx="8" cy="8" r="5.2" /><circle {...common} cx="8" cy="8" r="2.6" /><circle cx="8" cy="8" r="0.9" fill={stroke} /></>),
    sliders: (<><path {...common} d="M3 4.5h10M3 8h10M3 11.5h10" /><circle cx="6" cy="4.5" r="1.1" fill={stroke} /><circle cx="10" cy="8" r="1.1" fill={stroke} /><circle cx="5" cy="11.5" r="1.1" fill={stroke} /></>),
    globe: (<><circle {...common} cx="8" cy="8" r="5.2" /><path {...common} d="M2.8 8h10.4M8 2.8c1.6 1.5 1.6 8.9 0 10.4M8 2.8c-1.6 1.5-1.6 8.9 0 10.4" /></>),
    pool: (<><path {...common} d="M2.5 6.5h11M2.5 9.5c1 0 1 1 2 1s1-1 2-1 1 1 2 1 1-1 2-1 1 1 2 1" /></>),
    chart: (<><path {...common} d="M3 12.5h10.5M4.2 10V7.5M7.4 10V5.5M10.6 10V3.8" /></>),
    status: (<><circle {...common} cx="8" cy="8" r="5.2" /><path {...common} d="M8 8 11 6.3" /></>),
    dashboard: (<><rect {...common} x="2.5" y="2.8" width="4.8" height="4.8" /><rect {...common} x="8.7" y="2.8" width="4.8" height="2.8" /><rect {...common} x="8.7" y="7" width="4.8" height="5" /><rect {...common} x="2.5" y="8.8" width="4.8" height="3.2" /></>),
    coins: (<><ellipse {...common} cx="6.2" cy="4.6" rx="3" ry="1.5" /><path {...common} d="M3.2 4.6v4c0 .8 1.3 1.5 3 1.5s3-.7 3-1.5v-4" /><path {...common} d="M9.2 6.2c.5-.2 1-.3 1.6-.3 1.5 0 2.7.6 2.7 1.4v3.2c0 .8-1.2 1.4-2.7 1.4" /></>),
    list: (<><path {...common} d="M5.5 4h8M5.5 8h8M5.5 12h8" /><circle cx="3.3" cy="4" r="0.9" fill={stroke} /><circle cx="3.3" cy="8" r="0.9" fill={stroke} /><circle cx="3.3" cy="12" r="0.9" fill={stroke} /></>),
    tool: (<><path {...common} d="M5 3.2a2.4 2.4 0 0 0 3.2 3.2l4.1 4.1-1.2 1.2-4.1-4.1A2.4 2.4 0 0 0 3.8 4z" /></>),
    session: (<><circle {...common} cx="8" cy="8" r="5.2" /><path {...common} d="M8 5.2v3.2l2 1.2" /></>),
    voucher: (<><rect {...common} x="2.5" y="4" width="11" height="8" rx="1.6" /><path {...common} d="M6.2 4v8M9.8 7h1.8" /></>),
  }

  return (
    <svg width="14" height="14" viewBox="0 0 16 16" aria-hidden="true">
      {byName[name] || <circle cx="8" cy="8" r="5" {...common} />}
    </svg>
  )
}

function isActivePath(pathname, item) {
  if (item.match === '/') return pathname === '/'
  return pathname.startsWith(item.match || item.to)
}

function NavItem({ item, active, compact = false }) {
  return (
    <NavLink to={item.to} style={{ textDecoration: 'none' }}>
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 10,
          padding: compact ? '8px 16px 8px 28px' : '10px 16px',
          fontSize: compact ? 12 : 13,
          fontWeight: active ? 600 : 400,
          cursor: 'pointer',
          transition: 'all 0.15s',
          background: active ? C.accentDim : 'transparent',
          borderLeft: active ? `3px solid ${C.accent}` : '3px solid transparent',
          color: active ? C.accent : C.muted,
          borderRadius: '0 10px 10px 0',
          marginRight: 8,
        }}
      >
        <span
          style={{
            fontSize: 10,
            width: 20,
            height: 20,
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            border: `1px solid ${active ? C.accent : C.border}`,
            color: active ? C.accent : C.muted,
            fontWeight: 700,
            flexShrink: 0,
            borderRadius: 8,
          }}
        >
          <MiniIcon name={item.icon} active={active} />
        </span>
        <span>{item.label}</span>
      </div>
    </NavLink>
  )
}

function SectionToggle({ label, icon, active, open, onToggle }) {
  return (
    <button
      onClick={onToggle}
      style={{
        width: 'calc(100% - 8px)',
        marginRight: 8,
        textAlign: 'left',
        background: active ? C.accentDim : 'transparent',
        color: active ? C.accent : C.textSoft,
        border: 'none',
        borderLeft: active ? `3px solid ${C.accent}` : '3px solid transparent',
        borderRadius: '0 10px 10px 0',
        padding: '10px 16px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        cursor: 'pointer',
        fontFamily: "'Sora', sans-serif",
        fontSize: 13,
        fontWeight: 600,
      }}
    >
      <span style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <span
          style={{
            fontSize: 10,
            width: 20,
            height: 20,
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            border: `1px solid ${active ? C.accent : C.border}`,
            color: active ? C.accent : C.muted,
            fontWeight: 700,
            flexShrink: 0,
            borderRadius: 8,
          }}
        >
          <MiniIcon name={icon} active={active} />
        </span>
        <span>{label}</span>
      </span>
      <span style={{ color: C.muted, fontSize: 12 }}>{open ? 'v' : '>'}</span>
    </button>
  )
}

export default function Layout({ children }) {
  const { logout } = useAuth()
  const { isDark, toggleTheme } = useTheme()
  const location = useLocation()

  const homeActive = useMemo(
    () => HOME_NAV.some((item) => isActivePath(location.pathname, item)),
    [location.pathname]
  )
  const managementActive = useMemo(
    () => MANAGEMENT_NAV.some((item) => location.pathname.startsWith(item.to)),
    [location.pathname]
  )
  const reportsActive = useMemo(
    () => REPORTS_NAV.some((item) => location.pathname.startsWith(item.to)),
    [location.pathname]
  )
  const accountingActive = useMemo(
    () => ACCOUNTING_NAV.some((item) => location.pathname.startsWith(item.to)),
    [location.pathname]
  )

  const [homeOpen, setHomeOpen] = useState(() => {
    const saved = localStorage.getItem(SIDEBAR_STATE_KEY)
    if (!saved) return homeActive
    try {
      const parsed = JSON.parse(saved)
      return parsed.homeOpen ?? homeActive
    } catch {
      return homeActive
    }
  })
  const [managementOpen, setManagementOpen] = useState(() => {
    const saved = localStorage.getItem(SIDEBAR_STATE_KEY)
    if (!saved) return managementActive
    try {
      const parsed = JSON.parse(saved)
      return parsed.managementOpen ?? managementActive
    } catch {
      return managementActive
    }
  })
  const [reportsOpen, setReportsOpen] = useState(() => {
    const saved = localStorage.getItem(SIDEBAR_STATE_KEY)
    if (!saved) return reportsActive
    try {
      const parsed = JSON.parse(saved)
      return parsed.reportsOpen ?? reportsActive
    } catch {
      return reportsActive
    }
  })
  const [accountingOpen, setAccountingOpen] = useState(() => {
    const saved = localStorage.getItem(SIDEBAR_STATE_KEY)
    if (!saved) return accountingActive
    try {
      const parsed = JSON.parse(saved)
      return parsed.accountingOpen ?? accountingActive
    } catch {
      return accountingActive
    }
  })

  useEffect(() => {
    localStorage.setItem(
      SIDEBAR_STATE_KEY,
      JSON.stringify({
        homeOpen,
        managementOpen,
        reportsOpen,
        accountingOpen,
      })
    )
  }, [homeOpen, managementOpen, reportsOpen, accountingOpen])

  useEffect(() => {
    if (location.pathname !== '/login') {
      localStorage.setItem('axio_last_route', `${location.pathname}${location.search}${location.hash}`)
    }
  }, [location.pathname, location.search, location.hash])

  useEffect(() => {
    if (homeActive) setHomeOpen(true)
  }, [homeActive])

  useEffect(() => {
    if (managementActive) setManagementOpen(true)
  }, [managementActive])

  useEffect(() => {
    if (reportsActive) setReportsOpen(true)
  }, [reportsActive])

  useEffect(() => {
    if (accountingActive) setAccountingOpen(true)
  }, [accountingActive])

  const styles = {
    sidebar: {
      width: 258,
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
    logoImage: {
      width: 52,
      height: 52,
      objectFit: 'contain',
      flexShrink: 0,
      filter: 'drop-shadow(0 4px 10px rgba(0,0,0,0.25))',
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

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: C.bg, fontFamily: "'Sora', sans-serif" }}>
      <aside style={styles.sidebar}>
        <div style={styles.logo}>
          <img src={brand.logoIcon || brand.logo} alt={brand.name} style={styles.logoImage} />
          <div>
            <div style={styles.logoTitle}>{brand.name}</div>
            <div style={styles.logoSub}>{brand.tagline}</div>
          </div>
        </div>

        <nav style={{ flex: 1, overflowY: 'auto', padding: '8px 0' }}>
          <SectionToggle
            label="Inicio"
            icon="home"
            active={homeActive}
            open={homeOpen}
            onToggle={() => setHomeOpen((prev) => !prev)}
          />

          {homeOpen && (
            <div style={{ borderLeft: `1px dashed ${C.border}`, marginLeft: 26, marginTop: 4 }}>
              {HOME_NAV.map((item) => {
                const active = isActivePath(location.pathname, item)
                return <NavItem key={`${item.to}-${item.label}`} item={item} active={active} compact />
              })}
            </div>
          )}

          <SectionToggle
            label="Gestion"
            icon="layers"
            active={managementActive}
            open={managementOpen}
            onToggle={() => setManagementOpen((prev) => !prev)}
          />

          {managementOpen && (
            <div style={{ borderLeft: `1px dashed ${C.border}`, marginLeft: 26, marginTop: 4 }}>
              {MANAGEMENT_NAV.map((item) => {
                const active = location.pathname.startsWith(item.to)
                return <NavItem key={item.to} item={item} active={active} compact />
              })}
            </div>
          )}

          <SectionToggle
            label="Reportes"
            icon="chart"
            active={reportsActive}
            open={reportsOpen}
            onToggle={() => setReportsOpen((prev) => !prev)}
          />

          {reportsOpen && (
            <div style={{ borderLeft: `1px dashed ${C.border}`, marginLeft: 26, marginTop: 4 }}>
              {REPORTS_NAV.map((item) => {
                const active = location.pathname.startsWith(item.to)
                return <NavItem key={item.to} item={item} active={active} compact />
              })}
            </div>
          )}

          <SectionToggle
            label="Contabilidad"
            icon="coins"
            active={accountingActive}
            open={accountingOpen}
            onToggle={() => setAccountingOpen((prev) => !prev)}
          />

          {accountingOpen && (
            <div style={{ borderLeft: `1px dashed ${C.border}`, marginLeft: 26, marginTop: 4 }}>
              {ACCOUNTING_NAV.map((item) => {
                const active = location.pathname.startsWith(item.to)
                return <NavItem key={item.to} item={item} active={active} compact />
              })}
            </div>
          )}

          {MAIN_NAV.map((item) => {
            const active = location.pathname.startsWith(item.to)
            return <NavItem key={item.to} item={item} active={active} />
          })}
        </nav>

        <div style={styles.sideFooter}>
          <button
            onClick={toggleTheme}
            style={{
              background: C.surface2,
              border: `1px solid ${C.border}`,
              color: C.text,
              padding: '7px 12px',
              borderRadius: 10,
              fontSize: 12,
              cursor: 'pointer',
              fontFamily: "'Sora', sans-serif",
              width: '100%',
              marginBottom: 8,
            }}
          >
            {isDark ? 'Modo Claro' : 'Modo Oscuro'}
          </button>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '0 4px' }}>
            <div style={{ width: 8, height: 8, borderRadius: '50%', background: C.green, boxShadow: `0 0 6px ${C.green}`, flexShrink: 0 }} />
            <div>
              <div style={{ fontSize: 11, color: C.muted }}>API Backend</div>
              <div style={{ fontSize: 11, color: C.green, fontFamily: 'monospace' }}>:8080 activo</div>
            </div>
          </div>
          <button
            onClick={logout}
            style={{
              background: 'transparent',
              border: `1px solid ${C.border}`,
              color: C.muted,
              padding: '7px 12px',
              borderRadius: 10,
              fontSize: 12,
              cursor: 'pointer',
              fontFamily: "'Sora', sans-serif",
              width: '100%',
              marginTop: 8,
              transition: 'all 0.15s',
            }}
          >
            Cerrar sesion
          </button>
        </div>
      </aside>

      <main style={{ flex: 1, padding: '32px 36px', overflowY: 'auto', maxWidth: '100%' }}>
        {children}
      </main>
    </div>
  )
}
