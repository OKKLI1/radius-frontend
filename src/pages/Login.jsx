import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { C, brand, inputStyle, btnPrimary } from '../theme'

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
      {/* Fondo decorativo */}
      <div style={styles.bgBlob1} />
      <div style={styles.bgBlob2} />

      <div style={styles.card}>
        {/* Logo */}
        <div style={styles.logoWrap}>
          <div style={styles.logoIcon}>⬡</div>
          <div>
            <div style={styles.logoTitle}>{brand.name}</div>
            <div style={styles.logoSub}>{brand.tagline}</div>
          </div>
        </div>

        <div style={{ fontSize: 20, fontWeight: 700, color: C.text, marginBottom: 4 }}>
          Iniciar sesión
        </div>
        <div style={{ fontSize: 13, color: C.muted, marginBottom: 24 }}>
          Ingresa tus credenciales de administrador
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            <label style={styles.label}>Usuario</label>
            <input
              style={inputStyle}
              type="text"
              placeholder="admin"
              value={form.username}
              onChange={e => setForm({ ...form, username: e.target.value })}
              required
              autoFocus
            />
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            <label style={styles.label}>Contraseña</label>
            <input
              style={inputStyle}
              type="password"
              placeholder="••••••••"
              value={form.password}
              onChange={e => setForm({ ...form, password: e.target.value })}
              required
            />
          </div>

          {error && (
            <div style={styles.error}>{error}</div>
          )}

          <button
            style={{ ...btnPrimary, padding: '12px', opacity: loading ? 0.7 : 1, marginTop: 4, background: C.gradientAccent }}
            type="submit"
            disabled={loading}
          >
            {loading ? 'Iniciando sesión...' : 'Iniciar sesión →'}
          </button>
        </form>

        <div style={styles.footer}>
          FreeRADIUS 3.2 · Ubuntu 24.04 LTS · {brand.name} v{brand.version}
        </div>
      </div>
    </div>
  )
}

const styles = {
  bg: {
    minHeight: '100vh',
    background: C.bg,
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    fontFamily: "'Sora', sans-serif",
    position: 'relative', overflow: 'hidden',
  },
  bgBlob1: {
    position: 'absolute', width: 400, height: 400, borderRadius: '50%',
    background: `radial-gradient(circle, ${C.accentMid}, transparent 70%)`,
    top: -100, right: -100, pointerEvents: 'none',
  },
  bgBlob2: {
    position: 'absolute', width: 300, height: 300, borderRadius: '50%',
    background: `radial-gradient(circle, #6366f120, transparent 70%)`,
    bottom: -80, left: -80, pointerEvents: 'none',
  },
  card: {
    background: C.surface,
    border: `1px solid ${C.border}`,
    borderRadius: 16,
    padding: '36px 32px',
    width: 400,
    boxShadow: `0 20px 60px #00000040, 0 0 0 1px ${C.border}`,
    position: 'relative', zIndex: 1,
  },
  logoWrap: {
    display: 'flex', alignItems: 'center', gap: 12, marginBottom: 28,
  },
  logoIcon: {
    width: 40, height: 40, borderRadius: 10,
    background: C.gradientAccent,
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    color: '#fff', fontSize: 20,
    boxShadow: `0 4px 16px ${C.accentMid}`,
  },
  logoTitle: {
    fontSize: 18, fontWeight: 700, color: C.text,
  },
  logoSub: {
    fontSize: 11, color: C.muted,
  },
  label: {
    fontSize: 12, color: C.textSoft, fontWeight: 600,
    textTransform: 'uppercase', letterSpacing: 1,
  },
  error: {
    background: `${C.danger}18`, border: `1px solid ${C.danger}44`,
    color: C.danger, padding: '10px 14px', borderRadius: 8, fontSize: 13,
  },
  footer: {
    textAlign: 'center', fontSize: 11, color: C.muted, marginTop: 24,
  },
}
