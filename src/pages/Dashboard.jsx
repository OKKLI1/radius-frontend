import { useEffect, useState } from 'react'
import api from '../api/client'
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts'

const C = {
  bg: '#0d1117', surface: '#161b22', border: '#30363d',
  accent: '#00d4aa', text: '#e6edf3', muted: '#8b949e',
  green: '#3fb950', danger: '#f85149', warn: '#e3b341',
}

function StatCard({ icon, label, value, sub, color }) {
  return (
    <div style={{ ...styles.card, position: 'relative', overflow: 'hidden' }}>
      <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 2, background: `linear-gradient(90deg, ${color || C.accent}, transparent)` }} />
      <div style={{ fontSize: 26 }}>{icon}</div>
      <div style={{ fontSize: 34, fontWeight: 700, color: C.text, letterSpacing: -1, lineHeight: 1.1 }}>{value ?? '—'}</div>
      <div style={{ fontSize: 12, color: C.muted }}>{label}</div>
      {sub && <div style={{ fontSize: 11, color: color || C.accent, fontFamily: 'monospace' }}>{sub}</div>}
    </div>
  )
}

function formatBytes(bytes) {
  if (!bytes) return '0 B'
  const units = ['B', 'KB', 'MB', 'GB', 'TB']
  let b = bytes
  for (const u of units) {
    if (b < 1024) return `${b.toFixed(1)} ${u}`
    b /= 1024
  }
  return `${b.toFixed(1)} PB`
}

export default function Dashboard() {
  const [stats, setStats] = useState(null)
  const [traffic, setTraffic] = useState([])
  const [sessions, setSessions] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([
      api.get('/reports/dashboard'),
      api.get('/reports/traffic/daily?days=14'),
      api.get('/sessions/active'),
    ]).then(([s, t, ses]) => {
      setStats(s.data)
      setTraffic(t.data.map(d => ({
        fecha: d.date?.slice(5) || d.date,
        GB: +((d.total_bytes || 0) / 1e9).toFixed(2),
        sesiones: d.sessions,
      })))
      setSessions(ses.data.slice(0, 5))
    }).finally(() => setLoading(false))
  }, [])

  if (loading) return <div style={{ color: C.muted, padding: 40 }}>Cargando...</div>

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24, color: C.text }}>
      <div>
        <h1 style={{ fontSize: 22, fontWeight: 700, margin: 0 }}>Panel de Control</h1>
        <p style={{ color: C.muted, fontSize: 13, margin: '4px 0 0' }}>Resumen general del servidor RADIUS</p>
      </div>

      {/* Stats grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 16 }}>
        <StatCard icon="👤" label="Usuarios totales" value={stats?.total_users} />
        <StatCard icon="🟢" label="Sesiones activas" value={stats?.active_sessions} sub="ahora mismo" color={C.green} />
        <StatCard icon="📡" label="Clientes NAS" value={stats?.nas_count} />
        <StatCard icon="✅" label="Auth exitosas" value={stats?.auth_ok_24h} sub="últimas 24h" color={C.green} />
        <StatCard icon="❌" label="Auth fallidas" value={stats?.auth_fail_24h} sub="últimas 24h" color={C.danger} />
        <StatCard icon="📊" label="Tráfico hoy" value={formatBytes(stats?.traffic_today?.total_bytes)} color={C.warn} />
      </div>

      {/* Gráfico tráfico */}
      <div style={styles.card}>
        <div style={{ fontSize: 13, fontWeight: 600, color: C.muted, marginBottom: 16, textTransform: 'uppercase', letterSpacing: 1 }}>
          Tráfico últimos 14 días (GB)
        </div>
        {traffic.length > 0 ? (
          <ResponsiveContainer width="100%" height={200}>
            <LineChart data={traffic}>
              <CartesianGrid stroke={C.border} strokeDasharray="3 3" />
              <XAxis dataKey="fecha" tick={{ fill: C.muted, fontSize: 11 }} />
              <YAxis tick={{ fill: C.muted, fontSize: 11 }} />
              <Tooltip contentStyle={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 8 }} />
              <Line type="monotone" dataKey="GB" stroke={C.accent} strokeWidth={2} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        ) : (
          <div style={{ color: C.muted, fontSize: 13, padding: '20px 0' }}>Sin datos de tráfico aún</div>
        )}
      </div>

      {/* Sesiones activas */}
      <div style={styles.card}>
        <div style={{ fontSize: 13, fontWeight: 600, color: C.muted, marginBottom: 16, textTransform: 'uppercase', letterSpacing: 1 }}>
          Sesiones activas recientes
        </div>
        {sessions.length === 0 ? (
          <div style={{ color: C.muted, fontSize: 13 }}>No hay sesiones activas en este momento</div>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
            <thead>
              <tr>
                {['Usuario', 'NAS', 'IP Asignada', 'Duración', 'Datos'].map(h => (
                  <th key={h} style={styles.th}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {sessions.map(s => (
                <tr key={s.radacctid} style={{ borderBottom: `1px solid ${C.border}20` }}>
                  <td style={{ ...styles.td, color: C.accent, fontFamily: 'monospace' }}>{s.username}</td>
                  <td style={styles.td}>{s.nasipaddress}</td>
                  <td style={{ ...styles.td, fontFamily: 'monospace', color: C.muted }}>{s.framedipaddress || '—'}</td>
                  <td style={{ ...styles.td, color: C.green }}>{s.duration_human}</td>
                  <td style={styles.td}>{s.total_readable}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}

const styles = {
  card: {
    background: C.surface, border: `1px solid ${C.border}`,
    borderRadius: 12, padding: '20px 24px',
    display: 'flex', flexDirection: 'column', gap: 6,
  },
  th: { padding: '8px 14px', textAlign: 'left', color: C.muted, fontSize: 11, textTransform: 'uppercase', letterSpacing: 1, fontWeight: 600 },
  td: { padding: '10px 14px', color: C.text },
}
