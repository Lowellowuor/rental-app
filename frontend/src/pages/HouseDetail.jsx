import { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import api from '../api/axios'
import GlassCard from '../components/GlassCard'
import { 
  HomeIcon, 
  UserIcon, 
  ArrowLeftIcon,
  BuildingOfficeIcon,
  MapPinIcon
} from '@heroicons/react/24/outline'

export default function HouseDetail() {
  const { id } = useParams()
  const [house, setHouse] = useState(null)
  const [leasesMap, setLeasesMap] = useState({})
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true)
      try {
        // Fetch house detail
        const houseRes = await api.get('/properties/houses/' + id + '/')
        setHouse(houseRes.data)

        // Fetch active leases for this house (or all to map rooms)
        const leasesRes = await api.get('/leasing/leases/?status=active')
        const map = {}
        leasesRes.data.forEach(lease => {
          // Only map leases that belong to rooms in this house
          if (lease.room && houseRes.data.rooms?.some(r => r.id === lease.room)) {
            map[lease.room] = lease.sub_tenant_name
          }
        })
        setLeasesMap(map)
      } catch (err) {
        console.error(err)
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [id])

  if (loading) {
    return (
      <div className="p-4 max-w-md mx-auto">
        <GlassCard><p className="text-gray-500 text-center">Loading house details...</p></GlassCard>
      </div>
    )
  }

  if (!house) {
    return (
      <div className="p-4 max-w-md mx-auto">
        <GlassCard><p className="text-red-500 text-center">House not found.</p></GlassCard>
      </div>
    )
  }

  return (
    <div className="p-4 max-w-md mx-auto space-y-4 pb-20">
      {/* Back button */}
      <Link to="/houses" className="inline-flex items-center gap-1 text-blue-600 hover:text-blue-800">
        <ArrowLeftIcon className="w-5 h-5" />
        Back to Houses
      </Link>

      {/* House header */}
      <GlassCard>
        <div className="flex items-start gap-3">
          <HomeIcon className="w-8 h-8 text-indigo-600 mt-1" />
          <div>
            <h1 className="text-2xl font-bold text-gray-800">{house.house_number}</h1>
            <p className="text-gray-600 flex items-center gap-1">
              <BuildingOfficeIcon className="w-4 h-4" />
              Estate: 
              <Link to={'/estates/' + house.estate?.id} className="text-blue-600 hover:underline">
                {house.estate?.name}
              </Link>
            </p>
            <p className="text-gray-600 flex items-center gap-1">
              <UserIcon className="w-4 h-4" />
              Main Tenant: {house.main_tenant?.username || 'None'}
            </p>
            <p className="text-gray-600">Rooms: {house.rooms?.length || 0}</p>
          </div>
        </div>
      </GlassCard>

      {/* Rooms */}
      <h2 className="text-xl font-semibold text-gray-800 flex items-center gap-2">
        <HomeIcon className="w-6 h-6 text-blue-600" />
        Rooms ({house.rooms?.length || 0})
      </h2>

      {house.rooms?.length === 0 ? (
        <GlassCard><p className="text-gray-500">No rooms in this house.</p></GlassCard>
      ) : (
        house.rooms.map(room => {
          const tenantName = room.is_occupied ? leasesMap[room.id] || 'Unknown' : null
          return (
            <GlassCard key={room.id}>
              <div className="flex justify-between items-center">
                <div>
                  <p className="font-medium">{room.room_name}</p>
                  <p className="text-sm text-gray-600">
                    {room.is_occupied ? 'Occupied' : 'Vacant'}
                  </p>
                </div>
                {room.is_occupied && tenantName && (
                  <div className="flex items-center gap-1">
                    <UserIcon className="w-4 h-4 text-gray-500" />
                    <span className="text-sm text-gray-600">{tenantName}</span>
                  </div>
                )}
              </div>
            </GlassCard>
          )
        })
      )}
    </div>
  )
}
