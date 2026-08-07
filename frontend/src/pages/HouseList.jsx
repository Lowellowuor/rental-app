import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import api from '../api/axios'
import GlassCard from '../components/GlassCard'
import EditHouseModal from './EditHouseModal'
import AddHouseModal from './AddHouseModal'
import { 
  BuildingOfficeIcon, 
  PencilIcon, 
  TrashIcon, 
  HomeIcon, 
  PlusIcon,
  EyeIcon 
} from '@heroicons/react/24/outline'

export default function HouseList() {
  const [allEstates, setAllEstates] = useState([])
  const [selectedEstate, setSelectedEstate] = useState(null)
  const [houses, setHouses] = useState([])
  const [loading, setLoading] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [showAddModal, setShowAddModal] = useState(false)
  const [selectedHouse, setSelectedHouse] = useState(null)

  useEffect(() => {
    api.get('/properties/estates/')
      .then(res => setAllEstates(res.data))
      .catch(err => console.error(err))
  }, [])

  useEffect(() => {
    if (selectedEstate) {
      setLoading(true)
      api.get('/properties/houses/?estate=' + selectedEstate.id)
        .then(res => {
          setHouses(res.data)
          setLoading(false)
        })
        .catch(err => {
          console.error(err)
          setLoading(false)
        })
    } else {
      setHouses([])
    }
  }, [selectedEstate])

  const handleDelete = async (house, e) => {
    e.stopPropagation()
    const message = 'Are you sure you want to delete house "' + house.house_number + '"? This will also remove all associated rooms and leases.'
    if (!window.confirm(message)) return
    try {
      await api.delete('/properties/houses/' + house.id + '/')
      if (selectedEstate) {
        const res = await api.get('/properties/houses/?estate=' + selectedEstate.id)
        setHouses(res.data)
      }
    } catch (err) {
      alert('Failed to delete house. ' + (err.response?.data?.detail || ''))
    }
  }

  const openEditModal = (house, e) => {
    e.stopPropagation()
    setSelectedHouse(house)
    setShowEditModal(true)
  }

  return (
    <div className="p-4 max-w-md mx-auto space-y-4 pb-20">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
          <BuildingOfficeIcon className="w-7 h-7 text-indigo-600" />
          Houses
        </h1>
        <button
          onClick={() => setShowAddModal(true)}
          className="p-2 bg-blue-500/20 rounded-full hover:bg-blue-500/30 transition-all"
        >
          <PlusIcon className="w-6 h-6 text-blue-600" />
        </button>
      </div>

      <select
        className="w-full p-2 glass rounded-lg"
        onChange={(e) => {
          const estate = allEstates.find(est => est.id === parseInt(e.target.value))
          setSelectedEstate(estate)
        }}
        defaultValue=""
      >
        <option value="">Select Estate</option>
        {allEstates.map(est => (
          <option key={est.id} value={est.id}>{est.name}</option>
        ))}
      </select>

      {selectedEstate && (
        <div className="space-y-2">
          {loading ? (
            <GlassCard><p className="text-gray-500 text-center">Loading houses...</p></GlassCard>
          ) : houses.length === 0 ? (
            <GlassCard><p className="text-gray-500">No houses in this estate.</p></GlassCard>
          ) : (
            houses.map(house => (
              <GlassCard key={house.id}>
                <div className="flex justify-between items-center">
                  <div>
                    <p className="font-medium">{house.house_number}</p>
                    <p className="text-sm text-gray-600">Main Tenant: {house.main_tenant?.username || 'None'}</p>
                  </div>
                  <div className="flex gap-2">
                    <Link to={'/houses/' + house.id}>
                      <button className="p-1 bg-green-500/20 rounded-lg hover:bg-green-500/30 transition-all">
                        <EyeIcon className="w-5 h-5 text-green-600" />
                      </button>
                    </Link>
                    <button 
                      onClick={(e) => openEditModal(house, e)}
                      className="p-1 bg-blue-500/20 rounded-lg hover:bg-blue-500/30 transition-all"
                    >
                      <PencilIcon className="w-5 h-5 text-blue-600" />
                    </button>
                    <button 
                      onClick={(e) => handleDelete(house, e)}
                      className="p-1 bg-red-500/20 rounded-lg hover:bg-red-500/30 transition-all"
                    >
                      <TrashIcon className="w-5 h-5 text-red-600" />
                    </button>
                  </div>
                </div>
              </GlassCard>
            ))
          )}
        </div>
      )}

      <EditHouseModal
        isOpen={showEditModal}
        onClose={() => {
          setShowEditModal(false)
          setSelectedHouse(null)
        }}
        onSuccess={async () => {
          if (selectedEstate) {
            const res = await api.get('/properties/houses/?estate=' + selectedEstate.id)
            setHouses(res.data)
          }
        }}
        house={selectedHouse}
        estates={allEstates}
      />

      <AddHouseModal
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        onSuccess={async () => {
          if (selectedEstate) {
            const res = await api.get('/properties/houses/?estate=' + selectedEstate.id)
            setHouses(res.data)
          }
        }}
        estateId={selectedEstate?.id || null}
      />
    </div>
  )
}
