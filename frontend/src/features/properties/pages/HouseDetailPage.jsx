import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import api from '@/api/client'
import { cn } from '@/lib/cn'
import AddRoomModal from '@/features/properties/modals/AddRoomModal'
import EditHouseModal from '@/features/properties/modals/EditHouseModal'
import AssignHouseModal from '@/features/properties/modals/AssignHouseModal'

export default function HouseDetailPage() {
  const { id } = useParams()
  const [house, setHouse] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [showAddRoom, setShowAddRoom] = useState(false)
  const [showEdit, setShowEdit] = useState(false)
  const [showAssign, setShowAssign] = useState(false)

  async function load() {
    setLoading(true)
    setError('')
    try {
      const { data } = await api.get(`/properties/houses/${id}/`)
      setHouse(data)
    } catch {
      setError('Could not load this house.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
  }, [id])

  const rooms = house?.rooms ?? []
  const occupiedCount = rooms.filter((r) => r.is_occupied).length

  return (
    <div className="mx-auto w-full max-w-2xl px-4 pb-24 pt-6 sm:px-6">
      <Link
        to="/houses"
        className={cn(
          'inline-flex h-9 items-center gap-1.5 rounded-lg border border-edge bg-surface shadow-card px-3 text-[13px] font-medium text-muted',
          'shadow-float transition-all duration-150 ease-out-soft',
          'hover:text-ink hover:border-edge-hover hover:shadow-card-hover'
        )}
      >
        <svg viewBox="0 0 24 24" className="size-3.5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <path d="M15 18l-6-6 6-6" />
        </svg>
        Back
      </Link>

      {loading ? (
        <SkeletonDetail />
      ) : error ? (
        <ErrorBlock message={error} onRetry={load} />
      ) : !house ? (
        <ErrorBlock message="House not found." onRetry={load} />
      ) : (
        <>
          <header className="mt-5 flex items-start justify-between gap-3">
            <div className="min-w-0">
              <h1 className="text-[26px] font-semibold tracking-[-0.02em] text-ink">
                {house.house_number}
              </h1>
              <Link
                to={`/estates/${house.estate_id}`}
                className="mt-0.5 inline-block text-[13.5px] text-muted hover:text-accent"
              >
                {house.estate_name}
              </Link>
            </div>
            <button
              onClick={() => setShowEdit(true)}
              className={cn(
                'inline-flex h-10 shrink-0 items-center gap-1.5 rounded-lg border border-edge bg-surface shadow-card px-3 text-[13px] font-medium text-ink',
                'shadow-float transition-all duration-150 ease-out-soft',
                'hover:border-edge-hover hover:shadow-card-hover'
              )}
            >
              <svg viewBox="0 0 24 24" className="size-4" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M12 20h9M16.5 3.5a2.1 2.1 0 1 1 3 3L7 19l-4 1 1-4 12.5-12.5z" />
              </svg>
              Edit
            </button>
          </header>

          <div className="mt-5 grid grid-cols-3 gap-3">
            <SmallStat label="Rooms" value={rooms.length} />
            <SmallStat label="Occupied" value={occupiedCount} tone={occupiedCount > 0 ? 'accent' : 'default'} />
            <SmallStat label="Vacant" value={rooms.length - occupiedCount} />
          </div>

          <div className="mt-4">
            <TenantBlock
              tenant={house.tenant_username}
              onAssign={() => setShowAssign(true)}
            />
          </div>

          <div className="mt-8 flex items-center justify-between">
            <h2 className="text-[11px] font-semibold uppercase tracking-[0.08em] text-faint">
              Rooms
            </h2>
            <button
              onClick={() => setShowAddRoom(true)}
              className={cn(
                'inline-flex h-9 items-center gap-1.5 rounded-lg border border-edge bg-surface shadow-card px-3 text-[13px] font-medium text-ink',
                'shadow-float transition-all duration-150 ease-out-soft',
                'hover:border-edge-hover hover:shadow-card-hover'
              )}
            >
              <svg viewBox="0 0 20 20" className="size-3.5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
                <path d="M10 4v12M4 10h12" />
              </svg>
              Add room
            </button>
          </div>

          <RoomsList rooms={rooms} />

          <AddRoomModal
            isOpen={showAddRoom}
            onClose={() => setShowAddRoom(false)}
            houseId={id}
            onSuccess={() => {
              setShowAddRoom(false)
              load()
            }}
          />

          <EditHouseModal
            isOpen={showEdit}
            onClose={() => setShowEdit(false)}
            house={house}
            onSuccess={() => {
              setShowEdit(false)
              load()
            }}
          />

          <AssignHouseModal
            isOpen={showAssign}
            onClose={() => setShowAssign(false)}
            house={house}
            onSuccess={() => {
              setShowAssign(false)
              load()
            }}
          />
        </>
      )}
    </div>
  )
}

function TenantBlock({ tenant, onAssign }) {
  return (
    <div className="flex items-center justify-between gap-3 rounded-lg border border-edge bg-surface shadow-card p-4 shadow-float">
      <div className="flex items-center gap-3 min-w-0">
        <span className={cn(
          'grid size-9 place-items-center rounded-full',
          tenant ? 'bg-success/10 text-success' : 'bg-canvas text-faint'
        )}>
          <svg viewBox="0 0 24 24" className="size-4" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8zM4 21a8 8 0 0 1 16 0" />
          </svg>
        </span>
        <div className="min-w-0">
          <p className="text-[11px] font-semibold uppercase tracking-[0.06em] text-faint">
            Main tenant
          </p>
          <p className="mt-0.5 truncate text-[14px] font-medium text-ink">
            {tenant || 'Unassigned'}
          </p>
        </div>
      </div>
      <button
        onClick={onAssign}
        className={cn(
          'inline-flex h-9 shrink-0 items-center rounded-xl bg-canvas px-3 text-[13px] font-medium text-ink',
          'transition-all duration-150 ease-out-soft hover:bg-surface hover:shadow-float'
        )}
      >
        {tenant ? 'Change' : 'Assign'}
      </button>
    </div>
  )
}

function RoomsList({ rooms }) {
  if (!rooms.length) {
    return (
      <div className="mt-3 rounded-xl border border-dashed border-edge bg-surface px-6 py-10 text-center shadow-float">
        <p className="text-[14px] font-medium text-ink">No rooms yet</p>
        <p className="mt-1 text-[13px] text-muted">Add the first room to this house.</p>
      </div>
    )
  }

  return (
    <ul className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2">
      {rooms.map((room) => (
        <li key={room.id}>
          <div
            className={cn(
              'flex items-center justify-between gap-3 rounded-lg border border-edge bg-surface shadow-card p-4 shadow-float',
              'transition-all duration-200 ease-out-soft hover:border-edge-hover hover:shadow-card-hover'
            )}
          >
            <div className="min-w-0">
              <p className="truncate text-[14px] font-semibold text-ink">{room.room_name}</p>
              <p className="mt-0.5 text-[12px] text-muted">
                {room.is_occupied ? 'Occupied' : 'Vacant'}
              </p>
            </div>
            <span
              className={cn(
                'size-2 rounded-full',
                room.is_occupied ? 'bg-success' : 'bg-faint'
              )}
              aria-hidden="true"
            />
          </div>
        </li>
      ))}
    </ul>
  )
}

function SmallStat({ label, value, tone = 'default' }) {
  return (
    <div className="rounded-lg border border-edge bg-surface shadow-card p-4 shadow-float">
      <p className="text-[11px] font-semibold uppercase tracking-[0.06em] text-faint">{label}</p>
      <p
        className={cn(
          'mt-2 text-[22px] font-semibold tracking-[-0.02em]',
          tone === 'accent' ? 'text-accent-deep' : 'text-ink'
        )}
      >
        {value}
      </p>
    </div>
  )
}

function SkeletonDetail() {
  return (
    <div className="mt-5 animate-pulse space-y-4">
      <div className="h-8 w-2/3 rounded-md bg-canvas" />
      <div className="h-4 w-1/3 rounded-md bg-canvas" />
      <div className="mt-5 grid grid-cols-3 gap-3">
        {[0, 1, 2].map((i) => (
          <div key={i} className="h-20 rounded-lg border border-edge bg-surface shadow-card" />
        ))}
      </div>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        {[0, 1].map((i) => (
          <div key={i} className="h-16 rounded-lg border border-edge bg-surface shadow-card" />
        ))}
      </div>
    </div>
  )
}

function ErrorBlock({ message, onRetry }) {
  return (
    <div className="mt-5 rounded-xl border border-danger/25 bg-danger/5 p-6 text-center shadow-float">
      <p className="text-[14px] font-medium text-ink">{message}</p>
      <button
        onClick={onRetry}
        className="mt-4 inline-flex h-10 items-center rounded-xl bg-ink px-4 text-[14px] font-semibold text-white hover:bg-ink/90"
      >
        Try again
      </button>
    </div>
  )
}