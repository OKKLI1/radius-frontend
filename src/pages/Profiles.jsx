import { useEffect, useState } from 'react'
import api from '../api/client'
import { C } from '../theme'

const EMPTY = {
  name: '', description: '',
  bandwidth_down: '', bandwidth_up: '',
  session_timeout: '', idle_timeout: '',
  max_octets: '', simultaneous_use: 1,
}

const inputStyle = {
  background: C.bg, border: `1px solid ${C.border}`, color: C.text,
  padding: '9px 12px', borderRadius: 7, fontSize: 13,
  fontFamily: "'Sora', sans-serif", width: '100%', boxSizing: 'border-box', outline: 'none',
}

function Field({ label, hint, children }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
      <label style={{ fontSize: 11, color: C.muted, fontWeight: 600, textTransform: 'uppercase', letterSpacing: 1 }}>{label}</label>
      {children}
      {hint && <span style={{ fontSize: 11, color: C.muted }}>{hint}</span>}
    </div>
  )
}

function formatBytes(b) {
  if (!b) return '—'
  if (b >= 1e9) return `${(b / 1e9).toFixed(1)} GB`
  if (b >= 1e6) return `${(b / 1e6).toFixed(0)} MB`
  return `${(b / 1e3).toFixed(0)} KB`
}

function formatSpeed(kbps) {
  if (!kbps) return '—'
  if (kbps >= 1000) return `${(kbps / 1000).toFixed(0)} Mbps`
  return `${kbps} Kbps`
}

function formatTime(secs) {
  if (!secs) return '—'
  if (secs >= 3600) return `${Math.floor(secs / 3600)}h ${Math.floor((secs % 3600) / 60)}m`
  if (secs >= 60) return `${Math.floor(secs / 60)} min`
  return `${secs}s`
}

