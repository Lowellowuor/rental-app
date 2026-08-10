import { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import api from '../api/axios'
import GlassCard from '../components/GlassCard'
import { 
  UserCircleIcon, 
  ArrowLeftIcon, 
  PhoneIcon, 
  EnvelopeIcon,
  HomeIcon,
  DocumentTextIcon,
  WrenchScrewdriverIcon,
  CreditCardIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  ClockIcon
} from '@heroicons/react/24/outline'

export default function TenantDetail() {
  const { id } = useParams()
  const [tenant, setTenant] = useState(null)
  const [leases, setLeases] = useState([])
  const [invoices, setInvoices] = useState([])
  const [maintenance, setMaintenance] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchTenantData = async () => {
      setLoading(true)
      try {
        // Fetch tenant details
        const tenantRes = await api.get('/users/list/?id=' + id)
        const tenantData = tenantRes.data[0] // if list returns array
        setTenant(tenantData)

        // Fetch leases for this tenant
        const leasesRes = await api.get('/leasing/leases/?sub_tenant=' + id)
        setLeases(leasesRes.data)

        // Fetch invoices for this tenant
        const invoicesRes = await api.get('/leasing/invoices/?lease__sub_tenant=' + id)
        setInvoices(invoicesRes.data)

        // Fetch maintenance tickets for this tenant
        const maintRes = await api.get('/maintenance/tickets/?tenant=' + id)
        setMaintenance(maintRes.data)
      } catch (err) {
        console.error(err)
      } finally {
        setLoading(false)
      }
    }
    if (id) fetchTenantData()
  }, [id])

  if (loading) {
    return (
      <div className="p-4 max-w-md mx-auto">
        <GlassCard><p className="text-gray-500 text-center">Loading tenant details...</p></GlassCard>
      </div>
    )
  }

  if (!tenant) {
    return (
      <div className="p-4 max-w-md mx-auto">
        <GlassCard><p className="text-red-500 text-center">Tenant not found.</p></GlassCard>
      </div>
    )
  }

  const activeLease = leases.find(l => l.status === 'active')
  const paidInvoices = invoices.filter(inv => inv.status === 'paid')
  const overdueInvoices = invoices.filter(inv => inv.status === 'overdue')
  const pendingMaintenance = maintenance.filter(m => m.status !== 'resolved' && m.status !== 'cancelled')

  return (
    <div className="p-4 max-w-md mx-auto space-y-4 pb-20">
      <Link to="/tenants" className="inline-flex items-center gap-1 text-blue-600 hover:text-blue-800">
        <ArrowLeftIcon className="w-5 h-5" />
        Back to Tenants
      </Link>

      <GlassCard>
        <div className="flex items-center gap-4">
          <UserCircleIcon className="w-16 h-16 text-blue-600" />
          <div>
            <h1 className="text-2xl font-bold text-gray-800">{tenant.username}</h1>
            <p className="text-gray-600">Role: {tenant.role}</p>
            <p className="text-gray-600 flex items-center gap-1"><PhoneIcon className="w-4 h-4" /> {tenant.phone_number}</p>
            {tenant.email && <p className="text-gray-600 flex items-center gap-1"><EnvelopeIcon className="w-4 h-4" /> {tenant.email}</p>}
          </div>
        </div>
      </GlassCard>

      <div className="grid grid-cols-3 gap-2">
        <GlassCard>
          <p className="text-sm text-gray-600">Leases</p>
          <p className="text-xl font-bold text-gray-800">{leases.length}</p>
        </GlassCard>
        <GlassCard>
          <p className="text-sm text-gray-600">Invoices</p>
          <p className="text-xl font-bold text-gray-800">{invoices.length}</p>
        </GlassCard>
        <GlassCard>
          <p className="text-sm text-gray-600">Maintenance</p>
          <p className="text-xl font-bold text-gray-800">{pendingMaintenance.length}</p>
        </GlassCard>
      </div>

      {/* Current Lease */}
      <div>
        <h2 className="font-semibold text-gray-700 flex items-center gap-2">
          <HomeIcon className="w-5 h-5 text-blue-600" />
          Current Lease
        </h2>
        {activeLease ? (
          <GlassCard>
            <p><span className="font-medium">House:</span> {activeLease.room?.house?.house_number || 'N/A'}</p>
            <p><span className="font-medium">Room:</span> {activeLease.room?.room_name || 'N/A'}</p>
            <p><span className="font-medium">Monthly Rent:</span> KES {activeLease.monthly_rent}</p>
            <p><span className="font-medium">Due Day:</span> {activeLease.rent_due_day}</p>
            <p><span className="font-medium">Start:</span> {activeLease.start_date}</p>
            {activeLease.end_date && <p><span className="font-medium">End:</span> {activeLease.end_date}</p>}
          </GlassCard>
        ) : (
          <GlassCard><p className="text-gray-500">No active lease</p></GlassCard>
        )}
      </div>

      {/* Invoices */}
      <div>
        <div className="flex justify-between items-center mb-2">
          <h2 className="font-semibold text-gray-700 flex items-center gap-2">
            <DocumentTextIcon className="w-5 h-5 text-blue-600" />
            Invoices
          </h2>
          <span className="text-sm text-gray-500">{invoices.length} total</span>
        </div>
        {invoices.length === 0 ? (
          <GlassCard><p className="text-gray-500">No invoices</p></GlassCard>
        ) : (
          invoices.slice(0, 3).map(inv => (
            <GlassCard key={inv.id}>
              <div className="flex justify-between items-center">
                <div>
                  <p className="font-medium">KES {inv.total_amount}</p>
                  <p className="text-sm text-gray-600">Due: {inv.due_date}</p>
                </div>
                <span className={"px-2 py-1 rounded-full text-xs font-medium " + (
                  inv.status === 'paid' ? 'bg-green-200 text-green-800' :
                  inv.status === 'overdue' ? 'bg-red-200 text-red-800' :
                  'bg-yellow-200 text-yellow-800'
                )}>
                  {inv.status}
                </span>
              </div>
            </GlassCard>
          ))
        )}
        {invoices.length > 3 && (
          <Link to="/invoices" className="text-sm text-blue-600 hover:underline">View all invoices</Link>
        )}
      </div>

      {/* Maintenance */}
      <div>
        <div className="flex justify-between items-center mb-2">
          <h2 className="font-semibold text-gray-700 flex items-center gap-2">
            <WrenchScrewdriverIcon className="w-5 h-5 text-blue-600" />
            Maintenance Tickets
          </h2>
          <span className="text-sm text-gray-500">{pendingMaintenance.length} pending</span>
        </div>
        {maintenance.length === 0 ? (
          <GlassCard><p className="text-gray-500">No maintenance tickets</p></GlassCard>
        ) : (
          maintenance.slice(0, 3).map(m => (
            <GlassCard key={m.id}>
              <div className="flex justify-between items-center">
                <div>
                  <p className="font-medium text-sm">{m.description}</p>
                  <p className="text-xs text-gray-600">Status: {m.status}</p>
                </div>
                <span className={"px-2 py-1 rounded-full text-xs font-medium " + (
                  m.status === 'resolved' ? 'bg-green-200 text-green-800' :
                  m.status === 'in-progress' ? 'bg-blue-200 text-blue-800' :
                  'bg-yellow-200 text-yellow-800'
                )}>
                  {m.status}
                </span>
              </div>
            </GlassCard>
          ))
        )}
        {maintenance.length > 3 && (
          <Link to="/maintenance" className="text-sm text-blue-600 hover:underline">View all maintenance</Link>
        )}
      </div>
    </div>
  )
}
