import { useEffect, useState } from 'react'
import api from '@/api/client'
import { cn } from '@/lib/cn'

export default function AddRoomModal({ isOpen, onClose, houseId, houses = [], onSuccess }) {
  const [values, setValues] = useState({ house: houseId ? String(houseId) : '', room_name: '' })
  const [errors, setErrors] = useState({})
  const [formError, setFormError] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [created, setCreated] = useState(null)

  useEffect(() => {
    if (isOpen) {
      setValues({ house: houseId ? String(houseId) : '', room_name: '' })
      setErrors({})
      setFormError('')
      setCreated(null)
      setSubmitting(false)
    }
  }, [isOpen, houseId])

  if (!isOpen) return null

  const set = (key, v) => {
    setValues((p) => ({ ...p, [key]: v }))
    if (errors[key]) setErrors((p) => ({ ...p, [key]: undefined }))
    if (formError) setFormError('')
  }

  function validate(v) {
    const e = {}
    if (!v.house) e.house = 'Select a house.'
    if (!v.room_name.trim()) e.room_name = 'Room name is required.'
    else if (v.room_name.trim().length < 2) e.room_name = 'Use at least 2 characters.'
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
      const { data } = await api.post('/properties/rooms/', {
        house: Number(values.house),
        room_name: values.room_name.trim(),
        is_occupied: false,
      })
      setCreated(data)
      if (onSuccess) onSuccess(data)
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
        setFormError('Could not create room. Please try again.')
      }
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center sm:p-6">
      <div className="absolute inset-0 animate-fade-in bg-ink/45" onClick={onClose} aria-hidden="true" />

      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="add-room-title"
        className={cn(
          'relative w-full max-h-[92dvh] overflow-y-auto overscroll-contain outline-none',
          'rounded-t-2xl bg-surface shadow-xl animate-sheet-up',
          'sm:max-w-[480px] sm:rounded-2xl sm:animate-scale-in'
        )}
      >
        {created ? (
          <div className="px-6 pb-8 pt-10 text-center">
            <div className="mx-auto flex size-14 items-center justify-center rounded-full bg-success/10">
              <svg viewBox="0 0 24 24" className="size-7 text-success" aria-hidden="true">
                <path d="M20 6L9 17l-5-5" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </div>
            <h2 id="add-room-title" className="mt-4 text-[19px] font-semibold text-ink">
              Room created
            </h2>
            <p className="mx-auto mt-1.5 max-w-[320px] text-[14px] leading-relaxed text-muted">
              <span className="font-medium text-ink">{created.room_name}</span> has been added.
            </p>
            <div className="mt-7 flex gap-2.5">
              <button
                type="button"
                onClick={() => {
                  setValues({ house: values.house, room_name: '' })
                  setCreated(null)
                }}
                className="inline-flex h-11 flex-1 items-center justify-center rounded-lg border border-edge bg-surface shadow-card text-[15px] font-semibold text-ink shadow-float transition-all duration-150 ease-out-soft hover:border-edge-hover hover:shadow-card-hover"
              >
                Add another
              </button>
              <button
                type="button"
                onClick={onClose}
                className="inline-flex h-11 flex-1 items-center justify-center rounded-xl bg-ink text-[15px] font-semibold text-white shadow-float transition-all duration-150 ease-out-soft hover:border-edge-hover hover:shadow-card-hover"
              >
                Done
              </button>
            </div>
          </div>
        ) : (
          <>
            <header className="sticky top-0 z-10 flex items-start justify-between gap-4 border-b border-edge bg-surface/95 px-6 pb-4 pt-5 backdrop-blur-xl">
              <div>
                <h2 id="add-room-title" className="text-[19px] font-semibold tracking-[-0.01em] text-ink">
                  Add room
                </h2>
                <p className="mt-0.5 text-[13px] text-muted">Create a new room in a house.</p>
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

            <form onSubmit={handleSubmit} noValidate className="px-6 pb-6 pt-5">
              {formError && (
                <div role="alert" className="mb-5 flex gap-2.5 rounded-xl border border-danger/25 bg-danger/5 p-3.5">
                  <svg viewBox="0 0 20 20" className="mt-px size-[18px] shrink-0 text-danger" aria-hidden="true">
                    <path d="M10 6.5v4.5M10 14h.01M10 2.5l7.5 13h-15L10 2.5z" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                  <p className="text-[13.5px] leading-snug text-ink">{formError}</p>
                </div>
              )}

              {!houseId && (
                <div className="mb-4 space-y-1.5">
                  <label htmlFor="room-house" className="flex items-center gap-1 text-[13px] font-medium text-ink">
                    House
                    <span className="text-danger" aria-hidden="true">*</span>
                  </label>
                  <select
                    id="room-house"
                    value={values.house}
                    onChange={(e) => set('house', e.target.value)}
                    className={cn(
                      'h-11 w-full appearance-none rounded-xl border bg-surface px-3.5 pr-10 text-[15px] text-ink',
                      'transition-shadow duration-150 focus:border-accent focus:outline-none focus:shadow-focus',
                      errors.house ? 'border-danger' : 'border-edge'
                    )}
                  >
                    <option value="">Select a house</option>
                    {houses.map((h) => (
                      <option key={h.id} value={h.id}>
                        {h.house_number} {h.estate_name ? `— ${h.estate_name}` : ''}
                      </option>
                    ))}
                  </select>
                  {errors.house && (
                    <p role="alert" className="text-[12.5px] font-medium text-danger">
                      {errors.house}
                    </p>
                  )}
                </div>
              )}

              <div className="space-y-1.5">
                <label htmlFor="room-name" className="flex items-center gap-1 text-[13px] font-medium text-ink">
                  Room name
                  <span className="text-danger" aria-hidden="true">*</span>
                </label>
                <input
                  id="room-name"
                  type="text"
                  value={values.room_name}
                  onChange={(e) => set('room_name', e.target.value)}
                  placeholder="e.g. Room A, Master Bedroom"
                  autoComplete="off"
                  className={cn(
                    'h-11 w-full rounded-xl border bg-surface px-3.5 text-[15px] text-ink placeholder:text-faint',
                    'transition-shadow duration-150 focus:border-accent focus:outline-none focus:shadow-focus',
                    errors.room_name ? 'border-danger' : 'border-edge'
                  )}
                />
                {errors.room_name && (
                  <p role="alert" className="text-[12.5px] font-medium text-danger">
                    {errors.room_name}
                  </p>
                )}
              </div>

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
                  {submitting && (
                    <svg className="size-4 animate-spin" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                      <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" opacity="0.2" />
                      <path d="M22 12a10 10 0 0 1-10 10" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
                    </svg>
                  )}
                  {submitting ? 'Creating…' : 'Create room'}
                </button>
              </footer>
            </form>
          </>
        )}
      </div>
    </div>
  )
}
