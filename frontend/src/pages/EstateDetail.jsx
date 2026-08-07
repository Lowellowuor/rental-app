import { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import api from '../api/axios'
import GlassCard from '../components/GlassCard'
import AddHouseModal from './AddHouseModal'
import { 
  BuildingOfficeIcon, 
  MapPinIcon, 
  HomeIcon,
  UserIcon,
  ArrowLeftIcon,
  PlusIcon,
  ChevronDownIcon,
  ChevronRightIcon,
  ViewColumnsIcon
} from '@heroicons/react/24/outline'

export default function EstateDetail() {
  const { id } = useParams()
  const [estate, setEstate] = useState(null)
  const [loading, setLoading] = useState(true)
  const [expandedHouses, setExpandedHouses] = useState({})
  const [leasesMap, setLeasesMap] = useState({})
  const [showAddHouse, setShowAddHouse] = useState(false)

  const fetchData = async () => {
    setLoading(true)
    try {
      const estateUrl = '/properties/estates/' + id + '/'
      const estateRes = await api.get(estateUrl)
      setEstate(estateRes.data)

      const leasesRes = await api.get('/leasing/leases/?status=active')
      const map = {}
      leasesRes.data.forEach(lease => {
        if (lease.room) {
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

  useEffect(() => {
    fetchData()
  }, [id])

  const toggleHouse = (houseId) => {
    setExpandedHouses(prev => ({
      ...prev,
      [houseId]: !prev[houseId]
    }))
  }

  if (loading) {
    return (
      <div className="p-4 max-w-md mx-auto">
        <GlassCard><p className="text-gray-500 text-center">Loading estate details...</p></GlassCard>
      </div>
    )
  }

  if (!estate) {
    return (
      <div className="p-4 max-w-md mx-auto">
        <GlassCard><p className="text-red-500 text-center">Estate not found.</p></GlassCard>
      </div>
    )
  }

  // Calculate summary stats
  const totalUnits = estate.houses?.length || 0
  const totalRooms = estate.houses?.reduce((acc, h) => acc + (h.rooms?.length || 0), 0) || 0
  const occupiedRooms = estate.houses?.reduce((acc, h) => {
    return acc + (h.rooms?.filter(r => r.is_occupied).length || 0)
  }, 0) || 0

  return (
    <div className="p-4 max-w-md mx-auto space-y-4 pb-20">
      {/* Header with Back and Add House */}
      <div className="flex justify-between items-center">
        <Link to="/estates" className="inline-flex items-center gap-1 text-blue-600 hover:text-blue-800">
          <ArrowLeftIcon className="w-5 h-5" />
          Back to Estates
        </Link>
        <button
          onClick={() => setShowAddHouse(true)}
          className="inline-flex items-center gap-1 px-3 py-1 bg-blue-500/20 rounded-lg text-blue-700 hover:bg-blue-500/30 transition-all"
        >
          <PlusIcon className="w-5 h-5" />
          Add Unit
        </button>
      </div>

      {/* Estate header */}
      <GlassCard>
        <div className="flex items-start gap-3">
          <BuildingOfficeIcon className="w-8 h-8 text-indigo-600 mt-1" />
          <div>
            <h1 className="text-2xl font-bold text-gray-800">{estate.name}</h1>
            <p className="text-gray-600 flex items-center gap-1">
              <MapPinIcon className="w-4 h-4" />
              {estate.location}
            </p>
            <p className="text-gray-600">Total Units: {estate.total_units}</p>
            <p className="text-gray-600">Manager: {estate.manager?.username || 'N/A'}</p>
          </div>
        </div>
      </GlassCard>

      {/* Units Summary */}
      <div className="grid grid-cols-3 gap-2">
        <GlassCard>
          <p className="text-sm text-gray-600">Units</p>
          <p className="text-2xl font-bold text-gray-800">{totalUnits}</p>
        </GlassCard>
        <GlassCard>
          <p className="text-sm text-gray-600">Rooms</p>
          <p className="text-2xl font-bold text-blue-600">{totalRooms}</p>
        </GlassCard>
        <GlassCard>
          <p className="text-sm text-gray-600">Occupied</p>
          <p className="text-2xl font-bold text-green-600">{occupiedRooms}</p>
        </GlassCard>
      </div>

      {/* Units (Houses) List */}
      <h2 className="text-xl font-semibold text-gray-800 flex items-center gap-2">
        <ViewColumnsIcon className="w-6 h-6 text-blue-600" />
        Units ({totalUnits})
      </h2>

      {totalUnits === 0 ? (
        <GlassCard><p className="text-gray-500">No units in this estate.</p></GlassCard>
      ) : (
        estate.houses.map(house => {
          const isExpanded = expandedHouses[house.id] || false
          const roomCount = house.rooms?.length || 0
          const occupiedCount = house.rooms?.filter(r => r.is_occupied).length || 0

          return (
            <GlassCard key={house.id}>
              <div 
                className="flex justify-between items-center cursor-pointer"
                onClick={() => toggleHouse(house.id)}
              >
                <div>
                  <h3 className="font-semibold text-lg flex items-center gap-2">
                    <HomeIcon className="w-5 h-5 text-blue-600" />
                    {house.house_number}
                  </h3>
                  <p className="text-sm text-gray-600">
                    Main Tenant: {house.main_tenant?.username || 'None'}
                  </p>
                  <p className="text-xs text-gray-500">
                    {roomCount} rooms · {occupiedCount} occupied
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <Link 
                    to={'/houses/' + house.id} 
                    className="text-xs text-blue-600 hover:underline"
                    onClick={(e) => e.stopPropagation()}
                  >
                    View
                  </Link>
                  {isExpanded ? (
                    <ChevronDownIcon className="w-5 h-5 text-gray-600" />
                  ) : (
                    <ChevronRightIcon className="w-5 h-5 text-gray-600" />
                  )}
                </div>
              </div>

              {/* Collapsible rooms */}
              {isExpanded && (
                <div className="mt-3 space-y-2 border-t border-white/20 pt-3">
                  <p className="text-sm font-medium text-gray-700">Rooms:</p>
                  {roomCount === 0 ? (
                    <p className="text-sm text-gray-500">No rooms</p>
                  ) : (
                    house.rooms.map(room => {
                      const tenantName = room.is_occupied ? leasesMap[room.id] || 'Unknown' : null
                      return (
                        <div key={room.id} className="flex justify-between items-center bg-white/20 rounded-lg px-3 py-2">
                          <div>
                            <p className="text-sm font-medium">{room.room_name}</p>
                            <p className="text-xs text-gray-600">
                              {room.is_occupied ? 'Occupied' : 'Vacant'}
                            </p>
                          </div>
                          {room.is_occupied && tenantName && (
                            <div className="flex items-center gap-1">
                              <UserIcon className="w-4 h-4 text-gray-500" />
                              <span className="text-xs text-gray-600">{tenantName}</span>
                            </div>
                          )}
                        </div>
                      )
                    })
                  )}
                </div>
              )}
            </GlassCard>
          )
        })
      )}

      <AddHouseModal
        isOpen={showAddHouse}
        onClose={() => setShowAddHouse(false)}
        onSuccess={fetchData}
        estateId={parseInt(id)}
      />
    </div>
  )
}
