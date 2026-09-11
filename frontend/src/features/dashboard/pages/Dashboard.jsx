import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '@/features/auth/context/AuthContext'
import api from '@/api/client'
import { cn } from '@/lib/cn'

const KES = new Intl.NumberFormat('en-KE', {
  style: 'currency',
  currency: 'KES',
  maximumFractionDigits: 0,
})

export default function Dashboard() {
  const { user } = useAuth()
  const role = user?.role

  if (role === 'TENANT' || role === 'SUB_TENANT') return <TenantDashboard user={user} />
  if (role === 'CARETAKER') return <CaretakerDashboard user={user} />
  if (role === 'ACCOUNTANT') return <AccountantDashboard user={user} />
  return <ManagerDashboard user={user} />
}

function ManagerDashboard({ user }) {
  const [stats, setStats] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelled = false

    async function load() {
      try {
        const [estates, houses, tenants, invoices, tickets] = await Promise.all([
          api.get('/properties/estates/').then((r) => r.data),
          api.get('/properties/houses/').then((r) => r.data),
          api.get('/auth/list/', { params: { role: 'TENANT' } }).then((r) => r.data),
          api.get('/leasing/invoices/', { params: { status: 'overdue' } }).then((r) => r.data),
          api.get('/maintenance/tickets/', { params: { status: 'pending' } }).then((r) => r.data),
        ])

        if (cancelled) return

        setStats({
          estates: count(estates),
          houses: count(houses),
          tenants: Array.isArray(tenants) ? tenants.length : count(tenants),
          overdue: count(invoices),
          openTickets: count(tickets),
        })
      } catch (err) {
        console.error(err)
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    load()
    return () => {
      cancelled = true
    }
  }, [])

  return (
    <div className="mx-auto w-full max-w-2xl px-4 pb-24 pt-6 sm:px-6">
      <Greeting user={user} subtitle="Here's how your portfolio is doing today." />

      <div className="mt-6 grid grid-cols-2 gap-3.5">
        <StatCard label="Estates" value={stats?.estates} loading={loading} href="/estates" icon={<EstateIcon />} />
        <StatCard label="Houses" value={stats?.houses} loading={loading} href="/houses" icon={<HouseIcon />} />
        <StatCard label="Tenants" value={stats?.tenants} loading={loading} href="/tenants" icon={<UserIcon />} />
        <StatCard
          label="Overdue"
          value={stats?.overdue}
          loading={loading}
          href="/arrears"
          icon={<AlertIcon />}
          tone={stats?.overdue > 0 ? 'danger' : 'default'}
        />
      </div>

      <SectionLabel className="mt-8">Quick actions</SectionLabel>
      <div className="grid grid-cols-2 gap-3.5">
        <ActionTile
          to="/maintenance"
          label="Open tickets"
          hint={`${stats?.openTickets ?? 0} pending`}
          icon={<WrenchIcon />}
        />
        <ActionTile
          to="/estates"
          label="Add estate"
          hint="Create a new property"
          icon={<PlusIcon />}
        />
      </div>
    </div>
  )
}

function TenantDashboard({ user }) {
  const [invoices, setInvoices] = useState([])
  const [tickets, setTickets] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelled = false

    async function load() {
      try {
        const [inv, tix] = await Promise.all([
          api.get('/leasing/invoices/', { params: { status: 'pending' } }).then((r) => r.data),
          api.get('/maintenance/tickets/').then((r) => r.data),
        ])

        if (cancelled) return

        setInvoices(toArray(inv))
        setTickets(toArray(tix))
      } catch (err) {
        console.error(err)
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    load()
    return () => {
      cancelled = true
    }
  }, [])

  const nextInvoice = invoices[0]
  const openTickets = tickets.filter((t) => t.status === 'pending' || t.status === 'in-progress').length

  return (
    <div className="mx-auto w-full max-w-2xl px-4 pb-24 pt-6 sm:px-6">
      <Greeting user={user} subtitle="Welcome back. Here's what needs your attention." />

      {nextInvoice && (
        <div className="mt-6 overflow-hidden rounded-xl bg-gradient-to-br from-ink to-ink/95 p-5 shadow-float-lg">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-white/50">
                Next payment
              </p>
              <p className="mt-1.5 text-[26px] font-semibold tracking-[-0.02em] text-white">
                {KES.format(nextInvoice.balance_due ?? nextInvoice.total_amount ?? 0)}
              </p>
              <p className="mt-0.5 text-[13px] text-white/60">
                Due {formatDate(nextInvoice.due_date)}
              </p>
            </div>
            <Link
              to="/payment"
              className="inline-flex h-10 shrink-0 items-center rounded-xl bg-white px-4 text-[14px] font-semibold text-ink shadow-sm transition-transform duration-150 hover:scale-[1.02]"
            >
              Pay now
            </Link>
          </div>
        </div>
      )}

      <div className="mt-5 grid grid-cols-2 gap-3.5">
        <StatCard label="Pending" value={invoices.length} loading={loading} href="/invoices" icon={<DocIcon />} />
        <StatCard label="Open tickets" value={openTickets} loading={loading} href="/maintenance" icon={<WrenchIcon />} />
      </div>

      <SectionLabel className="mt-8">Quick actions</SectionLabel>
      <div className="grid grid-cols-2 gap-3.5">
        <ActionTile to="/maintenance" label="Report issue" hint="Plumbing, electrical…" icon={<AlertIcon />} />
        <ActionTile to="/invoices" label="View invoices" hint="History & receipts" icon={<DocIcon />} />
      </div>
    </div>
  )
}

