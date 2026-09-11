import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import api from '@/api/client'
import { cn } from '@/lib/cn'
import AddHouseModal from '@/features/properties/modals/AddHouseModal'

export default function EstateDetailPage() {
  const { id } = useParams()
  const [estate, setEstate] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [showAddHouse, setShowAddHouse] = useState(false)

  async function load() {
    setLoading(true)
    setError('')
    try {
      const { data } = await api.get(`/properties/estates/${id}/`)
      setEstate(data)
    } catch {
      setError('Could not load this estate.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
  }, [id])

  return (
    <div className="mx-auto w-full max-w-2xl px-4 pb-24 pt-6 sm:px-6">
      <Link
        to="/estates"
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
      ) : !estate ? (
        <ErrorBlock message="Estate not found." onRetry={load} />
      ) : (
        <>
          <header className="mt-5">
            <h1 className="text-[26px] font-semibold tracking-[-0.02em] text-ink">
              {estate.name}
            </h1>
            <p className="mt-1 flex items-center gap-1.5 text-[13.5px] text-muted">
              <svg viewBox="0 0 20 20" className="size-3.5" fill="none" aria-hidden="true">
                <path d="M10 18s6-5.5 6-10a6 6 0 10-12 0c0 4.5 6 10 6 10z" stroke="currentColor" strokeWidth="1.5" />
                <circle cx="10" cy="8" r="2" stroke="currentColor" strokeWidth="1.5" />
              </svg>
              {estate.location}
            </p>
          </header>

          <div className="mt-5 grid grid-cols-3 gap-3">
            <SmallStat label="Houses" value={estate.house_count ?? 0} />
            <SmallStat label="Units" value={estate.total_units ?? 0} />
            <SmallStat
              label="Occupancy"
              value={
                estate.total_units
                  ? `${Math.min(Math.round(((estate.house_count || 0) / estate.total_units) * 100), 100)}%`
                  : '—'
              }
            />
          </div>

          {(estate.manager_name || estate.landlord_name || estate.caretaker_name) && (
            <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-3">
              {estate.landlord_name && <PersonCard role="Landlord" name={estate.landlord_name} />}
              {estate.manager_name && <PersonCard role="Manager" name={estate.manager_name} />}
              {estate.caretaker_name && <PersonCard role="Caretaker" name={estate.caretaker_name} />}
            </div>
          )}

          <div className="mt-8 flex items-center justify-between">
            <h2 className="text-[11px] font-semibold uppercase tracking-[0.08em] text-faint">
              Houses
            </h2>
            <button
              onClick={() => setShowAddHouse(true)}
              className={cn(
                'inline-flex h-9 items-center gap-1.5 rounded-lg border border-edge bg-surface shadow-card px-3 text-[13px] font-medium text-ink',
                'shadow-float transition-all duration-150 ease-out-soft',
                'hover:border-edge-hover hover:shadow-card-hover'
              )}
            >
              <svg viewBox="0 0 20 20" className="size-3.5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
                <path d="M10 4v12M4 10h12" />
              </svg>
              Add house
            </button>
          </div>

          <HousesList
            houses={estate.houses ?? []}
            onRefresh={load}
          />
        </>
      )}

      <AddHouseModal
        isOpen={showAddHouse}
        onClose={() => setShowAddHouse(false)}
        estateId={id}
        onSuccess={() => {
          setShowAddHouse(false)
          load()
        }}
      />
    </div>
  )
}

function HousesList({ houses, onRefresh }) {
  if (!houses.length) {
    return (
      <div className="mt-3 rounded-xl border border-dashed border-edge bg-surface px-6 py-10 text-center shadow-float">
        <p className="text-[14px] font-medium text-ink">No houses yet</p>
        <p className="mt-1 text-[13px] text-muted">Add the first house to this estate.</p>
      </div>
    )
  }

  return (
    <ul className="mt-3 space-y-3">
      {houses.map((house) => (
        <li key={house.id}>
          <Link
            to={`/houses/${house.id}`}
            className={cn(
              'group flex items-center justify-between gap-3 rounded-lg border border-edge bg-surface shadow-card p-4 shadow-float',
              'transition-all duration-200 ease-out-soft',
              'hover:border-edge-hover hover:shadow-card-hover'
            )}
          >
            <div className="min-w-0 flex-1">
              <p className="truncate text-[15px] font-semibold tracking-[-0.01em] text-ink">
                {house.house_number}
              </p>
              <p className="mt-0.5 truncate text-[13px] text-muted">
                {house.tenant_username
                  ? `Tenant: ${house.tenant_username}`
                  : 'No tenant assigned'}
                {house.room_count > 0 && ` · ${house.room_count} rooms`}
              </p>
            </div>
            <svg
              viewBox="0 0 24 24"
              className="size-4 shrink-0 text-faint transition-transform duration-200 group-hover:translate-x-0.5 group-hover:text-accent"
              fill="none"
              aria-hidden="true"
            >
              <path d="M9 18l6-6-6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </Link>
        </li>
      ))}
    </ul>
  )
}

function SmallStat({ label, value }) {
  return (
    <div className="rounded-lg border border-edge bg-surface shadow-card p-4 shadow-float">
      <p className="text-[11px] font-semibold uppercase tracking-[0.06em] text-faint">
        {label}
      </p>
      <p className="mt-2 text-[22px] font-semibold tracking-[-0.02em] text-ink">{value}</p>
    </div>
  )
}

function PersonCard({ role, name }) {
  return (
    <div className="flex items-center gap-3 rounded-lg border border-edge bg-surface shadow-card p-3.5 shadow-float">
      <span className="grid size-9 place-items-center rounded-full bg-accent-soft text-[13px] font-semibold text-accent-deep">
        {name.slice(0, 1).toUpperCase()}
      </span>
      <div className="min-w-0">
        <p className="truncate text-[14px] font-medium text-ink">{name}</p>
        <p className="text-[11.5px] uppercase tracking-[0.06em] text-faint">{role}</p>
      </div>
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
      <div className="space-y-3">
        {[0, 1, 2].map((i) => (
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