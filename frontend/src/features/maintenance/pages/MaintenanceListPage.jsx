import { useEffect, useMemo, useState } from 'react'
import { useAuth } from '@/features/auth/context/AuthContext'
import api from '@/api/client'
import { cn } from '@/lib/cn'
import ReportIssue from '@/features/properties/modals/ReportIssue'

const STAFF_ROLES = new Set(['ADMIN', 'LANDLORD', 'ESTATE_MANAGER', 'CARETAKER'])
const TENANT_ROLES = new Set(['TENANT', 'SUB_TENANT'])

const STATUS_STYLE = {
  pending: 'bg-accent-soft text-accent-deep',
  'in-progress': 'bg-info/10 text-info',
  resolved: 'bg-success/10 text-success',
  cancelled: 'bg-canvas text-muted',
}

const PRIORITY_STYLE = {
  low: 'bg-canvas text-muted',
  medium: 'bg-accent-soft text-accent-deep',
  high: 'bg-danger/10 text-danger',
  urgent: 'bg-danger/15 text-danger',
}

export default function MaintenanceListPage() {
  const { user } = useAuth()
  const [tickets, setTickets] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [showModal, setShowModal] = useState(false)
  const [query, setQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')

  const isStaff = STAFF_ROLES.has(user?.role)
  const canCreate = STAFF_ROLES.has(user?.role) || TENANT_ROLES.has(user?.role)

  async function load() {
    setLoading(true)
    setError('')
    try {
      const { data } = await api.get('/maintenance/tickets/')
      setTickets(Array.isArray(data) ? data : data.results ?? [])
    } catch {
      setError('Could not load tickets. Check your connection and try again.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
  }, [])

  const filtered = useMemo(() => {
    let list = tickets
    if (statusFilter !== 'all') list = list.filter((t) => t.status === statusFilter)
    if (query.trim()) {
      const q = query.toLowerCase()
      list = list.filter(
        (t) =>
          t.title?.toLowerCase().includes(q) ||
          t.description?.toLowerCase().includes(q) ||
          t.tenant_name?.toLowerCase().includes(q) ||
          t.house_number?.toLowerCase().includes(q)
      )
    }
    return list
  }, [tickets, query, statusFilter])

  const open = tickets.filter((t) => t.status === 'pending' || t.status === 'in-progress').length
  const resolved = tickets.filter((t) => t.status === 'resolved').length

  return (
    <div className="mx-auto w-full max-w-2xl px-4 pb-24 pt-6 sm:px-6">
      <PageHeader
        title="Maintenance"
        subtitle={
          tickets.length
            ? `${tickets.length} total · ${open} open · ${resolved} resolved`
            : 'All maintenance requests'
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
              Report
            </button>
          )
        }
      />

      {tickets.length > 0 && (
        <div className="mt-4 flex flex-col gap-2 sm:flex-row">
          <SearchBar value={query} onChange={setQuery} placeholder="Search tickets, tenants" />
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
            <option value="pending">Pending</option>
            <option value="in-progress">In progress</option>
            <option value="resolved">Resolved</option>
            <option value="cancelled">Cancelled</option>
          </select>
        </div>
      )}

      {loading ? (
        <SkeletonList />
      ) : error ? (
        <ErrorState message={error} onRetry={load} />
      ) : filtered.length === 0 ? (
        <EmptyState
          hasQuery={!!query || statusFilter !== 'all'}
          canCreate={canCreate}
          onCreate={() => setShowModal(true)}
        />
      ) : (
        <ul className="mt-4 space-y-3.5">
          {filtered.map((ticket) => (
            <li key={ticket.id}>
              <TicketCard ticket={ticket} isStaff={isStaff} onRefresh={load} />
            </li>
          ))}
        </ul>
      )}

      <ReportIssue
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

function TicketCard({ ticket, isStaff, onRefresh }) {
  const [working, setWorking] = useState(false)
  const [expanded, setExpanded] = useState(false)

  async function updateStatus(nextStatus) {
    setWorking(true)
    try {
      await api.patch(`/maintenance/tickets/${ticket.id}/status/`, { status: nextStatus })
      onRefresh()
    } catch (err) {
      alert(err?.response?.data?.detail || 'Could not update status.')
    } finally {
      setWorking(false)
    }
  }

  async function assignMe() {
    setWorking(true)
    try {
      await api.post(`/maintenance/tickets/${ticket.id}/assign/`, { user_id: ticket.user_id })
      onRefresh()
    } catch (err) {
      alert(err?.response?.data?.detail || 'Could not assign.')
    } finally {
      setWorking(false)
    }
  }

  const isResolved = ticket.status === 'resolved'
  const isCancelled = ticket.status === 'cancelled'

  return (
    <article className="rounded-lg border border-edge bg-surface shadow-card p-4 shadow-float transition-all duration-200 ease-out-soft">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <h3 className="truncate text-[14.5px] font-semibold tracking-[-0.01em] text-ink">
              {ticket.title || ticket.description?.slice(0, 40) || `Ticket #${ticket.id}`}
            </h3>
            <StatusBadge status={ticket.status} />
          </div>
          <p className="mt-1 truncate text-[12.5px] text-muted">
            {ticket.tenant_name || '—'}
            {ticket.house_number && ` · ${ticket.house_number}`}
            {ticket.estate_name && ` · ${ticket.estate_name}`}
          </p>
        </div>
        <PriorityBadge priority={ticket.priority} />
      </div>

      {ticket.description && (
        <p
          className={cn(
            'mt-3 text-[13.5px] leading-relaxed text-muted',
            !expanded && 'line-clamp-2'
          )}
        >
          {ticket.description}
        </p>
      )}

      {ticket.description && ticket.description.length > 120 && (
        <button
          type="button"
          onClick={() => setExpanded((v) => !v)}
          className="mt-1 text-[12.5px] font-medium text-accent-deep hover:underline"
        >
          {expanded ? 'Show less' : 'Read more'}
        </button>
      )}

      {ticket.notes && expanded && (
        <div className="mt-3 rounded-lg bg-canvas/70 p-3">
          <p className="text-[11px] font-semibold uppercase tracking-[0.06em] text-faint">
            Activity
          </p>
          <pre className="mt-1.5 whitespace-pre-wrap font-sans text-[12.5px] leading-relaxed text-muted">
            {ticket.notes}
          </pre>
        </div>
      )}

      <div className="mt-3 flex items-center justify-between gap-3">
        <p className="text-[11.5px] text-faint">
          {isResolved && ticket.resolved_at
            ? `Resolved ${formatDate(ticket.resolved_at)}`
            : `Opened ${formatDate(ticket.created_at)}`}
        </p>

        {isStaff && !isResolved && !isCancelled && (
          <div className="flex gap-2">
            {ticket.status === 'pending' && (
              <button
                onClick={() => updateStatus('in-progress')}
                disabled={working}
                className="inline-flex h-8 items-center rounded-lg border border-edge bg-canvas px-3 text-[12px] font-medium text-ink transition-all duration-150 ease-out-soft hover:bg-surface hover:shadow-float disabled:opacity-50 disabled:pointer-events-none"
              >
                Start
              </button>
            )}
            {ticket.status === 'in-progress' && (
              <button
                onClick={() => updateStatus('resolved')}
                disabled={working}
                className="inline-flex h-8 items-center rounded-lg bg-success px-3 text-[12px] font-medium text-white transition-all duration-150 ease-out-soft hover:bg-success/90 disabled:opacity-50 disabled:pointer-events-none"
              >
                Resolve
              </button>
            )}
          </div>
        )}
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

function PriorityBadge({ priority }) {
  const cls = PRIORITY_STYLE[priority] || 'bg-canvas text-muted'
  return (
    <span
      className={cn(
        'shrink-0 rounded-pill px-2 py-0.5 text-[10.5px] font-medium uppercase tracking-[0.06em]',
        cls
      )}
    >
      {priority}
    </span>
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
          <div className="space-y-2">
            <div className="h-4 w-2/3 rounded-md bg-canvas" />
            <div className="h-3 w-1/2 rounded-md bg-canvas" />
            <div className="h-3 w-full rounded-md bg-canvas" />
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
          <path d="M12 8v5M12 17h.01M12 3l9 18H3l9-18z" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" />
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
        <svg viewBox="0 0 24 24" className="size-7" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <path d="M14.7 6.3a4 4 0 1 0 3 3L21 6l-3-3-3.3 3.3zM10 13l-7 7 1 1 7-7" />
        </svg>
      </div>
      <h2 className="mt-4 text-[16px] font-semibold text-ink">
        {hasQuery ? 'No matches' : 'No tickets yet'}
      </h2>
      <p className="mx-auto mt-1 max-w-[280px] text-[13.5px] leading-relaxed text-muted">
        {hasQuery
          ? 'Try a different search or filter.'
          : canCreate
            ? 'Report your first issue to get started.'
            : 'No maintenance tickets have been created yet.'}
      </p>
      {!hasQuery && canCreate && (
        <button
          onClick={onCreate}
          className="mt-5 inline-flex h-10 items-center gap-1.5 rounded-xl bg-ink px-4 text-[14px] font-semibold text-white hover:bg-ink/90"
        >
          <PlusIcon />
          Report issue
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