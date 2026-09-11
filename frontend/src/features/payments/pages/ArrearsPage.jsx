import { useEffect, useMemo, useState } from 'react'
import api from '@/api/client'
import { cn } from '@/lib/cn'

const KES = new Intl.NumberFormat('en-KE', {
  style: 'currency',
  currency: 'KES',
  maximumFractionDigits: 0,
})

export default function ArrearsPage() {
  const [invoices, setInvoices] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [query, setQuery] = useState('')
  const [agingFilter, setAgingFilter] = useState('all')

  async function load() {
    setLoading(true)
    setError('')
    try {
      const { data } = await api.get('/leasing/invoices/', { params: { status: 'overdue' } })
      const list = Array.isArray(data) ? data : data.results ?? []
      setInvoices(list)
    } catch {
      setError('Could not load arrears. Check your connection and try again.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
  }, [])

  const filtered = useMemo(() => {
    let list = invoices
    if (agingFilter !== 'all') {
      const now = Date.now()
      list = list.filter((i) => {
        const days = Math.floor((now - new Date(i.due_date).getTime()) / (1000 * 60 * 60 * 24))
        if (agingFilter === '0-30') return days >= 0 && days <= 30
        if (agingFilter === '31-60') return days > 30 && days <= 60
        if (agingFilter === '60+') return days > 60
        return true
      })
    }
    if (query.trim()) {
      const q = query.toLowerCase()
      list = list.filter(
        (i) =>
          i.tenant_name?.toLowerCase().includes(q) ||
          i.reference?.toLowerCase().includes(q) ||
          i.house_number?.toLowerCase().includes(q)
      )
    }
    return list.sort((a, b) => new Date(a.due_date) - new Date(b.due_date))
  }, [invoices, query, agingFilter])

  const totalOwed = invoices.reduce((sum, i) => sum + Number(i.balance_due || 0), 0)
  const avgDays = invoices.length
    ? Math.round(
        invoices.reduce(
          (sum, i) => sum + Math.max(0, Math.floor((Date.now() - new Date(i.due_date).getTime()) / 86400000)),
          0
        ) / invoices.length
      )
    : 0

  return (
    <div className="mx-auto w-full max-w-2xl px-4 pb-24 pt-6 sm:px-6">
      <PageHeader title="Arrears" subtitle="Overdue invoices across estates" />

      {!loading && invoices.length > 0 && (
        <>
          <div className="mt-5 grid grid-cols-2 gap-3.5">
            <StatBlock label="Total owed" value={KES.format(totalOwed)} tone="danger" />
            <StatBlock label="Avg days late" value={`${avgDays}d`} />
          </div>
          <div className="mt-3 grid grid-cols-2 gap-3.5">
            <StatBlock label="Invoices" value={invoices.length} />
            <StatBlock label="Tenants" value={new Set(invoices.map((i) => i.tenant_name).filter(Boolean)).size} />
          </div>
        </>
      )}

      {invoices.length > 0 && (
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
              placeholder="Search tenant, reference"
              className={cn(
                'h-11 w-full rounded-lg border border-edge bg-surface shadow-card pl-10 pr-4 text-[15px] text-ink',
                'placeholder:text-faint transition-shadow duration-150',
                'focus:border-accent focus:outline-none focus:shadow-focus'
              )}
            />
          </div>
          <select
            value={agingFilter}
            onChange={(e) => setAgingFilter(e.target.value)}
            className={cn(
              'h-11 rounded-lg border border-edge bg-surface shadow-card px-3.5 text-[14px] text-ink',
              'transition-shadow duration-150 focus:border-accent focus:outline-none focus:shadow-focus',
              'sm:w-40'
            )}
          >
            <option value="all">All ages</option>
            <option value="0-30">0–30 days</option>
            <option value="31-60">31–60 days</option>
            <option value="60+">60+ days</option>
          </select>
        </div>
      )}

      {loading ? (
        <SkeletonList />
      ) : error ? (
        <ErrorState message={error} onRetry={load} />
      ) : filtered.length === 0 ? (
        <EmptyState hasQuery={!!query || agingFilter !== 'all'} />
      ) : (
        <ul className="mt-4 space-y-3.5">
          {filtered.map((invoice) => (
            <ArrearRow key={invoice.id} invoice={invoice} />
          ))}
        </ul>
      )}
    </div>
  )
}

function ArrearRow({ invoice }) {
  const days = Math.max(0, Math.floor((Date.now() - new Date(invoice.due_date).getTime()) / 86400000))
  const severity = days > 60 ? 'high' : days > 30 ? 'medium' : 'low'

  const severityStyle = {
    high: 'bg-danger/10 text-danger',
    medium: 'bg-accent-soft text-accent-deep',
    low: 'bg-canvas text-muted',
  }[severity]

  return (
    <li className="rounded-lg border border-edge bg-surface shadow-card p-4 shadow-float transition-all duration-200 ease-out-soft">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <p className="truncate text-[14.5px] font-semibold text-ink">
              {invoice.tenant_name || '—'}
            </p>
            <span
              className={cn(
                'shrink-0 rounded-pill px-2 py-0.5 text-[10.5px] font-medium',
                severityStyle
              )}
            >
              {days}d late
            </span>
          </div>
          <p className="mt-0.5 truncate text-[12.5px] text-muted">
            {invoice.reference || `INV${invoice.id}`}
            {invoice.house_number && ` · ${invoice.house_number}`}
          </p>
        </div>
        <div className="text-right">
          <p className="text-[17px] font-semibold tracking-[-0.01em] text-danger">
            {KES.format(invoice.balance_due ?? 0)}
          </p>
          <p className="mt-0.5 text-[11.5px] text-faint">Due {formatDate(invoice.due_date)}</p>
        </div>
      </div>
    </li>
  )
}

function StatBlock({ label, value, tone = 'default' }) {
  return (
    <div className="rounded-lg border border-edge bg-surface shadow-card p-4 shadow-float">
      <p className="text-[11px] font-semibold uppercase tracking-[0.06em] text-faint">{label}</p>
      <p
        className={cn(
          'mt-2 text-[20px] font-semibold tracking-[-0.02em]',
          tone === 'danger' ? 'text-danger' : 'text-ink'
        )}
      >
        {value}
      </p>
    </div>
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

function EmptyState({ hasQuery }) {
  return (
    <div className="mt-4 rounded-xl border border-dashed border-edge bg-surface px-6 py-12 text-center shadow-float">
      <div className="mx-auto grid size-14 place-items-center rounded-full bg-success/10 text-success">
        <svg viewBox="0 0 24 24" className="size-7" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <path d="M20 6L9 17l-5-5" />
        </svg>
      </div>
      <h2 className="mt-4 text-[16px] font-semibold text-ink">
        {hasQuery ? 'No matches' : 'No arrears'}
      </h2>
      <p className="mx-auto mt-1 max-w-[280px] text-[13.5px] leading-relaxed text-muted">
        {hasQuery
          ? 'Try a different search or filter.'
          : 'Every invoice is paid up. Nothing to chase.'}
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