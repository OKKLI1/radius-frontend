import { useEffect, useState } from 'react'
import api from '../api/client'
import AccountingShell, { ActionLink, BlockTitle, Label, SectionTitle } from '../components/AccountingShell'
import { C } from '../theme'

function formatBytes(bytes) {
  const b = Number(bytes || 0)
  if (b < 1024) return `${b} B`
  if (b < 1024 ** 2) return `${(b / 1024).toFixed(1)} KB`
  if (b < 1024 ** 3) return `${(b / 1024 ** 2).toFixed(1)} MB`
  return `${(b / 1024 ** 3).toFixed(2)} GB`
}

export default function AccountingHotspot() {
  const styles = {
    listBox: { border: `1px solid ${C.border}`, borderRadius: 12, padding: 8, maxHeight: 200, overflowY: 'auto', marginBottom: 12 },
    chk: { display: 'flex', gap: 8, alignItems: 'center', color: C.text, fontSize: 13, marginBottom: 6 },
    btn: { width: '100%', background: C.accent, color: '#000', border: 'none', borderRadius: 10, padding: '9px 10px', fontWeight: 700, cursor: 'pointer', marginBottom: 10 },
    error: { marginBottom: 12, background: `${C.danger}22`, border: `1px solid ${C.danger}44`, color: C.danger, padding: '8px 10px', borderRadius: 10, fontSize: 13 },
    tableWrap: { overflow: 'auto', border: `1px solid ${C.border}`, borderRadius: 14 },
    table: { width: '100%', borderCollapse: 'collapse', fontSize: 12 },
    th: { textAlign: 'left', padding: '8px 10px', color: C.muted, borderBottom: `1px solid ${C.border}` },
    td: { padding: '8px 10px', color: C.text, whiteSpace: 'nowrap' },
  }

  const [list, setList] = useState([])
  const [selected, setSelected] = useState([])
  const [rows, setRows] = useState([])
  const [loading, setLoading] = useState(false)
  const [msg, setMsg] = useState('')

  useEffect(() => {
    api.get('/accounting/hotspots/list').then((r) => setList(r.data)).catch(() => {})
  }, [])

  const run = async () => {
    setLoading(true)
    setMsg('')
    try {
      const params = {}
      if (selected.length) params.hotspots = selected.join(',')
      const { data } = await api.get('/accounting/hotspots/usage', { params })
      setRows(data)
    } catch (e) {
      setMsg(e.response?.data?.detail || 'Error consultando hotspots')
    } finally {
      setLoading(false)
    }
  }

  const toggle = (id) => {
    setSelected((prev) => prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id])
  }

  const sidebar = (
    <>
      <h2 style={{ margin: '0 0 18px', fontSize: 22, fontWeight: 700 }}>Contabilidad</h2>
      <SectionTitle>Contabilidad de Hotspots</SectionTitle>
      <BlockTitle>Contabilidad Hotspot</BlockTitle>
      <Label>HotSpots</Label>
      <div style={styles.listBox}>
        {list.length === 0 ? <div style={{ color: C.muted, fontSize: 12 }}>Sin hotspots</div> : list.map((h) => (
          <label key={h.id} style={styles.chk}>
            <input type="checkbox" checked={selected.includes(h.id)} onChange={() => toggle(h.id)} />
            <span>{h.name || h.shortname || h.nasname}</span>
          </label>
        ))}
      </div>
      <button onClick={run} style={styles.btn}>Consultar</button>
      <ActionLink>Comparacion de Hotspots</ActionLink>
    </>
  )

  return (
    <AccountingShell activeTab="hotspot" title="Contabilidad Hotspot" sidebar={sidebar}>
      {msg && <div style={styles.error}>{msg}</div>}
      {loading ? <div style={{ color: C.muted }}>Cargando...</div> : rows.length === 0 ? (
        <div style={{ color: C.muted }}>Sin resultados. Selecciona hotspots y consulta.</div>
      ) : (
        <div style={styles.tableWrap}>
          <table style={styles.table}>
            <thead>
              <tr>{['Hotspot', 'NAS', 'Sesiones', 'Tiempo(s)', 'Consumo'].map((h) => <th key={h} style={styles.th}>{h}</th>)}</tr>
            </thead>
            <tbody>
              {rows.map((r, idx) => (
                <tr key={`${r.hotspot_name}-${idx}`} style={{ borderBottom: `1px solid ${C.border}22` }}>
                  <td style={styles.td}>{r.hotspot_name}</td>
                  <td style={styles.td}>{r.nasipaddress}</td>
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
