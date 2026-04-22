import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider } from './context/AuthContext'
import PrivateRoute from './components/PrivateRoute'
import Layout from './components/Layout'
import Login from './pages/Login'
import Dashboard from './pages/Dashboard'
import Users from './pages/Users'
import Groups from './pages/Groups'
import NAS from './pages/NAS'
import Sessions from './pages/Sessions'
import Logs from './pages/Logs'
import Reports from './pages/Reports'
import BatchUsers from './pages/BatchUsers'
import Profiles from './pages/Profiles'
import Vouchers from './pages/Vouchers'
import Config from './pages/Config'

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/*" element={
            <PrivateRoute>
              <Layout>
                <Routes>
                  <Route path="/"          element={<Dashboard />} />
                  <Route path="/usuarios"  element={<Users />} />
                  <Route path="/grupos"    element={<Groups />} />
                  <Route path="/nas"       element={<NAS />} />
                  <Route path="/sesiones"  element={<Sessions />} />
                  <Route path="/logs"      element={<Logs />} />
                  <Route path="/reportes"  element={<Reports />} />
                  <Route path="/batch" element={<BatchUsers />} />
                  <Route path="/perfiles" element={<Profiles />} />
                  <Route path="/vouchers" element={<Vouchers />} />
                  <Route path="/config" element={<Config />} />
                  <Route path="*"          element={<Navigate to="/" replace />} />
                </Routes>
              </Layout>
            </PrivateRoute>
          } />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  )
}
