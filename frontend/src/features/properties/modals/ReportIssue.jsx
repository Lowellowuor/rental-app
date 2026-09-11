import { useEffect, useState } from 'react'
import api from '@/api/client'
import { cn } from '@/lib/cn'
import { Footer, FormError, Modal } from './AddHouseModal'

const CATEGORIES = [
  { value: 'plumbing', label: 'Plumbing' },
  { value: 'electrical', label: 'Electrical' },
  { value: 'structural', label: 'Structural' },
  { value: 'appliance', label: 'Appliance' },
  { value: 'pest', label: 'Pest Control' },
  { value: 'security', label: 'Security' },
  { value: 'cleaning', label: 'Cleaning' },
  { value: 'other', label: 'Other' },
]

const PRIORITIES = [
  { value: 'low', label: 'Low' },
  { value: 'medium', label: 'Medium' },
  { value: 'high', label: 'High' },
  { value: 'urgent', label: 'Urgent' },
]

const INITIAL = {
  title: '',
  description: '',
  category: 'other',
  priority: 'medium',
}

export default function ReportIssue({ isOpen, onClose, onSuccess }) {
  const [values, setValues] = useState(INITIAL)
  const [errors, setErrors] = useState({})
  const [formError, setFormError] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [created, setCreated] = useState(null)

  useEffect(() => {
    if (isOpen) {
      setValues(INITIAL)
      setErrors({})
      setFormError('')
      setSubmitting(false)
      setCreated(null)
    }
  }, [isOpen])

  if (!isOpen) return null

  const set = (key, v) => {
    setValues((p) => ({ ...p, [key]: v }))
    if (errors[key]) setErrors((p) => ({ ...p, [key]: undefined }))
    if (formError) setFormError('')
  }

  function validate(v) {
    const e = {}
    if (!v.title.trim()) e.title = 'Title is required.'
    else if (v.title.trim().length < 4) e.title = 'Use at least 4 characters.'
    if (!v.description.trim()) e.description = 'Describe the issue.'
    else if (v.description.trim().length < 10) e.description = 'Use at least 10 characters.'
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
      const { data } = await api.post('/maintenance/tickets/', {
        title: values.title.trim(),
        description: values.description.trim(),
        category: values.category,
        priority: values.priority,
      })
      setCreated(data)
      if (onSuccess) onSuccess()
    } catch (err) {
      const payload = err?.response?.data
      if (payload && typeof payload === 'object') {
        const fields = payload.fields || payload
        const mapped = {}
        for (const [k, v] of Object.entries(fields)) {
          if (k === 'detail') continue
          mapped[k] = Array.isArray(v) ? v[0] : String(v)
        }
        setErrors(mapped)
        if (payload.detail) setFormError(String(payload.detail))
      } else {
        setFormError('Could not submit ticket. Please try again.')
      }
    } finally {
      setSubmitting(false)
    }
  }

  if (created) {
    return (
      <Modal title="Ticket submitted" onClose={onClose}>
        <div className="px-6 pb-8 pt-6 text-center">
          <div className="mx-auto flex size-14 items-center justify-center rounded-full bg-success/10">
            <svg viewBox="0 0 24 24" className="size-7 text-success" aria-hidden="true">
              <path d="M20 6L9 17l-5-5" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>
          <p className="mt-4 text-[15px] text-muted">
            <span className="font-semibold text-ink">Ticket #{created.id}</span> has been logged.
          </p>
          <p className="mx-auto mt-1 max-w-[320px] text-[13px] text-faint">
            Your estate manager has been notified.
          </p>
          <button
            type="button"
            onClick={onClose}
            className="mt-7 inline-flex h-11 w-full items-center justify-center rounded-xl bg-ink text-[15px] font-semibold text-white shadow-float transition-all duration-150 ease-out-soft hover:border-edge-hover hover:shadow-card-hover"
          >
            Done
          </button>
        </div>
      </Modal>
    )
  }

  return (
    <Modal title="Report issue" subtitle="Log a maintenance request" onClose={onClose}>
      <form onSubmit={handleSubmit} noValidate className="px-6 pb-6 pt-5">
        <FormError message={formError} />

        <div className="mb-4 space-y-1.5">
          <label htmlFor="ticket-title" className="flex items-center gap-1 text-[13px] font-medium text-ink">
            Title
            <span className="text-danger" aria-hidden="true">*</span>
          </label>
          <input
            id="ticket-title"
            type="text"
            value={values.title}
            onChange={(e) => set('title', e.target.value)}
            placeholder="e.g. Leaking kitchen tap"
            autoFocus
            className={cn(
              'h-11 w-full rounded-xl border bg-surface px-3.5 text-[15px] text-ink placeholder:text-faint',
              'transition-shadow duration-150 focus:border-accent focus:outline-none focus:shadow-focus',
              errors.title ? 'border-danger' : 'border-edge'
            )}
          />
          {errors.title && <p role="alert" className="text-[12.5px] font-medium text-danger">{errors.title}</p>}
        </div>

        <div className="mb-4 space-y-1.5">
          <label htmlFor="ticket-desc" className="flex items-center gap-1 text-[13px] font-medium text-ink">
            Description
            <span className="text-danger" aria-hidden="true">*</span>
          </label>
          <textarea
            id="ticket-desc"
            rows={4}
            value={values.description}
            onChange={(e) => set('description', e.target.value)}
            placeholder="Explain what's wrong and when it started…"
            className={cn(
              'w-full resize-none rounded-xl border bg-surface px-3.5 py-2.5 text-[15px] text-ink placeholder:text-faint',
              'transition-shadow duration-150 focus:border-accent focus:outline-none focus:shadow-focus',
              errors.description ? 'border-danger' : 'border-edge'
            )}
          />
          {errors.description && <p role="alert" className="text-[12.5px] font-medium text-danger">{errors.description}</p>}
        </div>

        <div className="mb-4 space-y-1.5">
          <label className="text-[13px] font-medium text-ink">Category</label>
          <div className="flex flex-wrap gap-2">
            {CATEGORIES.map((c) => (
              <button
                key={c.value}
                type="button"
                onClick={() => set('category', c.value)}
                className={cn(
                  'h-9 rounded-pill border px-3.5 text-[13px] font-medium transition-all duration-150 ease-out-soft',
                  values.category === c.value
                    ? 'border-accent bg-accent-soft text-accent-deep'
                    : 'border-edge bg-surface text-muted hover:text-ink'
                )}
              >
                {c.label}
              </button>
            ))}
          </div>
        </div>

        <div className="mb-4 space-y-1.5">
          <label className="text-[13px] font-medium text-ink">Priority</label>
          <div className="grid grid-cols-4 gap-2">
            {PRIORITIES.map((p) => (
              <button
                key={p.value}
                type="button"
                onClick={() => set('priority', p.value)}
                className={cn(
                  'h-10 rounded-xl border text-[13px] font-medium transition-all duration-150 ease-out-soft',
                  values.priority === p.value
                    ? p.value === 'urgent' || p.value === 'high'
                      ? 'border-danger bg-danger/10 text-danger'
                      : 'border-accent bg-accent-soft text-accent-deep'
                    : 'border-edge bg-surface text-muted hover:text-ink'
                )}
              >
                {p.label}
              </button>
            ))}
          </div>
        </div>

        <Footer onClose={onClose} submitting={submitting} submitLabel="Submit ticket" />
      </form>
    </Modal>
  )
}