import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '@/features/auth/context/AuthContext'
import { cn } from '@/lib/cn'

const ROLES = [
  { value: 'TENANT', label: 'Tenant', hint: 'I rent a house' },
  { value: 'SUB_TENANT', label: 'Sub-tenant', hint: 'I rent a room' },
  { value: 'LANDLORD', label: 'Landlord', hint: 'I own properties' },
  { value: 'ESTATE_MANAGER', label: 'Manager', hint: 'I manage estates' },
]

const INITIAL = {
  first_name: '',
  last_name: '',
  username: '',
  email: '',
  phone_number: '',
  role: 'TENANT',
  password: '',
  password_confirm: '',
}

export default function RegisterPage() {
  const { register } = useAuth()
  const navigate = useNavigate()
  const [values, setValues] = useState(INITIAL)
  const [errors, setErrors] = useState({})
  const [formError, setFormError] = useState('')
  const [submitting, setSubmitting] = useState(false)

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
      await register({
        username: values.username.trim(),
        email: values.email.trim(),
        first_name: values.first_name.trim(),
        last_name: values.last_name.trim(),
        phone_number: values.phone_number.trim(),
        role: values.role,
        password: values.password,
        password_confirm: values.password_confirm,
      })
      navigate('/', { replace: true })
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
        setFormError('Could not create account. Please try again.')
      }
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="grid min-h-dvh place-items-center bg-canvas px-5 py-10">
      <div className="w-full max-w-md">
        <header className="text-center">
          <div className="mx-auto grid size-14 place-items-center rounded-2xl bg-ink text-white shadow-float-lg">
            <svg viewBox="0 0 24 24" className="size-7" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M3 10l9-7 9 7v10a2 2 0 0 1-2 2h-4v-6h-6v6H5a2 2 0 0 1-2-2V10z" />
            </svg>
          </div>
          <h1 className="mt-5 text-[24px] font-semibold tracking-[-0.02em] text-ink">
            Create account
          </h1>
          <p className="mt-1 text-[13.5px] text-muted">
            Start managing rentals in minutes
          </p>
        </header>

        <form
          onSubmit={handleSubmit}
          noValidate
          className="mt-7 rounded-lg border border-edge bg-surface shadow-card p-6 shadow-float-lg"
        >
          {formError && (
            <div role="alert" className="mb-5 flex gap-2.5 rounded-xl border border-danger/25 bg-danger/5 p-3.5">
              <svg viewBox="0 0 20 20" className="mt-px size-[18px] shrink-0 text-danger" aria-hidden="true">
                <path d="M10 6.5v4.5M10 14h.01M10 2.5l7.5 13h-15L10 2.5z" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              <p className="text-[13.5px] leading-snug text-ink">{formError}</p>
            </div>
          )}

          <div className="mb-4 grid grid-cols-2 gap-3">
            <Field id="first_name" label="First name" value={values.first_name} onChange={(v) => set('first_name', v)} error={errors.first_name} required={false} />
            <Field id="last_name" label="Last name" value={values.last_name} onChange={(v) => set('last_name', v)} error={errors.last_name} required={false} />
          </div>

          <Field id="username" label="Username" value={values.username} onChange={(v) => set('username', v)} error={errors.username} autoFocus />

          <Field id="phone_number" label="Phone number" value={values.phone_number} onChange={(v) => set('phone_number', v)} placeholder="0712 345 678" error={errors.phone_number} />

          <Field id="email" label="Email" type="email" value={values.email} onChange={(v) => set('email', v)} error={errors.email} required={false} />

          <div className="mb-4 space-y-1.5">
            <label className="text-[13px] font-medium text-ink">I am a</label>
            <div className="grid grid-cols-2 gap-2">
              {ROLES.map((r) => (
                <button
                  key={r.value}
                  type="button"
                  onClick={() => set('role', r.value)}
                  className={cn(
                    'rounded-xl border p-3 text-left transition-all duration-150 ease-out-soft',
                    values.role === r.value
                      ? 'border-accent bg-accent-soft ring-2 ring-accent/20'
                      : 'border-edge bg-surface hover:bg-canvas'
                  )}
                >
                  <p className={cn('text-[13.5px] font-semibold', values.role === r.value ? 'text-accent-deep' : 'text-ink')}>
                    {r.label}
                  </p>
                  <p className="mt-0.5 text-[11.5px] text-muted">{r.hint}</p>
                </button>
              ))}
            </div>
          </div>

          <div className="mb-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
            <Field id="password" label="Password" type="password" value={values.password} onChange={(v) => set('password', v)} error={errors.password} />
            <Field id="password_confirm" label="Confirm" type="password" value={values.password_confirm} onChange={(v) => set('password_confirm', v)} error={errors.password_confirm} />
          </div>

          <button
            type="submit"
            disabled={submitting}
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
            {submitting ? 'Creating account…' : 'Create account'}
          </button>
        </form>

        <p className="mt-5 text-center text-[13.5px] text-muted">
          Already have an account?{' '}
          <Link to="/login" className="font-medium text-accent-deep hover:underline">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  )
}

function Field({ id, label, value, onChange, error, placeholder, type = 'text', autoFocus, required = true }) {
  return (
    <div className="space-y-1.5">
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