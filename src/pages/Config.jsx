import { useCallback, useEffect, useMemo, useState } from 'react'
import { NavLink, useLocation } from 'react-router-dom'
import api from '../api/client'
import { C } from '../theme'
import { useTheme } from '../context/useTheme'

const TABS = [
  { key: 'general', label: 'General', to: '/config/general' },
  { key: 'reporting', label: 'Reporting', to: '/config/reporting' },
  { key: 'maintenance', label: 'Maintenance', to: '/config/maintenance' },
  { key: 'operators', label: 'Operators', to: '/config/operators' },
  { key: 'backup', label: 'Backup', to: '/config/backup' },
  { key: 'mail', label: 'Mail', to: '/config/mail' },
]

function fmtBytes(bytes) {
  const b = Number(bytes || 0)
  if (b < 1024) return `${b} B`
  if (b < 1024 ** 2) return `${(b / 1024).toFixed(1)} KB`
  if (b < 1024 ** 3) return `${(b / 1024 ** 2).toFixed(1)} MB`
  return `${(b / 1024 ** 3).toFixed(2)} GB`
}

function getErrorDetail(err, fallback) {
  const detail = err?.response?.data?.detail
  if (typeof detail === 'string' && detail.trim()) return detail
  if (err?.message) return err.message
  return fallback
}

function STitle({ children }) {
  return <div style={{ color: C.muted, fontSize: 12, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 10 }}>{children}</div>
}

