import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

export default function Login() {
  const { login } = useAuth()
  const navigate = useNavigate()
  const [form, setForm] = useState({ username: '', password: '' })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      await login(form.username, form.password)
      navigate('/')
    } catch {
      setError('Usuario o contraseña incorrectos')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={styles.bg}>
      <div style={styles.card}>
        {/* Logo / título */}
        <div style={styles.logoWrap}>
          <div style={styles.logoIcon}>⬡</div>
          <div>
            <div style={styles.logoTitle}>RADIUS Manager</div>
            <div style={styles.logoSub}>Panel de Administración</div>
          </div>
        </div>

        <form onSubmit={handleSubmit} style={styles.form}>
          <div style={styles.field}>
            <label style={styles.label}>Usuario</label>
            <input
              style={styles.input}
              type="text"
              placeholder="admin"
              value={form.username}
              onChange={e => setForm({ ...form, username: e.target.value })}
              required
            />
          </div>
          <div style={styles.field}>
            <label style={styles.label}>Contraseña</label>
            <input
              style={styles.input}
              type="password"
              placeholder="••••••••"
              value={form.password}
              onChange={e => setForm({ ...form, password: e.target.value })}
              required
            />
          </div>

          {error && <div style={styles.error}>{error}</div>}

          <button style={{ ...styles.btn, opacity: loading ? 0.7 : 1 }} type="submit" disabled={loading}>
            {loading ? 'Iniciando sesión...' : 'Iniciar sesión'}
          </button>
        </form>

        <div style={styles.footer}>
          FreeRADIUS 3.2 · Ubuntu 24.04 LTS
        </div>
      </div>
    </div>
  )
}

const C = {
  bg: '#0d1117', surface: '#161b22', border: '#30363d',
  accent: '#00d4aa', text: '#e6edf3', muted: '#8b949e', danger: '#f85149',
}

const styles = {
  bg: {
    minHeight: '100vh', background: C.bg, display: 'flex',
    alignItems: 'center', justifyContent: 'center',
    fontFamily: "'Sora', sans-serif",
  },
  card: {
    background: C.surface, border: `1px solid ${C.border}`,
    borderRadius: 16, padding: '40px 36px', width: 380,
    boxShadow: `0 0 60px #00d4aa15`,
  },
  logoWrap: {
    display: 'flex', alignItems: 'center', gap: 14, marginBottom: 32,
  },
  logoIcon: {
    fontSize: 36, color: C.accent, lineHeight: 1,
    filter: `drop-shadow(0 0 12px ${C.accent})`,
  },
  logoTitle: { fontSize: 20, fontWeight: 700, color: C.text },
  logoSub: { fontSize: 12, color: C.muted, marginTop: 2 },
  form: { display: 'flex', flexDirection: 'column', gap: 16 },
  field: { display: 'flex', flexDirection: 'column', gap: 6 },
  label: { fontSize: 12, color: C.muted, fontWeight: 600, textTransform: 'uppercase', letterSpacing: 1 },
  input: {
    background: C.bg, border: `1px solid ${C.border}`, color: C.text,
    padding: '10px 14px', borderRadius: 8, fontSize: 14,
    fontFamily: "'Sora', sans-serif", outline: 'none',
    transition: 'border-color 0.2s',
  },
  error: {
    background: `${C.danger}22`, border: `1px solid ${C.danger}55`,
    color: C.danger, padding: '8px 12px', borderRadius: 6, fontSize: 13,
  },
  btn: {
    background: C.accent, color: '#000', border: 'none',
    padding: '12px', borderRadius: 8, fontWeight: 700, fontSize: 14,
    cursor: 'pointer', fontFamily: "'Sora', sans-serif",
    marginTop: 4, transition: 'opacity 0.2s',
  },
  footer: {
    textAlign: 'center', fontSize: 11, color: C.muted, marginTop: 24,
  },
}
