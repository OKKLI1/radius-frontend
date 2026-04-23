import { BrowserRouter, Routes, Route, Navigate, Outlet } from 'react-router-dom'
import { AuthProvider } from './context/AuthContext'
import { ThemeProvider } from './context/ThemeContext'
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
import BatchUsers from './pages/Batchusers'
import Profiles from './pages/Profiles'
import Vouchers from './pages/Vouchers'
import Config from './pages/Config'
import Hotspots from './pages/Hotspots'
import UserGroups from './pages/UserGroups'
import HuntGroups from './pages/HuntGroups'
import Attributes from './pages/Attributes'
import RealmProxy from './pages/RealmProxy'
import IPPool from './pages/IPPool'
import AccountingGeneral from './pages/AccountingGeneral'
import AccountingPlans from './pages/AccountingPlans'
import AccountingCustom from './pages/AccountingCustom'
import AccountingHotspot from './pages/AccountingHotspot'
import AccountingMaintenance from './pages/AccountingMaintenance'

export default function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route element={
              <PrivateRoute>
                <Layout>
                  <Outlet />
                </Layout>
              </PrivateRoute>
            }>
              <Route path="/"          element={<Dashboard />} />
              <Route path="/usuarios"  element={<Users />} />
              <Route path="/grupos"    element={<Groups />} />
              <Route path="/nas"       element={<NAS />} />
              <Route path="/sesiones"  element={<Sessions />} />
              <Route path="/logs"      element={<Logs />} />
              <Route path="/reportes">
                <Route index element={<Navigate to="/reportes/general" replace />} />
                <Route path="general" element={<Reports />} />
                <Route path="logs" element={<Reports />} />
                <Route path="status" element={<Reports />} />
                <Route path="batch" element={<Reports />} />
                <Route path="dashboard" element={<Reports />} />
              </Route>
              <Route path="/batch" element={<BatchUsers />} />
              <Route path="/hotspots" element={<Hotspots />} />
              <Route path="/user-groups" element={<UserGroups />} />
              <Route path="/hunt-groups" element={<HuntGroups />} />
              <Route path="/attributes" element={<Attributes />} />
              <Route path="/realm-proxy" element={<RealmProxy />} />
              <Route path="/ip-pool" element={<IPPool />} />
              <Route path="/accounting">
                <Route index element={<Navigate to="/accounting/general" replace />} />
                <Route path="general" element={<AccountingGeneral />} />
                <Route path="plans" element={<AccountingPlans />} />
                <Route path="custom" element={<AccountingCustom />} />
                <Route path="hotspot" element={<AccountingHotspot />} />
                <Route path="maintenance" element={<AccountingMaintenance />} />
              </Route>
              <Route path="/perfiles" element={<Profiles />} />
              <Route path="/vouchers" element={<Vouchers />} />
              <Route path="/config">
                <Route index element={<Navigate to="/config/general" replace />} />
                <Route path="general" element={<Config />} />
                <Route path="reporting" element={<Config />} />
                <Route path="maintenance" element={<Config />} />
                <Route path="operators" element={<Config />} />
                <Route path="backup" element={<Config />} />
                <Route path="mail" element={<Config />} />
              </Route>
              <Route path="*"          element={<Navigate to="/" replace />} />
            </Route>
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </ThemeProvider>
  )
}
