import { useEffect, useMemo, useState } from 'react'
import { useAuth } from '@/features/auth/context/AuthContext'
import api from '@/api/client'
import { cn } from '@/lib/cn'

const MANAGER_ROLES = new Set(['ADMIN', 'LANDLORD', 'ESTATE_MANAGER'])

const KES = new Intl.NumberFormat('en-KE', {
  style: 'currency',
  currency: 'KES',
  maximumFractionDigits: 0,
})

const STATUS_STYLE = {
  active: 'bg-success/10 text-success',
  pending: 'bg-accent-soft text-accent-deep',
  expired: 'bg-canvas text-muted',
  terminated: 'bg-canvas text-muted',
}

export default function LeaseListPage() {
  const { user } = useAuth()
  const [leases, setLeases] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [query, setQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')

  const canManage = MANAGER_ROLES.has(user?.role)

  async function load() {
    setLoading(true)
    setError('')
    try {
      const { data } = await api.get('/leasing/leases/')
      setLeases(Array.isArray(data) ? data : data.results ?? [])
    } catch {
      setError('Could not load leases. Check your connection and try again.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
  }, [])

  const filtered = useMemo(() => {
    let list = leases
    if (statusFilter !== 'all') list = list.filter((l) => l.status === statusFilter)
    if (query.trim()) {
      const q = query.toLowerCase()
      list = list.filter(
        (l) =>
          l.tenant_name?.toLowerCase().includes(q) ||
          l.house_number?.toLowerCase().includes(q) ||
          l.room_name?.toLowerCase().includes(q) ||
          l.estate_name?.toLowerCase().includes(q)
      )
    }
    return list
  }, [leases, query, statusFilter])

  const active = leases.filter((l) => l.status === 'active').length

  return (
    <div className="mx-auto w-full max-w-2xl px-4 pb-24 pt-6 sm:px-6">
      <PageHeader
        title="Leases"
        subtitle={
          leases.length
            ? `${leases.length} total · ${active} active`
            : 'All lease agreements'
        }
      />

      {leases.length > 0 && (
        <div className="mt-4 flex flex-col gap-2 sm:flex-row">
          <SearchBar value={query} onChange={setQuery} placeholder="Search tenant, house, room" />
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className={cn(
              'h-11 rounded-lg border border-edge bg-surface shadow-card px-3.5 text-[14px] text-ink',
              'transition-shadow duration-150 focus:border-accent focus:outline-none focus:shadow-focus',
              'sm:w-40'
            )}
          >
            <option value="all">All status</option>
            <option value="active">Active</option>
            <option value="pending">Pending</option>
            <option value="expired">Expired</option>
            <option value="terminated">Terminated</option>
          </select>
        </div>
      )}

      {loading ? (
        <SkeletonList />
      ) : error ? (
        <ErrorState message={error} onRetry={load} />
      ) : filtered.length === 0 ? (
        <EmptyState hasQuery={!!query || statusFilter !== 'all'} />
      ) : (
        <ul className="mt-4 space-y-3.5">
          {filtered.map((lease) => (
            <li key={lease.id}>
              <LeaseCard lease={lease} canManage={canManage} onRefresh={load} />
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}

function LeaseCard({ lease, canManage, onRefresh }) {
  const [working, setWorking] = useState(false)

  async function generateInvoice() {
    setWorking(true)
    try {
      await api.post(`/leasing/leases/${lease.id}/generate-invoice/`)
      onRefresh()
    } catch (err) {
      alert(err?.response?.data?.detail || 'Could not generate invoice.')
    } finally {
      setWorking(false)
    }
  }

  const initials = (lease.tenant_name?.[0] || '?').toUpperCase()

  return (
    <article
      className={cn(
        'rounded-lg border border-edge bg-surface shadow-card p-4 shadow-float',
        'transition-all duration-200 ease-out-soft'
      )}
    >
      <div className="flex items-start gap-3.5">
        <span className="grid size-11 shrink-0 place-items-center rounded-full bg-accent-soft text-[15px] font-semibold text-accent-deep">
          {initials}
        </span>

        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <h3 className="truncate text-[15px] font-semibold tracking-[-0.01em] text-ink">
                {lease.tenant_name || 'Unnamed tenant'}
              </h3>
              <p className="mt-0.5 truncate text-[12.5px] text-muted">
                {lease.room_name}
                {lease.house_number && ` · ${lease.house_number}`}
                {lease.estate_name && ` · ${lease.estate_name}`}
              </p>
            </div>
            <StatusBadge status={lease.status} />
          </div>

          <div className="mt-3 flex items-center justify-between gap-3">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.06em] text-faint">
                Monthly rent
              </p>
              <p className="mt-0.5 text-[17px] font-semibold tracking-[-0.02em] text-ink">
                {KES.format(lease.monthly_rent ?? 0)}
              </p>
            </div>
            {lease.next_invoice_date && (
              <div className="text-right">
                <p className="text-[11px] font-semibold uppercase tracking-[0.06em] text-faint">
                  Next invoice
                </p>
                <p className="mt-0.5 text-[13px] font-medium text-ink">
                  {formatDate(lease.next_invoice_date)}
                </p>
              </div>
            )}
          </div>

          {canManage && lease.status === 'active' && (
            <div className="mt-3 flex gap-2">
              <button
                onClick={generateInvoice}
                disabled={working}
                className={cn(
                  'inline-flex h-9 items-center gap-1.5 rounded-xl bg-canvas px-3 text-[12.5px] font-medium text-ink',
                  'transition-all duration-150 ease-out-soft',
                  'hover:bg-surface hover:shadow-float',
                  'disabled:opacity-50 disabled:pointer-events-none'
                )}
              >
                {working ? 'Generating…' : 'Generate invoice'}
              </button>
            </div>
          )}
        </div>
      </div>
    </article>
  )
}

function StatusBadge({ status }) {
  const cls = STATUS_STYLE[status] || 'bg-canvas text-muted'
  return (
    <span
      className={cn(
        'shrink-0 rounded-pill px-2 py-0.5 text-[10.5px] font-medium uppercase tracking-[0.06em]',
        cls
      )}
    >
      {status}
    </span>
  )
}

function PageHeader({ title, subtitle }) {
  return (
    <header>
      <h1 className="text-[26px] font-semibold tracking-[-0.02em] text-ink">{title}</h1>
      {subtitle && <p className="mt-0.5 text-[13.5px] text-muted">{subtitle}</p>}
    </header>
  )
}

function SearchBar({ value, onChange, placeholder }) {
  return (
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
        <li key={i} className="animate-pulse rounded-lg border border-edge bg-surface shadow-card p-4 shadow-float">
          <div className="flex items-start gap-3.5">
            <div className="size-11 rounded-full bg-canvas" />
            <div className="flex-1 space-y-2 pt-1">
              <div className="h-4 w-2/3 rounded-md bg-canvas" />
              <div className="h-3 w-1/2 rounded-md bg-canvas" />
              <div className="h-6 w-1/3 rounded-md bg-canvas" />
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

function EmptyState({ hasQuery }) {
  return (
    <div className="mt-4 rounded-xl border border-dashed border-edge bg-surface px-6 py-12 text-center shadow-float">
      <div className="mx-auto grid size-14 place-items-center rounded-full bg-accent-soft text-accent-deep">
        <svg viewBox="0 0 24 24" className="size-7" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <path d="M6 3h9l5 5v13H6zM14 3v6h6M9 13h6M9 17h6" />
        </svg>
      </div>
      <h2 className="mt-4 text-[16px] font-semibold text-ink">
        {hasQuery ? 'No matches' : 'No leases yet'}
      </h2>
      <p className="mx-auto mt-1 max-w-[280px] text-[13.5px] leading-relaxed text-muted">
        {hasQuery
          ? 'Try a different search or filter.'
          : 'Leases will appear here once tenants sign.'}
      </p>
    </div>
  )
}

function formatDate(value) {
  if (!value) return '—'
  try {
    return new Date(value).toLocaleDateString('en-KE', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    })
  } catch {
    return value
  }
}