import { useEffect, useState } from 'react'
import api from '../api/client'
import AccountingShell, { BlockTitle, Label, SectionTitle } from '../components/AccountingShell'
import { C } from '../theme'

function formatBytes(bytes) {
  const b = Number(bytes || 0)
  if (b < 1024) return `${b} B`
  if (b < 1024 ** 2) return `${(b / 1024).toFixed(1)} KB`
  if (b < 1024 ** 3) return `${(b / 1024 ** 2).toFixed(1)} MB`
  return `${(b / 1024 ** 3).toFixed(2)} GB`
}

export default function AccountingPlans() {
  const styles = {
    input: { width: '100%', boxSizing: 'border-box', background: C.bg, border: `1px solid ${C.border}`, color: C.text, borderRadius: 10, padding: '9px 10px', fontSize: 13, marginBottom: 12 },
    btn: { width: '100%', background: C.accent, color: '#000', border: 'none', borderRadius: 10, padding: '9px 10px', fontWeight: 700, cursor: 'pointer' },
    error: { marginBottom: 12, background: `${C.danger}22`, border: `1px solid ${C.danger}44`, color: C.danger, padding: '8px 10px', borderRadius: 10, fontSize: 13 },
    tableWrap: { overflow: 'auto', border: `1px solid ${C.border}`, borderRadius: 14 },
    table: { width: '100%', borderCollapse: 'collapse', fontSize: 12 },
    th: { textAlign: 'left', padding: '8px 10px', color: C.muted, borderBottom: `1px solid ${C.border}` },
    td: { padding: '8px 10px', color: C.text, whiteSpace: 'nowrap' },
  }

  const [filters, setFilters] = useState({ username: '', start_date: '', end_date: '', plan_name: '' })
  const [plans, setPlans] = useState([])
  const [rows, setRows] = useState([])
  const [loading, setLoading] = useState(false)
  const [msg, setMsg] = useState('')

  useEffect(() => {
    api.get('/groups').then((r) => setPlans(r.data.map((g) => g.groupname))).catch(() => {})
  }, [])

  const load = async () => {
    setLoading(true)
    setMsg('')
    try {
      const params = { limit: 200 }
      Object.entries(filters).forEach(([k, v]) => { if (v) params[k] = v })
      const { data } = await api.get('/accounting/plans/usage', { params })
      setRows(data)
    } catch (e) {
      setMsg(e.response?.data?.detail || 'Error cargando uso por planes')
    } finally {
      setLoading(false)
    }
  }

  const sidebar = (
    <>
      <h2 style={{ margin: '0 0 18px', fontSize: 22, fontWeight: 700 }}>Contabilidad</h2>
      <SectionTitle>Contabilidad de Planes</SectionTitle>
      <BlockTitle>Uso del Plan</BlockTitle>
      <Label>Usuario</Label>
      <input value={filters.username} onChange={(e) => setFilters((p) => ({ ...p, username: e.target.value }))} placeholder="Ejemplo: juan_perez" style={styles.input} />
      <Label>Fecha de Inicio</Label>
      <input type="date" value={filters.start_date} onChange={(e) => setFilters((p) => ({ ...p, start_date: e.target.value }))} style={styles.input} />
      <Label>Fecha de Fin</Label>
      <input type="date" value={filters.end_date} onChange={(e) => setFilters((p) => ({ ...p, end_date: e.target.value }))} style={styles.input} />
      <Label>Nombre del Plan</Label>
      <select value={filters.plan_name} onChange={(e) => setFilters((p) => ({ ...p, plan_name: e.target.value }))} style={styles.input}>
        <option value="">Todos</option>
        {plans.map((p) => <option key={p} value={p}>{p}</option>)}
      </select>
      <button onClick={load} style={styles.btn}>Consultar</button>
    </>
  )

  return (
    <AccountingShell activeTab="plans" title="Pagina de Contabilidad de Planes" sidebar={sidebar}>
      {msg && <div style={styles.error}>{msg}</div>}
      {loading ? <div style={{ color: C.muted }}>Cargando...</div> : rows.length === 0 ? (
        <div style={{ color: C.muted }}>Sin resultados. Usa filtros y presiona Consultar.</div>
      ) : (
        <div style={styles.tableWrap}>
          <table style={styles.table}>
            <thead>
              <tr>{['Usuario', 'Plan', 'Sesiones', 'Tiempo(s)', 'Consumo'].map((h) => <th key={h} style={styles.th}>{h}</th>)}</tr>
            </thead>
            <tbody>
              {rows.map((r, idx) => (
                <tr key={`${r.username}-${r.plan_name}-${idx}`} style={{ borderBottom: `1px solid ${C.border}22` }}>
                  <td style={styles.td}>{r.username}</td>
                  <td style={styles.td}>{r.plan_name}</td>
                  <td style={styles.td}>{r.sessions}</td>
                  <td style={styles.td}>{r.total_seconds || 0}</td>
                  <td style={styles.td}>{formatBytes(r.total_bytes)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </AccountingShell>
  )
}
