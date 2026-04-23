import { useEffect, useState } from 'react'
import api from '../api/client'
import { C, btnPrimary, btnSecondary, btnDanger, inputStyle, th, td, card } from '../theme'

function Field({ label, children }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
      <label style={{ fontSize: 11, color: C.muted, fontWeight: 600, textTransform: 'uppercase', letterSpacing: 1 }}>
        {label}
      </label>
      {children}
    </div>
  )
}

function emptyFromFields(fields) {
  const out = {}
  fields.forEach((f) => {
    out[f.name] = f.defaultValue ?? ''
  })
  return out
}

export default function ModuleCrudPage({
  title,
  subtitle,
  endpoint,
  fields,
  columns,
  keyField = 'id',
}) {
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [msg, setMsg] = useState('')
  const [modal, setModal] = useState(null)
  const [form, setForm] = useState(() => emptyFromFields(fields))

  const load = () => {
    setLoading(true)
    setMsg('')
    api.get(endpoint)
      .then((r) => setItems(Array.isArray(r.data) ? r.data : []))
      .catch((e) => setMsg(e.response?.data?.detail || `Error cargando ${title}`))
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [endpoint])

  const openCreate = () => {
    setForm(emptyFromFields(fields))
    setModal('create')
  }

  const openEdit = (item) => {
    const next = emptyFromFields(fields)
    fields.forEach((f) => {
      next[f.name] = item[f.name] ?? f.defaultValue ?? ''
    })
    setForm(next)
    setModal(item[keyField] ?? item.id)
  }

  const closeModal = () => {
    setModal(null)
    setMsg('')
  }

  const save = async () => {
    setSaving(true)
    setMsg('')
    try {
      const payload = {}
      fields.forEach((f) => {
        let value = form[f.name]
        if (f.type === 'number' && value !== '') value = Number(value)
        payload[f.name] = value
      })
      if (modal === 'create') {
        await api.post(endpoint, payload)
      } else {
        await api.put(`${endpoint}/${encodeURIComponent(modal)}`, payload)
      }
      closeModal()
      load()
    } catch (e) {
      setMsg(e.response?.data?.detail || 'Error al guardar')
    } finally {
      setSaving(false)
    }
  }

  const removeItem = async (item) => {
    const id = item[keyField] ?? item.id
    if (id === undefined || id === null) {
      setMsg('No se pudo identificar el registro para eliminar')
      return
    }
    if (!confirm(`Eliminar registro ${id}?`)) return
    try {
      await api.delete(`${endpoint}/${encodeURIComponent(id)}`)
      load()
    } catch (e) {
      setMsg(e.response?.data?.detail || 'Error al eliminar')
    }
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20, color: C.text }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 700, margin: 0 }}>{title}</h1>
          <p style={{ color: C.muted, fontSize: 13, margin: '4px 0 0' }}>{subtitle}</p>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button onClick={load} style={btnSecondary}>Actualizar</button>
          <button onClick={openCreate} style={btnPrimary}>+ Nuevo</button>
        </div>
      </div>

      {msg && (
        <div style={{ background: `${C.danger}22`, border: `1px solid ${C.danger}44`, color: C.danger, padding: '10px 14px', borderRadius: 8, fontSize: 13 }}>
          {msg}
        </div>
      )}

      <div style={{ ...card, padding: 0, overflow: 'auto' }}>
        {loading ? (
          <div style={{ color: C.muted, padding: 20 }}>Cargando...</div>
        ) : items.length === 0 ? (
          <div style={{ color: C.muted, padding: 20 }}>Sin registros aun.</div>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
            <thead>
              <tr>
                {columns.map((c) => <th key={c.key} style={th}>{c.label}</th>)}
                <th style={th}>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {items.map((item, idx) => {
                const rowId = item[keyField] ?? item.id ?? idx
                return (
                  <tr key={rowId} style={{ borderBottom: `1px solid ${C.border}20` }}>
                    {columns.map((c) => (
                      <td key={c.key} style={td}>
                        {item[c.key] ?? '-'}
                      </td>
                    ))}
                    <td style={{ ...td, display: 'flex', gap: 8 }}>
                      <button onClick={() => openEdit(item)} style={btnSecondary}>Editar</button>
                      <button onClick={() => removeItem(item)} style={btnDanger}>Eliminar</button>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        )}
      </div>

      {modal !== null && (
        <div style={{ position: 'fixed', inset: 0, background: '#000b', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100 }}>
          <div style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 14, padding: 28, width: 520, display: 'flex', flexDirection: 'column', gap: 14 }}>
            <div style={{ fontSize: 16, fontWeight: 700, color: C.text }}>
              {modal === 'create' ? `Nuevo ${title}` : `Editar ${title}`}
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              {fields.map((f) => (
                <Field key={f.name} label={f.label}>
                  <input
                    type={f.type || 'text'}
                    required={!!f.required}
                    style={inputStyle}
                    value={form[f.name]}
                    placeholder={f.placeholder || ''}
                    onChange={(e) => setForm((prev) => ({ ...prev, [f.name]: e.target.value }))}
                  />
                </Field>
              ))}
            </div>

            <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
              <button onClick={closeModal} style={btnSecondary}>Cancelar</button>
              <button onClick={save} disabled={saving} style={{ ...btnPrimary, opacity: saving ? 0.7 : 1 }}>
                {saving ? 'Guardando...' : 'Guardar'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
