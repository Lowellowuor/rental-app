import { useState } from 'react'
import api from '../api/axios'
import GlassCard from '../components/GlassCard'
import { XMarkIcon, ExclamationTriangleIcon } from '@heroicons/react/24/outline'

export default function ReportIssue({ isOpen, onClose, onSuccess }) {
  const [description, setDescription] = useState('')
  const [priority, setPriority] = useState('medium')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!description.trim()) {
      setError('Please describe the issue')
      return
    }

    setIsSubmitting(true)
    setError('')

    try {
      await api.post('/maintenance/tickets/', {
        description: description,
        priority: priority
      })
      setDescription('')
      setPriority('medium')
      onSuccess()
      onClose()
    } catch (err) {
      // Extract and show the error message from the server
      let msg = 'Failed to report issue. Please try again.'
      if (err.response && err.response.data) {
        if (typeof err.response.data === 'object') {
          // If it's a validation error like { "field": ["error message"] }
          const errors = Object.values(err.response.data).flat().join(' ')
          msg = errors || msg
        } else {
          msg = err.response.data || msg
        }
      } else if (err.message) {
        msg = err.message
      }
      setError(msg)
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
          <ExclamationTriangleIcon className="w-6 h-6 text-red-600" />
          <h2 className="text-xl font-bold text-gray-800">Report Issue</h2>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Describe the issue
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="What's the problem? (e.g., Leaking pipe, broken light, etc.)"
              className="w-full px-4 py-2 bg-white/50 backdrop-blur-sm border border-white/30 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-400 min-h-[100px]"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Priority
            </label>
            <select
              value={priority}
              onChange={(e) => setPriority(e.target.value)}
              className="w-full px-4 py-2 bg-white/50 backdrop-blur-sm border border-white/30 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-400"
            >
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
              <option value="urgent">Urgent</option>
            </select>
          </div>

          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-800 text-sm">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={isSubmitting}
            className={"w-full py-3 rounded-xl font-semibold transition-all " + (
              isSubmitting
                ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                : 'bg-gradient-to-r from-red-500 to-orange-600 text-white shadow-lg hover:shadow-xl'
            )}
          >
            {isSubmitting ? 'Submitting...' : 'Submit Report'}
          </button>
        </form>
      </div>
    </div>
  )
}
