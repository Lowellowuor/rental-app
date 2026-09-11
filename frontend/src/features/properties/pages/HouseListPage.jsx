import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '@/features/auth/context/AuthContext'
import api from '@/api/client'
import { cn } from '@/lib/cn'
import AddHouseModal from '@/features/properties/modals/AddHouseModal'

const MANAGER_ROLES = new Set(['ADMIN', 'LANDLORD', 'ESTATE_MANAGER'])

export default function HouseListPage() {
  const { user } = useAuth()
  const [houses, setHouses] = useState([])
  const [estates, setEstates] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [showModal, setShowModal] = useState(false)
  const [query, setQuery] = useState('')
  const [estateFilter, setEstateFilter] = useState('')

  const canCreate = MANAGER_ROLES.has(user?.role)

  async function load() {
    setLoading(true)
    setError('')
    try {
      const [h, e] = await Promise.all([
        api.get('/properties/houses/').then((r) => r.data),
        api.get('/properties/estates/').then((r) => r.data),
      ])
      setHouses(Array.isArray(h) ? h : h.results ?? [])
      setEstates(Array.isArray(e) ? e : e.results ?? [])
    } catch {
      setError('Could not load houses. Check your connection and try again.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
  }, [])

  const filtered = useMemo(() => {
    let list = houses
    if (estateFilter) {
      list = list.filter((h) => String(h.estate) === estateFilter)
    }
    if (query.trim()) {
      const q = query.toLowerCase()
      list = list.filter(
        (h) =>
          h.house_number?.toLowerCase().includes(q) ||
          h.estate_name?.toLowerCase().includes(q) ||
          h.tenant_username?.toLowerCase().includes(q)
      )
    }
    return list
  }, [houses, query, estateFilter])

  return (
    <div className="mx-auto w-full max-w-2xl px-4 pb-24 pt-6 sm:px-6">
      <PageHeader
        title="Houses"
        subtitle={
          houses.length
            ? `${houses.length} ${houses.length === 1 ? 'house' : 'houses'}`
            : 'All residential units'
        }
        action={
          canCreate && (
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
          )
        }
      />

      {houses.length > 0 && (
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
              placeholder="Search houses, estates, tenants"
              className={cn(
                'h-11 w-full rounded-lg border border-edge bg-surface shadow-card pl-10 pr-4 text-[15px] text-ink',
                'placeholder:text-faint transition-shadow duration-150',
                'focus:border-accent focus:outline-none focus:shadow-focus'
              )}
            />
          </div>
          {estates.length > 1 && (
            <select
              value={estateFilter}
              onChange={(e) => setEstateFilter(e.target.value)}
              className={cn(
                'h-11 rounded-lg border border-edge bg-surface shadow-card px-3.5 text-[14px] text-ink',
                'transition-shadow duration-150 focus:border-accent focus:outline-none focus:shadow-focus',
                'sm:w-48'
              )}
            >
              <option value="">All estates</option>
              {estates.map((e) => (
                <option key={e.id} value={e.id}>
                  {e.name}
                </option>
              ))}
            </select>
          )}
        </div>
      )}

      {loading ? (
        <SkeletonList />
      ) : error ? (
        <ErrorState message={error} onRetry={load} />
      ) : filtered.length === 0 ? (
        <EmptyState
          hasQuery={!!query || !!estateFilter}
          canCreate={canCreate}
          onCreate={() => setShowModal(true)}
        />
      ) : (
        <ul className="mt-4 space-y-3.5">
          {filtered.map((house) => (
            <li key={house.id}>
              <HouseCard house={house} />
            </li>
          ))}
        </ul>
      )}

      <AddHouseModal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        onSuccess={() => {
          setShowModal(false)
          load()
        }}
      />
    </div>
  )
}

function HouseCard({ house }) {
  return (
    <Link
      to={`/houses/${house.id}`}
      className={cn(
        'group block rounded-lg border border-edge bg-surface shadow-card p-4 shadow-float',
        'transition-all duration-200 ease-out-soft',
        'hover:border-edge-hover hover:shadow-card-hover',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/40'
      )}
    >
      <div className="flex items-start gap-3.5">
        <span className="grid size-11 shrink-0 place-items-center rounded-[10px] bg-accent-soft text-accent-deep">
          <HouseIcon />
        </span>

        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-3">
            <h3 className="truncate text-[15px] font-semibold tracking-[-0.01em] text-ink">
              {house.house_number}
            </h3>
            <svg
              viewBox="0 0 24 24"
              className="mt-0.5 size-4 shrink-0 text-faint transition-transform duration-200 group-hover:translate-x-0.5 group-hover:text-accent"
              fill="none"
              aria-hidden="true"
            >
              <path d="M9 18l6-6-6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>

          <p className="mt-0.5 truncate text-[13px] text-muted">{house.estate_name}</p>

          <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1 text-[12.5px]">
            <span className="text-muted">
              <span className="font-semibold text-ink">{house.room_count ?? 0}</span>
              <span className="ml-1">
                {house.room_count === 1 ? 'room' : 'rooms'}
              </span>
            </span>
            <span className="text-edge">·</span>
            {house.tenant_username ? (
              <span className="inline-flex items-center gap-1.5 rounded-pill bg-success/10 px-2 py-0.5 text-[11.5px] font-medium text-success">
                <span className="size-1.5 rounded-full bg-success" />
                {house.tenant_username}
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5 rounded-pill bg-canvas px-2 py-0.5 text-[11.5px] font-medium text-muted">
                <span className="size-1.5 rounded-full bg-faint" />
                Vacant
              </span>
            )}
          </div>
        </div>
      </div>
    </Link>
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
    <ul className="mt-4 space-y-3.5">
      {[0, 1, 2].map((i) => (
        <li
          key={i}
          className="animate-pulse rounded-lg border border-edge bg-surface shadow-card p-4 shadow-float"
        >
          <div className="flex items-start gap-3.5">
            <div className="size-11 rounded-[10px] bg-canvas" />
            <div className="flex-1 space-y-2 pt-1">
              <div className="h-4 w-2/3 rounded-md bg-canvas" />
              <div className="h-3 w-1/2 rounded-md bg-canvas" />
              <div className="h-3 w-1/3 rounded-md bg-canvas" />
            </div>
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

function EmptyState({ hasQuery, canCreate, onCreate }) {
  return (
    <div className="mt-4 rounded-xl border border-dashed border-edge bg-surface px-6 py-12 text-center shadow-float">
      <div className="mx-auto grid size-14 place-items-center rounded-full bg-accent-soft text-accent-deep">
        <HouseIcon big />
      </div>
      <h2 className="mt-4 text-[16px] font-semibold text-ink">
        {hasQuery ? 'No matches' : 'No houses yet'}
      </h2>
      <p className="mx-auto mt-1 max-w-[280px] text-[13.5px] leading-relaxed text-muted">
        {hasQuery
          ? 'Try a different search or filter.'
          : canCreate
            ? 'Add the first house to one of your estates.'
            : 'No houses have been assigned to you yet.'}
      </p>
      {!hasQuery && canCreate && (
        <button
          onClick={onCreate}
          className="mt-5 inline-flex h-10 items-center gap-1.5 rounded-xl bg-ink px-4 text-[14px] font-semibold text-white hover:bg-ink/90"
        >
          <PlusIcon />
          Add house
        </button>
      )}
    </div>
  )
}

function HouseIcon({ big }) {
  return (
    <svg
      viewBox="0 0 24 24"
      className={big ? 'size-7' : 'size-5'}
      fill="none"
      stroke="currentColor"
      strokeWidth="1.75"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M3 10l9-7 9 7v10a2 2 0 0 1-2 2h-4v-6h-6v6H5a2 2 0 0 1-2-2V10z" />
    </svg>
  )
}

function PlusIcon() {
  return (
    <svg viewBox="0 0 20 20" className="size-4" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
      <path d="M10 4v12M4 10h12" />
    </svg>
  )
}