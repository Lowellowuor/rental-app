import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import api from '../api/axios'
import GlassCard from '../components/GlassCard'
import { 
  HomeIcon, 
  DocumentTextIcon, 
  UserCircleIcon,
  CreditCardIcon,
  ExclamationTriangleIcon,
  WrenchScrewdriverIcon,
  BuildingOfficeIcon,
  UsersIcon,
  ArrowRightIcon,
  CheckCircleIcon,
  ClockIcon,
  UserIcon
} from '@heroicons/react/24/outline'

export default function Dashboard() {
  const { user } = useAuth()
  const [stats, setStats] = useState({
    estates: 0,
    houses: 0,
    tenants: 0,
    overdueInvoices: 0,
    pendingMaintenance: 0,
    recentInvoices: [],
    recentMaintenance: [],
  })
  const [houseDetails, setHouseDetails] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchDashboardData = async () => {
      setLoading(true)
      try {
        const [estatesRes, housesRes, invoicesRes, maintenanceRes, leasesRes] = await Promise.all([
          api.get('/properties/estates/'),
          api.get('/properties/houses/'),
          api.get('/leasing/invoices/'),
          api.get('/maintenance/tickets/'),
          api.get('/leasing/leases/?status=active')
        ])

        const estates = estatesRes.data
        const houses = housesRes.data
        const invoices = invoicesRes.data
        const maintenance = maintenanceRes.data
        const leases = leasesRes.data

        const overdueInvoices = invoices.filter(inv => inv.status === 'overdue')
        const pendingMaintenance = maintenance.filter(t => t.status !== 'resolved' && t.status !== 'cancelled')

        const recentInvoices = invoices.slice(0, 3)
        const recentMaintenance = maintenance.slice(0, 3)

        setStats({
          estates: estates.length,
          houses: houses.length,
          tenants: 0,
          overdueInvoices: overdueInvoices.length,
          pendingMaintenance: pendingMaintenance.length,
          recentInvoices,
          recentMaintenance,
        })

        // Role‑specific house details
        if (user?.role === 'SUB_TENANT') {
          // Find the sub‑tenant's active lease
          const myLease = leases.find(lease => lease.sub_tenant === user.id)
          if (myLease) {
            // Fetch full lease details with room/house/estate
            const leaseDetailRes = await api.get('/leasing/leases/' + myLease.id + '/')
            setHouseDetails({
              type: 'subtenant',
              lease: leaseDetailRes.data,
              room: leaseDetailRes.data.room_details,
              house: leaseDetailRes.data.room_details?.house,
              estate: leaseDetailRes.data.room_details?.house?.estate,
            })
          }
        } else if (user?.role === 'MAIN_TENANT') {
          // Get houses where this user is the main tenant
          const myHousesRes = await api.get('/properties/houses/?main_tenant=' + user.id)
          const myHouses = myHousesRes.data
          // For each house, get rooms and sub‑tenants (via leases)
          const housesWithDetails = await Promise.all(myHouses.map(async (house) => {
            const roomsRes = await api.get('/properties/rooms/?house=' + house.id)
            const rooms = roomsRes.data
            const occupiedRooms = rooms.filter(r => r.is_occupied)
            // Get sub‑tenants from leases for this house
            const leasesForHouse = leases.filter(lease => lease.room?.house === house.id)
            const subTenantIds = [...new Set(leasesForHouse.map(l => l.sub_tenant))]
            const subTenants = await Promise.all(subTenantIds.map(id => 
              api.get('/users/' + id + '/').then(res => res.data)
            ))
            return {
              ...house,
              rooms,
              occupiedRooms: occupiedRooms.length,
              subTenants
            }
          }))
          setHouseDetails({
            type: 'maintenant',
            houses: housesWithDetails,
          })
        }

      } catch (err) {
        console.error('Failed to fetch dashboard data:', err)
      } finally {
        setLoading(false)
      }
    }

    fetchDashboardData()
  }, [user])

  const getStatusClass = (status) => {
    if (status === 'paid') return 'bg-green-200 text-green-800'
    if (status === 'overdue') return 'bg-red-200 text-red-800'
    return 'bg-yellow-200 text-yellow-800'
  }

  const getStatusIcon = (status) => {
    switch (status) {
      case 'paid': return <CheckCircleIcon className="w-4 h-4 text-green-600" />
      case 'overdue': return <ExclamationTriangleIcon className="w-4 h-4 text-red-600" />
      default: return <ClockIcon className="w-4 h-4 text-yellow-600" />
    }
  }

  const getQuickActions = () => {
    const actions = []
    const role = user?.role

    if (role === 'SUPER_ADMIN' || role === 'ESTATE_MANAGER') {
      actions.push({ label: 'Add Estate', icon: BuildingOfficeIcon, link: '/estates' })
      actions.push({ label: 'Add Tenant', icon: UsersIcon, link: '/tenants' })
    }
    if (role === 'MAIN_TENANT' || role === 'SUPER_ADMIN' || role === 'ESTATE_MANAGER') {
      actions.push({ label: 'Add House', icon: HomeIcon, link: '/houses' })
    }
    if (role === 'SUB_TENANT' || role === 'MAIN_TENANT') {
      actions.push({ label: 'Pay Rent', icon: CreditCardIcon, link: '/payment' })
    }
    if (role === 'SUB_TENANT') {
      actions.push({ label: 'Report Issue', icon: WrenchScrewdriverIcon, link: '/maintenance' })
    }
    return actions
  }

  const quickActions = getQuickActions()

  if (loading) {
    return (
      <div className="p-4 max-w-md mx-auto">
        <GlassCard><p className="text-gray-500 text-center">Loading dashboard...</p></GlassCard>
      </div>
    )
  }

  return (
    <div className="p-4 max-w-md mx-auto space-y-4 pb-20">
      {/* Welcome Header */}
      <div className="glass p-6">
        <div className="flex items-center gap-3">
          <UserCircleIcon className="w-10 h-10 text-blue-600" />
          <div>
            <h1 className="text-2xl font-bold text-gray-800">Welcome, {user?.username}</h1>
            <p className="text-gray-600">Role: {user?.role}</p>
          </div>
        </div>
      </div>

      {/* Role-specific House Details */}
      {houseDetails && (
        <>
          {houseDetails.type === 'subtenant' && (
            <GlassCard>
              <h2 className="font-semibold text-gray-700 flex items-center gap-2">
                <HomeIcon className="w-5 h-5 text-blue-600" />
                Your Room
              </h2>
              <div className="mt-2 space-y-1 text-sm text-gray-600">
                <p><span className="font-medium">Estate:</span> {houseDetails.estate?.name || 'N/A'}</p>
                <p><span className="font-medium">House:</span> {houseDetails.house?.house_number || 'N/A'}</p>
                <p><span className="font-medium">Room:</span> {houseDetails.room?.room_name || 'N/A'}</p>
                <p><span className="font-medium">Rent:</span> KES {houseDetails.lease?.monthly_rent}</p>
                <p><span className="font-medium">Lease Status:</span> {houseDetails.lease?.status}</p>
              </div>
            </GlassCard>
          )}

          {houseDetails.type === 'maintenant' && (
            <div>
              <h2 className="font-semibold text-gray-700 flex items-center gap-2 mb-2">
                <HomeIcon className="w-5 h-5 text-blue-600" />
                Your Houses ({houseDetails.houses?.length || 0})
              </h2>
              {houseDetails.houses?.length === 0 ? (
                <GlassCard><p className="text-gray-500">You have no houses assigned.</p></GlassCard>
              ) : (
                houseDetails.houses.map(house => (
                  <Link key={house.id} to={'/houses/' + house.id}>
                    <GlassCard>
                      <div className="flex justify-between items-center">
                        <div>
                          <p className="font-medium">{house.house_number}</p>
                          <p className="text-sm text-gray-600">
                            Rooms: {house.rooms?.length || 0} · Occupied: {house.occupiedRooms || 0}
                          </p>
                          <p className="text-sm text-gray-600">
                            Sub‑tenants: {house.subTenants?.length || 0}
                          </p>
                        </div>
                        <UserIcon className="w-5 h-5 text-gray-400" />
                      </div>
                    </GlassCard>
                  </Link>
                ))
              )}
            </div>
          )}
        </>
      )}

      {/* Stats Summary - Clickable Cards */}
      <div className="grid grid-cols-2 gap-2">
        {/** Estates Card - visible to admin/manager */}
        {(user?.role === 'SUPER_ADMIN' || user?.role === 'ESTATE_MANAGER') && (
          <Link to="/estates" className="block">
            <GlassCard>
              <BuildingOfficeIcon className="w-5 h-5 text-indigo-600 mx-auto" />
              <p className="text-sm text-gray-600 text-center">Estates</p>
              <p className="text-xl font-bold text-gray-800 text-center">{stats.estates}</p>
            </GlassCard>
          </Link>
        )}
        {/** Houses Card - visible to all except sub tenant? Actually main tenant should see houses they manage */}
        {(user?.role !== 'SUB_TENANT') && (
          <Link to="/houses" className="block">
            <GlassCard>
              <HomeIcon className="w-5 h-5 text-blue-600 mx-auto" />
              <p className="text-sm text-gray-600 text-center">Houses</p>
              <p className="text-xl font-bold text-gray-800 text-center">{stats.houses}</p>
            </GlassCard>
          </Link>
        )}
        {/** Overdue Invoices Card - visible to all */}
        <Link to="/arrears" className="block">
          <GlassCard>
            <ExclamationTriangleIcon className="w-5 h-5 text-red-600 mx-auto" />
            <p className="text-sm text-gray-600 text-center">Overdue</p>
            <p className="text-xl font-bold text-red-600 text-center">{stats.overdueInvoices}</p>
          </GlassCard>
        </Link>
        {/** Maintenance Card - visible to all */}
        <Link to="/maintenance" className="block">
          <GlassCard>
            <WrenchScrewdriverIcon className="w-5 h-5 text-yellow-600 mx-auto" />
            <p className="text-sm text-gray-600 text-center">Maintenance</p>
            <p className="text-xl font-bold text-yellow-600 text-center">{stats.pendingMaintenance}</p>
          </GlassCard>
        </Link>
      </div>

      {/* Quick Actions */}
      {quickActions.length > 0 && (
        <GlassCard>
          <h2 className="font-semibold text-gray-700 flex items-center gap-2">
            <UserCircleIcon className="w-5 h-5 text-gray-600" />
            Quick Actions
          </h2>
          <div className="mt-2 space-y-2">
            {quickActions.map((action, idx) => (
              <Link key={idx} to={action.link} className="block w-full">
                <button className="w-full py-2 bg-blue-500/20 backdrop-blur-sm rounded-lg text-blue-700 font-medium flex items-center justify-center gap-2 hover:bg-blue-500/30 transition-all">
                  <action.icon className="w-5 h-5" />
                  {action.label}
                </button>
              </Link>
            ))}
          </div>
        </GlassCard>
      )}

      {/* Recent Invoices */}
      <div>
        <div className="flex justify-between items-center mb-2">
          <h2 className="font-semibold text-gray-700 flex items-center gap-2">
            <DocumentTextIcon className="w-5 h-5 text-gray-600" />
            Recent Invoices
          </h2>
          <Link to="/invoices" className="text-sm text-blue-600 hover:underline flex items-center gap-1">
            View All <ArrowRightIcon className="w-4 h-4" />
          </Link>
        </div>
        {stats.recentInvoices.length === 0 ? (
          <GlassCard><p className="text-gray-500 text-sm">No recent invoices.</p></GlassCard>
        ) : (
          stats.recentInvoices.map(inv => (
            <GlassCard key={inv.id}>
              <div className="flex justify-between items-center">
                <div>
                  <p className="font-medium">KES {inv.total_amount}</p>
                  <p className="text-xs text-gray-600">Due: {inv.due_date}</p>
                </div>
                <div className="flex items-center gap-2">
                  {getStatusIcon(inv.status)}
                  <span className={"px-2 py-1 rounded-full text-xs font-medium " + getStatusClass(inv.status)}>
                    {inv.status}
                  </span>
                </div>
              </div>
            </GlassCard>
          ))
        )}
      </div>

      {/* Recent Maintenance */}
      <div>
        <div className="flex justify-between items-center mb-2">
          <h2 className="font-semibold text-gray-700 flex items-center gap-2">
            <WrenchScrewdriverIcon className="w-5 h-5 text-gray-600" />
            Recent Maintenance
          </h2>
          <Link to="/maintenance" className="text-sm text-blue-600 hover:underline flex items-center gap-1">
            View All <ArrowRightIcon className="w-4 h-4" />
          </Link>
        </div>
        {stats.recentMaintenance.length === 0 ? (
          <GlassCard><p className="text-gray-500 text-sm">No recent maintenance tickets.</p></GlassCard>
        ) : (
          stats.recentMaintenance.map(ticket => (
            <GlassCard key={ticket.id}>
              <div className="flex justify-between items-center">
                <div>
                  <p className="font-medium text-sm">{ticket.description}</p>
                  <p className="text-xs text-gray-600">Status: {ticket.status}</p>
                </div>
                <span className={"px-2 py-1 rounded-full text-xs font-medium " + (
                  ticket.status === 'resolved' ? 'bg-green-200 text-green-800' :
                  ticket.status === 'in-progress' ? 'bg-blue-200 text-blue-800' :
                  'bg-yellow-200 text-yellow-800'
                )}>
                  {ticket.status}
                </span>
              </div>
            </GlassCard>
          ))
        )}
      </div>
    </div>
  )
}
