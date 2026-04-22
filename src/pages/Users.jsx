import { useEffect, useState } from 'react'
import api from '../api/client'




import { C } from '../theme'
const EMPTY = { username: '', password: '', group: '', expiry: '', simultaneous_use: 1 }

function Badge({ active }) {
  const color = active ? C.green : C.danger
  return (
    <span style={{ background: `${color}22`, color, border: `1px solid ${color}55`, padding: '2px 10px', borderRadius: 20, fontSize: 11, fontWeight: 600 }}>
      {active ? 'Activo' : 'Bloqueado'}
    </span>
  )
}

function Modal({ title, onClose, children }) {
  return (
    <div style={{ position: 'fixed', inset: 0, background: '#000b', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100 }}>
      <div style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 14, padding: 28, width: 400, display: 'flex', flexDirection: 'column', gap: 16 }}>
        <div style={{ fontSize: 16, fontWeight: 700, color: C.text }}>{title}</div>
        {children}
      </div>
    </div>
  )
}

function Field({ label, children }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
      <label style={{ fontSize: 11, color: C.muted, fontWeight: 600, textTransform: 'uppercase', letterSpacing: 1 }}>{label}</label>
      {children}
    </div>
  )
}

const inputStyle = { background: C.bg, border: `1px solid ${C.border}`, color: C.text, padding: '9px 12px', borderRadius: 7, fontSize: 13, fontFamily: "'Sora', sans-serif", width: '100%', boxSizing: 'border-box', outline: 'none' }

export default function Users() {
  const [users, setUsers] = useState([])
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)
  const [modal, setModal] = useState(null)
  const [form, setForm] = useState(EMPTY)
  const [saving, setSaving] = useState(false)
  const [msg, setMsg] = useState('')
  const [groups, setGroups] = useState([])   // ← AQUÍ adentro

  const load = () => {
    setLoading(true)
    api.get('/users').then(r => setUsers(r.data)).finally(() => setLoading(false))
  }

  useEffect(() => {
    load()
    api.get('/groups').then(r => setGroups(r.data))
  }, [])

  useEffect(() => {
  load()
  api.get('/groups').then(r => setGroups(r.data))
}, [])

