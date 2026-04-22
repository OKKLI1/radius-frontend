import { useEffect, useState } from 'react'
import api from '../api/client'

const C = {
  bg: '#0d1117', surface: '#161b22', border: '#30363d',
  accent: '#00d4aa', text: '#e6edf3', muted: '#8b949e',
  green: '#3fb950', danger: '#f85149',
}

const EMPTY = { groupname: '', max_bandwidth_down: '', max_bandwidth_up: '', session_timeout: '', idle_timeout: '' }
const inputStyle = { background: C.bg, border: `1px solid ${C.border}`, color: C.text, padding: '9px 12px', borderRadius: 7, fontSize: 13, fontFamily: "'Sora', sans-serif", width: '100%', boxSizing: 'border-box', outline: 'none' }

export default function Groups() {
  const [groups, setGroups] = useState([])
  const [loading, setLoading] = useState(true)
  const [modal, setModal] = useState(false)
  const [form, setForm] = useState(EMPTY)
  const [saving, setSaving] = useState(false)
  const [msg, setMsg] = useState('')
  const [expanded, setExpanded] = useState(null)

  const load = () => {
    setLoading(true)
    api.get('/groups').then(r => setGroups(r.data)).finally(() => setLoading(false))
  }

  useEffect(() => { load() }, [])

  const save = async () => {
    setSaving(true); setMsg('')
    try {
      const payload = { groupname: form.groupname }
      if (form.max_bandwidth_down) payload.max_bandwidth_down = Number(form.max_bandwidth_down)
      if (form.max_bandwidth_up) payload.max_bandwidth_up = Number(form.max_bandwidth_up)
      if (form.session_timeout) payload.session_timeout = Number(form.session_timeout)
      if (form.idle_timeout) payload.idle_timeout = Number(form.idle_timeout)
      await api.post('/groups', payload)
      load(); setModal(false); setForm(EMPTY)
    } catch (e) {
      setMsg(e.response?.data?.detail || 'Error al guardar')
    } finally { setSaving(false) }
  }

  const del = async (name) => {
    if (!confirm(`¿Eliminar grupo "${name}"? Los usuarios no serán eliminados.`)) return
    await api.delete(`/groups/${name}`)
    load()
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20, color: C.text }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 700, margin: 0 }}>Grupos RADIUS</h1>
          <p style={{ color: C.muted, fontSize: 13, margin: '4px 0 0' }}>Políticas de acceso y ancho de banda por grupo</p>
        </div>
        <button onClick={() => { setForm(EMPTY); setModal(true) }} style={styles.btnPrimary}>+ Nuevo grupo</button>
      </div>

      {loading ? (
        <div style={{ color: C.muted }}>Cargando...</div>
      ) : groups.length === 0 ? (
        <div style={{ color: C.muted, background: C.surface, border: `1px solid ${C.border}`, borderRadius: 12, padding: 24 }}>No hay grupos definidos.</div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {groups.map(g => (
            <div key={g.groupname} style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 12, overflow: 'hidden' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px 20px', cursor: 'pointer' }}
                onClick={() => setExpanded(expanded === g.groupname ? null : g.groupname)}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                  <span style={{ fontSize: 20 }}>◉</span>
                  <div>
                    <div style={{ fontWeight: 700, fontSize: 15 }}>{g.groupname}</div>
                    <div style={{ fontSize: 12, color: C.muted }}>{g.member_count} miembro(s) · {g.reply_attributes.length} atributos</div>
                  </div>
                </div>
                <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                  <button onClick={e => { e.stopPropagation(); del(g.groupname) }} style={{ ...styles.btnSm, color: C.danger, borderColor: `${C.danger}44` }}>Eliminar</button>
                  <span style={{ color: C.muted, fontSize: 18 }}>{expanded === g.groupname ? '▴' : '▾'}</span>
                </div>
              </div>

              {expanded === g.groupname && (
                <div style={{ borderTop: `1px solid ${C.border}`, padding: '16px 20px', display: 'flex', gap: 24, flexWrap: 'wrap' }}>
                  {g.reply_attributes.length > 0 && (
                    <div>
                      <div style={{ fontSize: 11, color: C.muted, fontWeight: 600, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 8 }}>Atributos Reply</div>
                      {g.reply_attributes.map((a, i) => (
                        <div key={i} style={{ fontFamily: 'monospace', fontSize: 12, color: C.accent, marginBottom: 4 }}>
                          {a.attribute} {a.op} {a.value}
                        </div>
                      ))}
                    </div>
                  )}
                  {g.members.length > 0 && (
                    <div>
                      <div style={{ fontSize: 11, color: C.muted, fontWeight: 600, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 8 }}>Miembros</div>
                      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                        {g.members.map(m => (
                          <span key={m} style={{ background: `${C.accent}18`, color: C.accent, border: `1px solid ${C.accent}33`, padding: '2px 10px', borderRadius: 20, fontSize: 12, fontFamily: 'monospace' }}>{m}</span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {modal && (
        <div style={{ position: 'fixed', inset: 0, background: '#000b', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100 }}>
          <div style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 14, padding: 28, width: 420, display: 'flex', flexDirection: 'column', gap: 14 }}>
            <div style={{ fontSize: 16, fontWeight: 700, color: C.text }}>Nuevo grupo</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              <label style={{ fontSize: 11, color: C.muted, fontWeight: 600, textTransform: 'uppercase', letterSpacing: 1 }}>Nombre del grupo</label>
              <input style={inputStyle} value={form.groupname} onChange={e => setForm({ ...form, groupname: e.target.value })} placeholder="empleados" />
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              {[['max_bandwidth_down', 'Bajada máx (Kbps)'], ['max_bandwidth_up', 'Subida máx (Kbps)'], ['session_timeout', 'Timeout sesión (seg)'], ['idle_timeout', 'Timeout inactivo (seg)']].map(([k, l]) => (
                <div key={k} style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  <label style={{ fontSize: 11, color: C.muted, fontWeight: 600, textTransform: 'uppercase', letterSpacing: 1 }}>{l}</label>
                  <input style={inputStyle} type="number" value={form[k]} onChange={e => setForm({ ...form, [k]: e.target.value })} placeholder="Opcional" />
                </div>
              ))}
            </div>
            {msg && <div style={{ color: C.danger, fontSize: 13 }}>{msg}</div>}
            <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
              <button onClick={() => setModal(false)} style={styles.btnSecondary}>Cancelar</button>
              <button onClick={save} disabled={saving} style={{ ...styles.btnPrimary, opacity: saving ? 0.7 : 1 }}>{saving ? 'Guardando...' : 'Crear grupo'}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

const styles = {
  btnPrimary: { background: C.accent, color: '#000', border: 'none', padding: '9px 18px', borderRadius: 7, fontWeight: 700, fontSize: 13, cursor: 'pointer', fontFamily: "'Sora', sans-serif" },
  btnSecondary: { background: 'transparent', color: C.muted, border: `1px solid ${C.border}`, padding: '9px 18px', borderRadius: 7, fontSize: 13, cursor: 'pointer', fontFamily: "'Sora', sans-serif" },
  btnSm: { background: 'transparent', color: C.accent, border: `1px solid ${C.accent}44`, padding: '5px 12px', borderRadius: 5, fontSize: 12, cursor: 'pointer', fontFamily: "'Sora', sans-serif" },
}
