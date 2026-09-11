import { useEffect, useMemo, useState } from 'react'
import api from '@/api/client'
import { cn } from '@/lib/cn'

const EMPTY = { name: '', location: '', totalUnits: '', houseCount: '', manager: '' }

export default function AddEstateModal({ isOpen, onClose, onSuccess }) {
  const [values, setValues] = useState(EMPTY)
  const [errors, setErrors] = useState({})
  const [formError, setFormError] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [managers, setManagers] = useState([])
  const [managersLoading, setManagersLoading] = useState(false)
  const [created, setCreated] = useState(null)

  useEffect(() => {
    if (!isOpen) return

    setValues(EMPTY)
    setErrors({})
    setFormError('')
    setSubmitting(false)
    setCreated(null)
    setManagersLoading(true)

    api
      .get('/auth/managers/')
      .then((r) => setManagers(Array.isArray(r.data) ? r.data : r.data.results ?? []))
      .catch(() => setManagers([]))
      .finally(() => setManagersLoading(false))
  }, [isOpen])

  if (!isOpen) return null

  const totalUnits = Number(values.totalUnits) || 0
  const houseCount = Number(values.houseCount) || 0
  const remaining = Math.max(totalUnits - houseCount, 0)
  const overAllocated = houseCount > totalUnits

  const set = (key, v) => {
    setValues((p) => ({ ...p, [key]: v }))
    if (errors[key]) setErrors((p) => ({ ...p, [key]: undefined }))
    if (formError) setFormError('')
  }

  function validate(v) {
    const e = {}

    if (!v.name.trim()) e.name = 'Estate name is required.'
    else if (v.name.trim().length < 3) e.name = 'Use at least 3 characters.'

    if (!v.location.trim()) e.location = 'Location is required.'

    const units = Number(v.totalUnits)
    if (!v.totalUnits) e.totalUnits = 'Total units is required.'
    else if (!Number.isInteger(units) || units < 1) e.totalUnits = 'Enter a whole number of at least 1.'
    else if (units > 10000) e.totalUnits = 'That looks too large — max 10,000.'

    if (v.houseCount) {
      const h = Number(v.houseCount)
      if (!Number.isInteger(h) || h < 0) e.houseCount = 'Enter a whole number.'
      else if (h > units) e.houseCount = `Cannot exceed total units (${units}).`
    }

    return e
  }

  const isValid = useMemo(() => Object.keys(validate(values)).length === 0, [values])

  async function handleSubmit(e) {
    e.preventDefault()

    const found = validate(values)
    setErrors(found)
    if (Object.keys(found).length) return

    setSubmitting(true)
    setFormError('')

    try {
      const payload = {
        name: values.name.trim(),
        location: values.location.trim(),
        total_units: Number(values.totalUnits),
        house_count: Number(values.houseCount) || 0,
        manager: values.manager ? Number(values.manager) : null,
      }

      const { data } = await api.post('/properties/estates/', payload)
      setCreated(data)
      if (onSuccess) onSuccess(data)
    } catch (err) {
      const payload = err?.response?.data
      if (payload?.fields) {
        const mapped = {}
        for (const [k, v] of Object.entries(payload.fields)) {
          mapped[k] = Array.isArray(v) ? v[0] : String(v)
        }
        setErrors(mapped)
        if (payload.detail) setFormError(String(payload.detail))
      } else if (payload?.detail) {
        setFormError(String(payload.detail))
      } else {
        setFormError('Could not create estate. Please try again.')
      }
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center sm:p-6">
      <div
        className="absolute inset-0 animate-fade-in bg-ink/45"
        onClick={onClose}
        aria-hidden="true"
      />

      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="add-estate-title"
        className={cn(
          'relative w-full max-h-[92dvh] overflow-y-auto overscroll-contain outline-none',
          'rounded-t-2xl bg-surface shadow-xl animate-sheet-up',
          'sm:max-w-[540px] sm:rounded-2xl sm:animate-scale-in'
        )}
      >
        {created ? (
          <SuccessState
            estate={created}
            onAddAnother={() => {
              setValues(EMPTY)
              setCreated(null)
            }}
            onDone={onClose}
          />
        ) : (
          <>
            <ModalHeader title="Add estate" subtitle="Register a property and generate its units" onClose={onClose} />

            <form onSubmit={handleSubmit} noValidate className="px-6 pb-6 pt-5">
              {formError && <FormError message={formError} />}

              <SectionLabel>Property details</SectionLabel>

              <TextField
                id="estate-name"
                label="Estate name"
                value={values.name}
                onChange={(v) => set('name', v)}
                placeholder="e.g. Manyatta Phase 2"
                error={errors.name}
                autoFocus
              />

              <TextField
                id="estate-location"
                label="Location"
                value={values.location}
                onChange={(v) => set('location', v)}
                placeholder="e.g. Kasarani, Nairobi"
                error={errors.location}
              />

              <SectionLabel className="mt-6">Unit allocation</SectionLabel>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <TextField
                  id="estate-units"
                  label="Total units"
                  type="number"
                  value={values.totalUnits}
                  onChange={(v) => set('totalUnits', v)}
                  placeholder="50"
                  error={errors.totalUnits}
                  inputMode="numeric"
                />
                <TextField
                  id="estate-house-count"
                  label="Generate units"
                  type="number"
                  value={values.houseCount}
                  onChange={(v) => set('houseCount', v)}
                  placeholder="Optional"
                  error={errors.houseCount}
                  inputMode="numeric"
                  required={false}
                />
              </div>

              {totalUnits > 0 && (
                <div
                  className={cn(
                    'mt-3 flex items-start gap-2.5 rounded-xl px-3.5 py-2.5 text-[12.5px]',
                    overAllocated ? 'bg-danger/5 text-danger' : 'bg-accent-soft text-accent-deep'
                  )}
                >
                  <svg viewBox="0 0 20 20" className="mt-px size-4 shrink-0" fill="none" aria-hidden="true">
                    <path
                      d="M10 2.5l7.5 13h-15L10 2.5z"
                      stroke="currentColor"
                      strokeWidth="1.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                    <path d="M10 8v3M10 13.2h.01" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                  </svg>
                  <span className="font-medium">
                    {overAllocated
                      ? `You can only generate up to ${totalUnits} units.`
                      : houseCount > 0
                        ? `${houseCount} of ${totalUnits} units will be auto-named "Unit 1"–"Unit ${houseCount}". ${remaining} left vacant.`
                        : 'No units will be generated now. You can add them later.'}
                  </span>
                </div>
              )}

              <SectionLabel className="mt-6">Assignment</SectionLabel>

              <div className="space-y-1.5">
                <label htmlFor="estate-manager" className="flex items-center gap-1 text-[13px] font-medium text-ink">
                  Estate manager
                </label>
                <select
                  id="estate-manager"
                  value={values.manager}
                  onChange={(e) => set('manager', e.target.value)}
                  disabled={managersLoading}
                  className={cn(
                    'h-11 w-full appearance-none rounded-xl border bg-surface px-3.5 pr-10 text-[15px] text-ink',
                    'transition-shadow duration-150 focus:border-accent focus:outline-none focus:shadow-focus',
                    'disabled:cursor-not-allowed disabled:bg-canvas disabled:text-faint',
                    errors.manager ? 'border-danger' : 'border-edge'
                  )}
                >
                  <option value="">{managersLoading ? 'Loading…' : 'Unassigned'}</option>
                  {managers.map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.username}
                    </option>
                  ))}
                </select>
                <p className="text-[12.5px] leading-snug text-muted">
                  Optional — assign later from settings.
                </p>
              </div>

              <footer className="mt-8 flex gap-2.5">
                <button
                  type="button"
                  onClick={onClose}
                  disabled={submitting}
                  className="inline-flex h-11 flex-1 items-center justify-center rounded-xl border border-edge bg-surface text-[15px] font-semibold text-ink shadow-card transition-all duration-150 ease-out-soft hover:border-edge-hover hover:shadow-card-hover disabled:opacity-50 disabled:pointer-events-none"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting || !isValid}
                  className="inline-flex h-11 flex-1 items-center justify-center gap-2 rounded-xl bg-ink text-[15px] font-semibold text-white shadow-card transition-all duration-150 ease-out-soft hover:border-edge-hover hover:shadow-card-hover disabled:opacity-40 disabled:pointer-events-none"
                >
                  {submitting && (
                    <svg className="size-4 animate-spin" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                      <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" opacity="0.2" />
                      <path d="M22 12a10 10 0 0 1-10 10" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
                    </svg>
                  )}
                  {submitting ? 'Creating…' : 'Create estate'}
                </button>
              </footer>
            </form>
          </>
        )}
      </div>
    </div>
  )
}