// ← AGREGAR AQUÍ
const filtered = users.filter(u =>
  u.username?.toLowerCase().includes(search.toLowerCase()) ||
  u.grupo?.toLowerCase().includes(search.toLowerCase())
)

  function openCreate() { setForm(EMPTY); setModal('create') }
  const openEdit = (u) => { setForm({ username: u.username, password: '', group: u.grupo || '', expiry: u.expiry || '', simultaneous_use: u.simultaneous_use || 1 }); setModal('edit') }
  const closeModal = () => { setModal(null); setMsg('') }

  const save = async () => {
    setSaving(true)
    setMsg('')
    try {
      if (modal === 'create') {
        await api.post('/users', form)
      } else {
        const payload = {}
        if (form.password) payload.password = form.password
        if (form.group) payload.group = form.group
        if (form.expiry) payload.expiry = form.expiry
        if (form.simultaneous_use) payload.simultaneous_use = Number(form.simultaneous_use)
        await api.put(`/users/${form.username}`, payload)
      }
      load(); closeModal()
    } catch (e) {
      setMsg(e.response?.data?.detail || 'Error al guardar')
    } finally {
      setSaving(false)
    }
  }

  const deleteUser = async (username) => {
    if (!confirm(`¿Eliminar usuario ${username}?`)) return
    await api.delete(`/users/${username}`)
    load()
  }

  const toggleUser = async (u) => {
    const isBlocked = u.attributes?.some(a => a.attribute === 'Auth-Type')
    if (isBlocked) await api.post(`/users/${u.username}/enable`)
    else await api.post(`/users/${u.username}/disable`)
    load()
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20, color: C.text }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 700, margin: 0 }}>Usuarios RADIUS</h1>
          <p style={{ color: C.muted, fontSize: 13, margin: '4px 0 0' }}>{users.length} usuarios registrados</p>
        </div>
        <button onClick={openCreate} style={styles.btnPrimary}>+ Nuevo usuario</button>
      </div>

      <input placeholder="Buscar por usuario o grupo..." value={search}
        onChange={e => setSearch(e.target.value)} style={{ ...inputStyle, maxWidth: 320 }} />

      <div style={styles.card}>
        {loading ? (
          <div style={{ color: C.muted, padding: 20 }}>Cargando...</div>
        ) : filtered.length === 0 ? (
          <div style={{ color: C.muted, padding: 20 }}>No hay usuarios{search ? ' que coincidan' : ''}.</div>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
            <thead>
              <tr>{['Usuario', 'Grupo', 'Estado', 'Vencimiento', 'Sesiones máx.', 'Acciones'].map(h => (
                <th key={h} style={styles.th}>{h}</th>
              ))}</tr>
            </thead>
            <tbody>
              {filtered.map(u => {
                const blocked = u.attributes?.some(a => a.attribute === 'Auth-Type')
                return (
                  <tr key={u.username} style={{ borderBottom: `1px solid ${C.border}20` }}>
                    <td style={{ ...styles.td, color: C.accent, fontFamily: 'monospace', fontWeight: 600 }}>{u.username}</td>
                    <td style={styles.td}>{u.grupo || <span style={{ color: C.muted }}>—</span>}</td>
                    <td style={styles.td}><Badge active={!blocked} /></td>
                    <td style={{ ...styles.td, color: C.muted, fontSize: 12 }}>{u.expiry || '—'}</td>
                    <td style={{ ...styles.td, color: C.muted }}>{u.simultaneous_use || 1}</td>
                    <td style={{ ...styles.td, display: 'flex', gap: 6 }}>
                      <button onClick={() => openEdit(u)} style={styles.btnSm}>Editar</button>
                      <button onClick={() => toggleUser(u)} style={{ ...styles.btnSm, color: blocked ? C.green : C.warn, borderColor: blocked ? C.green : C.warn }}>
                        {blocked ? 'Habilitar' : 'Bloquear'}
                      </button>
                      <button onClick={() => deleteUser(u.username)} style={{ ...styles.btnSm, color: C.danger, borderColor: C.danger }}>Eliminar</button>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        )}
      </div>

      {modal && (
        <Modal title={modal === 'create' ? 'Nuevo usuario' : `Editar: ${form.username}`} onClose={closeModal}>
          {modal === 'create' && (
            <Field label="Usuario">
              <input style={inputStyle} value={form.username} onChange={e => setForm({ ...form, username: e.target.value })} placeholder="nombre_usuario" />
            </Field>
          )}
          <Field label={modal === 'create' ? 'Contraseña' : 'Nueva contraseña (dejar vacío = no cambiar)'}>
            <input style={inputStyle} type="password" value={form.password} onChange={e => setForm({ ...form, password: e.target.value })} placeholder="••••••••" />
          </Field>
          <Field label="Grupo">
            <select style={inputStyle} value={form.group} onChange={e => setForm({ ...form, group: e.target.value })}>
              <option value="">— Sin grupo —</option>
              {groups.map(g => (
                <option key={g.groupname} value={g.groupname}>{g.groupname}</option>
              ))}
            </select>
          </Field>
          <Field label="Fecha de vencimiento">
            <input style={inputStyle} type="date" value={form.expiry} onChange={e => setForm({ ...form, expiry: e.target.value })} />
          </Field>
          <Field label="Sesiones simultáneas máx.">
            <input style={inputStyle} type="number" min={1} value={form.simultaneous_use} onChange={e => setForm({ ...form, simultaneous_use: e.target.value })} />
          </Field>
          {msg && <div style={{ color: C.danger, fontSize: 13 }}>{msg}</div>}
          <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
            <button onClick={closeModal} style={styles.btnSecondary}>Cancelar</button>
            <button onClick={save} disabled={saving} style={{ ...styles.btnPrimary, opacity: saving ? 0.7 : 1 }}>
              {saving ? 'Guardando...' : 'Guardar'}
            </button>
          </div>
        </Modal>
      )}
    </div>
  )
}

const styles = {
  card: { background: C.surface, border: `1px solid ${C.border}`, borderRadius: 12, overflow: 'hidden' },
  th: { padding: '10px 14px', textAlign: 'left', color: C.muted, fontSize: 11, textTransform: 'uppercase', letterSpacing: 1, fontWeight: 600, borderBottom: `1px solid ${C.border}` },
  td: { padding: '11px 14px', color: C.text },
  btnPrimary: { background: C.accent, color: '#000', border: 'none', padding: '9px 18px', borderRadius: 7, fontWeight: 700, fontSize: 13, cursor: 'pointer', fontFamily: "'Sora', sans-serif" },
  btnSecondary: { background: 'transparent', color: C.muted, border: `1px solid ${C.border}`, padding: '9px 18px', borderRadius: 7, fontSize: 13, cursor: 'pointer', fontFamily: "'Sora', sans-serif" },
  btnSm: { background: 'transparent', color: C.accent, border: `1px solid ${C.accent}44`, padding: '4px 10px', borderRadius: 5, fontSize: 11, cursor: 'pointer', fontFamily: "'Sora', sans-serif" },
}