export default function Profiles() {
  const [profiles, setProfiles] = useState([])
  const [loading, setLoading] = useState(true)
  const [modal, setModal] = useState(false)
  const [editName, setEditName] = useState(null)
  const [form, setForm] = useState(EMPTY)
  const [saving, setSaving] = useState(false)
  const [msg, setMsg] = useState('')
  const [assignModal, setAssignModal] = useState(null)
  const [users, setUsers] = useState([])
  const [selectedUser, setSelectedUser] = useState('')

  const load = () => {
    setLoading(true)
    api.get('/profiles').then(r => setProfiles(r.data)).finally(() => setLoading(false))
  }

  useEffect(() => {
    load()
    api.get('/users').then(r => setUsers(r.data))
  }, [])

  const openCreate = () => { setForm(EMPTY); setEditName(null); setMsg(''); setModal(true) }

  const openEdit = (p) => {
    setForm({
      name: p.name,
      description: '',
      bandwidth_down: p.bandwidth_down_kbps || '',
      bandwidth_up: p.bandwidth_up_kbps || '',
      session_timeout: p.session_timeout || '',
      idle_timeout: p.idle_timeout || '',
      max_octets: p.max_octets || '',
      simultaneous_use: p.simultaneous_use || 1,
    })
    setEditName(p.name)
    setMsg('')
    setModal(true)
  }

  const save = async () => {
    setSaving(true); setMsg('')
    try {
      const payload = {
        name: form.name,
        description: form.description,
        bandwidth_down: form.bandwidth_down ? Number(form.bandwidth_down) : null,
        bandwidth_up: form.bandwidth_up ? Number(form.bandwidth_up) : null,
        session_timeout: form.session_timeout ? Number(form.session_timeout) : null,
        idle_timeout: form.idle_timeout ? Number(form.idle_timeout) : null,
        max_octets: form.max_octets ? Number(form.max_octets) : null,
        simultaneous_use: Number(form.simultaneous_use),
      }
      if (editName) {
        await api.put(`/profiles/${editName}`, payload)
      } else {
        await api.post('/profiles', payload)
      }
      load(); setModal(false)
    } catch (e) {
      setMsg(e.response?.data?.detail || 'Error al guardar')
    } finally { setSaving(false) }
  }

  const del = async (name) => {
    if (!confirm(`¿Eliminar perfil "${name}"? Los usuarios asignados perderán este perfil.`)) return
    await api.delete(`/profiles/${name}`)
    load()
  }

  const assign = async () => {
    if (!selectedUser) return
    try {
      await api.post(`/profiles/${assignModal}/assign/${selectedUser}`)
      setAssignModal(null); setSelectedUser('')
      load()
    } catch (e) {
      alert(e.response?.data?.detail || 'Error al asignar')
    }
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20, color: C.text }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 700, margin: 0 }}>Perfiles de Ancho de Banda</h1>
          <p style={{ color: C.muted, fontSize: 13, margin: '4px 0 0' }}>Planes de velocidad, tiempo y datos para usuarios y grupos</p>
        </div>
        <button onClick={openCreate} style={styles.btnPrimary}>+ Nuevo perfil</button>
      </div>

      {loading ? (
        <div style={{ color: C.muted }}>Cargando...</div>
      ) : profiles.length === 0 ? (
        <div style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 12, padding: 32, textAlign: 'center' }}>
          <div style={{ fontSize: 32, marginBottom: 12 }}>📶</div>
          <div style={{ color: C.muted, fontSize: 14 }}>No hay perfiles creados aún.</div>
          <div style={{ color: C.muted, fontSize: 13, marginTop: 4 }}>Crea un perfil como "Plan-10Mbps" o "Visitante-2Mbps"</div>
          <button onClick={openCreate} style={{ ...styles.btnPrimary, marginTop: 16 }}>+ Crear primer perfil</button>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: 16 }}>
          {profiles.map(p => (
            <div key={p.name} style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 12, overflow: 'hidden' }}>
              {/* Header */}
              <div style={{ padding: '16px 20px', borderBottom: `1px solid ${C.border}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: `${C.accent}08` }}>
                <div>
                  <div style={{ fontWeight: 700, fontSize: 16 }}>📶 {p.name}</div>
                  <div style={{ fontSize: 12, color: C.muted, marginTop: 2 }}>{p.member_count} usuario(s) asignado(s)</div>
                </div>
                <div style={{ display: 'flex', gap: 6 }}>
                  <button onClick={() => { setAssignModal(p.name); setSelectedUser('') }} style={{ ...styles.btnSm, color: C.blue, borderColor: `${C.blue}44` }}>👤 Asignar</button>
                  <button onClick={() => openEdit(p)} style={styles.btnSm}>Editar</button>
                  <button onClick={() => del(p.name)} style={{ ...styles.btnSm, color: C.danger, borderColor: `${C.danger}44` }}>✕</button>
                </div>
              </div>

              {/* Stats grid */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr' }}>
                {[
                  { icon: '⬇', label: 'Bajada', value: formatSpeed(p.bandwidth_down_kbps), color: C.green },
                  { icon: '⬆', label: 'Subida', value: formatSpeed(p.bandwidth_up_kbps), color: C.accent },
                  { icon: '⏱', label: 'Sesión máx.', value: formatTime(p.session_timeout), color: C.warn },
                  { icon: '💾', label: 'Datos máx.', value: formatBytes(p.max_octets), color: C.blue },
                ].map((s, i) => (
                  <div key={i} style={{
                    padding: '14px 18px',
                    borderRight: i % 2 === 0 ? `1px solid ${C.border}` : 'none',
                    borderBottom: i < 2 ? `1px solid ${C.border}` : 'none',
                  }}>
                    <div style={{ fontSize: 11, color: C.muted, marginBottom: 4 }}>{s.icon} {s.label}</div>
                    <div style={{ fontSize: 18, fontWeight: 700, color: s.color }}>{s.value}</div>
                  </div>
                ))}
              </div>

              {/* Mikrotik rate */}
              {p.mikrotik_rate && (
                <div style={{ padding: '10px 18px', borderTop: `1px solid ${C.border}`, background: `${C.bg}88` }}>
                  <span style={{ fontSize: 11, color: C.muted }}>Mikrotik: </span>
                  <span style={{ fontSize: 12, fontFamily: 'monospace', color: C.accent }}>{p.mikrotik_rate}</span>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Modal crear/editar */}
      {modal && (
        <div style={{ position: 'fixed', inset: 0, background: '#000b', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100 }}>
          <div style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 14, padding: 28, width: 480, display: 'flex', flexDirection: 'column', gap: 14, maxHeight: '90vh', overflowY: 'auto' }}>
            <div style={{ fontSize: 16, fontWeight: 700, color: C.text }}>
              {editName ? `Editar: ${editName}` : 'Nuevo perfil de ancho de banda'}
            </div>

            {!editName && (
              <Field label="Nombre del perfil" hint="Sin espacios, ej: Plan-10Mbps, Visitante-2Mbps">
                <input style={inputStyle} value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} placeholder="Plan-10Mbps" />
              </Field>
            )}

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <Field label="Bajada máx. (Kbps)" hint="Ej: 10000 = 10 Mbps">
                <input style={inputStyle} type="number" value={form.bandwidth_down} onChange={e => setForm({ ...form, bandwidth_down: e.target.value })} placeholder="10000" />
              </Field>
              <Field label="Subida máx. (Kbps)" hint="Ej: 5000 = 5 Mbps">
                <input style={inputStyle} type="number" value={form.bandwidth_up} onChange={e => setForm({ ...form, bandwidth_up: e.target.value })} placeholder="5000" />
              </Field>
              <Field label="Tiempo sesión (seg)" hint="Ej: 3600 = 1 hora">
                <input style={inputStyle} type="number" value={form.session_timeout} onChange={e => setForm({ ...form, session_timeout: e.target.value })} placeholder="3600" />
              </Field>
              <Field label="Timeout inactivo (seg)" hint="Ej: 600 = 10 min">
                <input style={inputStyle} type="number" value={form.idle_timeout} onChange={e => setForm({ ...form, idle_timeout: e.target.value })} placeholder="600" />
              </Field>
              <Field label="Datos máx. (bytes)" hint="Ej: 1073741824 = 1 GB">
                <input style={inputStyle} type="number" value={form.max_octets} onChange={e => setForm({ ...form, max_octets: e.target.value })} placeholder="1073741824" />
              </Field>
              <Field label="Sesiones simultáneas">
                <input style={inputStyle} type="number" min={1} value={form.simultaneous_use} onChange={e => setForm({ ...form, simultaneous_use: e.target.value })} />
              </Field>
            </div>

            {/* Ayuda bytes */}
            <div style={{ background: C.bg, border: `1px solid ${C.border}`, borderRadius: 7, padding: '10px 14px', fontSize: 11, color: C.muted }}>
              💡 Referencia de bytes: 100 MB = 104857600 · 500 MB = 524288000 · 1 GB = 1073741824 · 5 GB = 5368709120
            </div>

            {msg && <div style={{ color: C.danger, fontSize: 13 }}>{msg}</div>}

            <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
              <button onClick={() => setModal(false)} style={styles.btnSecondary}>Cancelar</button>
              <button onClick={save} disabled={saving} style={{ ...styles.btnPrimary, opacity: saving ? 0.7 : 1 }}>
                {saving ? 'Guardando...' : editName ? 'Actualizar' : 'Crear perfil'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal asignar a usuario */}
      {assignModal && (
        <div style={{ position: 'fixed', inset: 0, background: '#000b', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100 }}>
          <div style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 14, padding: 28, width: 380, display: 'flex', flexDirection: 'column', gap: 14 }}>
            <div style={{ fontSize: 16, fontWeight: 700, color: C.text }}>Asignar perfil a usuario</div>
            <div style={{ fontSize: 13, color: C.muted }}>
              Perfil: <span style={{ color: C.accent, fontWeight: 600 }}>{assignModal}</span>
            </div>
            <Field label="Seleccionar usuario">
              <select style={inputStyle} value={selectedUser} onChange={e => setSelectedUser(e.target.value)}>
                <option value="">— Selecciona un usuario —</option>
                {users.map(u => (
                  <option key={u.username} value={u.username}>{u.username} {u.grupo ? `(${u.grupo})` : ''}</option>
                ))}
              </select>
            </Field>
            <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
              <button onClick={() => setAssignModal(null)} style={styles.btnSecondary}>Cancelar</button>
              <button onClick={assign} disabled={!selectedUser} style={{ ...styles.btnPrimary, opacity: !selectedUser ? 0.5 : 1 }}>
                Asignar
              </button>
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