function ModalHeader({ title, subtitle, onClose }) {
  return (
    <header className="sticky top-0 z-10 flex items-start justify-between gap-4 border-b border-edge bg-surface/95 px-6 pb-4 pt-5 backdrop-blur-xl">
      <div>
        <h2 id="add-estate-title" className="text-[19px] font-semibold tracking-[-0.01em] text-ink">
          {title}
        </h2>
        {subtitle && <p className="mt-0.5 text-[13px] text-muted">{subtitle}</p>}
      </div>
      <button
        type="button"
        onClick={onClose}
        aria-label="Close dialog"
        className="-mr-1.5 -mt-1 grid size-9 shrink-0 place-items-center rounded-full text-muted transition-colors hover:bg-canvas hover:text-ink focus-visible:outline-none focus-visible:shadow-focus"
      >
        <svg viewBox="0 0 24 24" className="size-5" aria-hidden="true">
          <path
            d="M6 6l12 12M18 6L6 18"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.9"
            strokeLinecap="round"
          />
        </svg>
      </button>
    </header>
  )
}

function SuccessState({ estate, onAddAnother, onDone }) {
  return (
    <div className="px-6 pb-8 pt-10 text-center">
      <div className="mx-auto flex size-14 items-center justify-center rounded-full bg-success/10">
        <svg viewBox="0 0 24 24" className="size-7 text-success" aria-hidden="true">
          <path
            d="M20 6L9 17l-5-5"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </div>
      <h2 id="add-estate-title" className="mt-4 text-[19px] font-semibold text-ink">
        Estate created
      </h2>
      <p className="mx-auto mt-1.5 max-w-[320px] text-[14px] leading-relaxed text-muted">
        <span className="font-medium text-ink">{estate.name}</span> in {estate.location} is live
        {estate.house_count > 0 &&
          ` with ${estate.house_count} ${estate.house_count === 1 ? 'unit' : 'units'} generated`}
        .
      </p>
      <div className="mt-7 flex gap-2.5">
        <button
          type="button"
          onClick={onAddAnother}
          className="inline-flex h-11 flex-1 items-center justify-center rounded-xl border border-edge bg-surface text-[15px] font-semibold text-ink shadow-card transition-all duration-150 ease-out-soft hover:border-edge-hover hover:shadow-card-hover"
        >
          Add another
        </button>
        <button
          type="button"
          onClick={onDone}
          className="inline-flex h-11 flex-1 items-center justify-center rounded-xl bg-ink text-[15px] font-semibold text-white shadow-card transition-all duration-150 ease-out-soft hover:border-edge-hover hover:shadow-card-hover"
        >
          Done
        </button>
      </div>
    </div>
  )
}

