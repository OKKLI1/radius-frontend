import { useState } from 'react'
import api from '../api/client'
import AccountingShell, { SectionTitle, BlockTitle, Label } from '../components/AccountingShell'
import { C } from '../theme'

function formatBytes(bytes) {
  const b = Number(bytes || 0)
  if (b < 1024) return `${b} B`
  if (b < 1024 ** 2) return `${(b / 1024).toFixed(1)} KB`
  if (b < 1024 ** 3) return `${(b / 1024 ** 2).toFixed(1)} MB`
  return `${(b / 1024 ** 3).toFixed(2)} GB`
}

export default function AccountingGeneral() {
  const styles = {
    input: {
      width: '100%',
      boxSizing: 'border-box',
      background: C.bg,
      border: `1px solid ${C.border}`,
      color: C.text,
      borderRadius: 10,
      padding: '9px 10px',
      fontSize: 13,
      marginBottom: 12,
    },
    btn: {
      width: '100%',
      background: C.accent,
      color: '#000',
      border: 'none',
      borderRadius: 10,
      padding: '9px 10px',
      fontWeight: 700,
      cursor: 'pointer',
    },
    error: {
      marginBottom: 12,
      background: `${C.danger}22`,
      border: `1px solid ${C.danger}44`,
      color: C.danger,
      padding: '8px 10px',
      borderRadius: 10,
      fontSize: 13,
    },
    tableWrap: { overflow: 'auto', border: `1px solid ${C.border}`, borderRadius: 14 },
    table: { width: '100%', borderCollapse: 'collapse', fontSize: 12 },
    th: { textAlign: 'left', padding: '8px 10px', color: C.muted, borderBottom: `1px solid ${C.border}` },
    td: { padding: '8px 10px', color: C.text, whiteSpace: 'nowrap' },
  }

  const [filters, setFilters] = useState({ ip_address: '', nas_ip: '', active_only: false })
  const [rows, setRows] = useState([])
  const [loading, setLoading] = useState(false)
  const [msg, setMsg] = useState('')

  const load = async () => {
    setLoading(true)
    setMsg('')
    try {
      const params = {
        limit: 200,
        active_only: filters.active_only,
      }
      if (filters.ip_address) params.ip_address = filters.ip_address
      if (filters.nas_ip) params.nas_ip = filters.nas_ip
      const { data } = await api.get('/accounting/general', { params })
      setRows(data)
    } catch (e) {
      setMsg(e.response?.data?.detail || 'Error cargando contabilidad general')
    } finally {
      setLoading(false)
    }
  }

  const sidebar = (
    <>
      <h2 style={{ margin: '0 0 18px', fontSize: 22, fontWeight: 700 }}>Contabilidad</h2>
      <SectionTitle>Contabilidad de Usuarios</SectionTitle>
      <BlockTitle>Contabilidad por IP</BlockTitle>
      <Label>Direccion IP</Label>
      <input value={filters.ip_address} onChange={(e) => setFilters((p) => ({ ...p, ip_address: e.target.value }))} placeholder="Ingresa la direccion IP" style={styles.input} />
      <BlockTitle>Contabilidad NAS por IP</BlockTitle>
      <Label>Direccion IP NAS</Label>
      <input value={filters.nas_ip} onChange={(e) => setFilters((p) => ({ ...p, nas_ip: e.target.value }))} placeholder="Direccion IP NAS" style={styles.input} />
      <label style={{ display: 'flex', alignItems: 'center', gap: 8, color: C.text, fontSize: 13, marginBottom: 12 }}>
        <input type="checkbox" checked={filters.active_only} onChange={(e) => setFilters((p) => ({ ...p, active_only: e.target.checked }))} />
        Solo activas
      </label>
      <button onClick={load} style={styles.btn}>Consultar</button>
    </>
  )

  return (
    <AccountingShell activeTab="general" title="Pagina de Contabilidad" sidebar={sidebar}>
      {msg && <div style={styles.error}>{msg}</div>}
      {loading ? (
        <div style={{ color: C.muted }}>Cargando...</div>
      ) : rows.length === 0 ? (
        <div style={{ color: C.muted }}>Sin resultados. Usa los filtros y presiona Consultar.</div>
      ) : (
        <div style={styles.tableWrap}>
          <table style={styles.table}>
            <thead>
              <tr>
                {['ID', 'Usuario', 'NAS', 'IP', 'Inicio', 'Fin', 'Segundos', 'Total'].map((h) => (
                  <th key={h} style={styles.th}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.radacctid} style={{ borderBottom: `1px solid ${C.border}22` }}>
                  <td style={styles.td}>{r.radacctid}</td>
                  <td style={styles.td}>{r.username}</td>
                  <td style={styles.td}>{r.nas_name || r.nasipaddress}</td>
                  <td style={styles.td}>{r.framedipaddress || '-'}</td>
                  <td style={styles.td}>{r.acctstarttime?.toString().slice(0, 19).replace('T', ' ')}</td>
                  <td style={styles.td}>{r.acctstoptime ? r.acctstoptime.toString().slice(0, 19).replace('T', ' ') : 'Activa'}</td>
                  <td style={styles.td}>{r.acctsessiontime || 0}</td>
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
