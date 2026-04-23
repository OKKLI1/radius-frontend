import { useState, useEffect } from 'react'
import api from '../api/client'
import { AuthContext } from './auth-context'

export function AuthProvider({ children }) {
  const [token, setToken] = useState(() => localStorage.getItem('token'))

  useEffect(() => {
    if (token) localStorage.setItem('token', token)
    else localStorage.removeItem('token')
  }, [token])

  const login = async (username, password) => {
    const user = String(username || '').trim()
    const pass = String(password || '')

    const params = new URLSearchParams()
    params.append('username', user)
    params.append('password', pass)

    try {
      const { data } = await api.post('/auth/login', params, {
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      })
      localStorage.setItem('token', data.access_token)
      setToken(data.access_token)
      return data
    } catch (err) {
      const status = err?.response?.status
      const detail = err?.response?.data?.detail

      if (!status) {
        throw new Error('No se pudo conectar con el backend. Revisa proxy /api y que radius-api este activo en :8080.')
      }
      if (status === 401) {
        throw new Error(detail || 'Usuario o contrasena incorrectos')
      }
      if (status === 422) {
        throw new Error('Error de formato en login. Backend esperaba formulario OAuth2.')
      }
      throw new Error(detail || `Error de autenticacion (${status})`)
    }
  }

  const logout = () => {
    const currentPath = window.location.pathname + window.location.search + window.location.hash
    if (currentPath && currentPath !== '/login') {
      localStorage.setItem('axio_last_route', currentPath)
    }
    localStorage.removeItem('token')
    setToken(null)
    window.location.href = '/login'
  }

  return (
    <AuthContext.Provider value={{ token, login, logout, isAuth: !!token }}>
      {children}
    </AuthContext.Provider>
  )
}
