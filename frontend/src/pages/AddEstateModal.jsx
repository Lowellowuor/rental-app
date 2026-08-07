import { useState, useEffect } from 'react'
import api from '../api/axios'
import { XMarkIcon, BuildingOfficeIcon } from '@heroicons/react/24/outline'

export default function AddEstateModal({ isOpen, onClose, onSuccess }) {
  const [name, setName] = useState('')
  const [location, setLocation] = useState('')
  const [totalUnits, setTotalUnits] = useState('')
  const [manager, setManager] = useState('')
  const [managers, setManagers] = useState([])
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)

  useEffect(() => {
    if (isOpen) {
      // Fetch users with role ESTATE_MANAGER or SUPER_ADMIN for manager dropdown
      api.get('/users/list/?role=ESTATE_MANAGER')
        .then(res => setManagers(res.data))
        .catch(err => console.error(err))
    }
  }, [isOpen])

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setSuccess(false)

    if (!name.trim() || !location.trim() || !totalUnits) {
      setError('Please fill in all required fields')
      return
    }

    setIsSubmitting(true)

    try {
      const payload = {
        name: name,
        location: location,
        total_units: parseInt(totalUnits),
        manager: manager || null
      }
      await api.post('/properties/estates/', payload)
      setSuccess(true)
      setName('')
      setLocation('')
      setTotalUnits('')
      setManager('')
      onSuccess()
      setTimeout(() => {
        onClose()
      }, 1500)
    } catch (err) {
      const msg = err.response?.data || 'Failed to add estate.'
      setError(typeof msg === 'object' ? Object.values(msg).flat().join(' ') : msg)
    } finally {
      setIsSubmitting(false)
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="glass w-full max-w-md p-6 relative max-h-[90vh] overflow-y-auto">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1 rounded-full hover:bg-white/20"
        >
          <XMarkIcon className="w-6 h-6 text-gray-600" />
        </button>

        <div className="flex items-center gap-2 mb-4">
          <BuildingOfficeIcon className="w-6 h-6 text-blue-600" />
          <h2 className="text-xl font-bold text-gray-800">Add Estate</h2>
        </div>

        {success && (
          <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg text-green-800 text-sm">
            Estate added successfully!
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Estate Name *
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g., Manyatta Phase 2"
              className="w-full px-4 py-2 bg-white/50 backdrop-blur-sm border border-white/30 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-400"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Location *
            </label>
            <input
              type="text"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              placeholder="e.g., Kasarani, Nairobi"
              className="w-full px-4 py-2 bg-white/50 backdrop-blur-sm border border-white/30 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-400"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Total Units *
            </label>
            <input
              type="number"
              value={totalUnits}
              onChange={(e) => setTotalUnits(e.target.value)}
              placeholder="e.g., 50"
              className="w-full px-4 py-2 bg-white/50 backdrop-blur-sm border border-white/30 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-400"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Manager (Optional)
            </label>
            <select
              value={manager}
              onChange={(e) => setManager(e.target.value)}
              className="w-full px-4 py-2 bg-white/50 backdrop-blur-sm border border-white/30 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-400"
            >
              <option value="">None</option>
              {managers.map(m => (
                <option key={m.id} value={m.id}>{m.username}</option>
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
            {isSubmitting ? 'Adding...' : success ? 'Added!' : 'Add Estate'}
          </button>
        </form>
      </div>
    </div>
  )
}
