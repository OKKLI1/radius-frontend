import { useEffect, useState } from 'react'
import api from '../api/client'

const C = {
  bg: '#0d1117', surface: '#161b22', border: '#30363d',
  accent: '#00d4aa', text: '#e6edf3', muted: '#8b949e',
  green: '#3fb950', danger: '#f85149',
}

export default function Sessions() {
  const [active, setActive] = useState([])
  const [history, setHistory] = useState([])
  const [tab, setTab] = useState('active')
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')

  const loadActive = () => api.get('/sessions/active').then(r => setActive(r.data))
  const loadHistory = () => api.get('/sessions/history?limit=50').then(r => setHistory(r.data))

  useEffect(() => {
    setLoading(true)
    Promise.all([loadActive(), loadHistory()]).finally(() => setLoading(false))
    const interval = setInterval(loadActive, 30000) // auto-refresh cada 30s
    return () => clearInterval(interval)
  }, [])

  const disconnect = async (id) => {
    if (!confirm('¿Desconectar esta sesión?')) return
    await api.delete(`/sessions/active/${id}`)
    loadActive()
  }

  const filtered = (tab === 'active' ? active : history).filter(s =>
    s.username?.toLowerCase().includes(search.toLowerCase()) ||
    s.nasipaddress?.includes(search) ||
    s.framedipaddress?.includes(search)
  )

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20, color: C.text }}>
      <div>
        <h1 style={{ fontSize: 22, fontWeight: 700, margin: 0 }}>Sesiones</h1>
        <p style={{ color: C.muted, fontSize: 13, margin: '4px 0 0' }}>
          {active.length} sesión(es) activa(s) ahora · se actualiza cada 30s
        </p>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: 4, background: C.surface, border: `1px solid ${C.border}`, borderRadius: 8, padding: 4, width: 'fit-content' }}>
        {[['active', '🟢 Activas'], ['history', '📋 Historial']].map(([key, label]) => (
          <button key={key} onClick={() => setTab(key)} style={{
            background: tab === key ? C.accent : 'transparent',
            color: tab === key ? '#000' : C.muted,
            border: 'none', padding: '7px 18px', borderRadius: 6,
            fontWeight: tab === key ? 700 : 400, fontSize: 13,
            cursor: 'pointer', fontFamily: "'Sora', sans-serif",
          }}>{label}</button>
        ))}
      </div>

      <input placeholder="Buscar por usuario, NAS o IP..." value={search}
        onChange={e => setSearch(e.target.value)}
        style={{ background: C.bg, border: `1px solid ${C.border}`, color: C.text, padding: '9px 12px', borderRadius: 7, fontSize: 13, maxWidth: 340, outline: 'none', fontFamily: "'Sora', sans-serif" }} />

      <div style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 12, overflow: 'auto' }}>
        {loading ? (
          <div style={{ color: C.muted, padding: 24 }}>Cargando...</div>
        ) : filtered.length === 0 ? (
          <div style={{ color: C.muted, padding: 24 }}>No hay sesiones {tab === 'active' ? 'activas' : 'en el historial'}.</div>
        ) : tab === 'active' ? (
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
            <thead>
              <tr>{['Usuario', 'NAS', 'IP Asignada', 'MAC', 'Conectado desde', 'Duración', 'Datos', 'Acción'].map(h => (
                <th key={h} style={styles.th}>{h}</th>
              ))}</tr>
            </thead>
            <tbody>
              {filtered.map(s => (
                <tr key={s.radacctid} style={{ borderBottom: `1px solid ${C.border}20` }}>
                  <td style={{ ...styles.td, color: C.accent, fontFamily: 'monospace', fontWeight: 600 }}>{s.username}</td>
                  <td style={{ ...styles.td, fontFamily: 'monospace', fontSize: 12, color: C.muted }}>{s.nasipaddress}</td>
                  <td style={{ ...styles.td, fontFamily: 'monospace', fontSize: 12 }}>{s.framedipaddress || '—'}</td>
                  <td style={{ ...styles.td, fontFamily: 'monospace', fontSize: 11, color: C.muted }}>{s.mac_address || '—'}</td>
                  <td style={{ ...styles.td, fontSize: 12, color: C.muted }}>{s.connected_since?.slice(0, 16).replace('T', ' ')}</td>
                  <td style={{ ...styles.td, color: C.green, fontFamily: 'monospace' }}>{s.duration_human}</td>
                  <td style={styles.td}>{s.total_readable}</td>
                  <td style={styles.td}>
                    <button onClick={() => disconnect(s.radacctid)} style={{ background: `${C.danger}22`, color: C.danger, border: `1px solid ${C.danger}44`, padding: '4px 10px', borderRadius: 5, fontSize: 11, cursor: 'pointer', fontFamily: "'Sora', sans-serif" }}>
                      Desconectar
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
            <thead>
              <tr>{['Usuario', 'NAS', 'IP', 'Inicio', 'Fin', 'Duración', 'Descarga', 'Subida', 'Motivo'].map(h => (
                <th key={h} style={styles.th}>{h}</th>
              ))}</tr>
            </thead>
            <tbody>
              {filtered.map(s => (
                <tr key={s.radacctid} style={{ borderBottom: `1px solid ${C.border}20` }}>
                  <td style={{ ...styles.td, color: C.accent, fontFamily: 'monospace' }}>{s.username}</td>
                  <td style={{ ...styles.td, fontSize: 12, color: C.muted, fontFamily: 'monospace' }}>{s.nasipaddress}</td>
                  <td style={{ ...styles.td, fontSize: 12, fontFamily: 'monospace' }}>{s.framedipaddress || '—'}</td>
                  <td style={{ ...styles.td, fontSize: 11, color: C.muted }}>{s.acctstarttime?.slice(0, 16).replace('T', ' ')}</td>
                  <td style={{ ...styles.td, fontSize: 11, color: C.muted }}>{s.acctstoptime?.slice(0, 16).replace('T', ' ')}</td>
                  <td style={{ ...styles.td, fontFamily: 'monospace', fontSize: 12 }}>{s.duration_seconds ? `${Math.floor(s.duration_seconds / 60)}m` : '—'}</td>
                  <td style={styles.td}>{s.download_readable}</td>
                  <td style={styles.td}>{s.upload_readable}</td>
                  <td style={{ ...styles.td, fontSize: 11, color: C.muted }}>{s.disconnect_reason || '—'}</td>
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
  th: { padding: '10px 14px', textAlign: 'left', color: C.muted, fontSize: 11, textTransform: 'uppercase', letterSpacing: 1, fontWeight: 600, borderBottom: `1px solid ${C.border}`, whiteSpace: 'nowrap' },
  td: { padding: '10px 14px', color: C.text, whiteSpace: 'nowrap' },
}
