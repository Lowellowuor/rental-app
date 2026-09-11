import { useEffect, useMemo, useState } from 'react'
import { useAuth } from '@/features/auth/context/AuthContext'
import api from '@/api/client'
import { cn } from '@/lib/cn'

const KES = new Intl.NumberFormat('en-KE', {
  style: 'currency',
  currency: 'KES',
  maximumFractionDigits: 0,
})

const STATUS_STYLE = {
  success: 'bg-success/10 text-success',
  processing: 'bg-accent-soft text-accent-deep',
  pending: 'bg-accent-soft text-accent-deep',
  failed: 'bg-danger/10 text-danger',
  cancelled: 'bg-canvas text-muted',
}

export default function PaymentPage() {
  const { user } = useAuth()
  const [invoices, setInvoices] = useState([])
  const [transactions, setTransactions] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [selected, setSelected] = useState(null)
  const [phone, setPhone] = useState(user?.phone_number || '')
  const [submitting, setSubmitting] = useState(false)
  const [activeTransaction, setActiveTransaction] = useState(null)

  async function load() {
    setLoading(true)
    setError('')
    try {
      const [inv, tx] = await Promise.all([
        api.get('/leasing/invoices/', { params: { status: 'pending' } }).then((r) => r.data),
        api.get('/payments/transactions/').then((r) => r.data),
      ])
      const invList = Array.isArray(inv) ? inv : inv.results ?? []
      setInvoices(invList)
      setTransactions(Array.isArray(tx) ? tx : tx.results ?? [])
      if (invList.length === 1) setSelected(invList[0])
    } catch {
      setError('Could not load payment data. Check your connection and try again.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
  }, [])

  const outstanding = useMemo(
    () => invoices.reduce((sum, i) => sum + Number(i.balance_due || 0), 0),
    [invoices]
  )

  async function handlePay(e) {
    e.preventDefault()
    if (!selected) return

    setSubmitting(true)
    setError('')

    try {
      const { data } = await api.post('/payments/transactions/initiate/', {
        invoice_id: selected.id,
        phone_number: phone,
      })
      setActiveTransaction(data.transaction)
      setSelected(null)
      load()
    } catch (err) {
      setError(err?.response?.data?.detail || 'Could not initiate payment.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="mx-auto w-full max-w-2xl px-4 pb-24 pt-6 sm:px-6">
      <PageHeader title="Pay rent" subtitle="Pay via M-Pesa STK push" />

      {loading ? (
        <SkeletonBlock />
      ) : error && !activeTransaction ? (
        <ErrorState message={error} onRetry={load} />
      ) : (
        <>
          {activeTransaction && (
            <ActiveTransaction
              transaction={activeTransaction}
              onRefresh={load}
              onDismiss={() => setActiveTransaction(null)}
            />
          )}

          {!activeTransaction && outstanding > 0 && (
            <div className="mt-5 rounded-lg border border-edge bg-surface shadow-card p-5 shadow-float">
              <p className="text-[11px] font-semibold uppercase tracking-[0.06em] text-faint">
                Total outstanding
              </p>
              <p className="mt-1 text-[28px] font-semibold tracking-[-0.02em] text-ink">
                {KES.format(outstanding)}
              </p>
              <p className="mt-1 text-[13px] text-muted">
                {invoices.length} {invoices.length === 1 ? 'invoice' : 'invoices'} pending
              </p>
            </div>
          )}

          {!activeTransaction && invoices.length === 0 ? (
            <EmptyState />
          ) : !activeTransaction ? (
            <form onSubmit={handlePay} className="mt-6 space-y-5">
              <div>
                <label className="text-[13px] font-semibold uppercase tracking-[0.06em] text-faint">
                  Select invoice
                </label>
                <div className="mt-2 space-y-2.5">
                  {invoices.map((invoice) => (
                    <InvoiceOption
                      key={invoice.id}
                      invoice={invoice}
                      selected={selected?.id === invoice.id}
                      onSelect={() => setSelected(invoice)}
                    />
                  ))}
                </div>
              </div>

              <div>
                <label htmlFor="phone" className="text-[13px] font-semibold uppercase tracking-[0.06em] text-faint">
                  M-Pesa phone number
                </label>
                <input
                  id="phone"
                  type="tel"
                  inputMode="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="0712 345 678"
                  className={cn(
                    'mt-2 h-12 w-full rounded-lg border border-edge bg-surface shadow-card px-4 text-[16px] text-ink',
                    'placeholder:text-faint transition-shadow duration-150',
                    'focus:border-accent focus:outline-none focus:shadow-focus'
                  )}
                />
                <p className="mt-1.5 text-[12px] text-muted">
                  You will receive an STK push to enter your PIN.
                </p>
              </div>

              {error && (
                <div role="alert" className="flex gap-2.5 rounded-xl border border-danger/25 bg-danger/5 p-3.5">
                  <svg viewBox="0 0 20 20" className="mt-px size-[18px] shrink-0 text-danger" aria-hidden="true">
                    <path d="M10 6.5v4.5M10 14h.01M10 2.5l7.5 13h-15L10 2.5z" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                  <p className="text-[13.5px] leading-snug text-ink">{error}</p>
                </div>
              )}

              <button
                type="submit"
                disabled={!selected || submitting || !phone.trim()}
                className={cn(
                  'inline-flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-ink text-[15px] font-semibold text-white',
                  'shadow-float transition-all duration-150 ease-out-soft',
                  'hover:border-edge-hover hover:shadow-card-hover',
                  'disabled:opacity-40 disabled:pointer-events-none'
                )}
              >
                {submitting && (
                  <svg className="size-4 animate-spin" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                    <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" opacity="0.2" />
                    <path d="M22 12a10 10 0 0 1-10 10" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
                  </svg>
                )}
                {submitting
                  ? 'Sending STK push…'
                  : selected
                    ? `Pay ${KES.format(selected.balance_due)}`
                    : 'Select an invoice'}
              </button>
            </form>
          ) : null}

          {!activeTransaction && transactions.length > 0 && (
            <>
              <SectionLabel className="mt-8">Recent transactions</SectionLabel>
              <ul className="space-y-2.5">
                {transactions.slice(0, 8).map((tx) => (
                  <TransactionRow key={tx.id} tx={tx} />
                ))}
              </ul>
            </>
          )}
        </>
      )}
    </div>
  )
}

function ActiveTransaction({ transaction, onRefresh, onDismiss }) {
  const [status, setStatus] = useState(transaction.status)
  const [receipt, setReceipt] = useState(transaction.mpesa_receipt_number)
  const [description, setDescription] = useState(transaction.result_description)

  useEffect(() => {
    if (status === 'success' || status === 'failed' || status === 'cancelled') return

    let cancelled = false
    const id = setInterval(async () => {
      try {
        const { data } = await api.get(`/payments/transactions/${transaction.id}/status/`)
        if (cancelled) return
        setStatus(data.status)
        setReceipt(data.mpesa_receipt_number)
        setDescription(data.result_description)
        if (data.status === 'success') {
          clearInterval(id)
          onRefresh?.()
        }
        if (data.status === 'failed' || data.status === 'cancelled') {
          clearInterval(id)
        }
      } catch {
        // keep polling on transient failure
      }
    }, 3000)

    return () => {
      cancelled = true
      clearInterval(id)
    }
  }, [transaction.id, status, onRefresh])

  const isSuccess = status === 'success'
  const isFailed = status === 'failed' || status === 'cancelled'

  return (
    <div
      className={cn(
        'mt-5 rounded-xl border p-5 shadow-float',
        isSuccess
          ? 'border-success/25 bg-success/5'
          : isFailed
            ? 'border-danger/25 bg-danger/5'
            : 'border-accent/25 bg-accent-soft/60'
      )}
    >
      <div className="flex items-start gap-3.5">
        <span
          className={cn(
            'grid size-11 shrink-0 place-items-center rounded-full',
            isSuccess
              ? 'bg-success/15 text-success'
              : isFailed
                ? 'bg-danger/15 text-danger'
                : 'bg-accent/15 text-accent-deep'
          )}
        >
          {isSuccess ? (
            <svg viewBox="0 0 24 24" className="size-5" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M20 6L9 17l-5-5" />
            </svg>
          ) : isFailed ? (
            <svg viewBox="0 0 24 24" className="size-5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M6 6l12 12M18 6L6 18" />
            </svg>
          ) : (
            <svg className="size-5 animate-spin" viewBox="0 0 24 24" fill="none" aria-hidden="true">
              <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" opacity="0.2" />
              <path d="M22 12a10 10 0 0 1-10 10" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
            </svg>
          )}
        </span>

        <div className="min-w-0 flex-1">
          <p className="text-[15px] font-semibold tracking-[-0.01em] text-ink">
            {isSuccess
              ? 'Payment received'
              : isFailed
                ? 'Payment failed'
                : 'Check your phone'}
          </p>
          <p className="mt-0.5 text-[13px] leading-relaxed text-muted">
            {isSuccess
              ? `Receipt ${receipt || '—'}`
              : isFailed
                ? description || 'The transaction was not completed.'
                : 'Enter your M-Pesa PIN to complete the payment.'}
          </p>
          <p className="mt-2 text-[15px] font-semibold tracking-[-0.01em] text-ink">
            {KES.format(transaction.amount || 0)}
          </p>
        </div>
      </div>

      {(isSuccess || isFailed) && (
        <button
          type="button"
          onClick={onDismiss}
          className={cn(
            'mt-4 inline-flex h-10 w-full items-center justify-center rounded-lg border border-edge bg-surface shadow-card text-[14px] font-semibold text-ink',
            'shadow-float transition-all duration-150 ease-out-soft',
            'hover:border-edge-hover hover:shadow-card-hover'
          )}
        >
          {isSuccess ? 'Done' : 'Try again'}
        </button>
      )}
    </div>
  )
}

function InvoiceOption({ invoice, selected, onSelect }) {
  return (
    <button
      type="button"
      onClick={onSelect}
      className={cn(
        'w-full rounded-xl border bg-surface p-4 text-left shadow-float',
        'transition-all duration-150 ease-out-soft',
        selected
          ? 'border-accent ring-2 ring-accent/20'
          : 'border-edge hover:border-edge-hover hover:shadow-card-hover'
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="truncate text-[14px] font-semibold text-ink">
            {invoice.reference || `INV${invoice.id}`}
          </p>
          <p className="mt-0.5 truncate text-[12.5px] text-muted">
            {invoice.house_number}
            {invoice.room_name && ` · ${invoice.room_name}`}
          </p>
          <p className="mt-1 text-[11.5px] text-faint">Due {formatDate(invoice.due_date)}</p>
        </div>
        <div className="text-right">
          <p className="text-[16px] font-semibold tracking-[-0.01em] text-ink">
            {KES.format(invoice.balance_due ?? 0)}
          </p>
        </div>
      </div>
    </button>
  )
}

function TransactionRow({ tx }) {
  const isSuccess = tx.status === 'success'
  const isFailed = tx.status === 'failed' || tx.status === 'cancelled'

  return (
    <li className="flex items-center justify-between gap-3 rounded-lg border border-edge bg-surface shadow-card p-3.5 shadow-float">
      <div className="min-w-0">
        <p className="truncate text-[13.5px] font-medium text-ink">
          {tx.mpesa_receipt_number || tx.checkout_request_id?.slice(0, 16) || `#${tx.id}`}
        </p>
        <p className="mt-0.5 text-[11.5px] text-faint">{formatDate(tx.created_at)}</p>
      </div>
      <div className="text-right">
        <p className="text-[13.5px] font-semibold text-ink">{KES.format(tx.amount || 0)}</p>
        <span
          className={cn(
            'mt-0.5 inline-block rounded-pill px-2 py-0.5 text-[10px] font-medium uppercase tracking-[0.06em]',
            STATUS_STYLE[tx.status] || 'bg-canvas text-muted'
          )}
        >
          {tx.status}
        </span>
      </div>
    </li>
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

function SectionLabel({ children, className }) {
  return (
    <h2 className={cn('mb-3 text-[11px] font-semibold uppercase tracking-[0.08em] text-faint', className)}>
      {children}
    </h2>
  )
}

function SkeletonBlock() {
  return (
    <div className="mt-5 animate-pulse space-y-3">
      <div className="h-28 rounded-lg border border-edge bg-surface shadow-card" />
      <div className="h-20 rounded-lg border border-edge bg-surface shadow-card" />
      <div className="h-20 rounded-lg border border-edge bg-surface shadow-card" />
    </div>
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

function EmptyState() {
  return (
    <div className="mt-5 rounded-xl border border-dashed border-edge bg-surface px-6 py-12 text-center shadow-float">
      <div className="mx-auto grid size-14 place-items-center rounded-full bg-success/10 text-success">
        <svg viewBox="0 0 24 24" className="size-7" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <path d="M20 6L9 17l-5-5" />
        </svg>
      </div>
      <h2 className="mt-4 text-[16px] font-semibold text-ink">You're all caught up</h2>
      <p className="mx-auto mt-1 max-w-[280px] text-[13.5px] leading-relaxed text-muted">
        You have no pending invoices to pay right now.
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