import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import api from '../api/axios'
import GlassCard from '../components/GlassCard'
import { 
  DocumentTextIcon, 
  CheckCircleIcon, 
  ClockIcon, 
  ExclamationCircleIcon,
  HomeIcon,
  UserIcon,
  CreditCardIcon
} from '@heroicons/react/24/outline'

export default function Invoices() {
  const [invoices, setInvoices] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api.get('/leasing/invoices/')
      .then(res => {
        setInvoices(res.data)
        setLoading(false)
      })
      .catch(err => {
        console.error(err)
        setLoading(false)
      })
  }, [])

  const getStatusIcon = (status) => {
    switch (status) {
      case 'paid': return <CheckCircleIcon className="w-5 h-5 text-green-600" />
      case 'overdue': return <ExclamationCircleIcon className="w-5 h-5 text-red-600" />
      default: return <ClockIcon className="w-5 h-5 text-yellow-600" />
    }
  }

  const getStatusClass = (status) => {
    if (status === 'paid') return 'bg-green-200 text-green-800'
    if (status === 'overdue') return 'bg-red-200 text-red-800'
    return 'bg-yellow-200 text-yellow-800'
  }

  return (
    <div className="p-4 max-w-md mx-auto space-y-4 pb-20">
      <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
        <DocumentTextIcon className="w-7 h-7 text-indigo-600" />
        Invoices
      </h1>

      {loading ? (
        <GlassCard><p className="text-gray-500 text-center">Loading invoices...</p></GlassCard>
      ) : invoices.length === 0 ? (
        <GlassCard><p className="text-gray-500 text-center">No invoices found.</p></GlassCard>
      ) : (
        invoices.map(inv => {
          // Extract house and room info from the nested lease object
          const lease = inv.lease || {}
          const room = lease.room || {}
          const house = room.house || {}
          const estate = house.estate || {}
          const tenantName = lease.sub_tenant?.username || 'Unknown'

          return (
            <GlassCard key={inv.id}>
              <div className="space-y-2">
                {/* Header: House & Room info */}
                <div className="flex justify-between items-start">
                  <div>
                    <p className="font-semibold text-gray-800 flex items-center gap-1">
                      <HomeIcon className="w-4 h-4 text-blue-600" />
                      {house.house_number || 'N/A'}
                      <span className="text-sm font-normal text-gray-500">
                        ({estate.name || 'No estate'})
                      </span>
                    </p>
                    <p className="text-sm text-gray-600 flex items-center gap-1">
                      <span className="font-medium">Room:</span> {room.room_name || 'N/A'}
                    </p>
                    <p className="text-sm text-gray-600 flex items-center gap-1">
                      <UserIcon className="w-4 h-4" />
                      {tenantName}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    {getStatusIcon(inv.status)}
                    <span className={"px-2 py-1 rounded-full text-xs font-medium " + getStatusClass(inv.status)}>
                      {inv.status}
                    </span>
                  </div>
                </div>

                {/* Amount & Due Date */}
                <div className="flex justify-between items-center border-t border-white/20 pt-2">
                  <div>
                    <p className="text-sm text-gray-600">Due: {inv.due_date}</p>
                    <p className="text-sm text-gray-600">Period: {inv.period_start} – {inv.period_end}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-xl font-bold text-gray-800">KES {inv.total_amount}</p>
                    {inv.balance_due > 0 && inv.status !== 'paid' && (
                      <p className="text-sm text-red-600">Balance: KES {inv.balance_due}</p>
                    )}
                  </div>
                </div>

                {/* Action: Pay button (if not paid) */}
                {inv.status !== 'paid' && (
                  <Link
                    to="/payment"
                    className="block w-full py-2 mt-1 bg-blue-500/20 backdrop-blur-sm rounded-lg text-blue-700 font-medium text-center hover:bg-blue-500/30 transition-all flex items-center justify-center gap-2"
                  >
                    <CreditCardIcon className="w-5 h-5" />
                    Pay Now
                  </Link>
                )}
                {inv.status === 'paid' && (
                  <div className="flex items-center justify-center gap-2 text-green-600 text-sm">
                    <CheckCircleIcon className="w-5 h-5" />
                    Paid
                  </div>
                )}
              </div>
            </GlassCard>
          )
        })
      )}
    </div>
  )
}
