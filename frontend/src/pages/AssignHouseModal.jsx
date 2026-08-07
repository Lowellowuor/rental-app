import { useState, useEffect } from 'react'
import api from '../api/axios'
import { XMarkIcon, HomeIcon } from '@heroicons/react/24/outline'

export default function AssignHouseModal({ isOpen, onClose, onSuccess, tenant }) {
  const [houses, setHouses] = useState([])
  const [rooms, setRooms] = useState([])
  const [selectedHouse, setSelectedHouse] = useState('')
  const [selectedRoom, setSelectedRoom] = useState('')
  const [rentAmount, setRentAmount] = useState('')
  const [dueDay, setDueDay] = useState('5')
  const [startDate, setStartDate] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)

  useEffect(() => {
    if (isOpen) {
      // Fetch houses (estate managers might see all, sub-tenants see only their estate? adjust as needed)
      api.get('/properties/houses/')
        .then(res => setHouses(res.data))
        .catch(err => console.error(err))
      
      // Set default start date to today
      const today = new Date().toISOString().split('T')[0]
      setStartDate(today)
    }
  }, [isOpen])

  useEffect(() => {
    if (selectedHouse) {
      api.get('/properties/rooms/?house=' + selectedHouse)
        .then(res => setRooms(res.data))
        .catch(err => console.error(err))
    } else {
      setRooms([])
    }
    setSelectedRoom('')
  }, [selectedHouse])

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setSuccess(false)

    if (!selectedRoom) {
      setError('Please select a room')
      return
    }
    if (!rentAmount || parseFloat(rentAmount) <= 0) {
      setError('Please enter a valid rent amount')
      return
    }

    setIsSubmitting(true)

    try {
      const payload = {
        room: parseInt(selectedRoom),
        sub_tenant: tenant.id,
        start_date: startDate,
        monthly_rent: parseFloat(rentAmount),
        rent_due_day: parseInt(dueDay),
        late_fee_percentage: 10.00,
        deposit_amount: parseFloat(rentAmount) * 1, // one month rent as deposit
        status: 'active'
      }
      await api.post('/leasing/leases/', payload)
      setSuccess(true)
      onSuccess()
      setTimeout(() => {
        onClose()
      }, 1500)
    } catch (err) {
      const msg = err.response?.data || 'Failed to assign house.'
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
          <HomeIcon className="w-6 h-6 text-blue-600" />
          <h2 className="text-xl font-bold text-gray-800">Assign House to {tenant?.username}</h2>
        </div>

        {success && (
          <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg text-green-800 text-sm">
            House assigned successfully!
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Select House
            </label>
            <select
              value={selectedHouse}
              onChange={(e) => setSelectedHouse(e.target.value)}
              className="w-full px-4 py-2 bg-white/50 backdrop-blur-sm border border-white/30 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-400"
              required
            >
              <option value="">Choose a house...</option>
              {houses.map(h => (
                <option key={h.id} value={h.id}>{h.house_number} ({h.estate?.name})</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Select Room
            </label>
            <select
              value={selectedRoom}
              onChange={(e) => setSelectedRoom(e.target.value)}
              className="w-full px-4 py-2 bg-white/50 backdrop-blur-sm border border-white/30 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-400"
              required
              disabled={!selectedHouse}
            >
              <option value="">{selectedHouse ? 'Select a room...' : 'First select a house'}</option>
              {rooms.map(r => (
                <option key={r.id} value={r.id}>{r.room_name} {r.is_occupied ? '(Occupied)' : '(Vacant)'}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Monthly Rent (KES)
            </label>
            <input
              type="number"
              value={rentAmount}
              onChange={(e) => setRentAmount(e.target.value)}
              placeholder="e.g., 15000"
              className="w-full px-4 py-2 bg-white/50 backdrop-blur-sm border border-white/30 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-400"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Rent Due Day (of month)
            </label>
            <select
              value={dueDay}
              onChange={(e) => setDueDay(e.target.value)}
              className="w-full px-4 py-2 bg-white/50 backdrop-blur-sm border border-white/30 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-400"
            >
              {[...Array(31).keys()].map(i => i+1).map(d => (
                <option key={d} value={d}>{d}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Lease Start Date
            </label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="w-full px-4 py-2 bg-white/50 backdrop-blur-sm border border-white/30 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-400"
              required
            />
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
            {isSubmitting ? 'Assigning...' : success ? 'Assigned!' : 'Assign House'}
          </button>
        </form>
      </div>
    </div>
  )
}
