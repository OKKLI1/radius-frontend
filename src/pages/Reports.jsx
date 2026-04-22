import { useEffect, useState } from 'react'
import api from '../api/client'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, PieChart, Pie, Cell, Legend } from 'recharts'
import { C } from '../theme'

const COLORS = [C.accent, C.green, C.warn, '#58a6ff', '#bc8cff', '#ff7b72']

function formatBytes(b) {
  if (!b) return '0 B'
  const units = ['B', 'KB', 'MB', 'GB', 'TB']
  for (const u of units) { if (b < 1024) return `${b.toFixed(1)} ${u}`; b /= 1024 }
  return `${b.toFixed(1)} PB`
}

export default function Reports() {
  const [traffic, setTraffic] = useState([])
  const [topUsers, setTopUsers] = useState([])
  const [byNas, setByNas] = useState([])
  const [days, setDays] = useState(30)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    setLoading(true)
    Promise.all([
      api.get(`/reports/traffic/daily?days=${days}`),
      api.get(`/reports/top-users?days=${days}&limit=10`),
      api.get(`/reports/by-nas?days=${days}`),
    ]).then(([t, u, n]) => {
      setTraffic(t.data.map(d => ({ fecha: d.date?.slice(5), GB: +((d.total_bytes || 0) / 1e9).toFixed(2), sesiones: d.sessions })))
      setTopUsers(u.data.map(u => ({ ...u, GB: +((u.total_bytes || 0) / 1e9).toFixed(2) })))
      setByNas(n.data.map(n => ({ name: n.shortname || n.nasipaddress, GB: +((n.total_bytes || 0) / 1e9).toFixed(2) })))
    }).finally(() => setLoading(false))
  }, [days])

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24, color: C.text }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 700, margin: 0 }}>Reportes</h1>
          <p style={{ color: C.muted, fontSize: 13, margin: '4px 0 0' }}>Estadísticas de uso y consumo de datos</p>
        </div>
        <div style={{ display: 'flex', gap: 4, background: C.surface, border: `1px solid ${C.border}`, borderRadius: 8, padding: 4 }}>
          {[7, 14, 30, 90].map(d => (
            <button key={d} onClick={() => setDays(d)} style={{
              background: days === d ? C.accent : 'transparent',
              color: days === d ? '#000' : C.muted,
              border: 'none', padding: '6px 14px', borderRadius: 6,
              fontWeight: days === d ? 700 : 400, fontSize: 13,
              cursor: 'pointer', fontFamily: "'Sora', sans-serif",
            }}>{d}d</button>
          ))}
        </div>
      </div>

      {loading ? <div style={{ color: C.muted }}>Cargando...</div> : (
        <>
          {/* Tráfico diario */}
          <div style={styles.card}>
            <div style={styles.cardTitle}>Tráfico diario (GB) — últimos {days} días</div>
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
            ) : <div style={{ color: C.muted, fontSize: 13, padding: '20px 0' }}>Sin datos de tráfico en este período</div>}
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
            {/* Top usuarios */}
            <div style={styles.card}>
              <div style={styles.cardTitle}>Top 10 usuarios por consumo</div>
              {topUsers.length === 0 ? (
                <div style={{ color: C.muted, fontSize: 13 }}>Sin datos</div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 8 }}>
                  {topUsers.map((u, i) => (
                    <div key={u.username} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <span style={{ color: C.muted, fontSize: 12, width: 18 }}>#{i + 1}</span>
                      <span style={{ fontFamily: 'monospace', fontSize: 13, color: C.accent, flex: 1, overflow: 'hidden', textOverflow: 'ellipsis' }}>{u.username}</span>
                      <span style={{ fontSize: 12, color: C.text, whiteSpace: 'nowrap' }}>{u.GB} GB</span>
                      <span style={{ fontSize: 11, color: C.muted, whiteSpace: 'nowrap' }}>{u.sessions} ses.</span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Por NAS */}
            <div style={styles.card}>
              <div style={styles.cardTitle}>Tráfico por NAS</div>
              {byNas.length === 0 ? (
                <div style={{ color: C.muted, fontSize: 13 }}>Sin datos</div>
              ) : (
                <ResponsiveContainer width="100%" height={200}>
                  <PieChart>
                    <Pie data={byNas} dataKey="GB" nameKey="name" cx="50%" cy="50%" outerRadius={70} label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                      labelLine={false} fontSize={11}>
                      {byNas.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                    </Pie>
                    <Tooltip contentStyle={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 8 }} formatter={(v) => [`${v} GB`]} />
                  </PieChart>
                </ResponsiveContainer>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  )
}

const styles = {
  card: { background: C.surface, border: `1px solid ${C.border}`, borderRadius: 12, padding: '20px 24px' },
  cardTitle: { fontSize: 13, fontWeight: 600, color: C.muted, marginBottom: 16, textTransform: 'uppercase', letterSpacing: 1 },
}
