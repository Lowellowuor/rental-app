import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import api from '@/api/client'
import { cn } from '@/lib/cn'

const ROLE_LABEL = {
  TENANT: 'Tenant',
  SUB_TENANT: 'Sub-tenant',
}

const KES = new Intl.NumberFormat('en-KE', {
  style: 'currency',
  currency: 'KES',
  maximumFractionDigits: 0,
})

export default function TenantDetailPage() {
  const { id } = useParams()
  const [tenant, setTenant] = useState(null)
  const [invoices, setInvoices] = useState([])
  const [tickets, setTickets] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    let cancelled = false

    async function load() {
      setLoading(true)
      setError('')
      try {
        const [u, inv, tix] = await Promise.all([
          api.get('/auth/list/').then((r) => {
            const list = Array.isArray(r.data) ? r.data : r.data.results ?? []
            return list.find((x) => String(x.id) === String(id)) || null
          }),
          api.get('/leasing/invoices/').then((r) => r.data),
          api.get('/maintenance/tickets/').then((r) => r.data),
        ])

        if (cancelled) return
        setTenant(u)
        setInvoices((Array.isArray(inv) ? inv : inv.results ?? []).filter((i) => i.tenant_name === u?.username))
        setTickets((Array.isArray(tix) ? tix : tix.results ?? []).filter((t) => t.tenant_name === u?.username))
      } catch {
        if (!cancelled) setError('Could not load tenant.')
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    load()
    return () => { cancelled = true }
  }, [id])

  const outstanding = invoices
    .filter((i) => i.status !== 'paid' && i.status !== 'cancelled')
    .reduce((sum, i) => sum + Number(i.balance_due || 0), 0)

  return (
    <div className="mx-auto w-full max-w-2xl px-4 pb-24 pt-6 sm:px-6">
      <Link
        to="/tenants"
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
      ) : error || !tenant ? (
        <ErrorBlock message={error || 'Tenant not found.'} />
      ) : (
        <>
          <section className="mt-5 rounded-lg border border-edge bg-surface shadow-card p-5 shadow-float">
            <div className="flex items-center gap-4">
              <span className="grid size-16 shrink-0 place-items-center rounded-full bg-accent-soft text-[22px] font-semibold text-accent-deep">
                {(tenant.first_name?.[0] || tenant.username?.[0] || '?').toUpperCase()}
              </span>
              <div className="min-w-0 flex-1">
                <h1 className="truncate text-[20px] font-semibold tracking-[-0.01em] text-ink">
                  {[tenant.first_name, tenant.last_name].filter(Boolean).join(' ') || tenant.username}
                </h1>
                <p className="mt-0.5 truncate text-[13px] text-muted">@{tenant.username}</p>
                <div className="mt-2 flex flex-wrap items-center gap-1.5">
                  <span className="rounded-pill bg-accent-soft px-2 py-0.5 text-[10.5px] font-medium uppercase tracking-[0.06em] text-accent-deep">
                    {ROLE_LABEL[tenant.role] || tenant.role}
                  </span>
                  {tenant.is_verified && (
                    <span className="inline-flex items-center gap-1 rounded-pill bg-success/10 px-2 py-0.5 text-[10.5px] font-medium uppercase tracking-[0.06em] text-success">
                      <svg viewBox="0 0 20 20" className="size-3" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                        <path d="M5 10l3 3 7-7" />
                      </svg>
                      Verified
                    </span>
                  )}
                </div>
              </div>
            </div>
          </section>

          <div className="mt-4 grid grid-cols-3 gap-3">
            <SmallStat label="Invoices" value={invoices.length} />
            <SmallStat label="Outstanding" value={KES.format(outstanding)} tone={outstanding > 0 ? 'danger' : 'default'} compact />
            <SmallStat label="Tickets" value={tickets.filter((t) => t.status !== 'resolved' && t.status !== 'cancelled').length} />
          </div>

          <section className="mt-4 rounded-lg border border-edge bg-surface shadow-card p-5 shadow-float">
            <h3 className="text-[11px] font-semibold uppercase tracking-[0.08em] text-faint">
              Contact
            </h3>
            <dl className="mt-3 space-y-3">
              <Row label="Phone" value={tenant.phone_number || '—'} />
              <Row label="Email" value={tenant.email || '—'} />
              <Row label="National ID" value={tenant.national_id || '—'} />
              <Row label="Emergency contact" value={tenant.emergency_contact_name || '—'} />
              <Row label="Emergency phone" value={tenant.emergency_contact_phone || '—'} />
            </dl>
          </section>

          <SectionLabel className="mt-8">Recent invoices</SectionLabel>
          {invoices.length === 0 ? (
            <EmptyInline message="No invoices for this tenant yet." />
          ) : (
            <ul className="space-y-2.5">
              {invoices.slice(0, 5).map((inv) => (
                <li key={inv.id} className="flex items-center justify-between gap-3 rounded-lg border border-edge bg-surface shadow-card p-3.5 shadow-float">
                  <div className="min-w-0">
                    <p className="truncate text-[13.5px] font-medium text-ink">{inv.reference || `INV${inv.id}`}</p>
                    <p className="mt-0.5 text-[11.5px] text-faint">Due {formatDate(inv.due_date)}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-[13.5px] font-semibold text-ink">{KES.format(inv.balance_due ?? inv.total_amount ?? 0)}</p>
                    <span
                      className={cn(
                        'mt-0.5 inline-block rounded-pill px-2 py-0.5 text-[10px] font-medium uppercase tracking-[0.06em]',
                        inv.status === 'paid'
                          ? 'bg-success/10 text-success'
                          : inv.status === 'overdue'
                            ? 'bg-danger/10 text-danger'
                            : 'bg-accent-soft text-accent-deep'
                      )}
                    >
                      {inv.status}
                    </span>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </>
      )}
    </div>
  )
}

function SmallStat({ label, value, tone = 'default', compact }) {
  return (
    <div className="rounded-lg border border-edge bg-surface shadow-card p-4 shadow-float">
      <p className="text-[11px] font-semibold uppercase tracking-[0.06em] text-faint">{label}</p>
      <p
        className={cn(
          'mt-2 font-semibold tracking-[-0.02em]',
          compact ? 'text-[16px]' : 'text-[22px]',
          tone === 'danger' ? 'text-danger' : 'text-ink'
        )}
      >
        {value}
      </p>
    </div>
  )
}

function Row({ label, value }) {
  return (
    <div className="flex items-start justify-between gap-4 border-b border-edge/60 pb-3 last:border-b-0 last:pb-0">
      <dt className="text-[12.5px] text-muted">{label}</dt>
      <dd className="text-right text-[13.5px] font-medium text-ink">{value}</dd>
    </div>
  )
}

function SectionLabel({ children, className }) {
  return (
    <h2 className={cn('mb-3 text-[11px] font-semibold uppercase tracking-[0.08em] text-faint', className)}>
      {children}
    </h2>
  )
}

function EmptyInline({ message }) {
  return (
    <div className="rounded-xl border border-dashed border-edge bg-surface px-4 py-6 text-center shadow-float">
      <p className="text-[13px] text-muted">{message}</p>
    </div>
  )
}

function SkeletonDetail() {
  return (
    <div className="mt-5 animate-pulse space-y-4">
      <div className="h-32 rounded-lg border border-edge bg-surface shadow-card" />
      <div className="grid grid-cols-3 gap-3">
        {[0, 1, 2].map((i) => (
          <div key={i} className="h-20 rounded-lg border border-edge bg-surface shadow-card" />
        ))}
      </div>
      <div className="h-48 rounded-lg border border-edge bg-surface shadow-card" />
    </div>
  )
}

function ErrorBlock({ message }) {
  return (
    <div className="mt-5 rounded-xl border border-danger/25 bg-danger/5 p-6 text-center shadow-float">
      <p className="text-[14px] font-medium text-ink">{message}</p>
      <Link
        to="/tenants"
        className="mt-4 inline-flex h-10 items-center rounded-xl bg-ink px-4 text-[14px] font-semibold text-white hover:bg-ink/90"
      >
        Back to tenants
      </Link>
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