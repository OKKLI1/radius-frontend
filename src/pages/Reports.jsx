import { useCallback, useEffect, useMemo, useState } from 'react'
import { NavLink, useLocation } from 'react-router-dom'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, PieChart, Pie, Cell } from 'recharts'
import api from '../api/client'
import { useTheme } from '../context/useTheme'
import { C } from '../theme'

const REPORT_TABS = [
  { key: 'general', label: 'General', to: '/reportes/general' },
  { key: 'logs', label: 'Logs', to: '/reportes/logs' },
  { key: 'status', label: 'Status', to: '/reportes/status' },
  { key: 'batch', label: 'Batch Users', to: '/reportes/batch' },
  { key: 'dashboard', label: 'Dashboard', to: '/reportes/dashboard' },
]

function formatBytes(bytes) {
  const b = Number(bytes || 0)
  if (b < 1024) return `${b} B`
  if (b < 1024 ** 2) return `${(b / 1024).toFixed(1)} KB`
  if (b < 1024 ** 3) return `${(b / 1024 ** 2).toFixed(1)} MB`
  return `${(b / 1024 ** 3).toFixed(2)} GB`
}

function fmtDate(value) {
  if (!value) return '-'
  return String(value).slice(0, 19).replace('T', ' ')
}

function SideTitle({ children }) {
  return <h2 style={{ margin: '0 0 18px', fontSize: 22, fontWeight: 700 }}>{children}</h2>
}

function SectionTitle({ children }) {
  return <div style={{ color: C.muted, fontSize: 12, letterSpacing: 1, textTransform: 'uppercase', fontWeight: 700, marginBottom: 10 }}>{children}</div>
}

function BlockTitle({ children }) {
  return <div style={{ border: `1px solid ${C.border}`, background: C.surface2, color: C.text, borderRadius: 8, padding: '9px 12px', fontSize: 16, marginBottom: 10 }}>{children}</div>
}

function Label({ children }) {
  return <div style={{ fontSize: 13, color: C.text, marginBottom: 6 }}>{children}</div>
}

