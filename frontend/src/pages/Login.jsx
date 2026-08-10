import { useState } from 'react'
import { useAuth } from '../context/AuthContext'
import { useNavigate, Link } from 'react-router-dom'
import { KeyIcon, UserIcon } from '@heroicons/react/24/outline'

export default function Login() {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const { login } = useAuth()
  const navigate = useNavigate()

  const handleSubmit = async (e) => {
    e.preventDefault()
    try {
      await login(username, password)
      navigate('/')
    } catch (err) {
      setError('Invalid credentials')
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="glass w-full max-w-md p-8">
        <div className="text-center mb-8">
          <div className="inline-flex p-3 bg-blue-100 rounded-full">
            <KeyIcon className="w-10 h-10 text-blue-600" />
          </div>
          <h1 className="text-3xl font-bold text-gray-800 mt-2">Rental Manager</h1>
        </div>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700">Username</label>
            <div className="relative">
              <UserIcon className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="mt-1 block w-full pl-10 px-4 py-3 bg-white/50 backdrop-blur-sm border border-white/30 rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
                required
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Password</label>
            <div className="relative">
              <KeyIcon className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="mt-1 block w-full pl-10 px-4 py-3 bg-white/50 backdrop-blur-sm border border-white/30 rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
                required
              />
            </div>
          </div>
          {error && <p className="text-red-500 text-sm">{error}</p>}
          <button
            type="submit"
            className="w-full py-3 px-4 bg-gradient-to-r from-blue-500 to-indigo-600 text-white font-semibold rounded-xl shadow-lg hover:shadow-xl transition-all flex items-center justify-center gap-2"
          >
            <KeyIcon className="w-5 h-5" />
            Sign In
          </button>
        </form>
        <p className="mt-6 text-center text-sm text-gray-600">
          Demo: admin / Admin@123
        </p>
        <p className="mt-4 text-center text-sm">
          Don't have an account?{' '}
          <Link to="/register" className="text-blue-600 hover:underline font-medium">
            Sign Up
          </Link>
        </p>
      </div>
    </div>
  )
}
