import { useEffect, useState } from 'react'
import api from '../api/axios'
import GlassCard from '../components/GlassCard'
import ReportIssue from './ReportIssue'
import { 
  WrenchScrewdriverIcon, 
  PlusIcon, 
  CheckCircleIcon, 
  ClockIcon,
  ExclamationTriangleIcon,
  PencilIcon,
  XMarkIcon
} from '@heroicons/react/24/outline'

export default function MaintenanceList() {
  const [tickets, setTickets] = useState([])
  const [showModal, setShowModal] = useState(false)
  const [loading, setLoading] = useState(true)
  const [showStatusModal, setShowStatusModal] = useState(false)
  const [selectedTicket, setSelectedTicket] = useState(null)
  const [newStatus, setNewStatus] = useState('')
  const [isUpdating, setIsUpdating] = useState(false)

  const fetchTickets = async () => {
    try {
      const res = await api.get('/maintenance/tickets/')
      setTickets(res.data)
      setLoading(false)
    } catch (err) {
      console.error('Failed to fetch tickets:', err)
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchTickets()
  }, [])

  const getStatusIcon = (status) => {
    switch (status) {
      case 'resolved': return <CheckCircleIcon className="w-5 h-5 text-green-600" />
      case 'in-progress': return <ClockIcon className="w-5 h-5 text-blue-600" />
      case 'pending': return <ExclamationTriangleIcon className="w-5 h-5 text-yellow-600" />
      default: return <ClockIcon className="w-5 h-5 text-gray-600" />
    }
  }

  const getStatusClass = (status) => {
    if (status === 'resolved') return 'bg-green-200 text-green-800'
    if (status === 'in-progress') return 'bg-blue-200 text-blue-800'
    if (status === 'pending') return 'bg-yellow-200 text-yellow-800'
    return 'bg-gray-200 text-gray-800'
  }

  const getPriorityClass = (priority) => {
    if (priority === 'urgent') return 'bg-red-200 text-red-800'
    if (priority === 'high') return 'bg-orange-200 text-orange-800'
    if (priority === 'medium') return 'bg-yellow-200 text-yellow-800'
    return 'bg-blue-200 text-blue-800'
  }

  const openStatusModal = (ticket) => {
    setSelectedTicket(ticket)
    setNewStatus(ticket.status)
    setShowStatusModal(true)
  }

  const handleStatusUpdate = async () => {
    if (!selectedTicket || !newStatus) return
    setIsUpdating(true)
    try {
      await api.patch('/maintenance/tickets/' + selectedTicket.id + '/update_status/', {
        status: newStatus
      })
      setShowStatusModal(false)
      setSelectedTicket(null)
      fetchTickets()
    } catch (err) {
      alert('Failed to update status: ' + (err.response?.data?.error || 'Unknown error'))
    } finally {
      setIsUpdating(false)
    }
  }

  return (
    <div className="p-4 max-w-md mx-auto space-y-4 pb-20">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
          <WrenchScrewdriverIcon className="w-7 h-7 text-indigo-600" />
          Maintenance
        </h1>
        <button
          onClick={() => setShowModal(true)}
          className="p-2 bg-blue-500/20 rounded-full hover:bg-blue-500/30 transition-all"
        >
          <PlusIcon className="w-6 h-6 text-blue-600" />
        </button>
      </div>

      {loading ? (
        <GlassCard><p className="text-gray-500 text-center">Loading tickets...</p></GlassCard>
      ) : tickets.length === 0 ? (
        <GlassCard>
          <p className="text-gray-500 text-center">No maintenance tickets.</p>
          <p className="text-sm text-gray-400 text-center mt-1">Tap the + button to report an issue.</p>
        </GlassCard>
      ) : (
        tickets.map(ticket => (
          <GlassCard key={ticket.id}>
            <div className="space-y-2">
              <div className="flex justify-between items-start">
                <div>
                  <p className="font-medium">{ticket.description}</p>
                  <p className="text-sm text-gray-600">By: {ticket.tenant_name}</p>
                  {ticket.house_number && (
                    <p className="text-sm text-gray-600">House: {ticket.house_number}</p>
                  )}
                </div>
                <div className="flex flex-col items-end gap-1">
                  <span className={"px-2 py-1 rounded-full text-xs font-medium " + getStatusClass(ticket.status)}>
                    {ticket.status}
                  </span>
                  <span className={"px-2 py-1 rounded-full text-xs font-medium " + getPriorityClass(ticket.priority)}>
                    {ticket.priority}
                  </span>
                </div>
              </div>
              <button
                onClick={() => openStatusModal(ticket)}
                className="px-3 py-1 bg-blue-500/20 rounded-lg text-blue-700 text-xs font-medium flex items-center gap-1 hover:bg-blue-500/30 transition-all"
              >
                <PencilIcon className="w-3 h-3" />
                Update Status
              </button>
            </div>
          </GlassCard>
        ))
      )}

      <ReportIssue
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        onSuccess={() => {
          fetchTickets()
        }}
      />

      {/* Status Update Modal */}
      {showStatusModal && selectedTicket && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="glass w-full max-w-sm p-6 relative">
            <button
              onClick={() => setShowStatusModal(false)}
              className="absolute top-4 right-4 p-1 rounded-full hover:bg-white/20"
            >
              <XMarkIcon className="w-6 h-6 text-gray-600" />
            </button>

            <div className="flex items-center gap-2 mb-4">
              <PencilIcon className="w-6 h-6 text-blue-600" />
              <h2 className="text-xl font-bold text-gray-800">Update Status</h2>
            </div>

            <p className="text-sm text-gray-600 mb-4">
              Ticket: <span className="font-medium">{selectedTicket.description}</span>
            </p>

            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  New Status
                </label>
                <select
                  value={newStatus}
                  onChange={(e) => setNewStatus(e.target.value)}
                  className="w-full px-4 py-2 bg-white/50 backdrop-blur-sm border border-white/30 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-400"
                >
                  <option value="pending">Pending</option>
                  <option value="in-progress">In Progress</option>
                  <option value="resolved">Resolved</option>
                  <option value="cancelled">Cancelled</option>
                </select>
              </div>

              <button
                onClick={handleStatusUpdate}
                disabled={isUpdating}
                className={"w-full py-3 rounded-xl font-semibold transition-all " + (
                  isUpdating
                    ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                    : 'bg-gradient-to-r from-blue-500 to-indigo-600 text-white shadow-lg hover:shadow-xl'
                )}
              >
                {isUpdating ? 'Updating...' : 'Update Status'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
