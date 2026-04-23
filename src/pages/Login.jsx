import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/useAuth'
import { useTheme } from '../context/useTheme'
import { C, brand, inputStyle, btnPrimary } from '../theme'

function getSafeNextRoute() {
  const saved = localStorage.getItem('axio_last_route')
  if (!saved) return '/'
  if (!saved.startsWith('/')) return '/'
  if (saved === '/login' || saved.startsWith('/login?') || saved.startsWith('/login#')) {
    return '/'
  }
  return saved
}

export default function Login() {
  const { login, isAuth } = useAuth()
  const { isDark, toggleTheme } = useTheme()
  const navigate = useNavigate()
  const [form, setForm] = useState({ username: '', password: '' })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (isAuth) {
      navigate(getSafeNextRoute(), { replace: true })
    }
  }, [isAuth, navigate])

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      await login(form.username, form.password)
      const nextRoute = getSafeNextRoute()
      localStorage.setItem('axio_last_route', nextRoute)
      window.location.assign(nextRoute)
    } catch (err) {
      setError(err?.message || 'Error de autenticacion')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={styles.bg}>
      <div style={styles.bgBlob1} />
      <div style={styles.bgBlob2} />
      <button onClick={toggleTheme} style={styles.themeBtn}>
        {isDark ? 'Claro' : 'Oscuro'}
      </button>

      <div style={styles.card}>
        <div style={styles.logoWrap}>
          <img src={brand.logo} alt={brand.name} style={styles.logoImage} />
        </div>

        <div style={{ fontSize: 20, fontWeight: 700, color: C.text, marginBottom: 4 }}>
          Iniciar sesion
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
              onChange={(e) => setForm({ ...form, username: e.target.value })}
              required
              autoFocus
            />
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            <label style={styles.label}>Contrasena</label>
            <input
              style={inputStyle}
              type="password"
              placeholder="********"
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
              required
            />
          </div>

          {error && <div style={styles.error}>{error}</div>}

          <button
            style={{ ...btnPrimary, padding: '12px', opacity: loading ? 0.7 : 1, marginTop: 4, background: C.gradientAccent }}
            type="submit"
            disabled={loading}
          >
            {loading ? 'Iniciando sesion...' : 'Iniciar sesion'}
          </button>
        </form>

        <div style={styles.footer}>
          FreeRADIUS 3.2 | Ubuntu 24.04 LTS | {brand.name} v{brand.version}
        </div>
      </div>
    </div>
  )
}

const styles = {
  bg: {
    minHeight: '100vh',
    background: C.bg,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontFamily: "'Sora', sans-serif",
    position: 'relative',
    overflow: 'hidden',
  },
  bgBlob1: {
    position: 'absolute',
    width: 400,
    height: 400,
    borderRadius: '50%',
    background: `radial-gradient(circle, ${C.accentMid}, transparent 70%)`,
    top: -100,
    right: -100,
    pointerEvents: 'none',
  },
  bgBlob2: {
    position: 'absolute',
    width: 300,
    height: 300,
    borderRadius: '50%',
    background: 'radial-gradient(circle, #6366f120, transparent 70%)',
    bottom: -80,
    left: -80,
    pointerEvents: 'none',
  },
  card: {
    background: C.surface,
    border: `1px solid ${C.border}`,
    borderRadius: 16,
    padding: '36px 32px',
    width: 400,
    boxShadow: `0 20px 60px #00000040, 0 0 0 1px ${C.border}`,
    position: 'relative',
    zIndex: 1,
  },
  themeBtn: {
    position: 'absolute',
    top: 20,
    right: 20,
    background: C.surface2,
    color: C.text,
    border: `1px solid ${C.border}`,
    borderRadius: 8,
    padding: '8px 12px',
    cursor: 'pointer',
    fontSize: 12,
    fontFamily: "'Sora', sans-serif",
    zIndex: 2,
  },
  logoWrap: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 28,
  },
  logoImage: {
    width: '100%',
    maxWidth: 280,
    height: 'auto',
    objectFit: 'contain',
    flexShrink: 0,
    filter: 'drop-shadow(0 4px 14px rgba(0,0,0,0.32))',
  },
  label: {
    fontSize: 12,
    color: C.textSoft,
    fontWeight: 600,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  error: {
    background: `${C.danger}18`,
    border: `1px solid ${C.danger}44`,
    color: C.danger,
    padding: '10px 14px',
    borderRadius: 8,
    fontSize: 13,
  },
  footer: {
    textAlign: 'center',
    fontSize: 11,
    color: C.muted,
    marginTop: 24,
  },
}
