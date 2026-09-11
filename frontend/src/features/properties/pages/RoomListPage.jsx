import { useEffect, useMemo, useState } from 'react'
import api from '@/api/client'
import { cn } from '@/lib/cn'
import AddRoomModal from '@/features/properties/modals/AddRoomModal'

export default function RoomListPage() {
  const [rooms, setRooms] = useState([])
  const [houses, setHouses] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [showModal, setShowModal] = useState(false)
  const [query, setQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')

  async function load() {
    setLoading(true)
    setError('')
    try {
      const [r, h] = await Promise.all([
        api.get('/properties/rooms/').then((res) => res.data),
        api.get('/properties/houses/').then((res) => res.data),
      ])
      setRooms(Array.isArray(r) ? r : r.results ?? [])
      setHouses(Array.isArray(h) ? h : h.results ?? [])
    } catch {
      setError('Could not load rooms. Check your connection and try again.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
  }, [])

  const filtered = useMemo(() => {
    let list = rooms
    if (statusFilter === 'occupied') list = list.filter((r) => r.is_occupied)
    if (statusFilter === 'vacant') list = list.filter((r) => !r.is_occupied)
    if (query.trim()) {
      const q = query.toLowerCase()
      list = list.filter(
        (r) =>
          r.room_name?.toLowerCase().includes(q) ||
          r.house_number?.toLowerCase().includes(q) ||
          r.estate_name?.toLowerCase().includes(q)
      )
    }
    return list
  }, [rooms, query, statusFilter])

  const occupied = rooms.filter((r) => r.is_occupied).length
  const vacant = rooms.length - occupied

  return (
    <div className="mx-auto w-full max-w-2xl px-4 pb-24 pt-6 sm:px-6">
      <PageHeader
        title="Rooms"
        subtitle={
          rooms.length
            ? `${rooms.length} ${rooms.length === 1 ? 'room' : 'rooms'} · ${occupied} occupied · ${vacant} vacant`
            : 'All rooms across estates'
        }
        action={
          <button
            type="button"
            onClick={() => setShowModal(true)}
            className={cn(
              'inline-flex h-10 items-center gap-1.5 rounded-xl bg-ink px-4 text-[14px] font-semibold text-white',
              'shadow-float transition-all duration-150 ease-out-soft',
              'hover:border-edge-hover hover:shadow-card-hover',
              'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/40'
            )}
          >
            <PlusIcon />
            Add
          </button>
        }
      />

      {rooms.length > 0 && (
        <div className="mt-4 flex flex-col gap-2 sm:flex-row">
          <div className="relative flex-1">
            <svg
              viewBox="0 0 20 20"
              className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-faint"
              fill="none"
              aria-hidden="true"
            >
              <circle cx="9" cy="9" r="6" stroke="currentColor" strokeWidth="1.75" />
              <path d="M13.5 13.5L17 17" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" />
            </svg>
            <input
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search rooms, houses, estates"
              className={cn(
                'h-11 w-full rounded-lg border border-edge bg-surface shadow-card pl-10 pr-4 text-[15px] text-ink',
                'placeholder:text-faint transition-shadow duration-150',
                'focus:border-accent focus:outline-none focus:shadow-focus'
              )}
            />
          </div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className={cn(
              'h-11 rounded-lg border border-edge bg-surface shadow-card px-3.5 text-[14px] text-ink',
              'transition-shadow duration-150 focus:border-accent focus:outline-none focus:shadow-focus',
              'sm:w-40'
            )}
          >
            <option value="all">All rooms</option>
            <option value="occupied">Occupied</option>
            <option value="vacant">Vacant</option>
          </select>
        </div>
      )}

      {loading ? (
        <SkeletonList />
      ) : error ? (
        <ErrorState message={error} onRetry={load} />
      ) : filtered.length === 0 ? (
        <EmptyState hasQuery={!!query || statusFilter !== 'all'} onCreate={() => setShowModal(true)} />
      ) : (
        <ul className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
          {filtered.map((room) => (
            <li key={room.id}>
              <RoomCard room={room} />
            </li>
          ))}
        </ul>
      )}

      <AddRoomModal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        houses={houses}
        onSuccess={() => {
          setShowModal(false)
          load()
        }}
      />
    </div>
  )
}

function RoomCard({ room }) {
  return (
    <div
      className={cn(
        'flex items-center justify-between gap-3 rounded-lg border border-edge bg-surface shadow-card p-4 shadow-float',
        'transition-all duration-200 ease-out-soft hover:border-edge-hover hover:shadow-card-hover'
      )}
    >
      <div className="min-w-0">
        <p className="truncate text-[15px] font-semibold tracking-[-0.01em] text-ink">
          {room.room_name}
        </p>
        <p className="mt-0.5 truncate text-[12.5px] text-muted">
          {room.house_number}
          {room.estate_name && ` · ${room.estate_name}`}
        </p>
        <span
          className={cn(
            'mt-2 inline-flex items-center gap-1.5 rounded-pill px-2 py-0.5 text-[11.5px] font-medium',
            room.is_occupied
              ? 'bg-success/10 text-success'
              : 'bg-canvas text-muted'
          )}
        >
          <span
            className={cn(
              'size-1.5 rounded-full',
              room.is_occupied ? 'bg-success' : 'bg-faint'
            )}
          />
          {room.is_occupied ? 'Occupied' : 'Vacant'}
        </span>
      </div>
    </div>
  )
}

function PageHeader({ title, subtitle, action }) {
  return (
    <header className="flex items-start justify-between gap-4">
      <div className="min-w-0">
        <h1 className="text-[26px] font-semibold tracking-[-0.02em] text-ink">{title}</h1>
        {subtitle && <p className="mt-0.5 text-[13.5px] text-muted">{subtitle}</p>}
      </div>
      {action}
    </header>
  )
}

function SkeletonList() {
  return (
    <ul className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
      {[0, 1, 2, 3].map((i) => (
        <li key={i} className="animate-pulse rounded-lg border border-edge bg-surface shadow-card p-4 shadow-float">
          <div className="space-y-2">
            <div className="h-4 w-2/3 rounded-md bg-canvas" />
            <div className="h-3 w-1/2 rounded-md bg-canvas" />
            <div className="h-5 w-20 rounded-pill bg-canvas" />
          </div>
        </li>
      ))}
    </ul>
  )
}

function ErrorState({ message, onRetry }) {
  return (
    <div className="mt-4 rounded-xl border border-danger/25 bg-danger/5 p-6 text-center shadow-float">
      <div className="mx-auto grid size-11 place-items-center rounded-full bg-danger/10">
        <svg viewBox="0 0 24 24" className="size-5 text-danger" fill="none" aria-hidden="true">
          <path
            d="M12 8v5M12 17h.01M12 3l9 18H3l9-18z"
            stroke="currentColor"
            strokeWidth="1.75"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </div>
      <p className="mt-3 text-[14px] font-medium text-ink">{message}</p>
      <button
        onClick={onRetry}
        className="mt-4 inline-flex h-10 items-center rounded-xl bg-ink px-4 text-[14px] font-semibold text-white hover:bg-ink/90"
      >
        Try again
      </button>
    </div>
  )
}

function EmptyState({ hasQuery, onCreate }) {
  return (
    <div className="mt-4 rounded-xl border border-dashed border-edge bg-surface px-6 py-12 text-center shadow-float">
      <div className="mx-auto grid size-14 place-items-center rounded-full bg-accent-soft text-accent-deep">
        <svg viewBox="0 0 24 24" className="size-7" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <path d="M3 21V7l9-4 9 4v14M3 11h18M9 21v-4h6v4" />
        </svg>
      </div>
      <h2 className="mt-4 text-[16px] font-semibold text-ink">
        {hasQuery ? 'No matches' : 'No rooms yet'}
      </h2>
      <p className="mx-auto mt-1 max-w-[280px] text-[13.5px] leading-relaxed text-muted">
        {hasQuery
          ? 'Try a different search or filter.'
          : 'Add the first room to one of your houses.'}
      </p>
      {!hasQuery && (
        <button
          onClick={onCreate}
          className="mt-5 inline-flex h-10 items-center gap-1.5 rounded-xl bg-ink px-4 text-[14px] font-semibold text-white hover:bg-ink/90"
        >
          <PlusIcon />
          Add room
        </button>
      )}
    </div>
  )
}

function PlusIcon() {
  return (
    <svg viewBox="0 0 20 20" className="size-4" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
      <path d="M10 4v12M4 10h12" />
    </svg>
  )
}