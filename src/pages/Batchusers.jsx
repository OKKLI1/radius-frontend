import { useState, useRef } from 'react'
import api from '../api/client'
import { C } from '../theme'

function ResultRow({ item }) {
  const ok = item.status === 'ok'
  return (
    <tr style={{ borderBottom: `1px solid ${C.border}15` }}>
      <td style={{ padding: '8px 14px', fontFamily: 'monospace', fontSize: 12, color: C.muted }}>{item.line}</td>
      <td style={{ padding: '8px 14px', fontFamily: 'monospace', color: ok ? C.accent : C.danger, fontWeight: 600 }}>{item.username}</td>
      <td style={{ padding: '8px 14px', fontSize: 12, color: C.muted }}>{item.group || '—'}</td>
      <td style={{ padding: '8px 14px', fontSize: 12, color: C.muted }}>{item.expiry || '—'}</td>
      <td style={{ padding: '8px 14px' }}>
        <span style={{
          background: ok ? `${C.green}22` : `${C.danger}22`,
          color: ok ? C.green : C.danger,
          border: `1px solid ${ok ? C.green : C.danger}44`,
          padding: '2px 10px', borderRadius: 20, fontSize: 11, fontWeight: 600
        }}>
          {ok ? '✓ OK' : '✗ Error'}
        </span>
      </td>
      <td style={{ padding: '8px 14px', fontSize: 11, color: C.danger }}>{item.errors?.join(', ')}</td>
    </tr>
  )
}

