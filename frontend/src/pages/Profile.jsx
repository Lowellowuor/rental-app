import { useAuth } from '../context/AuthContext'
import GlassCard from '../components/GlassCard'
import { 
  UserCircleIcon, 
  ArrowRightOnRectangleIcon,
  EnvelopeIcon,
  PhoneIcon,
  IdentificationIcon
} from '@heroicons/react/24/outline'
import { useNavigate } from 'react-router-dom'

export default function Profile() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  return (
    <div className="p-4 max-w-md mx-auto space-y-4">
      <div className="flex items-center gap-4">
        <UserCircleIcon className="w-16 h-16 text-blue-600" />
        <div>
          <h1 className="text-2xl font-bold text-gray-800">{user?.username}</h1>
          <p className="text-gray-600">{user?.role}</p>
        </div>
      </div>
      <GlassCard>
        <div className="space-y-3">
          <div className="flex items-center gap-3">
            <EnvelopeIcon className="w-5 h-5 text-gray-400" />
            <span className="text-gray-600">Email:</span>
            <span className="font-medium">{user?.email || 'N/A'}</span>
          </div>
          <div className="flex items-center gap-3">
            <PhoneIcon className="w-5 h-5 text-gray-400" />
            <span className="text-gray-600">Phone:</span>
            <span className="font-medium">{user?.phone_number}</span>
          </div>
          <div className="flex items-center gap-3">
            <IdentificationIcon className="w-5 h-5 text-gray-400" />
            <span className="text-gray-600">KRA PIN:</span>
            <span className="font-medium">{user?.kra_pin || 'N/A'}</span>
          </div>
        </div>
      </GlassCard>
      <button
        onClick={handleLogout}
        className="w-full py-3 bg-red-500/20 backdrop-blur-sm rounded-xl text-red-700 font-medium flex items-center justify-center gap-2"
      >
        <ArrowRightOnRectangleIcon className="w-5 h-5" />
        Logout
      </button>
    </div>
  )
}
