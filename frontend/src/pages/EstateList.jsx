import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import api from '../api/axios'
import GlassCard from '../components/GlassCard'
import AddEstateModal from './AddEstateModal'
import { BuildingOfficeIcon, MapPinIcon, HomeIcon, PlusIcon } from '@heroicons/react/24/outline'

export default function EstateList() {
  const [estates, setEstates] = useState([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)

  const fetchEstates = async () => {
    setLoading(true)
    try {
      const res = await api.get('/properties/estates/')
      setEstates(res.data)
      setLoading(false)
    } catch (err) {
      console.error(err)
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchEstates()
  }, [])

  return (
    <div className="p-4 max-w-md mx-auto space-y-4 pb-20">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
          <BuildingOfficeIcon className="w-7 h-7 text-indigo-600" />
          Estates
        </h1>
        <button
          onClick={() => setShowModal(true)}
          className="p-2 bg-blue-500/20 rounded-full hover:bg-blue-500/30 transition-all"
        >
          <PlusIcon className="w-6 h-6 text-blue-600" />
        </button>
      </div>

      {loading ? (
        <GlassCard><p className="text-gray-500 text-center">Loading estates...</p></GlassCard>
      ) : estates.length === 0 ? (
        <GlassCard>
          <p className="text-gray-500 text-center">No estates found.</p>
          <p className="text-sm text-gray-400 text-center mt-1">Tap the + button to add an estate.</p>
        </GlassCard>
      ) : (
        estates.map(est => (
          <Link key={est.id} to={/estates/}>
            <GlassCard>
              <div className="flex items-start gap-3">
                <HomeIcon className="w-6 h-6 text-blue-600 mt-1" />
                <div>
                  <h2 className="font-semibold text-lg">{est.name}</h2>
                  <p className="text-sm text-gray-600 flex items-center gap-1">
                    <MapPinIcon className="w-4 h-4" />
                    {est.location}
                  </p>
                  <p className="text-sm text-gray-600">Units: {est.total_units}</p>
                  <p className="text-sm text-gray-600">Houses: {est.houses?.length || 0}</p>
                </div>
              </div>
            </GlassCard>
          </Link>
        ))
      )}

      <AddEstateModal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        onSuccess={fetchEstates}
      />
    </div>
  )
}
