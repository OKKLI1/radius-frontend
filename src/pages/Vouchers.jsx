import { useEffect, useState } from 'react'
import api from '../api/client'
import { C } from '../theme'

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

export default function Vouchers() {
  const [vouchers, setVouchers] = useState([])
  const [profiles, setProfiles] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [modal, setModal] = useState(false)
  const [generated, setGenerated] = useState(null)
  const [saving, setSaving] = useState(false)
  const [msg, setMsg] = useState('')
  const [form, setForm] = useState({
    quantity: 10, profile: '', prefix: '',
    validity_days: 30, simultaneous_use: 1,
  })

  const load = () => {
    setLoading(true)
    api.get('/vouchers').then(r => setVouchers(r.data)).finally(() => setLoading(false))
  }

  useEffect(() => {
    load()
    api.get('/profiles').then(r => setProfiles(r.data))
  }, [])

  const filtered = vouchers.filter(v =>
    v.code?.toLowerCase().includes(search.toLowerCase()) ||
    v.profile?.toLowerCase().includes(search.toLowerCase())
  )

  const generate = async () => {
    if (!form.profile) { setMsg('Selecciona un perfil'); return }
    setSaving(true); setMsg('')
    try {
      const { data } = await api.post('/vouchers/generate', form)
      setGenerated(data)
      load()
    } catch (e) {
      setMsg(e.response?.data?.detail || 'Error al generar')
    } finally { setSaving(false) }
  }

  const del = async (code) => {
    if (!confirm(`¿Eliminar voucher ${code}?`)) return
    await api.delete(`/vouchers/${code}`)
    load()
  }

  const delAll = async () => {
    if (!confirm('¿Eliminar TODOS los vouchers? Esta acción no se puede deshacer.')) return
    await api.delete('/vouchers/bulk/all')
    load()
  }

  const exportCsv = async () => {
    const token = localStorage.getItem('token')
    const res = await fetch('/api/vouchers/export', { headers: { Authorization: `Bearer ${token}` } })
    const blob = await res.blob()
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a'); a.href = url; a.download = 'vouchers.csv'; a.click()
    URL.revokeObjectURL(url)
  }

  const printVouchers = () => {
    if (!generated) return
    const win = window.open('', '_blank')
    win.document.write(`
      <html><head><title>Vouchers</title>
      <style>
        body { font-family: monospace; }
        .grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 10px; padding: 20px; }
        .card { border: 2px dashed #333; border-radius: 8px; padding: 14px; text-align: center; }
        .code { font-size: 18px; font-weight: bold; letter-spacing: 2px; color: #000; }
        .pass { font-size: 14px; color: #333; margin-top: 4px; }
        .info { font-size: 11px; color: #666; margin-top: 6px; }
        h2 { text-align: center; }
      </style></head><body>
      <h2>Vouchers de Acceso — ${generated.profile}</h2>
      <div class="grid">
        ${generated.vouchers.map(v => `
          <div class="card">
            <div class="code">${v.code}</div>
            <div class="pass">🔑 ${v.password}</div>
            <div class="info">Perfil: ${v.profile}</div>
            ${v.expiry ? `<div class="info">Vence: ${v.expiry}</div>` : ''}
          </div>
        `).join('')}
      </div>
      </body></html>
    `)
    win.document.close()
    win.print()
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20, color: C.text }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 10 }}>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 700, margin: 0 }}>Vouchers / Hotspot</h1>
          <p style={{ color: C.muted, fontSize: 13, margin: '4px 0 0' }}>{vouchers.length} vouchers generados</p>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          {vouchers.length > 0 && <>
            <button onClick={exportCsv} style={styles.btnSecondary}>📥 Exportar CSV</button>
            <button onClick={delAll} style={{ ...styles.btnSecondary, color: C.danger, borderColor: `${C.danger}44` }}>🗑 Eliminar todos</button>
          </>}
          <button onClick={() => { setModal(true); setGenerated(null); setMsg('') }} style={styles.btnPrimary}>+ Generar vouchers</button>
        </div>
      </div>

      {/* Búsqueda */}
      <input placeholder="Buscar por código o perfil..." value={search}
        onChange={e => setSearch(e.target.value)}
        style={{ ...inputStyle, maxWidth: 340 }} />

      {/* Tabla vouchers */}
      <div style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 12, overflow: 'auto' }}>
        {loading ? (
          <div style={{ color: C.muted, padding: 24 }}>Cargando...</div>
        ) : filtered.length === 0 ? (
          <div style={{ color: C.muted, padding: 32, textAlign: 'center' }}>
            <div style={{ fontSize: 28, marginBottom: 8 }}>🎟</div>
            <div>No hay vouchers generados.</div>
            <button onClick={() => setModal(true)} style={{ ...styles.btnPrimary, marginTop: 12 }}>Generar ahora</button>
          </div>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
            <thead>
              <tr>{['Código', 'Contraseña', 'Perfil', 'Vencimiento', 'Sesiones activas', 'Último uso', 'Acción'].map(h => (
                <th key={h} style={styles.th}>{h}</th>
              ))}</tr>
            </thead>
            <tbody>
              {filtered.map(v => (
                <tr key={v.code} style={{ borderBottom: `1px solid ${C.border}15` }}>
                  <td style={{ ...styles.td, fontFamily: 'monospace', color: C.accent, fontWeight: 700 }}>{v.code}</td>
                  <td style={{ ...styles.td, fontFamily: 'monospace', fontSize: 12 }}>{v.password}</td>
                  <td style={{ ...styles.td }}>
                    <span style={{ background: `${C.accent}18`, color: C.accent, border: `1px solid ${C.accent}33`, padding: '2px 8px', borderRadius: 12, fontSize: 11 }}>
                      {v.profile || '—'}
                    </span>
                  </td>
                  <td style={{ ...styles.td, fontSize: 12, color: C.muted }}>{v.expiry || 'Sin límite'}</td>
                  <td style={{ ...styles.td, textAlign: 'center' }}>
                    {v.active_sessions > 0
                      ? <span style={{ color: C.green, fontWeight: 600 }}>🟢 {v.active_sessions}</span>
                      : <span style={{ color: C.muted }}>—</span>}
                  </td>
                  <td style={{ ...styles.td, fontSize: 12, color: C.muted }}>{v.last_used ? v.last_used.slice(0, 16).replace('T', ' ') : '—'}</td>
                  <td style={styles.td}>
                    <button onClick={() => del(v.code)} style={{ background: `${C.danger}22`, color: C.danger, border: `1px solid ${C.danger}44`, padding: '4px 10px', borderRadius: 5, fontSize: 11, cursor: 'pointer', fontFamily: "'Sora', sans-serif" }}>
                      Eliminar
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Modal generar */}
      {modal && (
        <div style={{ position: 'fixed', inset: 0, background: '#000b', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100 }}>
          <div style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 14, padding: 28, width: 460, display: 'flex', flexDirection: 'column', gap: 16, maxHeight: '90vh', overflowY: 'auto' }}>

            {!generated ? (
              <>
                <div style={{ fontSize: 16, fontWeight: 700 }}>Generar vouchers</div>

                <Field label="Perfil de ancho de banda">
                  <select style={inputStyle} value={form.profile} onChange={e => setForm({ ...form, profile: e.target.value })}>
                    <option value="">— Selecciona un perfil —</option>
                    {profiles.map(p => <option key={p.name} value={p.name}>{p.name}</option>)}
                  </select>
                </Field>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                  <Field label="Cantidad" hint="Máx. 500">
                    <input style={inputStyle} type="number" min={1} max={500} value={form.quantity} onChange={e => setForm({ ...form, quantity: Number(e.target.value) })} />
                  </Field>
                  <Field label="Prefijo (opcional)" hint='Ej: "VIP-" → VIP-ABC123'>
                    <input style={inputStyle} value={form.prefix} onChange={e => setForm({ ...form, prefix: e.target.value })} placeholder="VIP-" />
                  </Field>
                  <Field label="Validez (días)" hint="0 = sin límite">
                    <input style={inputStyle} type="number" min={0} value={form.validity_days} onChange={e => setForm({ ...form, validity_days: Number(e.target.value) })} />
                  </Field>
                  <Field label="Sesiones simultáneas">
                    <input style={inputStyle} type="number" min={1} value={form.simultaneous_use} onChange={e => setForm({ ...form, simultaneous_use: Number(e.target.value) })} />
                  </Field>
                </div>

                {msg && <div style={{ color: C.danger, fontSize: 13 }}>{msg}</div>}

                <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
                  <button onClick={() => setModal(false)} style={styles.btnSecondary}>Cancelar</button>
                  <button onClick={generate} disabled={saving} style={{ ...styles.btnPrimary, opacity: saving ? 0.7 : 1 }}>
                    {saving ? 'Generando...' : `Generar ${form.quantity} vouchers`}
                  </button>
                </div>
              </>
            ) : (
              <>
                <div style={{ fontSize: 16, fontWeight: 700, color: C.green }}>
                  ✅ {generated.generated} vouchers generados
                </div>
                <div style={{ fontSize: 13, color: C.muted }}>Perfil: <span style={{ color: C.accent }}>{generated.profile}</span></div>

                {/* Preview primeros 5 */}
                <div style={{ background: C.bg, border: `1px solid ${C.border}`, borderRadius: 8, padding: 12, maxHeight: 200, overflowY: 'auto' }}>
                  {generated.vouchers.slice(0, 20).map(v => (
                    <div key={v.code} style={{ display: 'flex', gap: 16, padding: '4px 0', borderBottom: `1px solid ${C.border}20`, fontFamily: 'monospace', fontSize: 12 }}>
                      <span style={{ color: C.accent, minWidth: 160 }}>{v.code}</span>
                      <span style={{ color: C.muted }}>{v.password}</span>
                    </div>
                  ))}
                  {generated.vouchers.length > 20 && (
                    <div style={{ color: C.muted, fontSize: 11, padding: '4px 0' }}>
                      ... y {generated.vouchers.length - 20} más
                    </div>
                  )}
                </div>

                <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
                  <button onClick={() => setModal(false)} style={styles.btnSecondary}>Cerrar</button>
                  <button onClick={printVouchers} style={{ ...styles.btnSecondary, color: C.warn, borderColor: `${C.warn}44` }}>🖨 Imprimir</button>
                  <button onClick={exportCsv} style={styles.btnPrimary}>📥 Descargar CSV</button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

const styles = {
  th: { padding: '10px 14px', textAlign: 'left', color: C.muted, fontSize: 11, textTransform: 'uppercase', letterSpacing: 1, fontWeight: 600, borderBottom: `1px solid ${C.border}`, whiteSpace: 'nowrap' },
  td: { padding: '10px 14px', color: C.text, whiteSpace: 'nowrap' },
  btnPrimary: { background: C.accent, color: '#000', border: 'none', padding: '9px 18px', borderRadius: 7, fontWeight: 700, fontSize: 13, cursor: 'pointer', fontFamily: "'Sora', sans-serif" },
  btnSecondary: { background: 'transparent', color: C.muted, border: `1px solid ${C.border}`, padding: '9px 18px', borderRadius: 7, fontSize: 13, cursor: 'pointer', fontFamily: "'Sora', sans-serif" },
}