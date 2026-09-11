import { Routes, Route, Navigate, Outlet } from 'react-router-dom'
import { AuthProvider, useAuth } from '@/features/auth/context/AuthContext'

import LoginPage from '@/features/auth/pages/LoginPage'
import RegisterPage from '@/features/auth/pages/RegisterPage'
import ProfilePage from '@/features/auth/pages/ProfilePage'

import Dashboard from '@/features/dashboard/pages/Dashboard'

import EstateListPage from '@/features/properties/pages/EstateListPage'
import EstateDetailPage from '@/features/properties/pages/EstateDetailPage'
import HouseListPage from '@/features/properties/pages/HouseListPage'
import HouseDetailPage from '@/features/properties/pages/HouseDetailPage'
import RoomListPage from '@/features/properties/pages/RoomListPage'

import TenantListPage from '@/features/tenants/pages/TenantListPage'
import TenantDetailPage from '@/features/tenants/pages/TenantDetailPage'

import LeaseListPage from '@/features/leasing/pages/LeaseListPage'
import InvoiceListPage from '@/features/leasing/pages/InvoiceListPage'

import PaymentPage from '@/features/payments/pages/PaymentPage'
import ArrearsPage from '@/features/payments/pages/ArrearsPage'

import MaintenanceListPage from '@/features/maintenance/pages/MaintenanceListPage'

import AppLayout from '@/components/layout/AppLayout'

const MANAGER_ROLES = ['ADMIN', 'LANDLORD', 'ESTATE_MANAGER']
const FINANCE_ROLES = ['ADMIN', 'LANDLORD', 'ESTATE_MANAGER', 'ACCOUNTANT']

function Splash() {
  return (
    <div className="grid min-h-dvh place-items-center bg-canvas">
      <div className="size-6 animate-spin rounded-full border-2 border-edge border-t-ink" />
    </div>
  )
}

function RequireAuth() {
  const { token, loading } = useAuth()
  if (loading) return <Splash />
  if (!token) return <Navigate to="/login" replace />
  return <Outlet />
}

function RequireRole({ roles, children }) {
  const { user, loading } = useAuth()
  if (loading) return <Splash />
  if (!user) return <Navigate to="/" replace />
  if (!roles.includes(user.role)) return <Navigate to="/" replace />
  return children
}

function NotFound() {
  return (
    <div className="grid min-h-dvh place-items-center bg-canvas p-6 text-center">
      <div>
        <p className="text-[13px] font-medium uppercase tracking-[0.08em] text-faint">404</p>
        <h1 className="mt-1 text-[22px] font-semibold text-ink">Page not found</h1>
        <a
          href="/"
          className="mt-4 inline-flex h-10 items-center rounded-xl bg-ink px-4 text-[14px] font-semibold text-white hover:bg-ink/90"
        >
          Go home
        </a>
      </div>
    </div>
  )
}

export default function App() {
  return (
    <AuthProvider>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />

        <Route element={<RequireAuth />}>
          <Route path="/" element={<AppLayout />}>
            <Route index element={<Dashboard />} />

            <Route path="estates" element={<EstateListPage />} />
            <Route path="estates/:id" element={<EstateDetailPage />} />

            <Route path="houses" element={<HouseListPage />} />
            <Route path="houses/:id" element={<HouseDetailPage />} />

            <Route path="rooms" element={<RoomListPage />} />

            <Route
              path="tenants"
              element={
                <RequireRole roles={[...MANAGER_ROLES, 'CARETAKER']}>
                  <TenantListPage />
                </RequireRole>
              }
            />
            <Route
              path="tenants/:id"
              element={
                <RequireRole roles={[...MANAGER_ROLES, 'CARETAKER']}>
                  <TenantDetailPage />
                </RequireRole>
              }
            />

            <Route path="leases" element={<LeaseListPage />} />
            <Route path="invoices" element={<InvoiceListPage />} />

            <Route
              path="payment"
              element={
                <RequireRole roles={['TENANT', 'SUB_TENANT']}>
                  <PaymentPage />
                </RequireRole>
              }
            />

            <Route
              path="arrears"
              element={
                <RequireRole roles={FINANCE_ROLES}>
                  <ArrearsPage />
                </RequireRole>
              }
            />

            <Route path="maintenance" element={<MaintenanceListPage />} />
            <Route path="profile" element={<ProfilePage />} />
          </Route>
        </Route>

        <Route path="*" element={<NotFound />} />
      </Routes>
    </AuthProvider>
  )
}