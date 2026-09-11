import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '@/features/auth/context/AuthContext'
import api from '@/api/client'
import { cn } from '@/lib/cn'

const FINANCE_ROLES = new Set(['ADMIN', 'LANDLORD', 'ESTATE_MANAGER', 'ACCOUNTANT'])
const TENANT_ROLES = new Set(['TENANT', 'SUB_TENANT'])

const KES = new Intl.NumberFormat('en-KE', {
  style: 'currency',
  currency: 'KES',
  maximumFractionDigits: 0,
})

const STATUS_STYLE = {
  paid: 'bg-success/10 text-success',
  pending: 'bg-accent-soft text-accent-deep',
  partial: 'bg-accent-soft text-accent-deep',
  overdue: 'bg-danger/10 text-danger',
  cancelled: 'bg-canvas text-muted',
}

export default function InvoiceListPage() {
  const { user } = useAuth()
  const [invoices, setInvoices] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [query, setQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')

  const canManage = FINANCE_ROLES.has(user?.role)
  const canPay = TENANT_ROLES.has(user?.role)

  async function load() {
    setLoading(true)
    setError('')
    try {
      const { data } = await api.get('/leasing/invoices/')
      setInvoices(Array.isArray(data) ? data : data.results ?? [])
    } catch {
      setError('Could not load invoices. Check your connection and try again.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
  }, [])

  const filtered = useMemo(() => {
    let list = invoices
    if (statusFilter !== 'all') list = list.filter((i) => i.status === statusFilter)
    if (query.trim()) {
      const q = query.toLowerCase()
      list = list.filter(
        (i) =>
          i.reference?.toLowerCase().includes(q) ||
          i.tenant_name?.toLowerCase().includes(q) ||
          i.house_number?.toLowerCase().includes(q) ||
          i.room_name?.toLowerCase().includes(q)
      )
    }
    return list
  }, [invoices, query, statusFilter])

  const outstanding = invoices
    .filter((i) => i.status !== 'paid' && i.status !== 'cancelled')
    .reduce((sum, i) => sum + Number(i.balance_due || 0), 0)

  const overdueCount = invoices.filter((i) => i.status === 'overdue').length

  return (
    <div className="mx-auto w-full max-w-2xl px-4 pb-24 pt-6 sm:px-6">
      <PageHeader title="Invoices" subtitle="All bills and payment status" />

      {invoices.length > 0 && (
        <div className="mt-4 rounded-lg border border-edge bg-surface shadow-card p-4 shadow-float">
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.06em] text-faint">
                Total outstanding
              </p>
              <p className="mt-1 text-[24px] font-semibold tracking-[-0.02em] text-ink">
                {KES.format(outstanding)}
              </p>
            </div>
            {overdueCount > 0 && (
              <span className="rounded-pill bg-danger/10 px-2.5 py-1 text-[11.5px] font-medium text-danger">
                {overdueCount} overdue
              </span>
            )}
          </div>
        </div>
      )}

      {invoices.length > 0 && (
        <div className="mt-4 flex flex-col gap-2 sm:flex-row">
          <SearchBar value={query} onChange={setQuery} placeholder="Search reference, tenant, house" />
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
            <option value="partial">Partial</option>
            <option value="paid">Paid</option>
            <option value="overdue">Overdue</option>
            <option value="cancelled">Cancelled</option>
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
          {filtered.map((invoice) => (
            <li key={invoice.id}>
              <InvoiceCard
                invoice={invoice}
                canManage={canManage}
                canPay={canPay}
                onRefresh={load}
              />
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}

function InvoiceCard({ invoice, canManage, canPay, onRefresh }) {
  const [working, setWorking] = useState(false)

  const outstanding = Number(invoice.balance_due ?? invoice.total_amount ?? 0)
  const isPaid = invoice.status === 'paid'
  const isCancelled = invoice.status === 'cancelled'

  async function markPaid() {
    setWorking(true)
    try {
      await api.post(`/leasing/invoices/${invoice.id}/mark-paid/`)
      onRefresh()
    } catch (err) {
      alert(err?.response?.data?.detail || 'Could not mark as paid.')
    } finally {
      setWorking(false)
    }
  }

  async function applyLateFee() {
    setWorking(true)
    try {
      await api.post(`/leasing/invoices/${invoice.id}/apply-late-fee/`)
      onRefresh()
    } catch (err) {
      alert(err?.response?.data?.detail || 'Could not apply late fee.')
    } finally {
      setWorking(false)
    }
  }

  return (
    <article
      className={cn(
        'rounded-lg border border-edge bg-surface shadow-card p-4 shadow-float',
        'transition-all duration-200 ease-out-soft'
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <h3 className="truncate text-[15px] font-semibold tracking-[-0.01em] text-ink">
              {invoice.reference || `INV${invoice.id}`}
            </h3>
            <StatusBadge status={invoice.status} />
          </div>
          <p className="mt-1 truncate text-[12.5px] text-muted">
            {invoice.tenant_name || '—'}
            {invoice.house_number && ` · ${invoice.house_number}`}
            {invoice.room_name && ` · ${invoice.room_name}`}
          </p>
        </div>
      </div>

      <div className="mt-3 flex items-end justify-between gap-4">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.06em] text-faint">
            {isPaid ? 'Paid' : 'Balance due'}
          </p>
          <p
            className={cn(
              'mt-0.5 text-[20px] font-semibold tracking-[-0.02em]',
              isPaid ? 'text-success' : invoice.status === 'overdue' ? 'text-danger' : 'text-ink'
            )}
          >
            {KES.format(isPaid ? invoice.total_amount ?? 0 : outstanding)}
          </p>
          {!isPaid && invoice.total_amount && outstanding !== Number(invoice.total_amount) && (
            <p className="mt-0.5 text-[11.5px] text-faint">
              of {KES.format(invoice.total_amount)}
            </p>
          )}
        </div>
        <div className="text-right">
          <p className="text-[11px] font-semibold uppercase tracking-[0.06em] text-faint">
            {isPaid ? 'Paid on' : 'Due'}
          </p>
          <p className="mt-0.5 text-[13px] font-medium text-ink">
            {formatDate(isPaid ? invoice.paid_at : invoice.due_date)}
          </p>
        </div>
      </div>

      {!isCancelled && (
        <div className="mt-3 flex flex-wrap gap-2">
          {canPay && !isPaid && (
            <Link
              to="/payment"
              state={{ invoiceId: invoice.id }}
              className={cn(
                'inline-flex h-9 items-center rounded-xl bg-ink px-3.5 text-[12.5px] font-semibold text-white',
                'shadow-float transition-all duration-150 ease-out-soft',
                'hover:border-edge-hover hover:shadow-card-hover'
              )}
            >
              Pay now
            </Link>
          )}

          {canManage && !isPaid && invoice.status === 'pending' && (
            <button
              onClick={markPaid}
              disabled={working}
              className={cn(
                'inline-flex h-9 items-center rounded-lg border border-edge bg-surface shadow-card px-3.5 text-[12.5px] font-medium text-ink',
                'shadow-float transition-all duration-150 ease-out-soft',
                'hover:border-edge-hover hover:shadow-card-hover',
                'disabled:opacity-50 disabled:pointer-events-none'
              )}
            >
              Mark paid
            </button>
          )}

          {canManage && invoice.status === 'overdue' && (
            <button
              onClick={applyLateFee}
              disabled={working}
              className={cn(
                'inline-flex h-9 items-center rounded-xl border border-danger/25 bg-danger/5 px-3.5 text-[12.5px] font-medium text-danger',
                'transition-all duration-150 ease-out-soft',
                'hover:bg-danger/10',
                'disabled:opacity-50 disabled:pointer-events-none'
              )}
            >
              Apply late fee
            </button>
          )}
        </div>
      )}
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
          <div className="space-y-2">
            <div className="h-4 w-1/3 rounded-md bg-canvas" />
            <div className="h-3 w-2/3 rounded-md bg-canvas" />
            <div className="h-6 w-1/3 rounded-md bg-canvas" />
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
        {hasQuery ? 'No matches' : 'No invoices yet'}
      </h2>
      <p className="mx-auto mt-1 max-w-[280px] text-[13.5px] leading-relaxed text-muted">
        {hasQuery
          ? 'Try a different search or filter.'
          : 'Invoices will appear here once leases generate them.'}
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