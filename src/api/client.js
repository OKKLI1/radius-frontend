import axios from 'axios'

const api = axios.create({
  baseURL: '/api',
})

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token')
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

api.interceptors.response.use(
  (res) => res,
  (err) => {
    const isLoginRoute = err.config?.url?.includes('/auth/login')
    if (err.response?.status === 401 && !isLoginRoute) {
      const currentPath = window.location.pathname + window.location.search + window.location.hash
      if (currentPath && currentPath !== '/login') {
        localStorage.setItem('axio_last_route', currentPath)
      }
      localStorage.removeItem('token')
      window.location.href = '/login'
    }
    return Promise.reject(err)
  }
)

export default api
