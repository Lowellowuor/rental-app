import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import api from '@/api/client'
import { cn } from '@/lib/cn'
import AddTenantModal from '@/features/properties/modals/AddTenantModal'

const ROLE_LABEL = {
  TENANT: 'Tenant',
  SUB_TENANT: 'Sub-tenant',
}

export default function TenantListPage() {
  const [tenants, setTenants] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [showModal, setShowModal] = useState(false)
  const [query, setQuery] = useState('')
  const [roleFilter, setRoleFilter] = useState('all')

  async function load() {
    setLoading(true)
    setError('')
    try {
      const { data } = await api.get('/auth/list/')
      const list = Array.isArray(data) ? data : data.results ?? []
      setTenants(list.filter((u) => u.role === 'TENANT' || u.role === 'SUB_TENANT'))
    } catch {
      setError('Could not load tenants. Check your connection and try again.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
  }, [])

  const filtered = useMemo(() => {
    let list = tenants
    if (roleFilter !== 'all') list = list.filter((t) => t.role === roleFilter)
    if (query.trim()) {
      const q = query.toLowerCase()
      list = list.filter(
        (t) =>
          t.username?.toLowerCase().includes(q) ||
          t.email?.toLowerCase().includes(q) ||
          t.phone_number?.toLowerCase().includes(q) ||
          t.national_id?.toLowerCase().includes(q)
      )
    }
    return list
  }, [tenants, query, roleFilter])

  const verified = tenants.filter((t) => t.is_verified).length

  return (
    <div className="mx-auto w-full max-w-2xl px-4 pb-24 pt-6 sm:px-6">
      <PageHeader
        title="Tenants"
        subtitle={
          tenants.length
            ? `${tenants.length} ${tenants.length === 1 ? 'tenant' : 'tenants'} · ${verified} verified`
            : 'All tenants and sub-tenants'
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

      {tenants.length > 0 && (
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
              placeholder="Search name, phone, ID"
              className={cn(
                'h-11 w-full rounded-lg border border-edge bg-surface shadow-card pl-10 pr-4 text-[15px] text-ink',
                'placeholder:text-faint transition-shadow duration-150',
                'focus:border-accent focus:outline-none focus:shadow-focus'
              )}
            />
          </div>
          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
            className={cn(
              'h-11 rounded-lg border border-edge bg-surface shadow-card px-3.5 text-[14px] text-ink',
              'transition-shadow duration-150 focus:border-accent focus:outline-none focus:shadow-focus',
              'sm:w-40'
            )}
          >
            <option value="all">All types</option>
            <option value="TENANT">Tenants</option>
            <option value="SUB_TENANT">Sub-tenants</option>
          </select>
        </div>
      )}

      {loading ? (
        <SkeletonList />
      ) : error ? (
        <ErrorState message={error} onRetry={load} />
      ) : filtered.length === 0 ? (
        <EmptyState hasQuery={!!query || roleFilter !== 'all'} onCreate={() => setShowModal(true)} />
      ) : (
        <ul className="mt-4 space-y-3">
          {filtered.map((tenant) => (
            <li key={tenant.id}>
              <TenantCard tenant={tenant} />
            </li>
          ))}
        </ul>
      )}

      <AddTenantModal
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

function TenantCard({ tenant }) {
  const initials = (tenant.first_name?.[0] || tenant.username?.[0] || '?').toUpperCase()
  const fullName = [tenant.first_name, tenant.last_name].filter(Boolean).join(' ') || tenant.username

  return (
    <Link
      to={`/tenants/${tenant.id}`}
      className={cn(
        'group block rounded-lg border border-edge bg-surface shadow-card p-4 shadow-float',
        'transition-all duration-200 ease-out-soft',
        'hover:border-edge-hover hover:shadow-card-hover',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/40'
      )}
    >
      <div className="flex items-center gap-3.5">
        <span className="grid size-11 shrink-0 place-items-center rounded-full bg-accent-soft text-[15px] font-semibold text-accent-deep">
          {initials}
        </span>

        <div className="min-w-0 flex-1">
          <div className="flex items-center justify-between gap-3">
            <h3 className="truncate text-[15px] font-semibold tracking-[-0.01em] text-ink">
              {fullName}
            </h3>
            <div className="flex items-center gap-1.5 shrink-0">
              {tenant.is_verified && (
                <span
                  className="grid size-4 place-items-center rounded-full bg-success text-white"
                  aria-label="Verified"
                >
                  <svg viewBox="0 0 20 20" className="size-2.5" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                    <path d="M5 10l3 3 7-7" />
                  </svg>
                </span>
              )}
              <span className="rounded-pill bg-canvas px-2 py-0.5 text-[10.5px] font-medium uppercase tracking-[0.06em] text-muted">
                {ROLE_LABEL[tenant.role] || tenant.role}
              </span>
            </div>
          </div>

          <p className="mt-0.5 truncate text-[12.5px] text-muted">
            {tenant.phone_number || tenant.email || '—'}
          </p>

          {tenant.national_id && (
            <p className="mt-1 truncate text-[11.5px] text-faint">
              ID · {tenant.national_id}
            </p>
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

function SkeletonList() {
  return (
    <ul className="mt-4 space-y-3">
      {[0, 1, 2, 3].map((i) => (
        <li key={i} className="animate-pulse rounded-lg border border-edge bg-surface shadow-card p-4 shadow-float">
          <div className="flex items-center gap-3.5">
            <div className="size-11 rounded-full bg-canvas" />
            <div className="flex-1 space-y-2">
              <div className="h-4 w-1/2 rounded-md bg-canvas" />
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

function EmptyState({ hasQuery, onCreate }) {
  return (
    <div className="mt-4 rounded-xl border border-dashed border-edge bg-surface px-6 py-12 text-center shadow-float">
      <div className="mx-auto grid size-14 place-items-center rounded-full bg-accent-soft text-accent-deep">
        <svg viewBox="0 0 24 24" className="size-7" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <path d="M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8zM4 21a8 8 0 0 1 16 0" />
        </svg>
      </div>
      <h2 className="mt-4 text-[16px] font-semibold text-ink">
        {hasQuery ? 'No matches' : 'No tenants yet'}
      </h2>
      <p className="mx-auto mt-1 max-w-[280px] text-[13.5px] leading-relaxed text-muted">
        {hasQuery
          ? 'Try a different search or filter.'
          : 'Add your first tenant to get started.'}
      </p>
      {!hasQuery && (
        <button
          onClick={onCreate}
          className="mt-5 inline-flex h-10 items-center gap-1.5 rounded-xl bg-ink px-4 text-[14px] font-semibold text-white hover:bg-ink/90"
        >
          <PlusIcon />
          Add tenant
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