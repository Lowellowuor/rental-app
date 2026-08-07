import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import api from '../api/axios'
import GlassCard from '../components/GlassCard'
import { 
  ChartBarIcon, 
  ExclamationTriangleIcon, 
  CheckCircleIcon, 
  DocumentTextIcon,
  ClockIcon,
  CreditCardIcon
} from '@heroicons/react/24/outline'

export default function ArrearsDashboard() {
  const [invoices, setInvoices] = useState([])
  const [filter, setFilter] = useState('all')
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

  const total = invoices.length
  const overdue = invoices.filter(inv => inv.status === 'overdue').length
  const paid = invoices.filter(inv => inv.status === 'paid').length

  const getFilteredInvoices = () => {
    if (filter === 'overdue') return invoices.filter(inv => inv.status === 'overdue')
    if (filter === 'paid') return invoices.filter(inv => inv.status === 'paid')
    return invoices
  }

  const filteredInvoices = getFilteredInvoices()

  const getStatusIcon = (status) => {
    switch (status) {
      case 'paid': return <CheckCircleIcon className="w-5 h-5 text-green-600" />
      case 'overdue': return <ExclamationTriangleIcon className="w-5 h-5 text-red-600" />
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
        <ChartBarIcon className="w-7 h-7 text-indigo-600" />
        Arrears Dashboard
      </h1>

      {loading ? (
        <GlassCard><p className="text-gray-500 text-center">Loading invoices...</p></GlassCard>
      ) : (
        <>
          <div className="grid grid-cols-3 gap-2">
            <div onClick={() => setFilter('all')} className="cursor-pointer">
              <GlassCard>
                <p className="text-sm text-gray-600">Total</p>
                <p className="text-2xl font-bold text-gray-800">{total}</p>
              </GlassCard>
            </div>
            <div onClick={() => setFilter('overdue')} className="cursor-pointer">
              <GlassCard>
                <p className="text-sm text-gray-600">Overdue</p>
                <p className="text-2xl font-bold text-red-600">{overdue}</p>
              </GlassCard>
            </div>
            <div onClick={() => setFilter('paid')} className="cursor-pointer">
              <GlassCard>
                <p className="text-sm text-gray-600">Paid</p>
                <p className="text-2xl font-bold text-green-600">{paid}</p>
              </GlassCard>
            </div>
          </div>

          <div>
            <h2 className="font-semibold text-gray-700 mb-2 flex items-center gap-2">
              {filter === 'all' && <DocumentTextIcon className="w-5 h-5 text-gray-600" />}
              {filter === 'overdue' && <ExclamationTriangleIcon className="w-5 h-5 text-red-600" />}
              {filter === 'paid' && <CheckCircleIcon className="w-5 h-5 text-green-600" />}
              {filter === 'all' && 'All Invoices'}
              {filter === 'overdue' && 'Overdue Invoices'}
              {filter === 'paid' && 'Paid Invoices'}
              <span className="text-sm font-normal text-gray-500">({filteredInvoices.length})</span>
            </h2>

            {filteredInvoices.length === 0 ? (
              <GlassCard>
                <div className="flex items-center gap-2 justify-center text-gray-500">
                  {filter === 'all' && (
                    <>
                      <DocumentTextIcon className="w-5 h-5" />
                      <span>No invoices found.</span>
                    </>
                  )}
                  {filter === 'overdue' && (
                    <>
                      <CheckCircleIcon className="w-5 h-5 text-green-600" />
                      <span className="text-green-600">No overdue invoices!</span>
                    </>
                  )}
                  {filter === 'paid' && (
                    <>
                      <ClockIcon className="w-5 h-5 text-yellow-600" />
                      <span>No paid invoices yet.</span>
                    </>
                  )}
                </div>
              </GlassCard>
            ) : (
              filteredInvoices.map(inv => (
                <GlassCard key={inv.id}>
                  <div className="flex justify-between items-center">
                    <div>
                      <p className="font-medium">KES {inv.total_amount}</p>
                      <p className="text-sm text-gray-600">Due: {inv.due_date}</p>
                      <p className="text-xs text-gray-500">Tenant: {inv.lease?.sub_tenant?.username || 'N/A'}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      {getStatusIcon(inv.status)}
                      <span className={"px-2 py-1 rounded-full text-xs font-medium " + getStatusClass(inv.status)}>
                        {inv.status}
                      </span>
                    </div>
                  </div>
                  {inv.status === 'overdue' && (
                    <div className="mt-2 pt-2 border-t border-white/20">
                      <Link
                        to="/payment"
                        className="w-full py-2 bg-blue-500/20 backdrop-blur-sm rounded-lg text-blue-700 font-medium flex items-center justify-center gap-2 hover:bg-blue-500/30 transition-all"
                      >
                        <CreditCardIcon className="w-5 h-5" />
                        Pay Now
                      </Link>
                    </div>
                  )}
                </GlassCard>
              ))
            )}
          </div>
        </>
      )}
    </div>
  )
}