function SectionLabel({ children, className }) {
  return (
    <h3 className={cn('mb-3 text-[11px] font-semibold uppercase tracking-[0.08em] text-faint', className)}>
      {children}
    </h3>
  )
}

function FormError({ message }) {
  return (
    <div role="alert" className="mb-5 flex gap-2.5 rounded-xl border border-danger/25 bg-danger/5 p-3.5">
      <svg viewBox="0 0 20 20" className="mt-px size-[18px] shrink-0 text-danger" aria-hidden="true">
        <path
          d="M10 6.5v4.5M10 14h.01M10 2.5l7.5 13h-15L10 2.5z"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.6"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
      <p className="text-[13.5px] leading-snug text-ink">{message}</p>
    </div>
  )
}

function TextField({
  id,
  label,
  value,
  onChange,
  placeholder,
  error,
  autoFocus,
  type = 'text',
  inputMode,
  required = true,
}) {
  return (
    <div className="mb-4 space-y-1.5">
      <label htmlFor={id} className="flex items-center gap-1 text-[13px] font-medium text-ink">
        {label}
        {required && <span className="text-danger" aria-hidden="true">*</span>}
      </label>
      <input
        id={id}
        type={type}
        inputMode={inputMode}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        autoFocus={autoFocus}
        autoComplete="off"
        className={cn(
          'h-11 w-full rounded-xl border bg-surface px-3.5 text-[15px] text-ink placeholder:text-faint',
          'transition-shadow duration-150 focus:border-accent focus:outline-none focus:shadow-focus',
          error ? 'border-danger' : 'border-edge'
        )}
      />
      {error && <p role="alert" className="text-[12.5px] font-medium text-danger">{error}</p>}
    </div>
  )
}