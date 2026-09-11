import { useEffect, useState } from 'react'
import api from '@/api/client'
import { cn } from '@/lib/cn'

export default function AddHouseModal({ isOpen, onClose, estateId, onSuccess }) {
  const [estates, setEstates] = useState([])
  const [values, setValues] = useState({ estate: estateId ? String(estateId) : '', house_number: '' })
  const [errors, setErrors] = useState({})
  const [formError, setFormError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    if (!isOpen) return

    setValues({ estate: estateId ? String(estateId) : '', house_number: '' })
    setErrors({})
    setFormError('')
    setSubmitting(false)

    if (!estateId) {
      api
        .get('/properties/estates/')
        .then((r) => setEstates(Array.isArray(r.data) ? r.data : r.data.results ?? []))
        .catch(() => setEstates([]))
    }
  }, [isOpen, estateId])

  if (!isOpen) return null

  const set = (key, v) => {
    setValues((p) => ({ ...p, [key]: v }))
    if (errors[key]) setErrors((p) => ({ ...p, [key]: undefined }))
    if (formError) setFormError('')
  }

  function validate(v) {
    const e = {}
    if (!v.estate) e.estate = 'Select an estate.'
    if (!v.house_number.trim()) e.house_number = 'House number is required.'
    else if (v.house_number.trim().length < 1) e.house_number = 'Enter a valid number.'
    return e
  }

  async function handleSubmit(ev) {
    ev.preventDefault()
    const found = validate(values)
    setErrors(found)
    if (Object.keys(found).length) return

    setSubmitting(true)
    setFormError('')

    try {
      await api.post('/properties/houses/', {
        estate: Number(values.estate),
        house_number: values.house_number.trim(),
        main_tenant: null,
      })
      if (onSuccess) onSuccess()
    } catch (err) {
      const payload = err?.response?.data
      if (payload && typeof payload === 'object') {
        const fields = {}
        for (const [k, v] of Object.entries(payload)) {
          fields[k] = Array.isArray(v) ? v[0] : String(v)
        }
        setErrors(fields)
        if (payload.detail) setFormError(String(payload.detail))
      } else {
        setFormError('Could not create house. Please try again.')
      }
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Modal title="Add house" subtitle="Register a new house in an estate" onClose={onClose}>
      <form onSubmit={handleSubmit} noValidate className="px-6 pb-6 pt-5">
        <FormError message={formError} />

        {!estateId && (
          <SelectField
            id="house-estate"
            label="Estate"
            value={values.estate}
            onChange={(v) => set('estate', v)}
            error={errors.estate}
            options={[
              { value: '', label: 'Select an estate' },
              ...estates.map((e) => ({ value: e.id, label: `${e.name} — ${e.location}` })),
            ]}
          />
        )}

        <TextField
          id="house-number"
          label="House number"
          value={values.house_number}
          onChange={(v) => set('house_number', v)}
          placeholder="e.g. Unit 12, Block A"
          error={errors.house_number}
          autoFocus
        />

        <Footer onClose={onClose} submitting={submitting} submitLabel="Create house" />
      </form>
    </Modal>
  )
}

export function Modal({ title, subtitle, onClose, children, id = 'modal-title' }) {
  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center sm:p-6">
      <div className="absolute inset-0 animate-fade-in bg-ink/45" onClick={onClose} aria-hidden="true" />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby={id}
        className={cn(
          'relative w-full max-h-[92dvh] overflow-y-auto overscroll-contain outline-none',
          'rounded-t-2xl bg-surface shadow-xl animate-sheet-up',
          'sm:max-w-[480px] sm:rounded-2xl sm:animate-scale-in'
        )}
      >
        <header className="sticky top-0 z-10 flex items-start justify-between gap-4 border-b border-edge bg-surface/95 px-6 pb-4 pt-5 backdrop-blur-xl">
          <div>
            <h2 id={id} className="text-[19px] font-semibold tracking-[-0.01em] text-ink">
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
              <path d="M6 6l12 12M18 6L6 18" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" />
            </svg>
          </button>
        </header>
        {children}
      </div>
    </div>
  )
}

export function TextField({ id, label, value, onChange, placeholder, error, autoFocus, type = 'text' }) {
  return (
    <div className="mb-4 space-y-1.5">
      <label htmlFor={id} className="flex items-center gap-1 text-[13px] font-medium text-ink">
        {label}
        <span className="text-danger" aria-hidden="true">*</span>
      </label>
      <input
        id={id}
        type={type}
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
      {error && (
        <p role="alert" className="text-[12.5px] font-medium text-danger">{error}</p>
      )}
    </div>
  )
}

export function SelectField({ id, label, value, onChange, error, options }) {
  return (
    <div className="mb-4 space-y-1.5">
      <label htmlFor={id} className="flex items-center gap-1 text-[13px] font-medium text-ink">
        {label}
        <span className="text-danger" aria-hidden="true">*</span>
      </label>
      <select
        id={id}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className={cn(
          'h-11 w-full appearance-none rounded-xl border bg-surface px-3.5 pr-10 text-[15px] text-ink',
          'transition-shadow duration-150 focus:border-accent focus:outline-none focus:shadow-focus',
          error ? 'border-danger' : 'border-edge'
        )}
      >
        {options.map((o) => (
          <option key={o.value} value={o.value}>{o.label}</option>
        ))}
      </select>
      {error && (
        <p role="alert" className="text-[12.5px] font-medium text-danger">{error}</p>
      )}
    </div>
  )
}

export function FormError({ message }) {
  if (!message) return null
  return (
    <div role="alert" className="mb-5 flex gap-2.5 rounded-xl border border-danger/25 bg-danger/5 p-3.5">
      <svg viewBox="0 0 20 20" className="mt-px size-[18px] shrink-0 text-danger" aria-hidden="true">
        <path d="M10 6.5v4.5M10 14h.01M10 2.5l7.5 13h-15L10 2.5z" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
      <p className="text-[13.5px] leading-snug text-ink">{message}</p>
    </div>
  )
}

export function Footer({ onClose, submitting, submitLabel }) {
  return (
    <footer className="mt-8 flex gap-2.5">
      <button
        type="button"
        onClick={onClose}
        disabled={submitting}
        className="inline-flex h-11 flex-1 items-center justify-center rounded-lg border border-edge bg-surface shadow-card text-[15px] font-semibold text-ink shadow-float transition-all duration-150 ease-out-soft hover:border-edge-hover hover:shadow-card-hover disabled:opacity-50 disabled:pointer-events-none"
      >
        Cancel
      </button>
      <button
        type="submit"
        disabled={submitting}
        className="inline-flex h-11 flex-1 items-center justify-center gap-2 rounded-xl bg-ink text-[15px] font-semibold text-white shadow-float transition-all duration-150 ease-out-soft hover:border-edge-hover hover:shadow-card-hover disabled:opacity-50 disabled:pointer-events-none"
      >
        {submitting ? 'Saving…' : submitLabel}
      </button>
    </footer>
  )
}