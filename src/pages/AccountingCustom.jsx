import { useEffect, useState } from 'react'
import api from '../api/client'
import AccountingShell, { BlockTitle, Label, SectionTitle } from '../components/AccountingShell'
import { C } from '../theme'

export default function AccountingCustom() {
  const styles = {
    input: { width: '100%', boxSizing: 'border-box', background: C.bg, border: `1px solid ${C.border}`, color: C.text, borderRadius: 10, padding: '9px 10px', fontSize: 13, marginBottom: 12 },
    btn: { width: '100%', background: C.accent, color: '#000', border: 'none', borderRadius: 10, padding: '9px 10px', fontWeight: 700, cursor: 'pointer' },
    error: { marginBottom: 12, background: `${C.danger}22`, border: `1px solid ${C.danger}44`, color: C.danger, padding: '8px 10px', borderRadius: 10, fontSize: 13 },
    tableWrap: { overflow: 'auto', border: `1px solid ${C.border}`, borderRadius: 14 },
    table: { width: '100%', borderCollapse: 'collapse', fontSize: 12 },
    th: { textAlign: 'left', padding: '8px 10px', color: C.muted, borderBottom: `1px solid ${C.border}` },
    td: { padding: '8px 10px', color: C.text, whiteSpace: 'nowrap' },
  }

  const [meta, setMeta] = useState({ fields: [], operators: [] })
  const [rows, setRows] = useState([])
  const [loading, setLoading] = useState(false)
  const [msg, setMsg] = useState('')
  const [payload, setPayload] = useState({
    start_date: '',
    end_date: '',
    where_field: 'radacctid',
    operator: 'equals',
    filter_value: '',
    order_by: 'radacctid',
    order_type: 'desc',
    limit: 200,
  })

  useEffect(() => {
    api.get('/accounting/custom/fields')
      .then((r) => {
        setMeta(r.data)
        if (r.data.fields?.length) {
          const first = r.data.fields[0]
          setPayload((p) => ({ ...p, where_field: first, order_by: first }))
        }
      })
      .catch(() => {})
  }, [])

  const run = async () => {
    setLoading(true)
    setMsg('')
    try {
      const data = {
        ...payload,
        select_fields: meta.fields?.length ? meta.fields.slice(0, 8) : ['radacctid', 'username'],
      }
      const res = await api.post('/accounting/custom/query', data)
      setRows(res.data.rows || [])
    } catch (e) {
      setMsg(e.response?.data?.detail || 'Error ejecutando consulta')
    } finally {
      setLoading(false)
    }
  }

  const sidebar = (
    <>
      <h2 style={{ margin: '0 0 18px', fontSize: 22, fontWeight: 700 }}>Contabilidad</h2>
      <SectionTitle>Consulta Personalizada</SectionTitle>
      <BlockTitle>Procesar Consulta</BlockTitle>
      <Label>Fecha de Inicio</Label>
      <input type="date" value={payload.start_date} onChange={(e) => setPayload((p) => ({ ...p, start_date: e.target.value }))} style={styles.input} />
      <Label>Fecha de Fin</Label>
      <input type="date" value={payload.end_date} onChange={(e) => setPayload((p) => ({ ...p, end_date: e.target.value }))} style={styles.input} />
      <Label>Donde</Label>
      <select value={payload.where_field} onChange={(e) => setPayload((p) => ({ ...p, where_field: e.target.value }))} style={styles.input}>
        {meta.fields.map((f) => <option key={f} value={f}>{f}</option>)}
      </select>
      <Label>Operador</Label>
      <select value={payload.operator} onChange={(e) => setPayload((p) => ({ ...p, operator: e.target.value }))} style={styles.input}>
        {meta.operators.map((o) => <option key={o} value={o}>{o}</option>)}
      </select>
      <Label>Filtro</Label>
      <input value={payload.filter_value} onChange={(e) => setPayload((p) => ({ ...p, filter_value: e.target.value }))} placeholder="Ingresa una cadena alfanumerica" style={styles.input} />
      <Label>Ordenar por</Label>
      <select value={payload.order_by} onChange={(e) => setPayload((p) => ({ ...p, order_by: e.target.value }))} style={styles.input}>
        {meta.fields.map((f) => <option key={f} value={f}>{f}</option>)}
      </select>
      <button onClick={run} style={styles.btn}>Ejecutar</button>
    </>
  )

  const cols = rows.length ? Object.keys(rows[0]) : []

  return (
    <AccountingShell activeTab="custom" title="Contabilidad Personalizada" sidebar={sidebar}>
      {msg && <div style={styles.error}>{msg}</div>}
      {loading ? <div style={{ color: C.muted }}>Ejecutando...</div> : rows.length === 0 ? (
        <div style={{ color: C.muted }}>Sin resultados. Configura filtros y ejecuta la consulta.</div>
      ) : (
        <div style={styles.tableWrap}>
          <table style={styles.table}>
            <thead><tr>{cols.map((c) => <th key={c} style={styles.th}>{c}</th>)}</tr></thead>
            <tbody>
              {rows.map((r, i) => (
                <tr key={i} style={{ borderBottom: `1px solid ${C.border}22` }}>
                  {cols.map((c) => <td key={c} style={styles.td}>{r[c] ?? '-'}</td>)}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </AccountingShell>
  )
}
