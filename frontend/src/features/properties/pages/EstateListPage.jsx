import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '@/features/auth/context/AuthContext'
import api from '@/api/client'
import { cn } from '@/lib/cn'
import AddEstateModal from '@/features/properties/modals/AddEstateModal'

const MANAGER_ROLES = new Set(['ADMIN', 'LANDLORD', 'ESTATE_MANAGER'])

export default function EstateListPage() {
  const { user } = useAuth()
  const [estates, setEstates] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [showModal, setShowModal] = useState(false)
  const [query, setQuery] = useState('')

  const canCreate = MANAGER_ROLES.has(user?.role)

  async function load() {
    setLoading(true)
    setError('')
    try {
      const { data } = await api.get('/properties/estates/')
      setEstates(Array.isArray(data) ? data : data.results ?? [])
    } catch {
      setError('Could not load estates. Check your connection and try again.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
  }, [])

  const filtered = useMemo(() => {
    if (!query.trim()) return estates
    const q = query.toLowerCase()
    return estates.filter(
      (e) =>
        e.name?.toLowerCase().includes(q) ||
        e.location?.toLowerCase().includes(q)
    )
  }, [estates, query])

  return (
    <div className="mx-auto w-full max-w-2xl px-4 pb-24 pt-6 sm:px-6">
      <PageHeader
        title="Estates"
        subtitle={
          estates.length
            ? `${estates.length} ${estates.length === 1 ? 'property' : 'properties'}`
            : 'Manage your properties'
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

      {estates.length > 4 && (
        <SearchBar value={query} onChange={setQuery} placeholder="Search estates or locations" />
      )}

      {loading ? (
        <SkeletonList />
      ) : error ? (
        <ErrorState message={error} onRetry={load} />
      ) : filtered.length === 0 ? (
        <EmptyState
          hasQuery={!!query}
          canCreate={canCreate}
          onCreate={() => setShowModal(true)}
        />
      ) : (
        <ul className="mt-4 space-y-3.5">
          {filtered.map((estate) => (
            <li key={estate.id}>
              <EstateCard estate={estate} />
            </li>
          ))}
        </ul>
      )}

      <AddEstateModal
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

function EstateCard({ estate }) {
  const occupancy = estate.house_count || 0
  const units = estate.total_units || 0
  const fill = units ? Math.min(Math.round((occupancy / units) * 100), 100) : 0

  return (
    <Link
      to={`/estates/${estate.id}`}
      className={cn(
        'group block rounded-lg border border-edge bg-surface shadow-card p-4 shadow-float',
        'transition-all duration-200 ease-out-soft',
        'hover:border-edge-hover hover:shadow-card-hover',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/40'
      )}
    >
      <div className="flex items-start gap-3.5">
        <span className="grid size-11 shrink-0 place-items-center rounded-[10px] bg-accent-soft text-accent-deep">
          <EstateIcon />
        </span>

        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-3">
            <h3 className="truncate text-[15px] font-semibold tracking-[-0.01em] text-ink">
              {estate.name}
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

          <p className="mt-0.5 flex items-center gap-1.5 truncate text-[13px] text-muted">
            <svg viewBox="0 0 20 20" className="size-3.5 shrink-0" fill="none" aria-hidden="true">
              <path d="M10 18s6-5.5 6-10a6 6 0 10-12 0c0 4.5 6 10 6 10z" stroke="currentColor" strokeWidth="1.5" />
              <circle cx="10" cy="8" r="2" stroke="currentColor" strokeWidth="1.5" />
            </svg>
            <span className="truncate">{estate.location}</span>
          </p>

          <div className="mt-3 flex items-center gap-3 text-[12.5px]">
            <span className="text-muted">
              <span className="font-semibold text-ink">{estate.house_count ?? 0}</span>
              <span className="ml-1">
                {estate.house_count === 1 ? 'house' : 'houses'}
              </span>
            </span>
            <span className="text-edge">·</span>
            <span className="text-muted">
              <span className="font-semibold text-ink">{units}</span>
              <span className="ml-1">units</span>
            </span>
            {estate.manager_name && (
              <>
                <span className="text-edge">·</span>
                <span className="truncate text-muted">{estate.manager_name}</span>
              </>
            )}
          </div>

          {units > 0 && (
            <div className="mt-3">
              <div className="h-1 w-full overflow-hidden rounded-pill bg-canvas">
                <div
                  className="h-full rounded-pill bg-accent transition-all duration-500 ease-out-soft"
                  style={{ width: `${fill}%` }}
                />
              </div>
              <p className="mt-1.5 text-[11px] text-faint">{fill}% allocated</p>
            </div>
          )}
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

function SearchBar({ value, onChange, placeholder }) {
  return (
    <div className="relative mt-4">
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
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className={cn(
          'h-11 w-full rounded-lg border border-edge bg-surface shadow-card pl-10 pr-4 text-[15px] text-ink',
          'placeholder:text-faint transition-shadow duration-150',
          'focus:border-accent focus:outline-none focus:shadow-focus'
        )}
      />
    </div>
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
        <svg viewBox="0 0 24 24" className="size-7" fill="none" aria-hidden="true">
          <path
            d="M3 21h18M5 21V7l7-4 7 4v14M9 21v-6h6v6"
            stroke="currentColor"
            strokeWidth="1.6"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </div>
      <h2 className="mt-4 text-[16px] font-semibold text-ink">
        {hasQuery ? 'No matches' : 'No estates yet'}
      </h2>
      <p className="mx-auto mt-1 max-w-[280px] text-[13.5px] leading-relaxed text-muted">
        {hasQuery
          ? 'Try a different search term.'
          : canCreate
            ? 'Create your first estate to start managing properties.'
            : 'Nothing has been assigned to you yet.'}
      </p>
      {!hasQuery && canCreate && (
        <button
          onClick={onCreate}
          className="mt-5 inline-flex h-10 items-center gap-1.5 rounded-xl bg-ink px-4 text-[14px] font-semibold text-white hover:bg-ink/90"
        >
          <PlusIcon />
          Add estate
        </button>
      )}
    </div>
  )
}

function EstateIcon() {
  return (
    <svg viewBox="0 0 24 24" className="size-5" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M3 21h18M5 21V7l7-4 7 4v14M9 21v-6h6v6" />
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