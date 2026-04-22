import { useEffect, useState } from 'react'
import api from '../api/client'
import { C } from '../theme'

const inputStyle = {
  background: C.bg, border: `1px solid ${C.border}`, color: C.text,
  padding: '9px 12px', borderRadius: 7, fontSize: 13,
  fontFamily: "'Sora', sans-serif", width: '100%', boxSizing: 'border-box', outline: 'none',
}

function ServiceBadge({ name, active, onRestart }) {
  const [restarting, setRestarting] = useState(false)

  const restart = async () => {
    if (!confirm(`¿Reiniciar el servicio ${name}?`)) return
    setRestarting(true)
    try { await api.post(`/config/services/${name}/restart`) }
    catch { alert('Error al reiniciar') }
    finally { setRestarting(false) }
  }

  return (
    <div style={{ background: C.bg, border: `1px solid ${C.border}`, borderRadius: 8, padding: '12px 16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <div style={{ width: 10, height: 10, borderRadius: '50%', background: active ? C.green : C.danger, boxShadow: active ? `0 0 6px ${C.green}` : 'none', flexShrink: 0 }} />
        <div>
          <div style={{ fontWeight: 600, fontSize: 14 }}>{name}</div>
          <div style={{ fontSize: 11, color: active ? C.green : C.danger }}>{active ? 'Activo' : 'Detenido'}</div>
        </div>
      </div>
      <button onClick={restart} disabled={restarting} style={{ background: 'transparent', color: C.muted, border: `1px solid ${C.border}`, padding: '5px 12px', borderRadius: 5, fontSize: 12, cursor: 'pointer', fontFamily: "'Sora', sans-serif", opacity: restarting ? 0.5 : 1 }}>
        {restarting ? '...' : '↺ Reiniciar'}
      </button>
    </div>
  )
}

function StatBox({ label, value, color }) {
  return (
    <div style={{ background: C.bg, border: `1px solid ${C.border}`, borderRadius: 8, padding: '16px 20px' }}>
      <div style={{ fontSize: 28, fontWeight: 700, color: color || C.accent }}>{value}</div>
      <div style={{ fontSize: 12, color: C.muted, marginTop: 4 }}>{label}</div>
    </div>
  )
}

export default function Config() {
  const [info, setInfo] = useState(null)
  const [guiConfig, setGuiConfig] = useState(null)
  const [logs, setLogs] = useState([])
  const [loading, setLoading] = useState(true)
  const [tab, setTab] = useState('server')
  const [form, setForm] = useState({ admin_user: '', admin_password: '', token_expire: '' })
  const [saving, setSaving] = useState(false)
  const [msg, setMsg] = useState('')
  const [nas, setNas] = useState([])
  const [testResults, setTestResults] = useState({})

  const load = () => {
    setLoading(true)
    Promise.all([
      api.get('/config/server'),
      api.get('/config/gui'),
      api.get('/config/freeradius/log?lines=100'),
      api.get('/nas'),
    ]).then(([s, g, l, n]) => {
      setInfo(s.data)
      setGuiConfig(g.data)
      setForm({ admin_user: g.data.admin_user, admin_password: '', token_expire: g.data.token_expire })
      setLogs(l.data.lines || [])
      setNas(n.data)
    }).finally(() => setLoading(false))
  }

  useEffect(() => { load() }, [])

  const saveConfig = async () => {
    setSaving(true); setMsg('')
    try {
      const payload = {}
      if (form.admin_user !== guiConfig.admin_user) payload.admin_user = form.admin_user
      if (form.admin_password) payload.admin_password = form.admin_password
      if (Number(form.token_expire) !== guiConfig.token_expire) payload.token_expire = Number(form.token_expire)
      if (Object.keys(payload).length === 0) { setMsg('No hay cambios para guardar'); setSaving(false); return }
      await api.put('/config/gui', payload)
      setMsg('✅ Configuración guardada. Reinicia el servicio radius-api para aplicar.')
      load()
    } catch (e) {
      setMsg(e.response?.data?.detail || 'Error al guardar')
    } finally { setSaving(false) }
  }

  const testNas = async (id) => {
    setTestResults(prev => ({ ...prev, [id]: 'testing' }))
    try {
      const { data } = await api.get(`/config/nas/test/${id}`)
      setTestResults(prev => ({ ...prev, [id]: data.reachable ? 'ok' : 'fail' }))
    } catch {
      setTestResults(prev => ({ ...prev, [id]: 'fail' }))
    }
  }

  const TABS = [
    ['server', '🖥 Servidor'],
    ['services', '⚙️ Servicios'],
    ['logs', '📋 Logs FreeRADIUS'],
    ['nas_test', '📡 Test NAS'],
    ['gui', '🔧 Panel GUI'],
  ]

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20, color: C.text }}>
      <div>
        <h1 style={{ fontSize: 22, fontWeight: 700, margin: 0 }}>Configuración del Servidor</h1>
        <p style={{ color: C.muted, fontSize: 13, margin: '4px 0 0' }}>Estado del sistema, servicios y ajustes del panel</p>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: 4, background: C.surface, border: `1px solid ${C.border}`, borderRadius: 8, padding: 4, flexWrap: 'wrap' }}>
        {TABS.map(([key, label]) => (
          <button key={key} onClick={() => setTab(key)} style={{
            background: tab === key ? C.accent : 'transparent',
            color: tab === key ? '#000' : C.muted,
            border: 'none', padding: '7px 16px', borderRadius: 6,
            fontWeight: tab === key ? 700 : 400, fontSize: 13,
            cursor: 'pointer', fontFamily: "'Sora', sans-serif",
          }}>{label}</button>
        ))}
      </div>

      {loading ? <div style={{ color: C.muted }}>Cargando...</div> : (
        <>
          {/* Tab: Servidor */}
          {tab === 'server' && info && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              {/* Stats BD */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: 12 }}>
                <StatBox label="Usuarios" value={info.database.users} />
                <StatBox label="Clientes NAS" value={info.database.nas} />
                <StatBox label="Sesiones activas" value={info.database.sessions} color={C.green} />
                <StatBox label="Vouchers" value={info.database.vouchers} color={C.warn} />
              </div>

              {/* Info sistema */}
              <div style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 12, padding: '20px 24px' }}>
                <div style={{ fontSize: 13, fontWeight: 600, color: C.muted, marginBottom: 16, textTransform: 'uppercase', letterSpacing: 1 }}>Información del Sistema</div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                  {[
                    ['🖥 Hostname',    info.system.hostname],
                    ['🐧 Sistema',     info.system.os],
                    ['⏱ Uptime',      info.system.uptime],
                    ['🌐 IP',          info.system.ip],
                    ['⚡ CPU',         info.system.cpu_usage],
                    ['🧠 Memoria',     info.system.memory],
                    ['💾 Disco',       info.system.disk],
                    ['🔌 API Puerto',  `8080`],
                  ].map(([label, value]) => (
                    <div key={label} style={{ display: 'flex', gap: 12, padding: '10px 14px', background: C.bg, borderRadius: 7, alignItems: 'center' }}>
                      <span style={{ fontSize: 13, color: C.muted, minWidth: 120 }}>{label}</span>
                      <span style={{ fontSize: 13, fontFamily: 'monospace', color: C.accent }}>{value || '—'}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Tab: Servicios */}
          {tab === 'services' && info && (
            <div style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 12, padding: '20px 24px', display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div style={{ fontSize: 13, fontWeight: 600, color: C.muted, marginBottom: 4, textTransform: 'uppercase', letterSpacing: 1 }}>Estado de Servicios</div>
              <ServiceBadge name="freeradius" active={info.services.freeradius} />
              <ServiceBadge name="mariadb" active={info.services.mariadb} />
              <ServiceBadge name="apache2" active={info.services.apache} />
              <ServiceBadge name="radius-api" active={info.services.radius_api} />
            </div>
          )}

          {/* Tab: Logs */}
          {tab === 'logs' && (
            <div style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 12, padding: '20px 24px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16 }}>
                <div style={{ fontSize: 13, fontWeight: 600, color: C.muted, textTransform: 'uppercase', letterSpacing: 1 }}>Log de FreeRADIUS (últimas 100 líneas)</div>
                <button onClick={() => api.get('/config/freeradius/log?lines=100').then(r => setLogs(r.data.lines))} style={{ background: 'transparent', color: C.accent, border: `1px solid ${C.accent}44`, padding: '4px 12px', borderRadius: 5, fontSize: 12, cursor: 'pointer', fontFamily: "'Sora', sans-serif" }}>
                  ↺ Actualizar
                </button>
              </div>
              <div style={{ background: C.bg, border: `1px solid ${C.border}`, borderRadius: 8, padding: 16, maxHeight: 400, overflowY: 'auto', fontFamily: 'monospace', fontSize: 11 }}>
                {logs.length === 0 ? (
                  <div style={{ color: C.muted }}>Sin logs disponibles</div>
                ) : logs.map((line, i) => (
                  <div key={i} style={{
                    padding: '2px 0',
                    color: line.includes('Error') || line.includes('error') ? C.danger
                      : line.includes('Warning') || line.includes('warning') ? C.warn
                      : line.includes('Info') ? C.muted : C.text,
                  }}>
                    {line}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Tab: Test NAS */}
          {tab === 'nas_test' && (
            <div style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 12, padding: '20px 24px' }}>
              <div style={{ fontSize: 13, fontWeight: 600, color: C.muted, marginBottom: 16, textTransform: 'uppercase', letterSpacing: 1 }}>Probar conectividad con NAS</div>
              {nas.length === 0 ? (
                <div style={{ color: C.muted }}>No hay clientes NAS registrados.</div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  {nas.map(n => {
                    const result = testResults[n.id]
                    return (
                      <div key={n.id} style={{ background: C.bg, border: `1px solid ${C.border}`, borderRadius: 8, padding: '12px 16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div>
                          <div style={{ fontWeight: 600 }}>{n.shortname}</div>
                          <div style={{ fontSize: 12, color: C.muted, fontFamily: 'monospace' }}>{n.nasname}</div>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                          {result && result !== 'testing' && (
                            <span style={{ color: result === 'ok' ? C.green : C.danger, fontSize: 13, fontWeight: 600 }}>
                              {result === 'ok' ? '✓ Alcanzable' : '✗ Sin respuesta'}
                            </span>
                          )}
                          <button onClick={() => testNas(n.id)} disabled={result === 'testing'} style={{ background: 'transparent', color: C.accent, border: `1px solid ${C.accent}44`, padding: '6px 14px', borderRadius: 5, fontSize: 12, cursor: 'pointer', fontFamily: "'Sora', sans-serif" }}>
                            {result === 'testing' ? 'Probando...' : '📡 Ping'}
                          </button>
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          )}

          {/* Tab: GUI Config */}
          {tab === 'gui' && guiConfig && (
            <div style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 12, padding: '20px 24px', display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div style={{ fontSize: 13, fontWeight: 600, color: C.muted, textTransform: 'uppercase', letterSpacing: 1 }}>Configuración del Panel</div>

              {/* Info BD (solo lectura) */}
              <div style={{ background: C.bg, border: `1px solid ${C.border}`, borderRadius: 8, padding: 16 }}>
                <div style={{ fontSize: 11, color: C.muted, marginBottom: 10, textTransform: 'uppercase', letterSpacing: 1 }}>Base de datos (solo lectura)</div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, fontSize: 13, fontFamily: 'monospace' }}>
                  {[['Host', guiConfig.db_host], ['Puerto', guiConfig.db_port], ['Base de datos', guiConfig.db_name], ['Usuario', guiConfig.db_user]].map(([k, v]) => (
                    <div key={k} style={{ color: C.muted }}>{k}: <span style={{ color: C.accent }}>{v}</span></div>
                  ))}
                </div>
              </div>

              {/* Editable */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                  <label style={{ fontSize: 11, color: C.muted, fontWeight: 600, textTransform: 'uppercase', letterSpacing: 1 }}>Usuario admin</label>
                  <input style={inputStyle} value={form.admin_user} onChange={e => setForm({ ...form, admin_user: e.target.value })} />
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                  <label style={{ fontSize: 11, color: C.muted, fontWeight: 600, textTransform: 'uppercase', letterSpacing: 1 }}>Nueva contraseña</label>
                  <input style={inputStyle} type="password" value={form.admin_password} onChange={e => setForm({ ...form, admin_password: e.target.value })} placeholder="Dejar vacío para no cambiar" />
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                  <label style={{ fontSize: 11, color: C.muted, fontWeight: 600, textTransform: 'uppercase', letterSpacing: 1 }}>Expiración token (min)</label>
                  <input style={inputStyle} type="number" value={form.token_expire} onChange={e => setForm({ ...form, token_expire: e.target.value })} />
                </div>
              </div>

              {msg && (
                <div style={{ background: msg.includes('✅') ? `${C.green}22` : `${C.danger}22`, border: `1px solid ${msg.includes('✅') ? C.green : C.danger}44`, color: msg.includes('✅') ? C.green : C.danger, padding: '10px 14px', borderRadius: 7, fontSize: 13 }}>
                  {msg}
                </div>
              )}

              <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                <button onClick={saveConfig} disabled={saving} style={{ background: C.accent, color: '#000', border: 'none', padding: '9px 20px', borderRadius: 7, fontWeight: 700, fontSize: 13, cursor: 'pointer', fontFamily: "'Sora', sans-serif", opacity: saving ? 0.7 : 1 }}>
                  {saving ? 'Guardando...' : 'Guardar cambios'}
                </button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  )
}