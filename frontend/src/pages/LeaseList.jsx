import { useEffect, useState } from 'react'
import api from '../api/axios'
import GlassCard from '../components/GlassCard'
import { DocumentIcon, PlusIcon } from '@heroicons/react/24/outline'

export default function LeaseList() {
  const [leases, setLeases] = useState([])

  useEffect(() => {
    api.get('/leasing/leases/')
      .then(res => setLeases(res.data))
      .catch(err => console.error(err))
  }, [])

  const getStatusClass = (status) => {
    if (status === 'active') return 'bg-green-200 text-green-800'
    return 'bg-red-200 text-red-800'
  }

  return (
    <div className="p-4 max-w-md mx-auto space-y-4">
      <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
        <DocumentIcon className="w-7 h-7 text-indigo-600" />
        Lease Agreements
      </h1>
      {leases.length === 0 ? (
        <GlassCard><p className="text-gray-500">No lease agreements.</p></GlassCard>
      ) : (
        leases.map(lease => (
          <GlassCard key={lease.id}>
            <div className="flex justify-between items-center">
              <div>
                <p className="font-medium">{lease.room}</p>
                <p className="text-sm text-gray-600">Tenant: {lease.sub_tenant_name}</p>
                <p className="text-sm text-gray-600">Rent: KES {lease.monthly_rent}</p>
              </div>
              <span className={"px-3 py-1 rounded-full text-xs font-medium " + getStatusClass(lease.status)}>
                {lease.status}
              </span>
            </div>
          </GlassCard>
        ))
      )}
      <button className="w-full py-2 glass text-blue-600 font-medium flex items-center justify-center gap-2">
        <PlusIcon className="w-5 h-5" /> New Lease
      </button>
    </div>
  )
}