export default function BatchUsers() {
  const [tab, setTab] = useState('import')
  const [file, setFile] = useState(null)
  const [preview, setPreview] = useState(null)
  const [result, setResult] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const fileRef = useRef()

  const handleFile = (e) => {
    const f = e.target.files[0]
    if (!f) return
    setFile(f)
    setPreview(null)
    setResult(null)
    setError('')
  }

  const handlePreview = async () => {
    if (!file) return
    setLoading(true); setError('')
    try {
      const fd = new FormData()
      fd.append('file', file)
      const { data } = await api.post('/batch/preview', fd, {
        headers: { 'Content-Type': 'multipart/form-data' }
      })
      setPreview(data)
    } catch (e) {
      setError(e.response?.data?.detail || 'Error al procesar el archivo')
    } finally { setLoading(false) }
  }

  const handleImport = async () => {
    if (!file) return
    if (!confirm(`¿Importar ${preview?.ok} usuarios válidos?`)) return
    setLoading(true); setError('')
    try {
      const fd = new FormData()
      fd.append('file', file)
      const { data } = await api.post('/batch/import', fd, {
        headers: { 'Content-Type': 'multipart/form-data' }
      })
      setResult(data)
      setPreview(null)
      setFile(null)
      if (fileRef.current) fileRef.current.value = ''
    } catch (e) {
      setError(e.response?.data?.detail || 'Error al importar')
    } finally { setLoading(false) }
  }

  const handleExport = async () => {
    try {
      const token = localStorage.getItem('token')
      const res = await fetch('/api/batch/export', {
        headers: { Authorization: `Bearer ${token}` }
      })
      const blob = await res.blob()
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url; a.download = 'usuarios_radius.csv'; a.click()
      URL.revokeObjectURL(url)
    } catch { setError('Error al exportar') }
  }

  const handleTemplate = async () => {
    try {
      const token = localStorage.getItem('token')
      const res = await fetch('/api/batch/template', {
        headers: { Authorization: `Bearer ${token}` }
      })
      const blob = await res.blob()
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url; a.download = 'plantilla_usuarios.csv'; a.click()
      URL.revokeObjectURL(url)
    } catch { setError('Error al descargar plantilla') }
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20, color: C.text }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 700, margin: 0 }}>Usuarios en Lote</h1>
          <p style={{ color: C.muted, fontSize: 13, margin: '4px 0 0' }}>Importar y exportar múltiples usuarios via CSV</p>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button onClick={handleTemplate} style={styles.btnSecondary}>
            📥 Descargar plantilla
          </button>
          <button onClick={handleExport} style={styles.btnSecondary}>
            📤 Exportar usuarios
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: 4, background: C.surface, border: `1px solid ${C.border}`, borderRadius: 8, padding: 4, width: 'fit-content' }}>
        {[['import', '📂 Importar CSV'], ['export', '📊 Exportar']].map(([key, label]) => (
          <button key={key} onClick={() => setTab(key)} style={{
            background: tab === key ? C.accent : 'transparent',
            color: tab === key ? '#000' : C.muted,
            border: 'none', padding: '7px 18px', borderRadius: 6,
            fontWeight: tab === key ? 700 : 400, fontSize: 13,
            cursor: 'pointer', fontFamily: "'Sora', sans-serif",
          }}>{label}</button>
        ))}
      </div>

      {tab === 'import' && (
        <>
          {/* Upload area */}
          <div style={styles.card}>
            <div style={{ fontSize: 13, fontWeight: 600, color: C.muted, marginBottom: 16, textTransform: 'uppercase', letterSpacing: 1 }}>
              Seleccionar archivo CSV
            </div>

            {/* Formato esperado */}
            <div style={{ background: C.bg, border: `1px solid ${C.border}`, borderRadius: 8, padding: '12px 16px', marginBottom: 16 }}>
              <div style={{ fontSize: 11, color: C.muted, marginBottom: 6, textTransform: 'uppercase', letterSpacing: 1 }}>Formato requerido</div>
              <code style={{ fontSize: 12, color: C.accent, fontFamily: 'monospace' }}>
                username,password,group,expiry<br />
                jlopez,clave123,empleados,2027-12-31<br />
                mmartinez,pass456,visitantes,<br />
              </code>
              <div style={{ fontSize: 11, color: C.muted, marginTop: 8 }}>
                * <code style={{ color: C.accent }}>username</code> y <code style={{ color: C.accent }}>password</code> son obligatorios. <code style={{ color: C.muted }}>group</code> y <code style={{ color: C.muted }}>expiry</code> son opcionales.
              </div>
            </div>

            <div style={{ display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap' }}>
              <input
                ref={fileRef}
                type="file"
                accept=".csv"
                onChange={handleFile}
                style={{ color: C.text, fontSize: 13 }}
              />
              {file && (
                <span style={{ fontSize: 12, color: C.green }}>
                  ✓ {file.name} ({(file.size / 1024).toFixed(1)} KB)
                </span>
              )}
            </div>

            {error && (
              <div style={{ marginTop: 12, background: `${C.danger}22`, border: `1px solid ${C.danger}44`, color: C.danger, padding: '10px 14px', borderRadius: 7, fontSize: 13 }}>
                {error}
              </div>
            )}

            <div style={{ display: 'flex', gap: 10, marginTop: 16 }}>
              <button
                onClick={handlePreview}
                disabled={!file || loading}
                style={{ ...styles.btnSecondary, opacity: (!file || loading) ? 0.5 : 1 }}
              >
                {loading ? 'Procesando...' : '🔍 Previsualizar'}
              </button>
              {preview && preview.ok > 0 && (
                <button
                  onClick={handleImport}
                  disabled={loading}
                  style={{ ...styles.btnPrimary, opacity: loading ? 0.7 : 1 }}
                >
                  {loading ? 'Importando...' : `✅ Importar ${preview.ok} usuarios válidos`}
                </button>
              )}
            </div>
          </div>

          {/* Preview */}
          {preview && (
            <div style={styles.card}>
              {/* Stats */}
              <div style={{ display: 'flex', gap: 16, marginBottom: 16, flexWrap: 'wrap' }}>
                <div style={styles.statBadge(C.muted)}>Total: {preview.total}</div>
                <div style={styles.statBadge(C.green)}>✓ Válidos: {preview.ok}</div>
                <div style={styles.statBadge(C.danger)}>✗ Con errores: {preview.errors}</div>
              </div>

              <div style={{ fontSize: 13, fontWeight: 600, color: C.muted, marginBottom: 12, textTransform: 'uppercase', letterSpacing: 1 }}>
                Previsualización
              </div>

              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                  <thead>
                    <tr>{['Línea', 'Usuario', 'Grupo', 'Vencimiento', 'Estado', 'Errores'].map(h => (
                      <th key={h} style={styles.th}>{h}</th>
                    ))}</tr>
                  </thead>
                  <tbody>
                    {preview.preview.map((item, i) => <ResultRow key={i} item={item} />)}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Resultado final */}
          {result && (
            <div style={{ ...styles.card, border: `1px solid ${C.green}44` }}>
              <div style={{ fontSize: 16, fontWeight: 700, color: C.green, marginBottom: 12 }}>
                ✅ Importación completada
              </div>
              <div style={{ display: 'flex', gap: 16, marginBottom: 16, flexWrap: 'wrap' }}>
                <div style={styles.statBadge(C.green)}>Creados: {result.created_count}</div>
                <div style={styles.statBadge(C.warn)}>Omitidos: {result.skipped_count}</div>
              </div>
              {result.skipped.length > 0 && (
                <div>
                  <div style={{ fontSize: 12, color: C.muted, marginBottom: 8 }}>Usuarios omitidos:</div>
                  {result.skipped.map((s, i) => (
                    <div key={i} style={{ fontSize: 12, color: C.warn, fontFamily: 'monospace', marginBottom: 4 }}>
                      {s.username} — {s.reason}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </>
      )}

      {tab === 'export' && (
        <div style={styles.card}>
          <div style={{ fontSize: 13, fontWeight: 600, color: C.muted, marginBottom: 16, textTransform: 'uppercase', letterSpacing: 1 }}>
            Exportar usuarios
          </div>
          <p style={{ color: C.muted, fontSize: 14, marginBottom: 20 }}>
            Descarga todos los usuarios registrados en formato CSV. El archivo incluye usuario, contraseña, grupo y fecha de vencimiento.
          </p>
          <div style={{ display: 'flex', gap: 10 }}>
            <button onClick={handleExport} style={styles.btnPrimary}>
              📥 Descargar CSV completo
            </button>
            <button onClick={handleTemplate} style={styles.btnSecondary}>
              📋 Descargar plantilla vacía
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

const styles = {
  card: {
    background: C.surface, border: `1px solid ${C.border}`,
    borderRadius: 12, padding: '20px 24px',
  },
  th: {
    padding: '8px 14px', textAlign: 'left', color: C.muted,
    fontSize: 11, textTransform: 'uppercase', letterSpacing: 1,
    fontWeight: 600, borderBottom: `1px solid ${C.border}`,
  },
  btnPrimary: {
    background: C.accent, color: '#000', border: 'none',
    padding: '9px 18px', borderRadius: 7, fontWeight: 700,
    fontSize: 13, cursor: 'pointer', fontFamily: "'Sora', sans-serif",
  },
  btnSecondary: {
    background: 'transparent', color: C.muted, border: `1px solid ${C.border}`,
    padding: '9px 18px', borderRadius: 7, fontSize: 13,
    cursor: 'pointer', fontFamily: "'Sora', sans-serif",
  },
  statBadge: (color) => ({
    background: `${color}22`, color, border: `1px solid ${color}44`,
    padding: '4px 14px', borderRadius: 20, fontSize: 12, fontWeight: 600,
  }),
}