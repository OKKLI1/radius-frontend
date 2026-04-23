import { useState } from 'react'
import api from '../api/client'
import AccountingShell, { SectionTitle } from '../components/AccountingShell'
import { C } from '../theme'

export default function AccountingMaintenance() {
  const styles = {
    card: { border: `1px solid ${C.border}`, borderRadius: 12, padding: 10, marginBottom: 12, background: C.surface2 },
    cardTitle: { fontSize: 13, fontWeight: 700, marginBottom: 8, color: C.text },
    label: { fontSize: 12, color: C.muted, marginBottom: 6, display: 'block' },
    input: { width: '100%', boxSizing: 'border-box', background: C.bg, border: `1px solid ${C.border}`, color: C.text, borderRadius: 10, padding: '8px 10px', fontSize: 13, marginBottom: 8 },
    btn: { width: '100%', background: C.accent, color: '#000', border: 'none', borderRadius: 10, padding: '9px 10px', fontWeight: 700, cursor: 'pointer' },
  }

  const [hours, setHours] = useState(24)
  const [beforeDate, setBeforeDate] = useState('')
  const [msg, setMsg] = useState('')
  const [loading, setLoading] = useState(false)

  const cleanup = async () => {
    setLoading(true)
    setMsg('')
    try {
      const { data } = await api.post('/accounting/maintenance/cleanup-stale', { older_than_hours: Number(hours) })
      setMsg(`Sesiones cerradas: ${data.rows_affected}`)
    } catch (e) {
      setMsg(e.response?.data?.detail || 'Error limpiando sesiones')
    } finally {
      setLoading(false)
    }
  }

  const removeRecords = async () => {
    if (!beforeDate) {
      setMsg('Debes seleccionar una fecha limite')
      return
    }
    if (!confirm(`Eliminar registros antes de ${beforeDate}?`)) return
    setLoading(true)
    setMsg('')
    try {
      const { data } = await api.post('/accounting/maintenance/delete-records', { before_date: beforeDate })
      setMsg(`Registros eliminados: ${data.rows_affected}`)
    } catch (e) {
      setMsg(e.response?.data?.detail || 'Error eliminando registros')
    } finally {
      setLoading(false)
    }
  }

  const sidebar = (
    <>
      <h2 style={{ margin: '0 0 18px', fontSize: 22, fontWeight: 700 }}>Contabilidad</h2>
      <SectionTitle>Mantenimiento</SectionTitle>

      <div style={styles.card}>
        <div style={styles.cardTitle}>Limpiar Sesiones Obsoletas</div>
        <label style={styles.label}>Mas antiguas que (horas)</label>
        <input type="number" min={1} value={hours} onChange={(e) => setHours(e.target.value)} style={styles.input} />
        <button onClick={cleanup} disabled={loading} style={styles.btn}>Ejecutar Limpieza</button>
      </div>

      <div style={styles.card}>
        <div style={styles.cardTitle}>Eliminar Registros de Contabilidad</div>
        <label style={styles.label}>Eliminar antes de la fecha</label>
        <input type="date" value={beforeDate} onChange={(e) => setBeforeDate(e.target.value)} style={styles.input} />
        <button onClick={removeRecords} disabled={loading} style={{ ...styles.btn, background: C.danger, color: '#fff' }}>Eliminar Registros</button>
      </div>
    </>
  )

  return (
    <AccountingShell activeTab="maintenance" title="Mantenimiento de Registros de Contabilidad" sidebar={sidebar}>
      {msg ? <div style={{ color: C.text, background: C.surface2, border: `1px solid ${C.border}`, borderRadius: 12, padding: '10px 12px' }}>{msg}</div> : <div style={{ color: C.muted }}>Selecciona una accion de mantenimiento.</div>}
    </AccountingShell>
  )
}
