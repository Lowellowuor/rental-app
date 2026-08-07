import { Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth } from './context/AuthContext'
import Login from './pages/Login'
import Layout from './components/Layout'
import Dashboard from './pages/Dashboard'
import EstateList from './pages/EstateList'
import EstateDetail from './pages/EstateDetail'
import HouseList from './pages/HouseList'
import HouseDetail from './pages/HouseDetail'
import RoomList from './pages/RoomList'
import TenantList from './pages/TenantList'
import LeaseList from './pages/LeaseList'
import Invoices from './pages/Invoices'
import Payment from './pages/Payment'
import ArrearsDashboard from './pages/ArrearsDashboard'
import MaintenanceList from './pages/MaintenanceList'
import Profile from './pages/Profile'

const PrivateRoute = ({ children }) => {
  const { token } = useAuth()
  return token ? children : <Navigate to="/login" replace />
}

function App() {
  return (
    <AuthProvider>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/" element={<PrivateRoute><Layout /></PrivateRoute>}>
          <Route index element={<Dashboard />} />
          <Route path="estates" element={<EstateList />} />
          <Route path="estates/:id" element={<EstateDetail />} />
          <Route path="houses" element={<HouseList />} />
          <Route path="houses/:id" element={<HouseDetail />} />
          <Route path="rooms" element={<RoomList />} />
          <Route path="tenants" element={<TenantList />} />
          <Route path="leases" element={<LeaseList />} />
          <Route path="invoices" element={<Invoices />} />
          <Route path="payment" element={<Payment />} />
          <Route path="arrears" element={<ArrearsDashboard />} />
          <Route path="maintenance" element={<MaintenanceList />} />
          <Route path="profile" element={<Profile />} />
        </Route>
      </Routes>
    </AuthProvider>
  )
}

export default App