export default function Config() {
  useTheme()
  const inputStyle = {
    width: '100%',
    boxSizing: 'border-box',
    background: C.bg,
    border: `1px solid ${C.border}`,
    color: C.text,
    borderRadius: 10,
    padding: '9px 10px',
    fontSize: 13,
    marginBottom: 10,
  }
  const styles = {
    topTabs: { display: 'flex', gap: 18, borderBottom: `1px solid ${C.border}`, paddingBottom: 12, marginBottom: 10 },
    shell: {
      display: 'grid',
      gridTemplateColumns: '290px 1fr',
      minHeight: 0,
      border: `1px solid ${C.border}`,
      borderRadius: 16,
      overflow: 'hidden',
      background: C.surface,
    },
    sidebar: { background: C.surface2, borderRight: `1px solid ${C.border}`, padding: '16px 14px' },
    content: { padding: '18px 20px', background: C.surface },
    navBtn: { border: `1px solid ${C.border}`, background: C.surface, borderRadius: 10, padding: '9px 12px', textAlign: 'left', cursor: 'pointer' },
    card: { background: C.surface, border: `1px solid ${C.border}`, borderRadius: 16, padding: '16px 18px' },
    h3: { margin: '0 0 10px', fontSize: 18 },
    h4: { margin: '14px 0 8px', fontSize: 14, color: C.muted },
    row: { background: C.bg, border: `1px solid ${C.border}`, borderRadius: 12, padding: '10px 12px', marginBottom: 8, display: 'flex', justifyContent: 'space-between', alignItems: 'center' },
    grid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: 8, marginTop: 12 },
    tableWrap: { overflow: 'auto', border: `1px solid ${C.border}`, borderRadius: 14, marginTop: 10 },
    table: { width: '100%', borderCollapse: 'collapse', fontSize: 12 },
    th: { textAlign: 'left', padding: '8px 10px', color: C.muted, borderBottom: `1px solid ${C.border}` },
    td: { padding: '8px 10px', borderBottom: `1px solid ${C.border}22` },
    primary: { background: C.accent, color: '#000', border: 'none', borderRadius: 10, padding: '8px 12px', fontWeight: 700, cursor: 'pointer' },
    secondary: { background: 'transparent', color: C.muted, border: `1px solid ${C.border}`, borderRadius: 10, padding: '7px 10px', cursor: 'pointer' },
    link: { background: 'transparent', border: 'none', color: C.accent, cursor: 'pointer', marginRight: 8, padding: 0 },
    logBox: { marginTop: 10, maxHeight: 220, overflowY: 'auto', border: `1px solid ${C.border}`, borderRadius: 12, padding: 10, fontFamily: 'monospace', fontSize: 11, background: C.bg },
    check: { display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8, fontSize: 13 },
    tpl: { marginTop: 10, border: `1px solid ${C.border}`, borderRadius: 12, padding: 10 },
    ok: { marginBottom: 10, padding: '8px 10px', borderRadius: 10, border: `1px solid ${C.green}55`, background: `${C.green}22`, color: C.green },
    err: { marginBottom: 10, padding: '8px 10px', borderRadius: 10, border: `1px solid ${C.danger}55`, background: `${C.danger}22`, color: C.danger },
  }

  const location = useLocation()
  const tab = useMemo(() => {
    if (location.pathname.endsWith('/reporting')) return 'reporting'
    if (location.pathname.endsWith('/maintenance')) return 'maintenance'
    if (location.pathname.endsWith('/operators')) return 'operators'
    if (location.pathname.endsWith('/backup')) return 'backup'
    if (location.pathname.endsWith('/mail')) return 'mail'
    return 'general'
  }, [location.pathname])

  const [section, setSection] = useState('general')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [ok, setOk] = useState('')

  const [gui, setGui] = useState(null)
  const [logs, setLogs] = useState([])
  const [reporting, setReporting] = useState(null)
  const [nas, setNas] = useState([])
  const [operators, setOperators] = useState([])
  const [backup, setBackup] = useState(null)
  const [mailSettings, setMailSettings] = useState(null)
  const [templates, setTemplates] = useState([])

  const [guiForm, setGuiForm] = useState({ admin_user: '', admin_password: '', token_expire: 480 })
  const [opForm, setOpForm] = useState({ username: '', full_name: '', email: '', role: 'viewer', active: true })
  const [backupForm, setBackupForm] = useState({ enabled: false, frequency: 'daily', retention_days: 14, backup_path: '/opt/radius-backups' })
  const [mailTestRecipient, setMailTestRecipient] = useState('')
  const [nasStatus, setNasStatus] = useState({})
  const [services, setServices] = useState({})

  const load = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const [a, b, c, d, e, f, g, h, i] = await Promise.all([
        api.get('/config/server'),
        api.get('/config/gui'),
        api.get('/config/freeradius/log?lines=120'),
        api.get('/config/reporting/summary'),
        api.get('/nas'),
        api.get('/config/operators'),
        api.get('/config/backup/status'),
        api.get('/config/mail/settings'),
        api.get('/config/mail/templates'),
      ])
      setServices(a.data?.services || {})
      setGui(b.data)
      setGuiForm({ admin_user: b.data.admin_user || '', admin_password: '', token_expire: b.data.token_expire || 480 })
      setLogs(c.data.lines || [])
      setReporting(d.data)
      setNas(e.data || [])
      setOperators(f.data || [])
      setBackup(g.data)
      setBackupForm({
        enabled: Boolean(g.data?.policy?.enabled),
        frequency: g.data?.policy?.frequency || 'daily',
        retention_days: g.data?.policy?.retention_days || 14,
        backup_path: g.data?.policy?.backup_path || '/opt/radius-backups',
      })
      setMailSettings({
        smtp_host: h.data.smtp_host || '',
        smtp_port: h.data.smtp_port || 587,
        smtp_user: h.data.smtp_user || '',
        smtp_password: '',
        from_email: h.data.from_email || '',
        use_tls: Boolean(h.data.use_tls),
        use_ssl: Boolean(h.data.use_ssl),
      })
      setTemplates(i.data || [])
    } catch (e) {
      setError(getErrorDetail(e, 'Error cargando configuracion'))
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { load() }, [load])
  useEffect(() => {
    setError('')
    setOk('')
    setSection(tab)
  }, [tab])

  const saveGui = async () => {
    try {
      const payload = {}
      if (guiForm.admin_user !== gui?.admin_user) payload.admin_user = guiForm.admin_user
      if (guiForm.admin_password) payload.admin_password = guiForm.admin_password
      if (Number(guiForm.token_expire) !== Number(gui?.token_expire)) payload.token_expire = Number(guiForm.token_expire)
      if (Object.keys(payload).length === 0) return setOk('Sin cambios')
      await api.put('/config/gui', payload)
      setOk('Configuracion guardada')
      await load()
    } catch (e) {
      setError(getErrorDetail(e, 'No se pudo guardar GUI'))
    }
  }

  const pingNas = async (id) => {
    setNasStatus((p) => ({ ...p, [id]: 'testing' }))
    try {
      const { data } = await api.get(`/config/nas/test/${id}`)
      setNasStatus((p) => ({ ...p, [id]: data.reachable ? 'ok' : 'fail' }))
    } catch {
      setNasStatus((p) => ({ ...p, [id]: 'fail' }))
    }
  }

  const createOperator = async () => {
    try {
      await api.post('/config/operators', opForm)
      setOpForm({ username: '', full_name: '', email: '', role: 'viewer', active: true })
      setOk('Operador creado')
      await load()
    } catch (e) {
      setError(getErrorDetail(e, 'No se pudo crear operador'))
    }
  }
  const toggleOperator = async (op) => {
    try {
      await api.put(`/config/operators/${op.id}`, { active: !op.active })
      await load()
    } catch (e) {
      setError(getErrorDetail(e, 'No se pudo actualizar operador'))
    }
  }
  const removeOperator = async (id) => {
    if (!window.confirm('Eliminar operador?')) return
    try {
      await api.delete(`/config/operators/${id}`)
      await load()
    } catch (e) {
      setError(getErrorDetail(e, 'No se pudo eliminar operador'))
    }
  }

  const saveBackup = async () => {
    try {
      await api.put('/config/backup/policy', backupForm)
      setOk('Politica de backup guardada')
      await load()
    } catch (e) {
      setError(getErrorDetail(e, 'No se pudo guardar backup'))
    }
  }
  const runBackup = async () => {
    try {
      await api.post('/config/backup/run')
      setOk('Backup ejecutado')
      await load()
    } catch (e) {
      setError(getErrorDetail(e, 'No se pudo ejecutar backup'))
    }
  }

  const saveMail = async () => {
    try {
      await api.put('/config/mail/settings', mailSettings)
      setOk('SMTP guardado')
      await load()
    } catch (e) {
      setError(getErrorDetail(e, 'No se pudo guardar SMTP'))
    }
  }
  const testMail = async () => {
    try {
      const { data } = await api.post('/config/mail/test', { recipient: mailTestRecipient || null })
      setOk(data.message || 'SMTP OK')
    } catch (e) {
      setError(getErrorDetail(e, 'Fallo SMTP'))
    }
  }
  const saveTemplate = async (tpl) => {
    try {
      await api.put(`/config/mail/templates/${tpl.template_key}`, { subject: tpl.subject, body: tpl.body })
      setOk(`Plantilla ${tpl.template_key} guardada`)
      await load()
    } catch (e) {
      setError(getErrorDetail(e, 'No se pudo guardar plantilla'))
    }
  }

  const sidebar = (
    <>
      <h2 style={{ margin: '0 0 14px', fontSize: 22 }}>Configuration</h2>
      <STitle>Sections</STitle>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {TABS.map((t) => (
          <button key={t.key} onClick={() => setSection(t.key)} style={{ ...styles.navBtn, color: section === t.key ? C.accent : C.text }}>
            {t.label}
          </button>
        ))}
      </div>
    </>
  )

  let content = null
  if (loading) content = <div style={{ color: C.muted }}>Loading...</div>
  else if (section === 'general') content = (
    <div style={styles.card}>
      <h3 style={styles.h3}>General Settings</h3>
      <input style={inputStyle} value={guiForm.admin_user} onChange={(e) => setGuiForm((p) => ({ ...p, admin_user: e.target.value }))} placeholder="Admin user" />
      <input style={inputStyle} type="password" value={guiForm.admin_password} onChange={(e) => setGuiForm((p) => ({ ...p, admin_password: e.target.value }))} placeholder="New password" />
      <input style={inputStyle} type="number" value={guiForm.token_expire} onChange={(e) => setGuiForm((p) => ({ ...p, token_expire: e.target.value }))} placeholder="Token expire minutes" />
      <button style={styles.primary} onClick={saveGui}>Save</button>
    </div>
  )
  else if (section === 'reporting') content = (
    <div style={styles.card}>
      <h3 style={styles.h3}>Reporting Summary</h3>
      <div style={styles.grid}>
        <StatCard label="24h Accept" value={reporting?.auth_24h?.accepted || 0} />
        <StatCard label="24h Reject" value={reporting?.auth_24h?.rejected || 0} color={C.danger} />
        <StatCard label="7d Total" value={reporting?.auth_7d?.total || 0} />
        <StatCard label="Traffic 24h" value={fmtBytes(reporting?.traffic_24h || 0)} color={C.warn} />
      </div>
      <div style={styles.logBox}>{logs.map((l, i) => <div key={i}>{l}</div>)}</div>
    </div>
  )
  else if (section === 'maintenance') content = (
    <div style={styles.card}>
      <h3 style={styles.h3}>Maintenance</h3>
      {['freeradius', 'mariadb', 'apache2', 'radius-api'].map((svc) => (
        <div key={svc} style={styles.row}>
          <span>{svc}</span>
          <span style={{
            fontSize: 12,
            fontWeight: 700,
            color: svc === 'apache2'
              ? (services.apache ? C.green : C.danger)
              : svc === 'radius-api'
                ? (services.radius_api ? C.green : C.danger)
                : (services[svc] ? C.green : C.danger),
          }}>
            {svc === 'apache2'
              ? (services.apache ? 'Activo' : 'Inactivo')
              : svc === 'radius-api'
                ? (services.radius_api ? 'Activo' : 'Inactivo')
                : (services[svc] ? 'Activo' : 'Inactivo')}
          </span>
        </div>
      ))}
      <h4 style={styles.h4}>NAS Connectivity</h4>
      {nas.map((n) => (
        <div key={n.id} style={styles.row}>
          <span>{n.shortname || n.nasname}</span>
          <div style={{ display: 'flex', gap: 8 }}>
            <span style={{ color: nasStatus[n.id] === 'ok' ? C.green : nasStatus[n.id] === 'fail' ? C.danger : C.muted }}>
              {nasStatus[n.id] || '-'}
            </span>
            <button style={styles.secondary} onClick={() => pingNas(n.id)}>Ping</button>
          </div>
        </div>
      ))}
    </div>
  )
  else if (section === 'operators') content = (
    <div style={styles.card}>
      <h3 style={styles.h3}>Operators</h3>
      <input style={inputStyle} value={opForm.username} onChange={(e) => setOpForm((p) => ({ ...p, username: e.target.value }))} placeholder="username" />
      <input style={inputStyle} value={opForm.full_name} onChange={(e) => setOpForm((p) => ({ ...p, full_name: e.target.value }))} placeholder="full name" />
      <input style={inputStyle} value={opForm.email} onChange={(e) => setOpForm((p) => ({ ...p, email: e.target.value }))} placeholder="email" />
      <select style={inputStyle} value={opForm.role} onChange={(e) => setOpForm((p) => ({ ...p, role: e.target.value }))}>
        <option value="viewer">viewer</option>
        <option value="operator">operator</option>
        <option value="admin">admin</option>
      </select>
      <button style={styles.primary} onClick={createOperator}>Create Operator</button>
      <div style={styles.tableWrap}>
        <table style={styles.table}>
          <thead><tr><th style={styles.th}>User</th><th style={styles.th}>Role</th><th style={styles.th}>Status</th><th style={styles.th}>Actions</th></tr></thead>
          <tbody>
            {operators.map((o) => (
              <tr key={o.id}>
                <td style={styles.td}>{o.username}</td>
                <td style={styles.td}>{o.role}</td>
                <td style={styles.td}>{o.active ? 'active' : 'disabled'}</td>
                <td style={styles.td}>
                  <button style={styles.link} onClick={() => toggleOperator(o)}>{o.active ? 'Disable' : 'Enable'}</button>
                  <button style={{ ...styles.link, color: C.danger }} onClick={() => removeOperator(o.id)}>Delete</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
  else if (section === 'backup') content = (
    <div style={styles.card}>
      <h3 style={styles.h3}>Backup</h3>
      <label style={styles.check}><input type="checkbox" checked={backupForm.enabled} onChange={(e) => setBackupForm((p) => ({ ...p, enabled: e.target.checked }))} /> Enabled</label>
      <select style={inputStyle} value={backupForm.frequency} onChange={(e) => setBackupForm((p) => ({ ...p, frequency: e.target.value }))}>
        <option value="daily">daily</option>
        <option value="weekly">weekly</option>
        <option value="monthly">monthly</option>
      </select>
      <input style={inputStyle} type="number" value={backupForm.retention_days} onChange={(e) => setBackupForm((p) => ({ ...p, retention_days: Number(e.target.value) }))} placeholder="retention days" />
      <input style={inputStyle} value={backupForm.backup_path} onChange={(e) => setBackupForm((p) => ({ ...p, backup_path: e.target.value }))} placeholder="backup path" />
      <div style={{ display: 'flex', gap: 8 }}>
        <button style={styles.primary} onClick={saveBackup}>Save Policy</button>
        <button style={styles.secondary} onClick={runBackup}>Run Backup</button>
      </div>
      <div style={styles.grid}>
        <StatCard label="radcheck" value={backup?.table_counts?.radcheck || 0} />
        <StatCard label="radacct" value={backup?.table_counts?.radacct || 0} />
        <StatCard label="radpostauth" value={backup?.table_counts?.radpostauth || 0} />
        <StatCard label="nas" value={backup?.table_counts?.nas || 0} />
      </div>
    </div>
  )
  else content = (
    <div style={styles.card}>
      <h3 style={styles.h3}>Mail</h3>
      <input style={inputStyle} value={mailSettings?.smtp_host || ''} onChange={(e) => setMailSettings((p) => ({ ...p, smtp_host: e.target.value }))} placeholder="smtp host" />
      <input style={inputStyle} type="number" value={mailSettings?.smtp_port || 587} onChange={(e) => setMailSettings((p) => ({ ...p, smtp_port: Number(e.target.value) }))} placeholder="smtp port" />
      <input style={inputStyle} value={mailSettings?.smtp_user || ''} onChange={(e) => setMailSettings((p) => ({ ...p, smtp_user: e.target.value }))} placeholder="smtp user" />
      <input style={inputStyle} type="password" value={mailSettings?.smtp_password || ''} onChange={(e) => setMailSettings((p) => ({ ...p, smtp_password: e.target.value }))} placeholder="smtp password" />
      <input style={inputStyle} value={mailSettings?.from_email || ''} onChange={(e) => setMailSettings((p) => ({ ...p, from_email: e.target.value }))} placeholder="from email" />
      <label style={styles.check}><input type="checkbox" checked={Boolean(mailSettings?.use_tls)} onChange={(e) => setMailSettings((p) => ({ ...p, use_tls: e.target.checked }))} /> Use TLS</label>
      <label style={styles.check}><input type="checkbox" checked={Boolean(mailSettings?.use_ssl)} onChange={(e) => setMailSettings((p) => ({ ...p, use_ssl: e.target.checked }))} /> Use SSL</label>
      <div style={{ display: 'flex', gap: 8 }}>
        <button style={styles.primary} onClick={saveMail}>Save SMTP</button>
        <input style={{ ...inputStyle, marginBottom: 0 }} value={mailTestRecipient} onChange={(e) => setMailTestRecipient(e.target.value)} placeholder="recipient for test (optional)" />
        <button style={styles.secondary} onClick={testMail}>Test SMTP</button>
      </div>
      {templates.map((t, idx) => (
        <div key={t.template_key} style={styles.tpl}>
          <div style={{ color: C.muted, fontSize: 12 }}>{t.template_key}</div>
          <input style={inputStyle} value={t.subject} onChange={(e) => setTemplates((p) => p.map((x, i) => i === idx ? { ...x, subject: e.target.value } : x))} />
          <textarea style={{ ...inputStyle, minHeight: 80 }} value={t.body} onChange={(e) => setTemplates((p) => p.map((x, i) => i === idx ? { ...x, body: e.target.value } : x))} />
          <button style={styles.secondary} onClick={() => saveTemplate(templates[idx])}>Save Template</button>
        </div>
      ))}
    </div>
  )

  return (
    <div style={{ color: C.text }}>
      <div style={styles.topTabs}>
        {TABS.map((item) => (
          <NavLink key={item.key} to={item.to} style={{ textDecoration: 'none' }}>
            <div style={{ color: tab === item.key ? C.accent : C.text, fontSize: 13, borderBottom: tab === item.key ? `2px solid ${C.accent}` : '2px solid transparent', paddingBottom: 3 }}>
              {item.label}
            </div>
          </NavLink>
        ))}
      </div>

      <div style={styles.shell}>
        <aside style={styles.sidebar}>{sidebar}</aside>
        <section style={styles.content}>
          <h1 style={{ margin: '0 0 12px', fontSize: 22 }}>System Configuration</h1>
          {ok ? <div style={styles.ok}>{ok}</div> : null}
          {error ? <div style={styles.err}>{error}</div> : null}
          {content}
        </section>
      </div>
    </div>
  )
}

function StatCard({ label, value, color }) {
  return (
    <div style={{ background: C.bg, border: `1px solid ${C.border}`, borderRadius: 12, padding: 10 }}>
      <div style={{ fontSize: 22, fontWeight: 700, color: color || C.accent }}>{value}</div>
      <div style={{ fontSize: 12, color: C.muted }}>{label}</div>
    </div>
  )
}
