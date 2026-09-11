import { useEffect, useState } from 'react'
import api from '@/api/client'
import { cn } from '@/lib/cn'
import { Footer, FormError, Modal } from './AddHouseModal'

const INITIAL = {
  username: '',
  email: '',
  first_name: '',
  last_name: '',
  phone_number: '',
  role: 'TENANT',
  password: '',
  password_confirm: '',
}

export default function AddTenantModal({ isOpen, onClose, onSuccess }) {
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
    if (!v.username.trim()) e.username = 'Username is required.'
    else if (v.username.trim().length < 3) e.username = 'Use at least 3 characters.'
    if (!v.phone_number.trim()) e.phone_number = 'Phone number is required.'
    if (!v.password) e.password = 'Password is required.'
    else if (v.password.length < 8) e.password = 'Use at least 8 characters.'
    if (v.password !== v.password_confirm) e.password_confirm = 'Passwords do not match.'
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
      const { data } = await api.post('/auth/register/', {
        username: values.username.trim(),
        email: values.email.trim(),
        first_name: values.first_name.trim(),
        last_name: values.last_name.trim(),
        phone_number: values.phone_number.trim(),
        role: values.role,
        password: values.password,
        password_confirm: values.password_confirm,
      })
      setCreated(data?.user || data)
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
        setFormError('Could not create tenant. Please try again.')
      }
    } finally {
      setSubmitting(false)
    }
  }

  if (created) {
    return (
      <Modal title="Tenant created" onClose={onClose} id="tenant-created-title">
        <div className="px-6 pb-8 pt-6 text-center">
          <div className="mx-auto flex size-14 items-center justify-center rounded-full bg-success/10">
            <svg viewBox="0 0 24 24" className="size-7 text-success" aria-hidden="true">
              <path d="M20 6L9 17l-5-5" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>
          <p className="mt-4 text-[15px] text-muted">
            <span className="font-semibold text-ink">{created.username}</span> has been added.
          </p>
          <div className="mt-7 flex gap-2.5">
            <button
              type="button"
              onClick={() => { setValues(INITIAL); setCreated(null) }}
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
      </Modal>
    )
  }

  return (
    <Modal title="Add tenant" subtitle="Create a new tenant account" onClose={onClose}>
      <form onSubmit={handleSubmit} noValidate className="px-6 pb-6 pt-5">
        <FormError message={formError} />

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Field id="tenant-first" label="First name" value={values.first_name} onChange={(v) => set('first_name', v)} error={errors.first_name} required={false} />
          <Field id="tenant-last" label="Last name" value={values.last_name} onChange={(v) => set('last_name', v)} error={errors.last_name} required={false} />
        </div>

        <Field id="tenant-username" label="Username" value={values.username} onChange={(v) => set('username', v)} error={errors.username} autoFocus />

        <Field id="tenant-phone" label="Phone number" value={values.phone_number} onChange={(v) => set('phone_number', v)} placeholder="0712 345 678" error={errors.phone_number} />

        <Field id="tenant-email" label="Email" type="email" value={values.email} onChange={(v) => set('email', v)} error={errors.email} required={false} />

        <div className="mb-4 space-y-1.5">
          <label className="text-[13px] font-medium text-ink">Role</label>
          <div className="grid grid-cols-2 gap-2">
            {[
              { value: 'TENANT', label: 'Tenant' },
              { value: 'SUB_TENANT', label: 'Sub-tenant' },
            ].map((r) => (
              <button
                key={r.value}
                type="button"
                onClick={() => set('role', r.value)}
                className={cn(
                  'h-11 rounded-xl border text-[14px] font-medium transition-all duration-150 ease-out-soft',
                  values.role === r.value
                    ? 'border-accent bg-accent-soft text-accent-deep ring-2 ring-accent/20'
                    : 'border-edge bg-surface text-ink hover:bg-canvas'
                )}
              >
                {r.label}
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Field id="tenant-pass" label="Password" type="password" value={values.password} onChange={(v) => set('password', v)} error={errors.password} />
          <Field id="tenant-pass2" label="Confirm password" type="password" value={values.password_confirm} onChange={(v) => set('password_confirm', v)} error={errors.password_confirm} />
        </div>

        <Footer onClose={onClose} submitting={submitting} submitLabel="Create tenant" />
      </form>
    </Modal>
  )
}

function Field({ id, label, value, onChange, error, placeholder, type = 'text', autoFocus, required = true }) {
  return (
    <div className="mb-4 space-y-1.5">
      <label htmlFor={id} className="flex items-center gap-1 text-[13px] font-medium text-ink">
        {label}
        {required && <span className="text-danger" aria-hidden="true">*</span>}
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
      {error && <p role="alert" className="text-[12.5px] font-medium text-danger">{error}</p>}
    </div>
  )
}