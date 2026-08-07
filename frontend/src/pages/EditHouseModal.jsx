import { useState, useEffect } from 'react'
import api from '../api/axios'
import { XMarkIcon, PencilIcon } from '@heroicons/react/24/outline'

export default function EditHouseModal({ isOpen, onClose, onSuccess, house, estates }) {
  const [houseNumber, setHouseNumber] = useState('')
  const [estateId, setEstateId] = useState('')
  const [mainTenant, setMainTenant] = useState('')
  const [tenants, setTenants] = useState([])
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)

  // Load main tenants for dropdown
  useEffect(() => {
    if (isOpen) {
      api.get('/users/?role=MAIN_TENANT')
        .then(res => setTenants(res.data))
        .catch(err => console.error(err))
    }
  }, [isOpen])

  // Populate form when house changes
  useEffect(() => {
    if (house) {
      setHouseNumber(house.house_number || '')
      setEstateId(house.estate?.id || '')
      setMainTenant(house.main_tenant?.id || '')
    }
  }, [house])

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setSuccess(false)

    if (!houseNumber.trim()) {
      setError('Please enter a house number')
      return
    }
    if (!estateId) {
      setError('Please select an estate')
      return
    }

    setIsSubmitting(true)

    try {
      const payload = {
        house_number: houseNumber,
        estate: parseInt(estateId),
        main_tenant: mainTenant || null
      }
      await api.put('/properties/houses/' + house.id + '/', payload)
      setSuccess(true)
      onSuccess()
      setTimeout(() => {
        onClose()
      }, 1500)
    } catch (err) {
      const msg = err.response?.data || 'Failed to update house.'
      setError(typeof msg === 'object' ? Object.values(msg).flat().join(' ') : msg)
    } finally {
      setIsSubmitting(false)
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="glass w-full max-w-md p-6 relative">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1 rounded-full hover:bg-white/20"
        >
          <XMarkIcon className="w-6 h-6 text-gray-600" />
        </button>

        <div className="flex items-center gap-2 mb-4">
          <PencilIcon className="w-6 h-6 text-blue-600" />
          <h2 className="text-xl font-bold text-gray-800">Edit House</h2>
        </div>

        {success && (
          <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg text-green-800 text-sm">
            House updated successfully!
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              House Number *
            </label>
            <input
              type="text"
              value={houseNumber}
              onChange={(e) => setHouseNumber(e.target.value)}
              placeholder="e.g., Block B, House 10"
              className="w-full px-4 py-2 bg-white/50 backdrop-blur-sm border border-white/30 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-400"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Estate *
            </label>
            <select
              value={estateId}
              onChange={(e) => setEstateId(e.target.value)}
              className="w-full px-4 py-2 bg-white/50 backdrop-blur-sm border border-white/30 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-400"
              required
            >
              <option value="">Select Estate</option>
              {estates.map(est => (
                <option key={est.id} value={est.id}>{est.name}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Main Tenant (Optional)
            </label>
            <select
              value={mainTenant}
              onChange={(e) => setMainTenant(e.target.value)}
              className="w-full px-4 py-2 bg-white/50 backdrop-blur-sm border border-white/30 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-400"
            >
              <option value="">None</option>
              {tenants.map(t => (
                <option key={t.id} value={t.id}>{t.username}</option>
              ))}
            </select>
          </div>

          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-800 text-sm">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={isSubmitting || success}
            className={"w-full py-3 rounded-xl font-semibold transition-all " + (
              isSubmitting || success
                ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                : 'bg-gradient-to-r from-blue-500 to-indigo-600 text-white shadow-lg hover:shadow-xl'
            )}
          >
            {isSubmitting ? 'Saving...' : success ? 'Saved!' : 'Update House'}
          </button>
        </form>
      </div>
    </div>
  )
}
