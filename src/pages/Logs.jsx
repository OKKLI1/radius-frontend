import { useEffect, useState } from 'react'
import api from '../api/client'
import { C } from '../theme'

export default function Logs() {
  const [logs, setLogs] = useState([])
  const [stats, setStats] = useState(null)
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [filter, setFilter] = useState('')

  useEffect(() => {
    setLoading(true)
    Promise.all([
      api.get('/logs/auth?limit=200'),
      api.get('/logs/auth/stats'),
    ])
      .then(([l, s]) => {
        setLogs(l.data)
        setStats(s.data)
      })
      .finally(() => setLoading(false))
  }, [])

  const filtered = logs.filter((l) => {
    const q = search.toLowerCase()
    const matchSearch =
      l.username?.toLowerCase().includes(q) ||
      l.class?.toLowerCase().includes(q)
    const matchFilter = !filter || l.reply === filter
    return matchSearch && matchFilter
  })

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20, color: C.text }}>
      <div>
        <h1 style={{ fontSize: 22, fontWeight: 700, margin: 0 }}>Logs de Autenticacion</h1>
        <p style={{ color: C.muted, fontSize: 13, margin: '4px 0 0' }}>Registro de intentos de acceso al servidor RADIUS</p>
      </div>

      {stats && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 12 }}>
          {[
            { label: 'Total autenticaciones', value: stats.total_all_time?.total, color: C.accent },
            { label: 'Exitosas (24h)', value: stats.last_24h?.accepted, color: C.green },
            { label: 'Fallidas (24h)', value: stats.last_24h?.rejected, color: C.danger },
          ].map((s) => (
            <div key={s.label} style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 10, padding: '16px 20px' }}>
              <div style={{ fontSize: 28, fontWeight: 700, color: s.color }}>{s.value ?? '-'}</div>
              <div style={{ fontSize: 12, color: C.muted, marginTop: 4 }}>{s.label}</div>
            </div>
          ))}
        </div>
      )}

      <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
        <input
          placeholder="Buscar usuario o class..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          style={{ background: C.bg, border: `1px solid ${C.border}`, color: C.text, padding: '9px 12px', borderRadius: 7, fontSize: 13, outline: 'none', fontFamily: "'Sora', sans-serif", width: 280 }}
        />
        <div style={{ display: 'flex', gap: 4, background: C.surface, border: `1px solid ${C.border}`, borderRadius: 8, padding: 4 }}>
          {[
            ['', 'Todos'],
            ['Access-Accept', 'Exitosas'],
            ['Access-Reject', 'Fallidas'],
          ].map(([val, label]) => (
            <button
              key={val}
              onClick={() => setFilter(val)}
              style={{
                background: filter === val ? C.accent : 'transparent',
                color: filter === val ? '#000' : C.muted,
                border: 'none',
                padding: '6px 14px',
                borderRadius: 6,
                fontWeight: filter === val ? 700 : 400,
                fontSize: 12,
                cursor: 'pointer',
                fontFamily: "'Sora', sans-serif",
              }}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      <div style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 12, overflow: 'auto' }}>
        {loading ? (
          <div style={{ color: C.muted, padding: 24 }}>Cargando...</div>
        ) : filtered.length === 0 ? (
          <div style={{ color: C.muted, padding: 24 }}>No hay registros.</div>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
            <thead>
              <tr>
                {['Fecha/Hora', 'Usuario', 'Resultado', 'Class'].map((h) => (
                  <th key={h} style={styles.th}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map((l) => {
                const ok = l.reply === 'Access-Accept'
                return (
                  <tr key={l.id} style={{ borderBottom: `1px solid ${C.border}15` }}>
                    <td style={{ ...styles.td, fontFamily: 'monospace', fontSize: 12, color: C.muted }}>{l.authdate?.slice(0, 19).replace('T', ' ')}</td>
                    <td style={{ ...styles.td, color: C.accent, fontFamily: 'monospace', fontWeight: 600 }}>{l.username}</td>
                    <td style={styles.td}>
                      <span style={{ background: ok ? `${C.green}22` : `${C.danger}22`, color: ok ? C.green : C.danger, border: `1px solid ${ok ? C.green : C.danger}44`, padding: '2px 10px', borderRadius: 20, fontSize: 11, fontWeight: 600 }}>
                        {ok ? 'Exitosa' : 'Rechazada'}
                      </span>
                    </td>
                    <td style={{ ...styles.td, fontFamily: 'monospace', fontSize: 12, color: C.muted }}>{l.class || '-'}</td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        )}
      </div>

      {stats?.top_rejected_users_24h?.length > 0 && (
        <div style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 12, padding: '20px 24px' }}>
          <div style={{ fontSize: 13, fontWeight: 600, color: C.muted, marginBottom: 14, textTransform: 'uppercase', letterSpacing: 1 }}>
            Top usuarios rechazados (ultimas 24h)
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {stats.top_rejected_users_24h.map((u, i) => (
              <div key={u.username} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 0', borderBottom: `1px solid ${C.border}20` }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <span style={{ color: C.muted, fontSize: 12, width: 20 }}>#{i + 1}</span>
                  <span style={{ fontFamily: 'monospace', color: C.accent }}>{u.username}</span>
                </div>
                <span style={{ background: `${C.danger}22`, color: C.danger, border: `1px solid ${C.danger}44`, padding: '2px 10px', borderRadius: 20, fontSize: 12 }}>
                  {u.attempts} intentos
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

const styles = {
  th: { padding: '10px 14px', textAlign: 'left', color: C.muted, fontSize: 11, textTransform: 'uppercase', letterSpacing: 1, fontWeight: 600, borderBottom: `1px solid ${C.border}` },
  td: { padding: '10px 14px', color: C.text },
}