function CaretakerDashboard({ user }) {
  const [tickets, setTickets] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelled = false

    api
      .get('/maintenance/tickets/')
      .then((r) => {
        if (!cancelled) setTickets(toArray(r.data))
      })
      .catch(console.error)
      .finally(() => {
        if (!cancelled) setLoading(false)
      })

    return () => {
      cancelled = true
    }
  }, [])

  const assigned = tickets.filter((t) => t.status === 'in-progress').length
  const pending = tickets.filter((t) => t.status === 'pending').length

  return (
    <div className="mx-auto w-full max-w-2xl px-4 pb-24 pt-6 sm:px-6">
      <Greeting user={user} subtitle="Your assigned work for today." />

      <div className="mt-6 grid grid-cols-2 gap-3.5">
        <StatCard label="Assigned to you" value={assigned} loading={loading} href="/maintenance" icon={<WrenchIcon />} />
        <StatCard label="Unassigned" value={pending} loading={loading} href="/maintenance" icon={<AlertIcon />} />
      </div>

      <SectionLabel className="mt-8">Quick actions</SectionLabel>
      <div className="grid grid-cols-2 gap-3.5">
        <ActionTile to="/maintenance" label="My tickets" hint="All open work" icon={<WrenchIcon />} />
        <ActionTile to="/estates" label="Estates" hint="View assigned" icon={<EstateIcon />} />
      </div>
    </div>
  )
}

function AccountantDashboard({ user }) {
  const [stats, setStats] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelled = false

    async function load() {
      try {
        const [overdue, paid, transactions] = await Promise.all([
          api.get('/leasing/invoices/', { params: { status: 'overdue' } }).then((r) => r.data),
          api.get('/leasing/invoices/', { params: { status: 'paid' } }).then((r) => r.data),
          api.get('/payments/transactions/', { params: { status: 'success' } }).then((r) => r.data),
        ])

        if (cancelled) return

        setStats({
          overdueCount: count(overdue),
          paidCount: count(paid),
          transactionsCount: count(transactions),
        })
      } catch (err) {
        console.error(err)
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    load()
    return () => {
      cancelled = true
    }
  }, [])

  return (
    <div className="mx-auto w-full max-w-2xl px-4 pb-24 pt-6 sm:px-6">
      <Greeting user={user} subtitle="Financial overview across all estates." />

      <div className="mt-6 grid grid-cols-2 gap-3.5">
        <StatCard label="Overdue" value={stats?.overdueCount} loading={loading} href="/arrears" tone="danger" icon={<AlertIcon />} />
        <StatCard label="Paid" value={stats?.paidCount} loading={loading} href="/invoices" icon={<CheckIcon />} />
        <StatCard label="M-Pesa" value={stats?.transactionsCount} loading={loading} href="/payment" icon={<CardIcon />} />
        <StatCard label="Reconcile" value="—" loading={false} href="/arrears" icon={<ChartIcon />} />
      </div>
    </div>
  )
}

function Greeting({ user, subtitle }) {
  const hour = new Date().getHours()
  const greeting = hour < 12 ? 'Good morning' : hour < 18 ? 'Good afternoon' : 'Good evening'
  const firstName = user?.first_name || user?.username || 'there'

  return (
    <header>
      <p className="text-[13px] font-medium text-muted">{greeting},</p>
      <h1 className="mt-0.5 text-[26px] font-semibold tracking-[-0.02em] text-ink">
        {firstName}
      </h1>
      {subtitle && (
        <p className="mt-1.5 max-w-md text-[13.5px] leading-relaxed text-muted">{subtitle}</p>
      )}
    </header>
  )
}

