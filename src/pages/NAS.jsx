import { useEffect, useState } from 'react'
import api from '../api/client'

const C = {
  bg: '#0d1117', surface: '#161b22', border: '#30363d',
  accent: '#00d4aa', text: '#e6edf3', muted: '#8b949e',
  green: '#3fb950', danger: '#f85149',
}

const EMPTY = { nasname: '', shortname: '', type: 'other', ports: 1812, secret: '', description: '' }
const inputStyle = { background: C.bg, border: `1px solid ${C.border}`, color: C.text, padding: '9px 12px', borderRadius: 7, fontSize: 13, fontFamily: "'Sora', sans-serif", width: '100%', boxSizing: 'border-box', outline: 'none' }

function Field({ label, children }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
      <label style={{ fontSize: 11, color: C.muted, fontWeight: 600, textTransform: 'uppercase', letterSpacing: 1 }}>{label}</label>
      {children}
    </div>
  )
}

export default function NAS() {
  const [list, setList] = useState([])
  const [loading, setLoading] = useState(true)
  const [modal, setModal] = useState(null)
  const [form, setForm] = useState(EMPTY)
  const [saving, setSaving] = useState(false)
  const [msg, setMsg] = useState('')

  const load = () => {
    setLoading(true)
    api.get('/nas').then(r => setList(r.data)).finally(() => setLoading(false))
  }

  useEffect(() => { load() }, [])

  const openCreate = () => { setForm(EMPTY); setModal('create') }
  const openEdit = (n) => { setForm({ nasname: n.nasname, shortname: n.shortname, type: n.type, ports: n.ports, secret: n.secret, description: n.description || '' }); setModal(n.id) }
  const closeModal = () => { setModal(null); setMsg('') }

  const save = async () => {
    setSaving(true); setMsg('')
    try {
      if (modal === 'create') await api.post('/nas', form)
      else {
        const { nasname, ...payload } = form
        await api.put(`/nas/${modal}`, payload)
      }
      load(); closeModal()
    } catch (e) {
      setMsg(e.response?.data?.detail || 'Error al guardar')
    } finally { setSaving(false) }
  }

  const del = async (id, name) => {
    if (!confirm(`¿Eliminar NAS "${name}"?`)) return
    await api.delete(`/nas/${id}`)
    load()
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20, color: C.text }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 700, margin: 0 }}>Clientes NAS</h1>
          <p style={{ color: C.muted, fontSize: 13, margin: '4px 0 0' }}>Access Points, switches y routers registrados</p>
        </div>
        <button onClick={openCreate} style={styles.btnPrimary}>+ Agregar NAS</button>
      </div>

      {loading ? (
        <div style={{ color: C.muted }}>Cargando...</div>
      ) : list.length === 0 ? (
        <div style={{ color: C.muted, background: C.surface, border: `1px solid ${C.border}`, borderRadius: 12, padding: 24 }}>
          No hay clientes NAS registrados.
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {list.map(n => (
            <div key={n.id} style={styles.nasCard}>
              <div style={{ position: 'absolute', top: 0, left: 0, bottom: 0, width: 3, background: C.accent, borderRadius: '12px 0 0 12px' }} />
              <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                <div style={{ width: 10, height: 10, borderRadius: '50%', background: C.green, boxShadow: `0 0 8px ${C.green}`, flexShrink: 0 }} />
                <div>
                  <div style={{ fontWeight: 700, fontSize: 15 }}>{n.shortname}</div>
                  <div style={{ fontSize: 12, color: C.muted, fontFamily: 'monospace' }}>{n.nasname}:{n.ports}</div>
                </div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 20, flexWrap: 'wrap' }}>
                <span style={{ background: `${C.accent}18`, color: C.accent, border: `1px solid ${C.accent}33`, padding: '3px 12px', borderRadius: 20, fontSize: 12 }}>{n.type}</span>
                <span style={{ fontFamily: 'monospace', fontSize: 12, color: C.muted }}>secret: {n.secret}</span>
                {n.description && <span style={{ fontSize: 12, color: C.muted }}>{n.description}</span>}
                <div style={{ marginLeft: 'auto', display: 'flex', gap: 8 }}>
                  <button onClick={() => openEdit(n)} style={styles.btnSm}>Editar</button>
                  <button onClick={() => del(n.id, n.shortname)} style={{ ...styles.btnSm, color: C.danger, borderColor: `${C.danger}44` }}>Eliminar</button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {modal !== null && (
        <div style={{ position: 'fixed', inset: 0, background: '#000b', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100 }}>
          <div style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 14, padding: 28, width: 420, display: 'flex', flexDirection: 'column', gap: 14 }}>
            <div style={{ fontSize: 16, fontWeight: 700, color: C.text }}>{modal === 'create' ? 'Nuevo NAS' : 'Editar NAS'}</div>
            {modal === 'create' && (
              <Field label="IP / Hostname">
                <input style={inputStyle} value={form.nasname} onChange={e => setForm({ ...form, nasname: e.target.value })} placeholder="192.168.1.10" />
              </Field>
            )}
            <Field label="Nombre corto">
              <input style={inputStyle} value={form.shortname} onChange={e => setForm({ ...form, shortname: e.target.value })} placeholder="AP-Piso1" />
            </Field>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <Field label="Tipo">
                <select style={inputStyle} value={form.type} onChange={e => setForm({ ...form, type: e.target.value })}>
                  {['other', 'cisco', 'mikrotik', 'ubiquiti', 'ruckus', 'motorola'].map(t => <option key={t}>{t}</option>)}
                </select>
              </Field>
              <Field label="Puerto">
                <input style={inputStyle} type="number" value={form.ports} onChange={e => setForm({ ...form, ports: Number(e.target.value) })} />
              </Field>
            </div>
            <Field label="Shared Secret">
              <input style={inputStyle} value={form.secret} onChange={e => setForm({ ...form, secret: e.target.value })} placeholder="testing123" />
            </Field>
            <Field label="Descripción (opcional)">
              <input style={inputStyle} value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} placeholder="Acceso piso 1" />
            </Field>
            {msg && <div style={{ color: C.danger, fontSize: 13 }}>{msg}</div>}
            <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
              <button onClick={closeModal} style={styles.btnSecondary}>Cancelar</button>
              <button onClick={save} disabled={saving} style={{ ...styles.btnPrimary, opacity: saving ? 0.7 : 1 }}>{saving ? 'Guardando...' : 'Guardar'}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

const styles = {
  nasCard: { background: C.surface, border: `1px solid ${C.border}`, borderRadius: 12, padding: '16px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16, position: 'relative', flexWrap: 'wrap' },
  btnPrimary: { background: C.accent, color: '#000', border: 'none', padding: '9px 18px', borderRadius: 7, fontWeight: 700, fontSize: 13, cursor: 'pointer', fontFamily: "'Sora', sans-serif" },
  btnSecondary: { background: 'transparent', color: C.muted, border: `1px solid ${C.border}`, padding: '9px 18px', borderRadius: 7, fontSize: 13, cursor: 'pointer', fontFamily: "'Sora', sans-serif" },
  btnSm: { background: 'transparent', color: C.accent, border: `1px solid ${C.accent}44`, padding: '5px 12px', borderRadius: 5, fontSize: 12, cursor: 'pointer', fontFamily: "'Sora', sans-serif" },
}
