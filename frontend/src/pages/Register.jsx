import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import api from '../api/axios'
import { KeyIcon, UserIcon, PhoneIcon, EnvelopeIcon } from '@heroicons/react/24/outline'

export default function Register() {
  const navigate = useNavigate()
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    phone_number: '',
    password: '',
    password2: '',
    role: 'SUB_TENANT'
  })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value })
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setSuccess(false)
    setLoading(true)

    try {
      await api.post('/auth/register/', formData)
      setSuccess(true)
      setTimeout(() => {
        navigate('/login')
      }, 2000)
    } catch (err) {
      const msg = err.response?.data
      if (typeof msg === 'object') {
        const errors = Object.values(msg).flat().join(' ')
        setError(errors)
      } else {
        setError(msg || 'Registration failed. Please try again.')
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="glass w-full max-w-md p-8">
        <div className="text-center mb-8">
          <div className="inline-flex p-3 bg-blue-100 rounded-full">
            <UserIcon className="w-10 h-10 text-blue-600" />
          </div>
          <h1 className="text-3xl font-bold text-gray-800 mt-2">Create Account</h1>
          <p className="text-gray-600 text-sm">Join SmartRent as a tenant or manager</p>
        </div>

        {success && (
          <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg text-green-800 text-sm">
            Account created successfully! Redirecting to login...
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">Username *</label>
            <div className="relative">
              <UserIcon className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
              <input
                type="text"
                name="username"
                value={formData.username}
                onChange={handleChange}
                className="mt-1 block w-full pl-10 px-4 py-3 bg-white/50 backdrop-blur-sm border border-white/30 rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Email (Optional)</label>
            <div className="relative">
              <EnvelopeIcon className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                className="mt-1 block w-full pl-10 px-4 py-3 bg-white/50 backdrop-blur-sm border border-white/30 rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Phone Number *</label>
            <div className="relative">
              <PhoneIcon className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
              <input
                type="tel"
                name="phone_number"
                value={formData.phone_number}
                onChange={handleChange}
                placeholder="0712345678"
                className="mt-1 block w-full pl-10 px-4 py-3 bg-white/50 backdrop-blur-sm border border-white/30 rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Password *</label>
            <div className="relative">
              <KeyIcon className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
              <input
                type="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                className="mt-1 block w-full pl-10 px-4 py-3 bg-white/50 backdrop-blur-sm border border-white/30 rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Confirm Password *</label>
            <div className="relative">
              <KeyIcon className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
              <input
                type="password"
                name="password2"
                value={formData.password2}
                onChange={handleChange}
                className="mt-1 block w-full pl-10 px-4 py-3 bg-white/50 backdrop-blur-sm border border-white/30 rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Role</label>
            <select
              name="role"
              value={formData.role}
              onChange={handleChange}
              className="mt-1 block w-full px-4 py-3 bg-white/50 backdrop-blur-sm border border-white/30 rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
            >
              <option value="SUB_TENANT">Sub Tenant</option>
              <option value="MAIN_TENANT">Main Tenant</option>
              <option value="ESTATE_MANAGER">Estate Manager</option>
            </select>
          </div>

          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-800 text-sm">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading || success}
            className={"w-full py-3 px-4 rounded-xl font-semibold transition-all flex items-center justify-center gap-2 " + (
              loading || success
                ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                : 'bg-gradient-to-r from-blue-500 to-indigo-600 text-white shadow-lg hover:shadow-xl'
            )}
          >
            {loading ? 'Creating...' : success ? 'Created!' : 'Sign Up'}
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-gray-600">
          Already have an account?{' '}
          <Link to="/login" className="text-blue-600 hover:underline font-medium">
            Sign In
          </Link>
        </p>
      </div>
    </div>
  )
}
