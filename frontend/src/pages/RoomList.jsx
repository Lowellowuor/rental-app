import { useEffect, useState } from 'react'
import api from '../api/axios'
import GlassCard from '../components/GlassCard'
import { HomeIcon, PlusIcon } from '@heroicons/react/24/outline'

export default function RoomList() {
  const [houses, setHouses] = useState([])
  const [selectedHouse, setSelectedHouse] = useState(null)
  const [rooms, setRooms] = useState([])

  useEffect(() => {
    api.get('/properties/houses/')
      .then(res => setHouses(res.data))
      .catch(err => console.error(err))
  }, [])

  useEffect(() => {
    if (selectedHouse) {
      api.get('/properties/rooms/?house=' + selectedHouse.id)
        .then(res => setRooms(res.data))
        .catch(err => console.error(err))
    }
  }, [selectedHouse])

  const getOccupancyClass = (isOccupied) => {
    if (isOccupied) return 'bg-green-200 text-green-800'
    return 'bg-gray-200 text-gray-800'
  }

  const getOccupancyText = (isOccupied) => {
    return isOccupied ? 'Occupied' : 'Vacant'
  }

  return (
    <div className="p-4 max-w-md mx-auto space-y-4">
      <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
        <HomeIcon className="w-7 h-7 text-indigo-600" />
        Rooms
      </h1>
      <select
        className="w-full p-2 glass rounded-lg"
        onChange={(e) => {
          const house = houses.find(h => h.id === parseInt(e.target.value))
          setSelectedHouse(house)
        }}
        defaultValue=""
      >
        <option value="">Select House</option>
        {houses.map(house => (
          <option key={house.id} value={house.id}>{house.house_number}</option>
        ))}
      </select>
      {selectedHouse && (
        <div className="space-y-2">
          {rooms.map(room => (
            <GlassCard key={room.id}>
              <div className="flex justify-between items-center">
                <div>
                  <p className="font-medium">{room.room_name}</p>
                  <p className="text-sm text-gray-600">Occupied: {room.is_occupied ? 'Yes' : 'No'}</p>
                </div>
                <div className={"px-3 py-1 rounded-full text-xs font-medium " + getOccupancyClass(room.is_occupied)}>
                  {getOccupancyText(room.is_occupied)}
                </div>
              </div>
            </GlassCard>
          ))}
          <button className="w-full py-2 glass text-blue-600 font-medium flex items-center justify-center gap-2">
            <PlusIcon className="w-5 h-5" /> Add Room
          </button>
        </div>
      )}
    </div>
  )
}
