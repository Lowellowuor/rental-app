import { useEffect, useState } from 'react'
import api from '../api/axios'
import GlassCard from '../components/GlassCard'
import AddTenantModal from './AddTenantModal'
import AssignHouseModal from './AssignHouseModal'
import { UsersIcon, UserPlusIcon, EnvelopeIcon, HomeIcon } from '@heroicons/react/24/outline'

export default function TenantList() {
  const [tenants, setTenants] = useState([])
  const [showAddModal, setShowAddModal] = useState(false)
  const [showAssignModal, setShowAssignModal] = useState(false)
  const [selectedTenant, setSelectedTenant] = useState(null)
  const [loading, setLoading] = useState(true)

  const fetchTenants = async () => {
    try {
      const res = await api.get('/users/?role=SUB_TENANT')
      setTenants(res.data)
      setLoading(false)
    } catch (err) {
      console.error('Failed to fetch tenants:', err)
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchTenants()
  }, [])

  const openAssignModal = (tenant) => {
    setSelectedTenant(tenant)
    setShowAssignModal(true)
  }

  return (
    <div className="p-4 max-w-md mx-auto space-y-4 pb-20">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
          <UsersIcon className="w-7 h-7 text-indigo-600" />
          Tenants
        </h1>
        <button
          onClick={() => setShowAddModal(true)}
          className="p-2 bg-blue-500/20 rounded-full hover:bg-blue-500/30 transition-all"
        >
          <UserPlusIcon className="w-6 h-6 text-blue-600" />
        </button>
      </div>

      {loading ? (
        <GlassCard><p className="text-gray-500 text-center">Loading tenants...</p></GlassCard>
      ) : tenants.length === 0 ? (
        <GlassCard>
          <p className="text-gray-500 text-center">No tenants found.</p>
          <p className="text-sm text-gray-400 text-center mt-1">Tap the + button to add a tenant.</p>
        </GlassCard>
      ) : (
        tenants.map(tenant => (
          <GlassCard key={tenant.id}>
            <div className="flex justify-between items-center">
              <div>
                <p className="font-medium">{tenant.username}</p>
                <p className="text-sm text-gray-600">{tenant.phone_number}</p>
              </div>
              <div className="flex gap-2">
                <button 
                  onClick={() => openAssignModal(tenant)}
                  className="p-2 bg-green-500/20 rounded-lg hover:bg-green-500/30 transition-all"
                  title="Assign house"
                >
                  <HomeIcon className="w-5 h-5 text-green-600" />
                </button>
                <button className="p-2 bg-blue-500/20 rounded-lg">
                  <EnvelopeIcon className="w-5 h-5 text-blue-600" />
                </button>
              </div>
            </div>
          </GlassCard>
        ))
      )}

      <AddTenantModal
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        onSuccess={fetchTenants}
      />

      <AssignHouseModal
        isOpen={showAssignModal}
        onClose={() => {
          setShowAssignModal(false)
          setSelectedTenant(null)
        }}
        onSuccess={() => {
          fetchTenants()
          // Optionally refresh other data
        }}
        tenant={selectedTenant}
      />
    </div>
  )
}