export default function Reports() {
  useTheme()
  const location = useLocation()
  const COLORS = [C.accent, C.green, C.warn, '#58a6ff', '#bc8cff', '#ff7b72']

  const tab = useMemo(() => {
    if (location.pathname.endsWith('/logs')) return 'logs'
    if (location.pathname.endsWith('/status')) return 'status'
    if (location.pathname.endsWith('/batch')) return 'batch'
    if (location.pathname.endsWith('/dashboard')) return 'dashboard'
    return 'general'
  }, [location.pathname])

  const [days, setDays] = useState(30)
  const [traffic, setTraffic] = useState([])
  const [topUsers, setTopUsers] = useState([])
  const [byNas, setByNas] = useState([])
  const [loadingGeneral, setLoadingGeneral] = useState(false)
  const [generalError, setGeneralError] = useState('')

  const [logsFilters, setLogsFilters] = useState({ username: '', reply: '', limit: 100 })
  const [logsRows, setLogsRows] = useState([])
  const [logsStats, setLogsStats] = useState(null)
  const [loadingLogs, setLoadingLogs] = useState(false)
  const [logsError, setLogsError] = useState('')

  const [statusData, setStatusData] = useState(null)
  const [loadingStatus, setLoadingStatus] = useState(false)
  const [statusError, setStatusError] = useState('')

  const [batchFilters, setBatchFilters] = useState({ batch_name: '', limit: 20 })
  const [batchData, setBatchData] = useState(null)
  const [loadingBatch, setLoadingBatch] = useState(false)
  const [batchError, setBatchError] = useState('')

  const [dashboard, setDashboard] = useState(null)
  const [loadingDashboard, setLoadingDashboard] = useState(false)
  const [dashboardError, setDashboardError] = useState('')

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
    title: {
      margin: '0 0 16px',
      fontSize: 22,
      fontWeight: 700,
    },
    input: {
      width: '100%',
      boxSizing: 'border-box',
      background: C.bg,
      border: `1px solid ${C.border}`,
      color: C.text,
      borderRadius: 10,
      padding: '9px 10px',
      fontSize: 13,
      marginBottom: 12,
    },
    btn: {
      width: '100%',
      background: C.accent,
      color: '#000',
      border: 'none',
      borderRadius: 10,
      padding: '9px 10px',
      fontWeight: 700,
      cursor: 'pointer',
      fontFamily: "'Sora', sans-serif",
    },
    card: {
      background: C.surface,
      border: `1px solid ${C.border}`,
      borderRadius: 16,
      padding: '16px 18px',
    },
    cardTitle: {
      fontSize: 13,
      fontWeight: 600,
      color: C.muted,
      marginBottom: 12,
      textTransform: 'uppercase',
      letterSpacing: 1,
    },
    kpis: {
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))',
      gap: 10,
    },
    kpi: {
      background: C.surface,
      border: `1px solid ${C.border}`,
      borderRadius: 14,
      padding: '10px 12px',
      display: 'flex',
      flexDirection: 'column',
      gap: 6,
      color: C.text,
      fontSize: 12,
    },
    muted: {
      color: C.muted,
      fontSize: 13,
    },
    error: {
      marginBottom: 12,
      background: `${C.danger}22`,
      border: `1px solid ${C.danger}44`,
      color: C.danger,
      padding: '8px 10px',
      borderRadius: 7,
      fontSize: 13,
    },
    tableWrap: {
      overflow: 'auto',
      border: `1px solid ${C.border}`,
      borderRadius: 14,
    },
    table: {
      width: '100%',
      borderCollapse: 'collapse',
      fontSize: 12,
    },
    th: {
      textAlign: 'left',
      padding: '8px 10px',
      color: C.muted,
      borderBottom: `1px solid ${C.border}`,
      whiteSpace: 'nowrap',
    },
    td: {
      padding: '8px 10px',
      color: C.text,
      whiteSpace: 'nowrap',
    },
    grid2: {
      display: 'grid',
      gridTemplateColumns: '1fr 1fr',
      gap: 8,
    },
    item: {
      fontSize: 13,
      color: C.text,
      background: C.bg,
      border: `1px solid ${C.border}`,
      borderRadius: 12,
      padding: '8px 10px',
    },
  }

  const loadGeneral = useCallback(async () => {
    setLoadingGeneral(true)
    setGeneralError('')
    try {
      const [t, u, n] = await Promise.all([
        api.get(`/reports/traffic/daily?days=${days}`),
        api.get(`/reports/top-users?days=${days}&limit=10`),
        api.get(`/reports/by-nas?days=${days}`),
      ])
      setTraffic(t.data.map((d) => ({
        fecha: d.date?.slice(5),
        GB: +((d.total_bytes || 0) / 1e9).toFixed(2),
        sesiones: d.sessions || 0,
      })))
      setTopUsers(u.data.map((item) => ({ ...item, GB: +((item.total_bytes || 0) / 1e9).toFixed(2) })))
      setByNas(n.data.map((item) => ({ name: item.shortname || item.nasipaddress, GB: +((item.total_bytes || 0) / 1e9).toFixed(2) })))
    } catch (e) {
      setGeneralError(e.response?.data?.detail || 'Error cargando reportes generales')
    } finally {
      setLoadingGeneral(false)
    }
  }, [days])

  const loadLogs = useCallback(async () => {
    setLoadingLogs(true)
    setLogsError('')
    try {
      const params = { limit: Number(logsFilters.limit) || 100 }
      if (logsFilters.username) params.username = logsFilters.username
      if (logsFilters.reply) params.reply = logsFilters.reply
      const [rows, stats] = await Promise.all([
        api.get('/logs/auth', { params }),
        api.get('/logs/auth/stats'),
      ])
      setLogsRows(rows.data || [])
      setLogsStats(stats.data)
    } catch (e) {
      setLogsError(e.response?.data?.detail || 'Error cargando logs')
    } finally {
      setLoadingLogs(false)
    }
  }, [logsFilters.limit, logsFilters.reply, logsFilters.username])

  const loadStatus = useCallback(async () => {
    setLoadingStatus(true)
    setStatusError('')
    try {
      const { data } = await api.get('/config/server')
      setStatusData(data)
    } catch (e) {
      setStatusError(e.response?.data?.detail || 'Error cargando estado del servidor')
    } finally {
      setLoadingStatus(false)
    }
  }, [])

  const loadBatch = useCallback(async () => {
    setLoadingBatch(true)
    setBatchError('')
    try {
      const { data } = await api.get('/reports/batch/summary', {
        params: {
          batch_name: batchFilters.batch_name || undefined,
          limit: Number(batchFilters.limit) || 20,
        },
      })
      setBatchData(data)
    } catch (e) {
      setBatchError(e.response?.data?.detail || 'Error cargando reporte batch')
    } finally {
      setLoadingBatch(false)
    }
  }, [batchFilters.batch_name, batchFilters.limit])

  const loadDashboard = useCallback(async () => {
    setLoadingDashboard(true)
    setDashboardError('')
    try {
      const { data } = await api.get('/reports/dashboard')
      setDashboard(data)
    } catch (e) {
      setDashboardError(e.response?.data?.detail || 'Error cargando dashboard')
    } finally {
      setLoadingDashboard(false)
    }
  }, [])

  useEffect(() => {
    if (tab === 'general') loadGeneral()
  }, [tab, loadGeneral])

  useEffect(() => {
    if (tab === 'logs') loadLogs()
  }, [tab, loadLogs])

  useEffect(() => {
    if (tab === 'status') loadStatus()
  }, [tab, loadStatus])

  useEffect(() => {
    if (tab === 'batch') loadBatch()
  }, [tab, loadBatch])

  useEffect(() => {
    if (tab === 'dashboard') loadDashboard()
  }, [tab, loadDashboard])

  const sidebar = (() => {
    if (tab === 'general') {
      return (
        <>
          <SideTitle>Reports</SideTitle>
          <SectionTitle>Filtros</SectionTitle>
          <BlockTitle>Trafico y Consumo</BlockTitle>
          <Label>Rango de dias</Label>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 12 }}>
            {[7, 14, 30, 90].map((d) => (
              <button key={d} onClick={() => setDays(d)} style={{ ...styles.btn, background: days === d ? C.accent : C.surface2, color: days === d ? '#000' : C.text }}>
                {d} dias
              </button>
            ))}
          </div>
          <button onClick={loadGeneral} style={styles.btn}>Actualizar</button>
        </>
      )
    }

    if (tab === 'logs') {
      return (
        <>
          <SideTitle>Logs</SideTitle>
          <SectionTitle>Autenticacion</SectionTitle>
          <BlockTitle>Buscar Eventos</BlockTitle>
          <Label>Usuario</Label>
          <input style={styles.input} value={logsFilters.username} onChange={(e) => setLogsFilters((p) => ({ ...p, username: e.target.value }))} placeholder="Nombre de usuario" />
          <Label>Respuesta</Label>
          <select style={styles.input} value={logsFilters.reply} onChange={(e) => setLogsFilters((p) => ({ ...p, reply: e.target.value }))}>
            <option value="">Todas</option>
            <option value="Access-Accept">Access-Accept</option>
            <option value="Access-Reject">Access-Reject</option>
          </select>
          <Label>Limite</Label>
          <input style={styles.input} type="number" min={1} max={1000} value={logsFilters.limit} onChange={(e) => setLogsFilters((p) => ({ ...p, limit: e.target.value }))} />
          <button onClick={loadLogs} style={styles.btn}>Consultar Logs</button>
        </>
      )
    }

    if (tab === 'status') {
      return (
        <>
          <SideTitle>Status</SideTitle>
          <SectionTitle>Servidor</SectionTitle>
          <BlockTitle>Estado General</BlockTitle>
          <button onClick={loadStatus} style={styles.btn}>Actualizar Estado</button>
        </>
      )
    }

    if (tab === 'batch') {
      return (
        <>
          <SideTitle>Batch Users</SideTitle>
          <SectionTitle>Listado</SectionTitle>
          <BlockTitle>Filtro por Prefijo</BlockTitle>
          <Label>Nombre batch (prefijo)</Label>
          <input style={styles.input} value={batchFilters.batch_name} onChange={(e) => setBatchFilters((p) => ({ ...p, batch_name: e.target.value }))} placeholder="Ej: BATCH-ABR-" />
          <Label>Registros</Label>
          <input style={styles.input} type="number" min={1} max={200} value={batchFilters.limit} onChange={(e) => setBatchFilters((p) => ({ ...p, limit: e.target.value }))} />
          <button onClick={loadBatch} style={styles.btn}>Consultar Batch</button>
        </>
      )
    }

    return (
      <>
        <SideTitle>Dashboard</SideTitle>
        <SectionTitle>Heartbeat</SectionTitle>
        <BlockTitle>Metricas en Tiempo Real</BlockTitle>
        <button onClick={loadDashboard} style={styles.btn}>Actualizar Dashboard</button>
      </>
    )
  })()

  const content = (() => {
    if (tab === 'general') {
      if (loadingGeneral) return <div style={styles.muted}>Cargando reportes...</div>
      if (generalError) return <div style={styles.error}>{generalError}</div>
      return (
        <>
          <h1 style={styles.title}>Reports Page</h1>
          <div style={styles.card}>
            <div style={styles.cardTitle}>Traffic Daily (GB) - ultimos {days} dias</div>
            {traffic.length > 0 ? (
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={traffic}>
                  <CartesianGrid stroke={C.border} strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="fecha" tick={{ fill: C.muted, fontSize: 11 }} />
                  <YAxis tick={{ fill: C.muted, fontSize: 11 }} />
                  <Tooltip contentStyle={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 8, color: C.text }} />
                  <Bar dataKey="GB" fill={C.accent} radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : <div style={styles.muted}>Sin datos para este periodo</div>}
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, marginTop: 20 }}>
            <div style={styles.card}>
              <div style={styles.cardTitle}>Top users</div>
              {topUsers.length === 0 ? <div style={styles.muted}>No data</div> : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {topUsers.map((u, i) => (
                    <div key={`${u.username}-${i}`} style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                      <span style={{ color: C.muted, fontSize: 12, width: 18 }}>#{i + 1}</span>
                      <span style={{ color: C.accent, fontFamily: 'monospace', flex: 1 }}>{u.username}</span>
                      <span style={{ color: C.text, fontSize: 12 }}>{u.GB} GB</span>
                      <span style={{ color: C.muted, fontSize: 12 }}>{u.sessions} ses.</span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div style={styles.card}>
              <div style={styles.cardTitle}>By NAS</div>
              {byNas.length === 0 ? <div style={styles.muted}>No data</div> : (
                <ResponsiveContainer width="100%" height={200}>
                  <PieChart>
                    <Pie data={byNas} dataKey="GB" nameKey="name" cx="50%" cy="50%" outerRadius={70} label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`} labelLine={false} fontSize={11}>
                      {byNas.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                    </Pie>
                    <Tooltip contentStyle={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 8 }} formatter={(v) => [`${v} GB`]} />
                  </PieChart>
                </ResponsiveContainer>
              )}
            </div>
          </div>
        </>
      )
    }

    if (tab === 'logs') {
      if (loadingLogs) return <div style={styles.muted}>Cargando logs...</div>
      return (
        <>
          <h1 style={styles.title}>Logs de Autenticacion</h1>
          {logsError && <div style={styles.error}>{logsError}</div>}

          {logsStats && (
            <div style={styles.kpis}>
              <div style={styles.kpi}><span>Total</span><strong>{logsStats.total_all_time?.total || 0}</strong></div>
              <div style={styles.kpi}><span>Aceptados 24h</span><strong>{logsStats.last_24h?.accepted || 0}</strong></div>
              <div style={styles.kpi}><span>Rechazados 24h</span><strong>{logsStats.last_24h?.rejected || 0}</strong></div>
            </div>
          )}

          <div style={styles.tableWrap}>
            <table style={styles.table}>
              <thead>
                <tr>{['ID', 'Usuario', 'Reply', 'Fecha', 'Class/NAS'].map((h) => <th key={h} style={styles.th}>{h}</th>)}</tr>
              </thead>
              <tbody>
                {logsRows.map((r) => (
                  <tr key={r.id} style={{ borderBottom: `1px solid ${C.border}22` }}>
                    <td style={styles.td}>{r.id}</td>
                    <td style={styles.td}>{r.username}</td>
                    <td style={{ ...styles.td, color: r.reply === 'Access-Accept' ? C.green : C.danger }}>{r.reply}</td>
                    <td style={styles.td}>{fmtDate(r.timestamp)}</td>
                    <td style={styles.td}>{r.nas_info || '-'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )
    }

    if (tab === 'status') {
      if (loadingStatus) return <div style={styles.muted}>Cargando estado...</div>
      if (statusError) return <div style={styles.error}>{statusError}</div>
      if (!statusData) return <div style={styles.muted}>Sin datos</div>

      const services = Object.entries(statusData.services || {})
      return (
        <>
          <h1 style={styles.title}>Status Page</h1>
          <div style={styles.card}>
            <div style={styles.cardTitle}>Sistema</div>
            <div style={styles.grid2}>
              <div style={styles.item}>Hostname: <strong>{statusData.system?.hostname || '-'}</strong></div>
              <div style={styles.item}>OS: <strong>{statusData.system?.os || '-'}</strong></div>
              <div style={styles.item}>IP: <strong>{statusData.system?.ip || '-'}</strong></div>
              <div style={styles.item}>Uptime: <strong>{statusData.system?.uptime || '-'}</strong></div>
              <div style={styles.item}>CPU: <strong>{statusData.system?.cpu_usage || '-'}</strong></div>
              <div style={styles.item}>RAM: <strong>{statusData.system?.memory || '-'}</strong></div>
            </div>
          </div>

          <div style={{ ...styles.card, marginTop: 14 }}>
            <div style={styles.cardTitle}>Servicios</div>
            <div style={styles.grid2}>
              {services.map(([name, ok]) => (
                <div key={name} style={styles.item}>{name}: <strong style={{ color: ok ? C.green : C.danger }}>{ok ? 'Activo' : 'Inactivo'}</strong></div>
              ))}
            </div>
          </div>
        </>
      )
    }

    if (tab === 'batch') {
      if (loadingBatch) return <div style={styles.muted}>Cargando batch...</div>
      if (batchError) return <div style={styles.error}>{batchError}</div>
      return (
        <>
          <h1 style={styles.title}>Batch Users</h1>
          <div style={styles.kpis}>
            <div style={styles.kpi}><span>Usuarios</span><strong>{batchData?.totals?.total_users || 0}</strong></div>
            <div style={styles.kpi}><span>Vouchers</span><strong>{batchData?.totals?.total_vouchers || 0}</strong></div>
            <div style={styles.kpi}><span>Filtro</span><strong>{batchData?.filter_prefix || 'Todos'}</strong></div>
          </div>

          <div style={{ ...styles.card, marginTop: 12 }}>
            <div style={styles.cardTitle}>Ultimas Sesiones</div>
            <div style={styles.tableWrap}>
              <table style={styles.table}>
                <thead><tr>{['Usuario', 'Sesiones', 'Consumo', 'Ultimo inicio'].map((h) => <th key={h} style={styles.th}>{h}</th>)}</tr></thead>
                <tbody>
                  {(batchData?.recent_sessions || []).map((r, i) => (
                    <tr key={`${r.username}-${i}`} style={{ borderBottom: `1px solid ${C.border}22` }}>
                      <td style={styles.td}>{r.username}</td>
                      <td style={styles.td}>{r.sessions || 0}</td>
                      <td style={styles.td}>{formatBytes(r.total_bytes)}</td>
                      <td style={styles.td}>{fmtDate(r.last_start)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div style={{ ...styles.card, marginTop: 12 }}>
            <div style={styles.cardTitle}>Ultimos Intentos de Autenticacion</div>
            <div style={styles.tableWrap}>
              <table style={styles.table}>
                <thead><tr>{['Usuario', 'Reply', 'Fecha'].map((h) => <th key={h} style={styles.th}>{h}</th>)}</tr></thead>
                <tbody>
                  {(batchData?.last_auth_attempts || []).map((r, i) => (
                    <tr key={`${r.username}-${i}`} style={{ borderBottom: `1px solid ${C.border}22` }}>
                      <td style={styles.td}>{r.username}</td>
                      <td style={{ ...styles.td, color: r.reply === 'Access-Accept' ? C.green : C.danger }}>{r.reply}</td>
                      <td style={styles.td}>{fmtDate(r.authdate)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )
    }

    if (loadingDashboard) return <div style={styles.muted}>Cargando dashboard...</div>
    if (dashboardError) return <div style={styles.error}>{dashboardError}</div>

    return (
      <>
        <h1 style={styles.title}>Heartbeat</h1>
        <div style={styles.kpis}>
          <div style={styles.kpi}><span>Usuarios</span><strong>{dashboard?.total_users || 0}</strong></div>
          <div style={styles.kpi}><span>Sesiones activas</span><strong>{dashboard?.active_sessions || 0}</strong></div>
          <div style={styles.kpi}><span>NAS</span><strong>{dashboard?.nas_count || 0}</strong></div>
          <div style={styles.kpi}><span>Auth OK (24h)</span><strong>{dashboard?.auth_ok_24h || 0}</strong></div>
          <div style={styles.kpi}><span>Auth Fail (24h)</span><strong>{dashboard?.auth_fail_24h || 0}</strong></div>
          <div style={styles.kpi}><span>Trafico hoy</span><strong>{formatBytes((dashboard?.traffic_today?.upload_bytes || 0) + (dashboard?.traffic_today?.download_bytes || 0))}</strong></div>
        </div>
      </>
    )
  })()

  return (
    <div style={{ color: C.text }}>
      <div style={styles.topTabs}>
        {REPORT_TABS.map((item) => (
          <NavLink key={item.key} to={item.to} style={{ textDecoration: 'none' }}>
            <div style={{ color: tab === item.key ? C.accent : C.text, fontSize: 13, borderBottom: tab === item.key ? `2px solid ${C.accent}` : '2px solid transparent', paddingBottom: 3 }}>
              {item.label}
            </div>
          </NavLink>
        ))}
      </div>

      <div style={styles.shell}>
        <aside style={styles.sidebar}>{sidebar}</aside>
        <section style={styles.content}>{content}</section>
      </div>
    </div>
  )
}