function StatCard({ label, value, loading, href, tone = 'default', icon }) {
  const content = (
    <>
      <div className="flex items-center justify-between">
        <p className="text-[11.5px] font-semibold uppercase tracking-[0.06em] text-faint">
          {label}
        </p>
        {icon && (
          <span
            className={cn(
              'grid size-8 place-items-center rounded-[10px]',
              tone === 'danger' ? 'bg-danger/10 text-danger' : 'bg-accent-soft text-accent-deep'
            )}
          >
            {icon}
          </span>
        )}
      </div>
      <p
        className={cn(
          'mt-3 text-[28px] font-semibold tracking-[-0.03em]',
          tone === 'danger' ? 'text-danger' : 'text-ink'
        )}
      >
        {loading ? (
          <span className="inline-block h-7 w-10 animate-pulse rounded-md bg-canvas align-middle" />
        ) : (
          value ?? 0
        )}
      </p>
    </>
  )

  const base =
    'block rounded-lg border border-edge bg-surface shadow-card p-4 shadow-float transition-all duration-200 ease-out-soft'

  if (!href) {
    return <div className={base}>{content}</div>
  }

  return (
    <Link
      to={href}
      className={cn(
        base,
        'hover:border-edge-hover hover:shadow-card-hover',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/40'
      )}
    >
      {content}
    </Link>
  )
}

function ActionTile({ to, label, hint, icon }) {
  return (
    <Link
      to={to}
      className={cn(
        'group block rounded-lg border border-edge bg-surface shadow-card p-4 shadow-float',
        'transition-all duration-200 ease-out-soft',
        'hover:border-edge-hover hover:shadow-card-hover',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/40'
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <span className="grid size-9 place-items-center rounded-[10px] bg-accent-soft text-accent-deep">
          {icon}
        </span>
        <svg
          viewBox="0 0 24 24"
          className="mt-1 size-4 shrink-0 text-faint transition-transform duration-200 group-hover:translate-x-0.5 group-hover:text-accent"
          fill="none"
          aria-hidden="true"
        >
          <path d="M9 18l6-6-6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </div>
      <p className="mt-3 text-[14px] font-semibold text-ink">{label}</p>
      {hint && <p className="mt-0.5 text-[12.5px] text-muted">{hint}</p>}
    </Link>
  )
}

function SectionLabel({ children, className }) {
  return (
    <h2 className={cn('mb-3.5 text-[11px] font-semibold uppercase tracking-[0.08em] text-faint', className)}>
      {children}
    </h2>
  )
}

function count(data) {
  if (Array.isArray(data)) return data.length
  if (typeof data?.count === 'number') return data.count
  return 0
}

function toArray(data) {
  if (Array.isArray(data)) return data
  if (Array.isArray(data?.results)) return data.results
  return []
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

const iconProps = {
  viewBox: '0 0 24 24',
  className: 'size-4',
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 1.9,
  strokeLinecap: 'round',
  strokeLinejoin: 'round',
}

function EstateIcon() {
  return (
    <svg {...iconProps} aria-hidden="true">
      <path d="M3 21h18M5 21V7l7-4 7 4v14M9 21v-6h6v6" />
    </svg>
  )
}

function HouseIcon() {
  return (
    <svg {...iconProps} aria-hidden="true">
      <path d="M3 10l9-7 9 7v10a2 2 0 0 1-2 2h-4v-6h-6v6H5a2 2 0 0 1-2-2V10z" />
    </svg>
  )
}

function UserIcon() {
  return (
    <svg {...iconProps} aria-hidden="true">
      <path d="M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8zM4 21a8 8 0 0 1 16 0" />
    </svg>
  )
}

function AlertIcon() {
  return (
    <svg {...iconProps} aria-hidden="true">
      <path d="M12 8v5M12 17h.01M10.3 3.3l-8 14A2 2 0 0 0 4 20h16a2 2 0 0 0 1.7-2.7l-8-14a2 2 0 0 0-3.4 0z" />
    </svg>
  )
}

function WrenchIcon() {
  return (
    <svg {...iconProps} aria-hidden="true">
      <path d="M14.7 6.3a4 4 0 1 0 3 3L21 6l-3-3-3.3 3.3zM10 13l-7 7 1 1 7-7" />
    </svg>
  )
}

function PlusIcon() {
  return (
    <svg {...iconProps} aria-hidden="true">
      <path d="M12 5v14M5 12h14" />
    </svg>
  )
}

function DocIcon() {
  return (
    <svg {...iconProps} aria-hidden="true">
      <path d="M6 3h9l5 5v13H6zM14 3v6h6M9 13h6M9 17h6" />
    </svg>
  )
}

function CheckIcon() {
  return (
    <svg {...iconProps} aria-hidden="true">
      <path d="M20 6L9 17l-5-5" />
    </svg>
  )
}

function CardIcon() {
  return (
    <svg {...iconProps} aria-hidden="true">
      <path d="M2 8h20v10a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V8zM2 8l3-4h14l3 4M6 14h2" />
    </svg>
  )
}

function ChartIcon() {
  return (
    <svg {...iconProps} aria-hidden="true">
      <path d="M4 20V10M10 20V4M16 20v-7M22 20H2" />
    </svg>
  )
}